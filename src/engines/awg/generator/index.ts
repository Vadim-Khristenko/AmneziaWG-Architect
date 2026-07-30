/**
 * AmneziaWG Architect — Core Generator public API.
 *
 * This module wires together types, constants, RNG utilities, profile
 * generators and validators to produce a complete AWG configuration.
 */

import type {
  AWGConfig,
  AWGVersion,
  GeneratorInput,
  Intensity,
  MimicProfile,
} from "./types";
import { PROFILE_LABELS } from "./constants";
import { clientCaps } from "./clients";
import { rnd, rRange } from "./utils";
import {
  mkQUICi,
  mkQUIC0,
  mkHTTP3,
  mkTLS,
  mkNoise,
  mkDTLS,
  mkSIP,
  mkDNS,
  mkEntropy,
} from "./profiles";
import { validateGeneratedConfig } from "./validators";
import { genAwg3, MIN_S_WITH_HEADER_PROTECTION } from "./awg3";
import { capsFor } from "./versions";

export * from "./types";
export * from "./constants";
export * from "./utils";
export * from "./validators";
export * from "./clients";
export * from "./awg3";
export * from "./render";

export { mkQUICi, mkQUIC0, mkHTTP3, mkTLS, mkNoise, mkDTLS, mkSIP, mkDNS, mkEntropy };

/**
 * genI1 — выбирает и вызывает нужный генератор по профилю мимикрии.
 * При profile="random" — случайный выбор из всех профилей кроме random.
 */
export function genI1(
  input: GeneratorInput,
  profile: MimicProfile,
  iv: number,
): string {
  const dispatch: Record<string, (i: GeneratorInput, iv: number) => string> = {
    quic_initial: mkQUICi,
    quic_0rtt: mkQUIC0,
    tls_client_hello: mkTLS,
    wireguard_noise: mkNoise,
    dtls: mkDTLS,
    http3: mkHTTP3,
    sip: mkSIP,
    dns_query: mkDNS,
    tls_to_quic: mkTLS,
    quic_burst: mkQUICi,
  };

  if (profile === "random") {
    const keys = Object.keys(dispatch) as MimicProfile[];
    return genI1(input, keys[rnd(0, keys.length - 1)], iv);
  }

  const fn = dispatch[profile] ?? dispatch.quic_initial;
  return fn(input, iv);
}

/**
 * Bring a value up to `floor` without collapsing onto it.
 *
 * `Math.max(value, floor)` was the obvious way to enforce the AWG 3.0 minimum
 * and the wrong one: S3 draws from 1–64 and S4 from 1–32, so most draws land
 * under 12 and clamping turns them all into exactly 12. A config with three
 * identical S values is a signature — the opposite of what padding is for.
 *
 * Redrawing from what is left of the range keeps the spread. Only when the
 * range has nothing above the floor does the floor itself remain.
 */
function liftAboveFloor(value: number, floor: number, high: number): number {
  if (value >= floor) return value;
  return high > floor ? rnd(floor, high) : floor;
}

/**
 * Generate a complete AmneziaWG obfuscation configuration.
 */
export function genCfg(input: GeneratorInput): AWGConfig {
  const { version, intensity, profile, iterCount, junkLevel, useExtremeMax } =
    input;

  /** What this protocol version supports — see ./versions.ts. */
  const caps = capsFor(version);

  const client = clientCaps(input.clientId, input.clientRelease).limits;

  // Enforce client capability limits without mutating the caller's input.
  const effectiveInput: GeneratorInput = {
    ...input,
    useTagC: client.supportsCpsTagC && input.useTagC,
    useTagRC: client.supportsCpsTagRC && input.useTagRC,
    useTagRD: client.supportsCpsTagRD && input.useTagRD,
  };

  const imap: Record<Intensity, number> = { low: 1, medium: 2, high: 3 };
  const iv = imap[intensity] + (iterCount > 3 ? 1 : 0);

  const h1Spread = useExtremeMax ? 10_000_000 : 100_000_000;
  const h2Spread = useExtremeMax ? 10_000_000 : 100_000_000;
  const h3Spread = useExtremeMax ? 10_000_000 : 100_000_000;
  const h4Spread = useExtremeMax ? 15_000_000 : 150_000_000;

  const maxH = client.maxHValue;

  /**
   * Build non-overlapping H ranges that always fit into `maxH`.
   * For INT32_MAX-limited clients the absolute pools are lowered so all four
   * ranges stay below the cap and do not overlap.
   */
  const hPools = (() => {
    if (maxH >= 4_294_967_295) {
      return {
        h1: { min: 100_000_000, max: 900_000_000, spread: h1Spread },
        h2: { min: 1_200_000_000, max: 2_000_000_000, spread: h2Spread },
        h3: { min: 2_400_000_000, max: 3_200_000_000, spread: h3Spread },
        h4: { min: 3_600_000_000, max: 4_000_000_000, spread: h4Spread },
      };
    }

    const top = maxH;
    const zone = Math.floor(top / 5);
    return {
      h1: { min: zone, max: zone * 2 - 10_000, spread: Math.min(h1Spread, zone - 10_000) },
      h2: { min: zone * 2, max: zone * 3 - 10_000, spread: Math.min(h2Spread, zone - 10_000) },
      h3: { min: zone * 3, max: zone * 4 - 10_000, spread: Math.min(h3Spread, zone - 10_000) },
      h4: { min: zone * 4, max: top, spread: Math.min(h4Spread, zone - 10_000) },
    };
  })();

  const h1 = rRange(rnd(hPools.h1.min, hPools.h1.max), hPools.h1.spread, maxH);
  const h2 = rRange(rnd(hPools.h2.min, hPools.h2.max), hPools.h2.spread, maxH);
  const h3 = rRange(rnd(hPools.h3.min, hPools.h3.max), hPools.h3.spread, maxH);
  const h4 = rRange(rnd(hPools.h4.min, hPools.h4.max), hPools.h4.spread, maxH);

  // Single H values for 1.0/1.5 come out of the same zones as the ranges.
  // They used to be written as absolute constants and clamped to `maxH`,
  // which on a capped client turned H2, H3 and H4 into exactly the cap —
  // three identical headers, the same three for everyone on that client.
  const h1sSpread = useExtremeMax ? 10_000_000 : 4_000_000;
  const h1s = Math.min(hPools.h1.min + rnd(0, h1sSpread), maxH);
  const h2s = Math.min(hPools.h2.min + rnd(0, h2Spread), maxH);
  const h3s = Math.min(hPools.h3.min + rnd(0, h3Spread), maxH);
  const h4s = Math.min(hPools.h4.min + rnd(0, h4Spread), maxH);

  let s1 = rnd(1, 150);
  let s2 = rnd(1, 150);
  while (s2 === s1 + 56) {
    s2 = rnd(1, 150);
  }

  // S3/S4 exist only from the version that introduced cookie-reply and data
  // padding. Drawing them for 1.0/1.5 and letting the renderer hide them meant
  // the config object carried values no client would ever see — which is how
  // the parameter panel and the .conf ended up disagreeing about S3/S4.
  let s3 = 0;
  let s4 = 0;

  if (caps.extraSizes) {
    const s3Range: readonly [number, number] = useExtremeMax ? [65, 256] : [1, 64];
    s3 = rnd(...s3Range);
    let s3Attempts = 0;
    while ((s3 === s1 + 56 || s3 === s2 + 92) && s3Attempts < 10) {
      s3 = rnd(...s3Range);
      s3Attempts++;
    }

    // S4 is hard-capped at 32 bytes by the AmneziaWG protocol.
    // Client-specific maxS4 may be even lower.
    s4 = rnd(1, Math.min(32, client.maxS4));
  }

  const minJc = version === "1.0" ? 4 : 3;
  const maxJc = Math.min(useExtremeMax ? 128 : 15, client.maxJc);

  let jcv = junkLevel;
  if (version === "1.0") {
    jcv = Math.max(4, jcv);
  } else if (jcv > 0) {
    const variance = rnd(-1, 1);
    jcv = Math.max(1, Math.min(maxJc, jcv + variance));
  }

  if (useExtremeMax && junkLevel === 0 && version !== "1.0") {
    jcv = rnd(1, Math.min(8, maxJc));
  }

  const jminRanges: Record<Intensity, [number, number]> = {
    low: [64, 256],
    medium: [128, 512],
    high: [256, 768],
  };
  let jmin = rnd(jminRanges[intensity][0], jminRanges[intensity][1]);

  const jmaxRanges: Record<Intensity, [number, number]> = {
    low: [256, 512],
    medium: [512, 1024],
    high: [768, 1280],
  };
  let jmax = rnd(jmaxRanges[intensity][0], jmaxRanges[intensity][1]);

  const minJmax = jmin + 64;
  if (jmax <= minJmax) {
    jmax = minJmax + rnd(64, 256);
  }

  if (version === "1.0" && jmax <= 81) {
    jmax = 82 + rnd(50, 200);
  }

  if (input.routerMode) {
    s1 = Math.min(s1, 20);
    s2 = Math.min(s2, 20);
    if (s2 === s1 + 56) s2 = Math.min(s2 + 1, 20);
    jcv = Math.max(minJc, Math.min(jcv, Math.min(2, client.maxJc)));
    jmin = Math.min(jmin, 40);
    jmax = Math.min(jmax, 128);
  }

  /*
   * AWG 3.0 header protection derives its ChaCha20 nonce from the first 12
   * bytes of the S-padding, so every S has to carry at least that much random
   * data. Applied last so router-mode clamping cannot pull it back under.
   */
  const needsSFloor = caps.headerProtection && input.useHeaderProtection;
  if (needsSFloor) {
    const floor = MIN_S_WITH_HEADER_PROTECTION;
    // Router mode caps S1/S2 at 20, and the floor still has to win, so the
    // redraw range narrows rather than disappearing.
    const sHigh = input.routerMode ? 20 : 150;

    s1 = liftAboveFloor(s1, floor, sHigh);
    s2 = liftAboveFloor(s2, floor, sHigh);

    // Raising the floor can recreate the size collisions we avoided above.
    if (s2 === s1 + 56) s2 = s2 + 1;

    if (caps.extraSizes) {
      const s4High = Math.min(32, client.maxS4);
      s3 = liftAboveFloor(s3, floor, useExtremeMax ? 256 : 64);
      s4 = liftAboveFloor(s4, floor, s4High);
      if (s3 === s1 + 56 || s3 === s2 + 92) s3 = s3 + 1;
      // S4 is capped at 32 by the protocol; the floor still fits.
      s4 = Math.min(s4, s4High);
    }
  }

  const hasCPS = caps.cps;
  const isComposite = profile === "tls_to_quic" || profile === "quic_burst";
  const isDns = profile === "dns_query";

  let i1 = "",
    i2 = "",
    i3 = "",
    i4 = "",
    i5 = "";

  if (!hasCPS) {
    // AWG 1.0 — без CPS
  } else if (isComposite && profile === "tls_to_quic") {
    i1 = mkTLS(effectiveInput, iv);
    i2 = mkQUICi(effectiveInput, iv);
    i3 = mkEntropy(effectiveInput, 2, iv);
    i4 = mkEntropy(effectiveInput, 3, iv);
    i5 = mkEntropy(effectiveInput, 4, iv);
  } else if (isComposite && profile === "quic_burst") {
    i1 = mkQUICi(effectiveInput, iv);
    i2 = mkQUIC0(effectiveInput, iv);
    i3 = mkHTTP3(effectiveInput, iv);
    i4 = mkEntropy(effectiveInput, 3, iv);
    i5 = mkEntropy(effectiveInput, 4, iv);
  } else if (isDns) {
    i1 = mkDNS(effectiveInput, iv);
    i2 = input.mimicAll
      ? mkDNS(effectiveInput, iv + 1)
      : mkEntropy(effectiveInput, 1, iv);
    i3 = input.mimicAll
      ? mkDNS(effectiveInput, iv + 2)
      : mkEntropy(effectiveInput, 2, iv);
    i4 = input.mimicAll
      ? mkDNS(effectiveInput, iv + 3)
      : mkEntropy(effectiveInput, 3, iv);
    i5 = input.mimicAll
      ? mkDNS(effectiveInput, iv + 4)
      : mkEntropy(effectiveInput, 4, iv);
  } else {
    i1 = genI1(effectiveInput, profile, iv);
    i2 = input.mimicAll
      ? genI1(effectiveInput, profile, iv)
      : mkEntropy(effectiveInput, 1, iv);
    i3 = input.mimicAll
      ? genI1(effectiveInput, profile, iv)
      : mkEntropy(effectiveInput, 2, iv);
    i4 = input.mimicAll
      ? genI1(effectiveInput, profile, iv)
      : mkEntropy(effectiveInput, 3, iv);
    i5 = input.mimicAll
      ? genI1(effectiveInput, profile, iv)
      : mkEntropy(effectiveInput, 4, iv);
  }

  if (input.routerMode && hasCPS) {
    i2 = "";
    i3 = "";
    i4 = "";
    i5 = "";
  }

  const cfg: AWGConfig = {
    version,
    profile,
    h1,
    h2,
    h3,
    h4,
    h1s,
    h2s,
    h3s,
    h4s,
    s1,
    s2,
    s3,
    s4,
    jc: jcv,
    jmin,
    jmax,
    i1,
    i2,
    i3,
    i4,
    i5,
    ...(caps.headerProtection ? { awg3: genAwg3(input) } : {}),
  };

  // Safety net: throw if we ever emit a config that fails our own validators.
  const findings = validateGeneratedConfig(cfg, input.clientId);
  const fatal = findings.filter((f) => f.level === "error");
  if (fatal.length > 0) {
    throw new Error(
      `Generated config failed validation: ${fatal.map((f) => `${f.field}: ${f.msg}`).join("; ")}`,
    );
  }

  return cfg;
}

/**
 * Generate multiple independent configurations at once.
 * Each config is generated from a fresh random seed, but with the same
 * input preferences (version, intensity, profile, client, etc.).
 */
export function generateBatch(
  input: GeneratorInput,
  count: number,
): AWGConfig[] {
  if (!Number.isFinite(count) || count < 1) {
    throw new RangeError("generateBatch: count must be a positive integer");
  }
  if (count > 1000) {
    throw new RangeError("generateBatch: count must not exceed 1000");
  }

  const out: AWGConfig[] = [];
  for (let i = 0; i < count; i++) {
    out.push(genCfg({ ...input, iterCount: input.iterCount + i }));
  }
  return out;
}

/** Convenience re-export of profile labels for the UI. */
export { PROFILE_LABELS };
