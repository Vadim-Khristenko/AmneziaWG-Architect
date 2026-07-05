/**
 * AmneziaWG Architect — Generator public types.
 */

export type AWGVersion = "1.0" | "1.5" | "2.0";
export type Intensity = "low" | "medium" | "high";

export type MimicProfile =
  | "quic_initial"
  | "quic_0rtt"
  | "tls_client_hello"
  | "wireguard_noise"
  | "dtls"
  | "http3"
  | "sip"
  | "tls_to_quic"
  | "quic_burst"
  | "dns_query"
  | "random";

export type BrowserProfile =
  | "chrome"
  | "edge"
  | "firefox"
  | "safari"
  | "yandex_desktop"
  | "yandex_mobile"
  | "";

export type BfpSlot = "qi" | "q0" | "h3" | "tls" | "nx" | "dtls";

/** Input parameters for the generator. */
export interface GeneratorInput {
  version: AWGVersion;
  intensity: Intensity;
  profile: MimicProfile;
  customHost: string;
  mimicAll: boolean;

  useTagC: boolean;
  useTagT: boolean;
  useTagR: boolean;
  useTagRC: boolean;
  useTagRD: boolean;

  useBrowserFp: boolean;
  browserProfile: BrowserProfile;
  mtu: number;
  junkLevel: number;

  /** Failed-attempt counter used for automatic strengthening. */
  iterCount: number;

  /** Low-power router mode (minimal noise). */
  routerMode: boolean;

  /** Use extreme parameter ceilings. */
  useExtremeMax: boolean;

  /** Target client for compatibility filtering. */
  clientId: string;
}

/** Generated AmneziaWG obfuscation configuration. */
export interface AWGConfig {
  version: AWGVersion;
  profile: MimicProfile;

  // Dynamic header ranges (AWG 2.0)
  h1: string;
  h2: string;
  h3: string;
  h4: string;

  // Single header values (AWG 1.x)
  h1s: number;
  h2s: number;
  h3s: number;
  h4s: number;

  // Packet size prefixes
  s1: number;
  s2: number;
  s3: number;
  s4: number;

  // Junk train
  jc: number;
  jmin: number;
  jmax: number;

  // CPS signature chain
  i1: string;
  i2: string;
  i3: string;
  i4: string;
  i5: string;
}

/** Validation result for a single AWG parameter. */
export interface ValidationFinding {
  field: string;
  level: "error" | "warn";
  msg: string;
}

/** Compatibility descriptor for a concrete AWG client implementation. */
export interface ClientCapability {
  id: string;
  name: string;
  platforms: string[];
  /** Maximum accepted H value (INT32_MAX or UINT32_MAX). */
  maxHValue: number;
  supportsS3S4: boolean;
  supportsCpsTagC: boolean;
  supportsCpsTagRC: boolean;
  supportsCpsTagRD: boolean;
  supportsI1I5: boolean;
  maxJc: number;
  maxS4: number;
  knownIssues: string[];
}
