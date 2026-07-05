/**
 * AmneziaWG Architect — cross-parameter validators for generated configs.
 */

import type { AWGConfig, ValidationFinding, ClientCapability } from "./types";
import { CLIENTS } from "./clients";

/** Parse a magic-header range string "N-M" or "N" into [min, max]. */
export function parseRange(rangeStr: string): [number, number] | null {
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

/** Run all built-in validations and return a flat finding list. */
export function validateGeneratedConfig(
  cfg: AWGConfig,
  clientId?: string,
): ValidationFinding[] {
  const out: ValidationFinding[] = [
    ...validateHeaderRanges(cfg.h1, cfg.h2, cfg.h3, cfg.h4),
    ...validateSizes(cfg),
  ];
  if (clientId) {
    out.push(...validateConfigForClient(cfg, clientId));
  }
  return out;
}
