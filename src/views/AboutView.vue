<script setup lang="ts">
import { ref } from "vue";
import {
    Info,
    HelpCircle,
    Server,
    Combine,
    Lock,
    CheckCircle,
    Zap,
    RefreshCw,
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
} from "lucide-vue-next";

const activeTimeline = ref<number | null>(null);

function toggleTimeline(idx: number) {
    activeTimeline.value = activeTimeline.value === idx ? null : idx;
}

const timelineEvents = [
    {
        version: "0.1",
        date: "Начало",
        title: "Первый прототип",
        icon: Rocket,
        color: "amber",
        desc: "Чистый HTML/CSS/JS, один файл, базовая генерация параметров Jc, Jmin, Jmax и случайных H/S. Работающий PoC без дизайна.",
    },
    {
        version: "0.2",
        date: "Фикс",
        title: "Исправление HEX-генерации",
        icon: Bug,
        color: "red",
        desc: "Критическая ошибка: невалидный HEX в script.js вызывал краш клиента. Исправлено, добавлена валидация assertEvenHex.",
    },
    {
        version: "0.3",
        date: "CPS-теги",
        title: "Селективные CPS-теги",
        icon: Code,
        color: "green",
        desc: "Поддержка <c>, <t>, <r>, <rc>, <rd> тегов с возможностью включения/выключения каждого. Синхронизация I1-генераторов с тегами пользователя.",
    },
    {
        version: "0.4",
        date: "AWG 1.0",
        title: "Оптимизация Junk для AWG 1.0",
        icon: Wrench,
        color: "amber",
        desc: "Требования официального клиента: Jc ≥ 4, Jmax > 81 для AWG 1.0. Корректировка генератора под ограничения протокола.",
    },
    {
        version: "0.5",
        date: "Эволюция",
        title: "MergeKeys и vpn://",
        icon: GitMerge,
        color: "green",
        desc: "Модуль MergeKeys — декодирование, патчинг и объединение vpn://-ключей в браузере. Поддержка pako/zlib, base64url кодек с 4-байт заголовком.",
    },
    {
        version: "0.6",
        date: "Browser FP",
        title: "Browser Fingerprint и QUIC/HTTP3",
        icon: Eye,
        color: "amber",
        desc: "Профильные таблицы размеров пакетов по браузерам (Chrome, Firefox, Safari, Yandex). Адаптивный padding для QUIC Initial, 0-RTT, HTTP/3.",
    },
    {
        version: "0.7",
        date: "Дизайн",
        title: "Глобальный редизайн UI",
        icon: Paintbrush,
        color: "green",
        desc: "Полная переработка интерфейса, MergeKeys в стиле основного генератора. Мобильная адаптивность, исправление overflow CPS при MTU.",
    },
    {
        version: "1.0",
        date: "Перерождение",
        title: "Vue 3 + TypeScript + SPA",
        icon: Sparkles,
        color: "amber",
        desc: "Миграция на Vue 3, Vite, TypeScript. Компонентная архитектура (utils/composables/views), SPA-роутинг, GitHub Pages с pre-render stubs. UI полностью с нуля — тёмная тема, amber-акценты, анимации.",
    },
    {
        version: "1.1",
        date: "Расширение",
        title: "AWG 2.0, CPS, 7+ профилей",
        icon: Layers,
        color: "green",
        desc: "AWG 2.0 с диапазонами H1–H4, S3/S4, полная CPS-цепочка I1–I5. 7 профилей мимикрии (QUIC, TLS, DTLS, SIP, HTTP/3, Noise_IK). Feedback-система с автоусилением, история генераций.",
    },
    {
        version: "1.2",
        date: "Инфра",
        title: "SPA-роутинг, донаты, деплой",
        icon: Globe,
        color: "amber",
        desc: "Относительные пути для file://, runtime-определение base path, pre-render stubs для SEO-ботов. CI/CD: build → deploy → release. Переход на Yoomoney.",
    },
    {
        version: "2.0",
        date: "Релиз 2.0",
        title: "Router Mode, Inspector, композитные профили",
        icon: Star,
        color: "green",
        desc: "Режим роутера для NanoPi/Keenetic/OpenWrt. Инспектор и редактор vpn://-ключей. Композитные профили TLS→QUIC и QUIC Burst. Проверка доступности доменов. 133+ автотестов (vitest). Обновлённая IAA-страница. Скрипты запуска для Win/Linux/macOS.",
    },
    {
        version: "2.1",
        date: "Сейчас",
        title: "Инцидент с роутингом и CI/CD",
        icon: Bug,
        color: "red",
        desc: "Инцидент с маршрутизацией: из-за конфликта SPA-редиректов пользователи получали белый экран по прямым ссылкам. Починено! Добавлена умная 404-заглушка с ручным fallback'ом, продвинутый мульти-хостинг (GitLab/GitHub/Cloudflare) и новые автотесты резолва URL, чтобы больше ничего не сломалось.",
    },
];

const statCards = [
    { label: "Профили мимикрии", value: "9+", icon: Eye },
    { label: "Параметров генерации", value: "18+", icon: FileCode },
    { label: "Автотестов", value: "150+", icon: Terminal },
    { label: "Серверов и трекеров", value: "0", icon: ShieldCheck },
];
</script>

<template>
    <div class="about-wrap">
        <!-- ── Hero ────────────────────────────────────────────────────── -->
        <header class="about-hero a-stagger-1">
            <div class="hero-badge badge badge-amber">
                <Info :size="12" /> О ПРОЕКТЕ
            </div>
            <h1 class="hero-title">
                <span class="hero-line-1">AmneziaWG</span>
                <span class="hero-line-2">Architect</span>
            </h1>
            <p class="hero-subtitle">
                Генератор обфускации нового поколения.<br />
                <b>Твой протокол — твои правила.</b><br />
                <i>Невидимость по стандарту.</i>
            </p>
        </header>

        <!-- ── Legal Disclaimer ─────────────────────────────────────────── -->
        <section class="about-section legal-section a-stagger-0">
            <div class="legal-card">
                <div class="legal-icon">
                    <Shield :size="28" />
                </div>
                <h2>⚠️ Юридическая информация</h2>
                <div class="legal-content">
                    <p class="legal-warning">
                        <strong>Этот проект создан исключительно в ознакомительных и исследовательских целях.</strong>
                    </p>
                    <p>
                        <strong>Проект никогда не создавался для использования в России или странах СНГ.</strong>
                        Автор не несёт ответственности за любое использование данного программного обеспечения.
                    </p>
                    <div class="legal-allowed">
                        <p><strong>Разрешённое использование:</strong></p>
                        <ul>
                            <li>Pentesting и security research</li>
                            <li>CTF-соревнования</li>
                            <li>Научные исследования</li>
                            <li>Тестирование собственных сетей</li>
                        </ul>
                    </div>
                    <p class="legal-disclaimer">
                        Использование инструментов обфускации трафика может нарушать законодательство вашей страны.
                        <strong>Никакие материалы этого проекта не являются призывом к нарушению законов.</strong>
                    </p>
                </div>
            </div>
        </section>

        <!-- ── Stats Strip ─────────────────────────────────────────────── -->
        <div class="stats-strip a-stagger-2">
            <div v-for="(s, i) in statCards" :key="i" class="stat-card">
                <component :is="s.icon" :size="18" class="stat-icon" />
                <span class="stat-value">{{ s.value }}</span>
                <span class="stat-label">{{ s.label }}</span>
            </div>
        </div>

        <!-- ── What is this? ───────────────────────────────────────────── -->
        <section class="about-section a-stagger-3">
            <div class="section-icon-wrap">
                <Sparkles :size="22" />
            </div>
            <h2>Что такое AmneziaWG Architect?</h2>
            <p>
                <span class="hl">AmneziaWG Architect</span> — это продвинутый
                веб-инструмент для создания уникальных профилей обфускации
                протокола <b>AmneziaWG</b>, а также для работы с ключами Amnezia
                VPN.
            </p>
            <p>
                Если обычный VPN просто шифрует данные, то Architect помогает
                «замаскировать» сам факт использования VPN. Системы DPI
                анализируют структуру пакетов и умеют определять WireGuard по
                фиксированным заголовкам и размерам. Architect генерирует
                параметры, которые делают ваш трафик похожим на QUIC, TLS, SIP
                или другие протоколы — неотличимым от обычного интернет-трафика.
            </p>
            <div class="feature-grid">
                <div class="feature-card">
                    <CheckCircle :size="18" class="fc-icon" />
                    <div>
                        <b>Простая интеграция</b>
                        <span
                            >Параметры H1–H4, S1–S4, I1–I5 точно соответствуют
                            полям в приложении AmneziaVPN.</span
                        >
                    </div>
                </div>
                <div class="feature-card">
                    <Zap :size="18" class="fc-icon" />
                    <div>
                        <b>Умная генерация</b>
                        <span
                            >Не случайные числа, а структуры реальных сетевых
                            пакетов для максимальной правдоподобности.</span
                        >
                    </div>
                </div>
                <div class="feature-card">
                    <RefreshCw :size="18" class="fc-icon" />
                    <div>
                        <b>Режим «Не работает»</b>
                        <span
                            >Конфиг заблокировали? Один клик — генератор усилит
                            параметры и выдаст новую итерацию.</span
                        >
                    </div>
                </div>
                <div class="feature-card">
                    <Code :size="18" class="fc-icon" />
                    <div>
                        <b>Для продвинутых</b>
                        <span
                            >Ручное управление CPS-тегами, MTU, профилями
                            мимикрии, Browser Fingerprint.</span
                        >
                    </div>
                </div>
            </div>
        </section>

        <!-- ── Evolution Timeline ──────────────────────────────────────── -->
        <section class="about-section timeline-section a-stagger-4">
            <div class="section-icon-wrap">
                <History :size="22" />
            </div>
            <h2>Эволюция проекта</h2>
            <p>
                За свою короткую жизнь Architect пережил несколько кардинальных
                трансформаций — от одного HTML-файла до полноценного SPA на Vue
                3. Каждое обновление делало его удобнее, функциональнее и
                красивее.
            </p>

            <div class="timeline">
                <div
                    v-for="(ev, idx) in timelineEvents"
                    :key="idx"
                    class="timeline-item"
                    :class="{ open: activeTimeline === idx }"
                    :style="{ animationDelay: `${idx * 80 + 200}ms` }"
                >
                    <div class="tl-dot" :class="`tl-dot-${ev.color}`">
                        <component :is="ev.icon" :size="14" />
                    </div>
                    <div class="tl-content" @click="toggleTimeline(idx)">
                        <div class="tl-head">
                            <span class="tl-version">v{{ ev.version }}</span>
                            <span class="tl-date">{{ ev.date }}</span>
                            <span class="tl-title">{{ ev.title }}</span>
                            <ChevronDown
                                :size="14"
                                class="tl-arrow"
                                :class="{ rotated: activeTimeline === idx }"
                            />
                        </div>
                        <transition name="expand">
                            <div v-if="activeTimeline === idx" class="tl-body">
                                <p>{{ ev.desc }}</p>
                            </div>
                        </transition>
                    </div>
                </div>
            </div>
        </section>

        <!-- ── MergeKeys ───────────────────────────────────────────────── -->
        <section class="about-section a-stagger-5">
            <div class="section-icon-wrap section-icon-green">
                <Combine :size="22" />
            </div>
            <h2>MergeKeys — управление ключами</h2>
            <p>
                Помимо генератора обфускации, Architect включает модуль
                <span class="hl">MergeKeys</span> — мощный инструмент для работы
                с ключами Amnezia VPN формата <code>vpn://</code>.
            </p>
            <div class="feature-grid">
                <div class="feature-card">
                    <Zap :size="18" class="fc-icon" />
                    <div>
                        <b>Обновление обфускации</b>
                        <span
                            >Применить новые Jc, Jmin, Jmax, I1–I5 к
                            существующему ключу без пересоздания. Серверные
                            параметры не тронуты.</span
                        >
                    </div>
                </div>
                <div class="feature-card">
                    <GitMerge :size="18" class="fc-icon" />
                    <div>
                        <b>Объединение ключей</b>
                        <span
                            >Собрать контейнеры из нескольких vpn:// ключей в
                            один мастер-ключ. Дубликаты обнаруживаются
                            автоматически.</span
                        >
                    </div>
                </div>
            </div>
            <div class="cta-row">
                <router-link to="/mergekeys" class="cta-btn cta-primary">
                    <ArrowRight :size="14" />
                    Перейти к MergeKeys
                </router-link>
                <router-link
                    :to="{ path: '/mergekeys', query: { tab: 'merge' } }"
                    class="cta-btn cta-secondary"
                >
                    <GitMerge :size="14" />
                    Объединить ключи
                </router-link>
            </div>
        </section>

        <!-- ── Privacy & Security ──────────────────────────────────────── -->
        <section class="about-section privacy-section a-stagger-6">
            <div class="section-icon-wrap section-icon-green">
                <Lock :size="22" />
            </div>
            <h2>Полная приватность и безопасность</h2>

            <div class="privacy-grid">
                <div class="privacy-card">
                    <div class="priv-icon-wrap">
                        <Cpu :size="24" />
                    </div>
                    <h3>100% Client-Side</h3>
                    <p>
                        Весь код выполняется в вашем браузере. Генерация
                        обфускации, декодирование vpn://-ключей, патчинг
                        параметров — всё происходит
                        <b>локально</b>. Мы физически не можем видеть ваши
                        данные.
                    </p>
                </div>
                <div class="privacy-card">
                    <div class="priv-icon-wrap">
                        <EyeOff :size="24" />
                    </div>
                    <h3>Ноль метрик и трекеров</h3>
                    <p>
                        Нет аналитики. Нет серверов. Нет баз данных. Нет
                        cookies. Нет Google Analytics, Yandex.Metrika или
                        чего-то подобного. Мы ничего не собираем и не храним —
                        ни для себя, ни для каких-либо контор.
                    </p>
                </div>
                <div class="privacy-card">
                    <div class="priv-icon-wrap">
                        <Globe :size="24" />
                    </div>
                    <h3>Offline Ready</h3>
                    <p>
                        Сохраните страницу — и пользуйтесь без интернета. Вся
                        логика генерации и работы с ключами работает оффлайн.
                        Никаких внешних API-запросов.
                    </p>
                </div>
            </div>
        </section>

        <!-- ── Open Source ──────────────────────────────────────────────── -->
        <section class="about-section a-stagger-7">
            <div class="section-icon-wrap">
                <FileCode :size="22" />
            </div>
            <h2>Открытый исходный код</h2>
            <p>
                Все исходники проекта полностью открыты. Кто угодно может
                прочитать код, убедиться в безопасности, предложить улучшения,
                форкнуть и задеплоить свою версию.
            </p>
            <div class="feature-grid">
                <div class="feature-card">
                    <Github :size="18" class="fc-icon" />
                    <div>
                        <b>GitHub</b>
                        <span
                            >Исходный код доступен на GitHub. Vue 3, TypeScript,
                            Vite — современный стек без магии.</span
                        >
                    </div>
                </div>
                <div class="feature-card">
                    <Shield :size="18" class="fc-icon" />
                    <div>
                        <b>Аудит приветствуется</b>
                        <span
                            >Весь код генерации и работы с ключами открыт для
                            аудита. Никаких обфусцированных бандлов — только
                            чистый TypeScript.</span
                        >
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
                    Исходники на GitHub
                    <ExternalLink :size="12" />
                </a>
            </div>
        </section>

        <!-- ── Developer & Contact ─────────────────────────────────────── -->
        <section class="about-section dev-section a-stagger-8">
            <div class="section-icon-wrap section-icon-blue">
                <Users :size="22" />
            </div>
            <h2>Разработчик и обратная связь</h2>

            <div class="dev-card">
                <div class="dev-avatar">
                    <span class="dev-avatar-letter">V</span>
                </div>
                <div class="dev-info">
                    <h3>Единственный разработчик</h3>
                    <p>
                        Architect создаётся и поддерживается одним человеком.
                        Баги устраняются оперативно — часто в тот же день.
                        Проект живёт благодаря энтузиазму и свободному времени.
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
                <Bug :size="18" class="fc-icon" />
                <div>
                    <b>Нашли баг? Есть идея?</b>
                    <p>
                        Приглашаю всех желающих ловить баги, если таковые
                        находятся! Пишите во <b>Флудильне в Amnezia VPN</b> по
                        юзернейму <code>@VAI_Programmer</code><br />
                        Или на Github в разделе ISSUE!
                    </p>
                    <p class="contact-note">
                        <MessageCircle :size="13" />
                        Пожалуйста, не спамьте мне в ЛС — заблочу 😅 Только
                        через Флудильню!
                    </p>
                </div>
            </div>
        </section>

        <!-- ── Support / Donation ──────────────────────────────────────── -->
        <section class="about-section donation-section a-stagger-9">
            <div class="donation-glow"></div>
            <div class="donation-content">
                <div class="donation-icon">
                    <Coffee :size="32" />
                </div>
                <h2>Поддержать проект</h2>
                <p>
                    Этот проект живёт только благодаря тому, что у меня есть
                    свободное время и огромный интерес к теме. Здесь нет
                    рекламы, спонсоров или монетизации.
                </p>
                <p>
                    Но если Architect вам помог — я буду рад, если вы закинете
                    монетку на кофе. Это лучшая мотивация продолжать развивать
                    проект.<br />
                    <b>Спасибо!</b>
                </p>
                <div class="donation-actions">
                    <a
                        href="https://yoomoney.ru/fundraise/1GA2JV51324.260304"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="cta-btn cta-donate"
                    >
                        <Heart :size="15" />
                        Поддержать автора
                        <ExternalLink :size="12" />
                    </a>
                </div>
                <p class="donation-thanks">
                    <Star :size="14" />
                    Каждый донат — это ещё одна фича, фикс или улучшение.<br />
                    Спасибо, что пользуетесь Architect!
                    <Star :size="14" />
                </p>
            </div>
        </section>
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
    margin-bottom: 1rem;
    animation: badgePulse 3s ease-in-out infinite;
}

@keyframes badgePulse {
    0%,
    100% {
        box-shadow: 0 0 0 0 rgba(232, 168, 64, 0);
    }
    50% {
        box-shadow: 0 0 16px 2px rgba(232, 168, 64, 0.15);
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

.hero-line-2 {
    display: block;
    background: linear-gradient(
        135deg,
        var(--amber2) 0%,
        var(--amber) 50%,
        var(--amber3) 100%
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.hero-subtitle {
    max-width: 520px;
    margin: 0 auto;
    font-size: 0.95rem;
    color: var(--text2);
    line-height: 1.7;
}

.hero-outline {
    display: block;
    margin-top: 6px;
    font-family: var(--fu);
    font-weight: 900;
    font-size: 1.1em;
    color: transparent;
    -webkit-text-stroke: 1.2px var(--amber);
    letter-spacing: 0.02em;
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
    color: var(--accent);
    opacity: 0.8;
}

.stat-value {
    font-family: var(--fm);
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--accent);
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
        rgba(232, 168, 64, 0.08) 50%,
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
    background: rgba(232, 168, 64, 0.08);
    border: 1px solid rgba(232, 168, 64, 0.12);
    border-radius: var(--radius);
    color: var(--amber);
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

.hl {
    color: var(--accent);
    font-weight: 700;
}

.about-section code {
    background: rgba(232, 168, 64, 0.08);
    border: 1px solid rgba(232, 168, 64, 0.12);
    border-radius: 6px;
    padding: 2px 7px;
    font-family: var(--fm);
    font-size: 0.85em;
    color: var(--amber2);
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

.fc-icon {
    color: var(--accent);
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
        rgba(232, 168, 64, 0.3) 0%,
        rgba(232, 168, 64, 0.08) 100%
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

.tl-dot {
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
}

.tl-dot-amber {
    background: var(--bg2);
    border: 2px solid var(--amber);
    color: var(--amber);
}

.tl-dot-green {
    background: var(--bg2);
    border: 2px solid var(--green);
    color: var(--green);
}

.tl-dot-red {
    background: var(--bg2);
    border: 2px solid var(--red);
    color: var(--red);
}

.timeline-item.open .tl-dot {
    transform: scale(1.15);
    box-shadow: 0 0 14px rgba(232, 168, 64, 0.25);
}

.tl-content {
    background: var(--bg3);
    border: 1px solid var(--border3);
    border-radius: var(--radius);
    overflow: hidden;
    cursor: pointer;
    transition: all 0.25s var(--ease);
}

.tl-content:hover {
    border-color: var(--border);
}

.timeline-item.open .tl-content {
    border-color: rgba(232, 168, 64, 0.25);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.tl-head {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
}

.tl-version {
    font-family: var(--fm);
    font-size: 0.7rem;
    font-weight: 800;
    padding: 2px 8px;
    background: rgba(232, 168, 64, 0.1);
    color: var(--amber);
    border-radius: 100px;
    border: 1px solid rgba(232, 168, 64, 0.15);
    flex-shrink: 0;
}

.tl-date {
    font-size: 0.7rem;
    color: var(--text3);
    font-family: var(--fm);
    flex-shrink: 0;
}

.tl-title {
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text);
    flex: 1;
}

.tl-arrow {
    color: var(--text3);
    transition: transform 0.25s var(--ease);
    flex-shrink: 0;
}

.tl-arrow.rotated {
    transform: rotate(180deg);
}

.tl-body {
    padding: 0 16px 14px;
}

.tl-body p {
    font-size: 0.85rem;
    line-height: 1.65;
    margin: 0;
}

/* ── Privacy Grid ─────────────────────────────────────────────────────── */
.privacy-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
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
        0 0 0 5px rgba(232, 168, 64, 0.25);
    position: relative;
}

.dev-card:hover .dev-avatar {
    transform: rotate(-6deg) scale(1.08);
    box-shadow:
        0 0 0 3px var(--bg2),
        0 0 0 5px rgba(232, 168, 64, 0.4),
        0 0 20px rgba(232, 168, 64, 0.15);
}

.dev-avatar-letter {
    font-family: var(--fu);
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--bg);
    line-height: 1;
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
    background: rgba(232, 168, 64, 0.08);
    color: var(--amber2);
    border: 1px solid rgba(232, 168, 64, 0.12);
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
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.15);
    border-radius: 50%;
    color: #ef4444;
    animation: badgePulse 3s ease-in-out infinite;
}

@keyframes badgePulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    50% { box-shadow: 0 0 20px 4px rgba(239, 68, 68, 0.1); }
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
.donation-section {
    text-align: center;
    padding: 48px 36px;
    position: relative;
    overflow: hidden;
    border-color: rgba(232, 168, 64, 0.15);
    background: linear-gradient(
        135deg,
        rgba(232, 168, 64, 0.03) 0%,
        var(--bg2) 50%,
        rgba(92, 184, 122, 0.02) 100%
    );
}

.donation-glow {
    position: absolute;
    top: -60px;
    left: 50%;
    transform: translateX(-50%);
    width: 300px;
    height: 300px;
    background: radial-gradient(
        circle,
        rgba(232, 168, 64, 0.06) 0%,
        transparent 70%
    );
    pointer-events: none;
    animation: glowPulse 4s ease-in-out infinite;
}

@keyframes glowPulse {
    0%,
    100% {
        opacity: 0.5;
        transform: translateX(-50%) scale(1);
    }
    50% {
        opacity: 1;
        transform: translateX(-50%) scale(1.1);
    }
}

.donation-content {
    position: relative;
    z-index: 1;
}

.donation-icon {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(232, 168, 64, 0.1);
    border: 1px solid rgba(232, 168, 64, 0.2);
    border-radius: 50%;
    color: var(--amber);
    margin: 0 auto 20px;
    animation: iconFloat 3s ease-in-out infinite;
}

@keyframes iconFloat {
    0%,
    100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-6px);
    }
}

.donation-section h2 {
    text-align: center;
}

.donation-section p {
    max-width: 520px;
    margin-left: auto;
    margin-right: auto;
}

.donation-actions {
    margin-top: 24px;
    margin-bottom: 20px;
    display: flex;
    justify-content: center;
}

.cta-donate {
    background: linear-gradient(135deg, #e85d75 0%, #c43a52 100%) !important;
    color: #fff !important;
    border: none !important;
    box-shadow: 0 4px 20px rgba(232, 93, 117, 0.25);
}

.cta-donate:hover {
    filter: brightness(1.1);
    box-shadow: 0 6px 28px rgba(232, 93, 117, 0.35);
    transform: translateY(-2px) !important;
}

.donation-thanks {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 0.82rem !important;
    color: var(--text3) !important;
    margin-top: 4px;
}

.donation-thanks :deep(svg) {
    color: var(--amber);
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
    color: var(--bg);
}

.cta-primary:hover {
    filter: brightness(1.12);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(232, 168, 64, 0.25);
}

.cta-secondary {
    background: rgba(232, 168, 64, 0.08);
    border: 1px solid rgba(232, 168, 64, 0.2);
    color: var(--amber2);
}

.cta-secondary:hover {
    background: rgba(232, 168, 64, 0.14);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

/* ── Stagger Animations ───────────────────────────────────────────────── */
.a-stagger-1 {
    animation: fadeSlideUp 0.5s var(--ease-snap) 0.05s both;
}
.a-stagger-2 {
    animation: fadeSlideUp 0.5s var(--ease-snap) 0.1s both;
}
.a-stagger-3 {
    animation: fadeSlideUp 0.5s var(--ease-snap) 0.15s both;
}
.a-stagger-4 {
    animation: fadeSlideUp 0.5s var(--ease-snap) 0.2s both;
}
.a-stagger-5 {
    animation: fadeSlideUp 0.5s var(--ease-snap) 0.25s both;
}
.a-stagger-6 {
    animation: fadeSlideUp 0.5s var(--ease-snap) 0.3s both;
}
.a-stagger-7 {
    animation: fadeSlideUp 0.5s var(--ease-snap) 0.35s both;
}
.a-stagger-8 {
    animation: fadeSlideUp 0.5s var(--ease-snap) 0.4s both;
}
.a-stagger-9 {
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

    .tl-dot {
        left: -34px;
        width: 24px;
        height: 24px;
    }

    .timeline-item::before {
        left: -23px;
    }

    .tl-head {
        flex-wrap: wrap;
        gap: 6px;
    }

    .tl-title {
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
.text-dim {
    color: var(--text3);
}
</style>
