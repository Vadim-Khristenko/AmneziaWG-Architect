<script setup lang="ts">
import { ref, onUnmounted } from "vue";
import { useRoute } from "vue-router";

interface NavLink {
    name: string;
    to: string;
}

const route = useRoute();
const isMenuOpen = ref(false);

const faviconUrl =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23f5c060'/%3E%3Cstop offset='1' stop-color='%23c48520'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='14' fill='%230e0b07'/%3E%3Cpath d='M14 40 32 14l18 26h-8l-10-15-10 15h-8Z' fill='url(%23g)'/%3E%3Ccircle cx='32' cy='43' r='6' fill='%23f5c060'/%3E%3C/svg%3E";

const navLinks: NavLink[] = [
    { name: "Генератор", to: "/" },
    { name: "MergeKeys", to: "/mergekeys" },
    { name: "Установка", to: "/iaa" },
    { name: "О проекте", to: "/about" },
];

const isActive = (linkTo: string): boolean => {
    if (linkTo === "/") return route.path === "/";
    return route.path.startsWith(linkTo);
};

const closeMenu = () => {
    isMenuOpen.value = false;
    document.body.style.overflow = "";
};

const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value;
    document.body.style.overflow = isMenuOpen.value ? "hidden" : "";
};

onUnmounted(() => {
    document.body.style.overflow = "";
});
</script>

<template>
    <header class="header">
        <div class="header-inner container">
            <router-link to="/" class="brand" @click="closeMenu">
                <div class="brand-logo">
                    <img :src="faviconUrl" alt="AWG" />
                </div>
                <div class="brand-info">
                    <span class="brand-title">AmneziaWG</span>
                    <span class="brand-subtitle">Architect Lite</span>
                </div>
            </router-link>

            <nav class="nav-desktop">
                <router-link
                    v-for="link in navLinks"
                    :key="link.to"
                    :to="link.to"
                    class="nav-link"
                    :class="{ 'router-link-active': isActive(link.to) }"
                >
                    <span>{{ link.name }}</span>
                </router-link>
                <a
                    href="https://github.com/Vadim-Khristenko/AmneziaWG-Architect"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="gh-link"
                >
                    GitHub
                </a>
            </nav>

            <button
                class="menu-toggle"
                @click="toggleMenu"
                aria-label="Toggle navigation"
            >
                {{ isMenuOpen ? "✕" : "☰" }}
            </button>
        </div>

        <div v-if="isMenuOpen" class="mobile-overlay" @click="toggleMenu"></div>

        <div v-if="isMenuOpen" class="mobile-panel">
            <div class="mobile-links">
                <router-link
                    v-for="link in navLinks"
                    :key="link.to"
                    :to="link.to"
                    class="mobile-item"
                    :class="{ active: isActive(link.to) }"
                    @click="closeMenu"
                >
                    <span class="m-text">{{ link.name }}</span>
                </router-link>
            </div>

            <div class="mobile-footer">
                <a
                    href="https://github.com/Vadim-Khristenko/AmneziaWG-Architect"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="mobile-gh"
                >
                    GitHub Repository
                </a>
            </div>
        </div>
    </header>
</template>

<style scoped>
.header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 64px;
    z-index: 1000;
    background: rgba(14, 11, 7, 0.92);
    border-bottom: 1px solid var(--border2);
}

.header-inner {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    user-select: none;
}

.brand-logo {
    width: 34px;
    height: 34px;
    border: 1px solid rgba(232, 168, 64, 0.2);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.brand-logo img {
    width: 30px;
    height: 30px;
    object-fit: contain;
}

.brand-info {
    display: flex;
    flex-direction: column;
}

.brand-title {
    font-family: var(--fu);
    font-weight: 800;
    font-size: 1rem;
    color: var(--text);
    line-height: 1;
}

.brand-subtitle {
    font-family: var(--fm);
    font-size: 0.62rem;
    color: var(--text3);
    margin-top: 2px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
}

.nav-desktop {
    display: none;
    align-items: center;
    gap: 8px;
}

@media (min-width: 860px) {
    .nav-desktop {
        display: flex;
    }
}

.nav-link {
    display: flex;
    align-items: center;
    padding: 6px 12px;
    border-radius: 999px;
    color: var(--text2);
    font-size: 0.82rem;
    font-weight: 600;
}

.nav-link.router-link-active {
    color: var(--text);
    background: rgba(232, 168, 64, 0.08);
}

.gh-link {
    margin-left: 8px;
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid var(--border2);
    color: var(--text2);
    font-size: 0.78rem;
    font-weight: 600;
}

.menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--border2);
    border-radius: 8px;
    background: var(--bg2);
    color: var(--text);
    font-size: 1.05rem;
    line-height: 1;
    cursor: pointer;
    z-index: 1002;
}

@media (min-width: 860px) {
    .menu-toggle {
        display: none;
    }
}

.mobile-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    z-index: 1001;
}

.mobile-panel {
    position: fixed;
    top: 0;
    right: 0;
    width: 270px;
    height: 100vh;
    background: var(--bg2);
    border-left: 1px solid var(--border);
    z-index: 1002;
    padding: 72px 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.mobile-links {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
}

.mobile-item {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    border-radius: 10px;
    color: var(--text2);
    font-weight: 600;
    background: rgba(255, 255, 255, 0.02);
}

.mobile-item.active {
    background: rgba(232, 168, 64, 0.08);
    color: var(--accent);
}

.mobile-footer {
    margin-top: auto;
    padding-top: 12px;
    border-top: 1px solid var(--border2);
}

.mobile-gh {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 10px;
    border-radius: 10px;
    border: 1px solid var(--border2);
    color: var(--text);
    font-size: 0.84rem;
    font-weight: 600;
    background: var(--bg);
}
</style>
