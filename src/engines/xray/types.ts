/**
 * XRay generator input and output.
 *
 * Shaped after what Xray-core actually accepts rather than after AmneziaWG's
 * model: there is no counterpart here to Jc or S1–S4, and the interesting
 * choices are structural — which transport, which security layer, whether the
 * uplink and downlink travel the same way.
 */

import type { XrayVersionId } from "./versions";

/* ── Choices ──────────────────────────────────────────────────────────────── */

/**
 * Transport, under the names the core accepts today.
 *
 * `raw` and `xhttp` are the current spellings of `tcp` and `splithttp`. gRPC,
 * WebSocket and HTTPUpgrade still work but the core prints a deprecation
 * notice pointing at XHTTP, so they are offered only for existing servers.
 */
export type XrayTransport = "raw" | "xhttp" | "grpc" | "ws" | "httpupgrade";

/** Transports REALITY can sit on: "REALITY only supports RAW, XHTTP and gRPC". */
export const REALITY_TRANSPORTS: readonly XrayTransport[] = [
  "raw",
  "xhttp",
  "grpc",
];

/** The security layer wrapping the stream. */
export type XraySecurity = "reality" | "tls" | "none";

/**
 * VLESS flow. Exactly two values exist; anything else is "unknown request
 * flow". Vision needs TLS 1.3 underneath, refuses UDP, and must match on both
 * ends.
 */
export type XrayFlow = "" | "xtls-rprx-vision";

/**
 * XHTTP mode. `auto` resolves in the core: `packet-up` normally, `stream-one`
 * under REALITY, `stream-up` when a separate download transport is set.
 */
export type XhttpMode = "auto" | "packet-up" | "stream-up" | "stream-one";

/** Where XHTTP hides a piece of itself. Seven slots, from common.go. */
export type XhttpPlacement =
  | "auto"
  | "queryInHeader"
  | "cookie"
  | "header"
  | "query"
  | "path"
  | "body";

/** VLESS Encryption mode, the middle element of the decryption string. */
export type VlessEncryptionMode = "native" | "xorpub" | "random";

import type { FinalMaskConfig, FinalMaskInput } from "./finalmask";

/* ── Input ────────────────────────────────────────────────────────────────── */

/** XHTTP knobs, grouped the way the panels group them. */
export interface XhttpSettings {
  mode: XhttpMode;
  /** Request path. Always starts with a slash. */
  path: string;
  /** Host header, when it should differ from the address. */
  host: string;

  /** Padding, six knobs the core exposes separately. */
  paddingBytes: string;
  paddingObfsMode: boolean;
  paddingPlacement: XhttpPlacement;

  /** Session identity. */
  sessionIdPlacement: XhttpPlacement;
  sessionIdLength: string;

  /** Mimicry: dropping these headers makes the stream look less like gRPC/SSE. */
  noGrpcHeader: boolean;
  noSseHeader: boolean;

  /** Multiplexing. */
  xmuxMaxConcurrency: string;
  xmuxMaxConnections: string;

  /** Send the downlink over its own transport. Turns `auto` into `stream-up`. */
  splitDownload: boolean;
}

/** Everything the user chooses. */
export interface XrayInput {
  version: XrayVersionId;

  /** Server address and port, as they will appear in the client config. */
  address: string;
  port: number;

  transport: XrayTransport;
  security: XraySecurity;
  flow: XrayFlow;

  /** REALITY target: the site the handshake is dressed as. */
  dest: string;
  /** Names offered as SNI. The first is what a client uses. */
  serverNames: string[];
  /** PROXY protocol version in front of the target: 0, 1 or 2. */
  xver: number;

  /** How many shortIds to issue, and how long each is (hex characters). */
  shortIdCount: number;
  shortIdLength: number;

  /** Post-quantum verification, where the version supports it. */
  useMldsa65: boolean;

  /** VLESS Encryption instead of, or beside, the TLS layer. */
  useVlessEncryption: boolean;
  vlessEncryptionMode: VlessEncryptionMode;
  /** Ticket lifetime, seconds; a range widens it. */
  vlessEncryptionSeconds: string;

  /** Browser to imitate, resolved through the shared fingerprint registry. */
  fingerprint: string;
  /** Pin the exact uTLS profile rather than the rolling alias. */
  pinFingerprint: boolean;

  xhttp: XhttpSettings;

  /**
   * FinalMask: XRay's own obfuscation, below the transport.
   *
   * The closest thing the core has to what AmneziaWG does — junk packets and
   * fragmentation, rather than hiding inside another protocol.
   */
  finalMask: FinalMaskInput;

  /** How many client UUIDs to issue. */
  clientCount: number;
}

/* ── Output ───────────────────────────────────────────────────────────────── */

/** A REALITY key pair, both halves in the encoding the core wants. */
export interface RealityKeys {
  /** base64 RawURL, 32 bytes. Server side. */
  privateKey: string;
  /** base64 RawURL, 32 bytes. Client side, named `password` in newer cores. */
  publicKey: string;
}

/** ML-DSA-65 pair. The verify half is 1952 bytes, which is not a typo. */
export interface Mldsa65Keys {
  seed: string;
  verify: string;
}

/** One client identity. */
export interface XrayClient {
  id: string;
  flow: XrayFlow;
  /** Present only when VLESS Encryption is on. */
  encryption?: string;
}

/**
 * A generated configuration.
 *
 * Holds both halves — what goes on the server and what goes to the client —
 * because they are generated together and only make sense as a pair.
 */
export interface XrayConfig {
  version: XrayVersionId;

  address: string;
  port: number;
  transport: XrayTransport;
  security: XraySecurity;
  flow: XrayFlow;

  clients: XrayClient[];

  /** REALITY block. Absent when security is not reality. */
  reality?: {
    dest: string;
    serverNames: string[];
    xver: number;
    keys: RealityKeys;
    shortIds: string[];
    mldsa65?: Mldsa65Keys;
    fingerprint: string;
    spiderX: string;
    /** Only set when the version supplies no default of its own. */
    minClientVer?: string;
  };

  /** VLESS Encryption strings: `decryption` for the server, `encryption` per client. */
  vlessEncryption?: {
    decryption: string;
    encryption: string;
  };

  /** XHTTP block. Absent for other transports. */
  xhttp?: XhttpSettings & { resolvedMode: Exclude<XhttpMode, "auto"> };

  /**
   * FinalMask: XRay obfuscating its own traffic, below the transport.
   *
   * Absent when no mask is chosen. This is the closest XRay comes to what
   * AmneziaWG does — changing the shape of the bytes rather than hiding them
   * inside another protocol.
   */
  finalMask?: FinalMaskConfig;
}
