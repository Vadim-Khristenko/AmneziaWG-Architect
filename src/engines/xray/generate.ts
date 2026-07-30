/**
 * Producing an XRay configuration.
 *
 * Every constraint here came out of Xray-core's own parser rather than the
 * documentation — `infra/conf/transport_security.go` for REALITY,
 * `proxy/vless/inbound/inbound.go` for flow, `transport/internet/splithttp`
 * for XHTTP. Where the core would reject a value, this refuses to emit it.
 */

import { cryptoBytes, cryptoRnd, cryptoPick } from "@/shared/rng";
import { generateX25519Pair, toBase64Url } from "@/shared/x25519";
import { bytesToHex } from "@/shared/hex";
import { fingerprintById } from "@/shared/fingerprints";
import { xrayCaps, type XhttpModeSupport } from "./versions";
import { REALITY_TRANSPORTS } from "./types";
import type {
  XrayConfig,
  XrayInput,
  XrayClient,
  XhttpMode,
  XhttpSettings,
} from "./types";

/* ── Small pieces ─────────────────────────────────────────────────────────── */

/** RFC 4122 version 4, from the crypto source rather than Math.random. */
export function uuidV4(): string {
  const b = cryptoBytes(16);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = bytesToHex(b);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

/**
 * A REALITY shortId.
 *
 * The core decodes it with `hex.Decode` into an 8-byte buffer and rejects
 * anything longer than 16 characters, so the length is even and capped. An
 * odd length would fail to decode — which is why this takes bytes and doubles
 * rather than taking a character count directly.
 */
export function makeShortId(hexChars: number): string {
  const even = Math.max(2, Math.min(16, hexChars - (hexChars % 2)));
  return bytesToHex(cryptoBytes(even / 2));
}

/**
 * The VLESS Encryption string.
 *
 * Format from `infra/conf/vless.go`: `mlkem768x25519plus.<mode>.<seconds>`
 * followed by key material, where an element shorter than 20 characters is
 * padding and anything longer must decode to 32 or 64 bytes.
 */
export function makeVlessEncryption(
  mode: string,
  seconds: string,
): { decryption: string; encryption: string } {
  const key = toBase64Url(cryptoBytes(32));
  const head = `mlkem768x25519plus.${mode}.${seconds}`;
  return {
    decryption: `${head}.${key}`,
    encryption: `${head}.${key}`,
  };
}

/**
 * Resolve XHTTP's `auto`.
 *
 * The core does this in `splithttp/dialer.go`: `packet-up` normally,
 * `stream-one` under REALITY, and `stream-up` when a separate download
 * transport is configured. Resolving it here means the config records what
 * will actually happen rather than leaving the reader to work it out.
 */
export function resolveXhttpMode(
  mode: XhttpMode,
  isReality: boolean,
  splitDownload: boolean,
  supported: XhttpModeSupport = ALL_XHTTP_MODES,
): Exclude<XhttpMode, "auto"> {
  const wanted = pickXhttpMode(mode, isReality, splitDownload);
  if (supported.includes(wanted)) return wanted;

  // v24.11.11 has no `stream-one`, and a config naming it does not load at
  // all. `stream-up` is the closest thing that core has: still a streamed
  // upload, just with the download on its own request.
  if (wanted === "stream-one" && supported.includes("stream-up")) {
    return "stream-up";
  }
  return supported[0] ?? "packet-up";
}

function pickXhttpMode(
  mode: XhttpMode,
  isReality: boolean,
  splitDownload: boolean,
): Exclude<XhttpMode, "auto"> {
  if (mode !== "auto") return mode;
  if (!isReality) return "packet-up";
  return splitDownload ? "stream-up" : "stream-one";
}

const ALL_XHTTP_MODES: XhttpModeSupport = [
  "packet-up",
  "stream-up",
  "stream-one",
];

/* ── Defaults ─────────────────────────────────────────────────────────────── */

/** Paths that look like something a real site would serve. */
const PLAUSIBLE_PATHS = [
  "/api/v1/stream",
  "/assets/chunk",
  "/media/segment",
  "/static/bundle",
  "/cdn/asset",
];

export function defaultXhttp(): XhttpSettings {
  return {
    mode: "auto",
    path: cryptoPick(PLAUSIBLE_PATHS),
    host: "",
    paddingBytes: "100-1000",
    paddingObfsMode: false,
    paddingPlacement: "auto",
    sessionIdPlacement: "auto",
    sessionIdLength: "8-16",
    noGrpcHeader: false,
    noSseHeader: false,
    xmuxMaxConcurrency: "16-32",
    xmuxMaxConnections: "0",
    splitDownload: false,
  };
}

/** Settings a fresh visitor starts from: REALITY over RAW with Vision. */
export function createDefaults(): XrayInput {
  return {
    version: "26.7.11",
    address: "",
    port: 443,
    transport: "raw",
    security: "reality",
    flow: "xtls-rprx-vision",
    dest: "www.cloudflare.com:443",
    serverNames: ["www.cloudflare.com"],
    xver: 0,
    shortIdCount: 3,
    shortIdLength: 8,
    useMldsa65: false,
    useVlessEncryption: false,
    vlessEncryptionMode: "native",
    vlessEncryptionSeconds: "0-600",
    fingerprint: "chrome",
    pinFingerprint: false,
    xhttp: defaultXhttp(),
    clientCount: 1,
  };
}

/* ── Generation ───────────────────────────────────────────────────────────── */

/**
 * Build a configuration.
 *
 * Choices the core would refuse are corrected rather than emitted: Vision is
 * dropped when the security layer cannot carry it, and REALITY is dropped on
 * a transport it does not support. Validation still reports the correction, so
 * the user is told rather than silently overridden.
 */
export function generateXray(input: XrayInput): XrayConfig {
  const caps = xrayCaps(input.version);

  // "XTLS only supports TLS and REALITY directly for now" — vision over a
  // bare transport is refused by the core, so it is not produced here.
  const canVision = input.security === "reality" || input.security === "tls";
  const flow = canVision ? input.flow : "";

  // "REALITY only supports RAW, XHTTP and gRPC for now."
  const security =
    input.security === "reality" &&
    !REALITY_TRANSPORTS.includes(input.transport)
      ? "tls"
      : input.security;

  const clients: XrayClient[] = [];
  const encryption = input.useVlessEncryption && caps.vlessEncryption
    ? makeVlessEncryption(input.vlessEncryptionMode, input.vlessEncryptionSeconds)
    : undefined;

  for (let i = 0; i < Math.max(1, input.clientCount); i++) {
    clients.push({
      id: uuidV4(),
      flow,
      ...(encryption ? { encryption: encryption.encryption } : {}),
    });
  }

  const config: XrayConfig = {
    version: input.version,
    address: input.address,
    port: input.port,
    transport: input.transport,
    security,
    flow,
    clients,
    ...(encryption ? { vlessEncryption: encryption } : {}),
  };

  if (security === "reality") {
    const fp = fingerprintById(input.fingerprint);
    const utls = fp?.utls;
    const fingerprint =
      input.pinFingerprint && utls?.modern
        ? utls.modern
        : (utls?.preset ?? "chrome");

    const shortIds = Array.from(
      { length: Math.max(1, input.shortIdCount) },
      () => makeShortId(input.shortIdLength),
    );

    config.reality = {
      dest: input.dest,
      serverNames: [...input.serverNames],
      xver: input.xver,
      keys: generateX25519Pair(),
      shortIds,
      fingerprint,
      // The core defaults spiderX to "/" and requires a leading slash.
      spiderX: "/",
      // v25.7.23 rejects a REALITY inbound that has no seed, so on that core
      // the seed is not a choice — asking for it off produces a config the
      // core will not load.
      ...(caps.mldsa65 === "required" ||
      (input.useMldsa65 && caps.mldsa65 === "optional")
        ? {
            mldsa65: {
              seed: toBase64Url(cryptoBytes(32)),
              // The 1952-byte verification key is derived by ML-DSA-65 itself.
              // Deriving it needs the algorithm, which this page does not
              // carry, so the field is left for `xray mldsa65` to fill and the
              // validator says so rather than emitting something wrong.
              verify: "",
            },
          }
        : {}),
      ...(caps.defaultMinClientVer ? {} : { minClientVer: "24.11.11" }),
    };
  }

  if (input.transport === "xhttp") {
    config.xhttp = {
      ...input.xhttp,
      resolvedMode: resolveXhttpMode(
        input.xhttp.mode,
        security === "reality",
        input.xhttp.splitDownload,
        caps.xhttpModes,
      ),
    };
  }

  return config;
}

/** Several independent configurations, for provisioning more than one server. */
export function generateXrayBatch(
  input: XrayInput,
  count: number,
): XrayConfig[] {
  return Array.from({ length: count }, () => generateXray(input));
}

/** Kept for symmetry with the AmneziaWG generator's random helpers. */
export { cryptoRnd as xrayRandomInt };
