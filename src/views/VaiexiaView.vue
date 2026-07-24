<script setup lang="ts">
/**
 * VAIEXIA — announcement page.
 *
 * Replaces the retired IAA page. /iaa redirects here so old links keep landing
 * somewhere useful rather than on a 404.
 */
import { ref } from "vue";
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

const { locale } = useI18n();

const MIRROR_URL = "https://git.vai-rice.space/amnezia-vpn";

const copied = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | undefined;

async function copyMirror() {
    try {
        await navigator.clipboard.writeText(MIRROR_URL);
    } catch {
        // Clipboard is unavailable over plain HTTP and in some hardened
        // browsers. Fall back to a selection the visitor can copy by hand.
        const el = document.createElement("textarea");
        el.value = MIRROR_URL;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.select();
        try {
            document.execCommand("copy");
        } catch {
            document.body.removeChild(el);
            return;
        }
        document.body.removeChild(el);
    }
    copied.value = true;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (copied.value = false), 2000);
}

interface Feature {
    icon: typeof Server;
    ru: { title: string; desc: string };
    en: { title: string; desc: string };
}

const features: Feature[] = [
    {
        icon: LayoutDashboard,
        ru: {
            title: "Веб-панель",
            desc: "Единый интерфейс для сервера или целого кластера. Состояние, метрики и управление в одном месте, без беготни по SSH-сессиям.",
        },
        en: {
            title: "Web panel",
            desc: "One interface for a single server or a whole cluster. State, metrics and controls in one place instead of a scatter of SSH sessions.",
        },
    },
    {
        icon: Bot,
        ru: {
            title: "Telegram, Discord, Matrix",
            desc: "Тот же контроль из мессенджера. Перезапустить сервис, выдать ключ или посмотреть нагрузку можно с телефона, не открывая ноутбук.",
        },
        en: {
            title: "Telegram, Discord, Matrix",
            desc: "The same control from your messenger. Restart a service, issue a key or check load from your phone without opening a laptop.",
        },
    },
    {
        icon: MousePointerClick,
        ru: {
            title: "Установка в один клик",
            desc: "Пакеты и сервисы ставятся одним нажатием — без ручной сборки зависимостей и правки юнитов systemd.",
        },
        en: {
            title: "One-click installs",
            desc: "Packages and services deploy in a single click — no hand-built dependency chains, no hand-edited systemd units.",
        },
    },
    {
        icon: SlidersHorizontal,
        ru: {
            title: "Продвинутая настройка протоколов",
            desc: "Тонкие параметры обфускации доступны прямо из панели, а не только в конфиге. Включая то, что генерирует этот Architect.",
        },
        en: {
            title: "Advanced protocol settings",
            desc: "Fine-grained obfuscation parameters are exposed in the panel, not buried in a config file — including everything this Architect generates.",
        },
    },
    {
        icon: Network,
        ru: {
            title: "Кластеры и мультисервер",
            desc: "Несколько узлов управляются как один. Раскатка конфигурации на группу серверов вместо повторения одних и тех же шагов.",
        },
        en: {
            title: "Clusters and multi-server",
            desc: "Several nodes behave as one. Roll a configuration out to a group instead of repeating the same steps by hand.",
        },
    },
    {
        icon: Boxes,
        ru: {
            title: "Не только VPN",
            desc: "Панель не привязана к одному протоколу или задаче — это общий инструмент управления вашей инфраструктурой.",
        },
        en: {
            title: "More than VPN",
            desc: "The panel is not tied to one protocol or one job — it is a general tool for running your own infrastructure.",
        },
    },
];
</script>

<template>
    <div class="vaiexia-page fade-in">
        <div class="container">
            <!-- ── Hero ────────────────────────────────────────────────── -->
            <header class="vx-hero">
                <div class="badge badge-amber vx-badge">
                    <Sparkles :size="12" />
                    {{ locale === "ru" ? "СКОРО" : "COMING SOON" }}
                </div>

                <h1 class="vx-title">VAIEXIA</h1>

                <p class="vx-tagline">
                    {{
                        locale === "ru"
                            ? "Веб-панель и Telegram / Discord / Matrix бот — и не только."
                            : "A web panel and a Telegram / Discord / Matrix bot — and more."
                    }}
                </p>

                <p class="vx-lede">
                    {{
                        locale === "ru"
                            ? "Руководите своим сервером или кластером где угодно и как угодно. Установка пакетов в один клик — как и продвинутых настроек протоколов."
                            : "Run your server or cluster from anywhere, any way you like. One-click package installs, and the advanced protocol settings to match."
                    }}
                </p>
            </header>

            <!-- ── Features ────────────────────────────────────────────── -->
            <section class="vx-grid">
                <article
                    v-for="(f, i) in features"
                    :key="f[locale].title"
                    class="vx-card"
                    :style="{ animationDelay: `${i * 70}ms` }"
                >
                    <div class="vx-card-icon">
                        <component :is="f.icon" :size="20" />
                    </div>
                    <h2 class="vx-card-title">{{ f[locale].title }}</h2>
                    <p class="vx-card-desc">{{ f[locale].desc }}</p>
                </article>
            </section>

            <!-- ── GitHub mirror ───────────────────────────────────────── -->
            <section class="vx-mirror">
                <div class="vx-mirror-head">
                    <GitBranch :size="18" />
                    <h2>
                        {{
                            locale === "ru"
                                ? "GitHub недоступен?"
                                : "GitHub blocked?"
                        }}
                    </h2>
                </div>

                <p class="vx-mirror-text">
                    {{
                        locale === "ru"
                            ? "Если GitHub у вас не открывается, а приложения Amnezia нужны — попробуйте зеркало:"
                            : "If GitHub will not open for you but you need the Amnezia apps, try the mirror:"
                    }}
                </p>

                <div class="vx-mirror-row">
                    <code class="vx-mirror-url">{{ MIRROR_URL }}</code>
                    <button
                        class="btn btn-ghost btn-icon"
                        :class="{ 'vx-copied': copied }"
                        :aria-label="
                            locale === 'ru' ? 'Скопировать ссылку' : 'Copy link'
                        "
                        @click="copyMirror"
                    >
                        <Check v-if="copied" :size="16" />
                        <Copy v-else :size="16" />
                    </button>
                    <a
                        class="btn btn-secondary"
                        :href="MIRROR_URL"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <ExternalLink :size="15" />
                        <span>{{ locale === "ru" ? "Открыть" : "Open" }}</span>
                    </a>
                </div>

                <div class="alert alert-warn vx-mirror-note">
                    <TriangleAlert :size="16" class="alert-icon" />
                    <div class="alert-content">
                        {{
                            locale === "ru"
                                ? "Это независимое зеркало, а не официальный сайт Amnezia. Сверяйте контрольные суммы и подписи релизов перед установкой — как и для любого стороннего источника."
                                : "This is an independent mirror, not Amnezia's official site. Verify release checksums and signatures before installing, as you would with any third-party source."
                        }}
                    </div>
                </div>
            </section>

            <!-- ── Status ──────────────────────────────────────────────── -->
            <section class="vx-status">
                <ShieldCheck :size="16" />
                <p>
                    {{
                        locale === "ru"
                            ? "Проект в разработке. Эта страница — анонс: сроков пока нет, обещаний в кредит тоже."
                            : "The project is in development. This page is an announcement — no dates promised, and no promises on credit."
                    }}
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
    color: var(--amber);
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
    color: var(--amber);
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
    color: var(--amber2);
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
    color: var(--amber);
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
