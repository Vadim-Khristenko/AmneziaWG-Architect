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
      title: "IAA — Веб-панель VPN",
      description:
        "Быстрая адаптивная панель для управления Amnezia VPN и другими VPN-решениями. Telegram-интеграция, мульти-протокольная поддержка.",
      ogTitle: "IAA — Веб-панель VPN",
      ogDescription:
        "Быстрая адаптивная панель для управления VPN-серверами. Amnezia, WireGuard, XRay.",
      ogImage: `${import.meta.env.BASE_URL}assets/og-iaa.png`,
    },
  },
  {
    // Catch-all 404
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("@/views/NotFoundView.vue"),
    meta: {
      title: "Страница не найдена — AmneziaWG Architect",
      description:
        "Кажется, вы перешли по неверной ссылке или страница была удалена.",
    },
  },
];

/* ── Router instance ─────────────────────────────────────────── */

/**
 * Use a stable history base so direct navigation always resolves to the SPA,
 * while the build-time stub pages continue to serve bot-friendly metadata.
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
    const cleanPath = m.ogImage.replace(/^\.\//, "");
    const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);
    const absoluteUrl = new URL(cleanPath, baseUrl).toString();
    setMeta("og:image", absoluteUrl, "property");
  }
});

export default router;
