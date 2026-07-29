/**
 * AmneziaWG Architect — Packet Simulator.
 *
 * Simulates the first seconds of an AmneziaWG session to preview packet
 * sizes, headers and the CPS chain. All numbers are approximate (the real
 * kernel adds encryption overhead and random jitter).
 */

import { parseRange } from "./generator/validators";
import { translate } from "@/i18n";
import type { AWGConfig } from "./generator/types";
import { capsFor } from "./generator/versions";

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
  /** Localised one-line description. */
  description: string;
  /**
   * AWG 3.0 — this packet's header is encrypted with the ChaCha20
   * header-protection key. Handshake and cookie messages are encrypted whole;
   * transport packets only in their 16-byte header.
   */
  headerProtected?: boolean;
  /** AWG 3.0 — the entire message is encrypted, not just the header. */
  encryptedWhole?: boolean;
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

/** Ranged versions draw headers from a range; the rest use fixed values. */
function headerFor(cfg: AWGConfig, slot: 1 | 2 | 3 | 4): number {
  if (capsFor(cfg.version).rangedHeaders) {
    return pickHeader(cfg[`h${slot}`] as string);
  }
  return (cfg[`h${slot}s`] as number) ?? 0;
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

  // AWG 3.0 features. Header protection only applies when a key is set, and
  // content padding replaces the pad-to-multiple-of-16 rule when configured.
  const caps = capsFor(cfg.version);
  const hp = Boolean(caps.headerProtection && cfg.awg3?.headerProtectionKey);
  const cpaRange =
    caps.headerProtection && cfg.awg3?.contentPaddingAddition
      ? parseRange(cfg.awg3.contentPaddingAddition)
      : null;

  /** Cookie replies exist only where S3 does. */
  const hasCookie = caps.extraSizes;

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
      description: translate("sim.desc.cps", { n: i, profile: cfg.profile }),
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
      description: translate("sim.desc.junk", { i: i + 1, total: cfg.jc }),
    });
  }

  // 3. WireGuard handshake Initiation (client → server)
  const h1 = headerFor(cfg, 1);
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
    description: translate("sim.desc.init", { h1, s1: cfg.s1 }),
    headerProtected: hp,
    encryptedWhole: hp,
  });

  // 4. WireGuard handshake Response (server → client)
  const h2 = headerFor(cfg, 2);
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
    description: translate("sim.desc.response", { h2, s2: cfg.s2 }),
    headerProtected: hp,
    encryptedWhole: hp,
  });

  // 5. Cookie Reply (server → client). Only 2.0 and 3.0 pad it via S3.
  if (hasCookie) {
    const h3 = headerFor(cfg, 3);
    const cookieSize = WG_BASE.cookie + randInt(0, cfg.s3);
    packets.push({
      id: ++id,
      step: "5",
      kind: "cookie",
      label: "Cookie",
      from: "server",
      to: "client",
      size: cookieSize,
      header: h3,
      payload: WG_BASE.cookie,
      description: translate("sim.desc.cookie", { h3, s3: cfg.s3 }),
      headerProtected: hp,
      encryptedWhole: hp,
    });
  }

  // 6. Data packets (both directions)
  for (let i = 0; i < 4; i++) {
    const h4 = headerFor(cfg, 4);
    const payload = randInt(64, 512);

    // 3.0 replaces the pad-to-multiple-of-16 rule with a random addition
    // drawn from ContentPaddingAddition; older versions align to 16.
    const contentPad = cpaRange
      ? randInt(cpaRange[0], cpaRange[1])
      : (16 - (payload % 16)) % 16;

    const size = payload + contentPad + randInt(0, cfg.s4);
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
      description: cpaRange
        ? translate("sim.desc.data3", { h4, s4: cfg.s4, pad: contentPad })
        : translate("sim.desc.data", { h4, s4: cfg.s4 }),
      // Transport packets get only their 16-byte header encrypted.
      headerProtected: hp,
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
    cps: translate("sim.legend.cps"),
    junk: translate("sim.legend.junk"),
    init: translate("sim.legend.init"),
    response: translate("sim.legend.response"),
    cookie: translate("sim.legend.cookie"),
    data: translate("sim.legend.data"),
  };
  return map[kind];
}
