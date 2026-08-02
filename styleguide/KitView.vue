<script setup lang="ts">
/**
 * Every primitive in the kit, on one page, across every accent and both
 * schemes.
 *
 * The point is the combinations. A component that works on the amber page in
 * the dark scheme is not evidence about the purple one in the light scheme,
 * and the only way to know is to be able to flip both axes over a page that
 * has one of everything on it.
 *
 * Not part of the production build — see styleguide/index.html.
 */

import { ref, computed, onMounted } from "vue";
/*
 * The project's own icon set. Nothing here draws a glyph by hand: the app
 * already ships lucide everywhere, and a styleguide that demonstrates
 * primitives with typed characters is demonstrating something the app never
 * renders.
 */
import {
    Info,
    CheckCircle2,
    AlertTriangle,
    HelpCircle,
    Copy,
    Download,
    RefreshCw,
    Trash2,
    Sparkles,
    ChevronRight,
    Monitor,
    Sun,
    Moon,
    RotateCcw,
} from "lucide-vue-next";

type Accent = "amber" | "gold" | "teal" | "green" | "blue" | "purple";
type Scheme = "system" | "light" | "dark";

const ACCENTS: Accent[] = ["amber", "gold", "teal", "green", "blue", "purple"];
const SCHEMES: Scheme[] = ["system", "light", "dark"];

const accent = ref<Accent>("amber");
const scheme = ref<Scheme>("dark");

function applyAccent(next: Accent) {
    accent.value = next;
    document.documentElement.dataset.accent = next;
}

function applyScheme(next: Scheme) {
    scheme.value = next;
    if (next === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = next;
}

onMounted(() => {
    applyAccent(accent.value);
    applyScheme(scheme.value);
});

/* ── Live state for the interactive primitives ───────────────────────────── */

/*
 * A real tri-state, because that is the only way to demonstrate one.
 *
 * `indeterminate` is a DOM property with no attribute behind it, and the
 * browser clears it the moment the box is clicked. Binding a constant to it
 * therefore produces a checkbox that shows a dash once and then never again —
 * which is what the first version of this page did. Deriving it from children
 * is both the honest demonstration and the only use the state has.
 */
const tags = ref([
    { id: "c", label: "<c>", on: true },
    { id: "r", label: "<r>", on: true },
    { id: "rd", label: "<rd>", on: false },
]);

const allTags = computed(() => tags.value.every((t) => t.on));
const someTags = computed(() => tags.value.some((t) => t.on) && !allTags.value);

function toggleAllTags(event: Event) {
    const on = (event.target as HTMLInputElement).checked;
    for (const t of tags.value) t.on = on;
}

const radio = ref("b");
const switched = ref(true);
const range = ref(62);
const segment = ref("med");
const tab = ref("params");
const openItem = ref<number | null>(0);
const loading = ref(false);
const progress = ref(38);
const dialog = ref<HTMLDialogElement | null>(null);

function fakeWork() {
    loading.value = true;
    window.setTimeout(() => (loading.value = false), 1400);
}

/* ── Sample data, taken from what the generator really produces ──────────── */

const RANGES = [
    { key: "H1", lo: 404_731_556, hi: 404_774_416 },
    { key: "H2", lo: 1_917_908_238, hi: 1_917_941_084 },
    { key: "H3", lo: 3_180_395_130, hi: 3_180_396_917 },
    { key: "H4", lo: 3_844_219_877, hi: 3_844_241_616 },
];

const nf = new Intl.NumberFormat("ru-RU");
const span = (lo: number, hi: number) => nf.format(hi - lo);

/** A QUIC Initial long header, as the mimicry profile builds it. */
const PACKET = [
    { name: "Flags", bytes: 1, ours: false },
    { name: "Version", bytes: 4, ours: false },
    { name: "DCID", bytes: 8, ours: true },
    { name: "SCID", bytes: 4, ours: true },
    { name: "Token", bytes: 0, ours: false, void: true },
    { name: "Length", bytes: 2, ours: true },
    { name: "Packet No.", bytes: 2, ours: true },
    { name: "Payload", bytes: 27, ours: true },
];

const totalBytes = computed(() => PACKET.reduce((n, f) => n + Math.max(f.bytes, 1), 0));

const ticks = Array.from({ length: 32 }, (_, i) => i);
</script>

<template>
    <div class="kit">
        <!-- ── The two axes ────────────────────────────────────────────── -->
        <header class="kit-bar">
            <div class="kit-bar-brand">
                <span class="kit-bar-name">Any&nbsp;Tech <b>ARCHITECT</b></span>
                <span class="k-note-label">kit</span>
            </div>

            <div class="k-row">
                <div class="k-segment">
                    <button
                        v-for="s in SCHEMES"
                        :key="s"
                        class="k-segment-opt"
                        :class="{ 'is-active': scheme === s }"
                        @click="applyScheme(s)"
                    >
                        {{ s }}
                    </button>
                </div>

                <div class="k-segment">
                    <button
                        v-for="a in ACCENTS"
                        :key="a"
                        class="k-segment-opt kit-swatch"
                        :class="{ 'is-active': accent === a }"
                        :data-accent="a"
                        @click="applyAccent(a)"
                    >
                        <i class="kit-swatch-dot"></i>
                        {{ a }}
                    </button>
                </div>
            </div>
        </header>

        <main class="kit-main">
            <!-- ══ Foundations ═════════════════════════════════════════ -->
            <section class="kit-section">
                <h2 class="k-h2">Основания</h2>
                <p class="k-lede">
                    Всё ниже строится из этих величин. Меняется только акцент
                    и схема — сами шкалы не зависят ни от страницы, ни от
                    читателя.
                </p>

                <h3 class="k-h3">Фон и цвета бренда</h3>
                <div class="kit-swatches">
                    <div
                        v-for="t in [
                            '--ground',
                            '--ground-2',
                            '--ground-3',
                            '--ground-4',
                            '--ground-5',
                            '--surface',
                            '--accent',
                            '--accent-ink',
                            '--ink',
                            '--ink-2',
                            '--ink-3',
                            '--line',
                        ]"
                        :key="t"
                        class="kit-chip"
                    >
                        <span
                            class="kit-chip-fill"
                            :style="{ background: `var(${t})` }"
                        ></span>
                        <code class="k-note-label">{{ t }}</code>
                    </div>
                </div>

                <h3 class="k-h3">Типографика</h3>
                <div class="k-stack">
                    <span class="k-display k-display--lg">Architect</span>
                    <span class="k-display">Конфигурация</span>
                    <span class="k-h2">Заголовок раздела</span>
                    <span class="k-h3">Подзаголовок</span>
                    <p class="k-prose">
                        Основной текст держится в пределах комфортной меры и
                        никогда не растягивается на всю ширину экрана: строка
                        длиннее семидесяти знаков теряет читателя на переносе.
                    </p>
                    <span class="k-mono">0xc2000000011487e88c53715e896f8bce</span>
                </div>

                <h3 class="k-h3">Отступы</h3>
                <div class="kit-spaces">
                    <div
                        v-for="n in 10"
                        :key="n"
                        class="kit-space"
                        :style="{ width: `var(--sp-${n})` }"
                        :title="`--sp-${n}`"
                    ></div>
                </div>
            </section>

            <!-- ══ Drawing motifs ══════════════════════════════════════ -->
            <section class="kit-section">
                <h2 class="k-h2">Чертёжные мотивы</h2>
                <p class="k-lede">
                    Правило одно: каждый мотив несёт данные. Размерная линия —
                    это диапазон, потому что диапазон и есть размер. Штриховка
                    означает, что клиент этого не поддерживает. Литера ревизии —
                    версия протокола.
                </p>

                <h3 class="k-h3">Размерные линии — диапазоны заголовков</h3>
                <div class="k-panel">
                    <div class="k-panel-body k-stack">
                        <div v-for="r in RANGES" :key="r.key" class="kit-dimrow">
                            <span class="k-rev">{{ r.key }}</span>
                            <div class="k-dim">
                                <span class="k-dim-end">{{ nf.format(r.lo) }}</span>
                                <span class="k-dim-line">
                                    <span class="k-dim-span">
                                        ширина {{ span(r.lo, r.hi) }}
                                    </span>
                                </span>
                                <span class="k-dim-end">{{ nf.format(r.hi) }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <h3 class="k-h3">Октетная линейка и карта полей</h3>
                <div class="k-panel">
                    <div class="k-panel-body k-stack">
                        <div class="k-ruler">
                            <span
                                v-for="i in ticks"
                                :key="i"
                                class="k-ruler-tick"
                                :class="{ 'k-ruler-tick--major': i % 8 === 7 }"
                            >
                                <span v-if="i % 8 === 0">{{ i }}</span>
                            </span>
                        </div>

                        <div class="k-fieldmap">
                            <div
                                v-for="f in PACKET"
                                :key="f.name"
                                class="k-fieldmap-field"
                                :class="{
                                    'k-fieldmap-field--ours': f.ours,
                                    'k-fieldmap-field--void': f.void,
                                }"
                                :style="{
                                    flexGrow: Math.max(f.bytes, 1),
                                    flexBasis: `${(Math.max(f.bytes, 1) / totalBytes) * 100}%`,
                                }"
                            >
                                <span class="k-fieldmap-name">{{ f.name }}</span>
                                <span class="k-fieldmap-size">
                                    {{ f.bytes ? `${f.bytes} B` : "—" }}
                                </span>
                            </div>
                        </div>

                        <div class="k-row">
                            <span class="k-leader">заполняется генератором</span>
                            <span class="k-leader">штриховка — поля нет</span>
                        </div>
                    </div>
                </div>

                <h3 class="k-h3">Штамп основной надписи</h3>
                <div class="k-titleblock">
                    <div class="k-titleblock-cell">
                        <span class="k-titleblock-key">Лист</span>
                        <span class="k-titleblock-val">AWG-3.0</span>
                    </div>
                    <div class="k-titleblock-cell">
                        <span class="k-titleblock-key">Профиль</span>
                        <span class="k-titleblock-val">QUIC Initial</span>
                    </div>
                    <div class="k-titleblock-cell">
                        <span class="k-titleblock-key">Клиент</span>
                        <span class="k-titleblock-val">Amnezia VPN</span>
                    </div>
                    <div class="k-titleblock-cell">
                        <span class="k-titleblock-key">MTU</span>
                        <span class="k-titleblock-val">1500</span>
                    </div>
                </div>

                <h3 class="k-h3">Разделители и пустоты</h3>
                <div class="k-stack">
                    <span class="k-rule">экспорт</span>
                    <hr class="k-divider" />
                    <div class="k-void" style="height: 56px"></div>
                </div>
            </section>

            <!-- ══ Buttons ═════════════════════════════════════════════ -->
            <section class="kit-section">
                <h2 class="k-h2">Кнопки</h2>

                <div class="k-row">
                    <button class="k-btn k-btn--primary">
                        <Sparkles :size="15" /> Сгенерировать
                    </button>
                    <button class="k-btn k-btn--secondary">
                        <Download :size="15" /> Скачать .conf
                    </button>
                    <button class="k-btn k-btn--ghost">
                        <Copy :size="15" /> Копировать
                    </button>
                    <button class="k-btn k-btn--danger">
                        <Trash2 :size="15" /> Очистить историю
                    </button>
                </div>

                <div class="k-row">
                    <button class="k-btn k-btn--primary k-btn--sm">Мелкая</button>
                    <button class="k-btn k-btn--primary">Обычная</button>
                    <button class="k-btn k-btn--primary k-btn--lg">Крупная</button>
                    <button class="k-btn k-btn--secondary k-btn--icon" aria-label="Обновить">
                        <RefreshCw :size="15" />
                    </button>
                </div>

                <div class="k-row">
                    <button class="k-btn k-btn--primary" disabled>Недоступно</button>
                    <button class="k-btn k-btn--secondary" disabled>Недоступно</button>
                    <button
                        class="k-btn k-btn--primary"
                        :class="{ 'is-loading': loading }"
                        @click="fakeWork"
                    >
                        Нажми — покажу загрузку
                    </button>
                </div>

                <div class="k-btngroup">
                    <button
                        v-for="v in ['1.0', '1.5', '2.0', '3.0']"
                        :key="v"
                        class="k-btn"
                        :class="{ 'is-active': v === '3.0' }"
                    >
                        AWG {{ v }}
                    </button>
                </div>
            </section>

            <!-- ══ Form controls ═══════════════════════════════════════ -->
            <section class="kit-section">
                <h2 class="k-h2">Поля ввода</h2>

                <div class="k-grid">
                    <label class="k-field">
                        <span class="k-label">Хост мимикрии</span>
                        <input class="k-input" placeholder="например, do.co" />
                        <span class="k-hint">
                            Хост с HTTP/3. Примеры из базы: do.co, ya.ru, dns.sb
                        </span>
                    </label>

                    <label class="k-field">
                        <span class="k-label">
                            Приватный ключ<span class="k-label-req">*</span>
                        </span>
                        <input
                            class="k-input k-input--mono is-invalid"
                            value="8Jd2kQ…"
                        />
                        <span class="k-error">Не base64 длиной 44 символа.</span>
                    </label>

                    <label class="k-field">
                        <span class="k-label">Целевой клиент</span>
                        <select class="k-select">
                            <option>Amnezia VPN</option>
                            <option>AmneziaWG Android</option>
                            <option>Keenetic (native)</option>
                        </select>
                    </label>

                    <div class="k-field">
                        <span class="k-label">MTU интерфейса</span>
                        <div class="k-inputgroup">
                            <input class="k-input" value="1500" />
                            <span class="k-affix">байт</span>
                        </div>
                    </div>

                    <label class="k-field">
                        <span class="k-label">Отключённое поле</span>
                        <input class="k-input" value="недоступно" disabled />
                    </label>

                    <label class="k-field">
                        <span class="k-label">Конфигурация</span>
                        <textarea
                            class="k-textarea k-textarea--mono"
                            placeholder="Вставьте vpn:// ключ или .conf"
                        ></textarea>
                    </label>
                </div>

                <h3 class="k-h3">Переключатели</h3>
                <div class="k-grid">
                    <div class="k-stack">
                        <!--
                            Родитель показывает три состояния: все, ни одного,
                            часть. Третье — та самая «неопределённость», и
                            смысл она имеет только здесь.
                        -->
                        <label class="k-check">
                            <input
                                type="checkbox"
                                :checked="allTags"
                                :indeterminate="someTags"
                                @change="toggleAllTags"
                            />
                            <span>Теги в цепочке CPS</span>
                        </label>
                        <label
                            v-for="t in tags"
                            :key="t.id"
                            class="k-check"
                            style="padding-left: 28px"
                        >
                            <input v-model="t.on" type="checkbox" />
                            <span><code class="k-code">{{ t.label }}</code></span>
                        </label>
                        <label class="k-check">
                            <input type="checkbox" disabled />
                            <span>Не поддерживается клиентом</span>
                        </label>
                    </div>

                    <div class="k-stack">
                        <label
                            v-for="o in [
                                { v: 'a', l: 'Низкая энтропия' },
                                { v: 'b', l: 'Средняя' },
                                { v: 'c', l: 'Высокая' },
                            ]"
                            :key="o.v"
                            class="k-check"
                        >
                            <input v-model="radio" type="radio" :value="o.v" />
                            <span>{{ o.l }}</span>
                        </label>
                    </div>

                    <div class="k-stack">
                        <label class="k-switch">
                            <input v-model="switched" type="checkbox" />
                            <span class="k-switch-track"></span>
                            <span>Режим роутера</span>
                        </label>
                        <label class="k-switch">
                            <input type="checkbox" disabled />
                            <span class="k-switch-track"></span>
                            <span>Недоступно на этом клиенте</span>
                        </label>
                        <label class="k-field">
                            <span class="k-label">
                                Интенсивность — {{ range }}
                            </span>
                            <input
                                v-model.number="range"
                                class="k-range"
                                type="range"
                            />
                        </label>
                        <div class="k-segment">
                            <button
                                v-for="s in ['low', 'med', 'high']"
                                :key="s"
                                class="k-segment-opt"
                                :class="{ 'is-active': segment === s }"
                                @click="segment = s"
                            >
                                {{ s }}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <!-- ══ Marks ═══════════════════════════════════════════════ -->
            <section class="kit-section">
                <h2 class="k-h2">Метки</h2>
                <div class="k-row">
                    <span class="k-badge">AWG 3.0</span>
                    <span class="k-badge k-badge--ok">работает</span>
                    <span class="k-badge k-badge--warn">проверьте</span>
                    <span class="k-badge k-badge--bad">ошибка</span>
                    <span class="k-badge k-badge--info">.conf</span>
                    <span class="k-badge k-badge--quiet">черновик</span>
                </div>
                <div class="k-row">
                    <span class="k-rev">A</span>
                    <span class="k-rev is-active">B</span>
                    <span class="k-rev">H1</span>
                    <kbd class="k-kbd">Ctrl</kbd>
                    <kbd class="k-kbd">C</kbd>
                    <code class="k-code">Jmin</code>
                    <span class="k-row" style="gap: 6px">
                        <i class="k-dot k-dot--ok"></i> готово
                    </span>
                    <span class="k-row" style="gap: 6px">
                        <i class="k-dot k-dot--live"></i> идёт проверка
                    </span>
                </div>
            </section>

            <!-- ══ Readouts ════════════════════════════════════════════ -->
            <section class="kit-section">
                <h2 class="k-h2">Отсчёты</h2>
                <div class="k-readout-row">
                    <div class="k-readout">
                        <span class="k-readout-key">Jc</span>
                        <span class="k-readout-val">4</span>
                    </div>
                    <div class="k-readout">
                        <span class="k-readout-key">Jmin</span>
                        <span class="k-readout-val">422</span>
                    </div>
                    <div class="k-readout">
                        <span class="k-readout-key">Jmax</span>
                        <span class="k-readout-val">722</span>
                    </div>
                    <div class="k-readout">
                        <span class="k-readout-key">S1</span>
                        <span class="k-readout-val">77</span>
                    </div>
                    <div class="k-readout">
                        <span class="k-readout-key">S2</span>
                        <span class="k-readout-val">72</span>
                    </div>
                </div>
                <div class="k-readout k-readout--wide">
                    <span class="k-readout-key">I1</span>
                    <span class="k-readout-val">
                        &lt;b 0xc3000000011487e88c53715e896f8bce25178d35e22fcf&gt;&lt;rc
                        19&gt;&lt;t&gt;&lt;r 54&gt;
                    </span>
                </div>
            </section>

            <!-- ══ Messages ════════════════════════════════════════════ -->
            <section class="kit-section">
                <h2 class="k-h2">Сообщения</h2>
                <div class="k-stack">
                    <div class="k-note">
                        <Info :size="16" class="k-note-icon" />
                        <span>
                            <b class="k-note-title">Тег &lt;c&gt; проблемный</b>
                            Не работает в старых версиях AWG-go. Разработчики
                            Amnezia позднее отказались от него.
                        </span>
                    </div>
                    <div class="k-note k-note--ok">
                        <CheckCircle2 :size="16" class="k-note-icon" />
                        <span>Конфигурация прошла проверку без замечаний.</span>
                    </div>
                    <div class="k-note k-note--bad">
                        <AlertTriangle :size="16" class="k-note-icon" />
                        <span>H2 и H3 пересекаются — клиент отвергнет конфиг.</span>
                    </div>
                    <div class="k-note k-note--info">
                        <HelpCircle :size="16" class="k-note-icon" />
                        <span>Эти параметры должны совпадать на обоих концах.</span>
                    </div>

                    <div class="k-empty">
                        <span class="k-empty-title">Пока ничего не сгенерировано</span>
                        <span class="k-empty-desc">
                            Выберите версию и клиента, затем нажмите
                            «Сгенерировать». История хранится только в этом
                            браузере.
                        </span>
                        <button class="k-btn k-btn--primary">
                            <Sparkles :size="15" /> Сгенерировать
                        </button>
                    </div>
                </div>
            </section>

            <!-- ══ Progress ════════════════════════════════════════════ -->
            <section class="kit-section">
                <h2 class="k-h2">Ход работы</h2>
                <div class="k-stack">
                    <div class="k-progress">
                        <div class="k-progress-bar" :style="{ width: `${progress}%` }"></div>
                    </div>
                    <div class="k-progress k-progress--indeterminate">
                        <div class="k-progress-bar"></div>
                    </div>
                    <div class="k-row">
                        <span class="k-spinner"></span>
                        <span class="k-note-label">проверяем домен</span>
                    </div>
                    <div class="k-stack" style="gap: 8px">
                        <div class="k-skeleton" style="height: 14px; width: 45%"></div>
                        <div class="k-skeleton" style="height: 14px; width: 80%"></div>
                        <div class="k-skeleton" style="height: 14px; width: 62%"></div>
                    </div>
                </div>
            </section>

            <!-- ══ Tables, tabs, accordion ═════════════════════════════ -->
            <section class="kit-section">
                <h2 class="k-h2">Данные и раскрытие</h2>

                <div class="k-tablewrap">
                    <table class="k-table">
                        <thead>
                            <tr>
                                <th>Параметр</th>
                                <th>1.0</th>
                                <th>1.5</th>
                                <th>2.0</th>
                                <th>3.0</th>
                                <th class="k-num">Предел</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><code class="k-code">Jc</code></td>
                                <td>да</td>
                                <td>да</td>
                                <td>да</td>
                                <td>да</td>
                                <td class="k-num">15</td>
                            </tr>
                            <tr>
                                <td><code class="k-code">S3, S4</code></td>
                                <td>—</td>
                                <td>—</td>
                                <td>да</td>
                                <td>да</td>
                                <td class="k-num">1280</td>
                            </tr>
                            <tr>
                                <td><code class="k-code">H1–H4</code></td>
                                <td>одно</td>
                                <td>одно</td>
                                <td>диапазон</td>
                                <td>диапазон</td>
                                <td class="k-num">4294967295</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="k-tabs">
                    <button
                        v-for="t in [
                            { id: 'params', l: 'Параметры' },
                            { id: 'preview', l: 'Превью' },
                            { id: 'health', l: 'Проверка' },
                        ]"
                        :key="t.id"
                        class="k-tab"
                        :class="{ 'is-active': tab === t.id }"
                        @click="tab = t.id"
                    >
                        {{ t.l }}
                    </button>
                </div>

                <div class="k-accordion">
                    <div
                        v-for="(q, i) in [
                            'Что делают Jc, Jmin и Jmax?',
                            'Почему H1–H4 не должны пересекаться?',
                            'Какой MTU выставлять?',
                        ]"
                        :key="i"
                        class="k-accordion-item"
                    >
                        <button
                            class="k-accordion-head"
                            @click="openItem = openItem === i ? null : i"
                        >
                            {{ q }}
                        </button>
                        <div v-if="openItem === i" class="k-accordion-body">
                            Junk-поезд — это пакеты-пустышки перед рукопожатием.
                            Jc задаёт их количество, Jmin и Jmax — границы
                            размера каждого.
                        </div>
                    </div>
                </div>
            </section>

            <!-- ══ Overlays ════════════════════════════════════════════ -->
            <section class="kit-section">
                <h2 class="k-h2">Наложения</h2>
                <div class="k-row" style="align-items: flex-start">
                    <ul class="k-menu" style="position: static">
                        <li>
                            <button class="k-menu-item is-on">
                                <Monitor :size="15" /> Как в системе
                            </button>
                        </li>
                        <li>
                            <button class="k-menu-item">
                                <Sun :size="15" /> Светлая
                            </button>
                        </li>
                        <li>
                            <button class="k-menu-item">
                                <Moon :size="15" /> Тёмная
                            </button>
                        </li>
                        <li><span class="k-menu-sep"></span></li>
                        <li>
                            <button class="k-menu-item">
                                <RotateCcw :size="15" /> Сбросить
                            </button>
                        </li>
                    </ul>

                    <div class="k-toast">
                        <CheckCircle2 :size="16" class="k-toast-icon" />
                        <span>Конфигурация скопирована в буфер обмена.</span>
                    </div>

                    <button class="k-btn k-btn--secondary" @click="dialog?.showModal()">
                        Открыть диалог
                    </button>
                </div>

                <dialog ref="dialog" class="k-dialog">
                    <div class="k-dialog-head">
                        <span class="k-dialog-title">Очистить историю?</span>
                    </div>
                    <div class="k-dialog-body">
                        Будут удалены все записи, кроме закреплённых. История
                        хранится только в этом браузере — восстановить её будет
                        нечем.
                    </div>
                    <div class="k-dialog-foot">
                        <button class="k-btn k-btn--ghost" @click="dialog?.close()">
                            Отмена
                        </button>
                        <button class="k-btn k-btn--danger" @click="dialog?.close()">
                            Очистить
                        </button>
                    </div>
                </dialog>
            </section>

            <!-- ══ Surfaces ════════════════════════════════════════════ -->
            <section class="kit-section">
                <h2 class="k-h2">Поверхности</h2>
                <div class="k-grid k-grid--wide">
                    <div class="k-panel">
                        <div class="k-panel-head">
                            <span class="k-panel-title">Конфигурация</span>
                            <span class="k-panel-aside">
                                <span class="k-badge">AWG 3.0</span>
                            </span>
                        </div>
                        <div class="k-panel-body k-prose">
                            Панель — это обрамлённая область на листе. Голова,
                            тело, подвал.
                        </div>
                        <div class="k-panel-foot">
                            <button class="k-btn k-btn--ghost k-btn--sm">Сброс</button>
                            <button class="k-btn k-btn--primary k-btn--sm">
                                Применить
                            </button>
                        </div>
                    </div>

                    <a class="k-card" href="#">
                        <span class="k-row" style="justify-content: space-between">
                            <span class="k-h3">Генератор AmneziaWG</span>
                            <ChevronRight :size="16" class="k-card-go" />
                        </span>
                        <p class="k-prose" style="margin-top: 8px">
                            Junk-поезда, диапазоны заголовков, подписи CPS и
                            одиннадцать профилей мимикрии.
                        </p>
                    </a>

                    <div class="k-sheet k-sheet--gridded" style="min-height: 160px">
                        <div style="padding: 24px">
                            <span class="k-note-label">лист с сеткой</span>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    </div>
</template>

<style>
.kit {
    min-height: 100vh;
    background: var(--ground);
    color: var(--ink);
    font-family: var(--fw);
}

.kit-bar {
    position: sticky;
    top: 0;
    z-index: var(--z-header);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--sp-4);
    padding: var(--sp-3) var(--sp-gutter);
    background: var(--ground-2);
    border-bottom: var(--rule) solid var(--line-soft);
}

.kit-bar-brand {
    display: flex;
    align-items: baseline;
    gap: var(--sp-3);
}

.kit-bar-name {
    font-family: var(--fu);
    font-size: var(--t-sm);
    letter-spacing: var(--track-tight);
    color: var(--ink-3);
}

.kit-bar-name b {
    color: var(--accent-ink);
    font-weight: 800;
}

/*
 * The accent buttons carry `data-accent` themselves, so each swatch shows the
 * colour it switches to rather than the colour currently selected.
 */
.kit-swatch {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.kit-swatch-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: rgb(var(--accent-rgb));
}

.kit-main {
    max-width: 1120px;
    margin: 0 auto;
    padding: var(--sp-8) var(--sp-gutter) var(--sp-10);
    display: flex;
    flex-direction: column;
    gap: var(--sp-10);
}

.kit-section {
    display: flex;
    flex-direction: column;
    gap: var(--sp-5);
    scroll-margin-top: 80px;
}

.kit-section > .k-h3 {
    margin-top: var(--sp-3);
    color: var(--ink-3);
}

.kit-swatches {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--sp-3);
}

.kit-chip {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
}

.kit-chip-fill {
    width: 34px;
    height: 34px;
    border-radius: var(--r-2);
    border: var(--rule) solid var(--line);
    flex-shrink: 0;
}

.kit-spaces {
    display: flex;
    align-items: flex-end;
    gap: var(--sp-2);
}

.kit-space {
    height: 34px;
    background: var(--surface-active);
    border: var(--rule) solid var(--line-soft);
    border-radius: var(--r-1);
}

.kit-dimrow {
    display: grid;
    grid-template-columns: 34px 1fr;
    align-items: center;
    gap: var(--sp-3);
}
</style>
