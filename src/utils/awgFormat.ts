/**
 * AmneziaWG Architect — format layer (awgFormat.ts)
 *
 * Detect, parse, and transform between the three shapes a user might paste:
 *   - `vpn://…`  — Amnezia container key (see mergekeys.ts codec)
 *   - wg-quick `.conf` text (AmneziaWG interface)
 *   - decoded JSON (VpnConfig)
 *
 * Transform is AmneziaWG-only:
 *   confToVpn  — wrap a .conf into a minimal valid VpnConfig key
 *   vpnToConf  — extract a .conf from a (chosen) AWG container
 *
 * Pure module — no DOM, no Vue. Reuses the codec from mergekeys.ts.
 */

import { vpnDecode, vpnEncode } from "@/utils/mergekeys";
import type { VpnConfig, AwgContainer } from "@/utils/mergekeys";

export type AwgFormat = "vpn" | "conf" | "json" | "unknown";

/* ═══════════════════════════════════════════════════════════════════════════
   Detection
   ═══════════════════════════════════════════════════════════════════════════ */

/** Heuristic format detector for pasted / loaded text. */
export function detectFormat(input: string): AwgFormat {
  const text = input.trim();
  if (!text) return "unknown";
  if (text.startsWith("vpn://")) return "vpn";
  // JSON must be checked BEFORE the .conf heuristic: a decoded VpnConfig embeds
  // the wg-quick text inside `awg.config`, so a naive `includes("[Interface]")`
  // would misclassify valid JSON as .conf.
  if (text.startsWith("{")) {
    try {
      JSON.parse(text);
      return "json";
    } catch {
      /* not valid json — fall through */
    }
  }
  if (/^\s*\[(Interface|Peer)\]/im.test(text) || text.includes("[Interface]"))
    return "conf";
  // Prefix-less key: try decoding it as a vpn:// payload.
  try {
    vpnDecode(text);
    return "vpn";
  } catch {
    return "unknown";
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   wg-quick parse / stringify
   ═══════════════════════════════════════════════════════════════════════════ */

export interface ConfEntry {
  key: string;
  value: string;
}
export interface ConfSection {
  name: string;
  entries: ConfEntry[];
}
export interface ParsedConf {
  sections: ConfSection[];
}

/** Parse wg-quick / AmneziaWG .conf text into ordered sections. */
export function parseConf(text: string): ParsedConf {
  const sections: ConfSection[] = [];
  let current: ConfSection | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line.startsWith(";")) continue;

    const sec = line.match(/^\[(.+)\]$/);
    if (sec) {
      current = { name: sec[1].trim(), entries: [] };
      sections.push(current);
      continue;
    }

    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (!current) {
      current = { name: "Interface", entries: [] };
      sections.push(current);
    }
    current.entries.push({ key, value });
  }

  return { sections };
}

/** Serialise ParsedConf back to canonical wg-quick text. */
export function stringifyConf(conf: ParsedConf): string {
  return (
    conf.sections
      .map((s) => {
        const head = `[${s.name}]`;
        const body = s.entries.map((e) => `${e.key} = ${e.value}`).join("\n");
        return body ? `${head}\n${body}` : head;
      })
      .join("\n\n") + "\n"
  );
}

/** Read the first matching field value across all sections, or null. */
export function getField(conf: ParsedConf, key: string): string | null {
  for (const s of conf.sections) {
    const hit = s.entries.find((e) => e.key === key);
    if (hit) return hit.value;
  }
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   conf ⇄ vpn transform (AmneziaWG-only)
   ═══════════════════════════════════════════════════════════════════════════ */

const OBF_MIRROR_FIELDS = [
  "Jc",
  "Jmin",
  "Jmax",
  "I1",
  "I2",
  "I3",
  "I4",
  "I5",
] as const;

/** Wrap an AmneziaWG .conf into a minimal valid VpnConfig and encode it. */
export function confToVpn(confText: string): string {
  const parsed = parseConf(confText);
  const endpoint = getField(parsed, "Endpoint") || "";
  // IPv6 endpoints look like "[::1]:51820"; strip the port from the end only.
  const host = endpoint.replace(/:\d+$/, "") || "amneziawg";
  const dns = (getField(parsed, "DNS") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const awg: AwgContainer = { config: confText };
  for (const f of OBF_MIRROR_FIELDS) {
    const v = getField(parsed, f);
    if (v !== null) awg[f] = v;
  }

  // last_config: JSON mirror of the interface fields (Amnezia stores a twin).
  const flat: Record<string, string> = {};
  for (const s of parsed.sections)
    for (const e of s.entries) flat[e.key] = e.value;
  awg.last_config = JSON.stringify({ ...flat, config: confText }, null, 4);

  const cfg: VpnConfig = {
    containers: [{ container: "amneziawg", awg }],
    defaultContainer: "amneziawg",
    description: "AmneziaWG",
    hostName: host,
    dns1: dns[0] || "",
    dns2: dns[1] || "",
    nameOverriddenByUser: false,
  };
  return vpnEncode(cfg);
}

export interface VpnToConfResult {
  conf: string;
  awgContainers: string[];
}

/**
 * Extract an AmneziaWG .conf from a decoded VpnConfig.
 *   - awgContainers: names of all AWG containers found (for the picker)
 *   - conf: the chosen container's .conf (by name, else default/first AWG)
 * Throws if there is no AWG container.
 */
export function vpnToConf(
  cfg: VpnConfig,
  containerName?: string,
): VpnToConfResult {
  const containers = cfg.containers || [];
  const awg = containers.filter(
    (c): c is { container?: string; awg: AwgContainer } => c.awg != null,
  );
  if (awg.length === 0) {
    throw new Error(
      "В ключе нет AmneziaWG-контейнера. Трансформация в .conf доступна только для AmneziaWG.",
    );
  }
  const names = awg.map((c, i) => c.container || `awg_${i}`);

  let chosen = awg[0];
  if (containerName) {
    const idx = names.indexOf(containerName);
    if (idx >= 0) chosen = awg[idx];
  } else if (cfg.defaultContainer) {
    const idx = names.indexOf(cfg.defaultContainer);
    if (idx >= 0) chosen = awg[idx];
  }

  return { conf: extractConf(chosen.awg), awgContainers: names };
}

/** Prefer awg.config; fall back to last_config.config; else throw. */
function extractConf(awg: AwgContainer): string {
  if (typeof awg.config === "string" && awg.config.includes("[Interface]"))
    return awg.config;
  if (typeof awg.last_config === "string") {
    try {
      const lc = JSON.parse(awg.last_config) as { config?: string };
      if (lc.config && lc.config.includes("[Interface]")) return lc.config;
    } catch {
      /* ignore — fall through to error */
    }
  }
  throw new Error(
    "Не удалось извлечь .conf из AWG-контейнера (отсутствует поле config).",
  );
}
