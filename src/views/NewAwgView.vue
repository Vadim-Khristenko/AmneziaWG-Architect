<script setup lang="ts">
/**
 * The AmneziaWG generator, drawn rather than listed.
 *
 * A sketch at `/newawg`, beside the current page rather than replacing it, so
 * the two can be compared before anything is thrown away.
 *
 * THE IDEA
 *
 * A generator page is a form, and a form drawn as a form is a column of
 * labelled boxes that tells you nothing about what you are setting. Here each
 * group of parameters is drawn as the thing it controls:
 *
 *   the junk train    a train, cars at the widths Jmin–Jmax gave them
 *   the packet sizes  bars, to scale against each other
 *   the headers       four spans on one axis
 *   the CPS chain     the packets themselves
 *
 * The headers are the case that justifies the whole approach. The one rule
 * H1–H4 have to obey is that their ranges must not overlap, and four pairs of
 * ten-digit numbers in a list make that impossible to check by eye. On a
 * shared axis it is the only thing you can see.
 *
 * All of the logic is the existing `useGenerator`. Nothing about how a config
 * is produced changed; this is a different way of looking at it.
 */

import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
    Sparkles,
    History as HistoryIcon,
    Copy,
    Download,
    Braces,
    Activity,
    HelpCircle,
    Combine,
    Info,
    Dices,
    ChevronRight,
} from "lucide-vue-next";

import { useGenerator } from "@/composables/useGenerator";
import { AWG_VERSIONS } from "@/engines/awg/generator/versions";
import { AWG_CLIENT_PROFILES } from "@/engines/awg/generator/clients";
import { paramsFor } from "@/engines/awg/generator/params";
import type { AWGVersion } from "@/engines/awg/generator";
import { localizePath, useI18n } from "@/i18n";

const { locale, t } = useI18n();
const router = useRouter();
const at = (path: string) => localizePath(path, locale.value);

const {
    version,
    config,
    currentAwg,
    isGenerating,
    generate,
    setVersion,
    copyConfig,
    downloadConfig,
    copyJson,
    downloadJson,
    plainText,
    batchCount,
    runBatch,
    isWorkerRunning,
    isCPSSupported,
} = useGenerator();

/* ── The branding lockup doubles as engine navigation ────────────────────── */

const ENGINES = [
    { id: "awg", label: "Amnezia", to: "/newawg" },
    { id: "xray", label: "XRay", to: "/xray" },
] as const;

/* ── Versions, as revision letters ───────────────────────────────────────── */

const versions = AWG_VERSIONS.map((v) => v.id as AWGVersion);

const clients = AWG_CLIENT_PROFILES;
const releases = computed(
    () => clients.find((c) => c.id === config.clientId)?.releases ?? [],
);

/* ── The help drawers ────────────────────────────────────────────────────── */

/**
 * Which zone has its explanation open.
 *
 * One at a time: two drawers open at once turns the page into a document, and
 * the thing being explained scrolls off screen.
 *
 * The same text is on the button as a tooltip, so a pointer that rests on the
 * question mark gets the answer without a click. The tooltip layer is a single
 * fixed-position element on the body — it cannot move anything, which is why
 * the hover form is safe and the click form goes inside the zone.
 */
const openHelp = ref<string | null>(null);
const toggleHelp = (zone: string) =>
    (openHelp.value = openHelp.value === zone ? null : zone);

/** Every parameter of a group, with the note the catalogue carries for it. */
function helpFor(group: string) {
    return paramsFor(version.value)
        .filter((p) => p.group === group && p.note)
        .map((p) => ({ key: p.key, note: t(p.note as never) }));
}

/* ── The junk train ──────────────────────────────────────────────────────── */

/**
 * Cars at the sizes the train really carries.
 *
 * The generator emits a count and a range rather than the individual sizes, so
 * the drawing spreads Jc cars evenly across Jmin–Jmax. It is the shape of the
 * train, not a claim about the exact bytes of each packet.
 */
const train = computed(() => {
    const cfg = currentAwg.value;
    if (!cfg || cfg.jc <= 0) return [];
    const { jc, jmin, jmax } = cfg;
    const step = jc > 1 ? (jmax - jmin) / (jc - 1) : 0;
    return Array.from({ length: jc }, (_, i) => {
        const bytes = Math.round(jmin + step * i);
        return { bytes, width: 20 + Math.round((bytes / Math.max(jmax, 1)) * 54) };
    });
});

/* ── Packet sizes ────────────────────────────────────────────────────────── */

const sizes = computed(() => {
    const cfg = currentAwg.value;
    if (!cfg) return [];
    const rows = [
        { key: "S1", value: cfg.s1 },
        { key: "S2", value: cfg.s2 },
        { key: "S3", value: cfg.s3 },
        { key: "S4", value: cfg.s4 },
    ].filter((r) => Number.isFinite(r.value) && r.value > 0);
    const top = Math.max(...rows.map((r) => r.value), 1);
    return rows.map((r) => ({ ...r, pct: (r.value / top) * 100 }));
});

/* ── Header ranges on one axis ───────────────────────────────────────────── */

const UINT32 = 4_294_967_295;

/**
 * The four ranges, positioned truthfully and drawn legibly.
 *
 * A real range is a few thousand wide against a scale of four billion, which
 * is a hundredth of a pixel. The left edge is exact; the width has a floor, so
 * a span you can see is not a span whose width you should read.
 */
const spans = computed(() => {
    const cfg = currentAwg.value;
    if (!cfg) return [];

    const parse = (raw: string | number) => {
        const text = String(raw);
        if (text.includes("-")) {
            const [lo, hi] = text.split("-").map(Number);
            return { lo: lo ?? 0, hi: hi ?? 0 };
        }
        const n = Number(text);
        return { lo: n, hi: n };
    };

    const single = cfg.version === "1.0" || cfg.version === "1.5";
    const raw = single
        ? [cfg.h1s, cfg.h2s, cfg.h3s, cfg.h4s]
        : [cfg.h1, cfg.h2, cfg.h3, cfg.h4];

    return raw.map((value, i) => {
        const { lo, hi } = parse(value);
        return {
            key: `H${i + 1}`,
            lo,
            hi,
            left: (lo / UINT32) * 100,
            width: Math.max(((hi - lo) / UINT32) * 100, 0.5),
        };
    });
});

/** Do any two of them touch? The one rule these four values have to obey. */
const headersClash = computed(() => {
    const s = spans.value;
    for (let a = 0; a < s.length; a++) {
        for (let b = a + 1; b < s.length; b++) {
            if (s[a]!.lo <= s[b]!.hi && s[b]!.lo <= s[a]!.hi) return true;
        }
    }
    return false;
});

/* ── The CPS chain ───────────────────────────────────────────────────────── */

const chain = computed(() => {
    const cfg = currentAwg.value;
    if (!cfg) return [];
    return (["i1", "i2", "i3", "i4", "i5"] as const)
        .map((k, i) => ({ key: `I${i + 1}`, value: String(cfg[k] ?? "") }))
        .filter((r) => r.value.trim() !== "");
});

/* ── Actions ─────────────────────────────────────────────────────────────── */

const nf = new Intl.NumberFormat("ru-RU");
const hasConfig = computed(() => currentAwg.value !== null);

/*
 * A config on arrival. The zones are drawings of values, and a drawing of no
 * values is a set of empty frames — the page cannot make its argument until
 * there is something in it.
 */
onMounted(() => {
    if (!currentAwg.value) void generate();
});

function toSimulator() {
    router.push(at("/simulator"));
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
                        :class="{ 'is-on': e.id === 'awg' }"
                    >
                        {{ e.label }}<span v-if="i === 0" class="gen-slash">/</span>
                    </router-link>
                </div>
                <h1 class="gen-name">{{ t("brand.main") }}</h1>
            </div>

            <div class="gen-head-actions">
                <button class="btn btn--ghost" :data-tooltip="t('gen.act.history')">
                    <HistoryIcon :size="16" />
                    {{ t("gen.act.history") }}
                </button>
            </div>
        </header>

        <!-- ══ Version and target ══════════════════════════════════════ -->
        <section class="zone gen-target">
            <div class="zone-head">
                <span class="zone-title">{{ t("gen.zone.target") }}</span>
            </div>
            <div class="zone-body gen-target-body">
                <!--
                    Versions as revision letters: a protocol version is the
                    same object later, which is exactly what a revision is.
                -->
                <div class="gen-versions">
                    <button
                        v-for="v in versions"
                        :key="v"
                        class="rev gen-version"
                        :class="{ 'is-active': version === v }"
                        @click="setVersion(v)"
                    >
                        {{ v }}
                    </button>
                </div>

                <label class="field gen-field">
                    <span class="label">{{ t("gen.client.label") }}</span>
                    <select v-model="config.clientId" class="select">
                        <option v-for="c in clients" :key="c.id" :value="c.id">
                            {{ c.name }}
                        </option>
                    </select>
                </label>

                <label v-if="releases.length" class="field gen-field">
                    <span class="label">{{ t("client.releaseLabel") }}</span>
                    <select v-model="config.clientRelease" class="select">
                        <option :value="null">{{ t("client.releaseCurrent") }}</option>
                        <option v-for="r in releases" :key="r.id" :value="r.id">
                            {{ r.id }}
                        </option>
                    </select>
                </label>
            </div>
        </section>

        <!-- ══ The zones ═══════════════════════════════════════════════ -->
        <div class="gen-zones">
            <!-- ── The junk train ─────────────────────────────────────── -->
            <section class="zone gen-zone--wide">
                <div class="zone-head">
                    <span class="zone-title">{{ t("gen.zone.junk") }}</span>
                    <span class="zone-aside">
                        <span v-if="currentAwg" class="badge">
                            Jc {{ currentAwg.jc }}
                        </span>
                        <button
                            class="help-btn"
                            :class="{ 'is-on': openHelp === 'junk' }"
                            :data-tooltip="t('gen.help.open')"
                            :aria-expanded="openHelp === 'junk'"
                            @click="toggleHelp('junk')"
                        >
                            ?
                        </button>
                    </span>
                </div>

                <div class="zone-body">
                    <div class="train">
                        <template v-if="train.length">
                            <span
                                v-for="(car, i) in train"
                                :key="i"
                                class="train-car"
                                :style="{ width: `${car.width}px` }"
                            >
                                <span class="train-car-size">{{ car.bytes }}</span>
                            </span>
                        </template>
                        <span v-else-if="hasConfig" class="train-none">
                            {{ t("gen.junk.none") }}
                        </span>
                        <span class="train-real">{{ t("gen.junk.handshake") }}</span>
                    </div>

                    <div class="row gen-controls">
                        <div class="field gen-field">
                            <!--
                                The slider is what you asked for; the drawing is
                                what came out. They differ until you regenerate,
                                and a label that reported the request while the
                                picture showed the result said five above four
                                carriages.
                            -->
                            <span class="label">
                                {{ t("gen.junk.ask") }} — {{ config.junkLevel }}
                                <span class="hint">{{ t("gen.junk.count") }}</span>
                            </span>
                            <input
                                v-model.number="config.junkLevel"
                                class="range"
                                type="range"
                                min="0"
                                max="15"
                            />
                        </div>

                        <label class="switch">
                            <input v-model="config.routerMode" type="checkbox" />
                            <span class="switch-track"></span>
                            <span>{{ t("gen.router.title") }}</span>
                        </label>
                    </div>
                </div>

                <div class="disclose" :class="{ 'is-open': openHelp === 'junk' }">
                    <div>
                        <div class="zone-help">
                            <div
                                v-for="h in helpFor('junk')"
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

            <!-- ── Packet sizes ───────────────────────────────────────── -->
            <section class="zone">
                <div class="zone-head">
                    <span class="zone-title">{{ t("gen.zone.sizes") }}</span>
                    <span class="zone-aside">
                        <button
                            class="help-btn"
                            :class="{ 'is-on': openHelp === 'sizes' }"
                            :data-tooltip="t('gen.help.open')"
                            :aria-expanded="openHelp === 'sizes'"
                            @click="toggleHelp('sizes')"
                        >
                            ?
                        </button>
                    </span>
                </div>

                <div class="zone-body">
                    <div v-if="sizes.length" class="bars">
                        <div v-for="s in sizes" :key="s.key" class="bar">
                            <span class="bar-key">{{ s.key }}</span>
                            <span class="bar-track">
                                <span
                                    class="bar-fill"
                                    :style="{ width: `${s.pct}%` }"
                                ></span>
                            </span>
                            <span class="bar-value">{{ s.value }} B</span>
                        </div>
                    </div>
                    <div v-else class="empty">
                        <span class="empty-desc">{{ t("gen.out.empty") }}</span>
                    </div>

                    <span v-if="config.useHeaderProtection" class="note-label">
                        {{ t("gen.sizes.floor") }}
                    </span>
                </div>

                <div class="disclose" :class="{ 'is-open': openHelp === 'sizes' }">
                    <div>
                        <div class="zone-help">
                            <div
                                v-for="h in helpFor('sizes')"
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

            <!-- ── Headers on one axis ────────────────────────────────── -->
            <section class="zone gen-zone--wide">
                <div class="zone-head">
                    <span class="zone-title">{{ t("gen.zone.headers") }}</span>
                    <span class="zone-aside">
                        <span
                            v-if="spans.length"
                            class="badge"
                            :class="headersClash ? 'badge--bad' : 'badge--ok'"
                        >
                            {{ headersClash ? t("gen.headers.clash") : t("gen.headers.ok") }}
                        </span>
                        <button
                            class="help-btn"
                            :class="{ 'is-on': openHelp === 'headers' }"
                            :data-tooltip="t('gen.help.open')"
                            :aria-expanded="openHelp === 'headers'"
                            @click="toggleHelp('headers')"
                        >
                            ?
                        </button>
                    </span>
                </div>

                <div class="zone-body">
                    <p class="hint">{{ t("gen.headers.rule") }}</p>

                    <div v-if="spans.length" class="axis">
                        <template v-for="s in spans" :key="s.key">
                            <span
                                class="axis-label"
                                :style="{ left: `${Math.min(s.left, 96)}%` }"
                            >
                                {{ s.key }}
                            </span>
                            <span
                                class="axis-span"
                                :class="{ 'is-clash': headersClash }"
                                :style="{ left: `${s.left}%`, width: `${s.width}%` }"
                            ></span>
                        </template>
                        <span class="axis-end axis-end--min">0</span>
                        <span class="axis-end axis-end--max">2³² − 1</span>
                    </div>

                    <div v-if="spans.length" class="gen-spanlist">
                        <!--
                            Low on the left, high on the right, the width on
                            the line between them. The first version put the
                            name where the lower bound belongs and the lower
                            bound where the upper one does, so every range read
                            backwards.
                        -->
                        <div v-for="s in spans" :key="s.key" class="gen-spanrow">
                            <span class="rev">{{ s.key }}</span>
                            <div class="dim">
                                <span class="dim-end">{{ nf.format(s.lo) }}</span>
                                <span class="dim-line">
                                    <span class="dim-span">{{ nf.format(s.hi - s.lo) }}</span>
                                </span>
                                <span class="dim-end">{{ nf.format(s.hi) }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="disclose" :class="{ 'is-open': openHelp === 'headers' }">
                    <div>
                        <div class="zone-help">
                            <div
                                v-for="h in helpFor('headers')"
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

            <!-- ── The CPS chain ──────────────────────────────────────── -->
            <section v-if="isCPSSupported" class="zone gen-zone--wide">
                <div class="zone-head">
                    <span class="zone-title">{{ t("gen.zone.cps") }}</span>
                    <span class="zone-aside">
                        <button
                            class="help-btn"
                            :class="{ 'is-on': openHelp === 'cps' }"
                            :data-tooltip="t('gen.help.open')"
                            :aria-expanded="openHelp === 'cps'"
                            @click="toggleHelp('cps')"
                        >
                            ?
                        </button>
                    </span>
                </div>

                <div class="zone-body">
                    <div v-if="chain.length" class="chain">
                        <div v-for="c in chain" :key="c.key" class="chain-row">
                            <span class="chain-key">{{ c.key }}</span>
                            <span class="chain-val">{{ c.value }}</span>
                        </div>
                    </div>
                    <div v-else class="empty">
                        <span class="empty-desc">{{ t("gen.out.empty") }}</span>
                    </div>
                </div>

                <div class="disclose" :class="{ 'is-open': openHelp === 'cps' }">
                    <div>
                        <div class="zone-help">
                            <div
                                v-for="h in helpFor('cps')"
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

            <!-- ── AWG 3.0 ────────────────────────────────────────────── -->
            <section v-if="version === '3.0'" class="zone">
                <div class="zone-head">
                    <span class="zone-title">{{ t("gen.zone.awg3") }}</span>
                    <span class="zone-aside">
                        <button
                            class="help-btn"
                            :class="{ 'is-on': openHelp === 'awg3' }"
                            :data-tooltip="t('gen.help.open')"
                            :aria-expanded="openHelp === 'awg3'"
                            @click="toggleHelp('awg3')"
                        >
                            ?
                        </button>
                    </span>
                </div>

                <div class="zone-body">
                    <label class="switch">
                        <input v-model="config.useHeaderProtection" type="checkbox" />
                        <span class="switch-track"></span>
                        <span>HeaderProtectionKey</span>
                    </label>
                    <label class="switch">
                        <input v-model="config.useContentPadding" type="checkbox" />
                        <span class="switch-track"></span>
                        <span>ContentPaddingAddition</span>
                    </label>
                    <label class="switch">
                        <input v-model="config.useRandomTimings" type="checkbox" />
                        <span class="switch-track"></span>
                        <span>{{ t("awg3.timings.title") }}</span>
                    </label>
                </div>

                <div class="disclose" :class="{ 'is-open': openHelp === 'awg3' }">
                    <div>
                        <div class="zone-help">
                            <div
                                v-for="h in helpFor('awg3')"
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
            <div class="row">
                <button
                    class="btn btn--primary btn--lg"
                    :class="{ 'is-loading': isGenerating }"
                    @click="generate()"
                >
                    <Sparkles :size="16" />
                    {{ hasConfig ? t("gen.act.regenerate") : t("gen.act.generate") }}
                </button>

                <div class="inputgroup gen-batch">
                    <input
                        v-model.number="batchCount"
                        class="input"
                        type="number"
                        min="2"
                        max="500"
                    />
                    <button
                        class="btn btn--secondary"
                        :class="{ 'is-loading': isWorkerRunning }"
                        @click="runBatch()"
                    >
                        <Dices :size="15" />
                        {{ t("gen.act.batch") }}
                    </button>
                </div>
            </div>
        </div>

        <!-- ══ Output ══════════════════════════════════════════════════ -->
        <section class="zone">
            <div class="zone-head">
                <span class="zone-title">{{ t("gen.out.title") }}</span>
                <span class="zone-aside">
                    <span v-if="hasConfig" class="badge">{{ version }}</span>
                </span>
            </div>

            <div class="zone-body">
                <pre v-if="hasConfig" class="well gen-out">{{ plainText }}</pre>
                <div v-else class="empty">
                    <span class="empty-desc">{{ t("gen.out.empty") }}</span>
                </div>
            </div>

            <div v-if="hasConfig" class="zone-foot gen-outacts">
                <button class="btn btn--secondary btn--sm" @click="copyConfig()">
                    <Copy :size="14" /> {{ t("gen.out.copyConf") }}
                </button>
                <button class="btn btn--secondary btn--sm" @click="downloadConfig()">
                    <Download :size="14" /> {{ t("gen.out.downloadConf") }}
                </button>
                <button class="btn btn--ghost btn--sm" @click="copyJson()">
                    <Braces :size="14" /> {{ t("gen.out.copyJson") }}
                </button>
                <button class="btn btn--ghost btn--sm" @click="downloadJson()">
                    <Download :size="14" /> {{ t("gen.out.downloadJson") }}
                </button>
                <button class="btn btn--ghost btn--sm" @click="toSimulator">
                    <Activity :size="14" /> {{ t("gen.act.simulator") }}
                </button>
            </div>
        </section>

        <!-- ══ Where to go when it does not work ═══════════════════════ -->
        <section class="gen-links">
            <h2 class="note-label">{{ t("gen.links.title") }}</h2>
            <ul class="list gen-linklist">
                <li class="list-item">
                    <router-link :to="at('/faq')" class="gen-link">
                        <HelpCircle :size="16" />
                        <span>{{ t("gen.links.faq") }}</span>
                        <ChevronRight :size="15" class="gen-link-go" />
                    </router-link>
                </li>
                <li class="list-item">
                    <router-link :to="at('/mergekeys')" class="gen-link">
                        <Combine :size="16" />
                        <span>{{ t("gen.links.merge") }}</span>
                        <ChevronRight :size="15" class="gen-link-go" />
                    </router-link>
                </li>
                <li class="list-item">
                    <router-link :to="at('/about')" class="gen-link">
                        <Info :size="16" />
                        <span>{{ t("gen.links.about") }}</span>
                        <ChevronRight :size="15" class="gen-link-go" />
                    </router-link>
                </li>
            </ul>
        </section>
    </div>
</template>

<style scoped>
.gen {
    max-width: 1080px;
    margin: 0 auto;
    padding: var(--sp-7) var(--sp-gutter) var(--sp-10);
    display: flex;
    flex-direction: column;
    gap: var(--sp-6);
}

/* ── The lockup ───────────────────────────────────────────────────────── */

/*
 * The two engine names are the qualifier line of the brand and the way you
 * move between them. One control, one piece of type, and no separate tab bar
 * saying the same thing a second time.
 */
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

/* ── Target ───────────────────────────────────────────────────────────── */

.gen-target-body {
    display: grid;
    grid-template-columns: auto repeat(auto-fit, minmax(180px, 1fr));
    align-items: end;
    gap: var(--sp-4);
}

.gen-versions {
    display: flex;
    gap: var(--sp-2);
}

.gen-version {
    min-width: 46px;
    height: 34px;
    cursor: pointer;
}

.gen-field {
    min-width: 0;
}

/* ── Zones ────────────────────────────────────────────────────────────── */

/*
 * Deliberately not a two-column form. The wide zones are the ones whose
 * drawing needs room to be read — a train and an axis — and the narrow ones
 * are lists of values, so the grid follows the content rather than the other
 * way round.
 */
.gen-zones {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
    gap: var(--sp-4);
}

.gen-zone--wide {
    grid-column: 1 / -1;
}

.gen-controls {
    gap: var(--sp-5);
    align-items: flex-end;
}

.gen-controls .field {
    flex: 1 1 220px;
}

.gen-spanlist {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    margin-top: var(--sp-5);
}

.gen-spanrow {
    display: grid;
    grid-template-columns: 30px 1fr;
    align-items: center;
    gap: var(--sp-3);
}

/* ── Actions ──────────────────────────────────────────────────────────── */

.gen-actions {
    border-radius: var(--r-3);
    padding: var(--sp-4) var(--sp-5);
}

.gen-batch .input {
    width: 84px;
    text-align: center;
}

/* ── Output ───────────────────────────────────────────────────────────── */

.gen-out {
    margin: 0;
    max-height: 420px;
    overflow: auto;
    font-size: var(--t-sm);
}

.gen-outacts {
    flex-wrap: wrap;
}

/* ── Links ────────────────────────────────────────────────────────────── */

.gen-links {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
}

.gen-linklist {
    border: var(--rule) solid var(--line-soft);
    border-radius: var(--r-2);
    background: var(--ground-2);
    overflow: hidden;
}

.gen-link {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    width: 100%;
    color: var(--ink-2);
}

.gen-link:hover {
    color: var(--accent-ink);
}

.gen-link-go {
    margin-left: auto;
    color: var(--ink-3);
}

/* ── Narrow ───────────────────────────────────────────────────────────── */

@media (max-width: 820px) {
    .gen-zones {
        grid-template-columns: 1fr;
    }

    .gen-target-body {
        grid-template-columns: 1fr;
        align-items: stretch;
    }
}
</style>
