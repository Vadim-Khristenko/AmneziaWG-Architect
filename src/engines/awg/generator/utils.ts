/**
 * AmneziaWG Architect — low-level generator utilities.
 *
 * All randomness is backed by crypto.getRandomValues() via ../rng.
 */

import { cryptoRnd, cryptoRh, cryptoPick } from "@/shared/rng";
import type { GeneratorInput, BfpSlot } from "./types";
import { hostPools, BFP } from "./constants";

/** Inclusive random integer using a cryptographically secure source. */
export function rnd(a: number, b: number): number {
  return cryptoRnd(a, b);
}

/** `n` random bytes as a lower-case hex string (length = n*2). */
export function rh(n: number): string {
  return cryptoRh(n);
}

/** Random element from an array (secure source). */
export function pickHost<T>(arr: readonly T[]): T {
  return cryptoPick(arr);
}

/**
 * hexPad(value, byteLen) — число → hex ровно byteLen байт (byteLen*2 символов).
 */
export function hexPad(value: number, byteLen: number): string {
  let hex = Math.floor(value).toString(16);
  while (hex.length < byteLen * 2) hex = "0" + hex;
  return hex.slice(-(byteLen * 2));
}

/**
 * A QUIC variable-length integer, as hex.
 *
 * RFC 9000 §16: the top two bits of the first byte say how many bytes the
 * whole thing is — 00 for one, 01 for two, 10 for four, 11 for eight — and
 * the rest is the value, big-endian.
 *
 * This matters because a Length field written as four random bytes does not
 * decode to the length of what follows, and anything that actually parses
 * QUIC rather than glancing at it sees that immediately. The junk packet is
 * supposed to *be* a QUIC Initial, not merely resemble one.
 */
export function quicVarint(value: number): string {
  const n = Math.max(0, Math.floor(value));

  // Addition rather than bitwise OR: JavaScript's `|` works on signed 32-bit
  // integers, so `0x8000_0000 | n` goes negative and the hex comes out as the
  // wrong number entirely. The two-byte form is small enough to be safe
  // either way; the wider ones are not.
  if (n < 0x40) return hexPad(n, 1);
  if (n < 0x4000) return hexPad(0x4000 + n, 2);
  if (n < 0x4000_0000) return hexPad(0x8000_0000 + n, 4);

  // The eight-byte form needs more than 32 bits, so it is built in halves;
  // nothing here produces a value this large, but truncating silently would
  // be worse than handling it.
  const high = Math.floor(n / 0x1_0000_0000);
  const low = n % 0x1_0000_0000;
  return hexPad(0xc000_0000 + high, 4) + hexPad(low, 4);
}

/** How many bytes `quicVarint` will produce for a value. */
export function quicVarintLength(value: number): number {
  const n = Math.max(0, Math.floor(value));
  if (n < 0x40) return 1;
  if (n < 0x4000) return 2;
  if (n < 0x4000_0000) return 4;
  return 8;
}

/**
 * assertEvenHex — страховка: если hex нечётный, дополняем нулём и логируем.
 */
export function assertEvenHex(hex: string, label = "?"): string {
  if (hex.length % 2 !== 0) {
    console.warn(`[AWG] odd hex in ${label} len=${hex.length}`);
    return hex + "0";
  }
  return hex;
}

/**
 * rRange(base, spread?, maxEnd?) — генерирует строку-диапазон "start-end" для H1–H4.
 * Если передан maxEnd, конец диапазона не превысит его.
 */
export function rRange(base: number, spread = 500_000, maxEnd?: number): string {
  const width = rnd(1000, 50_000);
  let start = base + rnd(0, spread);

  if (maxEnd !== undefined) {
    // Slide the window down rather than clamping both ends onto the ceiling.
    // Clamping produced `2147483647-2147483647` — a range of one value, the
    // same one for every user of a capped client, which is a signature rather
    // than a random header. Sliding keeps the width whenever the cap has room
    // for it, and only a cap narrower than the window itself collapses.
    start = Math.min(start, Math.max(0, maxEnd - width));
  }

  const end = maxEnd === undefined ? start + width : Math.min(start + width, maxEnd);
  return `${start}-${end}`;
}

/**
 * splitPad(n, tag?) — разбивает N байт паддинга на CPS-теги.
 * Лимит AmneziaWG: не более 1000 байт на один тег <r>/<rc>/<rd>.
 */
export function splitPad(n: number, tag: "r" | "rc" | "rd" = "r"): string {
  n = Math.max(0, Math.floor(n));
  if (n === 0) return "";
  let out = "";
  while (n > 1000) {
    out += `<${tag} 1000>`;
    n -= 1000;
  }
  out += `<${tag} ${n}>`;
  return out;
}

/**
 * tagOverhead(useC, useT) — суммарный фиксированный вес служебных тегов.
 *   <c> = 4 байта, <t> = 4 байта.
 */
export function tagOverhead(useC: boolean, useT: boolean): number {
  return (useC ? 4 : 0) + (useT ? 4 : 0);
}

/**
 * calcPadding — вычисляет размер паддинга в байтах.
 */
export function calcPadding(
  headerB: number,
  extraB: number,
  range: [number, number] | null,
  iv: number,
  mtu: number,
): number {
  const maxPad = Math.max(0, mtu - headerB - extraB);

  if (!range) {
    return Math.min(rnd(20, 80) * iv, 500, maxPad);
  }

  const occupied = headerB + extraB;
  const [min, max] = range;
  const clampedMin = Math.min(min, mtu);
  const clampedMax = Math.min(max, mtu);
  const needed = Math.max(0, clampedMin - occupied);
  const jitter = Math.max(
    0,
    Math.min(clampedMax - clampedMin, clampedMax - occupied - needed, 20),
  );
  const pad = needed + (jitter > 0 ? rnd(0, jitter) : 0);
  return Math.min(pad, maxPad);
}

/** Выравнивает размер TLS ClientHello до кратного 128 байт. */
export function alignTo128(n: number): number {
  return Math.ceil(n / 128) * 128;
}

/** Pick a host from the appropriate pool. */
export function getHost(input: GeneratorInput, poolKey: string): string {
  if (input.customHost.trim()) return input.customHost.trim();
  const actualKey = poolKey === "dns_query" ? "dns" : poolKey;
  const pool = hostPools[actualKey] ?? hostPools.tls_client_hello;
  return pickHost(pool);
}

/** Browser fingerprint range for a given slot, if enabled. */
export function getFpRange(
  input: GeneratorInput,
  slot: BfpSlot,
): [number, number] | null {
  if (!input.useBrowserFp || !input.browserProfile) return null;
  const table = BFP[input.browserProfile];
  return table?.[slot] ?? null;
}

export const CHROMIUM_PROFILES = new Set([
  "chrome",
  "edge",
  "yandex_desktop",
  "yandex_mobile",
]);
