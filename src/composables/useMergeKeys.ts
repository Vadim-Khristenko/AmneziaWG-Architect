/**
 * useMergeKeys — Vue composable for MergeKeys reactive state and logic.
 *
 * Manages two tabs:
 *   1. "editor" — Редактор & Конвертер (handled by ConfigEditor component)
 *   2. "merge"  — merge containers from multiple vpn:// keys into one master key
 *
 * All crypto/codec operations happen locally via src/utils/mergekeys.ts (pako).
 * No data leaves the browser.
 */

import { ref, computed } from "vue";
import type { Ref } from "vue";
import {
  vpnDecode,
  vpnEncode,
  buildObfuscationPatch,
  applyPatchToVpnConfig,
  mergeVpnConfigs,
  escapeHtml,
} from "@/utils/mergekeys";
import type {
  GeneratedParams,
  AwgVersion,
  VpnConfig,
} from "@/utils/mergekeys";

/* ═══════════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════════ */

export type MkTab = "editor" | "merge";

export interface MkSlot {
  id: number;
  value: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Composable
   ═══════════════════════════════════════════════════════════════════════════ */

export function useMergeKeys() {
  /* ── Active tab ──────────────────────────────────────────────────────── */
  const activeTab: Ref<MkTab> = ref("editor");

  function switchTab(tab: MkTab) {
    activeTab.value = tab;
  }

  /* ── Pending config from generator (via sessionStorage) ──────────────── */
  const pendingCfg: Ref<GeneratedParams | null> = ref(null);
  const pendingVer: Ref<AwgVersion> = ref("2.0");

  /** Load pending config from sessionStorage (set by the generator page). */
  function loadPendingCfg() {
    try {
      const raw = sessionStorage.getItem("awg_pending_cfg");
      if (raw) {
        const parsed = JSON.parse(raw) as {
          cfg?: GeneratedParams;
          ver?: AwgVersion;
        };
        pendingCfg.value = parsed.cfg || null;
        pendingVer.value = parsed.ver || "2.0";
        sessionStorage.removeItem("awg_pending_cfg");
      }
    } catch {
      /* ignore */
    }
  }

  const hasPendingCfg = computed(() => pendingCfg.value !== null);

  /** Human-readable summary of pending config for the banner. */
  const pendingBannerText = computed<string>(() => {
    const cfg = pendingCfg.value;
    if (!cfg) return "";
    const base = `Загружен конфиг AWG ${pendingVer.value} (Jc=${cfg.jc}, Jmin=${cfg.jmin}, Jmax=${cfg.jmax}).`;
    const cps =
      pendingVer.value !== "1.0"
        ? " CPS I1–I5 готовы к вставке."
        : " AWG 1.0: только Jc/Jmin/Jmax.";
    return base + cps;
  });

  /** Compat pills info for header area. */
  const compatPills = computed<
    Array<{ label: string; color: "green" | "amber" | "red" }>
  >(() => {
    if (!pendingCfg.value) {
      return [{ label: "Нет конфига", color: "red" }];
    }
    if (pendingVer.value === "1.0") {
      return [
        { label: `AWG ${pendingVer.value}`, color: "amber" },
        { label: "Jc/Jmin/Jmax", color: "amber" },
        { label: "I1–I5 не поддерж.", color: "red" },
      ];
    }
    return [
      { label: `AWG ${pendingVer.value}`, color: "green" },
      { label: "Jc/Jmin/Jmax", color: "green" },
      { label: "I1–I5 (CPS)", color: "green" },
    ];
  });

  /* ══════════════════════════════════════════════════════════════════════
     Tab 2 — Merge containers
     ══════════════════════════════════════════════════════════════════════ */

  const MK_MAX_SLOTS = 4;
  const MK_MIN_SLOTS = 2;

  let slotIdCounter = 0;

  function makeSlot(value = ""): MkSlot {
    return { id: slotIdCounter++, value };
  }

  const mergeSlots: Ref<MkSlot[]> = ref([makeSlot(), makeSlot()]);

  const mergeOutput = ref("");
  const mergeSummary = ref("");
  const mergeErrorMsg = ref("");
  const mergeWarnings: Ref<string[]> = ref([]);
  const mergePreviewJson = ref("");
  const mergePreviewLabel = ref("Содержимое ключа");

  type MergeState = "idle" | "ok" | "error" | "preview";
  const mergeState: Ref<MergeState> = ref("idle");

  const canAddSlot = computed(() => mergeSlots.value.length < MK_MAX_SLOTS);

  function clearMergeResult() {
    mergeState.value = "idle";
    mergeOutput.value = "";
    mergeSummary.value = "";
    mergeErrorMsg.value = "";
    mergeWarnings.value = [];
    mergePreviewJson.value = "";
    mergePreviewLabel.value = "Содержимое ключа";
  }

  function addSlot() {
    if (mergeSlots.value.length >= MK_MAX_SLOTS) return;
    mergeSlots.value.push(makeSlot());
  }

  function removeSlot(index: number) {
    if (mergeSlots.value.length <= MK_MIN_SLOTS) return;
    mergeSlots.value.splice(index, 1);
    clearMergeResult();
  }

  function clearSlot(index: number) {
    if (mergeSlots.value[index]) {
      mergeSlots.value[index].value = "";
    }
    clearMergeResult();
  }

  function clearAllSlots() {
    for (const slot of mergeSlots.value) {
      slot.value = "";
    }
    clearMergeResult();
  }

  /** Decode and preview JSON for a single merge slot. */
  function mergeDecodeSlot(index: number) {
    clearMergeResult();

    const slot = mergeSlots.value[index];
    if (!slot || !slot.value.trim()) {
      mergeErrorMsg.value = `Слот #${index + 1} пуст.`;
      mergeState.value = "error";
      return;
    }

    try {
      const decoded = vpnDecode(slot.value.trim());
      mergePreviewJson.value = JSON.stringify(decoded, null, 2);
      mergePreviewLabel.value = `Содержимое ключа #${index + 1}`;
      mergeState.value = "preview";
    } catch (err: unknown) {
      mergeErrorMsg.value = `Ошибка в ключе #${index + 1}: ${err instanceof Error ? err.message : String(err)}`;
      mergeState.value = "error";
    }
  }

  /** Merge containers from all filled slots. */
  function mergeContainers() {
    clearMergeResult();

    // Collect non-empty slot values
    const filled = mergeSlots.value
      .map((slot, idx) => ({ idx, val: slot.value.trim() }))
      .filter((s) => s.val.length > 0);

    if (filled.length < 2) {
      mergeErrorMsg.value = "Заполните минимум 2 поля с ключами vpn://.";
      mergeState.value = "error";
      return;
    }

    try {
      // Decode all keys
      const decoded: VpnConfig[] = filled.map((s) => {
        try {
          return vpnDecode(s.val);
        } catch (e) {
          throw new Error(
            `Ошибка в ключе #${s.idx + 1}: ${e instanceof Error ? e.message : String(e)}`
          );
        }
      });

      // Merge containers
      const mergeResult = mergeVpnConfigs(decoded);

      // If we have a pending config — apply obfuscation to AWG containers
      let obfChanged: string[] = [];
      if (pendingCfg.value) {
        try {
          const patch = buildObfuscationPatch(
            pendingCfg.value,
            pendingVer.value
          );
          const obfResult = applyPatchToVpnConfig(mergeResult.merged, patch);
          mergeResult.merged = obfResult.updated;
          obfChanged = obfResult.changed;
        } catch {
          // No AWG containers — normal for merge without AWG
        }
      }

      // Encode result
      const newKey = vpnEncode(mergeResult.merged);
      mergeOutput.value = newKey;

      // Build summary
      const lines: string[] = [];
      lines.push(
        `Объединено ${mergeResult.stats.unique} контейнеров из ${filled.length} ключей.`
      );
      if (mergeResult.stats.dupes > 0) {
        lines.push(`Пропущено дублей: ${mergeResult.stats.dupes}.`);
      }
      if (obfChanged.length > 0) {
        lines.push(`Обфускация AWG обновлена: ${obfChanged.join(", ")}.`);
      }
      mergeSummary.value = lines.join(" ");

      // Warnings
      mergeWarnings.value = mergeResult.warnings;

      mergeState.value = "ok";
    } catch (err: unknown) {
      mergeErrorMsg.value =
        err instanceof Error ? err.message : String(err);
      mergeState.value = "error";
    }
  }

  /* ══════════════════════════════════════════════════════════════════════
     Shared: Copy / Download
     ══════════════════════════════════════════════════════════════════════ */

  /** Which button IDs are in "copied" animation state. */
  const copiedButtons = ref<Set<string>>(new Set());

  /**
   * Copy text to clipboard. Sets copiedButtons for 2s for visual feedback.
   * @param text - The text to copy.
   * @param buttonId - An arbitrary string ID to track copied state.
   */
  async function copyToClipboard(text: string, buttonId: string) {
    if (!text) return;

    const markCopied = () => {
      copiedButtons.value.add(buttonId);
      // Force reactivity (Set mutation is not tracked by Vue)
      copiedButtons.value = new Set(copiedButtons.value);
      setTimeout(() => {
        copiedButtons.value.delete(buttonId);
        copiedButtons.value = new Set(copiedButtons.value);
      }, 2000);
    };

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        markCopied();
        return;
      } catch {
        // fallback
      }
    }

    // Fallback for insecure contexts
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    markCopied();
  }

  function isCopied(buttonId: string): boolean {
    return copiedButtons.value.has(buttonId);
  }

  /**
   * Download the output as a JSON file.
   * Tries to decode vpn:// first for pretty JSON; falls back to raw text.
   */
  function downloadResult(vpnString: string) {
    if (!vpnString) return;

    try {
      const decoded = vpnDecode(vpnString);
      const json = JSON.stringify(decoded, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `amnezia-merged-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      const blob = new Blob([vpnString], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `amnezia-key-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Generic text download helper for the editor component.
   */
  function downloadText(text: string, filename: string) {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ── Slot validation ──────────────────────────────────────────────────── */

  const slotValid = ref<Record<number, boolean | null>>({});

  function validateSlot(idx: number) {
    const val = mergeSlots.value[idx]?.value?.trim();
    if (!val) {
      slotValid.value[idx] = null;
      return;
    }
    try {
      vpnDecode(val);
      slotValid.value[idx] = true;
    } catch {
      slotValid.value[idx] = false;
    }
  }

  /* ══════════════════════════════════════════════════════════════════════
     How-it-works collapse state
     ══════════════════════════════════════════════════════════════════════ */

  const howMergeOpen = ref(false);

  function toggleHowMerge() {
    howMergeOpen.value = !howMergeOpen.value;
  }

  /* ══════════════════════════════════════════════════════════════════════
     Initialization
     ══════════════════════════════════════════════════════════════════════ */

  function initFromRoute(tabParam?: string | null) {
    loadPendingCfg();
    // Map legacy tab names to new ones for backward-compatible deep links
    if (tabParam === "merge") {
      switchTab("merge");
    } else if (tabParam === "update" || tabParam === "inspect") {
      // Legacy values → editor tab
      switchTab("editor");
    }
    // "editor" or anything else: keep default ("editor")
  }

  /* ══════════════════════════════════════════════════════════════════════
     Slot labels
     ══════════════════════════════════════════════════════════════════════ */

  const slotLabels = ["Первый ключ", "Второй ключ", "Третий ключ", "Четвёртый ключ"];

  function getSlotLabel(index: number): string {
    return slotLabels[index] || `Ключ #${index + 1}`;
  }

  /* ══════════════════════════════════════════════════════════════════════
     Public API
     ══════════════════════════════════════════════════════════════════════ */

  return {
    // Tab
    activeTab,
    switchTab,

    // Pending config
    pendingCfg,
    pendingVer,
    hasPendingCfg,
    pendingBannerText,
    compatPills,

    // Tab 2: Merge
    mergeSlots,
    mergeOutput,
    mergeSummary,
    mergeErrorMsg,
    mergeWarnings,
    mergePreviewJson,
    mergePreviewLabel,
    mergeState,
    canAddSlot,
    clearMergeResult,
    addSlot,
    removeSlot,
    clearSlot,
    clearAllSlots,
    mergeDecodeSlot,
    mergeContainers,

    // Slot validation
    slotValid,
    validateSlot,

    // Shared
    copyToClipboard,
    isCopied,
    downloadResult,
    downloadText,

    // How-it-works
    howMergeOpen,
    toggleHowMerge,

    // Slot helpers
    getSlotLabel,
    MK_MAX_SLOTS,

    // Init
    initFromRoute,
    loadPendingCfg,

    // Re-export for use in template
    escapeHtml,
  };
}
