/**
 * Project timeline / changelog, bilingual.
 *
 * Rendered on the About page. Newest entry last — the UI reverses it where a
 * newest-first order reads better.
 */

import type { Locale } from "@/i18n";

export type TimelineColor = "amber" | "green" | "red";

export interface TimelineEntry {
  version: string;
  date: Record<Locale, string>;
  title: Record<Locale, string>;
  desc: Record<Locale, string>;
  /** Lucide icon name, resolved by the view. */
  icon: string;
  color: TimelineColor;
}

export const TIMELINE: TimelineEntry[] = [
  {
    version: "0.1",
    date: { ru: "Начало", en: "Start" },
    title: { ru: "Первый прототип", en: "First prototype" },
    icon: "Rocket",
    color: "amber",
    desc: {
      ru: "Чистый HTML/CSS/JS, один файл, базовая генерация параметров Jc, Jmin, Jmax и случайных H/S. Работающий PoC без дизайна.",
      en: "Plain HTML/CSS/JS in a single file: basic generation of Jc, Jmin, Jmax and random H/S values. A working proof of concept with no design to speak of.",
    },
  },
  {
    version: "0.2",
    date: { ru: "Фикс", en: "Fix" },
    title: { ru: "Исправление HEX-генерации", en: "HEX generation fix" },
    icon: "Bug",
    color: "red",
    desc: {
      ru: "Критическая ошибка: невалидный HEX вызывал краш клиента. Исправлено, добавлена валидация assertEvenHex.",
      en: "A critical bug: invalid HEX crashed the client. Fixed, with an assertEvenHex guard added.",
    },
  },
  {
    version: "0.3",
    date: { ru: "CPS-теги", en: "CPS tags" },
    title: { ru: "Селективные CPS-теги", en: "Selective CPS tags" },
    icon: "Code",
    color: "green",
    desc: {
      ru: "Поддержка тегов <c>, <t>, <r>, <rc>, <rd> с возможностью включать каждый отдельно. Синхронизация генераторов I1 с выбором пользователя.",
      en: "Support for the <c>, <t>, <r>, <rc> and <rd> tags, each toggleable on its own, with the I1 generators following the user's selection.",
    },
  },
  {
    version: "0.4",
    date: { ru: "AWG 1.0", en: "AWG 1.0" },
    title: {
      ru: "Оптимизация Junk для AWG 1.0",
      en: "Junk tuning for AWG 1.0",
    },
    icon: "Wrench",
    color: "amber",
    desc: {
      ru: "Требования официального клиента: Jc ≥ 4, Jmax > 81 для AWG 1.0. Генератор подстроен под ограничения протокола.",
      en: "The official client requires Jc ≥ 4 and Jmax > 81 on AWG 1.0; the generator now respects those protocol limits.",
    },
  },
  {
    version: "0.5",
    date: { ru: "Эволюция", en: "Evolution" },
    title: { ru: "MergeKeys и vpn://", en: "MergeKeys and vpn://" },
    icon: "GitMerge",
    color: "green",
    desc: {
      ru: "Модуль MergeKeys — декодирование, патчинг и объединение vpn://-ключей прямо в браузере. Поддержка pako/zlib, base64url-кодек с 4-байтным заголовком.",
      en: "The MergeKeys module: decoding, patching and merging vpn:// keys entirely in the browser, with pako/zlib support and a base64url codec carrying a 4-byte header.",
    },
  },
  {
    version: "0.6",
    date: { ru: "Browser FP", en: "Browser FP" },
    title: {
      ru: "Browser Fingerprint и QUIC/HTTP3",
      en: "Browser fingerprint and QUIC/HTTP3",
    },
    icon: "Eye",
    color: "amber",
    desc: {
      ru: "Профильные таблицы размеров пакетов по браузерам (Chrome, Firefox, Safari, Yandex). Адаптивный паддинг для QUIC Initial, 0-RTT и HTTP/3.",
      en: "Per-browser packet size tables (Chrome, Firefox, Safari, Yandex) and adaptive padding for QUIC Initial, 0-RTT and HTTP/3.",
    },
  },
  {
    version: "0.7",
    date: { ru: "Дизайн", en: "Design" },
    title: { ru: "Глобальный редизайн UI", en: "Full UI redesign" },
    icon: "Paintbrush",
    color: "green",
    desc: {
      ru: "Полная переработка интерфейса, MergeKeys в стиле основного генератора. Мобильная адаптивность, исправлен overflow CPS при малом MTU.",
      en: "The interface reworked from scratch, with MergeKeys matching the main generator. Mobile layouts, and a fix for CPS overflow at small MTU values.",
    },
  },
  {
    version: "1.0",
    date: { ru: "Перерождение", en: "Rebirth" },
    title: {
      ru: "Vue 3 + TypeScript + SPA",
      en: "Vue 3 + TypeScript + SPA",
    },
    icon: "Sparkles",
    color: "amber",
    desc: {
      ru: "Миграция на Vue 3, Vite и TypeScript. Компонентная архитектура, SPA-роутинг, статический хостинг с pre-render заглушками. Интерфейс переписан с нуля.",
      en: "Migration to Vue 3, Vite and TypeScript. Component architecture, SPA routing, static hosting with pre-rendered stubs, and an interface rewritten from scratch.",
    },
  },
  {
    version: "1.1",
    date: { ru: "Расширение", en: "Expansion" },
    title: {
      ru: "AWG 2.0, CPS и 7+ профилей",
      en: "AWG 2.0, CPS and 7+ profiles",
    },
    icon: "Layers",
    color: "green",
    desc: {
      ru: "AWG 2.0 с диапазонами H1–H4 и S3/S4, полная цепочка I1–I5. Семь профилей мимикрии. Система обратной связи с автоусилением и история генераций.",
      en: "AWG 2.0 with H1–H4 ranges and S3/S4, the full I1–I5 chain, seven mimicry profiles, a feedback loop that strengthens parameters automatically, and generation history.",
    },
  },
  {
    version: "1.2",
    date: { ru: "Инфра", en: "Infra" },
    title: {
      ru: "SPA-роутинг, донаты, деплой",
      en: "SPA routing, donations, deployment",
    },
    icon: "Globe",
    color: "amber",
    desc: {
      ru: "Относительные пути для file://, определение base path в рантайме, pre-render заглушки для поисковых ботов. CI/CD: сборка, деплой, релиз.",
      en: "Relative paths for file://, runtime base-path detection, pre-rendered stubs for crawlers, and a build → deploy → release pipeline.",
    },
  },
  {
    version: "2.0",
    date: { ru: "Релиз 2.0", en: "Release 2.0" },
    title: {
      ru: "Режим роутера, инспектор, композитные профили",
      en: "Router mode, inspector, composite profiles",
    },
    icon: "Star",
    color: "green",
    desc: {
      ru: "Режим роутера для NanoPi, Keenetic и OpenWrt. Инспектор и редактор vpn://-ключей. Композитные профили TLS→QUIC и QUIC Burst. Проверка доступности доменов и 133+ автотеста.",
      en: "Router mode for NanoPi, Keenetic and OpenWrt. A vpn:// key inspector and editor. Composite TLS→QUIC and QUIC Burst profiles. Domain reachability checks and 133+ automated tests.",
    },
  },
  {
    version: "2.1",
    date: { ru: "Инфра", en: "Infra" },
    title: {
      ru: "Исправление SPA-редиректов и умная 404",
      en: "SPA redirect fix and a smarter 404",
    },
    icon: "Bug",
    color: "red",
    desc: {
      ru: "Инцидент с маршрутизацией: из-за конфликта SPA-редиректов прямые ссылки открывались белым экраном. Починено. Добавлена умная 404 с ручным фолбэком и мульти-хостинг для GitLab, GitHub и Cloudflare.",
      en: "A routing incident: conflicting SPA redirects turned direct links into a blank page. Fixed, with a smarter 404 carrying a manual fallback and multi-host support for GitLab, GitHub and Cloudflare.",
    },
  },
  {
    version: "3.0",
    date: { ru: "Релиз 3.0", en: "Release 3.0" },
    title: { ru: "Архитектурный апгрейд", en: "Architecture upgrade" },
    icon: "Cpu",
    color: "green",
    desc: {
      ru: "Монолитный generator.ts разобран на модули. Math.random() заменён на crypto.getRandomValues(). Жёсткий лимит S4 ≤ 32 и матрица совместимости клиентов.",
      en: "The monolithic generator.ts split into modules. Math.random() replaced with crypto.getRandomValues(). A hard S4 ≤ 32 limit and a client compatibility matrix.",
    },
  },
  {
    version: "3.1",
    date: { ru: "Инструменты", en: "Tooling" },
    title: {
      ru: "Health Checker, Batch, Simulator, Worker",
      en: "Health checker, batch, simulator, worker",
    },
    icon: "ShieldCheck",
    color: "amber",
    desc: {
      ru: "Проверка конфигов с клиентской валидацией. Batch-генерация до 1000 конфигов в Web Worker. Симулятор пакетов с визуализацией handshake. Формальный JSON-экспорт Amnezia VpnConfig.",
      en: "Config health checking with client-aware validation. Batch generation of up to 1000 configs in a Web Worker. A packet simulator visualising the handshake. Formal Amnezia VpnConfig JSON export.",
    },
  },
  {
    version: "3.2",
    date: { ru: "Текущий", en: "Current" },
    title: {
      ru: "AmneziaWG 3.0, английская версия, FAQ",
      en: "AmneziaWG 3.0, English locale, FAQ",
    },
    icon: "ShieldCheck",
    color: "green",
    desc: {
      ru: "Поддержка AmneziaWG 3.0, выверенная по исходникам amneziawg-go v3.0.1: HeaderProtectionKey, ContentPaddingAddition и рандомизация таймеров, включая правило S1–S4 ≥ 12 при защите заголовков. Английская локализация с отдельным деревом /en и hreflang. FAQ с поиском, категориями и разметкой FAQPage. Страница VAIEXIA вместо IAA. Крипто-донаты. Эмодзи заменены иконками, история генераций чинится и переживает перезагрузку.",
      en: "AmneziaWG 3.0 support, derived from the amneziawg-go v3.0.1 sources: HeaderProtectionKey, ContentPaddingAddition and timer randomisation, including the S1–S4 ≥ 12 rule that header protection imposes. English localisation on its own /en tree with hreflang. A searchable, categorised FAQ with FAQPage structured data. The VAIEXIA page replacing IAA. Crypto donations. Emoji replaced with icons, and generation history fixed and made to survive a reload.",
    },
  },
];
