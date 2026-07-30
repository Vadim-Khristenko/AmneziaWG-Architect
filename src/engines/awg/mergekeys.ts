/**
 * AmneziaWG Architect — MergeKeys (TypeScript port)
 *
 * Full port of mergekeys.js into typed, modular TypeScript.
 * Uses pako (npm) instead of CDN for zlib compression/decompression.
 *
 * Format vpn://:
 *   base64url( 4-byte big-endian header with original length + zlib(JSON) )
 *
 * ── What we change in AWG keys ──────────────────────────────────────────
 *
 * ONLY client-side obfuscation parameters:
 *   Jc, Jmin, Jmax  — Junk-train (tunnel operation)
 *   I1–I5           — CPS chain (AWG 1.5 / 2.0)
 *
 * We do NOT touch server-side parameters (otherwise connection will fail):
 *   H1–H4           — packet type identifiers (must match server)
 *   S1–S4           — prefix sizes (must match server)
 *   PrivateKey, PublicKey, PresharedKey, Endpoint, Address, DNS, Port
 *
 * ── Container Merge ─────────────────────────────────────────────────────
 *
 * Takes multiple vpn:// keys, merges all containers[] into one master key.
 * This allows using AWG + XRay (or any other Amnezia protocols) from a
 * single key.
 */

import pako from "pako";

/* ═══════════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════════ */

/** AWG container within a VPN config */
export interface AwgContainer {
  [key: string]: unknown;
  Jc?: string;
  Jmin?: string;
  Jmax?: string;
  I1?: string;
  I2?: string;
  I3?: string;
  I4?: string;
  I5?: string;
  last_config?: string;
  config?: string;
}

/** A single container entry in a VPN config */
export interface ContainerEntry {
  container?: string;
  awg?: AwgContainer;
  [key: string]: unknown;
}

/** Decoded VPN configuration object */
export interface VpnConfig {
  containers?: ContainerEntry[];
  defaultContainer?: string;
  description?: string;
  dns1?: string;
  dns2?: string;
  hostName?: string;
  nameOverriddenByUser?: boolean;
  [key: string]: unknown;
}

/** Generated config params (from generator) */
export interface GeneratedParams {
  jc: number;
  jmin: number;
  jmax: number;
  i1?: number;
  i2?: number;
  i3?: number;
  i4?: number;
  i5?: number;
  [key: string]: unknown;
}

/** Obfuscation patch — string values for AWG fields */
export interface ObfuscationPatch {
  Jc: string;
  Jmin: string;
  Jmax: string;
  I1?: string;
  I2?: string;
  I3?: string;
  I4?: string;
  I5?: string;
}

/** Result of applying a patch to VPN config */
export interface PatchResult {
  updated: VpnConfig;
  changed: string[];
  containerCount: number;
}

/** Result of merging multiple VPN configs */
export interface MergeResult {
  merged: VpnConfig;
  warnings: string[];
  stats: {
    total: number;
    unique: number;
    dupes: number;
  };
}

/** AWG version string */
export type AwgVersion = "1.0" | "1.5" | "2.0";

/* ═══════════════════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════════════════ */

const AWG_CLIENT_FIELDS_BASE: readonly string[] = ["Jc", "Jmin", "Jmax"];
const AWG_CLIENT_FIELDS_CPS: readonly string[] = ["I1", "I2", "I3", "I4", "I5"];

/* ═══════════════════════════════════════════════════════════════════════════
   vpn:// Codec
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Decode a `vpn://...` string into a JS object.
 * Exact port of decode_config() from test_py.py.
 */
export function vpnDecode(str: string): VpnConfig {
  let encoded = str.trim();
  if (encoded.startsWith("vpn://")) encoded = encoded.slice(6);

  // Restore base64url padding
  const pad = (4 - (encoded.length % 4)) % 4;
  encoded += "=".repeat(pad);

  // base64url → standard base64 (-→+, _→/)
  const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  try {
    const originalLen =
      (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
    const compressed = bytes.slice(4);
    const decompressed = pako.inflate(compressed);

    if (decompressed.length !== originalLen) {
      throw new Error(
        `Длина после распаковки (${decompressed.length}) не совпадает с заголовком (${originalLen})`,
      );
    }

    return JSON.parse(
      new TextDecoder("utf-8").decode(decompressed),
    ) as VpnConfig;
  } catch (zlibErr) {
    // Fallback: data is not compressed — just base64-encoded JSON (old format)
    try {
      return JSON.parse(new TextDecoder("utf-8").decode(bytes)) as VpnConfig;
    } catch {
      throw new Error(
        `Не удалось декодировать ключ: ${zlibErr instanceof Error ? zlibErr.message : String(zlibErr)}`,
      );
    }
  }
}

/**
 * Encode a JS object into a `vpn://...` string.
 */
export function vpnEncode(obj: VpnConfig): string {
  const jsonStr = JSON.stringify(obj, null, 4);
  const jsonBytes = new TextEncoder().encode(jsonStr);
  const compressed = pako.deflate(jsonBytes);

  // 4-byte big-endian header with original length
  const originalLen = jsonBytes.length;
  const combined = new Uint8Array(4 + compressed.length);
  combined[0] = (originalLen >>> 24) & 0xff;
  combined[1] = (originalLen >>> 16) & 0xff;
  combined[2] = (originalLen >>> 8) & 0xff;
  combined[3] = originalLen & 0xff;
  combined.set(compressed, 4);

  // binary → base64url (no padding =)
  let binary = "";
  for (let i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  const b64url = btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return "vpn://" + b64url;
}

/* ═══════════════════════════════════════════════════════════════════════════
   AWG Obfuscation Patch
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Get the list of client fields to update based on AWG version.
 * awgVer: "1" (AWG 1.0) | "2" (AWG 1.5/2.0)
 */
export function getClientFields(awgVer: "1" | "2"): string[] {
  if (awgVer === "1") return [...AWG_CLIENT_FIELDS_BASE];
  return [...AWG_CLIENT_FIELDS_BASE, ...AWG_CLIENT_FIELDS_CPS];
}

/**
 * Build an obfuscation patch object from generated params.
 *
 * @param p - Generated config params (from genCfg())
 * @param selectedVer - Selected AWG version in generator ("1.0" | "1.5" | "2.0")
 */
export function buildObfuscationPatch(
  p: GeneratedParams,
  selectedVer: AwgVersion,
): ObfuscationPatch {
  if (!p) {
    throw new Error(
      "Конфиг не сгенерирован. Вернитесь на главную и нажмите «СГЕНЕРИРОВАТЬ».",
    );
  }

  const patch: ObfuscationPatch = {
    Jc: String(p.jc),
    Jmin: String(p.jmin),
    Jmax: String(p.jmax),
  };

  // I1-I5 only if version supports CPS
  if (selectedVer !== "1.0") {
    patch.I1 = String(p.i1 ?? 0);
    patch.I2 = String(p.i2 ?? 0);
    patch.I3 = String(p.i3 ?? 0);
    patch.I4 = String(p.i4 ?? 0);
    patch.I5 = String(p.i5 ?? 0);
  }

  return patch;
}

/* ═══════════════════════════════════════════════════════════════════════════
   String Patching Utilities
   ═══════════════════════════════════════════════════════════════════════════ */

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Replace a field value in a wg-quick format string ("Field = Value\n").
 * Safe for multiline strings with < > and other special chars.
 */
export function patchWgQuickString(
  str: string,
  field: string,
  value: string,
): string {
  const re = new RegExp(
    "^(" + escapeRegExp(field) + "[ \\t]*=[ \\t]*)(.*)$",
    "m",
  );
  if (re.test(str)) {
    return str.replace(re, "$1" + value);
  }
  // Field not found — add to end of [Interface] section if it exists
  if (str.includes("[Interface]")) {
    return str.replace(/(\[Interface\][^[]*)/, (m) => {
      return m.trimEnd() + "\n" + field + " = " + value + "\n";
    });
  }
  return str + "\n" + field + " = " + value;
}

/**
 * Replace a field value in a JSON string.
 * Used for awg.last_config (JSON within JSON).
 */
export function patchJsonString(
  jsonStr: string,
  field: string,
  value: string,
): string {
  try {
    const obj = JSON.parse(jsonStr) as Record<string, unknown>;
    if (field in obj) {
      obj[field] = value;
      return JSON.stringify(obj, null, 4) + "\n";
    }
    return jsonStr;
  } catch {
    // If it doesn't parse — regex replace like wg-quick
    return patchWgQuickString(jsonStr, field, value);
  }
}

/**
 * Apply obfuscation patch to an AWG container object.
 * Updates:
 *   1. Top-level fields (awg.Jc, awg.I1, ...)
 *   2. awg.last_config (JSON string)
 *   3. awg.config (wg-quick string)
 *
 * Returns list of changed fields.
 */
export function applyObfPatchToAwg(
  awg: AwgContainer,
  patch: ObfuscationPatch,
): string[] {
  const changed: string[] = [];
  const fields = Object.keys(patch) as (keyof ObfuscationPatch)[];

  for (const field of fields) {
    const newVal = patch[field];
    if (newVal === undefined) continue;

    const oldVal = awg[field];

    // 1. Top-level
    if (awg[field] !== undefined || AWG_CLIENT_FIELDS_CPS.includes(field)) {
      awg[field] = newVal;
      if (oldVal !== newVal) changed.push(field);
    }

    // 2. last_config
    if (awg.last_config && typeof awg.last_config === "string") {
      awg.last_config = patchJsonString(awg.last_config, field, newVal);
    }

    // 3. config (wg-quick)
    if (awg.config && typeof awg.config === "string") {
      awg.config = patchWgQuickString(awg.config, field, newVal);
    }
  }

  return changed;
}

/**
 * Apply patch to all AWG containers in a VPN config object.
 * Returns { updated, changed, containerCount }.
 */
export function applyPatchToVpnConfig(
  cfg: VpnConfig,
  patch: ObfuscationPatch,
): PatchResult {
  const containers = cfg.containers || [];
  const awgContainers = containers.filter(
    (c): c is ContainerEntry & { awg: AwgContainer } => c.awg != null,
  );

  if (awgContainers.length === 0) {
    throw new Error(
      "В ключе не найдено ни одного AWG-контейнера. " +
        "Этот инструмент работает только с AmneziaWG-ключами.",
    );
  }

  const allChanged: string[] = [];
  for (const c of awgContainers) {
    const ch = applyObfPatchToAwg(c.awg, patch);
    for (const f of ch) {
      if (!allChanged.includes(f)) allChanged.push(f);
    }
  }

  return {
    updated: cfg,
    changed: allChanged,
    containerCount: awgContainers.length,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Container Merge
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Merge an array of decoded VPN objects into one master config.
 *
 * Strategy:
 *   - containers[]: merge all, deduplicate by container name
 *     (if two keys have the same container — take first, warn)
 *   - defaultContainer: from first key
 *   - description: join via " + "
 *   - dns1/dns2: from first key (or first one that has it)
 *   - hostName: from first key
 *   - nameOverriddenByUser: true
 *
 * Returns { merged, warnings, stats: {total, unique, dupes} }
 */
export function mergeVpnConfigs(configs: VpnConfig[]): MergeResult {
  if (!configs || configs.length < 2) {
    throw new Error("Для объединения нужно минимум 2 ключа.");
  }

  const mergedContainers: ContainerEntry[] = [];
  const seenNames: Record<string, number> = {};
  const warnings: string[] = [];
  let dupes = 0;
  let total = 0;

  for (let cfgIdx = 0; cfgIdx < configs.length; cfgIdx++) {
    const cfg = configs[cfgIdx];
    const containers = cfg.containers || [];

    for (const c of containers) {
      total++;
      const name = c.container || `unknown_${cfgIdx}_${total}`;

      if (seenNames[name]) {
        dupes++;
        warnings.push(
          `Дубликат контейнера «${name}» из ключа #${cfgIdx + 1} пропущен (уже есть из ключа #${seenNames[name]}).`,
        );
      } else {
        seenNames[name] = cfgIdx + 1;
        mergedContainers.push(c);
      }
    }
  }

  // Take metadata from first key, combine descriptions
  const first = configs[0];
  const descriptions = configs
    .map((c) => c.description || "")
    .filter((d) => d.length > 0);
  const uniqueDescriptions = descriptions.filter(
    (d, i) => descriptions.indexOf(d) === i,
  );

  const merged: VpnConfig = {
    containers: mergedContainers,
    defaultContainer:
      first.defaultContainer || mergedContainers[0]?.container || "",
    description: uniqueDescriptions.join(" + ") || "Merged",
    dns1: first.dns1 || configs.find((c) => c.dns1)?.dns1 || "",
    dns2: first.dns2 || configs.find((c) => c.dns2)?.dns2 || "",
    hostName: first.hostName || "",
    nameOverriddenByUser: true,
  };

  return {
    merged,
    warnings,
    stats: {
      total,
      unique: mergedContainers.length,
      dupes,
    },
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   HTML Escaping Utility
   ═══════════════════════════════════════════════════════════════════════════ */

export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
