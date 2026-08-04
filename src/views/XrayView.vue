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
    History as HistoryIcon,
    Server,
    Search,
    TriangleAlert,
} from "lucide-vue-next";

import { useCopyFeedback } from "@/composables/useCopyFeedback";
import { useHistory } from "@/composables/useHistory";
import HistoryPanel from "@/components/HistoryPanel.vue";
import type { GeneratorHistoryEntry } from "@/types/generatorHistory";
import type { XrayHistoryEntry } from "@/engines/xray/history";
import { downloadText } from "@/utils/download";
import { XRAY_VERSIONS } from "@/engines/xray/versions";
import {
    XRAY_PARAMETERS,
    xrayCoverage,
    xrayParamsFor,
} from "@/engines/xray/params";
import { createDefaults, generateXray } from "@/engines/xray/generate";
import { validateXray } from "@/engines/xray/validate";
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

onMounted(() => {
    loadHistory();
    generateAndRemember();
});

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
            wide: WIDE_GROUPS.has(group),
            done: coverage[group]?.done ?? 0,
            total: coverage[group]?.total ?? 0,
        };
    }).filter((g) => g.items.length > 0 && groupApplies(g.group)),
);

/* ── What is on screen, and what is not ──────────────────────────────────── */

/**
 * A group is shown when it is in the config being produced.
 *
 * The first version listed all nine always, so a `raw` inbound displayed
 * twenty-eight XHTTP parameters that were not going anywhere near the output.
 * That is not completeness, it is noise with a coverage badge on it.
 *
 * Derived from the two layer choices rather than from a flag somebody has to
 * remember to set, so a transport added later appears without this having to
 * be edited.
 */
function groupApplies(group: string): boolean {
    switch (group) {
        case "reality":
            return input.value.security === "reality";
        case "tls":
            return input.value.security === "tls";
        case "xhttp":
        case "xmux":
            return input.value.transport === "xhttp";
        case "transport":
            // The per-transport block: gRPC, WebSocket, HTTPUpgrade. `raw` has
            // no settings of its own and `xhttp` has its own section.
            return !["raw", "xhttp"].includes(input.value.transport);
        default:
            return true;
    }
}

/** REALITY and XHTTP carry most of the surface; they get the whole row. */
const WIDE_GROUPS = new Set(["reality", "xhttp"]);

/* ── The help drawers, as on the AmneziaWG page ──────────────────────────── */

/**
 * One open at a time, opened by the question mark, pushing the zone taller
 * rather than covering the controls it explains.
 */
const openHelp = ref<string | null>(null);
const toggleHelp = (group: string) =>
    (openHelp.value = openHelp.value === group ? null : group);

/** The catalogue's own notes, which nothing had rendered until now. */
function helpFor(group: string) {
    return XRAY_PARAMETERS.filter((p) => p.group === group && p.note).map((p) => ({
        key: p.key,
        note: t(p.note as never),
    }));
}

/* ── The donor, checked ──────────────────────────────────────────────────── */

/**
 * Is the donor reachable from here?
 *
 * The same check the AmneziaWG page runs on a mimicry host. It answers one
 * question — whether the name resolves and answers — and not the ones that
 * decide whether a donor is any good: TLS 1.3, HTTP/2, no redirect, and not
 * sharing a CDN with your own server. A browser cannot see those, and
 * pretending otherwise would be worse than saying so.
 */
const donorStatus = ref<"" | "checking" | "ok" | "blocked">("");

const donorLabel = computed(() =>
    donorStatus.value ? t(("xg.donor." + donorStatus.value) as never) : "",
);

async function checkDonor() {
    const host = input.value.dest.split(":")[0]?.trim();
    if (!host) return;

    donorStatus.value = "checking";
    const { isKnownBlocked, checkDomain } = await import("@/utils/domainCheck");

    if (isKnownBlocked(host)) {
        donorStatus.value = "blocked";
        return;
    }
    const result = await checkDomain(host);
    donorStatus.value = result.accessible ? "ok" : "blocked";
}

/** The donor/SNI warning, surfaced where the mistake is made. */
const sniMismatch = computed(() => {
    if (!config.value) return "";
    const finding = validateXray(config.value).find(
        (f) => f.code === "xray.sni_dest_mismatch",
    );
    if (!finding) return "";
    return t("find.xray.sni_dest_mismatch" as never, finding.values ?? {});
});

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
 * Every leaf of the produced inbound, with the path it was found at.
 *
 * The catalogue names a parameter the way the core spells it — `shortIds`,
 * `xPaddingBytes`, `tcpcongestion` — and the config nests them differently in
 * every section, so the lookup is by leaf name. The path comes along because
 * the result panel groups by it: `streamSettings.…` is transport and security,
 * `sockopt.…` is the socket, and the rest is the inbound itself.
 *
 * An array of objects contributes its contents and not itself. Stringifying
 * one produced `clients: [object Object]`, which is not a value anybody can
 * copy or read.
 */
interface Leaf {
    key: string;
    value: string;
    path: string;
}

function collectLeaves(value: unknown, path: string, out: Leaf[]): void {
    if (value === null || value === undefined) return;

    if (Array.isArray(value)) {
        const scalars = value.every((v) => v === null || typeof v !== "object");
        if (scalars) {
            const key = path.slice(path.lastIndexOf(".") + 1);
            out.push({ key, value: value.map((v) => String(v)).join(", "), path });
        } else {
            for (const v of value) collectLeaves(v, path, out);
        }
        return;
    }

    if (typeof value === "object") {
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            collectLeaves(v, path ? `${path}.${k}` : k, out);
        }
        return;
    }

    const key = path.slice(path.lastIndexOf(".") + 1);
    out.push({ key, value: String(value), path });
}

const serverLeaves = computed<Leaf[]>(() => {
    if (!config.value) return [];
    const out: Leaf[] = [];
    collectLeaves(buildServerInbound(config.value), "", out);
    return out;
});

/** Name to value, for the catalogue tiles. */
const serverValues = computed(() =>
    Object.fromEntries(serverLeaves.value.map((l) => [l.key, l.value])),
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
const outGroups = computed(() => {
    if (outView.value === "server") {
        /*
         * By where the value lives in the file. A flat list of forty leaves is
         * a wall; the same forty under three headings are three short lists,
         * and the headings are the config's own structure rather than an
         * arrangement invented for the panel.
         */
        const bucket = (path: string) =>
            path.startsWith("streamSettings.sockopt")
                ? "socket"
                : path.startsWith("streamSettings")
                  ? "stream"
                  : "server";

        const order = ["server", "stream", "socket"] as const;
        return order
            .map((id) => ({
                id,
                label: t(("xg.result.group." + id) as never),
                rows: serverLeaves.value
                    .filter((l) => bucket(l.path) === id)
                    .map((l) => ({ key: l.key, value: l.value })),
            }))
            .filter((g) => g.rows.length > 0);
    }

    const uri = clientUris.value[0];
    if (!uri) return [];

    const at = uri.indexOf("?");
    const head = at === -1 ? uri : uri.slice(0, at);
    const groups = [
        {
            id: "link",
            label: t("xg.result.group.link" as never),
            rows: [{ key: "uri", value: head }],
        },
    ];

    if (at !== -1) {
        const rows: { key: string; value: string }[] = [];
        for (const pair of uri.slice(at + 1).split("&")) {
            const [k, v = ""] = pair.split("=");
            if (k) rows.push({ key: k, value: decodeURIComponent(v) });
        }
        groups.push({
            id: "query",
            label: t("xg.result.group.query" as never),
            rows,
        });
    }
    return groups;
});

/* ── History ─────────────────────────────────────────────────────────────── */

/*
 * Its own key, so the two engines never mix: a config restored into the wrong
 * generator is worse than one that was never saved.
 */
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
} = useHistory<XrayHistoryEntry>({
    engineId: "xray",
    /** Two generations are the same when the rendered server config is. */
    fingerprint: (entry) => entry.text,
    searchText: (entry) => [entry.version, entry.label1, entry.label2].join(" "),
});

const showHistory = ref(false);

function saveToHistory() {
    const cfg = config.value;
    if (!cfg) return;

    addToHistory({
        version: input.value.version,
        label1: input.value.security,
        label2: input.value.transport,
        text: serverJson.value,
        // Flattened: the panel shows a parameter list, and the config is three
        // levels deep in places.
        params: Object.fromEntries(serverLeaves.value.map((l) => [l.key, l.value])),
        cfg: JSON.parse(JSON.stringify(cfg)) as XrayConfig,
    });
}

/**
 * Put a stored config back on screen.
 *
 * The stored object is the *output*, not the input, so what can be restored is
 * the view of it. Reconstructing the settings that produced it would mean
 * inferring inputs from outputs, and the two are not in one-to-one
 * correspondence — a config carries the values, not the reasons.
 */
function restoreFromHistory(entry: GeneratorHistoryEntry) {
    const cfg = entry.cfg as XrayConfig | undefined;
    if (cfg) config.value = cfg;
    else void copy(`h:${entry.id}`, entry.text);
    showHistory.value = false;
}

function copyHistoryEntry(entry: GeneratorHistoryEntry) {
    void copy(`h:${entry.id}`, entry.text);
}

function exportHistory() {
    downloadText(
        `xray-history-${new Date().toISOString().slice(0, 10)}.json`,
        historyToJson(),
    );
}

async function importHistory(file: File) {
    historyFromJson(await file.text());
}

/** Generate, then remember. One action from the reader's side. */
function generateAndRemember() {
    build();
    saveToHistory();
}

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

            <button
                class="btn btn--ghost"
                :class="{ 'is-active': showHistory }"
                :aria-expanded="showHistory"
                @click="showHistory = !showHistory"
            >
                <HistoryIcon :size="16" />
                {{ t("gen.act.history") }}
                <span v-if="historyEntries.length" class="badge">
                    {{ historyEntries.length }}
                </span>
            </button>
        </header>

        <transition name="expand">
            <HistoryPanel
                v-if="showHistory"
                :entries="historyEntries"
                :visible="historyVisible"
                :query="historyQuery"
                :marked-key="null"
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

        <!-- ══ Setup ═══════════════════════════════════════════════════ -->
        <h2 class="gen-section">{{ t("xg.section.setup") }}</h2>

        <div class="gen-zones">
            <!--
                Our server and the donor are opposite things and were in the
                same box: the address is where the tunnel actually is, the
                donor is a site we have nothing to do with and are dressing up
                as. Putting them together invited exactly the confusion of
                thinking one had to be the other.
            -->
            <section class="zone gen-span-4">
                <div class="zone-head">
                    <Server :size="15" class="zone-icon" />
                    <span class="zone-title">{{ t("xg.zone.server") }}</span>
                </div>
                <p class="zone-note">{{ t("xg.zone.server.note") }}</p>
                <div class="zone-body xg-layers">
                    <label class="field">
                        <span class="label">{{ t("xg.field.address") }}</span>
                        <input
                            v-model="input.address"
                            class="input input--mono"
                            placeholder="203.0.113.10"
                            @change="build"
                        />
                    </label>
                    <label class="field">
                        <span class="label">{{ t("xg.field.port") }}</span>
                        <input
                            v-model.number="input.port"
                            class="input input--mono"
                            type="number"
                            min="1"
                            max="65535"
                            @change="build"
                        />
                    </label>
                </div>
            </section>

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

            <section class="zone gen-span-4">
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

            <!-- Only when REALITY is the security in play. -->
            <section v-if="input.security === 'reality'" class="zone gen-span-8">
                <div class="zone-head">
                    <Globe :size="15" class="zone-icon" />
                    <span class="zone-title">{{ t("xg.zone.donor") }}</span>
                    <span class="zone-aside">
                        <span
                            v-if="donorStatus"
                            class="badge"
                            :class="donorStatus === 'ok' ? 'badge--ok' : 'badge--bad'"
                        >
                            {{ donorLabel }}
                        </span>
                    </span>
                </div>
                <p class="zone-note">{{ t("xg.zone.donor.note") }}</p>
                <div class="zone-body xg-donor">
                    <label class="field">
                        <span class="label">dest</span>
                        <div class="inputgroup">
                            <input
                                v-model="input.dest"
                                class="input input--mono"
                                @change="build"
                            />
                            <button
                                class="btn btn--secondary btn--sm"
                                :data-tooltip="t('gen.host.check')"
                                @click="checkDonor"
                            >
                                <Search :size="14" />
                            </button>
                        </div>
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

                <!--
                    The one mistake in this section that burns a server, said
                    where it is made rather than left to the findings list.
                -->
                <div v-if="sniMismatch" class="zone-help">
                    <div class="note note--warn">
                        <TriangleAlert :size="15" class="note-icon" />
                        <span>{{ sniMismatch }}</span>
                    </div>
                </div>
            </section>

            <section class="zone gen-span-4">
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
            <section
                v-for="g in groups"
                :key="g.group"
                class="zone"
                :class="g.wide ? 'gen-span-12' : 'gen-span-6'"
            >
                <div class="zone-head">
                    <span class="zone-title">{{ g.label }}</span>
                    <span class="zone-aside">
                        <span class="badge">
                            {{ t("xg.coverage", { done: g.done, total: g.total }) }}
                        </span>
                        <button
                            class="help-btn"
                            :class="{ 'is-on': openHelp === g.group }"
                            :data-tooltip="t('gen.help.open')"
                            :aria-expanded="openHelp === g.group"
                            @click="toggleHelp(g.group)"
                        >
                            ?
                        </button>
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

                <div class="disclose" :class="{ 'is-open': openHelp === g.group }">
                    <div>
                        <div class="zone-help">
                            <div
                                v-for="h in helpFor(g.group)"
                                :key="h.key"
                                class="zone-help-item"
                            >
                                <span class="zone-help-key">{{ h.key }}</span>
                                <span>{{ h.note }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>

        <!-- ══ Actions ═════════════════════════════════════════════════ -->
        <div class="strip gen-actions">
            <button class="btn btn--primary btn--lg" @click="generateAndRemember">
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

                <div v-else-if="outDetail === 'one'" class="gen-groups">
                    <section v-for="g in outGroups" :key="g.id" class="gen-group">
                        <h3 class="gen-group-head">
                            <span class="gen-group-name">{{ g.label }}</span>
                            <span class="gen-group-rule"></span>
                            <span class="gen-group-count">{{ g.rows.length }}</span>
                        </h3>
                        <div class="gen-tiles">
                            <button
                                v-for="row in g.rows"
                                :key="g.id + row.key"
                                class="gen-tile xg-copyable"
                                :data-tooltip="t('gen.params.copyHint')"
                                @click="copyRow(g.id + row.key, row.value)"
                            >
                                <span class="gen-tile-key">{{ row.key }}</span>
                                <span class="gen-tile-val">{{ row.value }}</span>
                                <Check
                                    v-if="isCopied('r:' + g.id + row.key)"
                                    :size="13"
                                    class="xg-copy-ok"
                                />
                                <Copy v-else :size="13" class="xg-copy" />
                            </button>
                        </div>
                    </section>
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

.gen-span-12 {
    grid-column: 1 / -1;
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

/* ── Grouped result ───────────────────────────────────────────────────── */

.gen-groups {
    display: flex;
    flex-direction: column;
    gap: var(--sp-6);
    max-height: 560px;
    overflow: auto;
    padding-right: var(--sp-2);
}

/* A drawn division rather than a bolder line of text. */
.gen-group-head {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    margin: 0 0 var(--sp-3);
}

.gen-group-name {
    font-family: var(--fm);
    font-size: var(--t-2xs);
    letter-spacing: var(--track-label);
    text-transform: uppercase;
    color: var(--accent-ink);
    white-space: nowrap;
}

.gen-group-rule {
    flex: 1;
    height: var(--rule);
    background: var(--line-faint);
}

.gen-group-count {
    font-family: var(--fm);
    font-size: var(--t-2xs);
    color: var(--ink-3);
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
    .gen-span-8,
    .gen-span-12 {
        grid-column: 1 / -1;
    }
}
</style>
