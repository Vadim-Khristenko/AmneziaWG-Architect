/**
 * AmneziaWG Architect — AmneziaWG client compatibility matrix.
 *
 * Source data: upstream amneziawg-android, amneziawg-windows, amneziawg-go,
 * AmneziaVPN desktop/mobile, community firmware packages and user reports.
 *
 * The shape comes from `shared/clients`, so the same model can describe an
 * XRay core later. What it adds over a flat table is the second axis: a client
 * is not one set of limits forever. AmneziaWG for Windows refused H values
 * above 2^31-1 until v2.0.2 and takes the full range after it, and a single
 * entry could only describe one of those — so it described the broken one for
 * everybody, including people on a current build.
 */

import {
  clientTable,
  releaseOptions,
  resolveClient,
  type ClientProfile,
  type ResolvedClient,
} from "@/shared/clients";
import type { ClientCapability } from "./types";

/** What an AmneziaWG client will and will not accept. */
export interface AwgClientLimits {
  /** Largest H value the client accepts. */
  maxHValue: number;
  supportsS3S4: boolean;
  supportsCpsTagC: boolean;
  supportsCpsTagRC: boolean;
  supportsCpsTagRD: boolean;
  supportsI1I5: boolean;
  maxJc: number;
  maxS4: number;
}

/** The protocol's own ceiling: H values are unsigned 32-bit. */
const UINT32_MAX = 4_294_967_295;

/** What amneziawg-windows accepted before v2.0.2. */
const INT32_MAX = 2_147_483_647;

/** A client with nothing unusual about it, for the entries that differ little. */
const FULL: AwgClientLimits = {
  maxHValue: UINT32_MAX,
  supportsS3S4: true,
  supportsCpsTagC: true,
  supportsCpsTagRC: true,
  supportsCpsTagRD: true,
  supportsI1I5: true,
  maxJc: 10,
  maxS4: 32,
};

/** No CPS tags beyond the basics. */
const NO_CPS_TAGS = {
  supportsCpsTagC: false,
  supportsCpsTagRC: false,
  supportsCpsTagRD: false,
} as const;

export const AWG_CLIENT_PROFILES: readonly ClientProfile<AwgClientLimits>[] = [
  {
    id: "amneziawg-android",
    name: "AmneziaWG Android",
    platforms: ["Android 5+"],
    limits: { ...FULL },
  },
  {
    id: "amneziawg-ios",
    name: "AmneziaWG iOS",
    platforms: ["iOS 15+"],
    limits: { ...FULL },
  },
  {
    id: "amneziawg-windows",
    name: "AmneziaWG Windows",
    platforms: ["Windows 10+"],
    // v2.0.2 raised the editor's H bound from 2^31-1 to the full uint32 the
    // protocol has always used (PR #87, commit c9740b17). Current builds are
    // like everything else, so that is the baseline.
    limits: { ...FULL, ...NO_CPS_TAGS },
    releases: [
      {
        id: "<2.0.2",
        label: "client.release.upTo",
        labelParams: { version: "2.0.2" },
        limits: { maxHValue: INT32_MAX },
        notes: ["client.note.windowsHCap"],
      },
    ],
  },
  {
    id: "amneziavpn",
    name: "Amnezia VPN",
    platforms: ["Android", "iOS", "Windows", "macOS", "Linux"],
    limits: { ...FULL },
  },
  {
    id: "wg-tunnel",
    name: "WG Tunnel",
    platforms: ["Android"],
    limits: { ...FULL, ...NO_CPS_TAGS },
    notes: ["client.note.wgTunnelBattery"],
  },
  {
    id: "wiresock",
    name: "WireSock",
    platforms: ["Windows"],
    limits: { ...FULL, ...NO_CPS_TAGS },
  },
  {
    id: "keenetic-native",
    name: "Keenetic (native)",
    platforms: ["Keenetic OS 4.x"],
    limits: { ...FULL, maxJc: 128 },
    notes: ["client.note.keeneticI1"],
  },
  {
    id: "awg-go-legacy",
    name: "amneziawg-go (legacy)",
    platforms: ["Linux", "macOS"],
    limits: { ...FULL, ...NO_CPS_TAGS, maxJc: 128 },
    notes: ["client.note.awgGoTagC"],
  },
  {
    id: "openwrt",
    name: "OpenWRT",
    platforms: ["OpenWrt"],
    limits: { ...FULL, maxJc: 128 },
  },
  {
    id: "asus-merlin",
    name: "ASUS Merlin",
    platforms: ["Asuswrt-Merlin"],
    limits: { ...FULL, maxJc: 128 },
  },
];

const { table: PROFILES, ids } = clientTable(AWG_CLIENT_PROFILES);

export const CLIENT_IDS = ids;

/** Default recommended client for new users. */
export const DEFAULT_CLIENT_ID = "amneziavpn";

/** The profile behind an id, falling back to the default. */
export function clientProfile(id: string): ClientProfile<AwgClientLimits> {
  return PROFILES[id] ?? PROFILES[DEFAULT_CLIENT_ID]!;
}

/**
 * Limits for a client, optionally for one of its older builds.
 *
 * This is what the generator and the validators call. Passing no release
 * means the current build, which is what someone who installed the client
 * today has.
 */
export function clientCaps(
  id: string,
  release?: string | null,
): ResolvedClient<AwgClientLimits> {
  return resolveClient(clientProfile(id), release);
}

/** Builds selectable for a client, current first. */
export function clientReleases(id: string) {
  return releaseOptions(clientProfile(id));
}

/**
 * The old flat table, still exported.
 *
 * Everything that only wants "the current build's limits" reads this and does
 * not need to know releases exist. It resolves at the newest behaviour, which
 * is what the flat table meant before releases were added — except for
 * Windows, where it now means the fixed build rather than the broken one.
 */
export const CLIENTS: Record<string, ClientCapability> = Object.fromEntries(
  AWG_CLIENT_PROFILES.map((profile) => {
    const resolved = resolveClient(profile);
    return [
      profile.id,
      {
        id: resolved.id,
        name: resolved.name,
        platforms: [...resolved.platforms],
        ...resolved.limits,
        knownIssues: [...resolved.notes],
      } satisfies ClientCapability,
    ];
  }),
);
