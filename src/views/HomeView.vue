<script setup lang="ts">
import {
    ref,
    onMounted,
    computed,
    nextTick,
    watch,
    type Component,
} from "vue";
import { useRouter } from "vue-router";
import {
    KeyRound,

    LayoutGrid,
    Cpu,
    Settings2,
    RefreshCw,
    FileCode,
    Copy,
    Download,
    Eye,
    GitMerge,
    Zap,
    BookOpen,
    AlertTriangle,
    Network,
    Fingerprint,
    Info,
    ChevronDown,
    ShieldCheck,
    Box,
    VenetianMask,
    TrainFront,
    Cookie,
    Lock,
    Router,
    Gauge,
    Ban,
    TriangleAlert,
    Layers,
    History,
    Trash2,
    Check,
    X,
    RotateCcw,
    ArrowRight,
    Clock,
    Sparkles,
    Clipboard,
    ClipboardCheck,
    Braces,
    Activity,
    FileJson,
    Boxes,
    Pin,
    Search,
    Upload,
    StickyNote,
} from "lucide-vue-next";
import { useGenerator } from "@/composables/useGenerator";
import { downloadText } from "@/utils/download";
import { useCopyFeedback } from "@/composables/useCopyFeedback";
import { useHistory } from "@/composables/useHistory";
import HistoryPanel from "@/components/HistoryPanel.vue";
import type { AwgHistoryEntry } from "@/engines/awg/history";
import { awgParamBlocks, awgParamRecord } from "@/engines/awg/generator";
import type { AWGParamGroup } from "@/engines/awg/generator/params";
import {
    YANDEX_UNSTABLE_PROFILES,
    CLIENTS,
    CLIENT_IDS,
    clientCaps,
    clientReleases,
} from "@/engines/awg/generator";
import type { AWGConfig, AWGVersion, Intensity } from "@/engines/awg/generator";
import { AWG_VERSIONS, capsFor } from "@/engines/awg/generator/versions";
import { localizePath, useI18n } from "@/i18n";

const { locale, t } = useI18n();

const router = useRouter();

const {
    version,
    intensity,
    config,
    currentAwg,
    iterCount,
    log,
    isGenerating,
    isWorkerRunning,
    generate,
    runBatch,
    downloadBatch,
    batchCount,
    batchResults,
    setVersion,
    setIntensity,
    feedback,
    copyConfig,
    downloadConfig,
    copyJson,
    downloadJson,
    plainText,
    previewLines,
    showCustomHost,
    isCPSSupported,
    isFullObfuscation,
    iterDots,
    hintMap,
    placeholderMap,
    isRouterMode,
    domainStatus,
    domainCheckedHost,
    checkSelectedDomain,
    restoreConfig,
    addLog,
} = useGenerator();

const activeFaqIdx = ref<number | null>(null);
/**
 * Every confirmation on this page — the config, a parameter group, a single
 * parameter, a history entry, a restore — is the same flash of feedback, so
 * they share one instance and one timing. The keys are prefixed because a
 * group key and a parameter name live in the same namespace here.
 */
const { copy, copied, isCopied, mark } = useCopyFeedback();
const configCopied = computed(() => isCopied("config"));
const groupCopied = (key: string) => isCopied(`group:${key}`);
const paramCopied = (key: string) => isCopied(`param:${key}`);
const historyCopied = (id: number) => isCopied(`history:${id}`);
const wasRestored = (id: number) => isCopied(`restore:${id}`);
const justGenerated = ref(false);

/**
 * Builds selectable for the chosen client.
 *
 * Most clients have one, and the picker stays hidden for them: a limit that
 * never changed is not a question worth asking.
 */
const clientReleaseChoices = computed(() => clientReleases(config.clientId));

/**
 * What is wrong with the build the user picked, in their language.
 *
 * The data holds catalogue keys rather than sentences, the same way findings
 * do — a note written in one language is a note half the visitors cannot read.
 */
const clientReleaseNotes = computed(() =>
    clientCaps(config.clientId, config.clientRelease).notes.map((key) =>
        t(key as Parameters<typeof t>[0]),
    ),
);

// A release id only means something for the client it belongs to; carrying
// it across would silently apply another client's limits.
watch(
    () => config.clientId,
    () => {
        config.clientRelease = null;
    },
);

const isYandexUnstable = () =>
    config.useBrowserFp &&
    YANDEX_UNSTABLE_PROFILES.includes(config.browserProfile as any);

function persistCurrentConfig() {
    if (!currentAwg.value) return;
    const awg = currentAwg.value;
    const payload = {
        cfg: {
            jc: awg.jc,
            jmin: awg.jmin,
            jmax: awg.jmax,
            s1: awg.s1,
            s2: awg.s2,
            s3: awg.s3,
            s4: awg.s4,
            h1: awg.h1,
            h2: awg.h2,
            h3: awg.h3,
            h4: awg.h4,
            i1: awg.i1,
            i2: awg.i2,
            i3: awg.i3,
            i4: awg.i4,
            i5: awg.i5,
            // Listing fields by hand dropped the 3.0 block on the way to
            // MergeKeys; carry it through explicitly.
            ...(awg.awg3 ? { awg3: awg.awg3 } : {}),
        },
        profile: awg.profile,
        ver: version.value,
    };
    try {
        sessionStorage.setItem("awg_pending_cfg", JSON.stringify(payload));
    } catch {
        /* quota exceeded — ignore */
    }
}

function generateAndSave() {
    generate();
    justGenerated.value = true;
    setTimeout(() => {
        justGenerated.value = false;
    }, 800);

    persistCurrentConfig();

    // Written synchronously. generate() assigns currentAwg and plainText is a
    // plain computed off it, so there is nothing to wait for — and the deferred
    // version meant the very first config, generated on mount, could be dropped
    // if anything re-rendered inside that window.
    saveToHistory();
}

/*
 * Keep the stored config in step with whatever is on screen.
 *
 * It used to be written only by generateAndSave() and openMergeKeys(), so
 * switching the version — which goes through generate(), not generateAndSave()
 * — left a stale config behind and the simulator opened the previous version.
 */
watch(currentAwg, persistCurrentConfig);

onMounted(() => {
    loadHistory();
    generateAndSave();
});

const openMergeKeys = (tab: "update" | "merge") => {
    persistCurrentConfig();
    router.push({ path: localizePath("/mergekeys", locale.value), query: { tab } });
};

/* ── Generation History ───────────────────────────────────────────────── */

const {
    entries: historyEntries,
    visible: historyVisible,
    query: historyQuery,
    load: loadHistory,
    add: addToHistory,
    remove: removeHistoryEntry,
    clear: clearHistory,
    setPinned: setHistoryPinned,
    setNote: setHistoryNote,
    toJson: historyToJson,
    fromJson: historyFromJson,
} = useHistory<AwgHistoryEntry>({
    engineId: "awg",
    // Entries written before the key was namespaced, moved on first load
    // rather than dropped.
    legacyKey: "awg-architect:history",
    /**
     * What makes two generations the same.
     *
     * The rendered config, which is every parameter the user chose and every
     * value drawn for them. Pressing generate twice on unchanged settings
     * produces different junk, so this is not "the same button pressed" — it
     * is the same config, and two identical entries a second apart are
     * exactly what filled the list before.
     */
    fingerprint: (entry) => entry.text,
    /** Version, entropy and profile are how anyone describes one of these. */
    searchText: (entry) =>
        [entry.version, entry.intensity, entry.profile].join(" "),
});

/** Which entry has its note field open. Entries with a note always show it. */
const noteOpen = ref<number | null>(null);
const noteInputs = new Map<number, HTMLInputElement>();

function registerNoteInput(id: number, el: unknown) {
    if (el instanceof HTMLInputElement) noteInputs.set(id, el);
    else noteInputs.delete(id);
}

/**
 * Open the note field, and put the cursor in it.
 *
 * Opening a field the user then has to click into is two actions where they
 * asked for one.
 */
function toggleNote(entry: AwgHistoryEntry) {
    noteOpen.value = noteOpen.value === entry.id ? null : entry.id;
    if (noteOpen.value === entry.id) {
        void nextTick(() => noteInputs.get(entry.id)?.focus());
    }
}

/** Save the history to a file the user keeps or moves to another browser. */
function exportHistory() {
    downloadText(
        `awg-history-${new Date().toISOString().slice(0, 10)}.json`,
        historyToJson(),
    );
}

/** Read one back. Merged with what is here rather than replacing it. */
async function importHistory(file: File) {
    const result = historyFromJson(await file.text());
    addLog(
        t("history.imported", { added: result.added, skipped: result.skipped }),
        result.added ? "ok" : "warn",
    );
}

const showHistory = ref(false);

/** Capabilities of the selected protocol version — see generator/versions.ts. */
const caps = computed(() => capsFor(version.value));

/** FAQ link, prefixed for the active locale. */
const faqPath = computed(() => localizePath("/faq", locale.value));

/** Deep link straight to the field guide, which opens itself on this anchor. */
const fieldsPath = computed(() => ({
    path: localizePath("/faq", locale.value),
    hash: "#client-fields",
}));


function saveToHistory() {
    if (!currentAwg.value || !plainText.value) return;
    const awg = currentAwg.value;

    addToHistory({
        version: version.value,
        intensity: intensity.value,
        profile: config.profile,
        text: plainText.value,
        // Read off the catalogue, which is where the version shape is
        // declared. This used to be forty lines of the same branching the
        // parameter card does, kept in step by hand.
        params: awgParamRecord(awg),
        // Structured clone: `currentAwg` keeps mutating as the user generates.
        cfg: JSON.parse(JSON.stringify(awg)) as AWGConfig,
    });
}

/**
 * Put a stored config back on screen. Entries written before configs were
 * stored can only be copied, so fall back to that rather than doing nothing.
 */
async function restoreFromHistory(entry: AwgHistoryEntry) {
    if (entry.cfg) {
        restoreConfig(entry.cfg);
        mark(`restore:${entry.id}`);
        addLog(
            t("history.restored", {
                version: entry.cfg.version,
                time: formatTime(entry.timestamp),
            }),
            "ok",
        );
        showHistory.value = false;
        return;
    }
    // A legacy entry has no config to restore, so the best we can do is put
    // its text on the clipboard.
    await copy(`history:${entry.id}`, entry.text);
    showHistory.value = false;
}

async function copyHistoryEntry(entry: AwgHistoryEntry) {
    await copy(`history:${entry.id}`, entry.text);
}

function formatTime(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleTimeString(locale.value === "ru" ? "ru-RU" : "en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

/* ── Copy with feedback ────────────────────────────────────────────────── */

async function handleCopy() {
    // copyConfig does the copying and the logging; all that is left is the
    // confirmation on the button.
    if (await copyConfig()) mark("config");
}

async function copyGroupToClipboard(groupKey: string, text: string) {
    await copy(`group:${groupKey}`, text);
}

async function copySingleParam(key: string, value: string | number) {
    await copy(`param:${key}`, `${key} = ${value}`);
}

/* ── Grouped params computed ───────────────────────────────────────────── */

interface ParamItem {
    label: string;
    value: string | number;
    /**
     * The label split into words, worked out once.
     *
     * The template asked for this twice per cell on every render, and the card
     * re-renders on every copy-feedback tick.
     */
    parts: string[];
    wide?: boolean;
}

interface ParamGroup {
    key: string;
    title: string;
    icon: Component;
    items: ParamItem[];
    copyText: string;
}

/**
 * Split a CamelCase parameter name into its words.
 *
 * The 3.0 names are long enough that HeaderProtectionKey and
 * MaxHandshakeAttempts arrive as one unbroken block. The clients spell them
 * exactly that way, so the text cannot change — but it can be rendered as
 * segments, which lets it breathe and gives the line somewhere to wrap.
 * Short names (S1, Jc, I1) come back as a single segment and look untouched.
 */
function labelParts(label: string): string[] {
    return label.match(/[A-Z]?[a-z0-9]+|[A-Z]+(?![a-z])|./g) ?? [label];
}

/**
 * How each block of a config is presented.
 *
 * Presentation only — which icon, which heading, whether the values are long
 * enough to want a line each. What a block *contains* is the catalogue's
 * answer, not this file's.
 */
const GROUP_STYLE: Record<
    AWGParamGroup,
    { icon: Component; titleKey: string; wide: boolean }
> = {
    junk: { icon: TrainFront, titleKey: "params.group.junk", wide: false },
    sizes: { icon: Box, titleKey: "params.group.sizes", wide: false },
    headers: { icon: KeyRound, titleKey: "params.group.headers", wide: true },
    cps: { icon: VenetianMask, titleKey: "params.group.cps", wide: true },
    awg3: { icon: ShieldCheck, titleKey: "params.group.awg3", wide: true },
};

/** The order the card lays the blocks out in. */
const GROUP_ORDER: AWGParamGroup[] = ["junk", "sizes", "headers", "cps", "awg3"];

const paramGroups = computed((): ParamGroup[] => {
    const cfg = currentAwg.value;
    if (!cfg) return [];

    const blocks = awgParamBlocks(cfg);
    const byGroup = new Map(blocks.map((b) => [b.group, b.items]));

    return GROUP_ORDER.flatMap((group) => {
        const items = byGroup.get(group);
        if (!items?.length) return [];

        const style = GROUP_STYLE[group];
        const rendered: ParamItem[] = items.map((item) => ({
            label: item.key,
            value: item.value,
            parts: labelParts(item.key),
            ...(style.wide ? { wide: true } : {}),
        }));

        return [
            {
                key: group,
                title: t(
                    // 1.5 sends the CPS chain from the client only, and the
                    // heading says so.
                    group === "cps" && cfg.version === "1.5"
                        ? "params.group.cpsClient"
                        : (style.titleKey as "params.group.junk"),
                ),
                icon: style.icon,
                items: rendered,
                copyText: rendered
                    .map((i) => `${i.label} = ${i.value}`)
                    .join("\n"),
            },
        ];
    });
});
</script>

<template>
    <div class="home-page fade-in">
        <div class="container">
            <!-- ── Hero ────────────────────────────────────────────────── -->
            <header class="hero">
                <div class="hero-badge badge badge-amber badge-glow">
                    <Sparkles :size="12" /> AWG 3.0 READY
                </div>
                <h1 class="hero-title">
                    <span class="hero-brand">AmneziaWG</span>
                    <span class="hero-accent">Architect</span>
                </h1>
                <p class="hero-desc">{{ t("home.desc") }}</p>
            </header>

            <!-- ── Version Tabs ────────────────────────────────────────── -->
            <div class="version-bar">
                <!-- Driven by AWG_VERSIONS so a future release is one entry in
                     generator/versions.ts, not four more literals in here. -->
                <div class="ver-tabs">
                    <button
                        v-for="ver in AWG_VERSIONS"
                        :key="ver.id"
                        class="ver-tab"
                        :class="{
                            'is-active': version === ver.id,
                            'ver-tab-new': ver.isNewest,
                        }"
                        @click="setVersion(ver.id)"
                    >
                        <ShieldCheck v-if="ver.headerProtection" :size="14" />
                        <Layers v-else-if="ver.rangedHeaders" :size="14" />
                        <span>{{ ver.label }}</span>
                        <span v-if="ver.isNewest" class="ver-tag">NEW</span>
                    </button>
                </div>

                <button
                    class="history-toggle btn btn-ghost btn-icon"
                    :class="{ 'is-active': showHistory }"
                    @click="showHistory = !showHistory"
                    :data-tooltip='t("history.title")'
                >
                    <History :size="18" />
                    <!-- Label appears only on phones: an unlabelled icon is
                         fine beside a tooltip on desktop, but there is no
                         hover on touch, so it needs to say what it does. -->
                    <span class="history-label">{{ t("history.title") }}</span>
                    <span v-if="historyEntries.length" class="history-count">{{
                        historyEntries.length
                    }}</span>
                </button>
            </div>

            <!-- ── Version Notices ─────────────────────────────────────── -->
            <transition name="fade">
                <div v-if="version === '1.0'" class="alert alert-warn">
                    <TriangleAlert :size="16" class="alert-icon" />
                    <div class="alert-content">
                        <b>AWG 1.0:</b> {{ t("version.notice.10") }}
                    </div>
                </div>
            </transition>

            <transition name="fade">
                <div v-if="version === '1.5'" class="alert alert-info">
                    <Info :size="16" class="alert-icon" />
                    <div class="alert-content">
                        <b>AWG 1.5:</b> {{ t("version.notice.15") }}
                    </div>
                </div>
            </transition>

            <transition name="fade">
                <div v-if="version === '3.0'" class="alert alert-info">
                    <ShieldCheck :size="16" class="alert-icon" />
                    <div class="alert-content">
                        <b>AWG 3.0:</b> {{ t("version.notice.30") }}
                        {{ t("version.notice.30.req") }}
                        <code>amneziawg-go&nbsp;≥&nbsp;3.0.1</code>
                        {{ t("common.and") }}
                        <code>amneziawg-tools</code>
                        {{ t("version.notice.30.tail") }}
                    </div>
                </div>
            </transition>

            <!-- ── History Panel ────────────────────────────────────────── -->
            <!-- Sits above the version-specific options: its toggle lives in
                 the version bar, and rendering it after the 3.0 panel opened
                 it a screenful away from the button that opened it. -->
            <transition name="expand">
                <HistoryPanel
                    v-if="showHistory"
                    :entries="historyEntries"
                    :visible="historyVisible"
                    :query="historyQuery"
                    :marked-key="copied ?? null"
                    @update:query="historyQuery = $event"
                    @restore="restoreFromHistory"
                    @copy="copyHistoryEntry"
                    @remove="removeHistoryEntry"
                    @pin="setHistoryPinned"
                    @note="setHistoryNote"
                    @clear="clearHistory"
                    @export="exportHistory"
                    @import="importHistory"
                />
            </transition>

            <!-- ── Version-specific options ────────────────────────────── -->
            <transition name="expand">
                <div v-if="caps.headerProtection" class="awg3-panel">
                    <div class="awg3-head">
                        <ShieldCheck :size="16" />
                        <span>{{ t("awg3.panel.title") }}</span>
                    </div>

                    <label class="awg3-opt">
                        <input
                            type="checkbox"
                            v-model="config.useHeaderProtection"
                            @change="generate()"
                        />
                        <span class="awg3-opt-body">
                            <b>{{ t("awg3.hpk.title") }}</b>
                            <small>{{ t("awg3.hpk.desc") }}</small>
                        </span>
                    </label>

                    <label class="awg3-opt">
                        <input
                            type="checkbox"
                            v-model="config.useContentPadding"
                            @change="generate()"
                        />
                        <span class="awg3-opt-body">
                            <b>{{ t("awg3.cpa.title") }}</b>
                            <small>{{ t("awg3.cpa.desc") }}</small>
                        </span>
                    </label>

                    <label class="awg3-opt">
                        <input
                            type="checkbox"
                            v-model="config.useRandomTimings"
                            @change="generate()"
                        />
                        <span class="awg3-opt-body">
                            <b>{{ t("awg3.timings.title") }}</b>
                            <small>{{ t("awg3.timings.desc") }}</small>
                        </span>
                    </label>

                    <p class="awg3-note">
                        <Info :size="13" />
                        <span>
                            {{ t("awg3.groundwork.lead") }}
                            <code>&lt;d&gt;</code>, <code>&lt;ds&gt;</code>
                            {{ t("common.and") }} <code>&lt;dz&gt;</code>
                            {{ t("awg3.groundwork.note") }}
                        </span>
                    </p>
                </div>
            </transition>

            <!-- ══════════════════════════════════════════════════════════
                 MAIN LAYOUT
                 Controls | Output
                 ══════════════════════════════════════════════════════════ -->
            <div class="main-grid">
                <!-- ── LEFT: Controls Panel ────────────────────────────── -->
                <div class="panel panel-controls">
                    <div class="panel-head">
                        <Settings2 :size="16" class="text-accent" />
                        <span class="panel-title">{{ t("params.title") }}</span>
                    </div>

                    <div class="panel-body">
                        <!-- Target Client -->
                        <div class="field-group">
                            <div class="field-label-row">
                                <Cpu :size="14" class="text-accent" />
                                <label class="field-label">{{ t("gen.client.label") }}</label>
                            </div>
                            <select
                                v-model="config.clientId"
                                class="select-field"
                                @change="generate"
                            >
                                <option
                                    v-for="id in CLIENT_IDS"
                                    :key="id"
                                    :value="id"
                                >
                                    {{ CLIENTS[id].name }}
                                </option>
                            </select>
                            <div class="field-hint">
                                {{ t("gen.client.hint") }}
                            </div>

                            <!--
                                Only shown for a client whose limits actually
                                changed between builds. A picker with one entry
                                is a question the user cannot answer wrongly
                                and should not have to read.
                            -->
                            <template v-if="clientReleaseChoices.length > 1">
                                <select
                                    v-model="config.clientRelease"
                                    class="select-field client-release"
                                    @change="generate"
                                >
                                    <option
                                        v-for="choice in clientReleaseChoices"
                                        :key="choice.id ?? 'current'"
                                        :value="choice.id"
                                    >
                                        {{
                                            choice.id === null
                                                ? t("gen.client.releaseCurrent")
                                                : t(
                                                      choice.label as "client.release.upTo",
                                                      choice.labelParams,
                                                  )
                                        }}
                                    </option>
                                </select>
                                <ul
                                    v-if="clientReleaseNotes.length"
                                    class="client-notes"
                                >
                                    <li
                                        v-for="(note, i) in clientReleaseNotes"
                                        :key="i"
                                    >
                                        {{ note }}
                                    </li>
                                </ul>
                            </template>
                        </div>

                        <!-- Profile Select -->
                        <div class="field-group">
                            <label class="field-label">{{ t("gen.profile.label") }}</label>
                            <select
                                v-model="config.profile"
                                class="select-field"
                                @change="generate"
                            >
                                <option value="quic_initial">
                                    QUIC Initial (RFC 9000)
                                </option>
                                <option value="quic_0rtt">
                                    QUIC 0-RTT (Early Data)
                                </option>
                                <option value="tls_client_hello">
                                    TLS 1.3 Client Hello
                                </option>
                                <option value="wireguard_noise">
                                    Noise_IK (Standard)
                                </option>
                                <option value="dtls">DTLS 1.3 Handshake</option>
                                <option value="http3">
                                    HTTP/3 Host Mimicry
                                </option>
                                <option value="sip">
                                    SIP (VoIP Signaling)
                                </option>
                                <option value="tls_to_quic">
                                    TLS → QUIC (Alt-Svc)
                                </option>
                                <option value="quic_burst">
                                    QUIC Burst (Multi-packet)
                                </option>
                                <option value="dns_query">
                                    DNS Query (UDP 53)
                                </option>
                                <option value="random">
                                    {{ t("gen.profile.random") }}
                                </option>
                            </select>
                        </div>

                        <!-- Custom Host -->
                        <transition name="expand">
                            <div v-if="showCustomHost" class="field-group">
                                <div class="host-row">
                                    <input
                                        type="text"
                                        v-model="config.customHost"
                                        class="input-field"
                                        :placeholder="
                                            placeholderMap[config.profile]
                                        "
                                        @input="generate"
                                    />
                                    <button
                                        class="btn btn-ghost btn-icon sm"
                                        @click="checkSelectedDomain"
                                        :title='t("gen.host.check")'
                                    >
                                        <ShieldCheck :size="14" />
                                    </button>
                                    <span
                                        v-if="domainStatus !== 'idle'"
                                        class="domain-dot"
                                        :class="domainStatus"
                                    />
                                </div>
                                <div class="field-hint">
                                    {{ hintMap[config.profile] }}
                                </div>
                            </div>
                        </transition>

                        <!-- Mimic All -->
                        <label class="toggle-row">
                            <input
                                type="checkbox"
                                v-model="config.mimicAll"
                                @change="generate"
                            />
                            <span>{{ t("gen.mimicAll") }}</span>
                        </label>

                        <!-- Separator -->
                        <hr class="divider" />

                        <!-- CPS Tags -->
                        <div v-if="isCPSSupported" class="field-group">
                            <label class="field-label"
                                >{{ t("gen.tags.label") }}</label
                            >
                            <div class="tags-grid">
                                <label class="toggle-row compact">
                                    <input
                                        type="checkbox"
                                        v-model="config.useTagC"
                                        @change="generate"
                                    />
                                    <span>&lt;c&gt;</span>
                                </label>
                                <label class="toggle-row compact">
                                    <input
                                        type="checkbox"
                                        v-model="config.useTagT"
                                        @change="generate"
                                    />
                                    <span>&lt;t&gt;</span>
                                </label>
                                <label class="toggle-row compact">
                                    <input
                                        type="checkbox"
                                        v-model="config.useTagR"
                                        @change="generate"
                                    />
                                    <span>&lt;r&gt;</span>
                                </label>
                                <label class="toggle-row compact">
                                    <input
                                        type="checkbox"
                                        v-model="config.useTagRC"
                                        @change="generate"
                                    />
                                    <span>&lt;rc&gt;</span>
                                </label>
                                <label class="toggle-row compact">
                                    <input
                                        type="checkbox"
                                        v-model="config.useTagRD"
                                        @change="generate"
                                    />
                                    <span>&lt;rd&gt;</span>
                                </label>
                            </div>
                            <div class="alert alert-info small-alert mt-2">
                                <Info :size="12" class="alert-icon" />
                                <div class="alert-content">
                                    {{ t("gen.tags.warnC") }}
                                </div>
                            </div>
                        </div>

                        <!-- Not an error, just a capability the chosen version
                             lacks — styled as a muted state rather than a red
                             alert, and it points at the version that has it. -->
                        <div v-else class="cps-unavailable">
                            <Ban :size="15" />
                            <div class="cps-unavailable-body">
                                <b>{{ t("gen.cps.unavailable") }}</b>
                                <small>{{ t("gen.cps.unavailableHint") }}</small>
                            </div>
                            <button
                                class="cps-unavailable-cta"
                                @click="setVersion('2.0' as AWGVersion)"
                            >
                                {{ t("gen.cps.switchTo20") }}
                                <ArrowRight :size="13" />
                            </button>
                        </div>

                        <!-- Browser FP -->
                        <div v-if="isCPSSupported" class="field-group">
                            <div class="field-label-row">
                                <Fingerprint :size="14" class="text-accent" />
                                <label class="field-label"
                                    >{{ t("gen.fp.label") }}</label
                                >
                            </div>
                            <label class="toggle-row">
                                <input
                                    type="checkbox"
                                    v-model="config.useBrowserFp"
                                    @change="generate"
                                />
                                <span>{{ t("gen.fp.toggle") }}</span>
                            </label>

                            <transition name="expand">
                                <div v-if="config.useBrowserFp" class="mt-2">
                                    <select
                                        v-model="config.browserProfile"
                                        class="select-field"
                                        @change="generate"
                                    >
                                        <option value="chrome">Chrome</option>
                                        <option value="firefox">Firefox</option>
                                        <option value="safari">Safari</option>
                                        <option value="edge">Edge</option>
                                        <option value="yandex_desktop">
                                            {{ t("gen.fp.yandexDesktop") }}
                                        </option>
                                        <option value="yandex_mobile">
                                            {{ t("gen.fp.yandexMobile") }}
                                        </option>
                                    </select>
                                    <transition name="fade">
                                        <div
                                            v-if="isYandexUnstable()"
                                            class="alert alert-warn small-alert mt-2"
                                        >
                                            <TriangleAlert
                                                :size="12"
                                                class="alert-icon"
                                            />
                                            <div class="alert-content">
                                                {{ t("gen.fp.yandexUnstable") }}
                                            </div>
                                        </div>
                                    </transition>
                                </div>
                            </transition>
                        </div>

                        <hr class="divider" />

                        <!-- MTU -->
                        <div v-if="isCPSSupported" class="field-group">
                            <div class="field-label-row">
                                <Network :size="14" class="text-accent" />
                                <label class="field-label"
                                    >{{ t("gen.mtu.label") }}</label
                                >
                            </div>
                            <div class="mtu-row">
                                <input
                                    type="number"
                                    v-model.number="config.mtu"
                                    class="input-field mtu-input"
                                    min="576"
                                    max="9000"
                                    @input="generate"
                                />
                                <div class="mtu-presets">
                                    <button
                                        class="preset-btn"
                                        :class="{ 'is-active': config.mtu === 1500 }"
                                        @click="
                                            config.mtu = 1500;
                                            generate();
                                        "
                                    >
                                        1500
                                    </button>
                                    <button
                                        class="preset-btn"
                                        :class="{ 'is-active': config.mtu === 1420 }"
                                        @click="
                                            config.mtu = 1420;
                                            generate();
                                        "
                                    >
                                        1420
                                    </button>
                                    <button
                                        class="preset-btn"
                                        :class="{ 'is-active': config.mtu === 1280 }"
                                        @click="
                                            config.mtu = 1280;
                                            generate();
                                        "
                                    >
                                        1280
                                    </button>
                                </div>
                            </div>
                            <div class="field-hint">
                                1500 = Ethernet · 1420 = WG/PPPoE · 1280 = min
                                IPv6
                            </div>
                        </div>

                        <!-- Intensity -->
                        <div class="field-group">
                            <label class="field-label">{{ t("gen.entropy.label") }}</label>
                            <div class="intensity-bar">
                                <button
                                    class="int-btn"
                                    :class="{ 'is-active': intensity === 'low' }"
                                    @click="setIntensity('low' as Intensity)"
                                >
                                    LOW
                                </button>
                                <button
                                    class="int-btn"
                                    :class="{ 'is-active': intensity === 'medium' }"
                                    @click="setIntensity('medium' as Intensity)"
                                >
                                    MED
                                </button>
                                <button
                                    class="int-btn"
                                    :class="{ 'is-active': intensity === 'high' }"
                                    @click="setIntensity('high' as Intensity)"
                                >
                                    HIGH
                                </button>
                            </div>
                        </div>

                        <!-- Junk Level -->
                        <div class="field-group">
                            <label class="field-label">{{ t("gen.junk.label") }}</label>
                            <select
                                v-model.number="config.junkLevel"
                                class="select-field"
                                @change="generate"
                            >
                                <option :value="0">{{ t("gen.junk.off") }}</option>
                                <option :value="3">{{ t("gen.junk.optimal") }}</option>
                                <option :value="5">{{ t("gen.junk.recommended") }}</option>
                                <option :value="7">{{ t("gen.junk.strong") }}</option>
                                <option :value="10">{{ t("gen.junk.max") }}</option>
                            </select>
                        </div>

                        <!-- Extreme Maximum Mode -->
                        <div class="field-group">
                            <label class="field-label">
                                <Gauge :size="14" class="icon-inline" />
                                {{ t("gen.extreme.title") }}
                            </label>
                            <label class="toggle-check">
                                <input
                                    type="checkbox"
                                    v-model="config.useExtremeMax"
                                    @change="generate"
                                />
                                <span class="toggle-label"
                                    >{{ t("gen.extreme.desc") }}</span
                                >
                            </label>
                            <transition name="fade">
                                <div
                                    v-if="config.useExtremeMax"
                                    class="alert alert-warn small-alert"
                                >
                                    <TriangleAlert :size="14" />
                                    <div>
                                        <b>{{ t("gen.extreme.title") }}:</b>
                                        {{ t("gen.extreme.warning") }}
                                    </div>
                                </div>
                            </transition>
                        </div>

                        <!-- Router Mode -->
                        <div class="field-group">
                            <label class="field-label">
                                <Router :size="14" class="icon-inline" />
                                {{ t("gen.router.title") }}
                            </label>
                            <label class="toggle-check">
                                <input
                                    type="checkbox"
                                    v-model="config.routerMode"
                                    @change="generate"
                                />
                                <span class="toggle-label"
                                    >{{ t("gen.router.desc") }}</span
                                >
                            </label>
                            <transition name="fade">
                                <div
                                    v-if="config.routerMode"
                                    class="alert alert-warn small-alert"
                                >
                                    <TriangleAlert :size="14" />
                                    <div>
                                        <b>{{ t("gen.router.title") }}:</b>
                                        {{ t("gen.router.warning") }}
                                    </div>
                                </div>
                            </transition>
                        </div>
                        <!-- Batch Generator -->
                        <div class="batch-card">
                            <div class="batch-head">
                                <Boxes :size="14" class="text-accent" />
                                <span class="batch-title">{{ t("gen.batch.title") }}</span>
                            </div>
                            <p class="batch-hint">
                                {{ t("gen.batch.desc") }}
                            </p>
                            <div class="batch-row">
                                <input
                                    type="number"
                                    v-model.number="batchCount"
                                    class="input-field batch-input"
                                    min="1"
                                    max="1000"
                                    :disabled="isWorkerRunning"
                                />
                                <button
                                    class="btn btn-secondary batch-btn"
                                    :class="{ running: isWorkerRunning }"
                                    :disabled="isWorkerRunning"
                                    @click="runBatch"
                                >
                                    <RefreshCw
                                        v-if="isWorkerRunning"
                                        :size="15"
                                        class="spin-anim"
                                    />
                                    <Boxes v-else :size="15" />
                                    {{
                                        isWorkerRunning
                                            ? t("gen.batch.running", {
                                                  n: batchCount,
                                              })
                                            : t("gen.batch.action")
                                    }}
                                </button>
                            </div>
                            <button
                                v-if="batchResults.length"
                                class="btn btn-primary batch-download"
                                :class="{ 'pop-in': batchResults.length }"
                                @click="downloadBatch"
                            >
                                <Download :size="15" />
                                {{
                                    t("gen.batch.download", {
                                        n: batchResults.length,
                                    })
                                }}
                            </button>
                        </div>

                        <!-- Generate Button -->
                        <button
                            class="btn btn-primary w-full gen-btn mt-4"
                            :class="{ shimmer: isGenerating }"
                            @click="generateAndSave"
                        >
                            <RefreshCw
                                :size="18"
                                :class="{ 'spin-anim': isGenerating }"
                            />
                            {{ t("gen.generate") }}
                        </button>

                        <!-- Feedback -->
                        <div v-if="currentAwg" class="feedback-row">
                            <div class="iter-dots">
                                <span
                                    v-for="(dot, i) in iterDots"
                                    :key="i"
                                    class="idot"
                                    :class="{
                                        filled: dot.filled && !dot.critical,
                                        critical: dot.filled && dot.critical,
                                    }"
                                ></span>
                            </div>
                            <div class="fb-btns">
                                <button
                                    class="btn btn-secondary fb-ok"
                                    @click="feedback(true)"
                                >
                                    <Check :size="14" /> {{ t("gen.works") }}
                                </button>
                                <button
                                    class="btn btn-secondary fb-bad"
                                    @click="feedback(false)"
                                >
                                    <X :size="14" /> {{ t("gen.worksNot") }}
                                </button>
                            </div>
                        </div>

                        <!-- Log -->
                        <div v-if="log.length" class="gen-log">
                            <div
                                v-for="(entry, i) in log"
                                :key="i"
                                class="log-line"
                                :class="`log-${entry.type}`"
                            >
                                {{ entry.msg }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ── CENTER: Output Panel ────────────────────────────── -->
                <div class="panel panel-output">
                    <!-- ── Configuration (grouped params + actions) ─────── -->
                    <div
                        class="output-card"
                        :class="{ 'just-generated': justGenerated }"
                    >
                        <div class="output-head">
                            <div class="output-head-left">
                                <FileCode :size="16" class="text-accent" />
                                <span class="panel-title">{{ t("gen.config") }}</span>
                                <span v-if="currentAwg" class="version-chip"
                                    >AWG {{ version }}</span
                                >
                            </div>
                            <div class="output-head-actions">
                                <button
                                    class="btn btn-ghost btn-icon sm"
                                    :class="{ 'copy-ok': configCopied }"
                                    @click="handleCopy"
                                    :data-tooltip='t("gen.copyAll")'
                                >
                                    <ClipboardCheck
                                        v-if="configCopied"
                                        :size="16"
                                    />
                                    <Clipboard v-else :size="16" />
                                </button>
                                <button
                                    class="btn btn-ghost btn-icon sm"
                                    @click="downloadConfig"
                                    :data-tooltip='t("gen.export.downloadConf")'
                                >
                                    <Download :size="16" />
                                </button>
                            </div>
                        </div>

                        <!-- Grouped Parameter Cards -->
                        <div class="config-body">
                            <div v-if="!currentAwg" class="output-placeholder">
                                <div class="placeholder-line w80"></div>
                                <div class="placeholder-line w60"></div>
                                <div class="placeholder-line w70"></div>
                                <div class="placeholder-line w50"></div>
                                <div class="placeholder-line w65"></div>
                            </div>

                            <template v-else>
                                <div
                                    v-for="(group, gi) in paramGroups"
                                    :key="group.key"
                                    class="param-group"
                                    :style="{ animationDelay: `${gi * 60}ms` }"
                                >
                                    <div class="param-group-head">
                                        <div class="param-group-title">
                                            <component
                                                :is="group.icon"
                                                :size="14"
                                                class="param-group-icon"
                                            />
                                            <span>{{ group.title }}</span>
                                        </div>
                                        <button
                                            class="btn btn-ghost btn-icon xs"
                                            :class="{
                                                'copy-ok':
                                                    groupCopied(group.key),
                                            }"
                                            @click="
                                                copyGroupToClipboard(
                                                    group.key,
                                                    group.copyText,
                                                )
                                            "
                                            :data-tooltip="
                                                groupCopied(group.key)
                                                    ? t('action.copied')
                                                    : t('gen.copyGroup')
                                            "
                                        >
                                            <ClipboardCheck
                                                v-if="
                                                    groupCopied(group.key)
                                                "
                                                :size="13"
                                            />
                                            <Copy v-else :size="13" />
                                        </button>
                                    </div>
                                    <div
                                        class="param-group-grid"
                                        :class="{
                                            'has-wide': group.items.some(
                                                (i) => i.wide,
                                            ),
                                            'is-cps': group.key === 'cps',
                                        }"
                                    >
                                        <div
                                            v-for="item in group.items"
                                            :key="item.label"
                                            class="param-cell"
                                            :class="{
                                                'param-cell-wide': item.wide,
                                                'param-cell-compact':
                                                    !item.wide,
                                                'param-cell-cps':
                                                    group.key === 'cps',
                                            }"
                                            @click="
                                                copySingleParam(
                                                    item.label,
                                                    item.value,
                                                )
                                            "
                                            :title="`${t('gen.clickToCopy')} ${item.label}`"
                                        >
                                            <!-- CamelCase names are split into
                                                 segments so HeaderProtectionKey
                                                 reads as three words and can
                                                 wrap between them. The text
                                                 itself is untouched — clients
                                                 spell it exactly this way, and
                                                 copying goes through
                                                 item.label. -->
                                            <span
                                                class="param-cell-label"
                                                :class="{
                                                    'param-cell-label-words':
                                                        item.parts
                                                            .length > 1,
                                                }"
                                            >
                                                <template
                                                    v-for="(part, pi) in item.parts"
                                                    :key="pi"
                                                    ><wbr v-if="pi" /><span
                                                        class="pk-seg"
                                                        >{{ part }}</span
                                                    ></template
                                                >
                                            </span>
                                            <span
                                                class="param-cell-value"
                                                :class="{
                                                    'param-long':
                                                        String(item.value)
                                                            .length > 40 &&
                                                        group.key !== 'cps',
                                                    'param-cps-value':
                                                        group.key === 'cps',
                                                    'param-copied':
                                                        paramCopied(item.label),
                                                }"
                                                >{{ item.value }}</span
                                            >
                                            <span
                                                v-if="
                                                    paramCopied(item.label)
                                                "
                                                class="param-copied-badge"
                                                >✓</span
                                            >
                                        </div>
                                    </div>
                                </div>

                                <!-- Export actions -->
                                <div class="export-card">
                                    <div class="export-title">
                                        <Download :size="14" class="text-accent" />
                                        <span>{{ t("gen.export.title") }}</span>
                                    </div>
                                    <div class="export-grid">
                                        <button
                                            class="btn btn-secondary export-btn"
                                            :class="{ 'copy-ok': configCopied }"
                                            @click="handleCopy"
                                        >
                                            <ClipboardCheck
                                                v-if="configCopied"
                                                :size="15"
                                            />
                                            <Copy v-else :size="15" />
                                            <span>
                                                {{
                                                    configCopied
                                                        ? t("action.copied")
                                                        : t(
                                                              "gen.export.copyConf",
                                                          )
                                                }}
                                            </span>
                                        </button>
                                        <button
                                            class="btn btn-primary export-btn"
                                            @click="downloadConfig"
                                        >
                                            <Download :size="15" />
                                            <span>{{ t("gen.export.downloadConf") }}</span>
                                        </button>
                                        <button
                                            class="btn btn-ghost export-btn"
                                            @click="copyJson"
                                        >
                                            <Braces :size="15" />
                                            <span>{{ t("gen.export.copyJson") }}</span>
                                        </button>
                                        <button
                                            class="btn btn-ghost export-btn"
                                            @click="downloadJson"
                                        >
                                            <FileJson :size="15" />
                                            <span>{{ t("gen.export.downloadJson") }}</span>
                                        </button>
                                        <router-link
                                            :to="localizePath('/simulator', locale)"
                                            class="btn btn-ghost export-btn export-sim"
                                        >
                                            <Activity :size="15" />
                                            <span>{{ t("gen.export.simulator") }}</span>
                                        </router-link>
                                    </div>
                                </div>
                            </template>
                        </div>
                    </div>

                    <!-- Preview Config File -->
                    <div class="preview-card">
                        <div class="preview-head">
                            <Eye :size="14" class="text-accent" />
                            <span class="panel-title"
                                >{{ t("gen.preview") }}</span
                            >
                        </div>
                        <pre
                            class="preview-code"
                        ><template v-if="previewLines.length"><span v-for="(line, i) in previewLines" :key="i" class="preview-line" :class="line.type">{{ line.type === 'kv' ? `${line.key} = ${line.value}` : line.value }}
</span></template><template v-else><span class="text-dim">{{ t("gen.preview.waiting") }}</span></template></pre>
                    </div>
                </div>
            </div>

            <!-- ── MergeKeys CTA ───────────────────────────────────────── -->
            <div class="merge-banner">
                <div class="merge-banner-content">
                    <div class="merge-banner-icon">
                        <GitMerge :size="24" />
                    </div>
                    <div class="merge-banner-text">
                        <h3>{{ t("gen.merge.title") }}</h3>
                        <p>{{ t("gen.merge.desc") }}</p>
                    </div>
                </div>
                <div class="merge-banner-actions">
                    <button
                        class="btn btn-secondary"
                        @click="openMergeKeys('update')"
                    >
                        <Zap :size="16" /> {{ t("gen.merge.update") }}
                    </button>
                    <button
                        class="btn btn-primary"
                        @click="openMergeKeys('merge')"
                    >
                        <GitMerge :size="16" /> {{ t("gen.merge.combine") }}
                    </button>
                </div>
            </div>

            <!-- ── Pointers into the FAQ ────────────────────────────────
                 Two links, not two banners. They were full-width cards with
                 the same icon-title-description-button shape as the MergeKeys
                 block above, which gave three unrelated things identical
                 weight; these are references, not actions.               -->
            <nav class="help-links" :aria-label="t('kb.title')">
                <router-link :to="fieldsPath" class="help-link">
                    <LayoutGrid :size="18" />
                    <span class="help-link-text">
                        <b>{{ t("kb.fields.title") }}</b>
                        <small>{{ t("kb.fields.short") }}</small>
                    </span>
                    <ArrowRight :size="15" class="chevron help-link-arrow" />
                </router-link>

                <router-link :to="faqPath" class="help-link">
                    <BookOpen :size="18" />
                    <span class="help-link-text">
                        <b>{{ t("kb.title") }}</b>
                        <small>{{ t("kb.short") }}</small>
                    </span>
                    <ArrowRight :size="15" class="chevron help-link-arrow" />
                </router-link>
            </nav>
        </div>
    </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════════
   HomeView — Redesigned Layout v2
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Domain Check ─────────────────────────────────────────────────────── */

.host-row {
    display: flex;
    align-items: center;
    gap: 6px;
}

.host-row .input-field {
    flex: 1;
}

.domain-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
    flex-shrink: 0;
}

.domain-dot.ok {
    background: var(--green);
    box-shadow: 0 0 6px var(--green);
}

.domain-dot.blocked {
    background: var(--red);
    box-shadow: 0 0 6px var(--red);
}

.domain-dot.checking {
    background: var(--amber);
    animation: pulse 1s infinite;
}

.domain-dot.unknown {
    background: var(--text3);
}

@keyframes pulse {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.3;
    }
}

/* ── Router Mode ──────────────────────────────────────────────────────── */

.toggle-check {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
}

.toggle-check input[type="checkbox"] {
    accent-color: var(--amber);
}

.toggle-label {
    font-size: 0.82rem;
    color: var(--text2);
}

.icon-inline {
    vertical-align: -2px;
    color: var(--accent-ink);
}

.small-alert {
    margin-top: 8px;
    font-size: 0.75rem;
    padding: 8px 12px;
}

.home-page {
    padding: 2rem 0 4rem;
}

/* ── Hero ──────────────────────────────────────────────────────────────── */
.hero {
    text-align: center;
    margin-bottom: 2rem;
}

.hero-badge {
    position: relative;
    margin-bottom: 1rem;
}

/* Glow lives on a pseudo-element so we animate opacity (GPU-composited)
   instead of box-shadow (forces a main-thread repaint every frame during
   the critical load window). */
/* Shared: see `.badge-glow` in main.css. */



@media (prefers-reduced-motion: reduce) {
    .hero-badge::after {
        animation: none;
    }
}

.hero-title {
    font-size: clamp(1.8rem, 4vw, 3rem);
    font-weight: 900;
    line-height: 1.1;
    letter-spacing: -0.03em;
    margin-bottom: 0.75rem;
}

.hero-brand {
    display: block;
    color: var(--text);
}

/*
 * Solid, not a gradient clipped to the text.
 *
 * Clipping a gradient to a heading fixes its colours in absolute terms, so on
 * the pastel ground the whole word sat at roughly 1.9:1 and the largest thing
 * on the page was the hardest to read. It also cost nothing to lose: three
 * shades of the same hue across eight letters is not a gradient anyone can
 * see, only one they can fail to read.
 */
.hero-accent {
    display: block;
    color: var(--accent-ink);
}

.hero-desc {
    max-width: 540px;
    margin: 0 auto;
    font-size: 0.95rem;
    color: var(--text2);
    line-height: 1.6;
}

/* ── Version Bar ──────────────────────────────────────────────────────── */
.version-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 1.5rem;
}

.ver-tabs {
    display: flex;
    gap: 4px;
    background: var(--bg2);
    border: 1px solid var(--border2);
    border-radius: 100px;
    padding: 4px;
}

.ver-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 16px;
    border-radius: 100px;
    background: transparent;
    border: none;
    color: var(--text3);
    font-family: var(--fw);
    font-weight: 700;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all var(--trans-fast);
    white-space: nowrap;
}

.ver-tab:hover {
    color: var(--text2);
}

.ver-tab.is-active {
    background: var(--amber);
    color: var(--on-accent);
    box-shadow: 0 2px 8px rgb(var(--accent-rgb) / 0.25);
}

/* ── AWG 3.0 ──────────────────────────────────────────────────────────── */
.ver-tag {
    font-size: 0.55rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    padding: 2px 5px;
    border-radius: 4px;
    background: var(--green-bg);
    color: var(--green);
    line-height: 1;
}

.ver-tab.is-active .ver-tag {
    background: light-dark(rgb(255 255 255 / 0.3), rgb(10 8 6 / 0.22));
    color: var(--on-accent);
}

.awg3-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 1.5rem;
    padding: 16px;
    background: var(--bg2);
    border: 1px solid var(--border2);
    border-radius: var(--radius-lg);
}

.awg3-head {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--accent-ink);
    font-family: var(--fw);
    font-weight: 800;
    font-size: 0.82rem;
    letter-spacing: 0.02em;
}

.awg3-opt {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--bg3);
    cursor: pointer;
    transition: border-color var(--trans-fast), background var(--trans-fast);
}

.awg3-opt:hover {
    border-color: var(--border3);
    background: var(--surface-hover);
}

.awg3-opt input {
    margin-top: 3px;
    flex-shrink: 0;
    accent-color: var(--amber);
    cursor: pointer;
}

.awg3-opt-body {
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.awg3-opt-body b {
    font-family: var(--fm);
    font-size: 0.8rem;
    color: var(--text);
}

.awg3-opt-body small {
    font-size: 0.75rem;
    line-height: 1.5;
    color: var(--text2);
    text-wrap: pretty;
}

.awg3-note {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 2px 0 0;
    padding: 10px 12px;
    /* --text3 on --bg3 measures ~2.4:1, well under the 4.5:1 WCAG AA floor
       for text this size, so this note uses --text2 (~5.5:1). */
    border-left: 2px solid var(--amber-dim);
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    background: var(--bg3);
    font-size: 0.78rem;
    line-height: 1.55;
    color: var(--text2);
    text-wrap: pretty;
}

.awg3-note svg {
    flex-shrink: 0;
    margin-top: 3px;
    color: var(--accent-ink);
    opacity: 0.75;
}

/* The prose lives in a single child so it wraps as one text flow. Without it
   every run between the <code> chips becomes its own anonymous flex item and
   the tail gets squeezed into a narrow column. min-width:0 lets it shrink
   below its longest word instead of pushing the flex line wider. */
.awg3-note > span {
    min-width: 0;
    flex: 1;
}

/* Keep the tag names from being split across lines mid-token. */
.awg3-note code {
    white-space: nowrap;
}

.awg3-note code,
.alert-content code {
    font-family: var(--fm);
    font-size: 0.92em;
    padding: 1px 4px;
    border-radius: 3px;
    background: var(--bg4);
    color: var(--accent-ink-lift);
}

/* ── History Toggle + Badge ───────────────────────────────────────────── */
.history-toggle {
    position: relative;
    overflow: visible !important;
    z-index: 2;
}

/* Desktop keeps the compact icon button; the label is phone-only. */
.history-label {
    display: none;
}

.history-toggle.is-active {
    color: var(--accent-ink);
    background: var(--surface-active);
}

.history-count {
    position: absolute;
    top: -6px;
    right: -6px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    background: var(--amber);
    color: var(--on-accent);
    font-size: 0.62rem;
    font-weight: 800;
    font-family: var(--fm);
    border-radius: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    z-index: 10;
    pointer-events: none;
    box-shadow: 0 2px 6px rgb(var(--accent-rgb) / 0.4);
    animation: countPop 0.3s var(--ease-bounce);
}

@keyframes countPop {
    0% {
        transform: scale(0.3);
        opacity: 0;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}

/* ── History Panel ────────────────────────────────────────────────────── */

/* ── Main Grid ────────────────────────────────────────────────────────── */
.main-grid {
    display: grid;
    grid-template-columns: 380px 1fr;
    gap: 24px;
    align-items: start;
}

@media (max-width: 960px) {
    .main-grid {
        grid-template-columns: 1fr;
    }
}

/* ── Panel (shared) ───────────────────────────────────────────────────── */
/* .panel, .panel-head, .panel-title and .panel-body are global — see
   assets/main.css. They were here, which put them out of reach of every
   other view that used the same class names. */

/* ── Controls Panel ───────────────────────────────────────────────────── */
.panel-controls {
    position: sticky;
    top: 88px;
}

@media (max-width: 960px) {
    .panel-controls {
        position: static;
    }
}

.field-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.field-label {
    font-size: 0.8rem;
    color: var(--text2);
    font-weight: 600;
    font-family: var(--fw);
}

.field-label-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.field-hint {
    font-size: 0.7rem;
    color: var(--text3);
    line-height: 1.4;
}

/* Sits under the client select as a refinement of it, not a field of its own. */
.client-release {
    margin-top: 8px;
}

.client-notes {
    margin: 8px 0 0;
    padding-left: 16px;
    font-size: 0.7rem;
    line-height: 1.5;
    color: var(--accent-ink-lift);
    text-wrap: pretty;
}

.client-notes li + li {
    margin-top: 4px;
}

.toggle-row {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-size: 0.88rem;
    color: var(--text);
    user-select: none;
    transition: color var(--trans-fast);
}

.toggle-row:hover {
    color: var(--accent-ink);
}

.toggle-row.compact {
    font-size: 0.8rem;
    font-family: var(--fm);
    color: var(--text2);
}

.tags-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}

/* ── CPS unavailable (AWG 1.0) ────────────────────────────────────────── */
.cps-unavailable {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-top: 8px;
    padding: 12px 14px;
    border: 1px dashed var(--border3);
    border-radius: var(--radius);
    background: var(--bg3);
}

.cps-unavailable > svg {
    flex-shrink: 0;
    margin-top: 2px;
    color: var(--text3);
}

.cps-unavailable-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 0;
}

.cps-unavailable-body b {
    font-family: var(--fw);
    font-weight: 700;
    font-size: 0.82rem;
    color: var(--text2);
}

.cps-unavailable-body small {
    font-size: 0.74rem;
    line-height: 1.5;
    color: var(--text2);
    opacity: 0.8;
    text-wrap: pretty;
}

.cps-unavailable-cta {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
    align-self: center;
    padding: 6px 10px;
    border: 1px solid var(--border2);
    border-radius: var(--radius-sm);
    background: var(--bg2);
    color: var(--accent-ink);
    font-family: var(--fw);
    font-weight: 700;
    font-size: 0.73rem;
    cursor: pointer;
    transition: all var(--trans-fast);
}

.cps-unavailable-cta:hover {
    border-color: var(--amber-dim);
    background: var(--bg4);
}

/* MTU */
.mtu-row {
    display: flex;
    gap: 8px;
}

.mtu-input {
    width: 80px;
    text-align: center;
}

.mtu-presets {
    display: flex;
    gap: 4px;
    flex: 1;
}

.preset-btn {
    flex: 1;
    height: 38px;
    background: var(--bg3);
    border: 1px solid var(--border2);
    border-radius: var(--radius-sm);
    color: var(--text3);
    font-family: var(--fm);
    font-size: 0.72rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--trans-fast);
}

.preset-btn:hover {
    color: var(--text);
    border-color: var(--border);
}

.preset-btn.is-active {
    background: var(--surface-active);
    color: var(--accent-ink);
    border-color: rgb(var(--accent-rgb) / 0.3);
}

/* Intensity */
.intensity-bar {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 4px;
    background: var(--bg3);
    padding: 4px;
    border-radius: var(--radius);
}

.int-btn {
    padding: 8px;
    border-radius: var(--radius-sm);
    border: none;
    background: transparent;
    color: var(--text3);
    font-family: var(--fu);
    font-weight: 800;
    font-size: 0.68rem;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: all var(--trans-fast);
}

.int-btn:hover {
    color: var(--text2);
}

.int-btn.is-active {
    background: var(--bg);
    color: var(--accent-ink);
    box-shadow: var(--shadow-sm);
}

/* Generate button */
.gen-btn {
    height: 48px;
    font-family: var(--fu);
    font-size: 0.82rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    transition:
        all var(--trans-fast),
        box-shadow 0.4s ease;
}

.gen-btn:active {
    transform: scale(0.97);
}

/* Feedback */
.feedback-row {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
}

.iter-dots {
    display: flex;
    gap: 5px;
}

.idot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--bg3);
    border: 1px solid var(--border2);
    transition: all 0.35s var(--ease-bounce);
}

.idot.filled {
    background: var(--green);
    border-color: var(--green);
    box-shadow: 0 0 6px rgba(92, 184, 122, 0.4);
    animation: dotPop 0.4s var(--ease-bounce);
}

.idot.critical {
    background: var(--red);
    border-color: var(--red);
    box-shadow: 0 0 6px rgba(212, 96, 74, 0.4);
    animation: dotShake 0.4s ease;
}

@keyframes dotPop {
    0% {
        transform: scale(0.5);
    }
    60% {
        transform: scale(1.3);
    }
    100% {
        transform: scale(1);
    }
}

@keyframes dotShake {
    0%,
    100% {
        transform: translateX(0);
    }
    25% {
        transform: translateX(-2px);
    }
    75% {
        transform: translateX(2px);
    }
}

.fb-btns {
    display: flex;
    gap: 8px;
    width: 100%;
}

.fb-btns .btn {
    flex: 1;
    font-size: 0.78rem;
    height: 36px;
}

.fb-ok:hover {
    color: var(--green);
    border-color: rgba(92, 184, 122, 0.3);
    background: var(--green-bg);
}

.fb-bad:hover {
    color: var(--red);
    border-color: rgba(212, 96, 74, 0.3);
    background: var(--red-bg);
}

/* Log */
.gen-log {
    font-family: var(--fm);
    font-size: 0.68rem;
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding-top: 8px;
    border-top: 1px solid var(--border3);
}

.log-line {
    color: var(--text3);
    line-height: 1.4;
    animation: logFadeIn 0.3s var(--ease);
}

@keyframes logFadeIn {
    0% {
        opacity: 0;
        transform: translateY(4px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

.log-line.log-ok {
    color: var(--green);
}

.log-line.log-bad {
    color: var(--red);
}

.log-line.log-warn {
    color: var(--accent-ink);
}

/* ── Output Panel ─────────────────────────────────────────────────────── */
.panel-output {
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: none;
    border: none;
    border-radius: 0;
    padding: 0;
}

/* Output card */
.output-card {
    background: var(--bg2);
    border: 1px solid var(--border2);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition:
        border-color 0.4s ease,
        box-shadow 0.4s ease;
}

.output-card.just-generated {
    border-color: rgb(var(--accent-rgb) / 0.4);
    box-shadow: 0 0 20px rgb(var(--accent-rgb) / 0.08);
}

.output-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid var(--border2);
}

.output-head-left {
    display: flex;
    align-items: center;
    gap: 10px;
}

.version-chip {
    font-size: 0.6rem;
    font-family: var(--fm);
    font-weight: 700;
    padding: 2px 8px;
    background: rgb(var(--accent-rgb) / 0.1);
    color: var(--accent-ink);
    border-radius: 100px;
    border: 1px solid rgb(var(--accent-rgb) / 0.15);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.output-head-actions {
    display: flex;
    gap: 4px;
}

.btn-icon.xs {
    width: 28px;
    height: 28px;
    padding: 0;
}

.copy-ok {
    color: var(--green) !important;
}

.config-body {
    padding: 16px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.output-placeholder {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 8px 0;
}

.placeholder-line {
    height: 10px;
    background: var(--bg4);
    border-radius: 4px;
    animation: pulse 1.5s ease-in-out infinite;
}

.placeholder-line.w80 {
    width: 80%;
}
.placeholder-line.w70 {
    width: 70%;
}
.placeholder-line.w65 {
    width: 65%;
}
.placeholder-line.w60 {
    width: 60%;
}
.placeholder-line.w50 {
    width: 50%;
}

@keyframes pulse {
    0%,
    100% {
        opacity: 0.3;
    }
    50% {
        opacity: 0.6;
    }
}

/* ── Param Groups ─────────────────────────────────────────────────────── */
.param-group {
    background: var(--bg3);
    border: 1px solid var(--border3);
    border-radius: var(--radius);
    overflow: hidden;
    animation: groupSlideIn 0.35s var(--ease-snap) both;
}

@keyframes groupSlideIn {
    0% {
        opacity: 0;
        transform: translateY(10px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

.param-group-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border3);
}

.param-group-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--fu);
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text2);
}

.param-group-icon {
    flex-shrink: 0;
    color: var(--accent-ink);
}

.param-group-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 1px;
    background: var(--border3);
}

.param-group-grid.has-wide {
    grid-template-columns: 1fr;
}

.param-cell {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
    padding: 10px 14px;
    background: var(--bg2);
    cursor: pointer;
    transition: all var(--trans-fast);
    position: relative;
    min-width: 0;
}

.param-cell:hover {
    background: var(--surface);
}

.param-cell:active {
    background: var(--surface-active);
}

.param-cell-compact {
    align-items: center;
    text-align: center;
}

.param-cell-wide {
    flex-direction: row;
    align-items: center;
    gap: 12px;
}

.param-cell-label {
    font-size: 0.6rem;
    font-family: var(--fm);
    color: var(--text2);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    flex-shrink: 0;
    min-width: 24px;
}

/*
 * Multi-word names (HeaderProtectionKey, MaxHandshakeAttempts) keep their own
 * casing. Uppercasing them erased the only cue to where one word ends and the
 * next begins, which is what turned them into a single unreadable block.
 */
.param-cell-label-words {
    text-transform: none;
    font-size: 0.66rem;
    letter-spacing: 0.01em;
    white-space: normal;
}

/*
 * A hair of space between segments, without putting a character there.
 * The general sibling combinator, not the adjacent one: a <wbr> sits between
 * each pair, so `+` would never match.
 */
.pk-seg ~ .pk-seg {
    margin-left: 0.14em;
}

.param-cell-value {
    font-size: 0.85rem;
    font-family: var(--fm);
    font-weight: 700;
    color: var(--accent-ink);
    transition: color var(--trans-fast);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
}

.param-cell-wide .param-cell-value {
    font-size: 0.75rem;
    font-weight: 600;
    min-width: 0;
}

.param-long {
    font-size: 0.65rem;
    font-weight: 500;
    color: var(--text2);
    word-break: break-all;
    white-space: normal;
    line-height: 1.4;
    overflow: visible;
}

/* CPS values always highlighted amber/accent regardless of length */
.param-cps-value {
    color: var(--accent-ink) !important;
    font-size: 0.68rem;
    font-weight: 600;
    word-break: break-all;
    white-space: normal;
    line-height: 1.4;
    overflow: visible;
}

.param-cell-cps {
    border-left: 2px solid rgb(var(--accent-rgb) / 0.25);
}

.param-cell-cps:hover {
    border-left-color: var(--accent);
}

.is-cps .param-cell-label {
    color: var(--accent-ink);
    font-weight: 700;
}

.param-copied {
    color: var(--green) !important;
}

.param-copied-badge {
    position: absolute;
    top: 4px;
    right: 8px;
    font-size: 0.6rem;
    color: var(--green);
    font-weight: 800;
    animation: copiedPop 0.3s var(--ease-bounce);
}

@keyframes copiedPop {
    0% {
        transform: scale(0);
        opacity: 0;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}

/* ── Export card ──────────────────────────────────────────────────────── */
.export-card {
    margin-top: 10px;
    padding: 14px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: var(--radius);
}

.export-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text);
}

.export-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
}

.export-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 42px;
    padding: 9px 12px;
    font-size: 0.8rem;
    font-weight: 500;
    text-align: center;
    text-decoration: none;
    border-radius: var(--radius-sm);
}

.export-btn.export-sim {
    grid-column: 1 / -1;
}

/* ── Batch card ───────────────────────────────────────────────────────── */
.batch-card {
    margin-top: 18px;
    padding: 14px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: var(--radius);
}

.batch-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
}

.batch-title {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text);
}

.batch-hint {
    margin: 0 0 12px;
    font-size: 0.72rem;
    color: var(--muted);
    line-height: 1.4;
}

.batch-row {
    display: flex;
    gap: 10px;
    align-items: stretch;
}

.batch-input {
    width: 80px;
    text-align: center;
    padding: 8px 10px;
    font-size: 0.85rem;
}

.batch-btn {
    flex: 1;
    font-size: 0.8rem;
}

.batch-btn.running {
    animation: pulseBtn 1.2s infinite;
}

@keyframes pulseBtn {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.65;
    }
}

.batch-download {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    margin-top: 10px;
    font-size: 0.8rem;
}

.batch-download.pop-in {
    animation: popIn 0.35s var(--ease-bounce);
}

@keyframes popIn {
    0% {
        transform: scale(0.95);
        opacity: 0;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}

/* ── Preview card ─────────────────────────────────────────────────────── */
.preview-card {
    background: var(--bg2);
    border: 1px solid var(--border2);
    border-radius: var(--radius-lg);
    overflow: hidden;
}

.preview-head {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--border2);
}

.preview-code {
    padding: 16px 20px;
    font-family: var(--fm);
    font-size: 0.72rem;
    line-height: 1.7;
    color: var(--text2);
    white-space: pre-wrap;
    min-height: 420px;
    max-height: 560px;
    overflow-y: auto;
    margin: 0;
    background: transparent;
    border: none;
    border-radius: 0;
}

.preview-line.comment {
    color: var(--text3);
}

.preview-line.kv {
    color: var(--text);
}

.preview-line.section {
    color: var(--accent-ink);
    font-weight: 600;
}

/* ── Merge Banner ─────────────────────────────────────────────────────── */
.merge-banner {
    margin-top: 3rem;
    background: linear-gradient(
        135deg,
        rgb(var(--accent-rgb) / 0.06) 0%,
        var(--bg2) 40%,
        rgba(80, 200, 220, 0.03) 100%
    );
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 28px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    flex-wrap: wrap;
    transition: box-shadow var(--trans-norm);
}

.merge-banner:hover {
    box-shadow: 0 4px 24px rgb(var(--accent-rgb) / 0.06);
}

.merge-banner-content {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    flex: 1;
    min-width: 260px;
}

.merge-banner-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-active);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--accent-ink);
    flex-shrink: 0;
    transition: transform var(--trans-norm);
}

.merge-banner:hover .merge-banner-icon {
    transform: rotate(-8deg) scale(1.05);
}

.merge-banner-text h3 {
    font-size: 1rem;
    margin-bottom: 4px;
}

.merge-banner-text p {
    font-size: 0.88rem;
    color: var(--text2);
    margin: 0;
    line-height: 1.5;
}

.merge-banner-actions {
    display: flex;
    gap: 12px;
    flex-shrink: 0;
}

/* ── Pointers into the FAQ ────────────────────────────────────────────
   Deliberately lighter than the MergeKeys block above it: no icon plates,
   no separate button. These are references, and the rhythm should say so —
   one action block, then a quieter pair.                                  */
.help-links {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 10px;
    margin-top: 1.25rem;
}

.help-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--bg2);
    color: inherit;
    text-decoration: none;
    transition:
        border-color var(--trans-fast),
        background var(--trans-fast);
}

.help-link:hover {
    border-color: var(--amber-dim);
    background: var(--bg3);
}

.help-link > svg:first-child {
    flex-shrink: 0;
    color: var(--accent-ink);
}

.help-link-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
}

.help-link-text b {
    font-family: var(--fw);
    font-weight: 700;
    font-size: 0.88rem;
    color: var(--text);
}

.help-link-text small {
    font-size: 0.76rem;
    line-height: 1.4;
    color: var(--text2);
}

/* Shared: see `.chevron` in main.css. */

.help-link:hover .help-link-arrow {
    color: var(--accent-ink);
    transform: translateX(2px);
}

@media (prefers-reduced-motion: reduce) {
    .help-link-arrow {
        transition: none;
    }
    .help-link:hover .help-link-arrow {
        transform: none;
    }
}

/* ── Responsive ───────────────────────────────────────────────────────── */
@media (max-width: 768px) {
    .home-page {
        padding: 1rem 0 3rem;
    }

    .hero-title {
        font-size: clamp(1.4rem, 6vw, 2rem);
    }

    .version-bar {
        flex-wrap: wrap;
    }

    .ver-tab {
        padding: 6px 12px;
        font-size: 0.72rem;
    }

    .panel-controls {
        order: 1;
    }

    .panel-output {
        order: 2;
    }

    .merge-banner {
        flex-direction: column;
        align-items: flex-start;
        padding: 20px;
    }

    .merge-banner-actions {
        width: 100%;
    }

    .merge-banner-actions .btn {
        flex: 1;
    }

    .cps-unavailable {
        flex-wrap: wrap;
    }

    .cps-unavailable-cta {
        width: 100%;
        justify-content: center;
        margin-top: 4px;
    }

    .history-entry {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    .history-entry-info {
        min-width: auto;
    }

    .history-entry-actions {
        align-self: flex-end;
    }

    .config-actions-row {
        display: none;
    }

    .export-grid {
        grid-template-columns: 1fr;
    }

    .export-btn.export-sim {
        grid-column: auto;
    }

    .param-group-grid {
        grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    }

    .config-body {
        padding: 12px 14px 16px;
    }
}

@media (max-width: 480px) {
    /* Four version tabs never fit on one phone line. Lay them out as a fixed
       2×2 grid instead of letting flex-wrap break them unevenly. */
    .ver-tabs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
        width: 100%;
        border-radius: var(--radius);
    }

    /* Touch has no hover, so the tooltip never appears — give the button a
       visible label and let it span the row instead of sitting as a lone
       unexplained icon. */
    .history-toggle {
        width: 100%;
        justify-content: center;
        gap: 8px;
        padding: 10px 14px;
        border-radius: var(--radius);
    }

    .history-label {
        display: inline;
        font-family: var(--fw);
        font-weight: 700;
        font-size: 0.8rem;
    }

    .history-toggle .history-count {
        position: static;
        margin-left: 2px;
    }

    .ver-tab {
        justify-content: center;
        padding: 9px 10px;
    }

    .version-bar {
        align-items: stretch;
    }

    /* The CPS tag chips are a checkbox plus a 3-4 character label — two per
       row fits comfortably even at 320px, so keep the desktop grid. */
    .tags-grid {
        grid-template-columns: 1fr 1fr;
    }

    .param-group-grid:not(.has-wide) {
        grid-template-columns: repeat(3, 1fr);
    }

    .awg3-panel {
        padding: 12px;
    }
}
</style>
