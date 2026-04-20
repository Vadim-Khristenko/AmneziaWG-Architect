<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import { useRouter } from "vue-router";
import {
    Cpu,
    Settings2,
    RefreshCw,
    FileCode,
    Copy,
    Download,
    Eye,
    GitMerge,
    Zap,
    BookOpen,
    AlertTriangle,
    Network,
    Fingerprint,
    Info,
    ChevronDown,
    ShieldCheck,
    Box,
    VenetianMask,
    TrainFront,
    Cookie,
    Lock,
    Router,
    Gauge,
    Ban,
    TriangleAlert,
    Layers,
    History,
    Trash2,
    Check,
    X,
    ArrowRight,
    Clock,
    Sparkles,
    Clipboard,
    ClipboardCheck,
} from "lucide-vue-next";
import { useGenerator } from "@/composables/useGenerator";
import { YANDEX_UNSTABLE_PROFILES } from "@/utils/generator";
import type { AWGVersion, Intensity } from "@/utils/generator";

const router = useRouter();

const {
    version,
    intensity,
    config,
    currentAwg,
    iterCount,
    log,
    isGenerating,
    generate,
    setVersion,
    setIntensity,
    feedback,
    copyConfig,
    downloadConfig,
    plainText,
    previewLines,
    showCustomHost,
    isCPSSupported,
    isFullObfuscation,
    iterDots,
    hintMap,
    placeholderMap,
    isRouterMode,
    domainStatus,
    domainCheckedHost,
    checkSelectedDomain,
} = useGenerator();

const activeFaqIdx = ref<number | null>(null);
const copyFeedback = ref(false);
const copiedGroupKey = ref<string | null>(null);
const copiedParamKey = ref<string | null>(null);
const justGenerated = ref(false);

const isYandexUnstable = () =>
    config.useBrowserFp &&
    YANDEX_UNSTABLE_PROFILES.includes(config.browserProfile as any);

const openMergeKeys = (tab: "update" | "merge") => {
    // Write current AWG config to sessionStorage so MergeKeys can pick it up
    const awg = currentAwg.value;
    if (awg) {
        const payload = {
            cfg: {
                jc: awg.jc,
                jmin: awg.jmin,
                jmax: awg.jmax,
                i1: awg.i1,
                i2: awg.i2,
                i3: awg.i3,
                i4: awg.i4,
                i5: awg.i5,
            },
            ver: version.value,
        };
        try {
            sessionStorage.setItem("awg_pending_cfg", JSON.stringify(payload));
        } catch {
            /* quota exceeded — ignore */
        }
    }
    router.push({ path: "/mergekeys", query: { tab } });
};

/* ── Generation History ───────────────────────────────────────────────── */

interface HistoryEntry {
    id: number;
    timestamp: number;
    version: string;
    intensity: string;
    profile: string;
    text: string;
    params: Record<string, string | number>;
}

const historyEntries = ref<HistoryEntry[]>([]);
const showHistory = ref(false);
const showKnowledgeBase = ref(false);
let historyIdCounter = 0;

function saveToHistory() {
    if (!currentAwg.value || !plainText.value) return;
    const awg = currentAwg.value;
    const v = version.value;
    const params: Record<string, string | number> = {
        Jc: awg.jc,
        Jmin: awg.jmin,
        Jmax: awg.jmax,
        S1: awg.s1,
        S2: awg.s2,
    };

    if (v === "2.0") {
        params.S3 = awg.s3 ?? 0;
        params.S4 = awg.s4 ?? 0;
        params.H1 = awg.h1;
        params.H2 = awg.h2;
        params.H3 = awg.h3;
        params.H4 = awg.h4;
    } else {
        params.H1 = awg.h1s;
        params.H2 = awg.h2s;
        params.H3 = awg.h3s;
        params.H4 = awg.h4s;
    }

    if (v !== "1.0") {
        params.I1 = awg.i1;
        params.I2 = awg.i2;
        params.I3 = awg.i3;
        params.I4 = awg.i4;
        params.I5 = awg.i5;
    }

    const entry: HistoryEntry = {
        id: ++historyIdCounter,
        timestamp: Date.now(),
        version: version.value,
        intensity: intensity.value,
        profile: config.profile,
        text: plainText.value,
        params,
    };
    historyEntries.value.unshift(entry);
    if (historyEntries.value.length > 20) {
        historyEntries.value = historyEntries.value.slice(0, 20);
    }
}

function generateAndSave() {
    generate();
    justGenerated.value = true;
    setTimeout(() => {
        justGenerated.value = false;
    }, 800);
    nextTick(() => {
        setTimeout(() => saveToHistory(), 20);
    });
}

function restoreFromHistory(entry: HistoryEntry) {
    navigator.clipboard?.writeText(entry.text).catch(() => {});
    showHistory.value = false;
}

function removeHistoryEntry(id: number) {
    historyEntries.value = historyEntries.value.filter((e) => e.id !== id);
}

function clearHistory() {
    historyEntries.value = [];
}

function formatTime(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

/* ── Copy with feedback ────────────────────────────────────────────────── */

async function handleCopy() {
    const ok = await copyConfig();
    if (ok) {
        copyFeedback.value = true;
        setTimeout(() => {
            copyFeedback.value = false;
        }, 2000);
    }
}

async function copyGroupToClipboard(groupKey: string, text: string) {
    try {
        await navigator.clipboard.writeText(text);
        copiedGroupKey.value = groupKey;
        setTimeout(() => {
            copiedGroupKey.value = null;
        }, 1500);
    } catch {
        /* noop */
    }
}

async function copySingleParam(key: string, value: string | number) {
    try {
        await navigator.clipboard.writeText(`${key} = ${value}`);
        copiedParamKey.value = key;
        setTimeout(() => {
            copiedParamKey.value = null;
        }, 1200);
    } catch {
        /* noop */
    }
}

/* ── Grouped params computed ───────────────────────────────────────────── */

interface ParamItem {
    label: string;
    value: string | number;
    wide?: boolean;
}

interface ParamGroup {
    key: string;
    title: string;
    icon: string;
    items: ParamItem[];
    copyText: string;
}

const paramGroups = computed((): ParamGroup[] => {
    const p = currentAwg.value;
    if (!p) return [];
    const v = version.value;
    const groups: ParamGroup[] = [];

    // Junk Train
    const junkItems: ParamItem[] = [
        { label: "Jc", value: p.jc },
        { label: "Jmin", value: p.jmin },
        { label: "Jmax", value: p.jmax },
    ];
    groups.push({
        key: "junk",
        title: "Junk Train",
        icon: "🚂",
        items: junkItems,
        copyText: junkItems.map((i) => `${i.label} = ${i.value}`).join("\n"),
    });

    // Packet Sizes
    const sizeItems: ParamItem[] = [
        { label: "S1", value: p.s1 },
        { label: "S2", value: p.s2 },
    ];
    if (v === "2.0") {
        sizeItems.push({ label: "S3", value: p.s3 ?? 0 });
        sizeItems.push({ label: "S4", value: p.s4 ?? 0 });
    }
    groups.push({
        key: "sizes",
        title: "Размеры пакетов",
        icon: "📦",
        items: sizeItems,
        copyText: sizeItems.map((i) => `${i.label} = ${i.value}`).join("\n"),
    });

    // Headers — always wide so large numbers / ranges are fully visible
    const headerItems: ParamItem[] = [];
    if (v === "2.0") {
        headerItems.push(
            { label: "H1", value: p.h1, wide: true },
            { label: "H2", value: p.h2, wide: true },
            { label: "H3", value: p.h3, wide: true },
            { label: "H4", value: p.h4, wide: true },
        );
    } else {
        headerItems.push(
            { label: "H1", value: p.h1s, wide: true },
            { label: "H2", value: p.h2s, wide: true },
            { label: "H3", value: p.h3s, wide: true },
            { label: "H4", value: p.h4s, wide: true },
        );
    }
    groups.push({
        key: "headers",
        title: "Заголовки",
        icon: "🔑",
        items: headerItems,
        copyText: headerItems.map((i) => `${i.label} = ${i.value}`).join("\n"),
    });

    // CPS Signatures
    if (v !== "1.0") {
        const cpsItems: ParamItem[] = [
            { label: "I1", value: p.i1, wide: true },
            { label: "I2", value: p.i2, wide: true },
            { label: "I3", value: p.i3, wide: true },
            { label: "I4", value: p.i4, wide: true },
            { label: "I5", value: p.i5, wide: true },
        ];
        groups.push({
            key: "cps",
            title: v === "1.5" ? "CPS (только клиент)" : "CPS Signatures",
            icon: "🎭",
            items: cpsItems,
            copyText: cpsItems.map((i) => `${i.label} = ${i.value}`).join("\n"),
        });
    }

    return groups;
});

// ── FAQ data ───────────────────────────────────────────────────────────────

const faqItems = [
    {
        icon: AlertTriangle,
        title: "Важное ограничение — когда обфускация не помогает",
        body: `<p>Обфускация параметров (H1–H4, S1–S4, I1–I5) позволяет скрыть
<strong>тип трафика</strong> от систем глубокой инспекции пакетов (DPI).
Однако она не влияет на доступность по <strong>IP-адресу сервера</strong>.</p>
<p>Существует два принципиально разных метода блокировки:</p>
<ul>
<li><strong>DPI-блокировка</strong> — анализирует структуру пакетов. Здесь
обфускация AWG работает в полную силу: DPI «видит» QUIC, TLS или SIP,
а не WireGuard.</li>
<li><strong>Блокировка по IP-адресу / «белые списки»</strong> — если провайдер
полностью запрещает весь внешний трафик кроме явно разрешённых IP-адресов
(или отключает внешний интернет), обфускация бессильна.</li>
</ul>`,
    },
    {
        icon: ShieldCheck,
        title: "Динамические заголовки H1–H4",
        body: `<p>WireGuard идентифицирует тип каждого пакета по первым байтам:
<code>0x01</code> = Init, <code>0x02</code> = Response, <code>0x03</code> = Cookie Reply,
<code>0x04</code> = Data. DPI-системы давно научились распознавать этот паттерн.</p>
<p>AmneziaWG заменяет предсказуемые идентификаторы случайными значениями
из заданных диапазонов:</p>
<ul>
<li><strong>H1</strong> — Init (инициализация хендшейка)</li>
<li><strong>H2</strong> — Response (ответ сервера)</li>
<li><strong>H3</strong> — Cookie Reply (защита от DoS)</li>
<li><strong>H4</strong> — Data (передача данных)</li>
</ul>
<p>При старте тоннеля для каждого из 4 типов выбирается случайное число
из заданного диапазона. Благодаря этому заголовок становится непредсказуемым для DPI.</p>`,
    },
    {
        icon: Box,
        title: "Рандомизация длин S1–S4",
        body: `<p>В классическом WireGuard длина каждого типа пакета строго фиксирована.
Это делает WireGuard тривиально идентифицируемым по статистике размеров пакетов.</p>
<p>AmneziaWG добавляет псевдослучайный префикс к каждому типу пакетов:</p>
<ul>
<li><code>len(init) = 148 + random(0..S1)</code></li>
<li><code>len(resp) = 92 + random(0..S2)</code></li>
<li><code>len(cookie) = 64 + random(1..S3)</code></li>
<li><code>len(data) = payload + random(1..S4)</code></li>
</ul>
<p><strong>Ограничения:</strong> <code>S1 + 56 ≠ S2</code> и <code>S4 ≤ 32</code>.
Генератор проверяет эти правила автоматически.</p>`,
    },
    {
        icon: VenetianMask,
        title: "Сигнатуры CPS (I1–I5) — Custom Protocol Signature",
        body: `<p>Перед отправкой первого реального пакета хендшейка
клиент может послать до пяти кастомных UDP-пакетов, описанных в формате CPS.
Главный — <strong>I1</strong> — содержит «снимок» реального протокола
(например, QUIC Initial handshake). Остальные I2–I5 наращивают энтропию.</p>
<p><strong>Типы тегов:</strong></p>
<ul>
<li><code>&lt;b 0x...&gt;</code> — статические байты</li>
<li><code>&lt;c&gt;</code> — счётчик пакетов (32-bit)</li>
<li><code>&lt;t&gt;</code> — Unix timestamp (32-bit)</li>
<li><code>&lt;r N&gt;</code> — криптостойкие случайные байты</li>
<li><code>&lt;rc N&gt;</code> — случайные ASCII-символы</li>
<li><code>&lt;rd N&gt;</code> — случайные десятичные цифры</li>
</ul>
<p class="notice">⚠ Тег <code>&lt;c&gt;</code> может вызывать <strong>ErrorCode 1000</strong>
в старых версиях AWG-go.</p>`,
    },
    {
        icon: TrainFront,
        title: "Junk-train (Jc, Jmin, Jmax)",
        body: `<p>Сразу после отправки CPS-цепочки следует серия из
<strong>Jc</strong> псевдослучайных пакетов, длина каждого — случайное число
в диапазоне от <strong>Jmin</strong> до <strong>Jmax</strong> байт.</p>
<p>Цель — <strong>размыть временной и размерный профиль</strong> старта сессии.</p>
<ul>
<li>Jc = 3–7 — оптимальный баланс</li>
<li>Jc > 10 — замедляет установку соединения</li>
<li>Для AWG 1.0: Jc ≥ 4 и Jmax > 81</li>
</ul>`,
    },
    {
        icon: VenetianMask,
        title: "Профили мимикрии — как работает маскировка",
        body: `<p>DPI-системы анализируют первые байты соединения. Профили мимикрии подделывают
структуру пакетов под популярные протоколы:</p>
<ul>
<li><strong>QUIC Initial</strong> — наиболее надёжный в 2026 году</li>
<li><strong>QUIC 0-RTT</strong> — Early Data при возобновлении сессии</li>
<li><strong>TLS 1.3 Client Hello</strong> — HTTPS-подобный трафик</li>
<li><strong>DTLS 1.3</strong> — WebRTC/STUN рукопожатие</li>
<li><strong>HTTP/3</strong> — расширенный набор QUIC-типов</li>
<li><strong>SIP</strong> — VoIP-сигнализация</li>
<li><strong>WireGuard Noise_IK</strong> — без мимикрии, с BFP-паддингом</li>
</ul>`,
    },
    {
        icon: Cookie,
        title: "Пакет Cookie Reply (H3, S3)",
        body: `<p>Cookie Reply используется для защиты от DoS-атак.
AmneziaWG маскирует его аналогично другим типам пакетов:</p>
<ul>
<li>Тип сообщения заменяется на случайное значение из диапазона <strong>H3</strong></li>
<li>Добавляется случайный префикс длиной 1..<strong>S3</strong> байт</li>
</ul>
<p>Поддерживается только в AWG 2.0.</p>`,
    },
    {
        icon: Lock,
        title: "Безопасность и аудит",
        body: `<p>Криптографически AmneziaWG идентичен оригинальному WireGuard:
<strong>Curve25519</strong>, <strong>ChaCha20-Poly1305</strong>,
<strong>Noise_IK</strong>, <strong>BLAKE2s</strong>.</p>
<p>Обфускация работает исключительно на транспортном уровне — зашифрованная
полезная нагрузка остаётся нетронутой. Все результаты аудитов WireGuard
применимы к AmneziaWG.</p>`,
    },
    {
        icon: Router,
        title: "Настройка на роутерах",
        body: `<ul>
<li><strong>Keenetic</strong> — через OPKG-пакет <code>amneziawg-go</code></li>
<li><strong>OpenWrt</strong> — пакеты <code>kmod-amneziawg</code> и <code>amneziawg-tools</code></li>
<li><strong>MikroTik</strong> — нет нативной поддержки, нужна Linux VM</li>
</ul>
<p>При настройке на роутере рекомендуется MTU 1280–1360 байт.</p>`,
    },
    {
        icon: ShieldCheck,
        title: "Совместимость с обычным WireGuard",
        body: `<p>Клиент AWG с включённой обфускацией <strong>не подключится</strong>
к стандартному WireGuard-серверу. Однако если выставить все параметры в ноль —
AWG-клиент будет вести себя как обычный WireGuard.</p>
<p>Обратная совместимость: стандартный WireGuard-клиент не сможет подключиться
к AWG-серверу с обфускацией.</p>`,
    },
    {
        icon: Gauge,
        title: "Что делать, если скорость упала?",
        body: `<ol>
<li>Уменьшите Junk-train (Jc до 3 или 0)</li>
<li>Проверьте MTU (попробуйте 1280 или 1360)</li>
<li>Снизьте интенсивность (HIGH → MEDIUM)</li>
<li>Попробуйте другой профиль мимикрии</li>
<li>Отключите Browser Fingerprint</li>
</ol>`,
    },
];
</script>

<template>
    <div class="home-page fade-in">
        <div class="container">
            <!-- ── Hero ────────────────────────────────────────────────── -->
            <header class="hero">
                <div class="hero-badge badge badge-amber">
                    <Sparkles :size="12" /> AWG 2.0 READY
                </div>
                <h1 class="hero-title">
                    <span class="hero-brand">AmneziaWG</span>
                    <span class="hero-accent">Architect</span>
                </h1>
                <p class="hero-desc">
                    Генератор продвинутой обфускации для обхода DPI. Всё
                    работает в браузере — данные не покидают устройство.
                </p>
            </header>

            <!-- ── Version Tabs ────────────────────────────────────────── -->
            <div class="version-bar">
                <div class="ver-tabs">
                    <button
                        class="ver-tab"
                        :class="{ active: version === '2.0' }"
                        @click="setVersion('2.0' as AWGVersion)"
                    >
                        <Layers :size="14" />
                        <span>AWG 2.0</span>
                    </button>
                    <button
                        class="ver-tab"
                        :class="{ active: version === '1.5' }"
                        @click="setVersion('1.5' as AWGVersion)"
                    >
                        <span>AWG 1.5</span>
                    </button>
                    <button
                        class="ver-tab"
                        :class="{ active: version === '1.0' }"
                        @click="setVersion('1.0' as AWGVersion)"
                    >
                        <span>AWG 1.0</span>
                    </button>
                </div>

                <button
                    class="history-toggle btn btn-ghost btn-icon"
                    :class="{ active: showHistory }"
                    @click="showHistory = !showHistory"
                    data-tooltip="История генераций"
                >
                    <History :size="18" />
                    <span v-if="historyEntries.length" class="history-count">{{
                        historyEntries.length
                    }}</span>
                </button>
            </div>

            <!-- ── Version Notices ─────────────────────────────────────── -->
            <transition name="fade">
                <div v-if="version === '1.0'" class="alert alert-warn">
                    <TriangleAlert :size="16" class="alert-icon" />
                    <div class="alert-content">
                        <b>AWG 1.0:</b> S3, S4 и CPS (I1–I5) не поддерживаются.
                        Jc рекомендуется ≥ 4, Jmax&nbsp;>&nbsp;81.
                    </div>
                </div>
            </transition>

            <transition name="fade">
                <div v-if="version === '1.5'" class="alert alert-info">
                    <Info :size="16" class="alert-icon" />
                    <div class="alert-content">
                        <b>AWG 1.5:</b> S3, S4 не поддерживаются. I1–I5 работают
                        только на стороне клиента.
                    </div>
                </div>
            </transition>

            <!-- ── History Panel ────────────────────────────────────────── -->
            <transition name="expand">
                <div v-if="showHistory" class="history-panel">
                    <div class="history-header">
                        <div class="history-header-left">
                            <History :size="16" />
                            <span class="history-title">История генераций</span>
                            <span class="badge badge-amber">{{
                                historyEntries.length
                            }}</span>
                        </div>
                        <button
                            v-if="historyEntries.length"
                            class="btn btn-ghost btn-icon sm"
                            @click="clearHistory"
                            data-tooltip="Очистить историю"
                        >
                            <Trash2 :size="14" />
                        </button>
                    </div>

                    <div v-if="!historyEntries.length" class="history-empty">
                        <Clock :size="20" />
                        <span
                            >Пока нет генераций. Нажмите «Сгенерировать» чтобы
                            начать.</span
                        >
                    </div>

                    <div v-else class="history-list">
                        <transition-group
                            name="hist-item"
                            tag="div"
                            class="history-list-inner"
                        >
                            <div
                                v-for="entry in historyEntries"
                                :key="entry.id"
                                class="history-entry"
                            >
                                <div class="he-info">
                                    <span class="he-time">{{
                                        formatTime(entry.timestamp)
                                    }}</span>
                                    <span class="he-tags">
                                        <span class="he-tag">{{
                                            entry.version
                                        }}</span>
                                        <span class="he-tag">{{
                                            entry.intensity
                                        }}</span>
                                        <span class="he-tag">{{
                                            entry.profile
                                        }}</span>
                                    </span>
                                </div>
                                <div class="he-params">
                                    <span
                                        v-for="(val, key) in entry.params"
                                        :key="key"
                                        class="he-param"
                                        :class="{
                                            'he-param-wide':
                                                String(val).length > 20,
                                        }"
                                    >
                                        <span class="he-param-k">{{
                                            key
                                        }}</span>
                                        <span
                                            class="he-param-v"
                                            :title="String(val)"
                                            >{{
                                                String(val).length > 30
                                                    ? String(val).slice(0, 27) +
                                                      "…"
                                                    : val
                                            }}</span
                                        >
                                    </span>
                                </div>
                                <div class="he-actions">
                                    <button
                                        class="btn btn-ghost btn-icon sm"
                                        @click="restoreFromHistory(entry)"
                                        data-tooltip="Копировать конфиг"
                                    >
                                        <Copy :size="14" />
                                    </button>
                                    <button
                                        class="btn btn-ghost btn-icon sm"
                                        @click="removeHistoryEntry(entry.id)"
                                        data-tooltip="Удалить"
                                    >
                                        <X :size="14" />
                                    </button>
                                </div>
                            </div>
                        </transition-group>
                    </div>
                </div>
            </transition>

            <!-- ══════════════════════════════════════════════════════════
                 MAIN LAYOUT
                 Controls | Output
                 ══════════════════════════════════════════════════════════ -->
            <div class="main-grid">
                <!-- ── LEFT: Controls Panel ────────────────────────────── -->
                <div class="panel panel-controls">
                    <div class="panel-head">
                        <Settings2 :size="16" class="text-accent" />
                        <span class="panel-title">Параметры</span>
                    </div>

                    <div class="panel-body">
                        <!-- Profile Select -->
                        <div class="field-group">
                            <label class="field-label">Профиль мимикрии</label>
                            <select
                                v-model="config.profile"
                                class="select-field"
                                @change="generate"
                            >
                                <option value="quic_initial">
                                    QUIC Initial (RFC 9000)
                                </option>
                                <option value="quic_0rtt">
                                    QUIC 0-RTT (Early Data)
                                </option>
                                <option value="tls_client_hello">
                                    TLS 1.3 Client Hello
                                </option>
                                <option value="wireguard_noise">
                                    Noise_IK (Standard)
                                </option>
                                <option value="dtls">DTLS 1.3 Handshake</option>
                                <option value="http3">
                                    HTTP/3 Host Mimicry
                                </option>
                                <option value="sip">
                                    SIP (VoIP Signaling)
                                </option>
                                <option value="tls_to_quic">
                                    TLS → QUIC (Alt-Svc)
                                </option>
                                <option value="quic_burst">
                                    QUIC Burst (Multi-packet)
                                </option>
                                <option value="dns_query">
                                    DNS Query (UDP 53)
                                </option>
                                <option value="random">
                                    🎲 Случайный выбор
                                </option>
                            </select>
                        </div>

                        <!-- Custom Host -->
                        <transition name="expand">
                            <div v-if="showCustomHost" class="field-group">
                                <div class="host-row">
                                    <input
                                        type="text"
                                        v-model="config.customHost"
                                        class="input-field"
                                        :placeholder="
                                            placeholderMap[config.profile]
                                        "
                                        @input="generate"
                                    />
                                    <button
                                        class="btn btn-ghost btn-icon sm"
                                        @click="checkSelectedDomain"
                                        title="Проверить доступность домена"
                                    >
                                        <ShieldCheck :size="14" />
                                    </button>
                                    <span
                                        v-if="domainStatus !== 'idle'"
                                        class="domain-dot"
                                        :class="domainStatus"
                                    />
                                </div>
                                <div class="field-hint">
                                    {{ hintMap[config.profile] }}
                                </div>
                            </div>
                        </transition>

                        <!-- Mimic All -->
                        <label class="toggle-row">
                            <input
                                type="checkbox"
                                v-model="config.mimicAll"
                                @change="generate"
                            />
                            <span>Применять профиль для I2–I5</span>
                        </label>

                        <!-- Separator -->
                        <hr class="divider" />

                        <!-- CPS Tags -->
                        <div v-if="isCPSSupported" class="field-group">
                            <label class="field-label"
                                >Теги в цепочке CPS</label
                            >
                            <div class="tags-grid">
                                <label class="toggle-row compact">
                                    <input
                                        type="checkbox"
                                        v-model="config.useTagC"
                                        @change="generate"
                                    />
                                    <span>&lt;c&gt;</span>
                                </label>
                                <label class="toggle-row compact">
                                    <input
                                        type="checkbox"
                                        v-model="config.useTagT"
                                        @change="generate"
                                    />
                                    <span>&lt;t&gt;</span>
                                </label>
                                <label class="toggle-row compact">
                                    <input
                                        type="checkbox"
                                        v-model="config.useTagR"
                                        @change="generate"
                                    />
                                    <span>&lt;r&gt;</span>
                                </label>
                                <label class="toggle-row compact">
                                    <input
                                        type="checkbox"
                                        v-model="config.useTagRC"
                                        @change="generate"
                                    />
                                    <span>&lt;rc&gt;</span>
                                </label>
                                <label class="toggle-row compact">
                                    <input
                                        type="checkbox"
                                        v-model="config.useTagRD"
                                        @change="generate"
                                    />
                                    <span>&lt;rd&gt;</span>
                                </label>
                            </div>
                            <div class="alert alert-info small-alert mt-2">
                                <Info :size="12" class="alert-icon" />
                                <div class="alert-content">
                                    Тег <code>&lt;c&gt;</code> может вызывать
                                    <b>ErrorCode 1000</b> в старых версиях.
                                </div>
                            </div>
                        </div>

                        <div v-else class="alert alert-error mt-2">
                            <Ban :size="14" class="alert-icon" />
                            <div class="alert-content">
                                CPS (I1–I5) недоступен в AWG 1.0
                            </div>
                        </div>

                        <!-- Browser FP -->
                        <div v-if="isCPSSupported" class="field-group">
                            <div class="field-label-row">
                                <Fingerprint :size="14" class="text-accent" />
                                <label class="field-label"
                                    >Браузерный отпечаток</label
                                >
                            </div>
                            <label class="toggle-row">
                                <input
                                    type="checkbox"
                                    v-model="config.useBrowserFp"
                                    @change="generate"
                                />
                                <span>Имитировать размер пакетов</span>
                            </label>

                            <transition name="expand">
                                <div v-if="config.useBrowserFp" class="mt-2">
                                    <select
                                        v-model="config.browserProfile"
                                        class="select-field"
                                        @change="generate"
                                    >
                                        <option value="chrome">Chrome</option>
                                        <option value="firefox">Firefox</option>
                                        <option value="safari">Safari</option>
                                        <option value="edge">Edge</option>
                                        <option value="yandex_desktop">
                                            Яндекс Браузер Desktop ⚠
                                        </option>
                                        <option value="yandex_mobile">
                                            Яндекс Браузер Mobile ⚠
                                        </option>
                                    </select>
                                    <transition name="fade">
                                        <div
                                            v-if="isYandexUnstable()"
                                            class="alert alert-warn small-alert mt-2"
                                        >
                                            <TriangleAlert
                                                :size="12"
                                                class="alert-icon"
                                            />
                                            <div class="alert-content">
                                                Профиль Яндекс Браузера
                                                нестабилен.
                                            </div>
                                        </div>
                                    </transition>
                                </div>
                            </transition>
                        </div>

                        <hr class="divider" />

                        <!-- MTU -->
                        <div v-if="isCPSSupported" class="field-group">
                            <div class="field-label-row">
                                <Network :size="14" class="text-accent" />
                                <label class="field-label"
                                    >MTU интерфейса</label
                                >
                            </div>
                            <div class="mtu-row">
                                <input
                                    type="number"
                                    v-model.number="config.mtu"
                                    class="input-field mtu-input"
                                    min="576"
                                    max="9000"
                                    @input="generate"
                                />
                                <div class="mtu-presets">
                                    <button
                                        class="preset-btn"
                                        :class="{ active: config.mtu === 1500 }"
                                        @click="
                                            config.mtu = 1500;
                                            generate();
                                        "
                                    >
                                        1500
                                    </button>
                                    <button
                                        class="preset-btn"
                                        :class="{ active: config.mtu === 1420 }"
                                        @click="
                                            config.mtu = 1420;
                                            generate();
                                        "
                                    >
                                        1420
                                    </button>
                                    <button
                                        class="preset-btn"
                                        :class="{ active: config.mtu === 1280 }"
                                        @click="
                                            config.mtu = 1280;
                                            generate();
                                        "
                                    >
                                        1280
                                    </button>
                                </div>
                            </div>
                            <div class="field-hint">
                                1500 = Ethernet · 1420 = WG/PPPoE · 1280 = min
                                IPv6
                            </div>
                        </div>

                        <!-- Intensity -->
                        <div class="field-group">
                            <label class="field-label">Энтропия</label>
                            <div class="intensity-bar">
                                <button
                                    class="int-btn"
                                    :class="{ active: intensity === 'low' }"
                                    @click="setIntensity('low' as Intensity)"
                                >
                                    LOW
                                </button>
                                <button
                                    class="int-btn"
                                    :class="{ active: intensity === 'medium' }"
                                    @click="setIntensity('medium' as Intensity)"
                                >
                                    MED
                                </button>
                                <button
                                    class="int-btn"
                                    :class="{ active: intensity === 'high' }"
                                    @click="setIntensity('high' as Intensity)"
                                >
                                    HIGH
                                </button>
                            </div>
                        </div>

                        <!-- Junk Level -->
                        <div class="field-group">
                            <label class="field-label">Junk-train (Jc)</label>
                            <select
                                v-model.number="config.junkLevel"
                                class="select-field"
                                @change="generate"
                            >
                                <option :value="0">0 — Отключено</option>
                                <option :value="3">3 — Оптимально</option>
                                <option :value="5">5 — Рекомендуемо ✓</option>
                                <option :value="7">7 — Усиленный</option>
                                <option :value="10">10 — Максимальный</option>
                            </select>
                        </div>

                        <!-- Extreme Maximum Mode -->
                        <div class="field-group">
                            <label class="field-label">
                                <Gauge :size="14" class="icon-inline" />
                                Экстремальные максимумы
                            </label>
                            <label class="toggle-check">
                                <input
                                    type="checkbox"
                                    v-model="config.useExtremeMax"
                                    @change="generate"
                                />
                                <span class="toggle-label"
                                    >Использовать предельные значения параметров</span
                                >
                            </label>
                            <transition name="fade">
                                <div
                                    v-if="config.useExtremeMax"
                                    class="alert alert-warn small-alert"
                                >
                                    <TriangleAlert :size="14" />
                                    <div>
                                        <b>Extreme mode:</b> Jc до 128, S3 до 256, S4 до 128, H1-H4 разброс 10M.
                                        Может увеличить оверхед трафика.
                                    </div>
                                </div>
                            </transition>
                        </div>

                        <!-- Router Mode -->
                        <div class="field-group">
                            <label class="field-label">
                                <Router :size="14" class="icon-inline" />
                                Режим роутера
                            </label>
                            <label class="toggle-check">
                                <input
                                    type="checkbox"
                                    v-model="config.routerMode"
                                    @change="generate"
                                />
                                <span class="toggle-label"
                                    >Ограничить нагрузку для роутеров</span
                                >
                            </label>
                            <transition name="fade">
                                <div
                                    v-if="config.routerMode"
                                    class="alert alert-warn small-alert"
                                >
                                    <TriangleAlert :size="14" />
                                    <div>
                                        <b>Режим роутера:</b> Jc ≤ 3, Jmax ≤
                                        128, I2–I5 отключены. Для слабых
                                        устройств: NanoPi, Keenetic, OpenWrt.
                                    </div>
                                </div>
                            </transition>
                        </div>

                        <!-- Generate Button -->
                        <button
                            class="btn btn-primary w-full gen-btn mt-4"
                            :class="{ shimmer: isGenerating }"
                            @click="generateAndSave"
                        >
                            <RefreshCw
                                :size="18"
                                :class="{ 'spin-anim': isGenerating }"
                            />
                            Сгенерировать
                        </button>

                        <!-- Feedback -->
                        <div v-if="currentAwg" class="feedback-row">
                            <div class="iter-dots">
                                <span
                                    v-for="(dot, i) in iterDots"
                                    :key="i"
                                    class="idot"
                                    :class="{
                                        filled: dot.filled && !dot.critical,
                                        critical: dot.filled && dot.critical,
                                    }"
                                ></span>
                            </div>
                            <div class="fb-btns">
                                <button
                                    class="btn btn-secondary fb-ok"
                                    @click="feedback(true)"
                                >
                                    <Check :size="14" /> Работает
                                </button>
                                <button
                                    class="btn btn-secondary fb-bad"
                                    @click="feedback(false)"
                                >
                                    <X :size="14" /> Не работает
                                </button>
                            </div>
                        </div>

                        <!-- Log -->
                        <div v-if="log.length" class="gen-log">
                            <div
                                v-for="(entry, i) in log"
                                :key="i"
                                class="log-line"
                                :class="`log-${entry.type}`"
                            >
                                {{ entry.msg }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ── CENTER: Output Panel ────────────────────────────── -->
                <div class="panel panel-output">
                    <!-- ── Configuration (grouped params + actions) ─────── -->
                    <div
                        class="output-card"
                        :class="{ 'just-generated': justGenerated }"
                    >
                        <div class="output-head">
                            <div class="output-head-left">
                                <FileCode :size="16" class="text-accent" />
                                <span class="panel-title">Конфигурация</span>
                                <span v-if="currentAwg" class="version-chip"
                                    >AWG {{ version }}</span
                                >
                            </div>
                            <div class="output-head-actions">
                                <button
                                    class="btn btn-ghost btn-icon sm"
                                    :class="{ 'copy-ok': copyFeedback }"
                                    @click="handleCopy"
                                    data-tooltip="Копировать всё"
                                >
                                    <ClipboardCheck
                                        v-if="copyFeedback"
                                        :size="16"
                                    />
                                    <Clipboard v-else :size="16" />
                                </button>
                                <button
                                    class="btn btn-ghost btn-icon sm"
                                    @click="downloadConfig"
                                    data-tooltip="Скачать .conf"
                                >
                                    <Download :size="16" />
                                </button>
                            </div>
                        </div>

                        <!-- Grouped Parameter Cards -->
                        <div class="config-body">
                            <div v-if="!currentAwg" class="output-placeholder">
                                <div class="placeholder-line w80"></div>
                                <div class="placeholder-line w60"></div>
                                <div class="placeholder-line w70"></div>
                                <div class="placeholder-line w50"></div>
                                <div class="placeholder-line w65"></div>
                            </div>

                            <template v-else>
                                <div
                                    v-for="(group, gi) in paramGroups"
                                    :key="group.key"
                                    class="param-group"
                                    :style="{ animationDelay: `${gi * 60}ms` }"
                                >
                                    <div class="param-group-head">
                                        <div class="param-group-title">
                                            <span class="param-group-icon">{{
                                                group.icon
                                            }}</span>
                                            <span>{{ group.title }}</span>
                                        </div>
                                        <button
                                            class="btn btn-ghost btn-icon xs"
                                            :class="{
                                                'copy-ok':
                                                    copiedGroupKey ===
                                                    group.key,
                                            }"
                                            @click="
                                                copyGroupToClipboard(
                                                    group.key,
                                                    group.copyText,
                                                )
                                            "
                                            :data-tooltip="
                                                copiedGroupKey === group.key
                                                    ? 'Скопировано!'
                                                    : 'Копировать группу'
                                            "
                                        >
                                            <ClipboardCheck
                                                v-if="
                                                    copiedGroupKey === group.key
                                                "
                                                :size="13"
                                            />
                                            <Copy v-else :size="13" />
                                        </button>
                                    </div>
                                    <div
                                        class="param-group-grid"
                                        :class="{
                                            'has-wide': group.items.some(
                                                (i) => i.wide,
                                            ),
                                            'is-cps': group.key === 'cps',
                                        }"
                                    >
                                        <div
                                            v-for="item in group.items"
                                            :key="item.label"
                                            class="param-cell"
                                            :class="{
                                                'param-cell-wide': item.wide,
                                                'param-cell-compact':
                                                    !item.wide,
                                                'param-cell-cps':
                                                    group.key === 'cps',
                                            }"
                                            @click="
                                                copySingleParam(
                                                    item.label,
                                                    item.value,
                                                )
                                            "
                                            :title="`Нажмите чтобы скопировать ${item.label}`"
                                        >
                                            <span class="param-cell-label">{{
                                                item.label
                                            }}</span>
                                            <span
                                                class="param-cell-value"
                                                :class="{
                                                    'param-long':
                                                        String(item.value)
                                                            .length > 40 &&
                                                        group.key !== 'cps',
                                                    'param-cps-value':
                                                        group.key === 'cps',
                                                    'param-copied':
                                                        copiedParamKey ===
                                                        item.label,
                                                }"
                                                >{{ item.value }}</span
                                            >
                                            <span
                                                v-if="
                                                    copiedParamKey ===
                                                    item.label
                                                "
                                                class="param-copied-badge"
                                                >✓</span
                                            >
                                        </div>
                                    </div>
                                </div>

                                <!-- Copy All / Download row -->
                                <div class="config-actions-row">
                                    <button
                                        class="btn btn-secondary config-action-btn"
                                        :class="{ 'copy-ok': copyFeedback }"
                                        @click="handleCopy"
                                    >
                                        <ClipboardCheck
                                            v-if="copyFeedback"
                                            :size="15"
                                        />
                                        <Copy v-else :size="15" />
                                        {{
                                            copyFeedback
                                                ? "Скопировано!"
                                                : "Копировать конфиг"
                                        }}
                                    </button>
                                    <button
                                        class="btn btn-primary config-action-btn"
                                        @click="downloadConfig"
                                    >
                                        <Download :size="15" />
                                        Скачать .conf
                                    </button>
                                </div>
                            </template>
                        </div>
                    </div>

                    <!-- Preview Config File -->
                    <div class="preview-card">
                        <div class="preview-head">
                            <Eye :size="14" class="text-accent" />
                            <span class="panel-title"
                                >Превью конфигурационного файла</span
                            >
                        </div>
                        <pre
                            class="preview-code"
                        ><template v-if="previewLines.length"><span v-for="(line, i) in previewLines" :key="i" class="preview-line" :class="line.type">{{ line.type === 'kv' ? `${line.key} = ${line.value}` : line.value }}
</span></template><template v-else><span class="text-dim">// Ожидание генерации...</span></template></pre>
                    </div>
                </div>
            </div>

            <!-- ── MergeKeys CTA ───────────────────────────────────────── -->
            <div class="merge-banner">
                <div class="merge-banner-content">
                    <div class="merge-banner-icon">
                        <GitMerge :size="24" />
                    </div>
                    <div class="merge-banner-text">
                        <h3>Управление ключами</h3>
                        <p>
                            Уже есть vpn:// ключ? Обновите параметры обфускации
                            или объедините несколько ключей в один.
                        </p>
                    </div>
                </div>
                <div class="merge-banner-actions">
                    <button
                        class="btn btn-secondary"
                        @click="openMergeKeys('update')"
                    >
                        <Zap :size="16" /> Обновить
                    </button>
                    <button
                        class="btn btn-primary"
                        @click="openMergeKeys('merge')"
                    >
                        <GitMerge :size="16" /> Объединить
                    </button>
                </div>
            </div>

            <!-- ── FAQ / Knowledge Base ─────────────────────────────────── -->
            <section class="faq-section">
                <div class="faq-section-head">
                    <div class="faq-section-title">
                        <BookOpen :size="22" class="text-accent" />
                        <h2>База знаний</h2>
                    </div>
                    <button
                        class="btn btn-ghost faq-toggle-btn"
                        @click="showKnowledgeBase = !showKnowledgeBase"
                    >
                        {{
                            showKnowledgeBase
                                ? "Скрыть раздел"
                                : "Показать раздел"
                        }}
                    </button>
                </div>

                <template v-if="showKnowledgeBase">
                    <div class="alert alert-warn">
                        <AlertTriangle :size="16" class="alert-icon" />
                        <div class="alert-content">
                            <b>Блокировка по IP.</b> Если провайдер блокирует
                            диапазоны IP-адресов датацентров, обфускация не поможет.
                            Она скрывает только тип протокола.
                        </div>
                    </div>

                    <div class="faq-list">
                        <div
                            v-for="(item, idx) in faqItems"
                            :key="idx"
                            class="faq-item"
                            :class="{ open: activeFaqIdx === idx }"
                        >
                            <button
                                class="faq-trigger"
                                @click="
                                    activeFaqIdx =
                                        activeFaqIdx === idx ? null : idx
                                "
                            >
                                <component
                                    :is="item.icon"
                                    :size="18"
                                    class="faq-icon"
                                />
                                <span class="faq-title">{{ item.title }}</span>
                                <ChevronDown
                                    :size="16"
                                    class="faq-arrow"
                                    :class="{ rotated: activeFaqIdx === idx }"
                                />
                            </button>
                            <transition name="expand">
                                <div v-show="activeFaqIdx === idx" class="faq-body">
                                    <div v-html="item.body" class="prose"></div>
                                </div>
                            </transition>
                        </div>
                    </div>
                </template>

                <p v-else class="faq-collapsed-note">
                    Раздел свернут для ускорения первого рендера.
                </p>
            </section>
        </div>
    </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════════
   HomeView — Redesigned Layout v2
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Domain Check ─────────────────────────────────────────────────────── */

.host-row {
    display: flex;
    align-items: center;
    gap: 6px;
}

.host-row .input-field {
    flex: 1;
}

.domain-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
    flex-shrink: 0;
}

.domain-dot.ok {
    background: var(--green);
    box-shadow: 0 0 6px var(--green);
}

.domain-dot.blocked {
    background: var(--red);
    box-shadow: 0 0 6px var(--red);
}

.domain-dot.checking {
    background: var(--amber);
    animation: pulse 1s infinite;
}

.domain-dot.unknown {
    background: var(--text3);
}

@keyframes pulse {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.3;
    }
}

/* ── Router Mode ──────────────────────────────────────────────────────── */

.toggle-check {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
}

.toggle-check input[type="checkbox"] {
    accent-color: var(--amber);
}

.toggle-label {
    font-size: 0.82rem;
    color: var(--text2);
}

.icon-inline {
    vertical-align: -2px;
    color: var(--amber);
}

.small-alert {
    margin-top: 8px;
    font-size: 0.75rem;
    padding: 8px 12px;
}

.home-page {
    padding: 2rem 0 4rem;
}

/* ── Hero ──────────────────────────────────────────────────────────────── */
.hero {
    text-align: center;
    margin-bottom: 2rem;
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
    font-size: clamp(1.8rem, 4vw, 3rem);
    font-weight: 900;
    line-height: 1.1;
    letter-spacing: -0.03em;
    margin-bottom: 0.75rem;
}

.hero-brand {
    display: block;
    color: var(--text);
}

.hero-accent {
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

.hero-desc {
    max-width: 540px;
    margin: 0 auto;
    font-size: 0.95rem;
    color: var(--text2);
    line-height: 1.6;
}

/* ── Version Bar ──────────────────────────────────────────────────────── */
.version-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 1.5rem;
}

.ver-tabs {
    display: flex;
    gap: 4px;
    background: var(--bg2);
    border: 1px solid var(--border2);
    border-radius: 100px;
    padding: 4px;
}

.ver-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 16px;
    border-radius: 100px;
    background: transparent;
    border: none;
    color: var(--text3);
    font-family: var(--fw);
    font-weight: 700;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all var(--trans-fast);
    white-space: nowrap;
}

.ver-tab:hover {
    color: var(--text2);
}

.ver-tab.active {
    background: var(--amber);
    color: var(--bg);
    box-shadow: 0 2px 8px rgba(232, 168, 64, 0.25);
}

/* ── History Toggle + Badge ───────────────────────────────────────────── */
.history-toggle {
    position: relative;
    overflow: visible !important;
    z-index: 2;
}

.history-toggle.active {
    color: var(--accent);
    background: var(--surface-active);
}

.history-count {
    position: absolute;
    top: -6px;
    right: -6px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    background: var(--amber);
    color: var(--bg);
    font-size: 0.62rem;
    font-weight: 800;
    font-family: var(--fm);
    border-radius: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    z-index: 10;
    pointer-events: none;
    box-shadow: 0 2px 6px rgba(232, 168, 64, 0.4);
    animation: countPop 0.3s var(--ease-bounce);
}

@keyframes countPop {
    0% {
        transform: scale(0.3);
        opacity: 0;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}

/* ── History Panel ────────────────────────────────────────────────────── */
.history-panel {
    background: var(--bg2);
    border: 1px solid var(--border2);
    border-radius: var(--radius-lg);
    padding: 20px;
    margin-bottom: 1.5rem;
    max-height: 400px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: panelSlideIn 0.3s var(--ease-snap);
}

@keyframes panelSlideIn {
    0% {
        opacity: 0;
        transform: translateY(-8px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

.history-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
}

.history-header-left {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text2);
}

.history-title {
    font-family: var(--fu);
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.history-empty {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--text3);
    font-size: 0.85rem;
    padding: 16px 0;
}

.history-list {
    overflow-y: auto;
    max-height: 300px;
}

.history-list-inner {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.hist-item-enter-active {
    transition: all 0.35s var(--ease-snap);
}
.hist-item-leave-active {
    transition: all 0.2s var(--ease);
}
.hist-item-enter-from {
    opacity: 0;
    transform: translateX(-16px);
}
.hist-item-leave-to {
    opacity: 0;
    transform: translateX(16px) scale(0.95);
}

.history-entry {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 10px 14px;
    background: var(--bg3);
    border: 1px solid var(--border3);
    border-radius: var(--radius-sm);
    transition: all var(--trans-fast);
}

.history-entry:hover {
    border-color: var(--border);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.he-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 140px;
}

.he-time {
    font-family: var(--fm);
    font-size: 0.72rem;
    color: var(--text3);
}

.he-tags {
    display: flex;
    gap: 4px;
}

.he-tag {
    font-size: 0.6rem;
    font-family: var(--fm);
    padding: 1px 6px;
    background: var(--surface);
    border-radius: 4px;
    color: var(--text2);
    text-transform: uppercase;
}

.he-params {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    flex: 1;
    min-width: 0;
}

.he-param {
    display: flex;
    gap: 3px;
    font-family: var(--fm);
    font-size: 0.68rem;
    max-width: 180px;
}

.he-param-wide {
    max-width: 100%;
    flex-basis: 100%;
}

.he-param-k {
    color: var(--text3);
    flex-shrink: 0;
}

.he-param-v {
    color: var(--accent);
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.he-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
}

/* ── Main Grid ────────────────────────────────────────────────────────── */
.main-grid {
    display: grid;
    grid-template-columns: 380px 1fr;
    gap: 24px;
    align-items: start;
}

@media (max-width: 960px) {
    .main-grid {
        grid-template-columns: 1fr;
    }
}

/* ── Panel (shared) ───────────────────────────────────────────────────── */
.panel {
    background: var(--bg2);
    border: 1px solid var(--border2);
    border-radius: var(--radius-lg);
    overflow: hidden;
}

.panel-head {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border2);
}

.panel-title {
    font-family: var(--fu);
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text2);
}

.panel-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

/* ── Controls Panel ───────────────────────────────────────────────────── */
.panel-controls {
    position: static;
}

.field-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.field-label {
    font-size: 0.8rem;
    color: var(--text2);
    font-weight: 600;
    font-family: var(--fw);
}

.field-label-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.field-hint {
    font-size: 0.7rem;
    color: var(--text3);
    line-height: 1.4;
}

.toggle-row {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-size: 0.88rem;
    color: var(--text);
    user-select: none;
    transition: color var(--trans-fast);
}

.toggle-row:hover {
    color: var(--accent);
}

.toggle-row.compact {
    font-size: 0.8rem;
    font-family: var(--fm);
    color: var(--text2);
}

.tags-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}

/* MTU */
.mtu-row {
    display: flex;
    gap: 8px;
}

.mtu-input {
    width: 80px;
    text-align: center;
}

.mtu-presets {
    display: flex;
    gap: 4px;
    flex: 1;
}

.preset-btn {
    flex: 1;
    height: 38px;
    background: var(--bg3);
    border: 1px solid var(--border2);
    border-radius: var(--radius-sm);
    color: var(--text3);
    font-family: var(--fm);
    font-size: 0.72rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--trans-fast);
}

.preset-btn:hover {
    color: var(--text);
    border-color: var(--border);
}

.preset-btn.active {
    background: var(--surface-active);
    color: var(--accent);
    border-color: rgba(232, 168, 64, 0.3);
}

/* Intensity */
.intensity-bar {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 4px;
    background: var(--bg3);
    padding: 4px;
    border-radius: var(--radius);
}

.int-btn {
    padding: 8px;
    border-radius: var(--radius-sm);
    border: none;
    background: transparent;
    color: var(--text3);
    font-family: var(--fu);
    font-weight: 800;
    font-size: 0.68rem;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: all var(--trans-fast);
}

.int-btn:hover {
    color: var(--text2);
}

.int-btn.active {
    background: var(--bg);
    color: var(--accent);
    box-shadow: var(--shadow-sm);
}

/* Generate button */
.gen-btn {
    height: 48px;
    font-family: var(--fu);
    font-size: 0.82rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    transition:
        all var(--trans-fast),
        box-shadow 0.4s ease;
}

.gen-btn:active {
    transform: scale(0.97);
}

/* Feedback */
.feedback-row {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
}

.iter-dots {
    display: flex;
    gap: 5px;
}

.idot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--bg3);
    border: 1px solid var(--border2);
    transition: all 0.35s var(--ease-bounce);
}

.idot.filled {
    background: var(--green);
    border-color: var(--green);
    box-shadow: 0 0 6px rgba(92, 184, 122, 0.4);
    animation: dotPop 0.4s var(--ease-bounce);
}

.idot.critical {
    background: var(--red);
    border-color: var(--red);
    box-shadow: 0 0 6px rgba(212, 96, 74, 0.4);
    animation: dotShake 0.4s ease;
}

@keyframes dotPop {
    0% {
        transform: scale(0.5);
    }
    60% {
        transform: scale(1.3);
    }
    100% {
        transform: scale(1);
    }
}

@keyframes dotShake {
    0%,
    100% {
        transform: translateX(0);
    }
    25% {
        transform: translateX(-2px);
    }
    75% {
        transform: translateX(2px);
    }
}

.fb-btns {
    display: flex;
    gap: 8px;
    width: 100%;
}

.fb-btns .btn {
    flex: 1;
    font-size: 0.78rem;
    height: 36px;
}

.fb-ok:hover {
    color: var(--green);
    border-color: rgba(92, 184, 122, 0.3);
    background: var(--green-bg);
}

.fb-bad:hover {
    color: var(--red);
    border-color: rgba(212, 96, 74, 0.3);
    background: var(--red-bg);
}

/* Log */
.gen-log {
    font-family: var(--fm);
    font-size: 0.68rem;
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding-top: 8px;
    border-top: 1px solid var(--border3);
}

.log-line {
    color: var(--text3);
    line-height: 1.4;
    animation: logFadeIn 0.3s var(--ease);
}

@keyframes logFadeIn {
    0% {
        opacity: 0;
        transform: translateY(4px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

.log-line.log-ok {
    color: var(--green);
}

.log-line.log-bad {
    color: var(--red);
}

.log-line.log-warn {
    color: var(--amber);
}

/* ── Output Panel ─────────────────────────────────────────────────────── */
.panel-output {
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: none;
    border: none;
    border-radius: 0;
    padding: 0;
}

/* Output card */
.output-card {
    background: var(--bg2);
    border: 1px solid var(--border2);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition:
        border-color 0.4s ease,
        box-shadow 0.4s ease;
}

.output-card.just-generated {
    border-color: rgba(232, 168, 64, 0.4);
    box-shadow: 0 0 20px rgba(232, 168, 64, 0.08);
}

.output-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid var(--border2);
}

.output-head-left {
    display: flex;
    align-items: center;
    gap: 10px;
}

.version-chip {
    font-size: 0.6rem;
    font-family: var(--fm);
    font-weight: 700;
    padding: 2px 8px;
    background: rgba(232, 168, 64, 0.1);
    color: var(--amber);
    border-radius: 100px;
    border: 1px solid rgba(232, 168, 64, 0.15);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.output-head-actions {
    display: flex;
    gap: 4px;
}

.btn-icon.xs {
    width: 28px;
    height: 28px;
    padding: 0;
}

.copy-ok {
    color: var(--green) !important;
}

.config-body {
    padding: 16px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.output-placeholder {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 8px 0;
}

.placeholder-line {
    height: 10px;
    background: var(--bg4);
    border-radius: 4px;
    animation: pulse 1.5s ease-in-out infinite;
}

.placeholder-line.w80 {
    width: 80%;
}
.placeholder-line.w70 {
    width: 70%;
}
.placeholder-line.w65 {
    width: 65%;
}
.placeholder-line.w60 {
    width: 60%;
}
.placeholder-line.w50 {
    width: 50%;
}

@keyframes pulse {
    0%,
    100% {
        opacity: 0.3;
    }
    50% {
        opacity: 0.6;
    }
}

/* ── Param Groups ─────────────────────────────────────────────────────── */
.param-group {
    background: var(--bg3);
    border: 1px solid var(--border3);
    border-radius: var(--radius);
    overflow: hidden;
    animation: groupSlideIn 0.35s var(--ease-snap) both;
}

@keyframes groupSlideIn {
    0% {
        opacity: 0;
        transform: translateY(10px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

.param-group-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border3);
}

.param-group-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--fu);
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text2);
}

.param-group-icon {
    font-size: 0.9rem;
}

.param-group-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 1px;
    background: var(--border3);
}

.param-group-grid.has-wide {
    grid-template-columns: 1fr;
}

.param-cell {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
    padding: 10px 14px;
    background: var(--bg2);
    cursor: pointer;
    transition: all var(--trans-fast);
    position: relative;
    min-width: 0;
}

.param-cell:hover {
    background: var(--surface);
}

.param-cell:active {
    background: var(--surface-active);
}

.param-cell-compact {
    align-items: center;
    text-align: center;
}

.param-cell-wide {
    flex-direction: row;
    align-items: center;
    gap: 12px;
}

.param-cell-label {
    font-size: 0.6rem;
    font-family: var(--fm);
    color: var(--text3);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    flex-shrink: 0;
    min-width: 24px;
}

.param-cell-value {
    font-size: 0.85rem;
    font-family: var(--fm);
    font-weight: 700;
    color: var(--accent);
    transition: color var(--trans-fast);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
}

.param-cell-wide .param-cell-value {
    font-size: 0.75rem;
    font-weight: 600;
    min-width: 0;
}

.param-long {
    font-size: 0.65rem;
    font-weight: 500;
    color: var(--text2);
    word-break: break-all;
    white-space: normal;
    line-height: 1.4;
    overflow: visible;
}

/* CPS values always highlighted amber/accent regardless of length */
.param-cps-value {
    color: var(--accent) !important;
    font-size: 0.68rem;
    font-weight: 600;
    word-break: break-all;
    white-space: normal;
    line-height: 1.4;
    overflow: visible;
}

.param-cell-cps {
    border-left: 2px solid rgba(232, 168, 64, 0.25);
}

.param-cell-cps:hover {
    border-left-color: var(--accent);
}

.is-cps .param-cell-label {
    color: var(--amber);
    font-weight: 700;
}

.param-copied {
    color: var(--green) !important;
}

.param-copied-badge {
    position: absolute;
    top: 4px;
    right: 8px;
    font-size: 0.6rem;
    color: var(--green);
    font-weight: 800;
    animation: copiedPop 0.3s var(--ease-bounce);
}

@keyframes copiedPop {
    0% {
        transform: scale(0);
        opacity: 0;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}

/* ── Config Actions Row ───────────────────────────────────────────────── */
.config-actions-row {
    display: flex;
    gap: 10px;
    margin-top: 4px;
}

.config-action-btn {
    flex: 1;
    height: 42px;
    font-size: 0.8rem;
    font-family: var(--fw);
}

.config-action-btn:active {
    transform: scale(0.97);
}

/* ── Preview card ─────────────────────────────────────────────────────── */
.preview-card {
    background: var(--bg2);
    border: 1px solid var(--border2);
    border-radius: var(--radius-lg);
    overflow: hidden;
}

.preview-head {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--border2);
}

.preview-code {
    padding: 16px 20px;
    font-family: var(--fm);
    font-size: 0.72rem;
    line-height: 1.7;
    color: var(--text2);
    white-space: pre-wrap;
    max-height: 300px;
    overflow-y: auto;
    margin: 0;
    background: transparent;
    border: none;
    border-radius: 0;
}

.preview-line.comment {
    color: var(--text3);
}

.preview-line.kv {
    color: var(--text);
}

.preview-line.section {
    color: var(--amber);
    font-weight: 600;
}

/* ── Merge Banner ─────────────────────────────────────────────────────── */
.merge-banner {
    margin-top: 3rem;
    background: linear-gradient(
        135deg,
        rgba(232, 168, 64, 0.06) 0%,
        var(--bg2) 40%,
        rgba(80, 200, 220, 0.03) 100%
    );
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 28px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    flex-wrap: wrap;
    transition: box-shadow var(--trans-norm);
}

.merge-banner:hover {
    box-shadow: 0 4px 24px rgba(232, 168, 64, 0.06);
}

.merge-banner-content {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    flex: 1;
    min-width: 260px;
}

.merge-banner-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-active);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--accent);
    flex-shrink: 0;
    transition: transform var(--trans-norm);
}

.merge-banner:hover .merge-banner-icon {
    transform: rotate(-8deg) scale(1.05);
}

.merge-banner-text h3 {
    font-size: 1rem;
    margin-bottom: 4px;
}

.merge-banner-text p {
    font-size: 0.88rem;
    color: var(--text2);
    margin: 0;
    line-height: 1.5;
}

.merge-banner-actions {
    display: flex;
    gap: 12px;
    flex-shrink: 0;
}

/* ── FAQ Section ──────────────────────────────────────────────────────── */
.faq-section {
    margin-top: 4rem;
}

.faq-section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 1.5rem;
}

.faq-section-title {
    display: flex;
    align-items: center;
    gap: 12px;
}

.faq-section-head h2 {
    margin: 0;
}

.faq-toggle-btn {
    height: 34px;
    padding: 0 12px;
    font-size: 0.78rem;
    white-space: nowrap;
}

.faq-collapsed-note {
    margin: 0;
    color: var(--text3);
    font-size: 0.84rem;
}

.faq-list {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    margin-top: 1.5rem;
}

@media (min-width: 1100px) {
    .faq-list {
        grid-template-columns: 1fr 1fr;
        gap: 10px;
    }
}

.faq-item {
    background: var(--bg2);
    border: 1px solid var(--border2);
    border-radius: var(--radius);
    overflow: hidden;
    transition: all var(--trans-fast);
}

.faq-item.open {
    border-color: var(--border);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

@media (min-width: 1100px) {
    .faq-item.open {
        grid-column: 1 / -1;
    }
}

.faq-trigger {
    width: 100%;
    padding: 14px 18px;
    display: flex;
    align-items: center;
    gap: 14px;
    cursor: pointer;
    background: none;
    border: none;
    color: var(--text);
    font-family: var(--fw);
    text-align: left;
    transition: background var(--trans-fast);
}

.faq-trigger:hover {
    background: var(--surface);
}

.faq-icon {
    color: var(--accent);
    flex-shrink: 0;
    opacity: 0.7;
    transition: all var(--trans-fast);
}

.faq-item.open .faq-icon {
    opacity: 1;
    transform: scale(1.1);
}

.faq-title {
    flex: 1;
    font-weight: 600;
    font-size: 0.9rem;
    line-height: 1.3;
}

.faq-arrow {
    color: var(--text3);
    transition: transform 0.25s var(--ease);
    flex-shrink: 0;
}

.faq-arrow.rotated {
    transform: rotate(180deg);
}

.faq-body {
    padding: 0 18px 18px 50px;
}

/* Prose: styled HTML content from FAQ */
.prose {
    color: var(--text2);
    font-size: 0.88rem;
    line-height: 1.7;
}

.prose :deep(p) {
    margin-bottom: 12px;
}

.prose :deep(ul),
.prose :deep(ol) {
    margin-bottom: 12px;
    padding-left: 20px;
}

.prose :deep(li) {
    margin-bottom: 6px;
}

.prose :deep(code) {
    background: rgba(232, 168, 64, 0.08);
    border: 1px solid rgba(232, 168, 64, 0.1);
    color: var(--amber2);
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 0.85em;
}

.prose :deep(pre) {
    background: var(--bg3);
    border: 1px solid var(--border2);
    border-radius: var(--radius-sm);
    padding: 12px;
    font-size: 0.8rem;
    overflow-x: auto;
    margin-bottom: 12px;
}

.prose :deep(strong) {
    color: var(--text);
}

.prose :deep(.notice) {
    padding: 10px 14px;
    background: var(--surface);
    border-left: 3px solid var(--amber);
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    font-size: 0.84rem;
    color: var(--text2);
}

/* ── Responsive ───────────────────────────────────────────────────────── */
@media (max-width: 768px) {
    .home-page {
        padding: 1rem 0 3rem;
    }

    .hero-title {
        font-size: clamp(1.4rem, 6vw, 2rem);
    }

    .version-bar {
        flex-wrap: wrap;
    }

    .ver-tab {
        padding: 6px 12px;
        font-size: 0.72rem;
    }

    .panel-controls {
        order: 1;
    }

    .panel-output {
        order: 2;
    }

    .merge-banner {
        flex-direction: column;
        align-items: flex-start;
        padding: 20px;
    }

    .merge-banner-actions {
        width: 100%;
    }

    .merge-banner-actions .btn {
        flex: 1;
    }

    .faq-section-head {
        flex-wrap: wrap;
    }

    .faq-body {
        padding: 0 14px 14px 14px;
    }

    .faq-trigger {
        padding: 12px 14px;
        gap: 10px;
    }

    .faq-title {
        font-size: 0.84rem;
    }

    .history-entry {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    .he-info {
        min-width: auto;
    }

    .he-actions {
        align-self: flex-end;
    }

    .config-actions-row {
        flex-direction: column;
    }

    .param-group-grid {
        grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    }

    .config-body {
        padding: 12px 14px 16px;
    }
}

@media (max-width: 480px) {
    .ver-tabs {
        flex-wrap: wrap;
        border-radius: var(--radius);
    }

    .tags-grid {
        grid-template-columns: 1fr;
    }

    .param-group-grid:not(.has-wide) {
        grid-template-columns: repeat(3, 1fr);
    }
}
</style>
