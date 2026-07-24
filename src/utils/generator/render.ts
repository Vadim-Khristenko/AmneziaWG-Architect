/**
 * AmneziaWG Architect — canonical `.conf` renderer.
 *
 * Single source of truth for turning an `AWGConfig` into wg-quick text. The
 * batch export, the copy/download payload and the syntax-highlighted preview
 * all render from here, so a parameter can never appear in one view and go
 * missing in another.
 *
 * Key spellings follow amneziawg-tools (`src/config.c`): the 2.x set on
 * `master`, the 3.0 additions on `feat/awg3`.
 */

import type { AWGConfig, AWGVersion } from "./types";

export type ConfLineType = "comment" | "kv" | "section";

export interface ConfLine {
  key: string;
  value: string;
  type: ConfLineType;
}

export interface RenderOptions {
  /**
   * Preview mode collapses the PrivateKey/Address placeholders onto one
   * comment line and is what the on-screen preview uses.
   */
  preview?: boolean;
  /** Optional "config N/M" caption for batch exports. */
  caption?: string;
}

const cm = (value: string): ConfLine => ({ key: "", value, type: "comment" });
const kv = (key: string, value: string | number): ConfLine => ({
  key,
  value: String(value),
  type: "kv",
});

/**
 * Build the ordered line list for a config.
 *
 * Version differences, all as implemented upstream:
 *   1.0 — single-value H1–H4, S1/S2 only, no CPS chains
 *   1.5 — single-value H1–H4, S1/S2, client-side-only I1–I5
 *   2.0 — H1–H4 as ranges, S1–S4, I1–I5
 *   3.0 — everything in 2.0 plus HeaderProtectionKey, ContentPaddingAddition
 *         and the randomised timers
 */
export function renderConfLines(
  cfg: AWGConfig,
  opts: RenderOptions = {},
): ConfLine[] {
  const { preview = false, caption } = opts;
  const v: AWGVersion = cfg.version;
  const lines: ConfLine[] = [];

  lines.push(cm(caption ? `# AmneziaWG ${v} — ${caption}` : `# AmneziaWG ${v}`));
  lines.push(cm("[Interface]"));
  if (preview) {
    lines.push(cm("# PrivateKey = <ключ>  Address = 10.0.0.2/32"));
  } else {
    lines.push(cm("# PrivateKey = <ключ>"));
    lines.push(cm("# Address = 10.0.0.2/32"));
  }

  const modern = v === "2.0" || v === "3.0";

  if (modern) {
    lines.push(kv("H1", cfg.h1), kv("H2", cfg.h2), kv("H3", cfg.h3), kv("H4", cfg.h4));
    lines.push(kv("S1", cfg.s1), kv("S2", cfg.s2), kv("S3", cfg.s3), kv("S4", cfg.s4));
  } else {
    lines.push(
      kv("H1", cfg.h1s),
      kv("H2", cfg.h2s),
      kv("H3", cfg.h3s),
      kv("H4", cfg.h4s),
    );
    lines.push(kv("S1", cfg.s1), kv("S2", cfg.s2));
  }

  lines.push(kv("Jc", cfg.jc), kv("Jmin", cfg.jmin), kv("Jmax", cfg.jmax));

  if (v === "1.0") {
    lines.push(cm("# I1-I5 не поддерживаются в AWG 1.0"));
  } else {
    if (v === "1.5") lines.push(cm("# I1-I5 только клиент (AWG 1.5):"));
    lines.push(
      kv("I1", cfg.i1),
      kv("I2", cfg.i2),
      kv("I3", cfg.i3),
      kv("I4", cfg.i4),
      kv("I5", cfg.i5),
    );
  }

  if (v === "3.0" && cfg.awg3) {
    const p = cfg.awg3;

    if (p.headerProtectionKey) {
      lines.push(cm("# AWG 3.0 — общий ключ защиты заголовков (одинаковый на обеих сторонах)"));
      lines.push(kv("HeaderProtectionKey", p.headerProtectionKey));
    }
    if (p.contentPaddingAddition) {
      lines.push(cm("# AWG 3.0 — случайный паддинг транспортных пакетов"));
      lines.push(kv("ContentPaddingAddition", p.contentPaddingAddition));
    }

    const timers: Array<[string, string]> = [
      ["RekeyAfterTime", p.rekeyAfterTime],
      ["RekeyTimeout", p.rekeyTimeout],
      ["RejectAfterTime", p.rejectAfterTime],
      ["KeepaliveTimeout", p.keepaliveTimeout],
      ["MaxHandshakeAttempts", p.maxHandshakeAttempts],
    ];
    const active = timers.filter(([, value]) => value !== "");
    if (active.length) {
      lines.push(cm("# AWG 3.0 — рандомизация таймингов протокола"));
      for (const [key, value] of active) lines.push(kv(key, value));
    }
  }

  return lines;
}

/** Render a config to wg-quick text. */
export function renderConf(cfg: AWGConfig, opts: RenderOptions = {}): string {
  return renderConfLines(cfg, opts)
    .map((l) => (l.type === "kv" ? `${l.key} = ${l.value}` : l.value))
    .join("\n");
}
