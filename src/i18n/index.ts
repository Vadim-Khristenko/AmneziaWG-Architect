/**
 * AmneziaWG Architect — i18n runtime.
 *
 * Deliberately dependency-free. A flat typed catalog plus a single reactive ref
 * is all this app needs, and it costs roughly a kilobyte instead of pulling in
 * a full i18n framework. What it does give us:
 *
 *   - compile-time key checking (a typo will not build)
 *   - `{placeholder}` interpolation
 *   - locale-correct plurals, including the three Russian forms
 *   - lazy catalog loading, so a visitor only downloads their own language
 *   - URL-driven locale, with the default locale kept at the site root
 */

import { computed, ref } from "vue";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_PREFIX,
  LOCALE_TAGS,
  type Locale,
  type MessageValue,
  type PluralForms,
  type TranslateParams,
} from "./types";
import ru, { type Catalog, type MessageKey } from "./locales/ru";

export * from "./types";
export type { MessageKey } from "./locales/ru";

const STORAGE_KEY = "awg-architect:locale";

/** Catalogs already in memory. Russian ships in the main bundle. */
const catalogs: Partial<Record<Locale, Catalog>> = { ru };

const current = ref<Locale>(DEFAULT_LOCALE);

/** Bumped whenever a catalog finishes loading, to re-run every `t()` computed. */
const revision = ref(0);

export const locale = computed(() => current.value);

/* ── Type guards ─────────────────────────────────────────────────────────── */

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/* ── Plural selection ────────────────────────────────────────────────────── */

function isPluralForms(value: MessageValue): value is PluralForms {
  return typeof value === "object" && value !== null && "other" in value;
}

/**
 * Pick a plural form.
 *
 * Russian: 1, 21, 31 → one; 2-4, 22-24 → few; everything else including the
 * 11-19 teens → many. English: 1 → one, else other.
 */
function selectPlural(forms: PluralForms, n: number, loc: Locale): string {
  if (loc === "ru") {
    const mod100 = Math.abs(n) % 100;
    const mod10 = mod100 % 10;
    if (mod100 > 10 && mod100 < 20) return forms.many ?? forms.other;
    if (mod10 === 1) return forms.one;
    if (mod10 > 1 && mod10 < 5) return forms.few ?? forms.other;
    return forms.many ?? forms.other;
  }
  return n === 1 ? forms.one : forms.other;
}

/* ── Interpolation ───────────────────────────────────────────────────────── */

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}

/* ── Translation ─────────────────────────────────────────────────────────── */

/**
 * Translate `key` for the active locale.
 *
 * Falls back to the Russian source when a catalog is still loading or a key is
 * somehow absent, so the UI never renders a raw key to a visitor.
 */
export function translate(key: MessageKey, params?: TranslateParams): string {
  // Touch the revision so callers wrapped in `computed` re-evaluate once a
  // lazily-loaded catalog arrives.
  void revision.value;

  const active = catalogs[current.value];
  const value: MessageValue | undefined = active?.[key] ?? ru[key];

  if (value === undefined) {
    if (import.meta.env.DEV) {
      console.warn(`[i18n] missing key: ${key}`);
    }
    return key;
  }

  const text = isPluralForms(value)
    ? selectPlural(value, params?.n ?? 0, current.value)
    : value;

  return interpolate(text, params);
}

/* ── Catalog loading ─────────────────────────────────────────────────────── */

async function loadCatalog(loc: Locale): Promise<void> {
  if (catalogs[loc]) return;
  if (loc === "en") {
    const mod = await import("./locales/en");
    catalogs.en = mod.default;
  }
  revision.value++;
}

/* ── Document wiring ─────────────────────────────────────────────────────── */

function syncDocumentLang(loc: Locale): void {
  if (typeof document === "undefined") return;
  document.documentElement.lang = LOCALE_TAGS[loc];
}

/**
 * Switch the active locale, loading its catalog first so the UI never flashes
 * a half-translated frame.
 */
export async function setLocale(loc: Locale): Promise<void> {
  if (!isLocale(loc)) return;
  await loadCatalog(loc);
  current.value = loc;
  syncDocumentLang(loc);

  try {
    localStorage.setItem(STORAGE_KEY, loc);
  } catch {
    // Private mode or a blocked storage partition — the URL still carries the
    // locale, so remembering it is a nicety we can lose.
  }
}

/** Set the locale without persisting it — used when the URL is the authority. */
export async function applyLocaleFromRoute(loc: Locale): Promise<void> {
  if (!isLocale(loc) || loc === current.value) {
    syncDocumentLang(current.value);
    return;
  }
  await loadCatalog(loc);
  current.value = loc;
  syncDocumentLang(loc);
}

/* ── Locale detection ────────────────────────────────────────────────────── */

/** Read a stored preference, if the visitor has one. */
export function storedLocale(): Locale | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return isLocale(raw) ? raw : null;
  } catch {
    return null;
  }
}

/** Best guess from the browser's language list. */
export function browserLocale(): Locale | null {
  if (typeof navigator === "undefined") return null;
  const langs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  for (const raw of langs) {
    const base = raw?.split("-")[0]?.toLowerCase();
    if (isLocale(base)) return base;
  }
  return null;
}

/* ── URL helpers ─────────────────────────────────────────────────────────── */

/** Strip a locale prefix from a path, returning the locale and bare path. */
export function splitLocalePath(path: string): {
  locale: Locale;
  path: string;
} {
  for (const loc of LOCALES) {
    const prefix = LOCALE_PREFIX[loc];
    if (!prefix) continue;
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      return { locale: loc, path: path.slice(prefix.length) || "/" };
    }
  }
  return { locale: DEFAULT_LOCALE, path: path || "/" };
}

/** Prefix a bare path for the given locale. */
export function localizePath(path: string, loc: Locale): string {
  const bare = path.startsWith("/") ? path : `/${path}`;
  const prefix = LOCALE_PREFIX[loc];
  if (!prefix) return bare;
  return bare === "/" ? prefix : `${prefix}${bare}`;
}

/* ── Composable ──────────────────────────────────────────────────────────── */

export function useI18n() {
  return {
    locale,
    t: translate,
    setLocale,
    localizePath,
  };
}
