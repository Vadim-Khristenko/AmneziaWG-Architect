/**
 * AmneziaWG Architect — Packet Simulator.
 *
 * Simulates the first seconds of an AmneziaWG session to preview packet
 * sizes, headers and the CPS chain. All numbers are approximate (the real
 * kernel adds encryption overhead and random jitter).
 */

import { parseRange } from "./generator/validators";
import type { AWGConfig } from "./generator/types";

export type PacketKind =
  | "init"
  | "response"
  | "cookie"
  | "data"
  | "junk"
  | "cps";

export interface SimPacket {
  id: number;
  kind: PacketKind;
  label: string;
  size: number;
  header: number;
  payload: number;
  description: string;
}

export interface SimResult {
  packets: SimPacket[];
  totalBytes: number;
  handshakeBytes: number;
  overheadBytes: number;
}

const WG_BASE = {
  init: 148,
  response: 92,
  cookie: 64,
} as const;

function pickHeader(rangeStr: string): number {
  const r = parseRange(rangeStr);
  if (!r) return 0;
  const [min, max] = r;
  return Math.floor(min + Math.random() * (max - min + 1));
}

function randInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

/**
 * Simulate a short AWG handshake + junk train.
 */
export function simulateHandshake(cfg: AWGConfig): SimResult {
  const packets: SimPacket[] = [];
  let id = 0;

  // CPS chain first (sent before the real WireGuard handshake)
  for (let i = 1; i <= 5; i++) {
    const value = cfg[`i${i}` as keyof AWGConfig] as string | undefined;
    if (!value) continue;
    // Very rough byte-count: literal text length is not the wire size,
    // but gives a useful relative impression.
    const size = 64 + value.length * 2 + randInt(0, 32);
    packets.push({
      id: ++id,
      kind: "cps",
      label: `I${i}`,
      size,
      header: 8,
      payload: size - 8,
      description: `CPS пакет I${i} (${cfg.profile})`,
    });
  }

  // Junk train
  for (let i = 0; i < cfg.jc; i++) {
    const size = cfg.jmin + randInt(0, Math.max(0, cfg.jmax - cfg.jmin));
    packets.push({
      id: ++id,
      kind: "junk",
      label: "Junk",
      size,
      header: 8,
      payload: size - 8,
      description: `Junk-train пакет ${i + 1}/${cfg.jc}`,
    });
  }

  // WireGuard handshake with AWG headers/prefixes
  const h1 = pickHeader(cfg.h1);
  const initSize = WG_BASE.init + randInt(0, cfg.s1);
  packets.push({
    id: ++id,
    kind: "init",
    label: "Init",
    size: initSize,
    header: h1,
    payload: initSize,
    description: `Handshake Init (H1=${h1}, S1=${cfg.s1})`,
  });

  const h2 = pickHeader(cfg.h2);
  const respSize = WG_BASE.response + randInt(0, cfg.s2);
  packets.push({
    id: ++id,
    kind: "response",
    label: "Response",
    size: respSize,
    header: h2,
    payload: respSize,
    description: `Handshake Response (H2=${h2}, S2=${cfg.s2})`,
  });

  const h3 = pickHeader(cfg.h3);
  const cookieSize = WG_BASE.cookie + randInt(0, cfg.s3);
  packets.push({
    id: ++id,
    kind: "cookie",
    label: "Cookie",
    size: cookieSize,
    header: h3,
    payload: cookieSize,
    description: `Cookie Reply (H3=${h3}, S3=${cfg.s3})`,
  });

  // A few data packets
  for (let i = 0; i < 3; i++) {
    const h4 = pickHeader(cfg.h4);
    const payload = randInt(64, 512);
    const size = payload + randInt(0, cfg.s4);
    packets.push({
      id: ++id,
      kind: "data",
      label: "Data",
      size,
      header: h4,
      payload,
      description: `Data пакет ${i + 1} (H4=${h4}, S4=${cfg.s4})`,
    });
  }

  const totalBytes = packets.reduce((sum, p) => sum + p.size, 0);
  const handshakeBytes = packets
    .filter((p) => ["init", "response", "cookie"].includes(p.kind))
    .reduce((sum, p) => sum + p.size, 0);
  const overheadBytes = totalBytes - packets.filter((p) => p.kind === "data").reduce((sum, p) => sum + p.payload, 0);

  return { packets, totalBytes, handshakeBytes, overheadBytes };
}

export function kindColor(kind: PacketKind): string {
  const map: Record<PacketKind, string> = {
    init: "#38bdf8",
    response: "#818cf8",
    cookie: "#fbbf24",
    data: "#34d399",
    junk: "#f87171",
    cps: "#a78bfa",
  };
  return map[kind];
}

export function kindLabel(kind: PacketKind): string {
  const map: Record<PacketKind, string> = {
    init: "Init",
    response: "Response",
    cookie: "Cookie",
    data: "Data",
    junk: "Junk",
    cps: "CPS",
  };
  return map[kind];
}
