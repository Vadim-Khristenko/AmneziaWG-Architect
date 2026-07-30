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

import type { Locale, Localised } from "@/i18n";

export type TimelineColor = "amber" | "green" | "red";

export interface TimelineEntry {
  version: string;
  date: Localised<string>;
  title: Localised<string>;
  desc: Localised<string>;
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
    date: { ru: "Разбор параметров", en: "Parameter classes" },
    title: {
      ru: "Одна таблица версий и разбор параметров по классам",
      en: "One version table, and parameters sorted by class",
    },
    icon: "Layers",
    color: "green",
    desc: {
      ru: "**Панель параметров при выбранной 3.0 рисовала форму 1.x:** пропадали `S3/S4`, а `H1–H4` показывались одним числом вместо диапазона — при том что сам `.conf` был верным.\n\n## Одна таблица версий\n\nПричина оказалась не в опечатке: «современную» версию каждый из шести файлов определял своей парой литералов, и один из них про 3.0 не знал. Теперь возможности версии объявлены один раз в `generator/versions.ts`, и генератор, рендер, симулятор, валидатор, гайд по полям и вкладки читают их оттуда — AmneziaWG 4.0 добавляется одной записью, *а неизвестная версия отрисовывается по самой полной форме вместо пустой панели*.\n\nЗаодно `S3/S4` перестали генерироваться там, где версия их не использует: раньше они создавались всегда и лишь прятались рендером.\n\n## Какие параметры обязаны совпадать\n\nПриёмная сторона опознаёт пакет своими S и H — проверено по исходникам [`amneziawg-go`](https://github.com/amnezia-vpn/amneziawg-go/blob/master/device/receive.go), а не по документации. Совпадать обязаны `S1–S4`, `H1–H4` и `HeaderProtectionKey`. Клиентские — `Jc`, `Jmin`, `Jmax`, цепочка `I1–I5` и `ContentPaddingAddition`: у каждого устройства могут быть свои, и **разные значения лучше одинаковых** — одинаковый у сотни клиентов мусорный поезд даёт DPI готовый шаблон.\n\nПрежняя формулировка «все параметры 3.0 должны совпадать» была неверной и жила в трёх ответах FAQ, в README релизного архива и в шапке каждого конфига из `awg-gen.sh`.\n\n## Читаемость и мелочи\n\nFAQ вырос с 33 до 44 ответов. Длинные имена 3.0 больше не сливаются — *у них был uppercase, стиравший границы слов*. История генераций пишется сразу, а не через таймер, и открывается под своей кнопкой.\n\nРелизный пайплайн наконец читает сообщение аннотированного тега: раньше релиз описывался только списком коммитов. Устаревшие команды запуска из заметок убраны.",
      en: "**With 3.0 selected, the parameter panel rendered a 1.x shape:** `S3/S4` disappeared and `H1–H4` showed a single value instead of a range, even though the `.conf` underneath was correct.\n\n## One version table\n\nThe cause was not a typo: each of six files decided what a modern version was with its own pair of literals, and one of them had never heard of 3.0. Version capabilities are now declared once in `generator/versions.ts`, and the generator, renderer, simulator, validator, field guide and version tabs all read from it — AmneziaWG 4.0 becomes a single entry, *and an unknown version renders with the richest shape instead of a blank panel*.\n\n`S3/S4` also stopped being generated for versions that do not use them; they used to be drawn every time and merely hidden at render.\n\n## Which parameters must match\n\nThe receiving side identifies a packet using its own S and H values — checked against the [`amneziawg-go`](https://github.com/amnezia-vpn/amneziawg-go/blob/master/device/receive.go) sources rather than the documentation. `S1–S4`, `H1–H4` and `HeaderProtectionKey` have to be identical. The client-side ones are `Jc`, `Jmin`, `Jmax`, the `I1–I5` chain and `ContentPaddingAddition`: they may differ per device, and **varied values beat identical ones** — one junk train shared by a hundred clients hands DPI a template.\n\nThe old claim that every 3.0 parameter must match was wrong and had spread to three FAQ answers, the release archive README and the header of every config `awg-gen.sh` emits.\n\n## Readability and smaller things\n\nThe FAQ grew from 33 answers to 44. Long 3.0 names no longer run together — *they were uppercased, which erased every word boundary*. Generation history is written immediately rather than behind a timer, and opens under its own button.\n\nThe release pipeline finally reads the annotated tag message; releases used to be described by a list of commits alone. Stale run instructions are gone from the notes.",
    },
  },
  {
    version: "3.2.4",
    date: { ru: "Текущий", en: "Current" },
    title: {
      ru: "Текст, который можно читать",
      en: "Text you can actually read",
    },
    icon: "Paintbrush",
    color: "amber",
    desc: {
      ru: "**44 ответа FAQ и вся эта хронология были сплошными абзацами без единого выделения.** Формально верно, читать невозможно: правило и оговорка выглядели одинаково, а имя параметра терялось в прозе.\n\n## Почему не просто HTML\n\nОтветы используются дважды: рендерятся на странице и уходят в разметку `FAQPage` JSON-LD, где разметки быть не должно. Хранить HTML значило бы сломать второе применение, хранить плоский текст — первое.\n\nПоэтому источник несёт минимальный набор знаков: пустая строка на абзац, `##` и `###` на подзаголовки, `**жирный**` для того, что нельзя пропустить, `*курсив*` для оговорок, бэктики для имён, которые пишутся точно, и ссылки на исходники. Страница рендерит их элементами, а структурированные данные и поисковый индекс получают текст очищенным. *HTML не появляется нигде, поэтому экранировать нечего и внедрять некуда*; схемы ссылок проверяются по списку разрешённых при разборе.\n\n## Проверка\n\nПереформатирование не имело права изменить ни слова, и это проверено машинно: очищенный текст всех 88 строк совпал с исходным побайтово. Тесты держат инвариант дальше — парность знаков, отсутствие разметки в JSON-LD и запрет на ответ длиннее экрана без единого абзаца.",
      en: "**Forty-four FAQ answers and this whole timeline were solid paragraphs with no emphasis anywhere.** Technically correct and unreadable: a rule and an aside looked identical, and a parameter name vanished into the prose.\n\n## Why not just HTML\n\nAnswers are used twice: rendered into the page, and emitted into `FAQPage` JSON-LD, which must not carry markup. Storing HTML would break the second use; storing flat text broke the first.\n\nSo the source carries a minimal set of marks: a blank line for a paragraph, `##` and `###` for subheadings, `**bold**` for what must not be missed, `*italic*` for caveats, backticks for names spelled exactly, and links to sources. The page renders them as elements, while the structured data and the search index get the text stripped. *No HTML exists anywhere in the pipeline, so there is nothing to escape and nothing to inject*; link schemes are checked against an allowlist at parse time.\n\n## Verification\n\nReformatting was not allowed to change a single word, and that was checked mechanically: the stripped text of all 88 strings matched the original exactly. Tests hold the invariant from here — balanced marks, no markup reaching JSON-LD, and no answer longer than a screenful left as one unbroken block.",
    },
  },
];
