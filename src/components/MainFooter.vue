<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
    Github,
    GitBranch,
    User,
    Send,
    Shield,
    Heart,
    ChevronRight,
    Lock,
} from "lucide-vue-next";

import { computed, watch } from "vue";
import { localizePath, useI18n } from "@/i18n";

const { locale, t } = useI18n();

/** About page, anchored at the support block. */
const supportLink = computed(() => ({
    path: localizePath("/about", locale.value),
    hash: "#support",
}));

const lastBuild = ref<string>("");

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
};

const dateLocale = computed(() => (locale.value === "ru" ? "ru-RU" : "en-GB"));

function formatBuild() {
    let d: Date;
    try {
        d = new Date(__BUILD_TIME__);
        if (Number.isNaN(d.getTime())) d = new Date();
    } catch {
        d = new Date();
    }
    lastBuild.value = d.toLocaleString(dateLocale.value, DATE_FORMAT);
}

onMounted(formatBuild);
// Re-render the timestamp in the new locale's conventions on a language switch.
watch(locale, formatBuild);
</script>

<template>
    <footer class="footer">
        <div class="container footer-inner">
            <!-- ── Top Row: Brand & Actions ────────────────────────────────── -->
            <div class="footer-top">
                <div class="footer-brand">
                    <div class="brand-title">
                        AmneziaWG <span class="brand-sub">Architect</span>
                    </div>
                    <div class="brand-slogan">
                        {{ t("footer.slogan.lead") }}
                        <span class="text-accent">{{
                            t("footer.slogan.accent")
                        }}</span>
                        {{ t("footer.slogan.tail") }}
                    </div>
                </div>

                <!-- Points at the About page's support section rather than a
                     single payment provider, so every method is on offer. -->
                <router-link :to="supportLink" class="donate-card">
                    <div class="donate-icon">
                        <Heart :size="20" fill="currentColor" />
                    </div>
                    <div class="donate-content">
                        <span class="donate-title">{{
                            t("footer.donate.title")
                        }}</span>
                        <span class="donate-desc">{{
                            t("footer.donate.methods")
                        }}</span>
                    </div>
                    <ChevronRight class="donate-arrow" :size="18" />
                </router-link>
            </div>

            <div class="divider"></div>

            <!-- ── Grid Section: Links ─────────────────────────────────────── -->
            <div class="footer-grid">
                <!-- Column 1: Resources -->
                <div class="f-col">
                    <h4 class="col-head">{{ t("footer.col.resources") }}</h4>
                    <div class="col-links">
                        <a
                            href="https://github.com/Vadim-Khristenko/AmneziaWG-Architect"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="f-link"
                        >
                            <Github :size="16" /> {{ t("footer.link.source") }}
                        </a>
                        <a
                            href="https://git.vai-rice.space/vai_prog/AmneziaWG-Architect"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="f-link"
                        >
                            <GitBranch :size="16" />
                            {{ t("footer.link.sourceMirror") }}
                        </a>
                        <a
                            href="https://github.com/amnezia-vpn/"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="f-link"
                        >
                            <Shield :size="16" />
                            {{ t("footer.link.amneziaGithub") }}
                        </a>
                    </div>
                </div>

                <!-- Column 2: Community -->
                <div class="f-col">
                    <h4 class="col-head">{{ t("footer.col.community") }}</h4>
                    <div class="col-links">
                        <a
                            href="https://t.me/amnezia_vpn"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="f-link"
                        >
                            <Send :size="16" /> {{ t("footer.link.telegram") }}
                        </a>
                        <a
                            href="https://github.com/Vadim-Khristenko/"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="f-link"
                        >
                            <User :size="16" /> {{ t("footer.link.author") }}
                        </a>
                    </div>
                </div>

                <!-- Column 3: Credits -->
                <div class="f-col credits">
                    <h4 class="col-head">{{ t("footer.col.research") }}</h4>
                    <div class="credits-text">
                        {{ t("footer.credits.basedOn") }}
                        <a
                            href="https://voidwaifu.github.io/Special-Junk-Packet-List/"
                            target="_blank"
                            rel="noopener noreferrer"
                            >Special Junk Packet List</a
                        >
                        {{ t("footer.credits.from") }}
                        <a
                            href="https://github.com/VoidWaifu"
                            target="_blank"
                            rel="noopener noreferrer"
                            >@VoidWaifu</a
                        >
                    </div>
                </div>
            </div>

            <!-- ── Bottom Bar ─────────────────────────────────────────────── -->
            <div class="footer-bottom">
                <div class="copy-block">
                    <div class="copy-row">
                        &copy; 2026
                        <span class="copy-hl">AmneziaWG Architect</span>
                    </div>
                    <div class="copy-sub">
                        {{ t("footer.madeWith") }}
                        <Heart
                            :size="13"
                            fill="currentColor"
                            class="heart-anim"
                            aria-hidden="true"
                        />
                        {{ t("footer.forCommunity") }}
                    </div>
                    <div v-if="lastBuild" class="build-time">
                        {{ t("footer.build") }}: {{ lastBuild }}
                    </div>
                </div>

                <div class="local-badge">
                    <Lock :size="12" />
                    <span>{{ t("footer.local") }}</span>
                </div>
            </div>
        </div>
    </footer>
</template>

<style scoped>
.footer {
    position: relative;
    margin-top: auto;
    /* A deepening of the ground, not a dark wash. The literal it replaces
       painted `rgba(14, 11, 7, 0.6)` across the top of the footer, which on a
       pastel page read as a grey slab under every view. */
    background: linear-gradient(to bottom, var(--bg4) 0%, var(--bg2) 100%);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid var(--border2);
    padding: 64px 0 40px;
    z-index: 10;
}

.footer-inner {
    display: flex;
    flex-direction: column;
    gap: 48px;
}

/* ── Top Row ──────────────────────────────────────────────────────────── */
.footer-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 40px;
    flex-wrap: wrap;
}

.footer-brand {
    flex: 1;
    min-width: 280px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.brand-title {
    font-family: var(--fu);
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--accent-ink);
    line-height: 1;
}

.brand-sub {
    font-family: var(--fm);
    font-size: 0.75rem;
    color: var(--text3);
    text-transform: uppercase;
    letter-spacing: 0.25em;
    margin-left: 8px;
    font-weight: 400;
}

.brand-slogan {
    font-size: 0.95rem;
    color: var(--text2);
    line-height: 1.6;
    max-width: 420px;
}

/* ── Donate Card ──────────────────────────────────────────────────────── */
.donate-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 24px 12px 14px;
    background: rgb(var(--accent-rgb) / 0.05);
    border: 1px solid rgb(var(--accent-rgb) / 0.15);
    border-radius: 16px;
    text-decoration: none;
    transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
    position: relative;
    overflow: hidden;
}

.donate-card:hover {
    transform: translateY(-4px);
    border-color: var(--accent);
    background: rgb(var(--accent-rgb) / 0.08);
    box-shadow: 0 12px 24px rgb(var(--accent-rgb) / 0.1);
}

.donate-icon {
    width: 44px;
    height: 44px;
    background: var(--accent);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--on-accent);
    box-shadow: 0 4px 12px rgb(var(--accent-rgb) / 0.3);
}

.donate-content {
    display: flex;
    flex-direction: column;
}

.donate-title {
    font-family: var(--fu);
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text);
}

.donate-desc {
    font-size: 0.75rem;
    color: var(--text3);
}

.donate-arrow {
    color: var(--text3);
    margin-left: 8px;
    transition: transform 0.3s;
}

.donate-card:hover .donate-arrow {
    transform: translateX(4px);
    color: var(--accent-ink);
}

/* ── Grid ─────────────────────────────────────────────────────────────── */
.divider {
    height: 1px;
    background: linear-gradient(
        90deg,
        transparent 0%,
        rgb(var(--accent-rgb) / 0.1) 50%,
        transparent 100%
    );
}

.footer-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 40px;
}

.col-head {
    font-family: var(--fu);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--text3);
    margin-bottom: 24px;
}

.col-links {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.f-link {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text2);
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.2s;
}

.f-link svg {
    color: var(--accent-ink);
    opacity: 0.6;
    transition: opacity 0.2s;
}

.f-link:hover {
    color: var(--accent-ink);
    transform: translateX(4px);
}

.f-link:hover svg {
    opacity: 1;
}

.credits-text {
    font-size: 0.85rem;
    color: var(--text2);
    line-height: 1.6;
}

.credits-text a {
    color: var(--text);
    border-bottom: 1px solid var(--border2);
    transition: all 0.2s;
}

.credits-text a:hover {
    color: var(--accent-ink);
    border-bottom-color: var(--accent);
}

/* ── Bottom Bar ───────────────────────────────────────────────────────── */
.footer-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
    flex-wrap: wrap;
    padding-top: 8px;
}

.copy-block {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.copy-row {
    font-family: var(--fm);
    font-size: 0.8rem;
    color: var(--text3);
}

.copy-hl {
    color: var(--text2);
    font-weight: 600;
}

.copy-sub {
    font-size: 0.8rem;
    color: var(--text3);
}

.heart-anim {
    display: inline-block;
    /* Baseline-align the SVG with the surrounding text now that the heart is
       an icon rather than an emoji glyph. */
    vertical-align: -2px;
    color: var(--red);
    animation: heartbeat 2s infinite;
}

@media (prefers-reduced-motion: reduce) {
    .heart-anim {
        animation: none;
    }
}

.build-time {
    font-family: var(--fm);
    font-size: 0.7rem;
    color: var(--text3);
    opacity: 0.6;
    margin-top: 4px;
}

.local-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    background: rgba(92, 184, 122, 0.05);
    border: 1px solid rgba(92, 184, 122, 0.15);
    border-radius: 100px;
    font-size: 0.75rem;
    color: var(--green);
    font-weight: 600;
}

@keyframes heartbeat {
    0%,
    100% {
        transform: scale(1);
    }
    10% {
        transform: scale(1.2);
    }
    20% {
        transform: scale(1);
    }
}

/* ── Mobile ───────────────────────────────────────────────────────────── */
@media (max-width: 850px) {
    .footer-grid {
        grid-template-columns: 1fr 1fr;
    }
    .credits {
        grid-column: span 2;
    }
}

@media (max-width: 600px) {
    .footer-top {
        flex-direction: column;
        align-items: flex-start;
        gap: 32px;
    }

    .footer-grid {
        grid-template-columns: 1fr;
        gap: 32px;
    }

    .credits {
        grid-column: span 1;
    }

    .footer-bottom {
        flex-direction: column;
        align-items: flex-start;
        gap: 24px;
    }

    .local-badge {
        width: 100%;
        justify-content: center;
    }
}
</style>
