/**
 * Project timeline / changelog, bilingual.
 *
 * Rendered on the About page, oldest first, in this order.
 *
 * `version` is the *app* version and renders with a `v` prefix. Several
 * entries also mention AmneziaWG 1.0/2.0/3.0 — that is the protocol, and the
 * two numbering schemes are unrelated. Keep the distinction explicit in the
 * text: "AWG 2.0" for the protocol, "v2.0" for a release of this tool.
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
    version: "3.2.0",
    date: { ru: "Крупный релиз", en: "Major release" },
    title: {
      ru: "Протокол AWG 3.0, английская версия, FAQ",
      en: "AWG 3.0 protocol, English locale, FAQ",
    },
    icon: "ShieldCheck",
    color: "green",
    desc: {
      ru: "Поддержка протокола AmneziaWG 3.0, выверенная по исходникам amneziawg-go v3.0.1, а не по документации: она на тот момент описывала 2.0. HeaderProtectionKey (ChaCha20, base64 в .conf и hex по UAPI), ContentPaddingAddition и рандомизация таймеров протокола. Оттуда же правило, которого нет ни в одной документации: при защите заголовков S1–S4 должны быть не меньше 12, потому что nonce шифра берётся из первых 12 байт S-паддинга. Английская локализация: собственное дерево /en, hreflang и canonical, каталог EN типизирован по RU — пропущенный перевод ломает сборку. FAQ с поиском, категориями и разметкой FAQPage вместо прежней «Базы знаний». Симулятор пакетов научился 1.0, 1.5, 2.0 и 3.0. Страница VAIEXIA вместо IAA, крипто-донаты, страница «О проекте» с этой хронологией. Эмодзи заменены иконками Lucide, свои OG-изображения для каждой страницы, автономный shell-генератор scripts/awg-gen.sh. Починена история генераций: она переживает перезагрузку и восстанавливает конфиг, а не только копирует его.",
      en: "Support for the AmneziaWG 3.0 protocol, derived from the amneziawg-go v3.0.1 sources rather than the documentation, which still described 2.0 at the time. HeaderProtectionKey (ChaCha20, base64 in .conf and hex over UAPI), ContentPaddingAddition, and randomised protocol timers. The same sources yielded a rule no documentation carries: with header protection on, S1–S4 must be at least 12, because the cipher nonce is taken from the first 12 bytes of the S padding. English localisation on its own /en tree with hreflang and canonical tags; the EN catalogue is typed against RU, so a missing translation breaks the build. A searchable, categorised FAQ with FAQPage structured data, replacing the old knowledge base. The packet simulator learned 1.0, 1.5, 2.0 and 3.0. The VAIEXIA page replacing IAA, crypto donations, and an About page carrying this timeline. Emoji replaced with Lucide icons, per-page OG images, and a standalone shell generator in scripts/awg-gen.sh. Generation history fixed: it survives a reload and restores a config instead of only copying it.",
    },
  },
  {
    version: "3.2.1",
    date: { ru: "Инцидент CI", en: "CI incident" },
    title: {
      ru: "Внедрение кода в пайплайне",
      en: "Script injection in the pipeline",
    },
    icon: "Bug",
    color: "red",
    desc: {
      ru: "Релиз 3.2.0 упал на сборке. Причина оказалась серьёзнее самого падения: подстановки ${{ }} стояли прямо в теле run:, то есть содержимое подставлялось в shell до его запуска. Заголовок ветки или тега мог выполниться как команда на раннере. Переведено на передачу через env:, шаги ужесточены, разобраны места, где bash -e молча продолжал после ошибки.",
      en: "The 3.2.0 release failed to build, and the cause turned out to be worse than the failure: ${{ }} substitutions sat directly in run: bodies, so their contents were pasted into the shell before it ran. A branch or tag name could execute as a command on the runner. Moved to env: passing, with steps hardened and the places where bash -e silently continued after an error cleaned up.",
    },
  },
  {
    version: "3.2.2",
    date: { ru: "Автономность", en: "Self-contained" },
    title: {
      ru: "Гайд по полям, awg-serve, README в архиве",
      en: "Field guide, awg-serve, archive README",
    },
    icon: "Cpu",
    color: "amber",
    desc: {
      ru: "Три вещи, которых людям не хватало. В FAQ появилась рекреация формы параметров клиента Amnezia — шестнадцать полей в том же порядке, заполненных вашими сгенерированными значениями, с копированием по клику. Названия полей остаются английскими в обеих локалях: клиент подписывает их по-английски независимо от языка интерфейса, и перевод отправил бы читателя искать текст, которого нет на экране. awg-serve — статический сервер на Rust без зависимостей, около 230 КБ, только std, собирается нативно под каждую ОС и кладётся в релизный архив, чтобы скачанный проект запускался без установки чего-либо. Обход каталога отклоняется посегментно, сырой и percent-encoded; проверено через сырые сокеты, потому что curl нормализует такие пути на своей стороне и скрыл бы дырявую реализацию. В архив добавлен двуязычный README, а лаунчеры serve.sh и serve.ps1 научились находить dist где угодно.",
      en: "Three things people kept needing. The FAQ gained a recreation of the Amnezia client's parameter form — sixteen fields in the app's own order, filled with your generated values, click to copy. Field names stay in English in both locales: the client labels them in English whatever its interface language, and translating them would send a reader looking for text that is not on their screen. awg-serve is a dependency-free static server in Rust, roughly 230 KB, std only, built natively per OS and bundled into the release archive so a download runs with nothing installed. Path traversal is refused component by component, raw or percent-encoded, verified over raw sockets because curl normalises such paths client-side and would have hidden a broken implementation. The archive also ships a bilingual README, and the serve.sh / serve.ps1 launchers learned to find dist wherever they are.",
    },
  },
  {
    version: "3.2.3",
    date: { ru: "Текущий", en: "Current" },
    title: {
      ru: "Одна таблица версий вместо литералов",
      en: "One version table instead of literals",
    },
    icon: "Layers",
    color: "green",
    desc: {
      ru: "Панель параметров при выбранной 3.0 рисовала форму 1.x: пропадали S3/S4, а H1–H4 показывались одним числом вместо диапазона — при том что сам .conf был верным. Причина в том, что «современную» версию каждый файл определял своей парой литералов, и в одном месте про 3.0 забыли. Теперь возможности версии объявлены один раз в generator/versions.ts, и генератор, рендер, симулятор, валидатор, гайд по полям и вкладки читают их оттуда: AmneziaWG 4.0 добавляется одной записью. Панель истории переехала под свою кнопку — раньше она открывалась под блоком опций 3.0.",
      en: "With 3.0 selected, the parameter panel rendered a 1.x shape: S3/S4 disappeared and H1–H4 showed a single value instead of a range, even though the .conf underneath was correct. Each file decided what counted as a modern version with its own pair of literals, and one of them had never learned about 3.0. Version capabilities are now declared once in generator/versions.ts, and the generator, renderer, simulator, validator, field guide and version tabs all read from it: AmneziaWG 4.0 becomes a single entry. The history panel moved up under the button that opens it, instead of below the 3.0 options block.",
    },
  },
];
