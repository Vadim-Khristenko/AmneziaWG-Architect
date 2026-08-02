<script setup lang="ts">
/**
 * The landing.
 *
 * A working drawing rather than a product page. The hero object is the packet
 * the tool actually builds — an octet ruler, the fields at the widths they
 * really have, and two of the ranges the generator really emits. It is drawn
 * from data rather than decorated, which is the whole argument the page is
 * making: this thing shows you what it did.
 *
 * What it deliberately is not: a hero metric, a row of identical feature
 * cards, an eyebrow above every section, or a stack of adjectives about
 * privacy. The two engines get unequal weight because they are unequal — one
 * works and one is half-built, and saying so is worth more than symmetry.
 */

import { computed } from "vue";
import {
    ArrowRight,
    ArrowUpRight,
    Layers,
    Network,
    ShieldCheck,
    Lock,
    Microscope,
    Combine,
    Activity,
    HelpCircle,
    Info,
} from "lucide-vue-next";
import { localizePath, useI18n } from "@/i18n";

const { locale, t } = useI18n();
const at = (path: string) => localizePath(path, locale.value);

/**
 * A QUIC Initial long header, at the byte widths RFC 9000 §17.2.2 gives it.
 * `ours` marks what the mimicry profile writes as opposed to what it copies.
 */
const PACKET = [
    { name: "Flags", bytes: 1, ours: false },
    { name: "Version", bytes: 4, ours: false },
    { name: "DCID", bytes: 8, ours: true },
    { name: "SCID", bytes: 4, ours: true },
    { name: "Token", bytes: 0, ours: false, absent: true },
    { name: "Length", bytes: 2, ours: true },
    { name: "Pkt no.", bytes: 2, ours: true },
    { name: "Payload", bytes: 27, ours: true },
];

const totalBytes = computed(() =>
    PACKET.reduce((n, f) => n + Math.max(f.bytes, 1), 0),
);

const ticks = Array.from({ length: 32 }, (_, i) => i);

/** Two real header ranges, so the dimension line has something to measure. */
const RANGES = [
    { key: "H1", lo: 404_731_556, hi: 404_774_416 },
    { key: "H2", lo: 1_917_908_238, hi: 1_917_941_084 },
];

const nf = new Intl.NumberFormat("ru-RU");

/**
 * The profiles, with the document each was built from. The citation is the
 * point: it is the difference between imitating a protocol and guessing at it.
 */
const PROFILES = [
    { name: "QUIC Initial", spec: "RFC 9000" },
    { name: "TLS ClientHello", spec: "RFC 8446" },
    { name: "DTLS", spec: "RFC 6347" },
    { name: "DNS", spec: "RFC 1035" },
    { name: "DNS-over-HTTPS", spec: "RFC 8484" },
    { name: "SIP", spec: "RFC 3261" },
    { name: "STUN", spec: "RFC 5389" },
    { name: "NTP", spec: "RFC 5905" },
];

const TRUST = [
    { icon: Lock, title: "landing.trust.local.title", desc: "landing.trust.local.desc" },
    { icon: ShieldCheck, title: "landing.trust.refuse.title", desc: "landing.trust.refuse.desc" },
    { icon: Microscope, title: "landing.trust.open.title", desc: "landing.trust.open.desc" },
] as const;

const MORE = [
    { icon: Combine, to: "/mergekeys", label: "nav.mergekeys", desc: "landing.more.mergekeys" },
    { icon: Activity, to: "/simulator", label: "nav.simulator", desc: "landing.more.simulator" },
    { icon: HelpCircle, to: "/faq", label: "nav.faq", desc: "landing.more.faq" },
    { icon: Info, to: "/about", label: "nav.about", desc: "landing.more.about" },
] as const;
</script>

<template>
    <div class="landing">
        <!-- ══ Hero: the wordmark and the drawing ═══════════════════════ -->
        <header class="landing-hero">
            <div class="landing-hero-text stagger">
                <h1 class="wordmark">
                    <span class="wordmark-pre">{{ t("brand.pre") }}</span>
                    <span class="wordmark-main">{{ t("brand.main") }}</span>
                </h1>

                <p class="lede landing-lede">{{ t("landing.lede") }}</p>

                <div class="row landing-actions">
                    <router-link :to="at('/amneziawg')" class="btn btn--primary btn--lg">
                        {{ t("landing.hero.cta") }}
                        <ArrowRight :size="16" />
                    </router-link>
                    <router-link :to="at('/about')" class="btn btn--secondary btn--lg">
                        {{ t("landing.hero.second") }}
                    </router-link>
                </div>
            </div>

            <!--
                The drawing. Not an illustration of a packet — the packet, at
                the widths its fields have, with the ranges the generator
                emits. aria-hidden because every fact in it is stated in the
                prose beside it; to a screen reader it is a diagram of nothing
                new.
            -->
            <figure class="landing-drawing sheet sheet--gridded" aria-hidden="true">
                <figcaption class="landing-drawing-head">
                    <span class="note-label">{{ t("landing.drawing") }}</span>
                    <span class="rev is-active">B</span>
                </figcaption>

                <div class="landing-drawing-body">
                    <div class="ruler draw-in">
                        <span
                            v-for="i in ticks"
                            :key="i"
                            class="ruler-tick"
                            :class="{ 'ruler-tick--major': i % 8 === 7 }"
                        >
                            <span v-if="i % 8 === 0">{{ i }}</span>
                        </span>
                    </div>

                    <div class="fieldmap draw-in">
                        <div
                            v-for="f in PACKET"
                            :key="f.name"
                            class="fieldmap-field"
                            :class="{
                                'fieldmap-field--ours': f.ours,
                                'fieldmap-field--void': f.absent,
                            }"
                            :style="{
                                /*
                                 * Grow carries the proportion and the basis is
                                 * zero. As a percentage of the row it competed
                                 * with the min-width every field needs to keep
                                 * its label, and the widest field — the payload
                                 * — came out among the narrowest.
                                 */
                                flexGrow: Math.max(f.bytes, 1),
                                flexBasis: 0,
                            }"
                        >
                            <span class="fieldmap-name">{{ f.name }}</span>
                            <span class="fieldmap-size">
                                {{ f.bytes ? `${f.bytes} B` : "—" }}
                            </span>
                        </div>
                    </div>

                    <div class="landing-dims">
                        <div v-for="r in RANGES" :key="r.key" class="landing-dimrow">
                            <span class="rev">{{ r.key }}</span>
                            <div class="dim">
                                <span class="dim-end">{{ nf.format(r.lo) }}</span>
                                <span class="dim-line">
                                    <span class="dim-span">{{ nf.format(r.hi - r.lo) }}</span>
                                </span>
                                <span class="dim-end">{{ nf.format(r.hi) }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="titleblock landing-titleblock">
                    <div class="titleblock-cell">
                        <span class="titleblock-key">{{ t("landing.sheet") }}</span>
                        <span class="titleblock-val">AWG-3.0</span>
                    </div>
                    <div class="titleblock-cell">
                        <span class="titleblock-key">{{ t("landing.scale") }}</span>
                        <span class="titleblock-val">{{ t("landing.scale.value") }}</span>
                    </div>
                    <div class="titleblock-cell">
                        <span class="titleblock-key">{{ t("landing.rev") }}</span>
                        <span class="titleblock-val">B · 2026</span>
                    </div>
                </div>
            </figure>
        </header>

        <!-- ══ The two engines ══════════════════════════════════════════ -->
        <section class="landing-section">
            <h2 class="h2">{{ t("landing.tools.title") }}</h2>
            <p class="lede">{{ t("landing.tools.lede") }}</p>

            <div class="landing-engines">
                <router-link :to="at('/amneziawg')" class="card landing-engine">
                    <span class="landing-engine-head">
                        <Layers :size="20" class="landing-engine-icon" />
                        <span class="h3">{{ t("landing.awg.name") }}</span>
                        <span class="badge badge--ok landing-engine-status">
                            {{ t("landing.awg.status") }}
                        </span>
                    </span>
                    <p class="prose">{{ t("landing.awg.desc") }}</p>
                    <span class="landing-engine-go">
                        {{ t("landing.awg.go") }}
                        <ArrowRight :size="15" class="card-go" />
                    </span>
                </router-link>

                <router-link :to="at('/xray')" class="card landing-engine landing-engine--soon">
                    <span class="landing-engine-head">
                        <Network :size="20" class="landing-engine-icon" />
                        <span class="h3">{{ t("landing.xray.name") }}</span>
                        <span class="badge landing-engine-status">
                            {{ t("landing.xray.status") }}
                        </span>
                    </span>
                    <p class="prose">{{ t("landing.xray.desc") }}</p>
                    <span class="landing-engine-go">
                        {{ t("landing.xray.go") }}
                        <ArrowRight :size="15" class="card-go" />
                    </span>
                </router-link>
            </div>
        </section>

        <!-- ══ Mimicry profiles ═════════════════════════════════════════ -->
        <section class="landing-section">
            <h2 class="h2">{{ t("landing.profiles.title") }}</h2>
            <p class="lede">{{ t("landing.profiles.lede") }}</p>

            <ul class="landing-profiles">
                <li v-for="p in PROFILES" :key="p.name" class="landing-profile">
                    <span class="landing-profile-name">{{ p.name }}</span>
                    <span class="landing-profile-spec">{{ p.spec }}</span>
                </li>
            </ul>
        </section>

        <!-- ══ Why believe it ═══════════════════════════════════════════ -->
        <section class="landing-section">
            <h2 class="h2">{{ t("landing.trust.title") }}</h2>

            <div class="landing-trust">
                <div v-for="item in TRUST" :key="item.title" class="landing-trust-item">
                    <component :is="item.icon" :size="18" class="landing-trust-icon" />
                    <div>
                        <h3 class="h3">{{ t(item.title) }}</h3>
                        <p class="prose">{{ t(item.desc) }}</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- ══ Everything else ══════════════════════════════════════════ -->
        <section class="landing-section">
            <h2 class="h2">{{ t("landing.more.title") }}</h2>

            <ul class="list landing-more">
                <li v-for="m in MORE" :key="m.to" class="landing-more-item">
                    <router-link :to="at(m.to)" class="landing-more-link">
                        <component :is="m.icon" :size="17" class="landing-more-icon" />
                        <span class="landing-more-name">{{ t(m.label) }}</span>
                        <span class="landing-more-desc">{{ t(m.desc) }}</span>
                        <ArrowUpRight :size="15" class="landing-more-go" />
                    </router-link>
                </li>
            </ul>
        </section>
    </div>
</template>

<style scoped>
.landing {
    max-width: 1080px;
    margin: 0 auto;
    padding: var(--sp-8) var(--sp-gutter) var(--sp-10);
    display: flex;
    flex-direction: column;
    gap: var(--sp-section);
}

/* ── Hero ─────────────────────────────────────────────────────────────── */

/*
 * Asymmetric on purpose: the text column is narrower than the drawing, so the
 * page opens on the object rather than on a centred block of copy. Below the
 * breakpoint they stack and the drawing keeps its place under the words.
 */
.landing-hero {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
    align-items: center;
    gap: var(--sp-8);
    padding-top: var(--sp-6);
}

.landing-hero-text {
    display: flex;
    flex-direction: column;
    gap: var(--sp-5);
}

/*
 * The lockup. "Any Tech" is a qualifier and sits at label size above the name
 * itself; ARCHITECT is the brand and takes the display scale. Two weights of
 * one family rather than two families — the contrast is size, not voice.
 */
.wordmark {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
    margin: 0;
}

.wordmark-pre {
    font-family: var(--fm);
    font-size: var(--t-xs);
    font-weight: 500;
    letter-spacing: 0.36em;
    text-transform: uppercase;
    color: var(--ink-3);
    padding-left: 0.2em;
}

.wordmark-main {
    font-family: var(--fu);
    /*
     * Not `--t-display-lg`. Nine wide letters at its 5.5rem ceiling are about
     * ninety pixels broader than the column they have to live in, and a
     * headline that runs under the figure beside it is the one typographic
     * failure that is never a matter of taste.
     */
    font-size: clamp(2.25rem, 5.6vw, 4.25rem);
    font-weight: 800;
    line-height: 0.92;
    letter-spacing: var(--track-display);
    color: var(--accent-ink);
    text-wrap: balance;
}

.landing-lede {
    font-size: var(--t-md);
}

.landing-actions {
    gap: var(--sp-3);
}

.landing-actions .btn {
    text-decoration: none;
}

/* ── The drawing ──────────────────────────────────────────────────────── */

.landing-drawing {
    margin: 0;
    overflow: hidden;
}

.landing-drawing-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-3);
    padding: var(--sp-3) var(--sp-4);
    border-bottom: var(--rule) solid var(--line-faint);
}

.landing-drawing-body {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    padding: var(--sp-5) var(--sp-4);
}

.landing-dims {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
}

.landing-dimrow {
    display: grid;
    grid-template-columns: 26px 1fr;
    align-items: center;
    gap: var(--sp-3);
}

/* The dimension label sits on the sheet, so it has to mask the sheet. */
.landing-drawing :deep(.dim-span) {
    background: var(--ground-2);
}

.landing-titleblock {
    border: none;
    border-top: var(--rule) solid var(--line-faint);
    border-radius: 0;
}

/* The second line delays behind the first, so the sheet assembles downward. */
.landing-drawing .draw-in:nth-of-type(2) {
    animation-delay: 120ms;
}

/* ── Sections ─────────────────────────────────────────────────────────── */

.landing-section {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
}

.landing-section > .lede {
    margin-bottom: var(--sp-3);
}

/* ── Engines ──────────────────────────────────────────────────────────── */

/*
 * Unequal by design. One engine works and one is half-built; giving them the
 * same weight would be the tidier layout and the less honest one.
 */
.landing-engines {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    gap: var(--sp-4);
}

.landing-engine {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
}

.landing-engine--soon {
    background: var(--ground);
}

.landing-engine-head {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--sp-3);
}

.landing-engine-icon {
    color: var(--accent-ink);
    flex-shrink: 0;
}

.landing-engine-status {
    margin-left: auto;
}

.landing-engine-go {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    margin-top: auto;
    padding-top: var(--sp-2);
    color: var(--accent-ink);
    font-size: var(--t-sm);
    font-weight: 700;
}

/* ── Profiles ─────────────────────────────────────────────────────────── */

/*
 * A specimen strip rather than eight cards: each entry is a name and the
 * document it came from, which is all there is to say about it.
 */
.landing-profiles {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: var(--rule);
    background: var(--line-faint);
    border: var(--rule) solid var(--line-soft);
    border-radius: var(--r-2);
    overflow: hidden;
}

.landing-profile {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-3);
    padding: var(--sp-3) var(--sp-4);
    background: var(--ground-2);
}

.landing-profile-name {
    font-size: var(--t-sm);
    font-weight: 700;
    color: var(--ink);
}

.landing-profile-spec {
    font-family: var(--fm);
    font-size: var(--t-2xs);
    letter-spacing: var(--track-label);
    color: var(--ink-3);
    white-space: nowrap;
}

/* ── Trust ────────────────────────────────────────────────────────────── */

.landing-trust {
    display: flex;
    flex-direction: column;
    gap: var(--sp-5);
    max-width: var(--measure);
}

.landing-trust-item {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--sp-4);
}

.landing-trust-icon {
    margin-top: 3px;
    color: var(--accent-ink);
}

.landing-trust-item h3 {
    margin-bottom: var(--sp-2);
}

/* ── More ─────────────────────────────────────────────────────────────── */

.landing-more {
    border: var(--rule) solid var(--line-soft);
    border-radius: var(--r-2);
    overflow: hidden;
}

.landing-more-item {
    border-bottom: var(--rule) solid var(--line-faint);
}

.landing-more-item:last-child {
    border-bottom: none;
}

.landing-more-link {
    display: grid;
    grid-template-columns: auto minmax(120px, max-content) 1fr auto;
    align-items: center;
    gap: var(--sp-4);
    padding: var(--sp-4);
    color: inherit;
    text-decoration: none;
    transition: background-color var(--trans-fast);
}

.landing-more-link:hover {
    background: var(--surface);
}

.landing-more-icon {
    color: var(--ink-3);
}

.landing-more-name {
    font-weight: 700;
    color: var(--ink);
}

.landing-more-desc {
    font-size: var(--t-sm);
    color: var(--ink-3);
    text-wrap: pretty;
}

.landing-more-go {
    color: var(--ink-3);
    transition: transform var(--trans-fast);
}

.landing-more-link:hover .landing-more-go {
    transform: translate(2px, -2px);
    color: var(--accent-ink);
}

/* ── Narrow ───────────────────────────────────────────────────────────── */

@media (max-width: 900px) {
    .landing-hero {
        grid-template-columns: 1fr;
        gap: var(--sp-6);
    }

    .landing-engines {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 620px) {
    .landing-actions .btn {
        flex: 1 1 100%;
    }

    /* The description drops out rather than squeezing the name to two lines. */
    .landing-more-link {
        grid-template-columns: auto 1fr auto;
    }

    .landing-more-desc {
        display: none;
    }
}
</style>
