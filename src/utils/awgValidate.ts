/**
 * AmneziaWG Architect — parameter validation (awgValidate.ts)
 *
 * Limits verified against canonical sources:
 *   - amneziawg-linux-kernel-module: src/device.c, src/messages.h
 *   - amneziawg-go: device/uapi.go, device/magic-header.go, device/obf.go
 *
 * Pure module — returns findings, never throws.
 */

export type FindingLevel = "error" | "warn";

export interface Finding {
  field: string;
  level: FindingLevel;
  msg: string;
}

export interface AwgParamInput {
  [k: string]: string | number | undefined;
}

const num = (v: string | number | undefined): number | null => {
  if (v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};

/** Parse "N" or "N-M" magic-header range into [start, end], or null. */
function parseRange(v: string | number | undefined): [number, number] | null {
  if (v === undefined || v === "") return null;
  const s = String(v).trim();
  const m = s.match(/^(\d+)\s*-\s*(\d+)$/);
  if (m) return [parseInt(m[1], 10), parseInt(m[2], 10)];
  const single = parseInt(s, 10);
  return Number.isFinite(single) ? [single, single] : null;
}

/** A CPS chain is one or more well-formed tags concatenated. */
const VALID_TAG = /^(<(b 0x[0-9a-fA-F]*|t|c|r \d+|rc \d+|rd \d+|d|ds|dz)>)+$/;

/**
 * Validate AmneziaWG obfuscation parameters.
 * @param p   field map (string or number values; missing fields are skipped)
 * @param opts.mtu  interface MTU for the Jmax fragmentation check (default 1280)
 */
export function validateAwgParams(
  p: AwgParamInput,
  opts: { mtu?: number } = {},
): Finding[] {
  const out: Finding[] = [];
  const mtu = opts.mtu ?? 1280;

  // ── Jc ──────────────────────────────────────────────────────────────────
  const jc = num(p.Jc);
  if (jc !== null && (jc < 1 || jc > 128)) {
    out.push({
      field: "Jc",
      level: "error",
      msg: "Jc должно быть 1–128 (лимит ядра).",
    });
  } else if (jc !== null && jc > 64) {
    out.push({
      field: "Jc",
      level: "warn",
      msg: "Высокий Jc увеличивает задержку хендшейка.",
    });
  }

  // ── Jmin / Jmax ───────────────────────────────────────────────────────────
  const jmin = num(p.Jmin);
  const jmax = num(p.Jmax);
  if (jmin !== null && jmax !== null && jmin >= jmax) {
    out.push({
      field: "Jmin",
      level: "error",
      msg: "Должно быть Jmin < Jmax.",
    });
  }
  if (jmax !== null && jmax >= mtu) {
    out.push({
      field: "Jmax",
      level: "warn",
      msg: `Jmax ≥ MTU (${mtu}) — риск фрагментации мусорных пакетов.`,
    });
  }

  // ── S1 / S2 ────────────────────────────────────────────────────────────────
  const s1 = num(p.S1);
  const s2 = num(p.S2);
  if (s1 !== null && s2 !== null && s1 + 56 === s2) {
    out.push({
      field: "S2",
      level: "warn",
      msg: "S1 + 56 = S2 — размеры init/response совпадут (DPI-фингерпринт).",
    });
  }
  if (s1 !== null && s1 > 1132) {
    out.push({
      field: "S1",
      level: "error",
      msg: "S1 максимум 1132 (65535 − 148).",
    });
  }
  if (s2 !== null && s2 > 1188) {
    out.push({
      field: "S2",
      level: "error",
      msg: "S2 максимум 1188 (65535 − 92).",
    });
  }

  // ── H1–H4 (ranges must not overlap; avoid reserved 1–4) ─────────────────────
  const hs: Array<[string, [number, number] | null]> = [
    ["H1", parseRange(p.H1)],
    ["H2", parseRange(p.H2)],
    ["H3", parseRange(p.H3)],
    ["H4", parseRange(p.H4)],
  ];
  for (let i = 0; i < hs.length; i++) {
    for (let j = i + 1; j < hs.length; j++) {
      const a = hs[i][1];
      const b = hs[j][1];
      if (a && b && !(a[1] < b[0] || b[1] < a[0])) {
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

  // ── I1–I5 (CPS tag syntax) ──────────────────────────────────────────────────
  for (const f of ["I1", "I2", "I3", "I4", "I5"]) {
    const v = p[f];
    if (
      v !== undefined &&
      v !== "" &&
      v !== "0" &&
      !VALID_TAG.test(String(v).trim())
    ) {
      out.push({
        field: f,
        level: "error",
        msg: `${f}: неверный синтаксис CPS-тега.`,
      });
    }
  }

  return out;
}
