/**
 * Vue Router — SPA navigation for AmneziaWG Architect.
 *
 * Routes (Russian at the root, English under /en):
 *   /            → HomeView      (Generator)
 *   /mergekeys   → MergeKeysView (MergeKeys tool)
 *   /simulator   → SimulatorView (Packet simulator)
 *   /about       → AboutView     (About page)
 *   /faq         → FaqView       (FAQ)
 *   /vaiexia     → VaiexiaView   (VAIEXIA announcement)
 *   /iaa         → redirect to /vaiexia (the page it replaced)
 *
 * The default locale deliberately keeps the bare paths. Everything already
 * indexed against `/about` stays valid, and only the added English tree needs
 * to be crawled fresh.
 *
 * Uses HTML5 history mode for clean URLs. For static hosting, index.html is
 * copied to 404.html at build time so deep links resolve to the SPA.
 *
 * Page metadata lives in `@/i18n/seo` and is applied — together with the
 * canonical link and hreflang alternates — by the afterEach hook below.
 */

import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_META,
  applyLocaleFromRoute,
  isLocale,
  type Locale,
} from "@/i18n";
import { seoFor } from "@/i18n/seo";
import { accentFor, applyAccent } from "@/composables/useTheme";

/* ── Extended route meta typing ──────────────────────────────────────────── */

declare module "vue-router" {
  interface RouteMeta {
    /** Locale this record serves; drives catalog loading and <html lang>. */
    locale?: Locale;
    /** Locale-independent name used to look up SEO copy. */
    seoKey?: string;
  }
}

/* ── Base route definitions (bare paths, no locale prefix) ───────────────── */

/**
 * `component` is typed as a concrete lazy loader rather than
 * `RouteRecordRaw["component"]`, which admits undefined and so lets the
 * generated record match the redirect arm of the RouteRecordRaw union.
 */
interface BaseRoute {
  path: string;
  name: string;
  component: () => Promise<unknown>;
}

const BASE_ROUTES: BaseRoute[] = [
  { path: "/", name: "home", component: () => import("@/views/HomeView.vue") },
  {
    path: "/mergekeys",
    name: "mergekeys",
    component: () => import("@/views/MergeKeysView.vue"),
  },
  {
    path: "/simulator",
    name: "simulator",
    component: () => import("@/views/SimulatorView.vue"),
  },
  {
    path: "/about",
    name: "about",
    component: () => import("@/views/AboutView.vue"),
  },
  { path: "/faq", name: "faq", component: () => import("@/views/FaqView.vue") },
  {
    path: "/vaiexia",
    name: "vaiexia",
    component: () => import("@/views/VaiexiaView.vue"),
  },
];

/** Build the concrete records for one locale. */
function routesForLocale(loc: Locale): RouteRecordRaw[] {
  const prefix = LOCALE_META[loc].prefix;

  return BASE_ROUTES.map(
    ({ path, name, component }): RouteRecordRaw => ({
      // "/" under a prefix must not become "/en/", which would not match.
      path: prefix ? (path === "/" ? prefix : `${prefix}${path}`) : path,
      name: loc === DEFAULT_LOCALE ? name : `${loc}-${name}`,
      component,
      meta: { locale: loc, seoKey: name },
    }),
  );
}

const routes: RouteRecordRaw[] = [
  ...LOCALES.flatMap(routesForLocale),

  // The IAA page was replaced by VAIEXIA. Redirect rather than 404 so old
  // links and any existing index entries land somewhere meaningful.
  { path: "/iaa", redirect: { name: "vaiexia" } },
  { path: "/en/iaa", redirect: { name: "en-vaiexia" } },

  // Catch-all 404, per locale so the shell stays in the right language.
  {
    path: "/en/:pathMatch(.*)*",
    name: "en-not-found",
    component: () => import("@/views/NotFoundView.vue"),
    meta: { locale: "en", seoKey: "not-found" },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("@/views/NotFoundView.vue"),
    meta: { locale: DEFAULT_LOCALE, seoKey: "not-found" },
  },
];

/* ── Router instance ─────────────────────────────────────────────────────── */

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) return { el: to.hash, behavior: "smooth" };
    return { top: 0 };
  },
});

/* ── Locale activation ───────────────────────────────────────────────────── */

/**
 * Load the target catalog before the view renders, so a language switch never
 * paints a frame of half-translated UI.
 */
router.beforeEach(async (to) => {
  const loc = isLocale(to.meta.locale) ? to.meta.locale : DEFAULT_LOCALE;
  await applyLocaleFromRoute(loc);
});

/* ── <head> synchronisation ──────────────────────────────────────────────── */

function setMeta(
  name: string,
  content: string,
  attr: "name" | "property" = "name",
): void {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Absolute URL for a path, respecting the deploy base. */
function absoluteUrl(path: string): string {
  const base = new URL(import.meta.env.BASE_URL, window.location.origin);
  return new URL(path.replace(/^\//, ""), base).toString();
}

function setLink(rel: string, href: string, hreflang?: string): void {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    if (hreflang) el.setAttribute("hreflang", hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

router.afterEach((to) => {
  // The accent is a property of the page, not of the reader, and it matches
  // the colour that page has had in every link preview for a year.
  applyAccent(accentFor(typeof to.name === "string" ? to.name : null));

  const loc = isLocale(to.meta.locale) ? to.meta.locale : DEFAULT_LOCALE;
  const seoKey = to.meta.seoKey ?? "home";
  const seo = seoFor(seoKey, loc);

  document.title = seo.title;
  setMeta("description", seo.description);
  if (seo.keywords) setMeta("keywords", seo.keywords);

  setMeta("og:title", seo.ogTitle, "property");
  setMeta("og:description", seo.ogDescription, "property");
  setMeta("og:image", absoluteUrl(`assets/${seo.ogImage}`), "property");
  setMeta("og:locale", LOCALE_META[loc].tag.replace("-", "_"), "property");
  setMeta("og:url", absoluteUrl(to.path), "property");

  setMeta("twitter:card", "summary_large_image");
  setMeta("twitter:title", seo.ogTitle);
  setMeta("twitter:description", seo.ogDescription);
  setMeta("twitter:image", absoluteUrl(`assets/${seo.ogImage}`));

  // Canonical points at the current locale's own URL; alternates advertise the
  // rest of the tree so engines serve the right language per visitor.
  setLink("canonical", absoluteUrl(to.path));

  const barePath =
    loc === DEFAULT_LOCALE
      ? to.path
      : to.path.slice(LOCALE_META[loc].prefix.length) || "/";

  for (const alt of LOCALES) {
    const prefix = LOCALE_META[alt].prefix;
    const altPath = prefix
      ? barePath === "/"
        ? prefix
        : `${prefix}${barePath}`
      : barePath;
    setLink("alternate", absoluteUrl(altPath), LOCALE_META[alt].tag);
  }
  setLink("alternate", absoluteUrl(barePath), "x-default");
});

export default router;
