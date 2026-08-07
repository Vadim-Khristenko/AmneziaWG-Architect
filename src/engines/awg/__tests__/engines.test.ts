import { describe, it, expect } from "vitest";

import { awgEngine } from "../index";
import {
  AWG_CLIENT_PROFILES,
  clientCaps,
  clientReleases,
  genCfg,
  type GeneratorInput,
} from "@/engines/awg/generator";
import {
  engineTagSupport,
  ENGINE_GO,
  ENGINE_KMOD,
  ENGINE_UNVERIFIED,
  type CpsTag,
} from "@/engines/awg/generator/engines";

/**
 * The tag vocabulary belongs to the engine, not to the app around it.
 *
 * Four entries in the client matrix named `amneziawg-go/v3 v3.0.1` and held
 * three different answers about `<c>` between them: Android, iOS and Amnezia
 * VPN offered it, Windows did not, and none of them can have it because the
 * tag is not in go at all. The reverse ran too, with `<rc>` and `<rd>` denied
 * to clients whose engine has had both since the tags existed.
 *
 * These tests pin the vocabularies to what the two parsers actually accept,
 * and then pin every client to its engine, so the two cannot drift apart
 * again by hand.
 */

const seeded = (over: Partial<GeneratorInput> = {}): GeneratorInput => ({
  ...awgEngine.createDefaults(),
  ...over,
});

/** Every tag key appearing in a chain, e.g. `<rc 24><b 0x00>` → rc, b. */
function tagsIn(chain: string): string[] {
  return [...chain.matchAll(/<\s*([a-z]+)(?:\s[^>]*)?>/g)].map((m) => m[1]!);
}

describe("the two engines, as their parsers define them", () => {
  it("gives amneziawg-go everything but the packet counter", () => {
    // device/obf.go, map `obfBuilders`.
    expect([...ENGINE_GO.tags].sort()).toEqual(
      ["b", "d", "ds", "dz", "r", "rc", "rd", "t"].sort(),
    );
    expect(ENGINE_GO.tags).not.toContain("c");
  });

  it("gives the kernel module the counter and none of the data tags", () => {
    // src/junk.c, `jp_parse_tags`, a strcmp chain ending in `return -EINVAL`.
    expect([...ENGINE_KMOD.tags].sort()).toEqual(
      ["b", "c", "r", "rc", "rd", "t"].sort(),
    );
    for (const absent of ["d", "ds", "dz"] as const) {
      expect(ENGINE_KMOD.tags, absent).not.toContain(absent);
    }
  });

  it("keeps the two disjoint in both directions", () => {
    // Not one engine being a subset of the other: each has what the other
    // lacks, which is why "supports tags" was never one flag.
    expect(ENGINE_KMOD.tags).toContain("c");
    expect(ENGINE_GO.tags).not.toContain("c");
    expect(ENGINE_GO.tags).toContain("ds");
    expect(ENGINE_KMOD.tags).not.toContain("ds");
  });

  it("claims nothing for an unestablished engine that both do not share", () => {
    for (const tag of ENGINE_UNVERIFIED.tags) {
      expect(ENGINE_GO.tags, tag).toContain(tag);
      expect(ENGINE_KMOD.tags, tag).toContain(tag);
    }
    expect(ENGINE_UNVERIFIED.verified).toBe(false);
  });
});

describe("clients against their engines", () => {
  it("never states a tag flag the engine contradicts", () => {
    for (const profile of AWG_CLIENT_PROFILES) {
      for (const release of clientReleases(profile.id)) {
        const limits = clientCaps(profile.id, release.id).limits;
        const where = `${profile.id} ${release.label}`;
        expect(
          {
            supportsCpsTagC: limits.supportsCpsTagC,
            supportsCpsTagRC: limits.supportsCpsTagRC,
            supportsCpsTagRD: limits.supportsCpsTagRD,
          },
          where,
        ).toEqual(engineTagSupport(limits.engine));
      }
    }
  });

  it("makes two clients on one engine agree about it", () => {
    // The regression itself: same `amneziawg-go/v3 v3.0.1`, opposite answers.
    const byEngine = new Map<string, string[]>();
    for (const profile of AWG_CLIENT_PROFILES) {
      const limits = clientCaps(profile.id).limits;
      const key = [
        limits.engine.id,
        limits.supportsCpsTagC,
        limits.supportsCpsTagRC,
        limits.supportsCpsTagRD,
      ].join("|");
      const seen = byEngine.get(limits.engine.id);
      if (seen) expect(seen[0], `${profile.id} vs ${seen[1]}`).toBe(key);
      else byEngine.set(limits.engine.id, [key, profile.id]);
    }
  });

  it("puts every Amnezia app on amneziawg-go, and so denies it <c>", () => {
    for (const id of [
      "amneziawg-android",
      "amneziawg-ios",
      "amneziawg-windows",
      "amneziavpn",
      "awg-go-legacy",
      // A fork, but `device/obf.go` is upstream's blob byte for byte.
      "wg-tunnel",
    ]) {
      const limits = clientCaps(id).limits;
      expect(limits.engine.id, id).toBe(ENGINE_GO.id);
      expect(limits.supportsCpsTagC, id).toBe(false);
      expect(limits.supportsCpsTagRC, id).toBe(true);
      expect(limits.supportsCpsTagRD, id).toBe(true);
    }
  });

  it("puts OpenWrt on the kernel module, which is where <c> lives", () => {
    const limits = clientCaps("openwrt").limits;
    expect(limits.engine.id).toBe(ENGINE_KMOD.id);
    expect(limits.supportsCpsTagC).toBe(true);
  });

  it("keeps the engine across a release that only moved a ceiling", () => {
    const now = clientCaps("amneziawg-windows").limits;
    const old = clientCaps("amneziawg-windows", "<2.0.2").limits;
    expect(old.engine.id).toBe(now.engine.id);
  });
});

describe("what the generator emits", () => {
  it("only ever writes tags the chosen client can parse", () => {
    for (const profile of AWG_CLIENT_PROFILES) {
      for (const version of ["3.0", "2.0", "1.5"] as const) {
        const limits = clientCaps(profile.id).limits;
        const cfg = genCfg(
          seeded({
            clientId: profile.id,
            version,
            // Ask for everything, so a tag can only be absent by being refused.
            useTagC: true,
            useTagT: true,
            useTagR: true,
            useTagRC: true,
            useTagRD: true,
          }),
        );
        const chain = cfg.i1 + cfg.i2 + cfg.i3 + cfg.i4 + cfg.i5;
        for (const tag of tagsIn(chain)) {
          expect(
            limits.engine.tags,
            `${profile.id} ${version} emitted <${tag}>`,
          ).toContain(tag as CpsTag);
        }
      }
    }
  });

  it("withholds <c> from a go client that asked for it", () => {
    // An unknown tag is fatal in go: newObfChain joins the errors and refuses
    // the chain, so this would cost the whole junk packet, not just the tag.
    for (let attempt = 0; attempt < 10; attempt++) {
      const cfg = genCfg(
        seeded({ clientId: "amneziavpn", version: "3.0", useTagC: true }),
      );
      expect(cfg.i1 + cfg.i2 + cfg.i3 + cfg.i4 + cfg.i5).not.toContain("<c>");
    }
  });

  it("lets a kernel-module client keep the counter it asked for", () => {
    let sawCounter = false;
    for (let attempt = 0; attempt < 20 && !sawCounter; attempt++) {
      const cfg = genCfg(
        seeded({
          clientId: "openwrt",
          version: "3.0",
          profile: "dtls",
          useTagC: true,
        }),
      );
      if ((cfg.i1 + cfg.i2 + cfg.i3 + cfg.i4 + cfg.i5).includes("<c>")) {
        sawCounter = true;
      }
    }
    expect(sawCounter).toBe(true);
  });
});
