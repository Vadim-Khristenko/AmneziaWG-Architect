<script setup lang="ts">
/**
 * ConfigEditor.vue — "Редактор & Конвертер" for the /mergekeys page.
 *
 * Uses useConfigEditor composable as the single source of truth.
 * Supports three input formats: vpn:// key, AmneziaWG .conf, JSON.
 * Two views: Code (overlay highlight) and Fields (structured inputs).
 */

import { ref, reactive, computed, watch } from "vue";
import {
    FileCode2,
    LayoutList,
    Upload,
    Zap,
    Copy,
    Download,
    AlertTriangle,
    XCircle,
    CheckCircle2,
    ChevronDown,
    Check,
    KeyRound,
    Braces,
    Layers,
    ArrowLeft,
} from "lucide-vue-next";
import {
    useConfigEditor,
    OBFUSCATION_KEYS,
} from "@/composables/useConfigEditor";
import { parseConf, vpnToConf } from "@/utils/awgFormat";
import { pluralRu } from "@/utils/plural";
import type { GeneratedParams, AwgVersion } from "@/utils/mergekeys";

const KEY_FORMS: [string, string, string] = ["ключ", "ключа", "ключей"];

/* ── Props & emits ──────────────────────────────────────────────────────── */

const props = defineProps<{
    pendingCfg: GeneratedParams | null;
    pendingVer: AwgVersion;
    isCopied: (id: string) => boolean;
}>();

const emit = defineEmits<{
    (e: "copy", text: string, id: string): void;
    (e: "download", text: string, filename: string): void;
}>();

/* ── Composable — destructure refs so the template can auto-unwrap them ─── */

const {
    rawText,
    format,
    viewMode,
    errorMsg,
    successMsg,
    findings,
    awgContainerNames,
    selectedContainer,
    activeKeyIndex,
    isMultiKey,
    keyCount,
    inFocus,
    focusIndex,
    focusActiveKey,
    exitFocus,
    highlighted,
    canExportConf,
    load,
    toVpnConfig,
    patchField,
    convertTo,
    applyObfuscation,
    exportVpn,
    exportConf,
    revalidate,
} = useConfigEditor();

/* ── Code view: overlay + gutter scroll sync ───────────────────────────── */

const preRef = ref<HTMLPreElement | null>(null);
const gutterRef = ref<HTMLDivElement | null>(null);

/** Line numbers for the gutter. */
const lineCount = computed(() => rawText.value.split("\n").length);

function onTextareaScroll(ev: Event) {
    const ta = ev.target as HTMLTextAreaElement;
    if (preRef.value) {
        preRef.value.scrollTop = ta.scrollTop;
        preRef.value.scrollLeft = ta.scrollLeft;
    }
    if (gutterRef.value) gutterRef.value.scrollTop = ta.scrollTop;
}

/** Guard: true only during a Fields edit, so the rawText watcher below does
 *  not re-sync (and clobber) the field the user is typing into. */
let editingField = false;

/* ── File load ──────────────────────────────────────────────────────────── */

async function onFileChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const text = await file.text();
    load(text);
    // Reset the input so the same file can be re-loaded
    input.value = "";
}

/* ── Format label ───────────────────────────────────────────────────────── */

function formatLabel(fmt: string): string {
    if (fmt === "conf") return "AmneziaWG .conf";
    if (fmt === "vpn") return "vpn:// ключ";
    if (fmt === "json") return "JSON";
    return "—";
}

/* ── Fields view ────────────────────────────────────────────────────────── */

// Reactive flat field map {key: value}
const fields = reactive<Record<string, string>>({});
// Fields-view-local error (e.g. the loaded key/file has no AWG configuration).
const fieldsErr = ref("");

function clearFields() {
    for (const k of Object.keys(fields)) delete fields[k];
}

function syncFieldsFromText() {
    if (!rawText.value.trim()) {
        clearFields();
        fieldsErr.value = "";
        return;
    }
    try {
        // toVpnConfig() throws on an unrecognised format; vpnToConf() throws when
        // the (selected) key has no AmneziaWG container — surface both as errors.
        const cfg = toVpnConfig();
        const confText = vpnToConf(cfg, selectedContainer.value).conf;
        const parsed = parseConf(confText);
        clearFields();
        for (const section of parsed.sections) {
            for (const entry of section.entries) {
                fields[entry.key] = entry.value;
            }
        }
        fieldsErr.value = "";
    } catch (e) {
        clearFields();
        fieldsErr.value = e instanceof Error ? e.message : String(e);
    }
}

// Computed: obfuscation fields (from OBFUSCATION_KEYS that exist in fields)
function obfuscationFields(): string[] {
    return OBFUSCATION_KEYS.filter((k) => k in fields);
}

// Computed: "danger zone" fields = all non-obfuscation keys
function dangerFields(): string[] {
    return Object.keys(fields).filter((k) => !OBFUSCATION_KEYS.includes(k));
}

// Get finding badge for a field key
function findingForField(key: string) {
    return findings.value.find((f) =>
        f.field.split("/").some((part) => part === key),
    );
}

// On any field edit: patch the underlying config (composable owns the logic),
// then re-validate. editingField guards the rawText watcher from clobbering us.
function onFieldEdit(key: string, value: string) {
    fields[key] = value;
    editingField = true;
    patchField(key, value);
    editingField = false;

    const obfSubset: Record<string, string> = {};
    for (const k of OBFUSCATION_KEYS) {
        if (k in fields) obfSubset[k] = fields[k];
    }
    revalidate(obfSubset);
}

// Sync fields when switching to Fields view or changing container/active key.
watch(viewMode, (mode) => {
    if (mode === "fields") syncFieldsFromText();
});
watch(selectedContainer, () => {
    if (viewMode.value === "fields") syncFieldsFromText();
});
watch(activeKeyIndex, () => {
    if (viewMode.value === "fields") syncFieldsFromText();
});

// Auto-refresh fields whenever the buffer changes from anything OTHER than a
// field edit (apply obfuscation, convert, paste) — keeps Fields always fresh.
// flush:'sync' so the editingField guard (cleared synchronously) still holds.
watch(
    rawText,
    () => {
        if (!editingField && viewMode.value === "fields") syncFieldsFromText();
    },
    { flush: "sync" },
);

/* ── Actions ────────────────────────────────────────────────────────────── */

function doApplyObfuscation() {
    if (!props.pendingCfg) return;
    applyObfuscation(props.pendingCfg, props.pendingVer);
    // Always re-derive the fields so both views reflect the patch immediately.
    syncFieldsFromText();
}

function doExportVpn() {
    const k = exportVpn();
    if (k) emit("copy", k, "export-vpn");
}

function doExportConf() {
    const c = exportConf();
    if (c) emit("copy", c, "export-conf");
}

function doDownload() {
    const fmt = format.value;
    if (fmt === "conf") {
        const c = exportConf();
        if (c) emit("download", c, "amneziawg.conf");
    } else {
        const k = exportVpn();
        if (k) emit("download", k, "key.txt");
    }
}

/* ── Jc slider ──────────────────────────────────────────────────────────── */

function onJcSlider(ev: Event) {
    const v = (ev.target as HTMLInputElement).value;
    onFieldEdit("Jc", v);
}
</script>

<template>
    <div class="mk-ed-wrap mk-card">
        <!-- Card header -->
        <div class="mk-card-head">
            <!-- Left zone: title+badge (row 1), key/focus controls (row 2) -->
            <div class="mk-ed-head-left">
                <div class="mk-ed-head-row">
                    <FileCode2 :size="14" class="icon-amber" />
                    <span class="mk-card-title">Редактор &amp; Конвертер</span>
                    <span
                        class="mk-ed-fmt-badge"
                        :class="`mk-ed-fmt-${format}`"
                        >{{ formatLabel(format) }}</span
                    >
                </div>

                <div class="mk-ed-head-row" v-if="isMultiKey || inFocus">
                    <!-- Multi-key indicator + active-key picker + focus -->
                    <span v-if="isMultiKey" class="mk-ed-multi">
                        <Layers :size="12" />
                        <span class="mk-ed-multi-count">
                            {{ keyCount }} {{ pluralRu(keyCount, KEY_FORMS) }}
                        </span>
                        <select
                            v-model.number="activeKeyIndex"
                            class="mk-ed-keysel"
                            aria-label="Активный ключ"
                        >
                            <option
                                v-for="i in keyCount"
                                :key="i"
                                :value="i - 1"
                            >
                                Ключ {{ i }}
                            </option>
                        </select>
                        <button
                            class="mk-ed-focus-btn"
                            title="Открыть для превью и правки"
                            @click="focusActiveKey"
                        >
                            <KeyRound :size="11" />
                            Открыть
                        </button>
                    </span>

                    <!-- Focus mode: back to the list -->
                    <button
                        v-else-if="inFocus"
                        class="mk-ed-focus-btn"
                        @click="exitFocus"
                    >
                        <ArrowLeft :size="12" />
                        Ключ {{ focusIndex + 1 }} — назад к списку
                    </button>
                </div>
            </div>

            <!-- Right zone: mode toggle + file load (wraps to two rows on desktop) -->
            <div class="mk-ed-head-right">
                <div class="mk-ed-toggle">
                    <button
                        class="mk-ed-toggle-btn"
                        :class="{ active: viewMode === 'code' }"
                        @click="viewMode = 'code'"
                    >
                        <FileCode2 :size="12" />
                        Код
                    </button>
                    <button
                        class="mk-ed-toggle-btn"
                        :class="{ active: viewMode === 'fields' }"
                        @click="
                            viewMode = 'fields';
                            syncFieldsFromText();
                        "
                    >
                        <LayoutList :size="12" />
                        Поля
                    </button>
                </div>

                <label class="mk-btn-sec mk-ed-file-btn" title="Импортировать">
                    <Upload :size="12" />
                    Импортировать
                    <input
                        id="mk-ed-file"
                        name="mk-ed-file"
                        type="file"
                        accept=".conf,.txt,.json"
                        hidden
                        @change="onFileChange"
                    />
                </label>
            </div>
        </div>

        <!-- Card body -->
        <div class="mk-card-body">
            <!-- ── Code view ─────────────────────────────────────────────────── -->
            <div v-show="viewMode === 'code'" class="mk-ed-code">
                <!-- Convert / preview-as control (bidirectional any → any) -->
                <div
                    class="mk-ed-convert"
                    v-if="format !== 'unknown' && !isMultiKey"
                >
                    <span class="mk-ed-convert-label">Показать как</span>
                    <button
                        class="mk-ed-convert-btn"
                        :class="{ active: format === 'vpn' }"
                        @click="convertTo('vpn')"
                    >
                        <KeyRound :size="12" />
                        vpn://
                    </button>
                    <button
                        class="mk-ed-convert-btn"
                        :class="{ active: format === 'json' }"
                        @click="convertTo('json')"
                    >
                        <Braces :size="12" />
                        JSON
                    </button>
                    <button
                        class="mk-ed-convert-btn"
                        :class="{ active: format === 'conf' }"
                        :disabled="!canExportConf"
                        :title="
                            !canExportConf ? 'Нет AmneziaWG-контейнера' : ''
                        "
                        @click="convertTo('conf')"
                    >
                        <FileCode2 :size="12" />
                        .conf
                    </button>
                </div>
                <div class="mk-ed-convert" v-else-if="isMultiKey">
                    <span class="mk-ed-convert-label">
                        {{ keyCount }} {{ pluralRu(keyCount, KEY_FORMS) }} —
                        каждый с новой строки. «Обновить обфускацию» применится
                        ко всем; нажми «Открыть», чтобы смотреть превью (JSON /
                        .conf) и править один ключ.
                    </span>
                </div>

                <div class="mk-ed-codewrap">
                    <div
                        ref="gutterRef"
                        class="mk-ed-gutter"
                        aria-hidden="true"
                    >
                        <div v-for="n in lineCount" :key="n">{{ n }}</div>
                    </div>
                    <pre
                        ref="preRef"
                        class="mk-ed-highlight"
                        aria-hidden="true"
                    ><code v-html="highlighted || ' '"></code></pre>
                    <textarea
                        v-model="rawText"
                        class="mk-ed-textarea"
                        spellcheck="false"
                        placeholder="Вставь vpn:// ключ, AmneziaWG .conf или JSON… (несколько ключей — с новой строки)"
                        @scroll="onTextareaScroll"
                    ></textarea>
                </div>
            </div>

            <!-- ── Fields view ───────────────────────────────────────────────── -->
            <div v-show="viewMode === 'fields'" class="mk-ed-fields">
                <div v-if="fieldsErr" class="mk-err">
                    <div class="mk-err-icon"><XCircle :size="15" /></div>
                    <div class="mk-err-text">{{ fieldsErr }}</div>
                </div>
                <template v-else-if="Object.keys(fields).length === 0">
                    <div class="mk-ed-fields-empty">
                        Загрузи vpn:// ключ или .conf, чтобы редактировать поля.
                    </div>
                </template>
                <template v-else>
                    <!-- Obfuscation block -->
                    <div class="mk-ed-section-label">Параметры обфускации</div>
                    <div class="mk-ed-fields-grid">
                        <template v-for="key in obfuscationFields()" :key="key">
                            <div class="mk-ed-field-row">
                                <label
                                    class="mk-ed-field-label"
                                    :for="`mkf-${key}`"
                                >
                                    {{ key }}
                                    <!-- Finding badge -->
                                    <span
                                        v-if="findingForField(key)"
                                        class="mk-ed-field-badge"
                                        :class="`mk-ed-field-badge-${findingForField(key)!.level}`"
                                        :title="findingForField(key)!.msg"
                                    >
                                        <XCircle
                                            v-if="
                                                findingForField(key)!.level ===
                                                'error'
                                            "
                                            :size="12"
                                        />
                                        <AlertTriangle v-else :size="12" />
                                    </span>
                                </label>
                                <!-- Jc gets a slider -->
                                <template v-if="key === 'Jc'">
                                    <div class="mk-ed-jc-wrap">
                                        <input
                                            type="number"
                                            class="mk-ed-input mk-ed-input-sm"
                                            :id="`mkf-${key}`"
                                            :value="fields[key]"
                                            min="1"
                                            max="128"
                                            @change="
                                                onFieldEdit(
                                                    key,
                                                    (
                                                        $event.target as HTMLInputElement
                                                    ).value,
                                                )
                                            "
                                        />
                                        <input
                                            type="range"
                                            class="mk-ed-slider"
                                            :value="fields[key]"
                                            min="1"
                                            max="128"
                                            @input="onJcSlider"
                                        />
                                    </div>
                                </template>
                                <!-- Jmin / Jmax as number inputs -->
                                <template
                                    v-else-if="key === 'Jmin' || key === 'Jmax'"
                                >
                                    <input
                                        type="number"
                                        class="mk-ed-input mk-ed-input-sm"
                                        :id="`mkf-${key}`"
                                        :value="fields[key]"
                                        min="0"
                                        @change="
                                            onFieldEdit(
                                                key,
                                                (
                                                    $event.target as HTMLInputElement
                                                ).value,
                                            )
                                        "
                                    />
                                </template>
                                <!-- I1–I5 as text inputs -->
                                <template v-else>
                                    <input
                                        type="text"
                                        class="mk-ed-input"
                                        :id="`mkf-${key}`"
                                        :value="fields[key]"
                                        @change="
                                            onFieldEdit(
                                                key,
                                                (
                                                    $event.target as HTMLInputElement
                                                ).value,
                                            )
                                        "
                                    />
                                </template>
                            </div>
                        </template>
                    </div>

                    <!-- Danger zone -->
                    <details
                        class="mk-ed-danger"
                        v-if="dangerFields().length > 0"
                    >
                        <summary class="mk-ed-danger-summary">
                            <AlertTriangle :size="13" />
                            Опасная зона (меняй только если знаешь, что делаешь)
                            <ChevronDown
                                :size="12"
                                class="mk-ed-danger-arrow"
                            />
                        </summary>
                        <div class="mk-ed-fields-grid mk-ed-danger-body">
                            <div
                                v-for="key in dangerFields()"
                                :key="key"
                                class="mk-ed-field-row"
                            >
                                <label
                                    class="mk-ed-field-label"
                                    :for="`mkf-${key}`"
                                >
                                    {{ key }}
                                    <span
                                        v-if="findingForField(key)"
                                        class="mk-ed-field-badge"
                                        :class="`mk-ed-field-badge-${findingForField(key)!.level}`"
                                        :title="findingForField(key)!.msg"
                                    >
                                        <XCircle
                                            v-if="
                                                findingForField(key)!.level ===
                                                'error'
                                            "
                                            :size="12"
                                        />
                                        <AlertTriangle v-else :size="12" />
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    class="mk-ed-input"
                                    :value="fields[key]"
                                    @change="
                                        onFieldEdit(
                                            key,
                                            ($event.target as HTMLInputElement)
                                                .value,
                                        )
                                    "
                                />
                            </div>
                        </div>
                    </details>
                </template>
            </div>

            <!-- ── Findings list ──────────────────────────────────────────────── -->
            <ul v-if="findings.length > 0" class="mk-ed-findings">
                <li v-for="(f, i) in findings" :key="i" :class="f.level">
                    {{ f.field }}: {{ f.msg }}
                </li>
            </ul>

            <!-- ── Success line ───────────────────────────────────────────────── -->
            <div v-if="successMsg && !errorMsg" class="mk-ok">
                <div class="mk-ok-icon"><CheckCircle2 :size="15" /></div>
                <div class="mk-ok-text">{{ successMsg }}</div>
            </div>

            <!-- ── Error line ─────────────────────────────────────────────────── -->
            <div v-if="errorMsg" class="mk-err">
                <div class="mk-err-icon"><XCircle :size="15" /></div>
                <div class="mk-err-text">{{ errorMsg }}</div>
            </div>

            <!-- ── Action bar ─────────────────────────────────────────────────── -->
            <div class="mk-ed-actions">
                <!-- Update obfuscation (+ hint directly underneath) -->
                <div class="mk-ed-apply">
                    <button
                        class="mk-btn-primary"
                        :disabled="!props.pendingCfg"
                        @click="doApplyObfuscation"
                    >
                        <Zap :size="14" />
                        Обновить обфускацию
                    </button>
                    <span v-if="!props.pendingCfg" class="mk-ed-hint">
                        Сначала сгенерируй конфиг на главной
                    </span>
                </div>

                <!-- Export group — pushed to the right edge on desktop -->
                <div class="mk-ed-export-group">
                    <!-- Container picker (shown only when multiple AWG containers) -->
                    <select
                        v-if="awgContainerNames.length > 1"
                        id="mk-ed-container"
                        name="mk-ed-container"
                        aria-label="Выбор AWG-контейнера"
                        v-model="selectedContainer"
                        class="mk-ed-select"
                    >
                        <option
                            v-for="name in awgContainerNames"
                            :key="name"
                            :value="name"
                        >
                            {{ name }}
                        </option>
                    </select>

                    <!-- Export vpn:// (one key at a time — disabled in the multi-key list) -->
                    <button
                        class="mk-btn-sec"
                        :disabled="isMultiKey"
                        :title="
                            isMultiKey ? 'Откройте один ключ для экспорта' : ''
                        "
                        @click="doExportVpn"
                    >
                        <template v-if="props.isCopied('export-vpn')">
                            <Check :size="13" />
                            Скопировано!
                        </template>
                        <template v-else>
                            <Copy :size="13" />
                            Экспорт vpn://
                        </template>
                    </button>

                    <!-- Export .conf -->
                    <button
                        class="mk-btn-sec"
                        :disabled="!canExportConf || isMultiKey"
                        :title="
                            isMultiKey ? 'Откройте один ключ для экспорта' : ''
                        "
                        @click="doExportConf"
                    >
                        <template v-if="props.isCopied('export-conf')">
                            <Check :size="13" />
                            Скопировано!
                        </template>
                        <template v-else>
                            <Copy :size="13" />
                            Экспорт .conf
                        </template>
                    </button>

                    <!-- Download -->
                    <button
                        class="mk-btn-ghost"
                        :disabled="isMultiKey"
                        :title="
                            isMultiKey
                                ? 'Откройте один ключ для скачивания'
                                : ''
                        "
                        @click="doDownload"
                    >
                        <Download :size="13" />
                        Скачать
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* ConfigEditor is self-contained: the page's mk-* styles live in MergeKeysView's
   scoped block and never reach this child component, so everything it needs is
   defined here, on the shared theme tokens from main.css :root. */

.mk-ed-wrap {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg, 16px);
    overflow: hidden;
}

/* ── Card head ─────────────────────────────────────────────────────────── */
.mk-card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border2);
    background: var(--surface);
}
.mk-ed-head-left {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
}
.mk-ed-head-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
}
.mk-ed-head-right {
    display: flex;
    flex-wrap: wrap;
    align-items: stretch; /* toggle & import button share one height */
    justify-content: flex-end;
    gap: 8px;
}
.mk-card-title {
    font-family: var(--fu);
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--text);
}
.icon-amber {
    color: var(--amber2);
}
.mk-card-body {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

/* ── Format badge ──────────────────────────────────────────────────────── */
.mk-ed-fmt-badge {
    font-family: var(--fm);
    font-size: 0.7rem;
    font-weight: 600;
    padding: 3px 9px;
    border-radius: 999px;
    border: 1px solid var(--border);
    color: var(--text2);
    white-space: nowrap;
}
.mk-ed-fmt-conf {
    color: #64d4e0;
    border-color: rgba(100, 212, 224, 0.4);
    background: rgba(100, 212, 224, 0.08);
}
.mk-ed-fmt-vpn {
    color: var(--amber3);
    border-color: var(--border);
    background: var(--ag2);
}
.mk-ed-fmt-json {
    color: var(--green2);
    border-color: var(--gd);
    background: var(--green-bg);
}

/* ── View toggle (segmented) ───────────────────────────────────────────── */
.mk-ed-toggle {
    display: inline-flex;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    overflow: hidden;
}
.mk-ed-toggle-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    font-family: var(--fm);
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text2);
    background: transparent;
    border: 0;
    cursor: pointer;
    transition: var(--trans-fast);
}
.mk-ed-toggle-btn:hover {
    color: var(--text);
    background: var(--surface-hover);
}
.mk-ed-toggle-btn.active {
    color: var(--bg);
    background: var(--amber2);
}

/* ── Buttons (shared look) ─────────────────────────────────────────────── */
.mk-btn-primary,
.mk-btn-sec,
.mk-btn-ghost,
.mk-ed-file-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    font-family: var(--fw);
    font-size: 0.82rem;
    font-weight: 600;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: var(--trans-fast);
    border: 1px solid transparent;
    white-space: nowrap;
}
.mk-btn-primary {
    background: var(--amber2);
    color: var(--bg);
}
.mk-btn-primary:hover:not(:disabled) {
    background: var(--amber3);
}
.mk-btn-sec,
.mk-ed-file-btn {
    background: var(--surface);
    border-color: var(--border);
    color: var(--text);
}
.mk-btn-sec:hover:not(:disabled),
.mk-ed-file-btn:hover {
    background: var(--surface-hover);
    border-color: var(--amber-deep);
}
.mk-btn-ghost {
    background: transparent;
    border-color: var(--border2);
    color: var(--text2);
}
.mk-btn-ghost:hover {
    color: var(--text);
    border-color: var(--border);
}
.mk-btn-primary:disabled,
.mk-btn-sec:disabled,
.mk-btn-ghost:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

/* ── Code view (overlay highlight) ─────────────────────────────────────── */
.mk-ed-code {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.mk-ed-convert {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
}
.mk-ed-convert-label {
    font-family: var(--fm);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text3);
}
.mk-ed-convert-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 11px;
    font-family: var(--fm);
    font-size: 0.76rem;
    font-weight: 600;
    color: var(--text2);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 999px;
    cursor: pointer;
    transition: var(--trans-fast);
}
.mk-ed-convert-btn:hover:not(:disabled) {
    color: var(--text);
    border-color: var(--amber-deep);
}
.mk-ed-convert-btn.active {
    color: var(--bg);
    background: var(--amber2);
    border-color: var(--amber2);
}
.mk-ed-convert-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}
.mk-ed-codewrap {
    position: relative;
}
.mk-ed-highlight,
.mk-ed-textarea {
    margin: 0;
    /* left padding clears the line-number gutter */
    padding: 12px 12px 12px 52px;
    border: 1px solid var(--border);
    font-family: var(--fm);
    font-size: 13px;
    line-height: 1.6;
    letter-spacing: normal;
    white-space: pre;
    tab-size: 4;
    box-sizing: border-box;
    width: 100%;
    min-height: 340px;
    border-radius: var(--radius-sm);
}
.mk-ed-textarea {
    overflow: auto;
}
.mk-ed-highlight {
    position: absolute;
    inset: 0;
    pointer-events: none;
    color: var(--text);
    background: #0d0b08;
    z-index: 1;
    /* scroll is driven programmatically from the textarea — no own scrollbar
       (that stray non-interactive scrollbar looked like a dead second slider) */
    overflow: hidden;
}
/* ── Line-number gutter ────────────────────────────────────────────────── */
.mk-ed-gutter {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 40px;
    padding: 12px 8px 12px 0;
    box-sizing: border-box;
    font-family: var(--fm);
    font-size: 13px;
    line-height: 1.6;
    text-align: right;
    color: var(--text3);
    background: #0a0806;
    border: 1px solid var(--border);
    border-right: 1px solid var(--border2);
    border-radius: var(--radius-sm) 0 0 var(--radius-sm);
    overflow: hidden;
    pointer-events: none;
    user-select: none;
    z-index: 3;
}
.mk-ed-highlight code {
    font: inherit;
}
.mk-ed-textarea {
    position: relative;
    z-index: 2;
    background: transparent;
    color: transparent;
    caret-color: var(--amber2);
    resize: vertical;
}
.mk-ed-textarea::placeholder {
    color: var(--text3);
}
/* Tokens arrive via v-html → not scoped; reach them with :deep(). */
.mk-ed-highlight :deep(.tok-section) {
    color: #64d4e0;
    font-weight: 600;
}
.mk-ed-highlight :deep(.tok-key) {
    color: #9a8a68;
}
.mk-ed-highlight :deep(.tok-num) {
    color: var(--amber2);
}
.mk-ed-highlight :deep(.tok-range) {
    color: #c98fd8;
    font-weight: 600;
}
.mk-ed-highlight :deep(.tok-ip) {
    color: var(--blue, #5b9bd5);
}
.mk-ed-highlight :deep(.tok-cps) {
    color: #e8956b;
    font-weight: 600;
}
.mk-ed-highlight :deep(.tok-val),
.mk-ed-highlight :deep(.tok-str) {
    color: var(--green2);
}
.mk-ed-highlight :deep(.tok-kw) {
    color: var(--red2);
}
.mk-ed-highlight :deep(.tok-comment) {
    color: var(--text3);
    font-style: italic;
}

/* ── Fields view ───────────────────────────────────────────────────────── */
.mk-ed-fields-empty {
    color: var(--text2);
    font-size: 0.85rem;
    padding: 24px 8px;
    text-align: center;
}
.mk-ed-section-label {
    font-family: var(--fm);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--amber2);
    margin-bottom: 4px;
}
.mk-ed-fields-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 10px 16px;
}
.mk-ed-field-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.mk-ed-field-label {
    font-family: var(--fm);
    font-size: 0.76rem;
    color: var(--text2);
    display: flex;
    align-items: center;
    gap: 6px;
}
.mk-ed-field-badge {
    font-size: 0.7rem;
    line-height: 1;
}
.mk-ed-field-badge-error {
    color: var(--red2);
}
.mk-ed-field-badge-warn {
    color: var(--amber3);
}
.mk-ed-input {
    width: 100%;
    padding: 7px 10px;
    font-family: var(--fm);
    font-size: 0.82rem;
    color: var(--text);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    box-sizing: border-box;
}
.mk-ed-input:focus {
    outline: none;
    border-color: var(--amber-deep);
}
.mk-ed-input-sm {
    width: 84px;
}
.mk-ed-jc-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
}
.mk-ed-slider {
    flex: 1;
    accent-color: var(--amber2);
}

/* ── Danger zone ───────────────────────────────────────────────────────── */
.mk-ed-danger {
    margin-top: 6px;
    border: 1px solid var(--rd, rgba(212, 96, 74, 0.3));
    border-radius: var(--radius-sm);
    background: var(--red-bg);
}
.mk-ed-danger-summary {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    cursor: pointer;
    font-family: var(--fw);
    font-weight: 600;
    font-size: 0.82rem;
    color: var(--red2);
    list-style: none;
    user-select: none;
}
.mk-ed-danger-summary::-webkit-details-marker {
    display: none;
}
.mk-ed-danger-arrow {
    margin-left: auto;
    transition: transform 0.2s;
}
.mk-ed-danger[open] .mk-ed-danger-arrow {
    transform: rotate(180deg);
}
.mk-ed-danger-body {
    padding: 4px 14px 14px;
}

/* ── Findings ──────────────────────────────────────────────────────────── */
.mk-ed-findings {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-family: var(--fm);
    font-size: 0.76rem;
}
.mk-ed-findings .error {
    color: var(--red2);
}
.mk-ed-findings .warn {
    color: var(--amber3);
}

/* ── Error line ────────────────────────────────────────────────────────── */
.mk-err {
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    background: var(--red-bg);
    border: 1px solid var(--rd, rgba(212, 96, 74, 0.3));
}
.mk-err-icon {
    color: var(--red2);
    display: flex;
}
.mk-err-text {
    color: var(--red2);
    font-size: 0.82rem;
}

/* ── Success line ──────────────────────────────────────────────────────── */
.mk-ok {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    background: var(--green-bg);
    border: 1px solid var(--gd);
}
.mk-ok-icon {
    color: var(--green2);
    display: flex;
}
.mk-ok-text {
    color: var(--green2);
    font-size: 0.82rem;
}

/* ── Action bar ────────────────────────────────────────────────────────── */
.mk-ed-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 10px;
    padding-top: 14px;
    border-top: 1px solid var(--border2);
}
.mk-ed-export-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: flex-start;
    margin-left: auto; /* hug the right edge on desktop */
    margin-top: 4px; /* slight top offset from the primary button */
}
.mk-ed-select {
    padding: 7px 10px;
    font-family: var(--fm);
    font-size: 0.8rem;
    color: var(--text);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
}
.mk-ed-hint {
    font-size: 0.74rem;
    color: var(--text3);
}
.mk-ed-apply {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
}

/* ── Multi-key picker ──────────────────────────────────────────────────── */
.mk-ed-multi {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--amber2);
}
.mk-ed-multi-count {
    font-family: var(--fm);
    font-size: 0.74rem;
    color: var(--text2);
}
.mk-ed-keysel {
    padding: 4px 8px;
    font-family: var(--fm);
    font-size: 0.74rem;
    color: var(--text);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
}
.mk-ed-focus-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    font-family: var(--fm);
    font-size: 0.74rem;
    font-weight: 600;
    color: var(--amber2);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 999px;
    cursor: pointer;
    transition: var(--trans-fast);
}
.mk-ed-focus-btn:hover {
    background: var(--surface-hover);
    border-color: var(--amber-deep);
}

/* ── Mobile ────────────────────────────────────────────────────────────── */
@media (max-width: 600px) {
    .mk-card-head {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
        padding: 12px;
    }
    .mk-ed-head-right {
        justify-content: flex-start;
    }
    .mk-ed-fields-grid {
        grid-template-columns: 1fr;
    }
    .mk-ed-actions {
        flex-direction: column;
        align-items: stretch;
    }
    .mk-ed-export-group {
        margin-left: 0;
        width: 100%;
        flex-direction: column;
    }
    .mk-ed-actions button,
    .mk-ed-select {
        width: 100%;
        justify-content: center;
    }
    .mk-ed-apply {
        width: 100%;
        align-items: stretch;
    }
    .mk-ed-apply .mk-btn-primary {
        width: 100%;
        justify-content: center;
    }
}
</style>
