/**
 * useConfigEditor — reactive state & operations for the Editor & Converter.
 *
 * Single source of truth = `rawText`. Everything else (format, highlight,
 * AWG container list, validation) derives from it, so the Code and Fields
 * views can never drift apart.
 *
 * Multi-key mode: when rawText holds several vpn:// keys (one per line), the
 * editor edits one "active" key while "Обновить обфускацию" patches them all.
 *
 * All work is local — nothing leaves the browser.
 */

import { ref, computed, watch } from "vue";
import {
  detectFormat,
  confToVpn,
  vpnToConf,
  type AwgFormat,
} from "@/utils/awgFormat";
import { validateAwgParams, type Finding } from "@/utils/awgValidate";
import { highlight } from "@/utils/awgHighlight";
import { pluralRu } from "@/utils/plural";
import {
  vpnDecode,
  vpnEncode,
  buildObfuscationPatch,
  applyPatchToVpnConfig,
  patchWgQuickString,
} from "@/utils/mergekeys";
import type {
  VpnConfig,
  AwgContainer,
  GeneratedParams,
  AwgVersion,
} from "@/utils/mergekeys";

export type EditorViewMode = "code" | "fields";

/** Client-side obfuscation fields (safe to edit; mirrored top-level on AWG). */
export const OBFUSCATION_KEYS = [
  "Jc",
  "Jmin",
  "Jmax",
  "I1",
  "I2",
  "I3",
  "I4",
  "I5",
];

export function useConfigEditor() {
  const rawText = ref("");
  const format = ref<AwgFormat>("unknown");
  const viewMode = ref<EditorViewMode>("code");
  const errorMsg = ref("");
  const successMsg = ref("");
  const findings = ref<Finding[]>([]);
  const awgContainerNames = ref<string[]>([]);
  const selectedContainer = ref<string>("");
  const activeKeyIndex = ref(0);

  /* ── Multi-key detection ──────────────────────────────────────────────── */

  /** Non-empty trimmed lines of rawText. */
  const keyLines = computed(() =>
    rawText.value
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean),
  );

  /** True when 2+ lines and every line is itself a vpn:// key. */
  const isMultiKey = computed(
    () =>
      keyLines.value.length >= 2 &&
      keyLines.value.every((l) => detectFormat(l) === "vpn"),
  );

  const keyCount = computed(() => (isMultiKey.value ? keyLines.value.length : 1));

  /** The text the editor currently operates on (active key, or all of rawText). */
  const activeText = computed(() => {
    if (!isMultiKey.value) return rawText.value;
    const i = Math.min(activeKeyIndex.value, keyLines.value.length - 1);
    return keyLines.value[i] ?? "";
  });

  /** Write `text` back as the active key (multi) or the whole buffer (single). */
  function setActiveText(text: string) {
    if (!isMultiKey.value) {
      rawText.value = text;
      return;
    }
    const lines = keyLines.value.slice();
    const i = Math.min(activeKeyIndex.value, lines.length - 1);
    lines[i] = text;
    rawText.value = lines.join("\n");
  }

  /* ── Single-key focus (drill into one key of a multi-key set) ──────────── */

  const focusedFrom = ref<string[] | null>(null);
  const focusIndex = ref(0);
  const inFocus = computed(() => focusedFrom.value !== null);

  /** Extract the active key from a multi-key set for full single-key editing. */
  function focusActiveKey() {
    if (!isMultiKey.value) return;
    const lines = keyLines.value.slice();
    const i = Math.min(activeKeyIndex.value, lines.length - 1);
    focusedFrom.value = lines;
    focusIndex.value = i;
    rawText.value = lines[i] ?? "";
  }

  /** Return to the multi-key list, writing the (normalised) edited key back. */
  function exitFocus() {
    if (focusedFrom.value === null) return;
    try {
      const normalised = vpnEncode(toVpnConfig()); // any format → vpn:// line
      const lines = focusedFrom.value.slice();
      lines[focusIndex.value] = normalised;
      focusedFrom.value = null;
      activeKeyIndex.value = focusIndex.value;
      rawText.value = lines.join("\n");
    } catch (e) {
      // Invalid content — keep the user in focus so they can fix it.
      errorMsg.value = e instanceof Error ? e.message : String(e);
    }
  }

  /* ── Derived ──────────────────────────────────────────────────────────── */

  const highlighted = computed(() => highlight(rawText.value, format.value));
  const canExportConf = computed(() => awgContainerNames.value.length > 0);

  /** Decode the active text into a VpnConfig (conf/json/vpn → VpnConfig). */
  function toVpnConfig(): VpnConfig {
    const t = activeText.value.trim();
    const fmt = detectFormat(t);
    if (fmt === "conf") return vpnDecode(confToVpn(t));
    if (fmt === "vpn") return vpnDecode(t);
    if (fmt === "json") return JSON.parse(t) as VpnConfig;
    throw new Error("Не удалось распознать формат (vpn:// / .conf / JSON).");
  }

  /** Refresh the AWG container list / default selection from the active text. */
  function refreshContainers() {
    try {
      const cfg = toVpnConfig();
      awgContainerNames.value = (cfg.containers || [])
        .filter((c) => c.awg != null)
        .map((c, i) => c.container || `awg_${i}`);
      selectedContainer.value =
        cfg.defaultContainer &&
        awgContainerNames.value.includes(cfg.defaultContainer)
          ? cfg.defaultContainer
          : awgContainerNames.value[0] || "";
    } catch {
      awgContainerNames.value = [];
      selectedContainer.value = "";
    }
  }

  // React to ANY content change: keep format fresh, refresh the AWG container
  // list (so pasting a key immediately enables .conf export), clear messages.
  // flush:'sync' so operations that set rawText can set a success message after.
  watch(
    rawText,
    (val) => {
      format.value = detectFormat(val);
      refreshContainers();
      errorMsg.value = "";
      successMsg.value = "";
    },
    { flush: "sync" },
  );

  // Keep the active-key index in range as keys are added/removed.
  watch(keyCount, (n) => {
    if (activeKeyIndex.value > n - 1) activeKeyIndex.value = Math.max(0, n - 1);
  });

  /* ── Operations ───────────────────────────────────────────────────────── */

  /** Load text (paste or file), detect format, refresh containers. */
  function load(text: string) {
    activeKeyIndex.value = 0;
    rawText.value = text;
  }

  /** Find the chosen AWG container in a decoded config. */
  function findChosen(cfg: VpnConfig): { awg: AwgContainer } | null {
    const containers = cfg.containers || [];
    const hit = containers.find(
      (c) =>
        (c.container || "") === selectedContainer.value ||
        (c.awg != null && selectedContainer.value === ""),
    );
    return hit && hit.awg ? (hit as { awg: AwgContainer }) : null;
  }

  /** Patch one obfuscation/danger field into the active key, in place. */
  function patchField(key: string, value: string) {
    try {
      const at = activeText.value;
      const fmt = detectFormat(at);
      const confText =
        fmt === "conf"
          ? at
          : vpnToConf(toVpnConfig(), selectedContainer.value).conf;
      const newConf = patchWgQuickString(confText, key, value);

      if (fmt === "conf") {
        setActiveText(newConf);
      } else {
        const cfg = toVpnConfig();
        const chosen = findChosen(cfg);
        if (chosen) {
          chosen.awg.config = newConf;
          if (OBFUSCATION_KEYS.includes(key)) chosen.awg[key] = value;
        }
        setActiveText(vpnEncode(cfg));
      }
      errorMsg.value = "";
    } catch (e) {
      errorMsg.value = e instanceof Error ? e.message : String(e);
    }
  }

  /** Apply one vpn config's obfuscation patch, returning the new encoded key. */
  function patchOneVpn(
    keyStr: string,
    p: GeneratedParams,
    ver: AwgVersion,
  ): { key: string; changed: string[] } {
    const cfg = vpnDecode(keyStr);
    const patch = buildObfuscationPatch(p, ver);
    const res = applyPatchToVpnConfig(cfg, patch);
    return { key: vpnEncode(res.updated), changed: res.changed };
  }

  /**
   * Update obfuscation (Jc/Jmin/Jmax/I1–I5). In multi-key mode every key is
   * patched; otherwise the single active config is. Returns changed fields.
   */
  function applyObfuscation(p: GeneratedParams, ver: AwgVersion): string[] {
    try {
      if (isMultiKey.value) {
        const changedAll = new Set<string>();
        let count = 0;
        const lines = keyLines.value.map((line) => {
          const { key, changed } = patchOneVpn(line, p, ver);
          changed.forEach((c) => changedAll.add(c));
          count++;
          return key;
        });
        rawText.value = lines.join("\n");
        successMsg.value = `Обфускация обновлена в ${count} ${pluralRu(count, ["ключе", "ключах", "ключах"])}: ${[...changedAll].join(", ")}.`;
        return [...changedAll];
      }

      const cfg = toVpnConfig();
      const patch = buildObfuscationPatch(p, ver);
      const res = applyPatchToVpnConfig(cfg, patch);
      setActiveText(
        format.value === "conf"
          ? vpnToConf(res.updated, selectedContainer.value).conf
          : vpnEncode(res.updated),
      );
      successMsg.value = res.changed.length
        ? `Обфускация обновлена: ${res.changed.join(", ")} (${res.containerCount} AWG-${pluralRu(res.containerCount, ["контейнер", "контейнера", "контейнеров"])}).`
        : "Параметры уже актуальны — изменений не потребовалось.";
      return res.changed;
    } catch (e) {
      errorMsg.value = e instanceof Error ? e.message : String(e);
      return [];
    }
  }

  /**
   * Convert the active key into another representation in place (the editor is
   * the live preview). Disabled in multi-key mode to keep one-key-per-line.
   */
  function convertTo(target: AwgFormat) {
    if (isMultiKey.value) {
      errorMsg.value =
        "Конвертация доступна для одного ключа. Оставьте в редакторе один ключ.";
      return;
    }
    try {
      const cfg = toVpnConfig();
      if (target === "vpn") setActiveText(vpnEncode(cfg));
      else if (target === "json")
        setActiveText(JSON.stringify(cfg, null, 2));
      else if (target === "conf")
        setActiveText(vpnToConf(cfg, selectedContainer.value).conf);
      else return;
    } catch (e) {
      errorMsg.value = e instanceof Error ? e.message : String(e);
    }
  }

  /** Encode the active config as a vpn:// key ("" + errorMsg on failure). */
  function exportVpn(): string {
    try {
      const key = vpnEncode(toVpnConfig());
      errorMsg.value = "";
      return key;
    } catch (e) {
      errorMsg.value = e instanceof Error ? e.message : String(e);
      return "";
    }
  }

  /** Extract the chosen AWG container as .conf ("" + errorMsg on failure). */
  function exportConf(): string {
    try {
      const out = vpnToConf(toVpnConfig(), selectedContainer.value).conf;
      errorMsg.value = "";
      return out;
    } catch (e) {
      errorMsg.value = e instanceof Error ? e.message : String(e);
      return "";
    }
  }

  /** Recompute validation findings from a flat AWG-param map. */
  function revalidate(params: Record<string, string | number>) {
    findings.value = validateAwgParams(params);
  }

  function clear() {
    rawText.value = "";
    format.value = "unknown";
    errorMsg.value = "";
    successMsg.value = "";
    findings.value = [];
    awgContainerNames.value = [];
    selectedContainer.value = "";
    activeKeyIndex.value = 0;
    focusedFrom.value = null;
    focusIndex.value = 0;
  }

  return {
    // state
    rawText,
    format,
    viewMode,
    errorMsg,
    successMsg,
    findings,
    awgContainerNames,
    selectedContainer,
    activeKeyIndex,
    // multi-key
    isMultiKey,
    keyCount,
    activeText,
    inFocus,
    focusIndex,
    focusActiveKey,
    exitFocus,
    // derived
    highlighted,
    canExportConf,
    // operations
    load,
    toVpnConfig,
    patchField,
    convertTo,
    applyObfuscation,
    exportVpn,
    exportConf,
    revalidate,
    clear,
  };
}
