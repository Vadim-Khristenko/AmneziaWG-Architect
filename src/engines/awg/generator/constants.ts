/**
 * AmneziaWG Architect — generator constants (host pools, BFP tables, labels).
 */

import type { BrowserProfile, BfpSlot, MimicProfile } from "./types";

export const YANDEX_UNSTABLE_PROFILES: BrowserProfile[] = [
  "yandex_desktop",
  "yandex_mobile",
];

export const PROFILE_LABELS: Record<MimicProfile, string> = {
  quic_initial: "QUIC Initial",
  quic_0rtt: "QUIC 0-RTT",
  tls_client_hello: "TLS 1.3",
  wireguard_noise: "Noise_IK",
  dtls: "DTLS 1.3",
  http3: "HTTP/3",
  sip: "SIP",
  tls_to_quic: "TLS → QUIC",
  quic_burst: "QUIC Burst",
  dns_query: "DNS Query",
  random: "Random",
};


/**
 * Browser Fingerprint (BFP) — таблицы реальных размеров UDP payload.
 *
 * Слоты:
 *   qi   — QUIC Initial
 *   q0   — QUIC 0-RTT Early Data
 *   h3   — HTTP/3 DATA-пакеты после хендшейка
 *   tls  — TLS 1.3 Client Hello
 *   nx   — WireGuard Noise_IK Initiation
 *   dtls — DTLS 1.2/1.3 Client Hello
 *
 * Формат: [min, max] байт UDP payload (без UDP/IP заголовков).
 */
type BfpTable = Record<BfpSlot, [number, number]>;

export const BFP: Record<string, BfpTable> = {
  chrome: {
    qi: [1250, 1250],
    q0: [1250, 1350],
    h3: [1250, 1350],
    tls: [512, 800],
    nx: [1200, 1250],
    dtls: [1100, 1200],
  },
  edge: {
    qi: [1250, 1250],
    q0: [1250, 1350],
    h3: [1250, 1350],
    tls: [512, 800],
    nx: [1200, 1250],
    dtls: [1100, 1200],
  },
  firefox: {
    qi: [1200, 1252],
    q0: [1200, 1300],
    h3: [1200, 1350],
    tls: [512, 700],
    nx: [1200, 1250],
    dtls: [1050, 1200],
  },
  safari: {
    qi: [1250, 1252],
    q0: [1250, 1300],
    h3: [1250, 1350],
    tls: [512, 750],
    nx: [1200, 1250],
    dtls: [1100, 1200],
  },
  yandex_desktop: {
    qi: [1250, 1250],
    q0: [1250, 1350],
    h3: [1350, 1350],
    tls: [512, 800],
    nx: [1200, 1250],
    dtls: [1100, 1200],
  },
  yandex_mobile: {
    qi: [1232, 1232],
    q0: [1250, 1350],
    h3: [1350, 1350],
    tls: [512, 800],
    nx: [1200, 1250],
    dtls: [1100, 1200],
  },
};
