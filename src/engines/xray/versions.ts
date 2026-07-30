/**
 * Xray-core versions the generator supports, and what each one changed.
 *
 * Xray-core uses CalVer and ships every couple of weeks, so "which version"
 * is a real question for anyone with a server they have not updated. The
 * capability flags below are what the generator branches on; the notes record
 * why a flag exists, taken from the commit that introduced it.
 *
 * The floor is v24.11.11. Below it XHTTP is missing `stream-up` and the
 * upload/download split, which is most of what makes XHTTP worth choosing —
 * a config generated here would name settings the core does not understand.
 * We do not intend to support older cores.
 */

import type { VersionDescriptor } from "@/types/protocol";

export interface XrayVersion extends VersionDescriptor {
  /** ML-DSA-65 post-quantum verification for REALITY. Since v25.7.23. */
  mldsa65: boolean;
  /** VLESS Encryption, the ML-KEM-768 + X25519 layer. Since v25.8.29. */
  vlessEncryption: boolean;
  /** Hysteria as a transport. Since v26.1.13. */
  hysteria: boolean;
  /**
   * XHTTP spells the session knobs `sessionID*`. Before v26.6.22 they were
   * `session*`, so a config for an older core has to use the old names.
   */
  sessionIdNames: boolean;
  /**
   * Stream settings call the transport `method`. Before v26.7.11 the only
   * name was `network`, which is still accepted — so `network` is always
   * safe and `method` only from v26.7.11.
   */
  methodName: boolean;
  /**
   * The core supplies a default `minClientVer` of 26.3.27. Before v26.7.11
   * there was no default, so a config that omits it behaves differently.
   */
  defaultMinClientVer: boolean;
}

/**
 * Newest first. Only versions that changed something the generator emits are
 * listed — there is no value in offering a release that produces byte-identical
 * output to the one above it.
 */
export const XRAY_VERSIONS: readonly XrayVersion[] = [
  {
    id: "26.7.11",
    label: "v26.7.11+",
    isNewest: true,
    mldsa65: true,
    vlessEncryption: true,
    hysteria: true,
    sessionIdNames: true,
    methodName: true,
    defaultMinClientVer: true,
  },
  {
    id: "26.6.22",
    label: "v26.6.22",
    mldsa65: true,
    vlessEncryption: true,
    hysteria: true,
    sessionIdNames: true,
    methodName: false,
    defaultMinClientVer: false,
  },
  {
    id: "26.1.13",
    label: "v26.1.13",
    mldsa65: true,
    vlessEncryption: true,
    hysteria: true,
    sessionIdNames: false,
    methodName: false,
    defaultMinClientVer: false,
  },
  {
    id: "25.8.29",
    label: "v25.8.29",
    mldsa65: true,
    vlessEncryption: true,
    hysteria: false,
    sessionIdNames: false,
    methodName: false,
    defaultMinClientVer: false,
  },
  {
    id: "25.7.23",
    label: "v25.7.23",
    mldsa65: true,
    vlessEncryption: false,
    hysteria: false,
    sessionIdNames: false,
    methodName: false,
    defaultMinClientVer: false,
  },
  {
    id: "24.11.11",
    label: "v24.11.11",
    isLegacy: true,
    isFloor: true,
    mldsa65: false,
    vlessEncryption: false,
    hysteria: false,
    sessionIdNames: false,
    methodName: false,
    defaultMinClientVer: false,
  },
];

export type XrayVersionId = (typeof XRAY_VERSIONS)[number]["id"];

const BY_ID = new Map(XRAY_VERSIONS.map((v) => [v.id, v]));

/**
 * Capabilities for a version.
 *
 * Falls back to the newest entry rather than returning undefined: an unknown
 * string means the caller was handed a version this build predates, and
 * assuming the richest feature set is a better failure than rendering nothing.
 */
export function xrayCaps(version: string): XrayVersion {
  return BY_ID.get(version) ?? XRAY_VERSIONS[0];
}

/** The oldest version offered, for the "anything below this" notice. */
export const XRAY_FLOOR = XRAY_VERSIONS.find((v) => v.isFloor)!;

/** Is this version at or above the floor? */
export function isSupportedVersion(version: string): boolean {
  return BY_ID.has(version);
}
