/**
 * AmneziaWG Architect — cross-parameter validators for generated configs.
 */

import type {
  AWGConfig,
  AWG3Params,
  ValidationFinding,
  ClientCapability,
} from "./types";
import { CLIENTS } from "./clients";
import { capsFor } from "./versions";
import {
  HEADER_PROTECTION_KEY_BYTES,
  MIN_S_WITH_HEADER_PROTECTION,
} from "./awg3";

/**
 * Parse a range — "N-M", or "N" for a single value — into [min, max].
 *
 * Accepts numbers and undefined as well as strings: the validators read
 * hand-written config fields, where a value may be missing or already numeric,
 * and a second near-identical copy of this used to exist for that reason.
 */
export function parseRange(
  rangeStr: string | number | undefined,
): [number, number] | null {
  if (rangeStr === undefined || rangeStr === "") return null;
  const s = String(rangeStr).trim();
  const m = s.match(/^(\d+)\s*-\s*(\d+)$/);
  if (m) return [parseInt(m[1], 10), parseInt(m[2], 10)];
  const single = parseInt(s, 10);
  return Number.isFinite(single) ? [single, single] : null;
}

/** True if two closed intervals overlap. */
export function rangesOverlap(
  a: { min: number; max: number },
  b: { min: number; max: number },
): boolean {
  return a.min <= b.max && b.min <= a.max;
}

/** Validate that H1-H4 ranges do not overlap with each other. */
export function validateHeaderRanges(
  h1: string,
  h2: string,
  h3: string,
  h4: string,
): ValidationFinding[] {
  const out: ValidationFinding[] = [];
  const hs: Array<[string, [number, number] | null]> = [
    ["H1", parseRange(h1)],
    ["H2", parseRange(h2)],
    ["H3", parseRange(h3)],
    ["H4", parseRange(h4)],
  ];

  for (let i = 0; i < hs.length; i++) {
    for (let j = i + 1; j < hs.length; j++) {
      const a = hs[i][1];
      const b = hs[j][1];
      if (a && b && rangesOverlap({ min: a[0], max: a[1] }, { min: b[0], max: b[1] })) {
        out.push({
          field: `${hs[i][0]}/${hs[j][0]}`,
          level: "error",
          msg: `Диапазоны ${hs[i][0]} и ${hs[j][0]} пересекаются.`,
        });
      }
    }
  }

  for (const [name, r] of hs) {
    if (r && r[0] >= 1 && r[0] <= 4) {
      out.push({
        field: name,
        level: "warn",
        msg: `${name} в зоне 1–4 (зарезервировано WireGuard).`,
      });
    }
  }

  return out;
}

/** Validate the core S-size constraints (S1 + 56 ≠ S2, S4 ≤ 32, etc.). */
export function validateSizes(cfg: AWGConfig): ValidationFinding[] {
  const out: ValidationFinding[] = [];
  if (cfg.s1 + 56 === cfg.s2) {
    out.push({
      field: "S2",
      level: "warn",
      msg: "S1 + 56 = S2 — размеры init/response совпадут (DPI-фингерпринт).",
    });
  }
  if (cfg.s3 === cfg.s1 + 56) {
    out.push({
      field: "S3",
      level: "warn",
      msg: "S3 = S1 + 56 — размеры init/cookie совпадут.",
    });
  }
  if (cfg.s3 === cfg.s2 + 92) {
    out.push({
      field: "S3",
      level: "warn",
      msg: "S3 = S2 + 92 — размеры response/cookie совпадут.",
    });
  }
  if (cfg.s4 > 32) {
    out.push({
      field: "S4",
      level: "error",
      msg: `S4=${cfg.s4} превышает максимальное значение 32.`,
    });
  }
  if (cfg.s4 === 0) {
    out.push({
      field: "S4",
      level: "warn",
      msg: "S4 = 0 — обфускация транспортных пакетов отключена.",
    });
  }
  return out;
}

/** Validate a generated config against a specific AWG client. */
export function validateConfigForClient(
  cfg: AWGConfig,
  clientId: string,
): ValidationFinding[] {
  const client = CLIENTS[clientId];
  if (!client) return [];

  const out: ValidationFinding[] = [];

  if (cfg.s4 > client.maxS4) {
    out.push({
      field: "S4",
      level: "error",
      msg: `S4=${cfg.s4} превышает максимум ${client.maxS4} для ${client.name}.`,
    });
  }

  const cps = cfg.i1 + cfg.i2 + cfg.i3 + cfg.i4 + cfg.i5;
  if (cps.includes("<c>") && !client.supportsCpsTagC) {
    out.push({
      field: "I1-I5",
      level: "error",
      msg: `Тег <c> не поддерживается клиентом ${client.name}.`,
    });
  }
  if (/<rc\s+\d+>/.test(cps) && !client.supportsCpsTagRC) {
    out.push({
      field: "I1-I5",
      level: "error",
      msg: `Тег <rc N> не поддерживается клиентом ${client.name}.`,
    });
  }
  if (/<rd\s+\d+>/.test(cps) && !client.supportsCpsTagRD) {
    out.push({
      field: "I1-I5",
      level: "error",
      msg: `Тег <rd N> не поддерживается клиентом ${client.name}.`,
    });
  }

  for (const [key, rangeStr] of [
    ["H1", cfg.h1],
    ["H2", cfg.h2],
    ["H3", cfg.h3],
    ["H4", cfg.h4],
  ] as const) {
    const r = parseRange(rangeStr);
    if (r && r[1] > client.maxHValue) {
      out.push({
        field: key,
        level: "error",
        msg: `${key} диапазон превышает ${client.maxHValue} для ${client.name}.`,
      });
    }
  }

  if (cfg.jc > client.maxJc) {
    out.push({
      field: "Jc",
      level: "warn",
      msg: `Jc=${cfg.jc} превышает рекомендуемый максимум ${client.maxJc} для ${client.name}.`,
    });
  }

  return out;
}

/* ── AWG 3.0 ─────────────────────────────────────────────────────────────── */

/** Base64 of exactly 32 bytes: 43 payload chars + one '=' of padding. */
const B64_32_BYTES = /^[A-Za-z0-9+/]{43}=$/;

/**
 * Validate the AWG 3.0 block.
 *
 * The interesting rules come from reading amneziawg-go v3.0.1 rather than the
 * docs — see `awg3.ts` for the exact source references.
 */
export function validateAwg3(cfg: AWGConfig): ValidationFinding[] {
  const p = cfg.awg3;
  const out: ValidationFinding[] = [];
  if (!p) return out;

  if (!capsFor(cfg.version).headerProtection) {
    const active = Object.values(p).some((v) => v !== "");
    if (active) {
      out.push({
        field: "AWG3",
        level: "error",
        code: "awg3.version_mismatch",
        msg: `Параметры AWG 3.0 заданы, но версия конфига — ${cfg.version}.`,
      });
    }
    return out;
  }

  /* HeaderProtectionKey — 32 bytes, base64 (same encoding as PrivateKey). */
  if (p.headerProtectionKey) {
    if (!B64_32_BYTES.test(p.headerProtectionKey)) {
      out.push({
        field: "HeaderProtectionKey",
        level: "error",
        code: "awg3.hpk_format",
        msg: `HeaderProtectionKey должен быть ${HEADER_PROTECTION_KEY_BYTES} байт в base64 (44 символа).`,
      });
    }

    /*
     * The ChaCha20 nonce is read from the first 12 bytes of the S-padding
     * (send.go: `crypt[:HeaderCipherNonceSize]`). Padding shorter than that
     * makes the nonce overlap the message body instead of random bytes.
     */
    for (const [name, value] of [
      ["S1", cfg.s1],
      ["S2", cfg.s2],
      ["S3", cfg.s3],
      ["S4", cfg.s4],
    ] as const) {
      if (value < MIN_S_WITH_HEADER_PROTECTION) {
        out.push({
          field: name,
          level: "error",
          code: "awg3.s_below_nonce",
          msg: `${name}=${value} < ${MIN_S_WITH_HEADER_PROTECTION}: при HeaderProtectionKey из паддинга берётся nonce шифра, короткий паддинг ослабляет защиту.`,
        });
      }
    }
  }

  /* ContentPaddingAddition — a zero range means "disabled" in the device. */
  if (p.contentPaddingAddition) {
    const r = parseRange(p.contentPaddingAddition);
    if (!r) {
      out.push({
        field: "ContentPaddingAddition",
        level: "error",
        code: "awg3.cpa_format",
        msg: "ContentPaddingAddition должен быть числом или диапазоном «мин-макс».",
      });
    } else if (r[1] < 1) {
      out.push({
        field: "ContentPaddingAddition",
        level: "warn",
        code: "awg3.cpa_zero",
        msg: "ContentPaddingAddition = 0 — дополнительный паддинг отключён.",
      });
    }
  }

  out.push(...validateTimings(p));
  return out;
}

/** Timer-range invariants taken from `device/timers.go`. */
function validateTimings(p: AWG3Params): ValidationFinding[] {
  const out: ValidationFinding[] = [];

  const fields: Array<[string, string]> = [
    ["RekeyAfterTime", p.rekeyAfterTime],
    ["RekeyTimeout", p.rekeyTimeout],
    ["RejectAfterTime", p.rejectAfterTime],
    ["KeepaliveTimeout", p.keepaliveTimeout],
    ["MaxHandshakeAttempts", p.maxHandshakeAttempts],
  ];

  const parsed: Record<string, [number, number]> = {};
  for (const [name, raw] of fields) {
    if (!raw) continue;
    const r = parseRange(raw);
    if (!r) {
      out.push({
        field: name,
        level: "error",
        code: "awg3.timing_format",
        msg: `${name} должен быть числом или диапазоном «мин-макс».`,
      });
      continue;
    }
    if (r[0] > r[1]) {
      out.push({
        field: name,
        level: "error",
        code: "awg3.timing_inverted",
        msg: `${name}: нижняя граница больше верхней.`,
      });
      continue;
    }
    parsed[name] = r;
  }

  const reject = parsed.RejectAfterTime;
  const keepalive = parsed.KeepaliveTimeout;
  const rekeyTimeout = parsed.RekeyTimeout;
  const rekeyAfter = parsed.RekeyAfterTime;

  /*
   * keyRefreshTimeoutReceiving() = RejectAfterTime − KeepaliveTimeout.Lo
   *                                              − RekeyTimeout.Lo, min 0.
   * At zero the receiving side never refreshes its keys and the tunnel dies
   * once RejectAfterTime elapses.
   */
  if (reject && keepalive && rekeyTimeout) {
    const floor = keepalive[0] + rekeyTimeout[0];
    if (reject[0] <= floor) {
      out.push({
        field: "RejectAfterTime",
        level: "error",
        code: "awg3.reject_too_low",
        msg: `RejectAfterTime (${reject[0]}с) должен быть больше KeepaliveTimeout + RekeyTimeout (${floor}с), иначе обновление ключей на приёме не сработает.`,
      });
    }
  }

  /* A session must rekey before it is rejected. */
  if (reject && rekeyAfter && rekeyAfter[1] >= reject[0]) {
    out.push({
      field: "RekeyAfterTime",
      level: "error",
      code: "awg3.rekey_after_reject",
      msg: `RekeyAfterTime (до ${rekeyAfter[1]}с) должен быть меньше RejectAfterTime (от ${reject[0]}с).`,
    });
  }

  const attempts = parsed.MaxHandshakeAttempts;
  if (attempts && attempts[0] < 1) {
    out.push({
      field: "MaxHandshakeAttempts",
      level: "error",
      code: "awg3.attempts_zero",
      msg: "MaxHandshakeAttempts должен быть не меньше 1.",
    });
  }

  return out;
}

/** Run all built-in validations and return a flat finding list. */
export function validateGeneratedConfig(
  cfg: AWGConfig,
  clientId?: string,
): ValidationFinding[] {
  const out: ValidationFinding[] = [
    ...validateHeaderRanges(cfg.h1, cfg.h2, cfg.h3, cfg.h4),
    ...validateSizes(cfg),
    ...validateAwg3(cfg),
  ];
  if (clientId) {
    out.push(...validateConfigForClient(cfg, clientId));
  }
  return out;
}
