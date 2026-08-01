<script setup lang="ts">
/**
 * VAIEXIA — announcement page.
 *
 * Replaces the retired IAA page. /iaa redirects here so old links keep landing
 * somewhere useful rather than on a 404.
 */
import {
    LayoutDashboard,
    Bot,
    Server,
    MousePointerClick,
    SlidersHorizontal,
    Network,
    GitBranch,
    ExternalLink,
    Copy,
    Check,
    Sparkles,
    Boxes,
    ShieldCheck,
    TriangleAlert,
} from "lucide-vue-next";
import { useI18n } from "@/i18n";
import { useCopyFeedback } from "@/composables/useCopyFeedback";

const { t } = useI18n();

const MIRROR_URL = "https://git.vai-rice.space/amnezia-vpn";

const { isCopied, copy } = useCopyFeedback();

/** One button, so the key is a constant. */
const MIRROR_KEY = "mirror";
const copyMirror = () => copy(MIRROR_KEY, MIRROR_URL);

interface Feature {
    icon: typeof Server;
    /** Catalogue key stem; `.title` and `.desc` hang off it. */
    key: string;
}

const features: Feature[] = [
    { icon: LayoutDashboard, key: "panel" },
    { icon: Bot, key: "bots" },
    { icon: MousePointerClick, key: "install" },
    { icon: SlidersHorizontal, key: "protocols" },
    { icon: Network, key: "clusters" },
    { icon: Boxes, key: "beyond" },
];
</script>

<template>
    <div class="vaiexia-page fade-in">
        <div class="container">
            <!-- ── Hero ────────────────────────────────────────────────── -->
            <header class="vx-hero">
                <div class="badge badge-amber vx-badge">
                    <Sparkles :size="12" />
                    {{ t("vaiexia.soon") }}
                </div>

                <h1 class="vx-title">VAIEXIA</h1>

                <p class="vx-tagline">
                    {{ t("vaiexia.lede") }}
                </p>

                <p class="vx-lede">
                    {{ t("vaiexia.desc") }}
                </p>
            </header>

            <!-- ── Features ────────────────────────────────────────────── -->
            <section class="vx-grid">
                <article
                    v-for="(f, i) in features"
                    :key="f.key"
                    class="vx-card"
                    :style="{ animationDelay: `${i * 70}ms` }"
                >
                    <div class="vx-card-icon">
                        <component :is="f.icon" :size="20" />
                    </div>
                    <h2 class="vx-card-title">
                        {{ t(`vaiexia.feature.${f.key}.title` as "vaiexia.feature.panel.title") }}
                    </h2>
                    <p class="vx-card-desc">
                        {{ t(`vaiexia.feature.${f.key}.desc` as "vaiexia.feature.panel.desc") }}
                    </p>
                </article>
            </section>

            <!-- ── GitHub mirror ───────────────────────────────────────── -->
            <section class="vx-mirror">
                <div class="vx-mirror-head">
                    <GitBranch :size="18" />
                    <h2>
                        {{ t("vaiexia.mirror.title") }}
                    </h2>
                </div>

                <p class="vx-mirror-text">
                    {{ t("vaiexia.mirror.lede") }}
                </p>

                <div class="vx-mirror-row">
                    <code class="vx-mirror-url">{{ MIRROR_URL }}</code>
                    <button
                        class="btn btn-ghost btn-icon"
                        :class="{ 'vx-copied': isCopied(MIRROR_KEY) }"
                        :aria-label="t('vaiexia.mirror.copy')"
                        @click="copyMirror"
                    >
                        <Check v-if="isCopied(MIRROR_KEY)" :size="16" />
                        <Copy v-else :size="16" />
                    </button>
                    <a
                        class="btn btn-secondary"
                        :href="MIRROR_URL"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <ExternalLink :size="15" />
                        <span>{{ t("vaiexia.mirror.open") }}</span>
                    </a>
                </div>

                <div class="alert alert-warn vx-mirror-note">
                    <TriangleAlert :size="16" class="alert-icon" />
                    <div class="alert-content">
                        {{ t("vaiexia.mirror.warning") }}
                    </div>
                </div>
            </section>

            <!-- ── Status ──────────────────────────────────────────────── -->
            <section class="vx-status">
                <ShieldCheck :size="16" />
                <p>
                    {{ t("vaiexia.wip") }}
                </p>
            </section>
        </div>
    </div>
</template>

<style scoped>
.vaiexia-page {
    padding: 2.5rem 0 4rem;
}

/* ── Hero ─────────────────────────────────────────────────────────────── */
.vx-hero {
    text-align: center;
    max-width: 720px;
    margin: 0 auto 3rem;
}

.vx-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 1.25rem;
}

.vx-title {
    font-family: var(--fu);
    font-weight: 900;
    font-size: clamp(2.5rem, 9vw, 4.5rem);
    line-height: 1;
    letter-spacing: -0.02em;
    margin: 0 0 1rem;
    background: linear-gradient(135deg, var(--amber) 0%, var(--amber3) 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}

.vx-tagline {
    font-family: var(--fw);
    font-weight: 700;
    font-size: clamp(1rem, 3.2vw, 1.3rem);
    line-height: 1.4;
    color: var(--text);
    margin: 0 0 0.9rem;
    text-wrap: balance;
}

.vx-lede {
    font-size: 0.95rem;
    line-height: 1.65;
    color: var(--text2);
    margin: 0;
    text-wrap: pretty;
}

/* ── Feature grid ─────────────────────────────────────────────────────── */
.vx-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
    gap: 14px;
    margin-bottom: 3rem;
}

.vx-card {
    padding: 20px;
    background: var(--bg2);
    border: 1px solid var(--border2);
    border-radius: var(--radius-lg);
    animation: vx-rise 0.5s var(--ease) backwards;
    transition:
        border-color var(--trans-fast),
        transform var(--trans-fast);
}

.vx-card:hover {
    border-color: var(--amber-dim);
    transform: translateY(-2px);
}

@keyframes vx-rise {
    from {
        opacity: 0;
        transform: translateY(12px);
    }
    to {
        opacity: 1;
        transform: none;
    }
}

@media (prefers-reduced-motion: reduce) {
    .vx-card {
        animation: none;
    }
    .vx-card:hover {
        transform: none;
    }
}

.vx-card-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    margin-bottom: 14px;
    border-radius: var(--radius);
    background: var(--bg4);
    color: var(--accent-ink);
}

.vx-card-title {
    font-family: var(--fw);
    font-weight: 800;
    font-size: 0.98rem;
    color: var(--text);
    margin: 0 0 7px;
}

.vx-card-desc {
    font-size: 0.85rem;
    line-height: 1.6;
    color: var(--text2);
    margin: 0;
    text-wrap: pretty;
}

/* ── Mirror ───────────────────────────────────────────────────────────── */
.vx-mirror {
    padding: 22px;
    background: var(--bg2);
    border: 1px solid var(--border2);
    border-radius: var(--radius-lg);
    margin-bottom: 2rem;
}

.vx-mirror-head {
    display: flex;
    align-items: center;
    gap: 9px;
    color: var(--accent-ink);
    margin-bottom: 10px;
}

.vx-mirror-head h2 {
    font-family: var(--fw);
    font-weight: 800;
    font-size: 1rem;
    margin: 0;
}

.vx-mirror-text {
    font-size: 0.88rem;
    line-height: 1.6;
    color: var(--text2);
    margin: 0 0 14px;
    text-wrap: pretty;
}

.vx-mirror-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 14px;
}

.vx-mirror-url {
    flex: 1;
    min-width: 0;
    padding: 10px 12px;
    background: var(--bg4);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-family: var(--fm);
    font-size: 0.82rem;
    color: var(--accent-ink-lift);
    overflow-x: auto;
    white-space: nowrap;
}

.vx-copied {
    color: var(--green);
}

.vx-mirror-note {
    margin: 0;
}

/* ── Status ───────────────────────────────────────────────────────────── */
.vx-status {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    padding: 14px 16px;
    border-radius: var(--radius);
    background: var(--bg2);
    border: 1px solid var(--border);
    color: var(--text2);
}

.vx-status svg {
    flex-shrink: 0;
    margin-top: 2px;
    color: var(--accent-ink);
}

.vx-status p {
    margin: 0;
    font-size: 0.85rem;
    line-height: 1.6;
    text-wrap: pretty;
}

@media (max-width: 480px) {
    .vaiexia-page {
        padding: 1.5rem 0 3rem;
    }
    .vx-grid {
        grid-template-columns: 1fr;
    }
    .vx-mirror,
    .vx-card {
        padding: 16px;
    }
}
</style>
