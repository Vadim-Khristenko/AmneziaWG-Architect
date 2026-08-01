/**
 * Which colour a page wears, and whether it is light or dark.
 *
 * Two separate things, deliberately. The accent belongs to the page — the FAQ
 * is teal wherever you read it, the same teal its link preview has been for a
 * year — and the scheme belongs to the reader. Tying them together is what
 * makes a "dark mode" that also changes the brand.
 *
 * Both land on `<html>` as attributes, which is all `assets/theme.css` needs:
 * `data-accent` selects the accent channels, `data-theme` sets `color-scheme`,
 * and `light-dark()` does the rest.
 */

import { ref, watch } from "vue";

/** The six the link previews already use, so a page matches its own card. */
export type Accent = "amber" | "gold" | "teal" | "green" | "blue" | "purple";

/**
 * What the reader asked for.
 *
 * `system` is not the absence of a choice — it is a choice, and the one most
 * people want. Storing it explicitly is what lets someone go back to it after
 * trying the other two.
 */
export type ThemeChoice = "system" | "light" | "dark";

const STORAGE_KEY = "awg-architect:theme";

const CHOICES: readonly ThemeChoice[] = ["system", "light", "dark"];

export const theme = ref<ThemeChoice>("system");

/** Route name (without a locale prefix) to the colour that page wears. */
const PAGE_ACCENT: Record<string, Accent> = {
  home: "amber",
  faq: "teal",
  about: "gold",
  mergekeys: "green",
  simulator: "blue",
  vaiexia: "purple",
};

export function accentFor(routeName: string | undefined | null): Accent {
  if (!routeName) return "amber";
  // `en-faq` and `faq` are the same page in two languages, not two pages.
  const base = routeName.replace(/^[a-z]{2}-/, "");
  return PAGE_ACCENT[base] ?? "amber";
}

export function applyAccent(accent: Accent): void {
  document.documentElement.dataset.accent = accent;
}

function applyTheme(choice: ThemeChoice): void {
  const root = document.documentElement;
  // No attribute means `color-scheme: light dark`, which follows the system.
  if (choice === "system") delete root.dataset.theme;
  else root.dataset.theme = choice;
}

/** Read the stored choice. Called once, before the first paint if possible. */
export function initTheme(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (CHOICES as readonly string[]).includes(stored)) {
      theme.value = stored as ThemeChoice;
    }
  } catch {
    // Storage blocked. The system default is a perfectly good answer.
  }
  applyTheme(theme.value);
}

export function setTheme(choice: ThemeChoice): void {
  theme.value = choice;
}

/** Step through the three, which is what a single button wants. */
export function cycleTheme(): ThemeChoice {
  const next = CHOICES[(CHOICES.indexOf(theme.value) + 1) % CHOICES.length]!;
  setTheme(next);
  return next;
}

watch(theme, (choice) => {
  applyTheme(choice);
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // Not being able to remember it is not a reason to refuse to do it.
  }
});
