<script setup lang="ts">
/**
 * FAQ — searchable, filterable, and emitted as FAQPage structured data.
 *
 * The JSON-LD block is built from the same source as the visible answers, so
 * what search engines index can never drift from what a visitor reads.
 */
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import {
    Search,
    ChevronDown,
    X,
    HelpCircle,
    Link2,
    Check,
} from "lucide-vue-next";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "@/i18n";
import {
    FAQ_CATEGORIES,
    FAQ_ENTRIES,
    type FaqCategoryId,
} from "@/data/faq";
import ClientFieldGuide from "@/components/ClientFieldGuide.vue";

const { locale } = useI18n();
const route = useRoute();
const router = useRouter();

const query = ref("");
const activeCategory = ref<FaqCategoryId | "all">("all");
const openIds = ref<Set<string>>(new Set());
const copiedId = ref<string | null>(null);
let copyTimer: ReturnType<typeof setTimeout> | undefined;

const isRu = computed(() => locale.value === "ru");

/* ── Search ──────────────────────────────────────────────────────────────── */

/** Fold case and strip diacritics so "ё" matches "е" and casing never matters. */
function normalize(text: string): string {
    return text
        .toLowerCase()
        .replace(/ё/g, "е")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
}

const filtered = computed(() => {
    const q = normalize(query.value.trim());
    const cat = activeCategory.value;

    return FAQ_ENTRIES.filter((entry) => {
        if (cat !== "all" && entry.category !== cat) return false;
        if (!q) return true;

        // Search both languages: someone reading the Russian page may well be
        // searching for an English parameter name, and vice versa.
        const haystack = normalize(
            [
                entry.question.ru,
                entry.question.en,
                entry.answer.ru,
                entry.answer.en,
                ...(entry.keywords ?? []),
            ].join(" "),
        );
        return q.split(/\s+/).every((term) => haystack.includes(term));
    });
});

/** Counts per category for the filter chips. */
const counts = computed(() => {
    const out: Record<string, number> = { all: FAQ_ENTRIES.length };
    for (const c of FAQ_CATEGORIES) {
        out[c.id] = FAQ_ENTRIES.filter((e) => e.category === c.id).length;
    }
    return out;
});

/* ── Disclosure ──────────────────────────────────────────────────────────── */

function toggle(id: string): void {
    const next = new Set(openIds.value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    openIds.value = next;
}

const isOpen = (id: string) => openIds.value.has(id);

/** Searching expands matches automatically — hunting twice is a chore. */
watch(query, (value) => {
    if (value.trim()) {
        openIds.value = new Set(filtered.value.map((e) => e.id));
    } else {
        openIds.value = new Set();
    }
});

function clearSearch(): void {
    query.value = "";
    activeCategory.value = "all";
}

/* ── Deep links ──────────────────────────────────────────────────────────── */

async function copyLink(id: string): Promise<void> {
    const url = `${window.location.origin}${route.path}#${id}`;
    try {
        await navigator.clipboard.writeText(url);
        copiedId.value = id;
        clearTimeout(copyTimer);
        copyTimer = setTimeout(() => (copiedId.value = null), 2000);
    } catch {
        // Clipboard access can be denied; the hash below still updates so the
        // address bar carries a shareable URL either way.
    }
    router.replace({ hash: `#${id}` }).catch(() => {});
}

function openFromHash(): void {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const entry = FAQ_ENTRIES.find((e) => e.id === id);
    if (!entry) return;
    openIds.value = new Set([...openIds.value, id]);
    // Wait a frame so the panel has expanded before we scroll to it.
    requestAnimationFrame(() => {
        document
            .getElementById(id)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
}

/* ── Structured data ─────────────────────────────────────────────────────── */

const JSONLD_ID = "faq-jsonld";

function syncJsonLd(): void {
    const loc = locale.value;
    const payload = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQ_ENTRIES.map((entry) => ({
            "@type": "Question",
            name: entry.question[loc],
            acceptedAnswer: {
                "@type": "Answer",
                text: entry.answer[loc],
            },
        })),
    };

    let el = document.getElementById(JSONLD_ID);
    if (!el) {
        el = document.createElement("script");
        el.id = JSONLD_ID;
        el.setAttribute("type", "application/ld+json");
        document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(payload);
}

watch(locale, syncJsonLd);

onMounted(() => {
    syncJsonLd();
    openFromHash();
});

onBeforeUnmount(() => {
    clearTimeout(copyTimer);
    document.getElementById(JSONLD_ID)?.remove();
});
</script>

<template>
    <div class="faq-page fade-in">
        <div class="container">
            <header class="faq-hero">
                <div class="faq-hero-icon">
                    <HelpCircle :size="26" />
                </div>
                <h1 class="faq-title">
                    {{ isRu ? "Вопросы и ответы" : "Questions & answers" }}
                </h1>
                <p class="faq-lede">
                    {{
                        isRu
                            ? "Как устроены параметры AmneziaWG, чем отличаются версии и что делать, когда туннель не поднимается."
                            : "How the AmneziaWG parameters work, how the versions differ, and what to check when a tunnel will not come up."
                    }}
                </p>
            </header>

            <!-- ── Search ──────────────────────────────────────────────── -->
            <div class="faq-search">
                <Search :size="17" class="faq-search-icon" />
                <input
                    v-model="query"
                    type="search"
                    class="faq-search-input"
                    :placeholder="
                        isRu
                            ? 'Поиск: Jc, nonce, не подключается…'
                            : 'Search: Jc, nonce, not connecting…'
                    "
                    :aria-label="isRu ? 'Поиск по FAQ' : 'Search the FAQ'"
                />
                <button
                    v-if="query"
                    class="faq-search-clear"
                    :aria-label="isRu ? 'Очистить' : 'Clear'"
                    @click="clearSearch"
                >
                    <X :size="15" />
                </button>
            </div>

            <!-- ── Category filters ────────────────────────────────────── -->
            <div class="faq-cats" role="tablist">
                <button
                    class="faq-cat"
                    :class="{ active: activeCategory === 'all' }"
                    role="tab"
                    :aria-selected="activeCategory === 'all'"
                    @click="activeCategory = 'all'"
                >
                    {{ isRu ? "Все" : "All" }}
                    <span class="faq-cat-n">{{ counts.all }}</span>
                </button>
                <button
                    v-for="cat in FAQ_CATEGORIES"
                    :key="cat.id"
                    class="faq-cat"
                    :class="{ active: activeCategory === cat.id }"
                    role="tab"
                    :aria-selected="activeCategory === cat.id"
                    @click="activeCategory = cat.id"
                >
                    {{ cat.label[locale] }}
                    <span class="faq-cat-n">{{ counts[cat.id] }}</span>
                </button>
            </div>

            <!-- ── Where the parameters go ─────────────────────────────── -->
            <ClientFieldGuide id="client-fields" />

            <!-- ── Results ─────────────────────────────────────────────── -->
            <p class="faq-count" aria-live="polite">
                {{
                    isRu
                        ? `Найдено: ${filtered.length}`
                        : `${filtered.length} found`
                }}
            </p>

            <div v-if="filtered.length" class="faq-list">
                <article
                    v-for="entry in filtered"
                    :id="entry.id"
                    :key="entry.id"
                    class="faq-item"
                    :class="{ open: isOpen(entry.id) }"
                >
                    <h2 class="faq-q-wrap">
                        <button
                            class="faq-q"
                            :aria-expanded="isOpen(entry.id)"
                            :aria-controls="`${entry.id}-answer`"
                            @click="toggle(entry.id)"
                        >
                            <span>{{ entry.question[locale] }}</span>
                            <ChevronDown :size="17" class="faq-chevron" />
                        </button>
                    </h2>

                    <transition name="expand">
                        <div
                            v-show="isOpen(entry.id)"
                            :id="`${entry.id}-answer`"
                            class="faq-a"
                        >
                            <p>{{ entry.answer[locale] }}</p>
                            <button
                                class="faq-link"
                                @click="copyLink(entry.id)"
                            >
                                <Check
                                    v-if="copiedId === entry.id"
                                    :size="13"
                                />
                                <Link2 v-else :size="13" />
                                <span>{{
                                    copiedId === entry.id
                                        ? isRu
                                            ? "Ссылка скопирована"
                                            : "Link copied"
                                        : isRu
                                          ? "Ссылка на вопрос"
                                          : "Link to this question"
                                }}</span>
                            </button>
                        </div>
                    </transition>
                </article>
            </div>

            <div v-else class="faq-empty">
                <Search :size="22" />
                <p>
                    {{
                        isRu
                            ? "Ничего не нашлось. Попробуйте другой запрос или снимите фильтр категории."
                            : "Nothing matched. Try a different query, or clear the category filter."
                    }}
                </p>
                <button class="btn btn-secondary" @click="clearSearch">
                    {{ isRu ? "Сбросить" : "Reset" }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.faq-page {
    padding: 2.5rem 0 4rem;
}

/* ── Hero ─────────────────────────────────────────────────────────────── */
.faq-hero {
    text-align: center;
    max-width: 640px;
    margin: 0 auto 2rem;
}

.faq-hero-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    margin-bottom: 1rem;
    border-radius: var(--radius-lg);
    background: var(--bg3);
    border: 1px solid var(--border2);
    color: var(--amber);
}

.faq-title {
    font-family: var(--fu);
    font-weight: 900;
    font-size: clamp(1.7rem, 5.5vw, 2.5rem);
    line-height: 1.1;
    color: var(--text);
    margin: 0 0 0.7rem;
    text-wrap: balance;
}

.faq-lede {
    font-size: 0.94rem;
    line-height: 1.65;
    color: var(--text2);
    margin: 0;
    text-wrap: pretty;
}

/* ── Search ───────────────────────────────────────────────────────────── */
.faq-search {
    position: relative;
    display: flex;
    align-items: center;
    margin-bottom: 14px;
}

.faq-search-icon {
    position: absolute;
    left: 14px;
    color: var(--text3);
    pointer-events: none;
}

.faq-search-input {
    width: 100%;
    padding: 13px 42px;
    background: var(--bg2);
    border: 1px solid var(--border2);
    border-radius: var(--radius-lg);
    color: var(--text);
    font-family: var(--fw);
    font-size: 0.92rem;
    transition: border-color var(--trans-fast);
}

.faq-search-input::placeholder {
    color: var(--text3);
}

.faq-search-input:focus {
    outline: none;
    border-color: var(--amber-dim);
}

/* The native clear affordance sits under ours and looks foreign here. */
.faq-search-input::-webkit-search-cancel-button {
    display: none;
}

.faq-search-clear {
    position: absolute;
    right: 12px;
    display: flex;
    padding: 5px;
    border: none;
    border-radius: 50%;
    background: var(--bg4);
    color: var(--text2);
    cursor: pointer;
}

.faq-search-clear:hover {
    color: var(--text);
}

/* ── Categories ───────────────────────────────────────────────────────── */
.faq-cats {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 1.25rem;
}

.faq-cat {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 13px;
    border-radius: 100px;
    border: 1px solid var(--border2);
    background: var(--bg2);
    color: var(--text2);
    font-family: var(--fw);
    font-weight: 700;
    font-size: 0.78rem;
    cursor: pointer;
    transition: all var(--trans-fast);
}

.faq-cat:hover {
    color: var(--text);
    border-color: var(--border3);
}

.faq-cat.active {
    background: var(--amber);
    border-color: var(--amber);
    color: var(--bg);
}

.faq-cat-n {
    font-size: 0.68rem;
    opacity: 0.65;
}

.faq-count {
    font-size: 0.78rem;
    color: var(--text2);
    margin: 0 0 12px;
}

/* ── List ─────────────────────────────────────────────────────────────── */
.faq-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.faq-item {
    background: var(--bg2);
    border: 1px solid var(--border2);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: border-color var(--trans-fast);
    /* Deep-linked items land under the sticky header without this. */
    scroll-margin-top: 90px;
}

.faq-item.open {
    border-color: var(--amber-dim);
}

.faq-q-wrap {
    margin: 0;
    font-size: inherit;
    font-weight: inherit;
}

.faq-q {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    width: 100%;
    padding: 15px 17px;
    border: none;
    background: transparent;
    color: var(--text);
    font-family: var(--fw);
    font-weight: 700;
    font-size: 0.92rem;
    line-height: 1.45;
    text-align: left;
    cursor: pointer;
}

.faq-q:hover {
    color: var(--amber);
}

.faq-chevron {
    flex-shrink: 0;
    color: var(--text3);
    transition: transform var(--trans-fast);
}

.faq-item.open .faq-chevron {
    transform: rotate(180deg);
    color: var(--amber);
}

.faq-a {
    padding: 0 17px 15px;
}

.faq-a p {
    margin: 0 0 11px;
    font-size: 0.88rem;
    line-height: 1.7;
    color: var(--text2);
    text-wrap: pretty;
}

.faq-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 9px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text3);
    font-family: var(--fw);
    font-size: 0.72rem;
    cursor: pointer;
    transition: all var(--trans-fast);
}

.faq-link:hover {
    color: var(--amber);
    border-color: var(--amber-dim);
}

/* ── Empty ────────────────────────────────────────────────────────────── */
.faq-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 3rem 1rem;
    text-align: center;
    color: var(--text3);
}

.faq-empty p {
    margin: 0;
    max-width: 380px;
    font-size: 0.88rem;
    line-height: 1.6;
    color: var(--text2);
}

@media (max-width: 480px) {
    .faq-page {
        padding: 1.5rem 0 3rem;
    }
    .faq-q {
        padding: 13px 14px;
        font-size: 0.88rem;
    }
    .faq-a {
        padding: 0 14px 13px;
    }
}
</style>
