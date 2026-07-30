/**
 * What a protocol's traffic looks like on the wire, described once.
 *
 * The packet simulator started as an AmneziaWG feature and its types said so:
 * a `PacketKind` union of AWG's six message types, a totals object with
 * `handshakeBytes` in it, and colours hard-coded in a switch. None of that is
 * about AmneziaWG in particular — every protocol worth simulating has kinds of
 * packet, some of which carry payload and some of which are the cost of
 * hiding it.
 *
 * So the vocabulary lives here and each engine supplies its own kinds. Adding
 * XRay — or anything after it — is a table of kinds and a function that
 * produces packets, not a second copy of the model.
 */

import type { Localised } from "@/i18n/types";

/** Which side sent, or is receiving, a packet. */
export type Endpoint = "client" | "server";

/**
 * Whether a kind of packet is the point of the connection or the price of it.
 *
 * Totals are derived from this rather than from a list of kind names, so an
 * engine that adds a kind gets it counted without touching the summary code.
 */
export type PacketWeight = "payload" | "overhead";

/**
 * One kind of packet a protocol can emit.
 *
 * `id` is free-form because the set differs per protocol: AmneziaWG has
 * `init`/`response`/`cookie`, XRay has a TLS handshake and application data.
 * The engine's kind table is the authority on what ids exist.
 */
export interface PacketKind {
  id: string;
  /** Short name for the legend and the packet list. */
  label: string;
  /** Colour for timelines and badges. A CSS colour, not a token name. */
  accent: string;
  /** Translation key for the one-line legend entry. */
  descriptionKey: string;
  weight: PacketWeight;
}

/** A kind table, indexed for lookup. */
export type PacketKindTable = Readonly<Record<string, PacketKind>>;

/**
 * One simulated packet.
 *
 * `extra` is where a protocol puts what only it has — AmneziaWG's header
 * protection flags, XRay's transport frame type — without every other
 * protocol's packets carrying fields that are always undefined.
 */
export interface SimPacket<Extra = unknown> {
  id: number;
  /** Step order as shown to the user, e.g. "1", "2a", "2b". */
  step: string;
  /** An id from the engine's kind table. */
  kind: string;
  label: string;
  from: Endpoint;
  to: Endpoint;
  /** Bytes on the wire, including whatever the protocol prefixes. */
  size: number;
  /** Bytes of payload inside `size`. */
  payload: number;
  /** Localised one-line description. */
  description: string;
  extra?: Extra;
}

/** What the packets add up to. */
export interface SimTotals {
  totalBytes: number;
  /** Bytes of packets whose kind is `payload`. */
  payloadBytes: number;
  /** Everything else: padding, junk, handshake, framing. */
  overheadBytes: number;
  /** Per-kind byte counts, keyed by kind id. */
  byKind: Readonly<Record<string, number>>;
  /**
   * Overhead as a share of the total, 0–1.
   *
   * Reported rather than left to each caller: "how much of this is not my
   * data" is the question the simulator exists to answer, and a view that
   * computes it itself will eventually compute it differently.
   */
  overheadShare: number;
}

export interface SimResult<Extra = unknown> {
  packets: SimPacket<Extra>[];
  totals: SimTotals;
  /** Seconds to put `totalBytes` on a 10 Mbit/s upstream. */
  estSeconds10mbps: number;
}

/** A protocol's simulator, as the shell sees it. */
export interface Simulator<Config, Extra = unknown> {
  /** Every kind this simulator can produce. */
  kinds: PacketKindTable;
  /** Kind ids in the order they should appear in a legend. */
  legend: readonly string[];
  simulate(config: Config): SimResult<Extra>;
}

/* ── Deriving the summary ─────────────────────────────────────────────────── */

/** Upstream used for the duration estimate. */
const REFERENCE_MBPS = 10;

/**
 * Add up a run of packets against a kind table.
 *
 * A packet whose kind is not in the table counts toward the total and toward
 * overhead: an unknown kind is a bug in the engine, and quietly dropping its
 * bytes would make the numbers look better than the traffic is.
 */
export function summarise(
  packets: readonly SimPacket<unknown>[],
  kinds: PacketKindTable,
): SimTotals {
  const byKind: Record<string, number> = {};
  let totalBytes = 0;
  let payloadBytes = 0;

  for (const packet of packets) {
    totalBytes += packet.size;
    byKind[packet.kind] = (byKind[packet.kind] ?? 0) + packet.size;
    if (kinds[packet.kind]?.weight === "payload") payloadBytes += packet.size;
  }

  const overheadBytes = totalBytes - payloadBytes;
  return {
    totalBytes,
    payloadBytes,
    overheadBytes,
    byKind,
    overheadShare: totalBytes === 0 ? 0 : overheadBytes / totalBytes,
  };
}

/** Seconds to send `bytes` at the reference upstream, to the millisecond. */
export function estimateSeconds(
  bytes: number,
  mbps: number = REFERENCE_MBPS,
): number {
  return Number(((bytes * 8) / (mbps * 1_000_000)).toFixed(3));
}

/** Build a result from packets alone, so no engine sums its own bytes. */
export function toResult<Extra>(
  packets: SimPacket<Extra>[],
  kinds: PacketKindTable,
): SimResult<Extra> {
  const totals = summarise(packets, kinds);
  return {
    packets,
    totals,
    estSeconds10mbps: estimateSeconds(totals.totalBytes),
  };
}

/** Index a list of kinds by id, preserving the list as the legend order. */
export function kindTable(kinds: readonly PacketKind[]): {
  table: PacketKindTable;
  legend: readonly string[];
} {
  const table: Record<string, PacketKind> = {};
  for (const kind of kinds) table[kind.id] = kind;
  return { table, legend: kinds.map((k) => k.id) };
}

/**
 * Kind labels are written in the engine's table, but a protocol may want them
 * translated. Re-exported here so an engine does not reach into i18n for the
 * one type it needs.
 */
export type LocalisedLabel = Localised<string>;
