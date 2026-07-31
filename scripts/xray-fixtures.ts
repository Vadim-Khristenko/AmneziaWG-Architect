/**
 * Emit one full Xray server config per point of the generator's matrix, so a
 * real core can be asked whether it would accept them.
 *
 * The engine builds an inbound; a core needs a whole config, so each inbound
 * is wrapped with a log level and a freedom outbound and nothing else.
 *
 * Files are named `<version>_<transport>_<security>_…` because the check that
 * matters runs each version's configs against *that version's* core. Testing a
 * v26.7 config on a v26.3 core proves nothing: unknown keys are ignored, so it
 * passes either way. Three real bugs hid behind exactly that for a while —
 * VLESS Encryption offered on a core that has none, a required ML-DSA-65 seed
 * treated as optional, and an XHTTP mode that did not exist yet.
 *
 *   bun scripts/xray-fixtures.ts <output-dir>
 */
import fs from "node:fs";
import path from "node:path";

import { createDefaults, generateXray } from "../src/engines/xray/generate";
import {
  buildServerInbound,
  buildClientUris,
} from "../src/engines/xray/render";
import { XRAY_VERSIONS } from "../src/engines/xray/versions";
import type {
  XrayInput,
  XrayTransport,
  XraySecurity,
  XrayFlow,
} from "../src/engines/xray/types";

const OUT = process.argv[2];
if (!OUT) {
  console.error("usage: bun scripts/xray-fixtures.ts <output-dir>");
  process.exit(2);
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const TRANSPORTS: XrayTransport[] = [
  "raw",
  "xhttp",
  "grpc",
  "ws",
  "httpupgrade",
];
const SECURITIES: XraySecurity[] = ["reality", "tls", "none"];
const FLOWS: XrayFlow[] = ["", "xtls-rprx-vision"];

/**
 * FinalMask kinds, including none.
 *
 * Every one is offered to every version: the generator drops the block on a
 * core that predates it, and the check is that the core agrees.
 */
const MASKS = ["none", "noise", "fragment", "sudoku", "salamander", "mkcp-legacy"] as const;

const cases: { name: string; input: XrayInput }[] = [];

for (const version of XRAY_VERSIONS) {
  for (const transport of TRANSPORTS) {
    for (const security of SECURITIES) {
      for (const flow of FLOWS) {
        for (const useVlessEncryption of [false, true]) {
          for (const useMldsa65 of [false, true]) {
            // One mask per point of the matrix rather than a sixth nesting
            // level: 720 configs already take six image pulls to check, and
            // rotating covers every kind against every version anyway.
            const mask = MASKS[cases.length % MASKS.length]!;
            const defaults = createDefaults();
            const input: XrayInput = {
              ...defaults,
              version: version.id,
              // Documentation range, so nothing here resolves to a real host.
              address: "203.0.113.10",
              transport,
              security,
              flow,
              useVlessEncryption,
              useMldsa65,
              finalMask: { ...defaults.finalMask, kind: mask },
              clientCount: 2,
            };
            const name = [
              version.id,
              transport,
              security,
              flow ? "vision" : "noflow",
              useVlessEncryption ? "enc" : "noenc",
              useMldsa65 ? "mldsa" : "nomldsa",
            ].join("_");
            cases.push({ name, input });
          }
        }
      }
    }
  }
}

/** What was asked for beside what the generator decided to produce. */
const index: Record<string, unknown>[] = [];

for (const { name, input } of cases) {
  const cfg = generateXray(input);
  const config = {
    log: { loglevel: "warning" },
    inbounds: [buildServerInbound(cfg)],
    outbounds: [{ protocol: "freedom", tag: "direct" }],
  };
  fs.writeFileSync(
    path.join(OUT, `${name}.json`),
    JSON.stringify(config, null, 2),
  );
  index.push({
    name,
    requested: {
      transport: input.transport,
      security: input.security,
      flow: input.flow,
      encryption: input.useVlessEncryption,
      mldsa65: input.useMldsa65,
    },
    produced: {
      transport: cfg.transport,
      security: cfg.security,
      flow: cfg.clients[0]?.flow ?? "",
      encryption: cfg.vlessEncryption?.decryption ?? "none",
      mldsa65: Boolean(cfg.reality?.mldsa65?.seed),
      xhttpMode: cfg.xhttp?.resolvedMode ?? "",
      finalMask: cfg.finalMask?.kind ?? "none",
    },
    uris: buildClientUris(cfg),
  });
}

fs.writeFileSync(path.join(OUT, "_index.json"), JSON.stringify(index, null, 2));
console.log(`${cases.length} configs → ${OUT}`);
