<script setup lang="ts">
import { ref, computed, type Component } from "vue";
import {
    Info,
    HelpCircle,
    Server,
    Combine,
    Lock,
    CheckCircle,
    Zap,
    Code,
    Shield,
    Cpu,
    EyeOff,
    ArrowRight,
    GitMerge,
    ShieldCheck,
    Heart,
    Coffee,
    Github,
    MessageCircle,
    Sparkles,
    History,
    Rocket,
    Eye,
    Globe,
    Bug,
    Users,
    FileCode,
    Layers,
    ChevronDown,
    ExternalLink,
    Paintbrush,
    Wrench,
    Star,
    Terminal,
    CircleDot,
    TriangleAlert,
} from "lucide-vue-next";
import SupportSection from "@/components/SupportSection.vue";
import { localizePath, useI18n, pick } from "@/i18n";
import { TIMELINE } from "@/data/changelog";
import RichText from "@/components/RichText";

const { locale, t } = useI18n();

const activeTimeline = ref<number | null>(null);
const avatarFailed = ref(false);
const avatarUrl = `${import.meta.env.BASE_URL}assets/avatar.jpg`;

function toggleTimeline(idx: number) {
    activeTimeline.value = activeTimeline.value === idx ? null : idx;
}

/** Icon name → component, so the changelog data stays serialisable. */
const TIMELINE_ICONS: Record<string, Component> = {
    Rocket, Bug, Code, Wrench, GitMerge, Eye, Paintbrush,
    Sparkles, Layers, Globe, Star, Cpu, ShieldCheck,
};

const timelineEvents = computed(() =>
    TIMELINE.map((e) => ({
        version: e.version,
        date: pick(e.date, locale.value),
        title: pick(e.title, locale.value),
        desc: pick(e.desc, locale.value),
        icon: TIMELINE_ICONS[e.icon] ?? Sparkles,
        color: e.color,
    })),
);

const statCards = computed(() => [
    { label: t("about.stat.profiles"), value: "11", icon: Eye },
    { label: t("about.stat.params"), value: "20+", icon: FileCode },
    { label: t("about.stat.tests"), value: "300+", icon: Terminal },
    { label: t("about.stat.clients"), value: "10", icon: ShieldCheck },
]);
</script>

<template>
    <div class="about-wrap">
        <!-- ── Hero ────────────────────────────────────────────────────── -->
        <header class="about-hero stagger-1">
            <div class="hero-badge badge badge-amber badge-glow">
                <Info :size="12" /> {{ t("about.badge") }}
            </div>
            <h1 class="hero-title">
                <span class="hero-line-1">AmneziaWG</span>
                <span class="hero-line-2">Architect</span>
            </h1>
            <p class="hero-subtitle">
                {{ t("about.subtitle.1") }}<br />
                <b>{{ t("about.subtitle.2") }}</b><br />
                <i>{{ t("about.subtitle.3") }}</i>
            </p>
        </header>

        <!-- ── Legal Disclaimer ─────────────────────────────────────────── -->
        <section class="about-section legal-section stagger-0">
            <div class="legal-card">
                <div class="legal-icon">
                    <Shield :size="28" />
                </div>
                <h2><TriangleAlert :size="18" /> {{ t("about.legal.title") }}</h2>
                <div class="legal-content">
                    <p class="legal-warning">
                        <strong>{{ t("about.legal.warning") }}</strong>
                    </p>
                    <p>
                        {{ t("about.legal.scope") }}
                    </p>
                    <div class="legal-allowed">
                        <p><strong>{{ t("about.legal.allowedTitle") }}</strong></p>
                        <ul>
                            <li>{{ t("about.legal.allowed.1") }}</li>
                            <li>{{ t("about.legal.allowed.2") }}</li>
                            <li>{{ t("about.legal.allowed.3") }}</li>
                            <li>{{ t("about.legal.allowed.4") }}</li>
                        </ul>
                    </div>
                    <p class="legal-disclaimer">
                        {{ t("about.legal.disclaimer") }}
                    </p>
                </div>
            </div>
        </section>

        <!-- ── Stats Strip ─────────────────────────────────────────────── -->
        <div class="stats-strip stagger-2">
            <div v-for="(s, i) in statCards" :key="i" class="stat-card">
                <component :is="s.icon" :size="18" class="stat-icon" />
                <span class="stat-value">{{ s.value }}</span>
                <span class="stat-label">{{ s.label }}</span>
            </div>
        </div>

        <!-- ── What is this? ───────────────────────────────────────────── -->
        <section class="about-section stagger-3">
            <div class="section-icon-wrap">
                <Sparkles :size="22" />
            </div>
            <h2>{{ t("about.what.title") }}</h2>
            <p>{{ t("about.what.p1") }}</p>
            <p>{{ t("about.what.p2") }}</p>
            <div class="feature-grid">
                <div class="feature-card">
                    <CheckCircle :size="18" class="feature-card-icon" />
                    <div>
                        <b>{{ t("about.feature.profiles.title") }}</b>
                        <span>{{ t("about.feature.profiles.desc") }}</span>
                    </div>
                </div>
                <div class="feature-card">
                    <Zap :size="18" class="feature-card-icon" />
                    <div>
                        <b>{{ t("about.feature.smart.title") }}</b>
                        <span>{{ t("about.feature.smart.desc") }}</span>
                    </div>
                </div>
                <div class="feature-card">
                    <ShieldCheck :size="18" class="feature-card-icon" />
                    <div>
                        <b>{{ t("about.feature.check.title") }}</b>
                        <span>{{ t("about.feature.check.desc") }}</span>
                    </div>
                </div>
                <div class="feature-card">
                    <Code :size="18" class="feature-card-icon" />
                    <div>
                        <b>{{ t("about.feature.advanced.title") }}</b>
                        <span>{{ t("about.feature.advanced.desc") }}</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- ── Evolution Timeline ──────────────────────────────────────── -->
        <section class="about-section timeline-section stagger-4">
            <div class="section-icon-wrap">
                <History :size="22" />
            </div>
            <h2>{{ t("about.timeline.title") }}</h2>
            <p>
                {{ t("about.timeline.lede") }}
            </p>

            <div class="timeline">
                <div
                    v-for="(ev, idx) in timelineEvents"
                    :key="idx"
                    class="timeline-item"
                    :class="{ 'is-open': activeTimeline === idx }"
                    :style="{ animationDelay: `${idx * 80 + 200}ms` }"
                >
                    <div class="timeline-dot" :class="`timeline-dot-${ev.color}`">
                        <component :is="ev.icon" :size="14" />
                    </div>
                    <div class="timeline-content" @click="toggleTimeline(idx)">
                        <div class="timeline-head">
                            <span class="timeline-version">v{{ ev.version }}</span>
                            <span class="timeline-date">{{ ev.date }}</span>
                            <span class="timeline-title">{{ ev.title }}</span>
                            <ChevronDown
                                :size="14"
                                class="timeline-arrow"
                                :class="{ rotated: activeTimeline === idx }"
                            />
                        </div>
                        <transition name="expand">
                            <div v-if="activeTimeline === idx" class="timeline-body">
                                <RichText :text="ev.desc" />
                            </div>
                        </transition>
                    </div>
                </div>
            </div>
        </section>

        <!-- ── MergeKeys ───────────────────────────────────────────────── -->
        <section class="about-section stagger-5">
            <div class="section-icon-wrap section-icon-green">
                <Combine :size="22" />
            </div>
            <h2>{{ t("about.mergekeys.title") }}</h2>
            <p>
                {{ t("about.mergekeys.lede") }}
            </p>
            <div class="feature-grid">
                <div class="feature-card">
                    <Zap :size="18" class="feature-card-icon" />
                    <div>
                        <b>{{ t("about.mergekeys.update.title") }}</b>
                        <span>{{ t("about.mergekeys.update.desc") }}</span>
                    </div>
                </div>
                <div class="feature-card">
                    <GitMerge :size="18" class="feature-card-icon" />
                    <div>
                        <b>{{ t("about.mergekeys.merge.title") }}</b>
                        <span>{{ t("about.mergekeys.merge.desc") }}</span>
                    </div>
                </div>
            </div>
            <div class="cta-row">
                <router-link
                    :to="localizePath('/mergekeys', locale)"
                    class="cta-btn cta-primary"
                >
                    <ArrowRight :size="14" />
                    {{ t("about.mergekeys.goto") }}
                </router-link>
                <router-link
                    :to="{ path: '/mergekeys', query: { tab: 'merge' } }"
                    class="cta-btn cta-secondary"
                >
                    <GitMerge :size="14" />
                    {{ t("about.mergekeys.combine") }}
                </router-link>
            </div>
        </section>

        <!-- ── Privacy Manifesto ───────────────────────────────────────── -->
        <section class="about-section privacy-section stagger-6">
            <div class="section-icon-wrap section-icon-green">
                <Lock :size="22" />
            </div>
            <h2>{{ t("about.privacy.title") }}</h2>
            <p class="privacy-manifesto">
                <b>{{ t("about.privacy.lede.bold") }}</b>
                {{ t("about.privacy.lede") }}
            </p>

            <div class="privacy-grid">
                <div class="privacy-card">
                    <div class="priv-icon-wrap">
                        <Cpu :size="24" />
                    </div>
                    <h3>{{ t("about.privacy.local.title") }}</h3>
                    <p>
                        {{ t("about.privacy.local.desc") }}
                    </p>
                </div>
                <div class="privacy-card">
                    <div class="priv-icon-wrap">
                        <EyeOff :size="24" />
                    </div>
                    <h3>{{ t("about.privacy.notrack.title") }}</h3>
                    <p>
                        {{ t("about.privacy.notrack.desc") }}
                    </p>
                </div>
                <div class="privacy-card">
                    <div class="priv-icon-wrap">
                        <Globe :size="24" />
                    </div>
                    <h3>{{ t("about.privacy.offline.title") }}</h3>
                    <p>
                        {{ t("about.privacy.offline.desc") }}
                    </p>
                </div>
                <div class="privacy-card">
                    <div class="priv-icon-wrap">
                        <FileCode :size="24" />
                    </div>
                    <h3>{{ t("about.privacy.oss.title") }}</h3>
                    <p>
                        {{ t("about.privacy.oss.desc") }}
                    </p>
                </div>
            </div>
        </section>

        <!-- ── Open Source ──────────────────────────────────────────────── -->
        <section class="about-section stagger-7">
            <div class="section-icon-wrap">
                <FileCode :size="22" />
            </div>
            <h2>{{ t("about.opensource.title") }}</h2>
            <p>
                {{ t("about.oss.lede") }}
            </p>
            <div class="feature-grid">
                <div class="feature-card">
                    <Github :size="18" class="feature-card-icon" />
                    <div>
                        <b>GitHub</b>
                        <span
                            >{{ t("about.oss.stack.desc") }}</span
                        >
                    </div>
                </div>
                <div class="feature-card">
                    <Shield :size="18" class="feature-card-icon" />
                    <div>
                        <b>{{ t("about.oss.audit.title") }}</b>
                        <span>{{ t("about.oss.audit.desc") }}</span>
                    </div>
                </div>
            </div>
            <div class="cta-row">
                <a
                    href="https://github.com/Vadim-Khristenko/AmneziaWG-Architect"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="cta-btn cta-secondary"
                >
                    <Github :size="14" />
                    {{ t("about.oss.github") }}
                    <ExternalLink :size="12" />
                </a>
            </div>
        </section>

        <!-- ── Developer & Contact ─────────────────────────────────────── -->
        <section class="about-section dev-section stagger-8">
            <div class="section-icon-wrap section-icon-blue">
                <Users :size="22" />
            </div>
            <h2>{{ t("about.dev.title") }}</h2>

            <div class="dev-card">
                <div class="dev-avatar">
                    <img
                        v-if="!avatarFailed"
                        :src="avatarUrl"
                        alt="Developer Avatar"
                        class="dev-avatar-image"
                        @error="avatarFailed = true"
                    />
                    <span v-else class="dev-avatar-letter">V</span>
                </div>
                <div class="dev-info">
                    <h3>{{ t("about.dev.solo.title") }}</h3>
                    <p>
                        {{ t("about.dev.solo.desc") }}
                    </p>
                    <div class="dev-badges">
                        <span class="dev-badge">Vue 3</span>
                        <span class="dev-badge">TypeScript</span>
                        <span class="dev-badge">Vite</span>
                        <span class="dev-badge">AmneziaWG</span>
                    </div>
                </div>
            </div>

            <div class="contact-card">
                <Bug :size="18" class="feature-card-icon" />
                <div>
                    <b>{{ t("about.dev.feedback.title") }}</b>
                    <p>{{ t("about.dev.feedback.desc") }}</p>
                    <p class="contact-note">
                        <MessageCircle :size="13" />
                        {{ t("about.dev.noDm") }}
                    </p>
                </div>
            </div>
        </section>

        <!-- ── Support / Donation ──────────────────────────────────────── -->
        <SupportSection class="stagger-9" />
    </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════════
   AboutView — Redesigned v2
   ═══════════════════════════════════════════════════════════════════════════ */

.about-wrap {
    position: relative;
    z-index: 10;
    flex: 1;
    max-width: 920px;
    margin: 0 auto;
    padding: 50px 20px 40px;
    display: flex;
    flex-direction: column;
    gap: 28px;
}

/* ── Hero ──────────────────────────────────────────────────────────────── */
.about-hero {
    text-align: center;
    padding: 20px 0 10px;
}

.hero-badge {
    position: relative;
    margin-bottom: 1rem;
}

/* Composited opacity pulse (see HomeView for rationale). */
/* Shared: see `.badge-glow` in main.css. */



@media (prefers-reduced-motion: reduce) {
    .hero-badge::after {
        animation: none;
    }
}

.hero-title {
    font-size: clamp(2rem, 5vw, 3.2rem);
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: -0.03em;
    margin-bottom: 1rem;
}

.hero-line-1 {
    display: block;
    color: var(--text);
}

/* Solid, for the reason given on HomeView's `.hero-accent`. */
.hero-line-2 {
    display: block;
    color: var(--accent-ink);
}

.hero-subtitle {
    max-width: 520px;
    margin: 0 auto;
    font-size: 0.95rem;
    color: var(--text2);
    line-height: 1.7;
}


/* ── Stats Strip ──────────────────────────────────────────────────────── */
.stats-strip {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
}

.stat-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 18px 10px;
    background: var(--bg2);
    border: 1px solid var(--border2);
    border-radius: var(--radius-lg);
    transition: all 0.3s var(--ease);
}

.stat-card:hover {
    border-color: var(--border);
    transform: translateY(-3px);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
}

.stat-icon {
    color: var(--accent-ink);
    opacity: 0.8;
}

.stat-value {
    font-family: var(--fm);
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--accent-ink);
    line-height: 1;
}

.stat-label {
    font-size: 0.65rem;
    color: var(--text3);
    text-align: center;
    line-height: 1.3;
    font-family: var(--fu);
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

/* ── Section (shared) ─────────────────────────────────────────────────── */
.about-section {
    background: var(--bg2);
    border: 1px solid var(--border2);
    border-radius: var(--radius-xl);
    padding: 36px 36px 32px;
    position: relative;
    overflow: hidden;
    transition: all 0.4s var(--ease);
}

.about-section::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
        90deg,
        transparent 0%,
        rgb(var(--accent-rgb) / 0.08) 50%,
        transparent 100%
    );
    pointer-events: none;
}

.about-section:hover {
    border-color: var(--border);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.section-icon-wrap {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgb(var(--accent-rgb) / 0.08);
    border: 1px solid rgb(var(--accent-rgb) / 0.12);
    border-radius: var(--radius);
    color: var(--accent-ink);
    margin-bottom: 18px;
    transition: transform 0.3s var(--ease);
}

.about-section:hover .section-icon-wrap {
    transform: scale(1.08) rotate(-3deg);
}

.section-icon-green {
    background: rgba(92, 184, 122, 0.08);
    border-color: rgba(92, 184, 122, 0.12);
    color: var(--green);
}

.section-icon-blue {
    background: rgba(91, 155, 213, 0.08);
    border-color: rgba(91, 155, 213, 0.12);
    color: var(--blue);
}

.about-section h2 {
    font-family: var(--fu);
    font-size: 1.3rem;
    font-weight: 800;
    margin-bottom: 16px;
    color: var(--text);
    line-height: 1.3;
}

.about-section p {
    font-size: 0.95rem;
    color: var(--text2);
    line-height: 1.75;
    margin-bottom: 16px;
}

.about-section p:last-child {
    margin-bottom: 0;
}


.about-section code {
    background: rgb(var(--accent-rgb) / 0.08);
    border: 1px solid rgb(var(--accent-rgb) / 0.12);
    border-radius: 6px;
    padding: 2px 7px;
    font-family: var(--fm);
    font-size: 0.85em;
    color: var(--accent-ink-lift);
}

/* ── Feature Grid ─────────────────────────────────────────────────────── */
.feature-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 20px;
}

.feature-card {
    display: flex;
    gap: 14px;
    padding: 16px;
    background: var(--bg3);
    border: 1px solid var(--border3);
    border-radius: var(--radius);
    transition: all 0.25s var(--ease);
    cursor: default;
}

.feature-card:hover {
    border-color: var(--border);
    background: var(--surface);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.feature-card-icon {
    color: var(--accent-ink);
    flex-shrink: 0;
    margin-top: 2px;
}

.feature-card div {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.feature-card b {
    color: var(--text);
    font-size: 0.88rem;
}

.feature-card span {
    color: var(--text2);
    font-size: 0.82rem;
    line-height: 1.5;
}

/* ── Timeline ─────────────────────────────────────────────────────────── */
.timeline {
    position: relative;
    margin-top: 24px;
    padding-left: 40px;
}

.timeline-item {
    position: relative;
    margin-bottom: 12px;
    animation: tlFadeIn 0.4s var(--ease-snap) both;
}

/* Соединительная линия МЕЖДУ точками (не через них) */
.timeline-item::before {
    content: "";
    position: absolute;
    left: -27px;
    top: 42px; /* ниже точки */
    bottom: -12px; /* до следующего элемента */
    width: 2px;
    background: linear-gradient(
        180deg,
        rgb(var(--accent-rgb) / 0.3) 0%,
        rgb(var(--accent-rgb) / 0.08) 100%
    );
    border-radius: 2px;
}

/* Последний элемент — без линии вниз */
.timeline-item:last-child::before {
    display: none;
}

@keyframes tlFadeIn {
    0% {
        opacity: 0;
        transform: translateX(-10px);
    }
    100% {
        opacity: 1;
        transform: translateX(0);
    }
}

.timeline-dot {
    position: absolute;
    left: -40px;
    top: 12px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    transition: all 0.3s var(--ease);
    background: var(--surface);
    border: 1px solid var(--border2);
    color: var(--text3);
}

/*
 * Every changelog entry carries a colour, and until now none of them showed:
 * the template builds `timeline-dot-${ev.color}` and no rule of that name has
 * ever existed, so all thirty dots rendered identically and the field was
 * decoration in the data file. Three releases, three meanings — a feature, a
 * fix, a removal.
 */
.timeline-dot-amber {
    background: rgb(var(--accent-rgb) / 0.14);
    border-color: rgb(var(--accent-rgb) / 0.35);
    color: var(--accent-ink);
}

.timeline-dot-green {
    background: var(--green-bg);
    border-color: var(--gd);
    color: var(--green);
}

.timeline-dot-red {
    background: var(--red-bg);
    border-color: var(--rd);
    color: var(--red);
}

.timeline-item.is-open .timeline-dot {
    transform: scale(1.15);
    box-shadow: 0 0 14px rgb(var(--accent-rgb) / 0.25);
}

.timeline-content {
    background: var(--bg3);
    border: 1px solid var(--border3);
    border-radius: var(--radius);
    overflow: hidden;
    cursor: pointer;
    transition: all 0.25s var(--ease);
}

.timeline-content:hover {
    border-color: var(--border);
}

.timeline-item.is-open .timeline-content {
    border-color: rgb(var(--accent-rgb) / 0.25);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.timeline-head {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
}

.timeline-version {
    font-family: var(--fm);
    font-size: 0.7rem;
    font-weight: 800;
    padding: 2px 8px;
    background: rgb(var(--accent-rgb) / 0.1);
    color: var(--accent-ink);
    border-radius: 100px;
    border: 1px solid rgb(var(--accent-rgb) / 0.15);
    flex-shrink: 0;
}

.timeline-date {
    font-size: 0.7rem;
    color: var(--text3);
    font-family: var(--fm);
    flex-shrink: 0;
}

.timeline-title {
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text);
    flex: 1;
}

.timeline-arrow {
    color: var(--text3);
    transition: transform 0.25s var(--ease);
    flex-shrink: 0;
}

.timeline-arrow.rotated {
    transform: rotate(180deg);
}

.timeline-body {
    padding: 0 16px 14px;
}

.timeline-body p {
    font-size: 0.85rem;
    line-height: 1.65;
    margin: 0 0 10px;
}

.timeline-body p:last-child {
    margin-bottom: 0;
}

.timeline-body h2,
.timeline-body h3 {
    margin: 14px 0 6px;
    font-size: 0.83rem;
    font-weight: 650;
    color: var(--text);
}

.timeline-body h2:first-child,
.timeline-body h3:first-child {
    margin-top: 0;
}

.timeline-body strong {
    color: var(--text);
    font-weight: 650;
}

/* The italic alone carries the demotion — dimming it too would drop this
   below the contrast floor. */
.timeline-body em {
    font-style: italic;
}

.timeline-body code {
    font-family: var(--fm);
    font-size: 0.86em;
    padding: 1px 5px;
    border-radius: 4px;
    background: var(--bg3);
    color: var(--accent-ink);
    white-space: nowrap;
}

.timeline-body a {
    color: var(--accent-ink);
    text-decoration: underline;
    text-underline-offset: 2px;
}

/* ── Privacy Grid ─────────────────────────────────────────────────────── */
.privacy-manifesto {
    font-size: 0.95rem;
    line-height: 1.75;
    color: var(--text);
    margin-top: 8px;
    margin-bottom: 8px;
    padding: 18px 20px;
    background: rgba(92, 184, 122, 0.06);
    border: 1px solid rgba(92, 184, 122, 0.12);
    border-radius: var(--radius-lg);
}

.privacy-manifesto b {
    color: var(--green);
}

.privacy-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
    margin-top: 20px;
}

.privacy-card {
    padding: 24px 20px;
    background: var(--bg3);
    border: 1px solid var(--border3);
    border-radius: var(--radius-lg);
    text-align: center;
    transition: all 0.3s var(--ease);
}

.privacy-card:hover {
    border-color: var(--border);
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.priv-icon-wrap {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(92, 184, 122, 0.08);
    border: 1px solid rgba(92, 184, 122, 0.12);
    border-radius: 50%;
    color: var(--green);
    margin: 0 auto 14px;
    transition: transform 0.3s var(--ease);
}

.privacy-card:hover .priv-icon-wrap {
    transform: scale(1.1) rotate(-5deg);
}

.privacy-card h3 {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 8px;
}

.privacy-card p {
    font-size: 0.82rem;
    color: var(--text2);
    line-height: 1.6;
    margin: 0;
}

/* ── Developer Section ────────────────────────────────────────────────── */
.dev-card {
    display: flex;
    gap: 20px;
    padding: 24px;
    background: var(--bg3);
    border: 1px solid var(--border3);
    border-radius: var(--radius-lg);
    margin-bottom: 16px;
    transition: all 0.3s var(--ease);
}

.dev-card:hover {
    border-color: var(--border);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.dev-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(
        135deg,
        var(--amber) 0%,
        var(--amber-deep) 100%
    );
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.4s var(--ease);
    box-shadow:
        0 0 0 3px var(--bg2),
        0 0 0 5px rgb(var(--accent-rgb) / 0.25);
    position: relative;
}

.dev-card:hover .dev-avatar {
    transform: rotate(-6deg) scale(1.08);
    box-shadow:
        0 0 0 3px var(--bg2),
        0 0 0 5px rgb(var(--accent-rgb) / 0.4),
        0 0 20px rgb(var(--accent-rgb) / 0.15);
}

.dev-avatar-image {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    object-fit: cover;
    display: block;
    transition: filter 0.3s var(--ease);
}

.dev-card:hover .dev-avatar-image {
    filter: brightness(1.08);
}

.dev-info {
    flex: 1;
    min-width: 0;
}

.dev-info h3 {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 6px;
}

.dev-info p {
    font-size: 0.88rem;
    line-height: 1.6;
    margin-bottom: 12px;
}

.dev-badges {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.dev-badge {
    font-size: 0.62rem;
    font-family: var(--fm);
    font-weight: 700;
    padding: 3px 10px;
    background: rgb(var(--accent-rgb) / 0.08);
    color: var(--accent-ink-lift);
    border: 1px solid rgb(var(--accent-rgb) / 0.12);
    border-radius: 100px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.contact-card {
    display: flex;
    gap: 14px;
    padding: 18px 20px;
    background: var(--bg3);
    border: 1px solid var(--border3);
    border-radius: var(--radius);
    transition: all 0.25s var(--ease);
}

.contact-card:hover {
    border-color: var(--border);
}

.contact-card div {
    flex: 1;
}

.contact-card b {
    color: var(--text);
    font-size: 0.9rem;
    display: block;
    margin-bottom: 6px;
}

.contact-card p {
    font-size: 0.85rem;
    line-height: 1.6;
    margin-bottom: 8px;
}

.contact-card p:last-child {
    margin-bottom: 0;
}

.contact-note {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem !important;
    color: var(--text3) !important;
    font-style: italic;
}

/* ── Legal Disclaimer Section ─────────────────────────────────────────── */
.legal-section {
    border-color: rgba(239, 68, 68, 0.15);
    background: linear-gradient(
        135deg,
        rgba(239, 68, 68, 0.02) 0%,
        var(--bg2) 50%,
        rgba(239, 68, 68, 0.02) 100%
    );
}

.legal-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 16px;
}

.legal-icon {
    position: relative;
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.15);
    border-radius: 50%;
    color: #ef4444;
}

/* Reuses the shared opacity-only `badgePulse` keyframe; colour stays here on
   the static shadow so the animation itself never touches the main thread. */
.legal-icon::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: 0 0 20px 4px rgba(239, 68, 68, 0.1);
    opacity: 0;
    pointer-events: none;
    animation: badgePulse 3s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
    .legal-icon::after {
        animation: none;
    }
}

.legal-section h2 {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text);
    margin: 0;
}

.legal-content {
    text-align: left;
    max-width: 600px;
}

.legal-warning {
    font-size: 0.95rem;
    color: #fca5a5;
    font-weight: 600;
    margin-bottom: 12px;
    padding: 12px;
    background: rgba(239, 68, 68, 0.05);
    border-left: 3px solid #ef4444;
    border-radius: 0 var(--radius) var(--radius) 0;
}

.legal-content p {
    font-size: 0.88rem;
    color: var(--text2);
    line-height: 1.7;
    margin-bottom: 12px;
}

.legal-allowed {
    padding: 14px 16px;
    background: rgba(34, 197, 94, 0.03);
    border: 1px solid rgba(34, 197, 94, 0.1);
    border-radius: var(--radius);
    margin: 14px 0;
}

.legal-allowed p {
    font-weight: 600;
    color: var(--text);
    margin-bottom: 8px;
}

.legal-allowed ul {
    margin: 0;
    padding-left: 20px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 16px;
}

.legal-allowed li {
    font-size: 0.82rem;
    color: var(--text2);
    line-height: 1.5;
}

.legal-disclaimer {
    font-size: 0.8rem;
    color: var(--text3);
    font-style: italic;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px dashed var(--border);
}

/* ── Donation Section ─────────────────────────────────────────────────── */












.donation-thanks :deep(svg) {
    color: var(--accent-ink);
}

/* ── CTA Buttons ──────────────────────────────────────────────────────── */
.cta-row {
    margin-top: 20px;
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
}

.cta-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 20px;
    border-radius: var(--radius);
    font-family: var(--fu);
    font-size: 0.78rem;
    font-weight: 800;
    text-decoration: none;
    transition: all 0.3s var(--ease);
    white-space: nowrap;
    cursor: pointer;
    border: none;
}

.cta-primary {
    background: linear-gradient(
        135deg,
        var(--amber) 0%,
        var(--amber-deep) 100%
    );
    color: var(--on-accent);
}

.cta-primary:hover {
    filter: brightness(1.12);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgb(var(--accent-rgb) / 0.25);
}

.cta-secondary {
    background: rgb(var(--accent-rgb) / 0.08);
    border: 1px solid rgb(var(--accent-rgb) / 0.2);
    color: var(--accent-ink-lift);
}

.cta-secondary:hover {
    background: rgb(var(--accent-rgb) / 0.14);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

/* ── Stagger Animations ───────────────────────────────────────────────── */
.stagger-1 {
    animation: fadeSlideUp 0.5s var(--ease-snap) 0.05s both;
}
.stagger-2 {
    animation: fadeSlideUp 0.5s var(--ease-snap) 0.1s both;
}
.stagger-3 {
    animation: fadeSlideUp 0.5s var(--ease-snap) 0.15s both;
}
.stagger-4 {
    animation: fadeSlideUp 0.5s var(--ease-snap) 0.2s both;
}
.stagger-5 {
    animation: fadeSlideUp 0.5s var(--ease-snap) 0.25s both;
}
.stagger-6 {
    animation: fadeSlideUp 0.5s var(--ease-snap) 0.3s both;
}
.stagger-7 {
    animation: fadeSlideUp 0.5s var(--ease-snap) 0.35s both;
}
.stagger-8 {
    animation: fadeSlideUp 0.5s var(--ease-snap) 0.4s both;
}
.stagger-9 {
    animation: fadeSlideUp 0.5s var(--ease-snap) 0.45s both;
}

@keyframes fadeSlideUp {
    0% {
        opacity: 0;
        transform: translateY(20px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

/* ── Responsive ───────────────────────────────────────────────────────── */
@media (max-width: 768px) {
    .about-wrap {
        padding-top: 30px;
        gap: 20px;
    }

    .about-section {
        padding: 24px 20px;
    }

    .stats-strip {
        grid-template-columns: repeat(2, 1fr);
    }

    .feature-grid {
        grid-template-columns: 1fr;
    }

    .privacy-grid {
        grid-template-columns: 1fr;
    }

    .dev-card {
        flex-direction: column;
        align-items: center;
        text-align: center;
    }

    .dev-badges {
        justify-content: center;
    }

    .about-section h2 {
        font-size: 1.1rem;
    }

    .cta-btn {
        width: 100%;
        justify-content: center;
    }

    .cta-row {
        flex-direction: column;
    }

    .timeline {
        padding-left: 34px;
    }

    .timeline-dot {
        left: -34px;
        width: 24px;
        height: 24px;
    }

    .timeline-item::before {
        left: -23px;
    }

    .timeline-head {
        flex-wrap: wrap;
        gap: 6px;
    }

    .timeline-title {
        flex-basis: 100%;
        font-size: 0.82rem;
    }

    .donation-section {
        padding: 32px 20px;
    }
}

@media (max-width: 480px) {
    .hero-title {
        font-size: 1.8rem;
    }

    .stats-strip {
        grid-template-columns: 1fr 1fr;
        gap: 8px;
    }

    .stat-card {
        padding: 14px 8px;
    }

    .stat-value {
        font-size: 1.1rem;
    }

    .contact-card {
        flex-direction: column;
    }
}

/* ── Transition helpers (used by <transition name="expand">) ──────────── */
</style>
