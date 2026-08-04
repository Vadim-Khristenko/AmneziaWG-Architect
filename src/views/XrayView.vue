<script setup lang="ts">
/**
 * The XRay generator — a first sketch, drawn from the catalogue.
 *
 * The AmneziaWG page draws each group of parameters as the thing it controls,
 * and XRay will get the same treatment. This is the step before that: every
 * parameter the catalogue knows about, on screen, in its own group, with its
 * real state showing — so the shape of the work is visible and can be argued
 * about before any of it is drawn.
 *
 * THREE STATES, NOT TWO
 *
 * The catalogue carries `generated` and `offered`, and the difference is the
 * whole point:
 *
 *   generated  Architect picks the value itself.
 *   offered    you supply it, deliberately — `acceptProxyProtocol` breaks the
 *              inbound unless something upstream really speaks PROXY, and
 *              `maxTimeDiff` cuts off clients whose clocks are wrong.
 *              Inventing either would make a worse tool, not a fuller one.
 *   neither    not yet expressible in the current config model.
 *
 * So each group reports two numbers rather than one, instead of a single
 * figure that quietly mixes "we chose not to" with "we cannot yet".
 *
 * The core controls are live and the config really is produced. Everything
 * else is shown read-only, which is the truthful state of it today.
 */

import { computed, onMounted, ref } from "vue";
import {
    Sparkles,
    Copy,
    Check,
    Download,
    KeyRound,
    Globe,
    Layers as LayersIcon,
    Cpu,
    TriangleAlert,
} from "lucide-vue-next";

import { useCopyFeedback } from "@/composables/useCopyFeedback";
import { downloadText } from "@/utils/download";
import { XRAY_VERSIONS } from "@/engines/xray/versions";
import {
    XRAY_PARAMETERS,
    xrayCoverage,
    xrayParamsFor,
} from "@/engines/xray/params";
import { createDefaults, generateXray } from "@/engines/xray/generate";
import { buildServerInbound, buildClientUris } from "@/engines/xray/render";
import type { XrayConfig, XrayInput } from "@/engines/xray/types";
import { localizePath, useI18n } from "@/i18n";

const { locale, t } = useI18n();
const at = (path: string) => localizePath(path, locale.value);
const { copy, isCopied } = useCopyFeedback();

/* ── The lockup doubles as engine navigation ─────────────────────────────── */

const ENGINES = [
    { id: "awg", label: "Amnezia", to: "/amneziawg" },
    { id: "xray", label: "XRay", to: "/xray" },
] as const;

/* ── State ───────────────────────────────────────────────────────────────── */

const input = ref<XrayInput>(createDefaults());
const config = ref<XrayConfig | null>(null);
const outView = ref<"server" | "client">("server");

/**
 * How much of it, kept separate from whose.
 *
 * "The server config, value by value" and "the client link, whole" are both
 * things people want, and one switch with four positions would have made them
 * choose between two unrelated questions.
 */
const outDetail = ref<"one" | "whole">("whole");

const versions = XRAY_VERSIONS;

const TRANSPORTS = ["raw", "xhttp", "grpc", "httpupgrade", "ws"] as const;
const SECURITIES = ["reality", "tls", "none"] as const;
const FLOWS = ["xtls-rprx-vision", ""] as const;

function build() {
    config.value = generateXray(input.value);
}

onMounted(build);

/* ── The catalogue, grouped ──────────────────────────────────────────────── */

/**
 * Groups in the order a config is written, not alphabetically: the inbound
 * first, then what runs inside it, then how the socket underneath behaves.
 */
type ParamState = "generated" | "manual" | "missing";

const STATE_LABEL: Record<ParamState, string> = {
    generated: "xg.state.generated",
    manual: "xg.state.manual",
    missing: "xg.state.missing",
};

const STATE_HINT: Record<ParamState, string> = {
    generated: "xg.state.generated.hint",
    manual: "xg.state.manual.hint",
    missing: "xg.state.missing.hint",
};

const stateLabel = (state: ParamState) => t(STATE_LABEL[state] as never);
const stateHint = (state: ParamState) => t(STATE_HINT[state] as never);

const GROUP_ORDER = [
    "inbound",
    "vless",
    "reality",
    "tls",
    "xhttp",
    "xmux",
    "transport",
    "sockopt",
    "finalmask",
] as const;

const coverage = xrayCoverage();

const groupNote = (group: string) => t(("xg.group." + group + ".note") as never);

const sideLabel = (side: string) => t(("xg.side." + side) as never);
const sideHint = (side: string) => t(("xg.side." + side + ".hint") as never);

/** Which parameters exist at the selected core version. */
const available = computed(
    () => new Set(xrayParamsFor(input.value.version).map((p) => p.key)),
);

const groups = computed(() =>
    GROUP_ORDER.map((group) => {
        const items = XRAY_PARAMETERS.filter((p) => p.group === group).map((p) => ({
            key: p.key,
            kind: p.kind,
            state: (p.generated
                ? "generated"
                : p.offered
                  ? "manual"
                  : "missing") as ParamState,
            /** Dimmed rather than hidden: absent here is a fact about the version. */
            inVersion: available.value.has(p.key),
            /** What it is worth in the config on screen, if anything. */
            value: serverValues.value[p.key] ?? "",
            side: sideOf(p.key),
        }));
        return {
            group,
            label: t(("xg.group." + group) as never),
            items,
            done: coverage[group]?.done ?? 0,
            total: coverage[group]?.total ?? 0,
        };
    }).filter((g) => g.items.length > 0),
);

/* ── Output ──────────────────────────────────────────────────────────────── */

const serverJson = computed(() =>
    config.value ? JSON.stringify(buildServerInbound(config.value), null, 2) : "",
);

const clientUris = computed(() =>
    config.value ? buildClientUris(config.value) : [],
);

const hasConfig = computed(() => config.value !== null);

/* ── What each parameter is actually worth right now ─────────────────────── */

/**
 * Every leaf of the produced inbound, keyed by its own name.
 *
 * The catalogue names a parameter the way the core spells it — `shortIds`,
 * `xPaddingBytes`, `tcpcongestion` — and the config nests them differently in
 * every section. Matching on the leaf name rather than the path means a
 * parameter finds its value wherever the renderer decided to put it, and a
 * parameter with no value simply has none to show.
 */
function leafValues(value: unknown, out: Record<string, string> = {}) {
    if (value === null || value === undefined) return out;
    if (Array.isArray(value)) {
        for (const v of value) leafValues(v, out);
        return out;
    }
    if (typeof value === "object") {
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            if (v !== null && typeof v === "object" && !Array.isArray(v)) {
                leafValues(v, out);
            } else if (Array.isArray(v)) {
                out[k] = v.map((x) => String(x)).join(", ");
                leafValues(v, out);
            } else {
                out[k] = String(v);
            }
        }
    }
    return out;
}

const serverValues = computed(() =>
    config.value ? leafValues(buildServerInbound(config.value)) : {},
);

/**
 * Which query keys the client link carries.
 *
 * This is the honest answer to "what does the client see": not a list somebody
 * maintained by hand, but the parameters that are really in the URI the user
 * is about to send to their phone.
 */
const clientKeys = computed(() => {
    const uri = clientUris.value[0];
    if (!uri) return new Set<string>();
    const q = uri.slice(uri.indexOf("?") + 1);
    return new Set(
        q
            .split("&")
            .map((pair) => pair.split("=")[0] ?? "")
            .filter(Boolean),
    );
});

/**
 * Where a parameter ends up.
 *
 * The URI spells some of them differently from the config — `pbk` is the
 * REALITY public key, `sid` a shortId, `fp` the fingerprint — so the few that
 * are renamed on the way out are stated rather than guessed at.
 */
const URI_ALIAS: Record<string, string> = {
    publicKey: "pbk",
    shortIds: "sid",
    fingerprint: "fp",
    serverNames: "sni",
    spiderX: "spx",
    flow: "flow",
    path: "path",
    host: "host",
    mode: "mode",
};

type Side = "server" | "both" | "none";

function sideOf(key: string): Side {
    const inClient = clientKeys.value.has(URI_ALIAS[key] ?? key);
    const inServer = key in serverValues.value;
    if (inClient) return "both";
    return inServer ? "server" : "none";
}

/** The whole thing, as text, for whichever side is selected. */
const wholeText = computed(() =>
    outView.value === "server" ? serverJson.value : clientUris.value.join("\n"),
);

/**
 * The same thing value by value.
 *
 * For the server that is every leaf of the inbound; for the client it is the
 * query the link carries, which is what a person pasting one field at a time
 * into a client app is actually looking for.
 */
const outRows = computed(() => {
    if (outView.value === "server") {
        return Object.entries(serverValues.value).map(([key, value]) => ({ key, value }));
    }
    const uri = clientUris.value[0];
    if (!uri) return [];

    const rows: { key: string; value: string }[] = [];
    const at = uri.indexOf("?");
    const head = at === -1 ? uri : uri.slice(0, at);
    rows.push({ key: "uri", value: head });

    if (at !== -1) {
        for (const pair of uri.slice(at + 1).split("&")) {
            const [k, v = ""] = pair.split("=");
            if (k) rows.push({ key: k, value: decodeURIComponent(v) });
        }
    }
    return rows;
});

function copyRow(key: string, value: string) {
    void copy("r:" + key, value);
}

function copyOut() {
    const text =
        outView.value === "server" ? serverJson.value : clientUris.value.join("\n");
    void copy("out", text);
}

function downloadOut() {
    if (outView.value === "server") {
        downloadText("xray-inbound.json", serverJson.value);
    } else {
        downloadText("xray-clients.txt", clientUris.value.join("\n"));
    }
}

function setServerNames(event: Event) {
    input.value.serverNames = (event.target as HTMLInputElement).value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    build();
}
</script>

<template>
    <div class="gen">
        <!-- ══ Branding, which is also where you switch engine ══════════ -->
        <header class="gen-head">
            <div class="gen-lockup">
                <div class="gen-engines">
                    <router-link
                        v-for="(e, i) in ENGINES"
                        :key="e.id"
                        :to="at(e.to)"
                        class="gen-engine"
                        :class="{ 'is-on': e.id === 'xray' }"
                    >
                        {{ e.label }}<span v-if="i === 0" class="gen-slash">/</span>
                    </router-link>
                </div>
                <h1 class="gen-name">{{ t("brand.main") }}</h1>
            </div>
        </header>

        <!-- ══ Setup ═══════════════════════════════════════════════════ -->
        <h2 class="gen-section">{{ t("xg.section.setup") }}</h2>

        <div class="gen-zones">
            <section class="zone gen-span-4">
                <div class="zone-head">
                    <Cpu :size="15" class="zone-icon" />
                    <span class="zone-title">{{ t("xg.zone.core") }}</span>
                </div>
                <p class="zone-note">{{ t("xg.zone.core.note") }}</p>
                <div class="zone-body">
                    <label class="field">
                        <select v-model="input.version" class="select" @change="build">
                            <option v-for="v in versions" :key="v.id" :value="v.id">
                                {{ v.label }}
                            </option>
                        </select>
                    </label>
                </div>
            </section>

            <section class="zone gen-span-8">
                <div class="zone-head">
                    <Globe :size="15" class="zone-icon" />
                    <span class="zone-title">{{ t("xg.zone.donor") }}</span>
                </div>
                <p class="zone-note">{{ t("xg.zone.donor.note") }}</p>
                <div class="zone-body xg-donor">
                    <label class="field">
                        <span class="label">address</span>
                        <input
                            v-model="input.address"
                            class="input input--mono"
                            placeholder="203.0.113.10"
                            @change="build"
                        />
                    </label>
                    <label class="field">
                        <span class="label">dest</span>
                        <input
                            v-model="input.dest"
                            class="input input--mono"
                            @change="build"
                        />
                    </label>
                    <label class="field">
                        <span class="label">serverNames</span>
                        <input
                            :value="input.serverNames.join(', ')"
                            class="input input--mono"
                            @change="setServerNames"
                        />
                    </label>
                </div>
            </section>

            <section class="zone gen-span-6">
                <div class="zone-head">
                    <LayersIcon :size="15" class="zone-icon" />
                    <span class="zone-title">{{ t("xg.zone.layers") }}</span>
                </div>
                <p class="zone-note">{{ t("xg.zone.layers.note") }}</p>
                <div class="zone-body xg-layers">
                    <label class="field">
                        <span class="label">transport</span>
                        <select v-model="input.transport" class="select" @change="build">
                            <option v-for="x in TRANSPORTS" :key="x" :value="x">
                                {{ x }}
                            </option>
                        </select>
                    </label>
                    <label class="field">
                        <span class="label">security</span>
                        <select v-model="input.security" class="select" @change="build">
                            <option v-for="x in SECURITIES" :key="x" :value="x">
                                {{ x }}
                            </option>
                        </select>
                    </label>
                    <label class="field">
                        <span class="label">flow</span>
                        <select v-model="input.flow" class="select" @change="build">
                            <option v-for="x in FLOWS" :key="x" :value="x">
                                {{ x || "—" }}
                            </option>
                        </select>
                    </label>
                </div>
            </section>

            <section class="zone gen-span-6">
                <div class="zone-head">
                    <KeyRound :size="15" class="zone-icon" />
                    <span class="zone-title">{{ t("xg.zone.ids") }}</span>
                </div>
                <p class="zone-note">{{ t("xg.zone.ids.note") }}</p>
                <div class="zone-body xg-layers">
                    <label class="field">
                        <span class="label">shortId × N</span>
                        <input
                            v-model.number="input.shortIdCount"
                            class="input input--mono"
                            type="number"
                            min="1"
                            max="16"
                            @change="build"
                        />
                    </label>
                    <label class="field">
                        <span class="label">hex</span>
                        <input
                            v-model.number="input.shortIdLength"
                            class="input input--mono"
                            type="number"
                            min="2"
                            max="16"
                            step="2"
                            @change="build"
                        />
                    </label>
                    <label class="field">
                        <span class="label">clients</span>
                        <input
                            v-model.number="input.clientCount"
                            class="input input--mono"
                            type="number"
                            min="1"
                            max="64"
                            @change="build"
                        />
                    </label>
                </div>
            </section>
        </div>

        <!-- ══ Every parameter, and where it stands ════════════════════ -->
        <h2 class="gen-section">{{ t("xg.section.params") }}</h2>

        <div class="gen-zones">
            <section v-for="g in groups" :key="g.group" class="zone gen-span-6">
                <div class="zone-head">
                    <span class="zone-title">{{ g.label }}</span>
                    <span class="zone-aside">
                        <span class="badge">
                            {{ t("xg.coverage", { done: g.done, total: g.total }) }}
                        </span>
                    </span>
                </div>

                <p class="zone-note">{{ groupNote(g.group) }}</p>

                <div class="zone-body">
                    <div class="gen-tiles">
                        <!--
                            Dimmed rather than hidden when the selected core
                            does not have it: absence is a fact about the
                            version, and a parameter that vanishes silently
                            teaches nothing about why.
                        -->
                        <div
                            v-for="p in g.items"
                            :key="p.key"
                            class="gen-tile xg-param"
                            :class="[`is-${p.state}`, { 'is-absent': !p.inVersion }]"
                        >
                            <span class="xg-tile-top">
                                <span class="gen-tile-key">{{ p.kind }}</span>
                                <!--
                                    Where the value ends up. "both" means it is
                                    in the link the user sends to their phone
                                    as well as in the server file, which is the
                                    question anyone setting this up actually
                                    has.
                                -->
                                <span
                                    v-if="p.side !== 'none'"
                                    class="xg-side"
                                    :class="'is-' + p.side"
                                    :data-tooltip="sideHint(p.side)"
                                >
                                    {{ sideLabel(p.side) }}
                                </span>
                            </span>
                            <span class="gen-tile-val">{{ p.key }}</span>
                            <span v-if="p.value" class="xg-value">{{ p.value }}</span>
                            <span
                                class="xg-state"
                                :data-tooltip="stateHint(p.state)"
                            >
                                {{ stateLabel(p.state) }}
                            </span>
                        </div>
                    </div>
                </div>
            </section>
        </div>

        <!-- ══ Actions ═════════════════════════════════════════════════ -->
        <div class="strip gen-actions">
            <button class="btn btn--primary btn--lg" @click="build">
                <Sparkles :size="16" />
                {{ hasConfig ? t("xg.act.regenerate") : t("xg.act.generate") }}
            </button>
        </div>

        <!-- ══ Result ══════════════════════════════════════════════════ -->
        <h2 class="gen-section">{{ t("xg.section.result") }}</h2>

        <section class="zone">
            <div class="zone-head">
                <span class="zone-title">{{ t("gen.out.title") }}</span>
                <span class="zone-aside">
                    <!--
                        Two switches, not one with four positions: whose config
                        and how much of it are unrelated questions, and folding
                        them together makes answering one mean answering both.
                    -->
                    <div class="segment">
                        <button
                            class="segment-opt"
                            :class="{ 'is-active': outView === 'server' }"
                            @click="outView = 'server'"
                        >
                            {{ t("xg.out.server") }}
                        </button>
                        <button
                            class="segment-opt"
                            :class="{ 'is-active': outView === 'client' }"
                            @click="outView = 'client'"
                        >
                            {{ t("xg.out.client") }}
                        </button>
                    </div>
                    <div class="segment">
                        <button
                            class="segment-opt"
                            :class="{ 'is-active': outDetail === 'one' }"
                            @click="outDetail = 'one'"
                        >
                            {{ t("gen.view.one") }}
                        </button>
                        <button
                            class="segment-opt"
                            :class="{ 'is-active': outDetail === 'whole' }"
                            @click="outDetail = 'whole'"
                        >
                            {{ t("gen.view.whole") }}
                        </button>
                    </div>
                </span>
            </div>

            <div class="zone-body">
                <div v-if="!hasConfig" class="empty">
                    <span class="empty-desc">{{ t("xg.out.empty") }}</span>
                </div>

                <!--
                    No address means no link to build. Saying so is the whole
                    difference between an empty panel and a broken one.
                -->
                <div v-else-if="outView === 'client' && !clientUris.length" class="note note--warn">
                    <TriangleAlert :size="15" class="note-icon" />
                    <span>{{ t("xg.out.needAddress") }}</span>
                </div>

                <div v-else-if="outDetail === 'one'" class="gen-tiles">
                    <button
                        v-for="row in outRows"
                        :key="row.key"
                        class="gen-tile xg-copyable"
                        :data-tooltip="t('gen.params.copyHint')"
                        @click="copyRow(row.key, row.value)"
                    >
                        <span class="gen-tile-key">{{ row.key }}</span>
                        <span class="gen-tile-val">{{ row.value }}</span>
                        <Check v-if="isCopied('r:' + row.key)" :size="13" class="xg-copy-ok" />
                        <Copy v-else :size="13" class="xg-copy" />
                    </button>
                </div>

                <pre v-else class="well gen-out">{{ wholeText }}</pre>
            </div>

            <div v-if="hasConfig" class="zone-foot gen-outacts">
                <button class="btn btn--secondary btn--sm" @click="copyOut">
                    <Check v-if="isCopied('out')" :size="14" />
                    <Copy v-else :size="14" />
                    {{ t("gen.out.copyConf") }}
                </button>
                <button class="btn btn--ghost btn--sm" @click="downloadOut">
                    <Download :size="14" /> {{ t("gen.out.downloadConf") }}
                </button>
            </div>
        </section>
    </div>
</template>

<style scoped>
/*
 * The shell, the zones and the tiles are the generator's, shared with
 * AmneziaWG rather than restated — two generators that look like two products
 * is the thing a kit exists to prevent. Only what is particular to XRay is
 * here.
 */

.gen {
    max-width: 1120px;
    margin: 0 auto;
    padding: var(--sp-7) var(--sp-gutter) var(--sp-10);
    display: flex;
    flex-direction: column;
    gap: var(--sp-5);
}

.gen-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--sp-4);
}

.gen-lockup {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
}

.gen-engines {
    display: flex;
    align-items: baseline;
    gap: var(--sp-2);
    font-family: var(--fm);
    font-size: var(--t-xs);
    letter-spacing: 0.28em;
    text-transform: uppercase;
}

.gen-engine {
    color: var(--ink-3);
    transition: color var(--trans-fast);
}

.gen-engine.is-on {
    color: var(--accent-ink);
}

.gen-engine:hover {
    color: var(--ink);
}

.gen-slash {
    margin-left: var(--sp-2);
    color: var(--ink-faint);
}

.gen-name {
    margin: 0;
    font-family: var(--fu);
    font-size: clamp(1.9rem, 4.4vw, 3rem);
    font-weight: 800;
    line-height: 1;
    letter-spacing: var(--track-display);
    color: var(--ink);
}

.gen-section {
    margin: var(--sp-4) 0 0;
    font-family: var(--fu);
    font-size: var(--t-lg);
    font-weight: 700;
    letter-spacing: var(--track-tight);
    color: var(--ink);
}

.zone-icon {
    color: var(--accent-ink);
    flex-shrink: 0;
}

/* ── Zones ────────────────────────────────────────────────────────────── */

.gen-zones {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    align-items: start;
    gap: var(--sp-4);
}

.gen-span-4 {
    grid-column: span 4;
}

.gen-span-6 {
    grid-column: span 6;
}

.gen-span-8 {
    grid-column: span 8;
}

.xg-donor,
.xg-layers {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--sp-4);
}

/* ── Parameter tiles ──────────────────────────────────────────────────── */

.gen-tiles {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: var(--sp-2);
}

.gen-tile {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
    padding: var(--sp-3);
    border: var(--rule) solid var(--line-faint);
    border-radius: var(--r-2);
    background: var(--ground-3);
    text-align: left;
}

.gen-tile-key {
    font-family: var(--fm);
    font-size: var(--t-2xs);
    letter-spacing: var(--track-label);
    color: var(--ink-3);
}

.gen-tile-val {
    font-family: var(--fm);
    font-size: var(--t-sm);
    color: var(--ink);
    overflow-wrap: anywhere;
}

/*
 * The three states, told apart by a word as well as by colour. Colour alone is
 * the one thing a reader with a colour vision difference cannot use, and this
 * is a page whose entire purpose is that distinction.
 */
/* The value the parameter actually has in the config on screen. */
.xg-value {
    font-family: var(--fm);
    font-size: var(--t-2xs);
    color: var(--accent-ink);
    overflow-wrap: anywhere;
    line-height: 1.45;
}

.xg-tile-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-2);
    width: 100%;
}

/*
 * Which side carries it. Two words rather than an icon, because "does the
 * client need this too" is the question, and an icon would need a legend to
 * answer it.
 */
.xg-side {
    font-family: var(--fm);
    font-size: 9px;
    letter-spacing: var(--track-label);
    text-transform: uppercase;
    padding: 1px 5px;
    border-radius: var(--r-1);
    cursor: help;
    white-space: nowrap;
}

.xg-side.is-server {
    background: var(--ground-4);
    color: var(--ink-3);
}

.xg-side.is-both {
    background: var(--surface-solid-2);
    color: var(--accent-ink);
}

/* The result tiles are clickable; the catalogue ones are not. */
.xg-copyable {
    cursor: pointer;
    padding-right: var(--sp-7);
    transition:
        border-color var(--dur-2) var(--ease-out-quart),
        background-color var(--dur-2) var(--ease-out-quart);
}

.xg-copyable:hover {
    border-color: var(--accent);
    background: var(--surface-solid);
}

.xg-copy,
.xg-copy-ok {
    position: absolute;
    top: var(--sp-3);
    right: var(--sp-3);
}

.xg-copy {
    color: var(--ink-faint);
}

.xg-copyable:hover .xg-copy {
    color: var(--accent-ink);
}

.xg-copy-ok {
    color: var(--green);
}

.xg-state {
    font-family: var(--fm);
    font-size: 10px;
    letter-spacing: var(--track-label);
    text-transform: uppercase;
    cursor: help;
}

.is-generated {
    border-color: rgb(var(--accent-rgb) / 0.35);
}

.is-generated .xg-state {
    color: var(--accent-ink);
}

.is-manual .xg-state {
    color: var(--ink-3);
}

.is-missing {
    background-image: var(--hatch);
}

.is-missing .xg-state {
    color: var(--red);
}

/* Present in the catalogue, absent from the selected core. */
.is-absent {
    opacity: 0.4;
}

/* ── Actions and output ───────────────────────────────────────────────── */

.gen-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--sp-4);
    border-radius: var(--r-3);
    padding: var(--sp-4) var(--sp-5);
}

.gen-out {
    margin: 0;
    max-height: 460px;
    overflow: auto;
    font-size: var(--t-sm);
}

.gen-outacts {
    flex-wrap: wrap;
}

/* ── Narrow ───────────────────────────────────────────────────────────── */

@media (max-width: 640px) {
    .zone-head {
        flex-wrap: wrap;
    }

    .zone-aside {
        width: 100%;
        margin-left: 0;
    }

    .zone-aside .segment {
        flex: 1;
    }

    .zone-aside .segment-opt {
        flex: 1;
        text-align: center;
    }
}

@media (max-width: 900px) {
    .gen-span-4,
    .gen-span-6,
    .gen-span-8 {
        grid-column: 1 / -1;
    }
}
</style>
