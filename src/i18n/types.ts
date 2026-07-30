/**
 * AmneziaWG Architect — i18n types.
 *
 * Catalogs are *flat*: keys are dotted strings like `home.hero.title` rather
 * than nested objects. That keeps `keyof` exact and instant, so a typo is a
 * compile error and editors autocomplete every key without the recursive type
 * gymnastics a nested catalog needs.
 */

/** Locales the UI ships. `ru` is the source catalog. */
export const LOCALES = ["ru", "en"] as const;

export type Locale = (typeof LOCALES)[number];

// A literal, not `Locale`: `Localised<T>` requires exactly this key, and a
// union-typed constant would make every `content[DEFAULT_LOCALE]` possibly
// undefined even though the type guarantees it is there.
export const DEFAULT_LOCALE = "ru" satisfies Locale;

/**
 * URL prefix per locale. The default locale stays at the site root so every
 * existing URL — and everything already indexed against it — keeps working.
 */
export const LOCALE_PREFIX: Record<Locale, string> = {
  ru: "",
  en: "/en",
};

/** Human-readable names, each written in its own language. */
export const LOCALE_NAMES: Record<Locale, string> = {
  ru: "Русский",
  en: "English",
};

/** BCP 47 tags for <html lang> and hreflang. */
export const LOCALE_TAGS: Record<Locale, string> = {
  ru: "ru-RU",
  en: "en",
};

/**
 * Plural forms. Russian needs three (one/few/many), English two (one/other),
 * so `other` is the only required member and the rest are filled per locale.
 */
export interface PluralForms {
  one: string;
  few?: string;
  many?: string;
  other: string;
}

export type MessageValue = string | PluralForms;

/** Values substituted into `{placeholder}` slots. */
export type TranslateParams = Record<string, string | number> & {
  /** Drives plural selection when the message has forms. */
  n?: number;
};

/* ── Localised content ────────────────────────────────────────────────────── */

/**
 * A piece of content that exists in several languages.
 *
 * Only the source locale is required. Everything else is optional and falls
 * back, which is what makes adding a language cheap: the locale starts working
 * the moment it is declared, and translations land one at a time afterwards.
 *
 * This used to be a plain `Record<Locale, T>`, which meant the opposite —
 * declaring a third locale produced 187 compile errors across the FAQ, the
 * changelog and the support page, and nothing built until every last string
 * had been translated. Interface strings still use the strict catalogue,
 * where completeness is checked and worth enforcing; long-form content does
 * not, because a missing FAQ answer should show the Russian one rather than
 * stop the build.
 */
export type Localised<T> = { [DEFAULT_LOCALE]: T } & Partial<
  Record<Locale, T>
>;

/**
 * The value for a locale, falling back to the source language.
 *
 * Callers get a value, never `undefined`, so a partially translated catalogue
 * degrades to a readable page instead of a blank one.
 */
export function pick<T>(content: Localised<T>, loc: Locale): T {
  return (content[loc] ?? content[DEFAULT_LOCALE]) as T;
}

/** Which locales a piece of content has been translated into. */
export function translatedInto<T>(content: Localised<T>): Locale[] {
  return LOCALES.filter((loc) => content[loc] !== undefined);
}
