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

export const DEFAULT_LOCALE: Locale = "ru";

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
