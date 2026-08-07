/**
 * What actually parses I1–I5.
 *
 * The junk-packet tags were written into the client matrix, one row per app,
 * and the rows disagreed: `amneziawg-android`, `amneziawg-ios` and Amnezia VPN
 * claimed `<c>` while `amneziawg-windows` denied it — and all four ship the
 * same `amneziawg-go/v3 v3.0.1`. A tag is not a property of the app around the
 * tunnel. It is a property of the thing that reads the chain, and there are
 * only two of those in the open.
 *
 * ## The two engines, from their parsers
 *
 * `amneziawg-go`, `device/obf.go` — the `obfBuilders` map is the whole
 * vocabulary:
 *
 *     "b", "t", "r", "rc", "rd", "d", "ds", "dz"        <- no "c"
 *
 * `amneziawg-linux-kernel-module`, `src/junk.c`, `jp_parse_tags` — a chain of
 * `strcmp` ending in `else return -EINVAL`:
 *
 *     "b", "c", "t", "r", "rc", "rd"                    <- no "d", "ds", "dz"
 *
 * So the sets are disjoint in both directions: the counter tag exists only in
 * the kernel module, the data tags only in go.
 *
 * ## Why an unknown tag is not a harmless one
 *
 * Neither parser skips what it does not know. go collects the failures and
 * returns them joined, so `newObfChain` yields an error and the junk spec is
 * refused whole; the kernel module returns `-EINVAL` from `jp_parse_tags` and
 * `jp_spec_setup` propagates it. One wrong tag does not cost you that tag, it
 * costs you the packet it was in.
 *
 * ## What the versions say
 *
 * `device/obf.go` is byte-identical (blob `cf2275c5`) at v3.0.0, v3.0.1,
 * v3.0.2, v3.0.3, v3.0.20260805 and `master`, so the go vocabulary needs no
 * release axis inside 3.x. `src/junk.c` carries the same six tags on both the
 * kernel module's 1.0.x and 3.0.x lines. Checked 6 aug 2026.
 */

/** A tag the junk-packet chain can carry. */
export type CpsTag = "b" | "c" | "t" | "r" | "rc" | "rd" | "d" | "ds" | "dz";

/** The three tags the generator lets a reader switch on and off. */
export interface CpsTagSupport {
  supportsCpsTagC: boolean;
  supportsCpsTagRC: boolean;
  supportsCpsTagRD: boolean;
}

/** An implementation of the tunnel, named as its own project names itself. */
export interface AwgEngine {
  id: string;
  /** The package name. Not translated — it spells itself the same anywhere. */
  label: string;
  /** Every tag its parser accepts. Anything outside this refuses the chain. */
  tags: readonly CpsTag[];
  /**
   * Whether the tag set was read out of the engine's own source.
   *
   * False marks a client whose engine we could not establish — a proprietary
   * firmware, or a build whose published sources say nothing about what is
   * underneath. Those get the tags both known engines share, which is a
   * conservative guess and is labelled as one rather than presented as fact.
   */
  verified: boolean;
}

/** amneziawg-go, `device/obf.go`. The engine under every Amnezia app. */
export const ENGINE_GO: AwgEngine = {
  id: "amneziawg-go",
  label: "amneziawg-go 3.x",
  tags: ["b", "t", "r", "rc", "rd", "d", "ds", "dz"],
  verified: true,
};

/** amneziawg-linux-kernel-module, `src/junk.c`. The only engine with `<c>`. */
export const ENGINE_KMOD: AwgEngine = {
  id: "amneziawg-kmod",
  label: "amneziawg-linux-kernel-module",
  tags: ["b", "c", "t", "r", "rc", "rd"],
  verified: true,
};

/**
 * What every engine we have read accepts — the intersection of the two above.
 *
 * For a client whose insides are closed. Claiming `<c>` here would be claiming
 * the kernel module on no evidence, and go is what nearly everything ships;
 * withholding a tag costs a little entropy, while sending one the parser does
 * not know costs the whole junk packet.
 */
export const ENGINE_UNVERIFIED: AwgEngine = {
  id: "unverified",
  label: "engine not established",
  tags: ["b", "t", "r", "rc", "rd"],
  verified: false,
};

export const AWG_ENGINES: readonly AwgEngine[] = [
  ENGINE_GO,
  ENGINE_KMOD,
  ENGINE_UNVERIFIED,
];

/** Whether an engine's parser knows a tag. */
export function engineHasTag(engine: AwgEngine, tag: CpsTag): boolean {
  return engine.tags.includes(tag);
}

/**
 * The three switchable tags, as the client matrix states them.
 *
 * Derived rather than written per client, which is the point: four entries
 * naming one engine cannot disagree about that engine any more.
 */
export function engineTagSupport(engine: AwgEngine): CpsTagSupport {
  return {
    supportsCpsTagC: engineHasTag(engine, "c"),
    supportsCpsTagRC: engineHasTag(engine, "rc"),
    supportsCpsTagRD: engineHasTag(engine, "rd"),
  };
}
