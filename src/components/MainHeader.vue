<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, type Component } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
    Menu,
    X,
    Github,
    Layers,
    Info,
    Download,
    HelpCircle,
    Rocket,
    Languages,
    Check,
    ChevronRight,
} from "lucide-vue-next";
import {
    LOCALES,
    LOCALE_META,
    localizePath,
    splitLocalePath,
    useI18n,
    type Locale,
    type MessageKey,
} from "@/i18n";

interface NavLink {
    /** Catalog key, resolved at render so the label follows the locale. */
    labelKey: MessageKey;
    /** Bare path; the locale prefix is applied when rendering. */
    to: string;
    icon: Component;
}

const route = useRoute();
const router = useRouter();
const { locale, t, setLocale } = useI18n();

const isMenuOpen = ref(false);
const isScrolled = ref(false);
const isLangOpen = ref(false);

const faviconUrl = `${import.meta.env.BASE_URL}assets/favicon.svg`;

const navLinks: NavLink[] = [
    { labelKey: "nav.generator", to: "/", icon: Layers },
    { labelKey: "nav.mergekeys", to: "/mergekeys", icon: Download },
    { labelKey: "nav.faq", to: "/faq", icon: HelpCircle },
    { labelKey: "nav.vaiexia", to: "/vaiexia", icon: Rocket },
    { labelKey: "nav.about", to: "/about", icon: Info },
];

/** Nav targets carry the active locale's prefix. */
const resolvedLinks = computed(() =>
    navLinks.map((link) => ({
        ...link,
        href: localizePath(link.to, locale.value),
        label: t(link.labelKey),
    })),
);

const isActive = (href: string): boolean => {
    const root = localizePath("/", locale.value) || "/";
    if (href === root) return route.path === href || route.path === `${href}/`;
    return route.path === href || route.path.startsWith(`${href}/`);
};

/**
 * Switch language while staying on the same page: strip the current prefix,
 * re-apply the target one, and keep any hash so a deep-linked FAQ answer
 * survives the switch.
 */
async function switchLocale(next: Locale): Promise<void> {
    isLangOpen.value = false;
    if (next === locale.value) return;

    const { path } = splitLocalePath(route.path);
    await setLocale(next);
    await router.push({ path: localizePath(path, next), hash: route.hash });
}

function closeLang(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest(".lang-wrap")) isLangOpen.value = false;
}

const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value;
    if (isMenuOpen.value) {
        document.body.style.overflow = "hidden";
    } else {
        document.body.style.overflow = "";
    }
};

const handleScroll = () => {
    isScrolled.value = window.scrollY > 10;
};

onMounted(() => {
    window.addEventListener("scroll", handleScroll);
    document.addEventListener("click", closeLang);
});

onUnmounted(() => {
    window.removeEventListener("scroll", handleScroll);
    document.removeEventListener("click", closeLang);
    // Leaving with the menu open would strand the body scroll lock.
    document.body.style.overflow = "";
});
</script>

<template>
    <header class="header" :class="{ 'is-scrolled': isScrolled }">
        <div class="header-inner container">
            <!-- Brand Logo -->
            <router-link
                :to="localizePath('/', locale)"
                class="brand"
                @click="isMenuOpen = false"
            >
                <div class="brand-logo">
                    <img :src="faviconUrl" alt="AWG Logo" />
                </div>
                <div class="brand-info">
                    <span class="brand-title">AmneziaWG</span>
                    <span class="brand-subtitle">Architect</span>
                </div>
            </router-link>

            <!-- Desktop Nav -->
            <nav class="nav-desktop">
                <div class="nav-list">
                    <router-link
                        v-for="link in resolvedLinks"
                        :key="link.href"
                        :to="link.href"
                        class="nav-link"
                        :class="{ 'router-link-active': isActive(link.href) }"
                    >
                        <span>{{ link.label }}</span>
                    </router-link>
                </div>
                <div class="nav-sep"></div>

                <!-- Language switcher -->
                <div class="lang-wrap">
                    <button
                        class="lang-btn"
                        :aria-label="t('lang.switch')"
                        :aria-expanded="isLangOpen"
                        aria-haspopup="listbox"
                        @click="isLangOpen = !isLangOpen"
                    >
                        <Languages :size="18" />
                        <span class="lang-code">{{
                            locale.toUpperCase()
                        }}</span>
                    </button>

                    <transition name="fade">
                        <ul v-if="isLangOpen" class="lang-menu" role="listbox">
                            <li v-for="loc in LOCALES" :key="loc">
                                <button
                                    class="lang-opt"
                                    :class="{ active: loc === locale }"
                                    role="option"
                                    :aria-selected="loc === locale"
                                    @click="switchLocale(loc)"
                                >
                                    <span>{{ LOCALE_META[loc].name }}</span>
                                    <Check v-if="loc === locale" :size="14" />
                                </button>
                            </li>
                        </ul>
                    </transition>
                </div>

                <a
                    href="https://github.com/Vadim-Khristenko/AmneziaWG-Architect"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="gh-link"
                    :title="t('nav.github')"
                >
                    <Github :size="20" />
                </a>
            </nav>

            <!-- Mobile Toggle -->
            <button
                class="menu-toggle"
                @click="toggleMenu"
                aria-label="Toggle navigation"
            >
                <Menu v-if="!isMenuOpen" :size="24" />
                <X v-else :size="24" />
            </button>
        </div>

        <!-- Mobile Menu Overlay -->
        <transition name="fade">
            <div
                v-if="isMenuOpen"
                class="mobile-overlay"
                @click="toggleMenu"
            ></div>
        </transition>

        <!-- Mobile Slide Panel -->
        <transition name="slide">
            <div v-if="isMenuOpen" class="mobile-panel">
                <div class="mobile-head">
                    <span class="mobile-title">{{ t("nav.menu") }}</span>
                </div>
                <div class="mobile-links">
                    <router-link
                        v-for="link in resolvedLinks"
                        :key="link.href"
                        :to="link.href"
                        class="mobile-item"
                        :class="{ active: isActive(link.href) }"
                        @click="toggleMenu"
                    >
                        <component :is="link.icon" :size="20" class="m-icon" />
                        <span class="m-text">{{ link.label }}</span>
                        <ChevronRight :size="16" class="m-arrow" />
                    </router-link>
                </div>

                <div class="mobile-lang">
                    <span class="mobile-lang-label">
                        <Languages :size="15" />
                        {{ t("lang.label") }}
                    </span>
                    <div class="mobile-lang-opts">
                        <button
                            v-for="loc in LOCALES"
                            :key="loc"
                            class="mobile-lang-opt"
                            :class="{ active: loc === locale }"
                            @click="
                                switchLocale(loc);
                                toggleMenu();
                            "
                        >
                            {{ LOCALE_META[loc].name }}
                        </button>
                    </div>
                </div>

                <div class="mobile-footer">
                    <a
                        href="https://github.com/Vadim-Khristenko/AmneziaWG-Architect"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="mobile-gh"
                    >
                        <Github :size="18" />
                        <span>{{ t("nav.github") }}</span>
                    </a>
                </div>
            </div>
        </transition>
    </header>
</template>

<style scoped>
/* ── Header Container ─────────────────────────────────────────────────── */
.header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 72px;
    z-index: 1000;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    border-bottom: 1px solid transparent;
}

.header.is-scrolled {
    height: 64px;
    background: rgba(14, 11, 7, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom-color: rgba(232, 168, 64, 0.1);
}

.header-inner {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

/* ── Brand ────────────────────────────────────────────────────────────── */
.brand {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    user-select: none;
    z-index: 1002;
}

.brand-logo {
    width: 38px;
    height: 38px;
    background: linear-gradient(
        135deg,
        rgba(232, 168, 64, 0.1) 0%,
        rgba(232, 168, 64, 0.05) 100%
    );
    border: 1px solid rgba(232, 168, 64, 0.2);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.brand-logo img {
    width: 36px;
    height: 36px;
    object-fit: contain;
}

.brand-info {
    display: flex;
    flex-direction: column;
}

.brand-title {
    font-family: var(--fu);
    font-weight: 800;
    font-size: 1.05rem;
    color: var(--text);
    line-height: 1;
    letter-spacing: -0.02em;
}

.brand-subtitle {
    font-family: var(--fm);
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--text3);
    margin-top: 3px;
}

/* ── Desktop Nav ──────────────────────────────────────────────────────── */
.nav-desktop {
    display: none;
    align-items: center;
    gap: 24px;
}

@media (min-width: 860px) {
    .nav-desktop {
        display: flex;
    }
}

.nav-list {
    display: flex;
    gap: 6px;
}

.nav-link {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    border-radius: 100px;
    color: var(--text2);
    font-size: 0.85rem;
    font-weight: 600;
    transition: all 0.2s;
    position: relative;
}

.nav-link:hover {
    color: var(--accent);
    background: rgba(232, 168, 64, 0.04);
}

.nav-link.router-link-active {
    color: var(--text);
    background: rgba(232, 168, 64, 0.08);
}

.nav-link.router-link-active::before {
    content: "";
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--accent);
    opacity: 0;
}

.nav-sep {
    width: 1px;
    height: 18px;
    background: var(--border);
}

.gh-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    color: var(--text2);
    transition: all 0.2s;
    border: 1px solid transparent;
}

.gh-link:hover {
    color: var(--accent);
    background: var(--bg2);
    border-color: var(--border);
}

/* ── Language switcher ────────────────────────────────────────────────── */
.lang-wrap {
    position: relative;
}

.lang-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    height: 36px;
    padding: 0 10px;
    border-radius: 100px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text2);
    font-family: var(--fw);
    font-weight: 700;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
}

.lang-btn:hover,
.lang-btn[aria-expanded="true"] {
    color: var(--accent);
    background: var(--bg2);
    border-color: var(--border);
}

.lang-code {
    letter-spacing: 0.04em;
}

.lang-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 60;
    min-width: 150px;
    margin: 0;
    padding: 5px;
    list-style: none;
    background: var(--bg2);
    border: 1px solid var(--border2);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
}

.lang-opt {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
    padding: 8px 10px;
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text2);
    font-family: var(--fw);
    font-size: 0.82rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.15s;
}

.lang-opt:hover {
    background: var(--bg4);
    color: var(--text);
}

.lang-opt.active {
    color: var(--amber);
}

/* ── Mobile language switcher ─────────────────────────────────────────── */
.mobile-lang {
    padding: 16px 20px;
    border-top: 1px solid var(--border);
}

.mobile-lang-label {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 10px;
    color: var(--text2);
    font-family: var(--fw);
    font-weight: 700;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.mobile-lang-opts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
}

.mobile-lang-opt {
    padding: 9px 10px;
    border: 1px solid var(--border2);
    border-radius: var(--radius-sm);
    background: var(--bg2);
    color: var(--text2);
    font-family: var(--fw);
    font-weight: 700;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.15s;
}

.mobile-lang-opt.active {
    background: var(--amber);
    border-color: var(--amber);
    color: var(--bg);
}

/* ── Mobile Toggle ────────────────────────────────────────────────────── */
.menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: transparent;
    border: none;
    color: var(--text);
    cursor: pointer;
    z-index: 1002;
}

@media (min-width: 860px) {
    .menu-toggle {
        display: none;
    }
}

/* ── Mobile Panel ─────────────────────────────────────────────────────── */
.mobile-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 1001;
}

.mobile-panel {
    position: fixed;
    top: 0;
    right: 0;
    width: 280px;
    height: 100vh;
    background: var(--bg2);
    border-left: 1px solid var(--border);
    z-index: 1002;
    padding: 80px 20px 20px;
    display: flex;
    flex-direction: column;
    box-shadow: -10px 0 40px rgba(0, 0, 0, 0.5);
}

.mobile-head {
    margin-bottom: 20px;
    padding-left: 12px;
}

.mobile-title {
    font-family: var(--fu);
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text3);
}

.mobile-links {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
}

.mobile-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 16px;
    border-radius: 12px;
    color: var(--text2);
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s;
    background: rgba(255, 255, 255, 0.02);
}

.mobile-item:hover,
.mobile-item.active {
    background: rgba(232, 168, 64, 0.08);
    color: var(--accent);
}

.m-icon {
    opacity: 0.7;
}

.mobile-item.active .m-icon {
    opacity: 1;
    color: var(--accent);
}

.m-arrow {
    margin-left: auto;
    opacity: 0.3;
}

.mobile-footer {
    margin-top: auto;
    border-top: 1px solid var(--border2);
    padding-top: 20px;
}

.mobile-gh {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 12px;
    border-radius: 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--text);
    font-size: 0.9rem;
    font-weight: 600;
}

/* ── Transitions ──────────────────────────────────────────────────────── */
.slide-enter-active,
.slide-leave-active {
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-enter-from,
.slide-leave-to {
    transform: translateX(100%);
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
