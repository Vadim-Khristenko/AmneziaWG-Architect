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
import { CLIENTS, DEFAULT_CLIENT_ID } from "./clients";
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

export * from "./types";
export * from "./constants";
export * from "./utils";
export * from "./validators";
export * from "./clients";

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
 * Generate a complete AmneziaWG obfuscation configuration.
 */
export function genCfg(input: GeneratorInput): AWGConfig {
  const { version, intensity, profile, iterCount, junkLevel, useExtremeMax } =
    input;

  const client = CLIENTS[input.clientId] ?? CLIENTS[DEFAULT_CLIENT_ID];

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

  const h1 = rRange(rnd(100_000_000, 900_000_000), h1Spread);
  const h2 = rRange(rnd(1_200_000_000, 2_000_000_000), h2Spread);
  const h3 = rRange(rnd(2_400_000_000, 3_200_000_000), h3Spread);
  const h4 = rRange(rnd(3_600_000_000, 4_000_000_000), h4Spread);

  const h1sSpread = useExtremeMax ? 10_000_000 : 4_000_000;
  const h1s = 100_000_000 + rnd(0, h1sSpread);
  const h2s = 1_200_000_000 + rnd(0, h2Spread);
  const h3s = 2_400_000_000 + rnd(0, h3Spread);
  const h4s = 3_600_000_000 + rnd(0, h4Spread);

  let s1 = rnd(1, 150);
  let s2 = rnd(1, 150);
  while (s2 === s1 + 56) {
    s2 = rnd(1, 150);
  }

  let s3 = rnd(1, 64);
  let s3Attempts = 0;
  while ((s3 === s1 + 56 || s3 === s2 + 92) && s3Attempts < 10) {
    s3 = rnd(1, 64);
    s3Attempts++;
  }

  // S4 is hard-capped at 32 bytes by the AmneziaWG protocol.
  // Client-specific maxS4 may be even lower.
  let s4 = rnd(1, Math.min(32, client.maxS4));

  if (useExtremeMax) {
    s3 = rnd(65, 256);
    s3Attempts = 0;
    while ((s3 === s1 + 56 || s3 === s2 + 92) && s3Attempts < 10) {
      s3 = rnd(65, 256);
      s3Attempts++;
    }
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

  const hasCPS = version !== "1.0";
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

/** Convenience re-export of profile labels for the UI. */
export { PROFILE_LABELS };
