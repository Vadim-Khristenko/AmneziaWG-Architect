/**
 * AmneziaWG Architect — Open Graph image generator.
 *
 * A TypeScript-era rewrite of the original `ogImageGen.py`: same visual
 * language, but composed as SVG and rasterised with resvg instead of drawn
 * pixel by pixel with Pillow. That buys real vector type, gradients and
 * filters, and makes the layouts easy to change.
 *
 * Emits one image per page per locale, in two aspect ratios:
 *   1200×630  — Open Graph and twitter:summary_large_image
 *   1200×1200 — square crop for platforms that centre-crop feeds
 *
 * Output is deterministic: no randomness, so regenerating produces byte-stable
 * files and a clean diff.
 *
 *   bun run og
 */

import fs from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { ensureFonts } from "./fonts.mjs";
import {
  THEMES,
  COLORS,
  badge,
  background,
  brackets,
  defs,
  footer,
  packetTrain,
  rule,
  subtitle,
  tagRow,
  title,
} from "./svg.mjs";

const OUT_DIR = path.join(import.meta.dirname, "../../public/assets");
const SITE = "architect.vai-rice.space";

/* ── Page definitions ────────────────────────────────────────────────────── */

/**
 * `slug` becomes `og-<slug>.png` for Russian and `og-<slug>-en.png` for
 * English, matching the filenames referenced from `src/i18n/seo.ts`.
 */
const PAGES = [
  {
    slug: "image",
    theme: "amber",
    badge: "AWG 3.0 READY",
    titleLeft: "AWG",
    titleRight: "ARCHITECT",
    ru: {
      subtitle: "Генератор продвинутой обфускации для обхода DPI",
      tagline: "Всё считается в браузере",
    },
    en: {
      subtitle: "Advanced obfuscation generator for defeating DPI",
      tagline: "Everything runs in your browser",
    },
    tags: ["QUIC", "TLS 1.3", "DTLS", "SIP", "HTTP/3"],
  },
  {
    slug: "faq",
    theme: "teal",
    badge: "FAQ",
    titleLeft: "AWG",
    titleRight: "FAQ",
    ru: {
      subtitle: "Параметры, версии и разбор типичных проблем",
      tagline: "Поиск, категории, прямые ссылки на ответы",
    },
    en: {
      subtitle: "Parameters, versions and common failure modes",
      tagline: "Search, categories, linkable answers",
    },
    tags: ["Jc", "S1–S4", "H1–H4", "I1–I5", "3.0"],
  },
  {
    slug: "about",
    theme: "gold",
    badge: "ABOUT",
    titleLeft: "AWG",
    titleRight: "ARCHITECT",
    ru: {
      subtitle: "Твой протокол — твои правила",
      tagline: "Открытый код, ноль телеметрии",
    },
    en: {
      subtitle: "Your protocol, your rules",
      tagline: "Open source, zero telemetry",
    },
    tags: ["Vue 3", "TypeScript", "OFFLINE", "MIT"],
  },
  {
    slug: "mergekeys",
    theme: "green",
    badge: "MERGE KEYS",
    titleLeft: "MERGE",
    titleRight: "KEYS",
    ru: {
      subtitle: "Редактор и объединение ключей Amnezia VPN",
      tagline: "Ключи не покидают браузер",
    },
    en: {
      subtitle: "Edit and merge Amnezia VPN keys",
      tagline: "Keys never leave your browser",
    },
    tags: ["vpn://", "AWG", "XRay", "OpenVPN"],
  },
  {
    slug: "simulator",
    theme: "blue",
    badge: "PACKET SIMULATOR",
    titleLeft: "PACKET",
    titleRight: "SIM",
    ru: {
      subtitle: "Визуализация handshake AmneziaWG",
      tagline: "Посмотрите, что видит DPI",
    },
    en: {
      subtitle: "Visualise the AmneziaWG handshake",
      tagline: "See what DPI actually sees",
    },
    tags: ["CPS", "JUNK", "INIT", "DATA"],
  },
  {
    slug: "vaiexia",
    theme: "purple",
    badge: "COMING SOON",
    titleLeft: "VAI",
    titleRight: "EXIA",
    ru: {
      subtitle: "Веб-панель и бот для Telegram, Discord, Matrix",
      tagline: "Сервер или кластер — откуда угодно",
    },
    en: {
      subtitle: "Web panel and Telegram, Discord, Matrix bots",
      tagline: "Your server or cluster, from anywhere",
    },
    tags: ["PANEL", "BOTS", "CLUSTER", "1-CLICK"],
  },
];

const LOCALES = ["ru", "en"];

/* ── Layouts ─────────────────────────────────────────────────────────────── */

/** Wide 1200×630 — the primary Open Graph card. */
function wideSvg(page, loc) {
  const W = 1200;
  const H = 630;
  const cx = W / 2;
  const copy = page[loc];
  const T = THEMES[page.theme] ?? THEMES.amber;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${defs(T)}
  ${background(W, H, T)}
  ${brackets(W, H, T)}
  ${badge(cx, 92, page.badge, T)}
  ${title(cx, 262, page.titleLeft, page.titleRight, T, 96)}
  ${subtitle(cx, 322, copy.subtitle, T, 29)}
  ${rule(cx, 360, 460)}
  ${tagRow(cx, 404, page.tags, T, 19)}
  ${packetTrain(cx, 470, T, { scale: 1.15 })}
  ${footer(cx, 545, SITE, copy.tagline, T)}
</svg>`;
}

/** Square 1200×1200 — for feeds that centre-crop. */
function squareSvg(page, loc) {
  const W = 1200;
  const H = 1200;
  const cx = W / 2;
  const copy = page[loc];
  const T = THEMES[page.theme] ?? THEMES.amber;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${defs(T)}
  ${background(W, H, T)}
  ${brackets(W, H, T, 56, 96)}
  ${badge(cx, 300, page.badge, T)}
  ${title(cx, 500, page.titleLeft, page.titleRight, T, 104)}
  ${subtitle(cx, 570, copy.subtitle, T, 32)}
  ${rule(cx, 618, 520)}
  ${tagRow(cx, 668, page.tags, T, 21)}
  ${packetTrain(cx, 760, T, { scale: 1.4 })}
  ${footer(cx, 880, SITE, copy.tagline, T)}
</svg>`;
}

/* ── Render ──────────────────────────────────────────────────────────────── */

async function main() {
  console.log("AmneziaWG Architect — OG image generation\n");

  const fontFiles = await ensureFonts();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const fontOpts = {
    fontFiles,
    loadSystemFonts: false,
    defaultFontFamily: "Manrope",
  };

  let count = 0;
  for (const page of PAGES) {
    for (const loc of LOCALES) {
      const suffix = loc === "ru" ? "" : "-en";

      const variants = [
        { svg: wideSvg(page, loc), name: `og-${page.slug}${suffix}.png` },
        {
          svg: squareSvg(page, loc),
          name: `og-${page.slug}${suffix}-square.png`,
        },
      ];

      for (const v of variants) {
        const png = new Resvg(v.svg, { font: fontOpts }).render().asPng();
        fs.writeFileSync(path.join(OUT_DIR, v.name), png);
        console.log(`  ${v.name.padEnd(34)} ${(png.length / 1024).toFixed(0)} KB`);
        count++;
      }
    }
  }

  console.log(`\n${count} images written to public/assets/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
