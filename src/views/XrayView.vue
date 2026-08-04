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
                            <span class="gen-tile-key">{{ p.kind }}</span>
                            <span class="gen-tile-val">{{ p.key }}</span>
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
                </span>
            </div>

            <div class="zone-body">
                <div v-if="!hasConfig" class="empty">
                    <span class="empty-desc">{{ t("xg.out.empty") }}</span>
                </div>
                <pre v-else-if="outView === 'server'" class="well gen-out">{{ serverJson }}</pre>
                <div v-else class="chain">
                    <div v-for="(uri, i) in clientUris" :key="i" class="chain-row">
                        <span class="chain-key">{{ i + 1 }}</span>
                        <span class="chain-val">{{ uri }}</span>
                    </div>
                </div>
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
