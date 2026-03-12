/**
 * Vue Router — SPA navigation for AmneziaWG Architect.
 *
 * Routes:
 *   /           → HomeView      (Generator)
 *   /mergekeys  → MergeKeysView (MergeKeys tool)
 *   /about      → AboutView     (About page)
 *   /iaa        → IaaView       (Install AmneziaWG Anywhere)
 *
 * Uses HTML5 history mode (createWebHistory) for clean URLs (no /#/ prefix).
 * For GitHub Pages compatibility, index.html is copied to 404.html at build
 * time so that direct navigation to sub-routes works correctly.
 *
 * Each route carries SEO meta (title, description, og:*) sourced from
 * the legacy static HTML pages. An afterEach hook syncs them to <head>.
 */

import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
  type RouteRecordRaw,
  type RouteMeta,
} from "vue-router";

/* ── Extended route meta typing ──────────────────────────────── */

declare module "vue-router" {
  interface RouteMeta {
    title?: string;
    description?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  }
}

/* ── Route definitions ───────────────────────────────────────── */

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("@/views/HomeView.vue"),
    meta: {
      title: "AmneziaWG Architect — Генератор конфигураций",
      description:
        "Профессиональный инструмент для тонкой настройки и генерации конфигураций AmneziaWG. Защита от DPI, управление мусорными пакетами и оптимизация протокола.",
      ogTitle: "AmneziaWG Architect — Генератор конфигураций",
      ogDescription:
        "Тонкая настройка параметров AmneziaWG: Jc, Jmin, Jmax, S1–S4, H1–H4, CPS I1–I5. Профили мимикрии QUIC/TLS/DTLS/SIP. Защита от блокировок.",
      ogImage: `${import.meta.env.BASE_URL}assets/og-image.png`,
    },
  },
  {
    path: "/mergekeys",
    name: "mergekeys",
    component: () => import("@/views/MergeKeysView.vue"),
    meta: {
      title: "MergeKeys — AmneziaWG Architect",
      description:
        "Обновите обфускацию AWG-ключа или объедините несколько ключей Amnezia VPN в один.",
      ogTitle: "MergeKeys — AmneziaWG Architect",
      ogDescription:
        "Объединяй ключи Amnezia VPN, обновляй обфускацию — всё локально в браузере.",
      ogImage: `${import.meta.env.BASE_URL}assets/og-mergekeys.png`,
    },
  },
  {
    path: "/about",
    name: "about",
    component: () => import("@/views/AboutView.vue"),
    meta: {
      title: "О проекте — AmneziaWG Architect",
      description:
        "Что такое AmneziaWG Architect? Это интерактивный инструмент для генерации сложных конфигураций обфускации трафика AmneziaWG. Создан для тех, кто хочет вернуть себе свободный интернет.",
      ogTitle: "О проекте — AmneziaWG Architect",
      ogDescription:
        "Твой протокол — твои правила. Разбор архитектуры, безопасности и принципов работы генератора.",
      ogImage: `${import.meta.env.BASE_URL}assets/og-about.png`,
    },
  },
  {
    path: "/iaa",
    name: "iaa",
    component: () => import("@/views/IaaView.vue"),
    meta: {
      title: "IAA — AmneziaWG Architect",
      description:
        "Install AmneziaWG Anywhere — генератор команд для установки и управления AmneziaWG на любой платформе.",
      ogTitle: "IAA — AmneziaWG Architect",
      ogDescription:
        "Генератор команд для установки AmneziaWG на Windows, Linux, macOS.",
      ogImage: `${import.meta.env.BASE_URL}assets/og-iaa.png`,
    },
  },
  {
    // Catch-all redirect to home
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

/* ── Base path detection ─────────────────────────────────────── */

/**
 * Detects the base path for Vue Router based on the current location.
 *
 * Returns:
 * - null: for file:// protocol (signals hash routing should be used)
 * - '/repo/': for GitHub Pages subdirectory (username.github.io/repo/)
 * - '/': for custom domain or GitHub Pages root
 */
function getBasePath(): string | null {
  const { protocol, hostname, pathname } = window.location;

  // For file:// protocol, return null to signal hash routing
  if (protocol === "file:") {
    return null;
  }

  // For GitHub Pages subdirectory (username.github.io/repo-name/)
  // Extract the repo name from the pathname
  if (hostname.match(/\.github\.io$/) && pathname.match(/^\/[^\/]+\//)) {
    return pathname.match(/^\/[^\/]+\//)![0];
  }

  // For custom domain or GitHub Pages root
  return "/";
}

/* ── Router instance ─────────────────────────────────────────── */

const basePath = getBasePath();

const router = createRouter({
  history:
    basePath === null ? createWebHashHistory() : createWebHistory(basePath),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    return { top: 0 };
  },
});

/* ── Sync <head> meta tags on every navigation ───────────────── */

function setMeta(
  name: string,
  content: string,
  attr: "name" | "property" = "name",
) {
  let el = document.querySelector(
    `meta[${attr}="${name}"]`,
  ) as HTMLMetaElement | null;
  if (el) {
    el.setAttribute("content", content);
  } else {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    el.setAttribute("content", content);
    document.head.appendChild(el);
  }
}

router.afterEach((to) => {
  const m = to.meta;

  // Title
  if (m.title) {
    document.title = m.title;
  }

  // Description
  if (m.description) {
    setMeta("description", m.description);
  }

  // Open Graph
  if (m.ogTitle) {
    setMeta("og:title", m.ogTitle, "property");
  }
  if (m.ogDescription) {
    setMeta("og:description", m.ogDescription, "property");
  }
  if (m.ogImage) {
    // Convert relative path to absolute URL for og:image
    const basePath = getBasePath();

    if (basePath === null) {
      // For file:// protocol, use relative path (og:image doesn't matter for local files)
      setMeta("og:image", m.ogImage, "property");
    } else {
      // For web deployment, convert to absolute URL
      const cleanPath = m.ogImage.replace(/^\.\//, "");
      const absoluteUrl = window.location.origin + basePath + cleanPath;
      setMeta("og:image", absoluteUrl, "property");
    }
  }
});

export default router;
