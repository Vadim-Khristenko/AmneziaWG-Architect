/**
 * Every AmneziaWG parameter, described once.
 *
 * Until now a parameter existed in four places at once: a field on AWGConfig,
 * a branch in the generator, a line in the renderer and a rule in a validator.
 * Nothing tied them together, so "which version has S3" was answered by
 * reading code in four files and hoping they agreed.
 *
 * This is the single description. Each entry carries what the parameter is,
 * which version introduced it, what shape its value takes, and — the part that
 * matters most in practice — whether both ends have to agree on it. That last
 * field is not a convention we invented: it follows from how amneziawg-go
 * parses an incoming packet, and getting it wrong is what makes a tunnel fail
 * silently. See [[xray-core-constraints]] for the same treatment of XRay.
 *
 * The per-version sets below are derived from this catalogue rather than
 * written out, so a parameter cannot be added to one and forgotten in another.
 *
 * TODO: validators are still grouped by concern (sizes, client limits, the 3.0
 * block) rather than attached to the parameters they check. Binding each rule
 * to its AWGParameter is the next step — then "what is checked about S4" has
 * one answer instead of three call sites.
 */

import type { AWGVersion } from "./types";

/* ── What a parameter is ──────────────────────────────────────────────────── */

/**
 * Who has to know the value.
 *
 * Derived from `DeterminePacketTypeAndPadding` in amneziawg-go's
 * `device/receive.go`: the receiver identifies a packet using *its own* S and
 * H values, so those must match on both ends. Junk packets and the I chain are
 * only ever sent, never parsed — landing in the Unknown branch is their whole
 * purpose — so each side may set them freely.
 */
export type AWGParamScope =
  /** Both ends must carry the identical value or the tunnel fails silently. */
  | "shared"
  /** Applied by whoever sends; the other end neither knows nor cares. */
  | "sender"
  /** Local policy. No agreement needed, though extremes cause churn. */
  | "local";

/** The shape a value takes, which is what a validator and an input need. */
export type AWGParamKind =
  /** A plain count or size: Jc, S1. */
  | "int"
  /** Two integers as "lo-hi": H1 on 2.0+, ContentPaddingAddition. */
  | "range"
  /** A single large integer: H1 on 1.x. */
  | "header"
  /** A CPS chain of tags and hex blobs: I1–I5. */
  | "chain"
  /** Base64 key material: HeaderProtectionKey. */
  | "key"
  /** A "lo-hi" range of seconds or attempts: the 3.0 timers. */
  | "duration";

/** One AmneziaWG parameter, independent of any particular config. */
export interface AWGParameter {
  /** As written in the `.conf`: "Jc", "S1", "HeaderProtectionKey". */
  key: string;
  kind: AWGParamKind;
  scope: AWGParamScope;
  /** First protocol version that understands it. */
  since: AWGVersion;
  /**
   * Field on AWGConfig holding the value. Named separately because H1 lives in
   * `h1` when ranged and `h1s` when single — the wire name is one thing, the
   * storage another.
   */
  field: string;
  /** Bounds the protocol itself imposes, where there are any. */
  min?: number;
  max?: number;
  /**
   * Where the rule comes from, so a future reader can check it rather than
   * trust it. Empty when the parameter has no constraint beyond its shape.
   */
  source?: string;
  /** Short note on why the parameter exists, for tooltips and the field guide. */
  note?: string;
}

/* ── The catalogue ────────────────────────────────────────────────────────── */

/**
 * Ordered as a config is written, not alphabetically: headers, sizes, junk,
 * the CPS chain, then the 3.0 block. Renderers and forms both read in this
 * order, so the order is part of the data.
 */
export const AWG_PARAMETERS: readonly AWGParameter[] = [
  // ── Headers ──────────────────────────────────────────────────────────────
  ...(["1", "2", "3", "4"] as const).map(
    (n): AWGParameter => ({
      key: `H${n}`,
      kind: "header",
      scope: "shared",
      since: "1.0",
      field: `h${n}s`,
      note: "Магический заголовок пакета. Один и тот же на обеих сторонах.",
      source: "device/receive.go: DeterminePacketTypeAndPadding",
    }),
  ),
  ...(["1", "2", "3", "4"] as const).map(
    (n): AWGParameter => ({
      key: `H${n}`,
      kind: "range",
      scope: "shared",
      since: "2.0",
      field: `h${n}`,
      note: "Диапазон заголовков: значение выбирается случайно для каждого пакета.",
      source: "device/receive.go: header.Contains(...)",
    }),
  ),

  // ── Packet sizes ─────────────────────────────────────────────────────────
  {
    key: "S1",
    kind: "int",
    scope: "shared",
    since: "1.0",
    field: "s1",
    note: "Случайный паддинг перед handshake initiation.",
    source: "device/receive.go: size == padding + MessageInitiationSize",
  },
  {
    key: "S2",
    kind: "int",
    scope: "shared",
    since: "1.0",
    field: "s2",
    note: "Паддинг перед handshake response.",
    source: "device/receive.go: size == padding + MessageResponseSize",
  },
  {
    key: "S3",
    kind: "int",
    scope: "shared",
    since: "2.0",
    field: "s3",
    note: "Паддинг перед cookie reply.",
    source: "device/receive.go: size == padding + MessageCookieReplySize",
  },
  {
    key: "S4",
    kind: "int",
    scope: "shared",
    since: "2.0",
    field: "s4",
    max: 32,
    note: "Паддинг транспортных пакетов. Протокол ограничивает его 32 байтами.",
    source: "amneziawg-tools src/config.c",
  },

  // ── Junk train ───────────────────────────────────────────────────────────
  {
    key: "Jc",
    kind: "int",
    scope: "sender",
    since: "1.0",
    field: "jc",
    note: "Сколько мусорных пакетов уходит перед рукопожатием.",
    source: "device/send.go: peer.device.JunkPackets()",
  },
  {
    key: "Jmin",
    kind: "int",
    scope: "sender",
    since: "1.0",
    field: "jmin",
    note: "Нижняя граница размера мусорного пакета.",
  },
  {
    key: "Jmax",
    kind: "int",
    scope: "sender",
    since: "1.0",
    field: "jmax",
    note: "Верхняя граница размера мусорного пакета.",
  },

  // ── CPS chain ────────────────────────────────────────────────────────────
  ...(["1", "2", "3", "4", "5"] as const).map(
    (n): AWGParameter => ({
      key: `I${n}`,
      kind: "chain",
      scope: "sender",
      since: "1.5",
      field: `i${n}`,
      note: "Поддельный пакет, уходящий до рукопожатия. Получатель его не разбирает.",
      source: "device/send.go: peer.device.ipackets",
    }),
  ),

  // ── AWG 3.0 ──────────────────────────────────────────────────────────────
  {
    key: "HeaderProtectionKey",
    kind: "key",
    scope: "shared",
    since: "3.0",
    field: "awg3.headerProtectionKey",
    note: "Ключ ChaCha20 для шифрования заголовков. Nonce берётся из первых 12 байт S-паддинга.",
    source: "noise-protocol.go: HeaderProtectionCipher",
  },
  {
    key: "ContentPaddingAddition",
    kind: "range",
    scope: "sender",
    since: "3.0",
    field: "awg3.contentPaddingAddition",
    note: "Случайный паддинг внутри шифрованной нагрузки. Получателю знать его не нужно.",
    source: "device/send.go: randomPaddingAddition",
  },
  ...(
    [
      ["RekeyAfterTime", "rekeyAfterTime"],
      ["RekeyTimeout", "rekeyTimeout"],
      ["RejectAfterTime", "rejectAfterTime"],
      ["KeepaliveTimeout", "keepaliveTimeout"],
      ["MaxHandshakeAttempts", "maxHandshakeAttempts"],
    ] as const
  ).map(
    ([key, field]): AWGParameter => ({
      key,
      kind: "duration",
      scope: "local",
      since: "3.0",
      field: `awg3.${field}`,
      note: "Таймер протокола. У каждой стороны свой.",
      source: "device/timers.go",
    }),
  ),
] as const;

/* ── Per-version sets ─────────────────────────────────────────────────────── */

/** Versions in order, so "everything up to X" is a prefix. */
const ORDER: readonly AWGVersion[] = ["1.0", "1.5", "2.0", "3.0"];

/**
 * Parameters a version understands.
 *
 * Ranged headers replace single ones rather than joining them, so a version
 * never carries both spellings of H1: the later `kind` wins.
 */
function setFor(version: AWGVersion): readonly AWGParameter[] {
  const upto = ORDER.slice(0, ORDER.indexOf(version) + 1);
  const available = AWG_PARAMETERS.filter((p) => upto.includes(p.since));

  const byKey = new Map<string, AWGParameter>();
  for (const p of available) {
    const seen = byKey.get(p.key);
    if (!seen || ORDER.indexOf(p.since) >= ORDER.indexOf(seen.since)) {
      byKey.set(p.key, p);
    }
  }
  // Catalogue order is meaningful, so rebuild in it rather than in Map order.
  return AWG_PARAMETERS.filter((p) => byKey.get(p.key) === p);
}

/** AmneziaWG 1.0 — junk train, single headers, S1 and S2. */
export const AWGParamSet1 = setFor("1.0");

/** AmneziaWG 1.5 — adds the I1–I5 chain, sent by the client only. */
export const AWGParamSet15 = setFor("1.5");

/** AmneziaWG 2.0 — adds S3, S4 and turns the headers into ranges. */
export const AWGParamSet2 = setFor("2.0");

/** AmneziaWG 3.0 — adds header protection, content padding and the timers. */
export const AWGParamSet3 = setFor("3.0");

/** Lookup by version, for code that has the version as a value. */
export const AWG_PARAM_SETS: Record<AWGVersion, readonly AWGParameter[]> = {
  "1.0": AWGParamSet1,
  "1.5": AWGParamSet15,
  "2.0": AWGParamSet2,
  "3.0": AWGParamSet3,
};

/* ── Questions the sets answer ────────────────────────────────────────────── */

/** Does this version understand this parameter at all? */
export function hasParam(version: AWGVersion, key: string): boolean {
  return AWG_PARAM_SETS[version].some((p) => p.key === key);
}

/** The description a version uses for a key, if any. */
export function paramFor(
  version: AWGVersion,
  key: string,
): AWGParameter | undefined {
  return AWG_PARAM_SETS[version].find((p) => p.key === key);
}

/**
 * Parameters both ends must agree on. This is the list a "why does my tunnel
 * not come up" answer is built from, so it is derived rather than retyped.
 */
export function sharedParams(version: AWGVersion): readonly AWGParameter[] {
  return AWG_PARAM_SETS[version].filter((p) => p.scope === "shared");
}

/** Parameters each device may set for itself. */
export function senderParams(version: AWGVersion): readonly AWGParameter[] {
  return AWG_PARAM_SETS[version].filter((p) => p.scope === "sender");
}
