/**
 * AmneziaWG Architect — low-level generator utilities.
 *
 * All randomness is backed by crypto.getRandomValues() via ../rng.
 */

import { cryptoRnd, cryptoRh, cryptoPick } from "../rng";
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
 * rRange(base, spread?) — генерирует строку-диапазон "start-end" для H1–H4.
 */
export function rRange(base: number, spread = 500_000): string {
  const s = base + rnd(0, spread);
  return `${s}-${s + rnd(1000, 50_000)}`;
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
