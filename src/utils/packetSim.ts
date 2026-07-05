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
  | "cps"
  | "junk"
  | "init"
  | "response"
  | "cookie"
  | "data";

export interface SimPacket {
  id: number;
  /** Human-readable step order, e.g. "1", "2a", "2b". */
  step: string;
  kind: PacketKind;
  label: string;
  /** Source of the packet. */
  from: "client" | "server";
  /** Destination of the packet. */
  to: "client" | "server";
  size: number;
  /** AWG magic header value (0 for pure padding/junk). */
  header: number;
  /** Approximate payload size without AWG prefix. */
  payload: number;
  /** Short description in Russian. */
  description: string;
}

export interface SimResult {
  packets: SimPacket[];
  totalBytes: number;
  handshakeBytes: number;
  dataBytes: number;
  overheadBytes: number;
  /** Approximate seconds for a 10 Mbit/s upstream. */
  estSeconds10mbps: number;
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
 *
 * The packet flow mirrors the protocol:
 *   1. Client sends CPS chain (I1..I5) to shape traffic fingerprint.
 *   2. Client sends junk-train packets.
 *   3. Client sends WireGuard Initiation (H1/S1).
 *   4. Server sends WireGuard Response (H2/S2).
 *   5. Client sends Cookie Reply if needed (H3/S3).
 *   6. Client and Server exchange Data packets (H4/S4).
 */
export function simulateHandshake(cfg: AWGConfig): SimResult {
  const packets: SimPacket[] = [];
  let id = 0;
  const cpsPackets: SimPacket[] = [];

  // 1. CPS chain (sent by client before the real WG handshake)
  for (let i = 1; i <= 5; i++) {
    const value = cfg[`i${i}` as keyof AWGConfig] as string | undefined;
    if (!value) continue;
    const size = 64 + value.length * 2 + randInt(0, 32);
    cpsPackets.push({
      id: ++id,
      step: `1.${i}`,
      kind: "cps",
      label: `I${i}`,
      from: "client",
      to: "server",
      size,
      header: 0,
      payload: Math.max(0, size - 8),
      description: `CPS-пакет I${i}: ${cfg.profile}`,
    });
  }
  packets.push(...cpsPackets);

  // 2. Junk train (client → server)
  for (let i = 0; i < cfg.jc; i++) {
    const size = cfg.jmin + randInt(0, Math.max(0, cfg.jmax - cfg.jmin));
    packets.push({
      id: ++id,
      step: `2.${i + 1}`,
      kind: "junk",
      label: "Junk",
      from: "client",
      to: "server",
      size,
      header: 0,
      payload: Math.max(0, size - 8),
      description: `Junk-train ${i + 1}/${cfg.jc} — маскировка трафика`,
    });
  }

  // 3. WireGuard handshake Initiation (client → server)
  const h1 = pickHeader(cfg.h1);
  const initSize = WG_BASE.init + randInt(0, cfg.s1);
  packets.push({
    id: ++id,
    step: "3",
    kind: "init",
    label: "Init",
    from: "client",
    to: "server",
    size: initSize,
    header: h1,
    payload: WG_BASE.init,
    description: `WG Handshake Initiation, H1=${h1}, S1=${cfg.s1}`,
  });

  // 4. WireGuard handshake Response (server → client)
  const h2 = pickHeader(cfg.h2);
  const respSize = WG_BASE.response + randInt(0, cfg.s2);
  packets.push({
    id: ++id,
    step: "4",
    kind: "response",
    label: "Response",
    from: "server",
    to: "client",
    size: respSize,
    header: h2,
    payload: WG_BASE.response,
    description: `WG Handshake Response, H2=${h2}, S2=${cfg.s2}`,
  });

  // 5. Cookie Reply (client → server) if S3 is configured
  const h3 = pickHeader(cfg.h3);
  const cookieSize = WG_BASE.cookie + randInt(0, cfg.s3);
  packets.push({
    id: ++id,
    step: "5",
    kind: "cookie",
    label: "Cookie",
    from: "client",
    to: "server",
    size: cookieSize,
    header: h3,
    payload: WG_BASE.cookie,
    description: `Cookie Reply, H3=${h3}, S3=${cfg.s3}`,
  });

  // 6. Data packets (both directions)
  for (let i = 0; i < 4; i++) {
    const h4 = pickHeader(cfg.h4);
    const payload = randInt(64, 512);
    const size = payload + randInt(0, cfg.s4);
    packets.push({
      id: ++id,
      step: `6.${i + 1}`,
      kind: "data",
      label: "Data",
      from: i % 2 === 0 ? "client" : "server",
      to: i % 2 === 0 ? "server" : "client",
      size,
      header: h4,
      payload,
      description: `Передача данных, H4=${h4}, S4=${cfg.s4}`,
    });
  }

  const totalBytes = packets.reduce((sum, p) => sum + p.size, 0);
  const handshakeBytes = packets
    .filter((p) => ["init", "response", "cookie"].includes(p.kind))
    .reduce((sum, p) => sum + p.size, 0);
  const dataBytes = packets
    .filter((p) => p.kind === "data")
    .reduce((sum, p) => sum + p.size, 0);
  const overheadBytes = totalBytes - dataBytes;

  return {
    packets,
    totalBytes,
    handshakeBytes,
    dataBytes,
    overheadBytes,
    estSeconds10mbps: Number((totalBytes * 8 / 10_000_000).toFixed(3)),
  };
}

export function kindColor(kind: PacketKind): string {
  const map: Record<PacketKind, string> = {
    cps: "#a78bfa",
    junk: "#f87171",
    init: "#38bdf8",
    response: "#818cf8",
    cookie: "#fbbf24",
    data: "#34d399",
  };
  return map[kind];
}

export function kindLabel(kind: PacketKind): string {
  const map: Record<PacketKind, string> = {
    cps: "CPS",
    junk: "Junk",
    init: "Init",
    response: "Response",
    cookie: "Cookie",
    data: "Data",
  };
  return map[kind];
}

export function kindDescription(kind: PacketKind): string {
  const map: Record<PacketKind, string> = {
    cps: "Цепочка сигнатур, которая делает трафик похожим на выбранный протокол.",
    junk: "Фиктивные пакеты, запутывающие DPI перед настоящим handshake.",
    init: "WireGuard Handshake Initiation — первый реальный WG-пакет.",
    response: "WireGuard Handshake Response — ответ сервера.",
    cookie: "Cookie Reply — защита от DDoS/amplification.",
    data: "Зашифрованные данные VPN-туннеля.",
  };
  return map[kind];
}
