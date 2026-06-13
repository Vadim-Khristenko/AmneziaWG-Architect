<script setup lang="ts">
/**
 * MergeKeysView.vue — Two-tab layout for the /mergekeys page.
 *
 * Two tabs:
 *   1. "editor" — Редактор & Конвертер (ConfigEditor component)
 *   2. "merge"  — merge containers from multiple vpn:// keys into one master key
 *
 * All operations are local (pako zlib in-browser). No data leaves the browser.
 */

import { onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useMergeKeys } from "@/composables/useMergeKeys";
import ConfigEditor from "@/components/ConfigEditor.vue";
import {
  GitMerge,
  FileCode2,
  HelpCircle,
  ChevronDown,
  Key,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  Download,
  FileJson,
  Layers,
  PlusCircle,
  X,
  Info,
  Check,
} from "lucide-vue-next";

const route = useRoute();

const {
  // Tab
  activeTab,
  switchTab,
  // Pending
  pendingCfg,
  pendingVer,
  hasPendingCfg,
  pendingBannerText,
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
  // Init
  initFromRoute,
} = useMergeKeys();

onMounted(() => {
  const tabParam = (route.query.tab as string) || null;
  initFromRoute(tabParam);
});

/* If user navigates with ?tab= query, react to it */
watch(
  () => route.query.tab,
  (tab) => {
    if (tab === "merge") {
      switchTab("merge");
    } else if (tab === "editor" || tab === "update" || tab === "inspect") {
      switchTab("editor");
    }
  }
);
</script>

<template>
  <div class="mk-wrap fade-in">
    <!-- Header -->
    <div class="mk-header">
      <div class="mk-badge">
        <GitMerge :size="12" />
        MERGE KEYS
      </div>
      <h1>MERGE<span>KEYS</span></h1>
      <p>Редактор ключей и объединение контейнеров Amnezia VPN</p>
    </div>

    <!-- Pending cfg banner (from generator) -->
    <div v-if="hasPendingCfg" class="mk-banner">
      <div class="mk-banner-icon">
        <CheckCircle2 :size="18" />
      </div>
      <div class="mk-banner-text">
        <b>Конфиг из генератора загружен.</b>
        {{ pendingBannerText }}
        Перейдите во вкладку «Редактор» и нажмите «Применить обфускацию».
      </div>
    </div>

    <!-- No pending cfg notice -->
    <div v-if="!hasPendingCfg" class="mk-notice">
      <div class="mk-notice-icon">
        <Info :size="18" />
      </div>
      <div class="mk-notice-text">
        <b>Конфиг обфускации не передан.</b>
        Для обновления параметров Jc/Jmin/Jmax/I1–I5 вернитесь на
        <router-link to="/">главную страницу</router-link>, нажмите
        <b>«СГЕНЕРИРОВАТЬ»</b>, затем <b>«Открыть MergeKeys»</b>.<br />
        Вы также можете отредактировать ключ вручную во вкладке
        <b @click="switchTab('editor')" class="mk-notice-link">«Редактор»</b>.<br />
        Вкладка <b>«Объединить ключи»</b> работает без генератора.
      </div>
    </div>

    <!-- Tabs -->
    <div class="mk-tabs">
      <button
        class="mk-tab-btn"
        :class="{ active: activeTab === 'editor' }"
        @click="switchTab('editor')"
      >
        <FileCode2 :size="14" />
        Редактор &amp; Конвертер
      </button>
      <button
        class="mk-tab-btn"
        :class="{ active: activeTab === 'merge' }"
        @click="switchTab('merge')"
      >
        <GitMerge :size="14" />
        Объединить ключи
      </button>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         PANE 1 — Editor & Converter
    ═══════════════════════════════════════════════════════════ -->
    <div v-show="activeTab === 'editor'" class="mk-pane visible">
      <ConfigEditor
        :pending-cfg="pendingCfg"
        :pending-ver="pendingVer"
        :is-copied="isCopied"
        @copy="copyToClipboard"
        @download="downloadText"
      />
    </div>
    <!-- /editor pane -->

    <!-- ═══════════════════════════════════════════════════════════
         PANE 2 — Merge containers
    ═══════════════════════════════════════════════════════════ -->
    <div v-show="activeTab === 'merge'" class="mk-pane visible">
      <!-- How-it-works -->
      <div class="mk-how" :class="{ open: howMergeOpen }">
        <div class="mk-how-head" @click="toggleHowMerge">
          <HelpCircle :size="14" class="icon-amber" />
          <span class="mk-how-title">Зачем объединять ключи?</span>
          <span class="mk-how-arrow">
            <ChevronDown :size="14" />
          </span>
        </div>
        <div class="mk-how-body">
          <div class="mk-how-item">
            <div class="mk-how-num">?</div>
            <div>
              Amnezia VPN поддерживает несколько контейнеров (протоколов) в
              одном ключе: <b>AWG + XRay, AWG + OpenVPN</b> и т.д. Это
              позволяет переключаться между протоколами без смены ключа.
            </div>
          </div>
          <div class="mk-how-item">
            <div class="mk-how-num">1</div>
            <div>
              Вставьте два или более vpn://-ключа в слоты ниже. Например,
              первый — ключ AWG, второй — ключ XRay от того же сервера.
            </div>
          </div>
          <div class="mk-how-item">
            <div class="mk-how-num">2</div>
            <div>
              Нажмите <b>«Объединить»</b>. Контейнеры из всех ключей будут
              собраны в один мастер-ключ. Дубликаты (одинаковое имя контейнера)
              пропускаются с предупреждением.
            </div>
          </div>
          <div class="mk-how-item">
            <div class="mk-how-num">3</div>
            <div>
              Если открыт из генератора — новые параметры обфускации AWG будут
              применены автоматически к AWG-контейнерам в итоговом ключе.
            </div>
          </div>
          <div class="mk-compat mk-compat-info">
            <Info :size="15" class="flex-shrink" />
            <span>
              Метаданные (dns1, dns2, hostName, defaultContainer) берутся из
              <b>первого ключа</b>. Описание объединяется через « + ».
            </span>
          </div>
        </div>
      </div>

      <!-- Slots card -->
      <div class="mk-card">
        <div class="mk-card-head">
          <Layers :size="14" class="icon-amber" />
          <span class="mk-card-title">Ключи для объединения</span>
          <span class="mk-summary" style="color: var(--text3)">
            минимум 2, максимум 4
          </span>
        </div>
        <div class="mk-card-body">
          <!-- Dynamic slots -->
          <div class="mk-slots-list">
            <div
              v-for="(slot, idx) in mergeSlots"
              :key="slot.id"
              class="mk-slot"
            >
              <div class="mk-slot-head">
                <span class="mk-slot-num">{{ idx + 1 }}</span>
                <span class="mk-slot-label">
                  <Key :size="11" />
                  {{ getSlotLabel(idx) }}
                  <span class="mk-slot-hint">(vpn://...)</span>
                </span>
                <button
                  v-if="mergeSlots.length > 2 && idx === mergeSlots.length - 1"
                  class="mk-btn-icon mk-btn-icon-sm"
                  title="Удалить слот"
                  @click="removeSlot(idx)"
                >
                  <X :size="11" />
                </button>
              </div>
              <div class="mk-slot-row">
                <textarea
                  v-model="slot.value"
                  class="mk-ta"
                  rows="3"
                  placeholder="vpn://AAAGX..."
                  @input="clearMergeResult()"
                ></textarea>
                <div class="mk-slot-btns">
                  <button
                    class="mk-btn-icon"
                    title="Просмотр JSON"
                    @click="mergeDecodeSlot(idx)"
                  >
                    <FileJson :size="13" />
                  </button>
                  <button
                    class="mk-btn-icon mk-btn-icon-danger"
                    title="Очистить"
                    @click="clearSlot(idx)"
                  >
                    <X :size="13" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Add slot button -->
          <button
            v-if="canAddSlot"
            class="mk-add-slot"
            @click="addSlot"
          >
            <PlusCircle :size="13" />
            Добавить ещё один ключ
          </button>

          <div class="mk-divider"></div>

          <div class="mk-actions">
            <button class="mk-btn-primary" @click="mergeContainers">
              <GitMerge :size="14" />
              Объединить
            </button>
            <button class="mk-btn-ghost" @click="clearAllSlots">
              <Trash2 :size="13" />
              Очистить всё
            </button>
          </div>

          <!-- Result block -->
          <div
            v-if="mergeState !== 'idle'"
            class="mk-result"
            style="display: flex"
          >
            <!-- Error -->
            <div
              v-if="mergeState === 'error'"
              class="mk-err"
              style="display: flex"
            >
              <div class="mk-err-icon">
                <XCircle :size="15" />
              </div>
              <div class="mk-err-text">{{ mergeErrorMsg }}</div>
            </div>

            <!-- Warnings -->
            <div
              v-if="mergeWarnings.length > 0"
              class="mk-warnings"
              style="display: block"
            >
              <div
                v-for="(w, wi) in mergeWarnings"
                :key="wi"
                style="margin-bottom: 4px"
              >
                ⚠ {{ w }}
              </div>
            </div>

            <!-- OK -->
            <div
              v-if="mergeState === 'ok'"
              class="mk-ok"
              style="display: flex"
            >
              <div class="mk-ok-pill">
                <CheckCircle2 :size="14" />
                <span>Ключи объединены</span>
                <span
                  class="mk-summary"
                  style="margin-left: auto; text-align: right"
                >
                  {{ mergeSummary }}
                </span>
              </div>

              <div>
                <div class="mk-label">
                  <Key :size="11" />
                  Объединённый ключ
                </div>
                <div class="mk-out-row">
                  <textarea
                    :value="mergeOutput"
                    class="mk-ta"
                    rows="3"
                    readonly
                  ></textarea>
                  <div class="mk-out-actions">
                    <button
                      class="mk-btn-sec"
                      :class="{ copied: isCopied('mergeCopy') }"
                      title="Копировать"
                      @click="copyToClipboard(mergeOutput, 'mergeCopy')"
                    >
                      <template v-if="isCopied('mergeCopy')">
                        <Check :size="13" />
                        Скопировано!
                      </template>
                      <template v-else>
                        <Copy :size="13" />
                        Копировать
                      </template>
                    </button>
                    <button
                      class="mk-btn-ghost"
                      title="Скачать JSON"
                      @click="downloadResult(mergeOutput)"
                    >
                      <Download :size="13" />
                      JSON
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Preview -->
            <div
              v-if="mergeState === 'preview'"
              class="mk-preview"
              style="display: flex"
            >
              <div class="mk-preview-label">
                <FileJson :size="11" style="vertical-align: middle" />
                {{ mergePreviewLabel }}
              </div>
              <pre class="mk-preview-code">{{ mergePreviewJson }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- /merge pane -->
  </div>
</template>

<style scoped>
/* ── MergeKeys page-specific styles (scoped) ──────────────────── */

.mk-wrap {
  position: relative;
  z-index: 10;
  flex: 1;
  width: 95%;
  max-width: 960px;
  margin: 0 auto;
  padding: 36px 20px 60px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Header */
.mk-header {
  text-align: center;
  padding-bottom: 8px;
}

.mk-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: rgba(232, 168, 64, 0.1);
  border: 1px solid rgba(232, 168, 64, 0.28);
  border-radius: 20px;
  font-family: var(--fu);
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--amber2);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 14px;
}

.mk-header h1 {
  font-family: var(--fu);
  font-weight: 900;
  font-size: clamp(1.6rem, 4vw, 2.6rem);
  letter-spacing: -0.02em;
  margin-bottom: 8px;
}
.mk-header h1 span {
  color: transparent;
  -webkit-text-stroke: 1px rgba(100, 212, 224, 0.47);
}
.mk-header p {
  color: var(--text2);
  font-size: 0.88rem;
}

/* Pending banner */
.mk-banner {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 18px;
  background: rgba(92, 184, 122, 0.07);
  border: 1px solid rgba(92, 184, 122, 0.25);
  border-radius: 12px;
}
.mk-banner-icon {
  color: var(--green);
  flex-shrink: 0;
  margin-top: 1px;
}
.mk-banner-text {
  font-size: 0.78rem;
  color: var(--text2);
  line-height: 1.5;
}
.mk-banner-text b {
  color: var(--green);
}

/* No-cfg notice */
.mk-notice {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 18px;
  background: rgba(232, 168, 64, 0.06);
  border: 1px solid rgba(232, 168, 64, 0.2);
  border-radius: 12px;
}
.mk-notice-icon {
  color: var(--amber);
  flex-shrink: 0;
  margin-top: 1px;
}
.mk-notice-text {
  font-size: 0.78rem;
  color: var(--text2);
  line-height: 1.5;
}
.mk-notice-text b {
  color: var(--amber2);
}
.mk-notice-text a {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* Tabs */
.mk-tabs {
  display: flex;
  gap: 0;
  background: var(--bg2);
  border: 1px solid var(--border2);
  border-radius: 12px;
  padding: 5px;
  align-self: center;
}
.mk-tab-btn {
  background: transparent;
  border: none;
  color: var(--text3);
  padding: 10px 22px;
  border-radius: 8px;
  font-family: var(--fu);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: 0.25s;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}
.mk-tab-btn:hover {
  color: var(--text);
}
.mk-tab-btn.active {
  background: var(--bg4);
  color: var(--accent);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
}

/* Panes */
.mk-pane {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* Section card */
.mk-card {
  background: var(--bg2);
  border: 1px solid var(--border2);
  border-radius: 16px;
  overflow: hidden;
}
.mk-card-head {
  padding: 14px 20px;
  border-bottom: 1px solid var(--border2);
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.mk-card-title {
  font-family: var(--fm);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--text2);
  flex: 1;
  text-transform: uppercase;
}
.mk-card-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Label */
.mk-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Textarea */
.mk-ta {
  width: 100%;
  background: var(--bg3);
  border: 1px solid var(--border2);
  border-radius: 10px;
  padding: 12px;
  color: var(--text);
  font-family: var(--fm);
  font-size: 0.7rem;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  transition: border-color 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  box-sizing: border-box;
}
.mk-ta:focus {
  border-color: rgba(232, 168, 64, 0.4);
}
.mk-ta::placeholder {
  color: var(--text3);
}

/* Readonly output */
.mk-ta[readonly] {
  color: var(--amber2);
  cursor: text;
  background: #080604;
  border-color: rgba(232, 168, 64, 0.2);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* Action row */
.mk-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* Primary action button */
.mk-btn-primary {
  background: linear-gradient(135deg, var(--amber) 0%, #c47b1a 100%);
  border: none;
  padding: 12px 20px;
  border-radius: 10px;
  color: var(--bg);
  font-family: var(--fu);
  font-weight: 800;
  font-size: 0.78rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: 0.25s;
  white-space: nowrap;
}
.mk-btn-primary:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(232, 168, 64, 0.25);
}
.mk-btn-primary:active {
  transform: translateY(0);
}

/* Secondary button */
.mk-btn-sec {
  background: rgba(232, 168, 64, 0.08);
  border: 1px solid rgba(232, 168, 64, 0.25);
  padding: 11px 16px;
  border-radius: 10px;
  color: var(--amber2);
  font-family: var(--fu);
  font-weight: 700;
  font-size: 0.75rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  transition: 0.25s;
  white-space: nowrap;
}
.mk-btn-sec:hover {
  background: rgba(232, 168, 64, 0.14);
  transform: translateY(-1px);
}

/* Ghost button */
.mk-btn-ghost {
  background: transparent;
  border: 1px solid var(--border2);
  padding: 11px 14px;
  border-radius: 10px;
  color: var(--text3);
  font-family: var(--fu);
  font-weight: 700;
  font-size: 0.75rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  white-space: nowrap;
}
.mk-btn-ghost:hover {
  color: var(--text2);
  border-color: rgba(232, 168, 64, 0.2);
}

/* Icon button (small) */
.mk-btn-icon {
  background: rgba(232, 168, 64, 0.08);
  border: 1px solid rgba(232, 168, 64, 0.2);
  border-radius: 8px;
  padding: 7px 10px;
  color: var(--amber2);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
  flex-shrink: 0;
}
.mk-btn-icon:hover {
  background: rgba(232, 168, 64, 0.15);
}

.mk-btn-icon-sm {
  width: 26px;
  height: 26px;
  border-radius: 6px;
}

.mk-btn-icon-danger {
  background: rgba(212, 96, 74, 0.08);
  border-color: rgba(212, 96, 74, 0.2);
  color: var(--red);
}
.mk-btn-icon-danger:hover {
  background: rgba(212, 96, 74, 0.15);
}

/* Result block */
.mk-result {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Status pills */
.mk-ok {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mk-ok-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(92, 184, 122, 0.07);
  border: 1px solid rgba(92, 184, 122, 0.2);
  border-radius: 10px;
  font-size: 0.75rem;
  color: var(--green2);
  flex-wrap: wrap;
}
.mk-err {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: rgba(212, 96, 74, 0.07);
  border: 1px solid rgba(212, 96, 74, 0.25);
  border-radius: 10px;
}
.mk-err-icon {
  color: var(--red);
  flex-shrink: 0;
  margin-top: 1px;
}
.mk-err-text {
  font-size: 0.75rem;
  color: var(--red);
  line-height: 1.5;
  font-family: var(--fm);
}

/* Preview block */
.mk-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.mk-preview-label {
  font-size: 0.7rem;
  font-family: var(--fm);
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.mk-preview-code {
  background: var(--bg);
  border: 1px solid var(--border2);
  border-radius: 10px;
  padding: 14px;
  font-family: var(--fm);
  font-size: 0.65rem;
  color: var(--text2);
  overflow: auto;
  max-height: 320px;
  white-space: pre;
  line-height: 1.6;
}

/* Warnings */
.mk-warnings {
  padding: 10px 14px;
  background: rgba(232, 168, 64, 0.05);
  border: 1px solid rgba(232, 168, 64, 0.2);
  border-radius: 10px;
  font-size: 0.72rem;
  color: var(--amber2);
  line-height: 1.6;
  font-family: var(--fm);
}

/* Output row */
.mk-out-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}
.mk-out-row .mk-ta {
  flex: 1;
}
.mk-out-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}

/* Slots list */
.mk-slots-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Slot */
.mk-slot {
  background: var(--bg3);
  border: 1px solid var(--border2);
  border-radius: 12px;
  padding: 14px;
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  animation: fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.mk-slot:focus-within {
  border-color: rgba(232, 168, 64, 0.35);
  background: var(--bg4);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}
.mk-slot-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.mk-slot-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(232, 168, 64, 0.12);
  border: 1px solid rgba(232, 168, 64, 0.25);
  font-size: 0.6rem;
  font-weight: 700;
  color: var(--amber2);
  flex-shrink: 0;
}
.mk-slot-label {
  font-size: 0.7rem;
  font-family: var(--fm);
  font-weight: 600;
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
}
.mk-slot-hint {
  color: var(--text3);
  font-weight: 400;
  text-transform: none;
}
.mk-slot-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}
.mk-slot-btns {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

/* Add slot button */
.mk-add-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: transparent;
  border: 1px dashed var(--border2);
  border-radius: 12px;
  color: var(--text3);
  font-family: var(--fm);
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
  width: 100%;
}
.mk-add-slot:hover {
  border-color: rgba(232, 168, 64, 0.3);
  color: var(--accent);
  background: rgba(232, 168, 64, 0.03);
}

/* Section divider */
.mk-divider {
  height: 1px;
  background: var(--border2);
  margin: 4px 0;
}

/* How-it-works collapse */
.mk-how {
  background: var(--bg2);
  border: 1px solid var(--border2);
  border-radius: 14px;
  overflow: hidden;
}
.mk-how-head {
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}
.mk-how-head:hover {
  background: rgba(232, 168, 64, 0.06);
}
.mk-how-title {
  font-size: 0.75rem;
  font-family: var(--fm);
  font-weight: 700;
  color: var(--text2);
  flex: 1;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.mk-how-arrow {
  color: var(--text3);
  transition: transform 0.25s;
  display: flex;
}
.mk-how.open .mk-how-arrow {
  transform: rotate(180deg);
}
.mk-how-body {
  max-height: 0;
  overflow: hidden;
  padding: 0 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition:
    max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    padding 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.mk-how.open .mk-how-body {
  max-height: 9999px;
  padding: 10px 18px 18px;
}
.mk-how-item {
  display: flex;
  gap: 12px;
  font-size: 0.75rem;
  color: var(--text2);
  line-height: 1.6;
}
.mk-how-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(232, 168, 64, 0.12);
  border: 1px solid rgba(232, 168, 64, 0.25);
  color: var(--amber2);
  font-family: var(--fm);
  font-size: 0.65rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

/* Copied state */
.mk-btn-sec.copied {
  background: rgba(92, 184, 122, 0.12);
  border-color: rgba(92, 184, 122, 0.3);
  color: var(--green);
}

/* Summary text */
.mk-summary {
  font-size: 0.72rem;
  color: var(--text2);
  font-family: var(--fm);
  line-height: 1.5;
}

/* Version compat info */
.mk-compat {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 0.73rem;
  line-height: 1.5;
  margin-top: 4px;
}
.mk-compat-info {
  background: rgba(100, 212, 224, 0.05);
  border: 1px solid rgba(100, 212, 224, 0.18);
  color: #64d4e0;
}

/* Utility */
.icon-amber {
  color: var(--amber2);
}
.flex-shrink {
  flex-shrink: 0;
}

/* Animation */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeInUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* Notice link */
.mk-notice-link {
  cursor: pointer;
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.mk-notice-link:hover {
  color: var(--amber3);
}

/* ── Mobile ──────────────────────────────────────────────────── */
@media (max-width: 600px) {
  .mk-wrap {
    width: 100%;
    padding: 24px 12px 48px;
  }

  .mk-tabs {
    width: 100%;
    flex-direction: column;
    border-radius: 14px;
  }
  .mk-tab-btn {
    width: 100%;
    justify-content: center;
    padding: 11px 14px;
    font-size: 0.75rem;
    border-radius: 8px;
  }
  .mk-out-row {
    flex-direction: column;
  }
  .mk-out-actions {
    flex-direction: row;
    width: 100%;
  }
  .mk-out-actions .mk-btn-sec,
  .mk-out-actions .mk-btn-ghost {
    flex: 1;
    justify-content: center;
  }

  .mk-card-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .mk-ok-pill {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .mk-ok-pill .mk-summary {
    margin-left: 0 !important;
    text-align: left !important;
  }
}
</style>
