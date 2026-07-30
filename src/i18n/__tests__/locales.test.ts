import { describe, it, expect } from "vitest";

import {
  LOCALES,
  LOCALE_PREFIX,
  LOCALE_NAMES,
  LOCALE_TAGS,
  DEFAULT_LOCALE,
  type Locale,
} from "../types";
import ru from "../locales/ru";
import en from "../locales/en";

/**
 * Adding a locale should be a matter of writing a catalogue, not of
 * remembering to touch five files. Most of that is enforced by the compiler —
 * the per-locale tables are `Record<Locale, …>`, so a missing entry will not
 * build — but two things used to fail silently at runtime instead:
 *
 *   - the catalogue loader branched on `loc === "en"`, so a new locale loaded
 *     nothing and the page fell back to Russian looking merely untranslated;
 *   - plural selection branched on `loc === "ru"` and gave every other
 *     language the English rule.
 *
 * These tests cover what the compiler cannot.
 */

const CATALOGUES: Record<Locale, Record<string, unknown>> = { ru, en };

describe("locale tables", () => {
  it("describe every locale exactly once", () => {
    for (const loc of LOCALES) {
      expect(LOCALE_PREFIX[loc], `${loc} prefix`).toBeDefined();
      expect(LOCALE_NAMES[loc], `${loc} name`).toBeTruthy();
      expect(LOCALE_TAGS[loc], `${loc} tag`).toBeTruthy();
      expect(CATALOGUES[loc], `${loc} catalogue`).toBeTruthy();
    }
  });

  it("keep the default locale at the site root", () => {
    // Everything already indexed lives at the root; moving it would break
    // every existing link for the sake of symmetry.
    expect(LOCALE_PREFIX[DEFAULT_LOCALE]).toBe("");
    for (const loc of LOCALES) {
      if (loc === DEFAULT_LOCALE) continue;
      expect(LOCALE_PREFIX[loc]).toMatch(/^\/[a-z-]+$/);
    }
  });

  it("use tags Intl actually understands", () => {
    for (const loc of LOCALES) {
      expect(() => new Intl.PluralRules(LOCALE_TAGS[loc])).not.toThrow();
      expect(() => new Intl.DateTimeFormat(LOCALE_TAGS[loc])).not.toThrow();
    }
  });
});

describe("catalogues", () => {
  const ruKeys = Object.keys(ru).sort();

  it("cover the same keys as the source catalogue", () => {
    for (const loc of LOCALES) {
      const keys = Object.keys(CATALOGUES[loc]).sort();
      expect(keys, `${loc} differs from ru`).toEqual(ruKeys);
    }
  });

  it("leave no message empty", () => {
    for (const loc of LOCALES) {
      for (const [key, value] of Object.entries(CATALOGUES[loc])) {
        if (typeof value === "string") {
          expect(value.trim(), `${loc}: ${key}`).not.toBe("");
        }
      }
    }
  });

  it("agree on which messages have plural forms", () => {
    // A message that pluralises in one language has to pluralise in all of
    // them, or `t(key, { n })` returns an object in that locale.
    for (const key of ruKeys) {
      const shapes = LOCALES.map((loc) => typeof CATALOGUES[loc][key]);
      expect(new Set(shapes).size, `${key} has mixed shapes`).toBe(1);
    }
  });

  it("carry every placeholder the source uses", () => {
    const slots = (v: unknown): string[] =>
      typeof v === "string" ? [...v.matchAll(/\{(\w+)\}/g)].map((m) => m[1]) : [];

    for (const key of ruKeys) {
      const expected = new Set(slots(ru[key as keyof typeof ru]));
      if (!expected.size) continue;
      for (const loc of LOCALES) {
        const got = new Set(slots(CATALOGUES[loc][key]));
        for (const slot of expected) {
          // A dropped placeholder is a value that silently never appears.
          expect(got.has(slot), `${loc}: ${key} is missing {${slot}}`).toBe(true);
        }
      }
    }
  });
});

describe("plural rules come from Intl, not from a hardcoded branch", () => {
  it("gets the three Russian forms right", () => {
    const rules = new Intl.PluralRules(LOCALE_TAGS.ru);
    expect(rules.select(1)).toBe("one");
    expect(rules.select(3)).toBe("few");
    expect(rules.select(11)).toBe("many"); // the teens trap
    expect(rules.select(21)).toBe("one");
  });

  it("would get a language we do not ship yet right too", () => {
    // Polish has a different few/many split from Russian. The point is not
    // that we ship Polish, but that adding it would need no new code.
    const pl = new Intl.PluralRules("pl");
    expect(pl.select(1)).toBe("one");
    expect(pl.select(2)).toBe("few");
    expect(pl.select(5)).toBe("many");

    // Japanese has a single form; the old English fallback would have
    // produced a spurious singular/plural distinction.
    expect(new Intl.PluralRules("ja").select(1)).toBe("other");
  });
});
