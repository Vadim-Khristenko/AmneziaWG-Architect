import { describe, it, expect } from "vitest";

import { xrayEngine } from "../index";
import { buildServerInbound } from "../render";
import {
  XRAY_CATALOGUE,
  XRAY_GENERATED,
  XRAY_MISSING,
  XRAY_PARAMETERS,
  xrayCoverage,
  xrayHasParam,
  xrayParamsFor,
  xraySharedParams,
} from "../params";
import { XRAY_VERSIONS } from "../versions";
import { readParam } from "@/shared/params";

/**
 * The catalogue is deliberately larger than what the generator emits, and the
 * gap is the roadmap. These tests hold the two together: a parameter marked
 * `generated` has to actually appear in a config, and one marked missing has
 * to actually be missing — otherwise the coverage number is a story rather
 * than a measurement.
 */

const cfg = (version = "26.7.11") =>
  xrayEngine.generate({
    ...xrayEngine.createDefaults(),
    address: "203.0.113.10",
    transport: "xhttp",
    security: "reality",
    useMldsa65: true,
    useVlessEncryption: true,
    version: version as ReturnType<typeof xrayEngine.createDefaults>["version"],
    // Host defaults to empty, meaning "use the address". Set here so the
    // parameter is exercised rather than skipped as blank.
    xhttp: { ...xrayEngine.createDefaults().xhttp, host: "cdn.example.com" },
    // Likewise the mask: no mask is the default, and the block is only
    // written when one is chosen.
    finalMask: {
      ...xrayEngine.createDefaults().finalMask,
      kind: "noise" as const,
      quicCongestion: "bbr" as const,
    },
  });

/** A field written but left blank is a placeholder, not a generated value. */
const filled = (value: unknown): boolean =>
  value !== undefined && value !== null && value !== "";

describe("the catalogue itself", () => {
  it("has no duplicate key within one group", () => {
    const seen = new Set<string>();
    for (const param of XRAY_PARAMETERS) {
      const id = `${param.group}.${param.key}`;
      expect(seen.has(id), id).toBe(false);
      seen.add(id);
    }
  });

  it("orders versions oldest first, matching the version list", () => {
    // paramSetFor takes a prefix of this, so a reversed order would hand
    // v24.11.11 every parameter that exists.
    expect(XRAY_CATALOGUE.order[0]).toBe("24.11.11");
    expect(XRAY_CATALOGUE.order).toEqual(
      [...XRAY_VERSIONS].map((v) => v.id).reverse(),
    );
  });

  it("only names versions the product actually offers", () => {
    const known = new Set(XRAY_VERSIONS.map((v) => v.id));
    for (const param of XRAY_PARAMETERS) {
      expect(known.has(param.since), `${param.key} since ${param.since}`).toBe(
        true,
      );
    }
  });

  it("cites a source for everything both ends must agree on", () => {
    // A `shared` claim that is wrong costs a silent failure, so it has to be
    // checkable against the core rather than trusted.
    for (const param of XRAY_PARAMETERS.filter((p) => p.scope === "shared")) {
      const documented = param.source || param.note;
      expect(documented, `${param.group}.${param.key}`).toBeTruthy();
    }
  });

  it("gives every enum its allowed values", () => {
    for (const param of XRAY_PARAMETERS.filter((p) => p.kind === "enum")) {
      expect(param.bounds?.oneOf, param.key).toBeTruthy();
    }
  });
});

describe("per-version sets", () => {
  it("hides a parameter from versions older than it", () => {
    // VLESS Encryption arrived in v26.1.13; v25.8.29 has no such field.
    expect(xrayHasParam("26.1.13", "decryption")).toBe(true);
    expect(xrayHasParam("25.8.29", "decryption")).toBe(false);
    expect(xrayHasParam("24.11.11", "mldsa65Seed")).toBe(false);
    expect(xrayHasParam("25.7.23", "mldsa65Seed")).toBe(true);
  });

  it("grows monotonically with the version", () => {
    const sizes = [...XRAY_VERSIONS]
      .reverse()
      .map((v) => xrayParamsFor(v.id).length);
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i]!, XRAY_VERSIONS[i]!.id).toBeGreaterThanOrEqual(
        sizes[i - 1]!,
      );
    }
  });

  it("names the parameters a mismatch would break silently", () => {
    const shared = xraySharedParams("26.7.11").map((p) => p.key);
    // These are the ones where the two ends disagreeing produces no error at
    // all, just a connection that does not work.
    for (const key of ["privateKey", "shortIds", "serverNames", "flow"]) {
      expect(shared, key).toContain(key);
    }
  });
});

describe("coverage is measured, not claimed", () => {
  it("emits every parameter it says it emits", () => {
    // Across versions, not on one: minClientVer is written only where the
    // core has no default of its own, and mldsa65Seed only where the core
    // knows about it. A parameter counts as generated if some supported
    // version produces it.
    const configs = ["26.7.11", "25.7.23"].map((version) => cfg(version));

    for (const param of XRAY_GENERATED) {
      const present = configs.some(
        (config) => filled(readParam(config, param.field)),
      );
      expect(present, `${param.group}.${param.key} → ${param.field}`).toBe(
        true,
      );
    }

    // And the config really did come out with something in it.
    expect(Object.keys(buildServerInbound(configs[0]!)).length).toBeGreaterThan(
      0,
    );
  });

  it("does not quietly emit something it lists as missing", () => {
    for (const version of ["26.7.11", "25.7.23"]) {
      const config = cfg(version);
      for (const param of XRAY_MISSING) {
        // A field present but blank is a placeholder, not support:
        // mldsa65Verify is written empty on purpose because deriving the
        // 1952 bytes needs an algorithm this page does not carry.
        expect(
          filled(readParam(config, param.field)),
          `${param.group}.${param.key} has a value on ${version}`,
        ).toBe(false);
      }
    }
  });

  it("reports coverage per block", () => {
    const coverage = xrayCoverage();
    for (const [group, { done, total }] of Object.entries(coverage)) {
      expect(total, group).toBeGreaterThan(0);
      expect(done, group).toBeLessThanOrEqual(total);
    }
    // The whole point of the flag: the gap is real and known.
    expect(XRAY_MISSING.length).toBeGreaterThan(0);
    expect(XRAY_GENERATED.length + XRAY_MISSING.length).toBe(
      XRAY_PARAMETERS.length,
    );
  });
});
