/**
 * Russian catalog — the source of truth.
 *
 * Every other locale is typed against this object, so adding a key here makes
 * the build fail until each translation supplies it. Keep keys sorted by area.
 */

import type { MessageValue } from "../types";

export const ru = {
  /* ── Navigation ───────────────────────────────────────────────────────── */
  "nav.generator": "Генератор",
  "nav.mergekeys": "MergeKeys",
  "nav.simulator": "Симулятор",
  "nav.about": "О проекте",
  "nav.vaiexia": "VAIEXIA",
  "nav.faq": "FAQ",
  "nav.donate": "Поддержать",
  "nav.menu": "Меню",
  "nav.close": "Закрыть",
  "nav.github": "Репозиторий на GitHub",

  /* ── Language switcher ────────────────────────────────────────────────── */
  "lang.label": "Язык",
  "lang.switch": "Сменить язык",

  /* ── Home / hero ──────────────────────────────────────────────────────── */
  "home.badge": "AWG 3.0 READY",
  "home.title.brand": "AmneziaWG",
  "home.title.accent": "Architect",
  "home.desc":
    "Генератор продвинутой обфускации для обхода DPI. Всё работает в браузере — данные не покидают устройство.",

  /* ── Versions ─────────────────────────────────────────────────────────── */
  "version.new": "NEW",
  "version.notice.10":
    "S3, S4 и CPS (I1–I5) не поддерживаются. Jc рекомендуется ≥ 4, Jmax > 81.",
  "version.notice.15":
    "S3, S4 не поддерживаются. I1–I5 работают только на стороне клиента.",
  "version.notice.30":
    "шифрование заголовков ChaCha20, случайный паддинг транспорта и рандомизация таймеров.",
  "version.notice.30.req": "Требуется",
  "version.notice.30.tail":
    "с поддержкой 3.0 — на обеих сторонах: ключ HeaderProtectionKey общий, клиент и сервер должны совпадать.",

  /* ── AWG 3.0 panel ────────────────────────────────────────────────────── */
  "awg3.panel.title": "Параметры AmneziaWG 3.0",
  "awg3.hpk.title": "HeaderProtectionKey",
  "awg3.hpk.desc":
    "ChaCha20 поверх заголовков. Хендшейк и cookie шифруются целиком, транспорт — только заголовок. Nonce берётся из паддинга, поэтому S1–S4 автоматически поднимаются до 12 байт.",
  "awg3.cpa.title": "ContentPaddingAddition",
  "awg3.cpa.desc":
    "Случайный добавочный паддинг каждого транспортного пакета вместо выравнивания по 16 байт — размывает гистограмму размеров.",
  "awg3.timings.title": "Рандомизация таймеров",
  "awg3.timings.desc":
    "RekeyAfterTime, RekeyTimeout, RejectAfterTime, KeepaliveTimeout и MaxHandshakeAttempts задаются диапазонами — фиксированный ритм хендшейков перестаёт быть отпечатком.",
  "awg3.groundwork.lead": "Теги",
  "awg3.groundwork.note":
    "в v3.0.1 разбираются, но ещё не подключены к отправке пакетов — это задел под AWG 4.0, поэтому генератор их не выдаёт.",

  /* ── Generator controls ───────────────────────────────────────────────── */
  "gen.client.label": "Целевой клиент",
  "gen.client.hint": "Параметры фильтруются под возможности выбранного клиента.",
  "gen.profile.label": "Профиль мимикрии",
  "gen.profile.random": "Случайный выбор",
  "gen.host.check": "Проверить доступность домена",
  "gen.mimicAll": "Применять профиль для I2–I5",
  "gen.tags.label": "Теги в цепочке CPS",
  "gen.tags.warnC":
    "Тег <c> не работает в старых версиях AWG-go (ErrorCode 1000). Разработчики Amnezia позднее отказались от него, поэтому он может перестать работать и в новых версиях клиентов.",
  "gen.cps.unavailable": "CPS-цепочки недоступны в AWG 1.0",
  "gen.cps.unavailableHint":
    "Теги I1–I5 появились в 1.5. Профили мимикрии здесь не применяются — обфускация ограничена junk-пакетами и заголовками.",
  "gen.cps.switchTo20": "Перейти на 2.0",
  "gen.fp.label": "Браузерный отпечаток",
  "gen.fp.toggle": "Имитировать размер пакетов",
  "gen.mtu.label": "MTU интерфейса",
  "gen.mtu.hint": "1500 = Ethernet · 1420 = WG/PPPoE · 1280 = min IPv6",
  "gen.entropy.label": "Энтропия",
  "gen.junk.label": "Junk-train (Jc)",
  "gen.junk.off": "0 — Отключено",
  "gen.junk.optimal": "3 — Оптимально",
  "gen.junk.recommended": "5 — Рекомендуемо",
  "gen.junk.strong": "7 — Усиленный",
  "gen.junk.max": "10 — Максимальный",
  "gen.extreme.title": "Экстремальные максимумы",
  "gen.extreme.desc": "Использовать предельные значения параметров",
  "gen.router.title": "Режим роутера",
  "gen.router.desc": "Ограничить нагрузку для роутеров",
  "gen.batch.title": "Batch генератор",
  "gen.batch.desc":
    "Сгенерируйте сразу несколько независимых конфигов. Для больших пакетов (более 50) генерация выполняется в фоновом Web Worker, чтобы интерфейс не зависал.",
  "gen.batch.action": "Сгенерировать",
  "gen.batch.running": "Генерация {n}…",
  "gen.batch.download": "Скачать {n} конфигов",
  "gen.merge.title": "Управление ключами",
  "gen.merge.desc":
    "Уже есть vpn:// ключ? Обновите параметры обфускации или объедините несколько ключей в один.",
  "gen.merge.update": "Обновить",
  "gen.merge.combine": "Объединить",
  "gen.generate": "Сгенерировать",
  "gen.works": "Работает",
  "gen.worksNot": "Не работает",
  "gen.config": "Конфигурация",
  "gen.waiting": "Ожидание генерации…",
  "gen.preview": "Превью конфигурационного файла",
  "gen.export.title": "Экспорт конфигурации",
  "gen.export.copyConf": "Копировать .conf",
  "gen.export.downloadConf": "Скачать .conf",
  "gen.export.copyJson": "Копировать JSON",
  "gen.export.downloadJson": "Скачать JSON",
  "gen.export.simulator": "Симулятор handshake",
  "gen.copyAll": "Копировать всё",
  "gen.copyGroup": "Копировать группу",
  "gen.clickToCopy": "Нажмите чтобы скопировать",

  /* ── Generator log ────────────────────────────────────────────────────── */
  "log.generated": "Сгенерирован — {profile}",
  "log.routerMode": "Роутер-режим: минимальные шумы",
  "log.batchRange": "Количество должно быть от 1 до 1000",
  "log.batchDone": "Сгенерировано конфигов: {n}",
  "log.batchError": "Ошибка batch: {error}",
  "log.batchFirst": "Сначала сгенерируйте batch",
  "log.confirmed": "Конфигурация подтверждена",
  "log.retry": "Попытка {n}: перегенерация, усиленные параметры",
  "log.retryHigh": "Попытка {n}: режим HIGH, максимальная обфускация",
  "log.generateFirst": "Сначала сгенерируйте конфиг",
  "log.copyFailed": "Не удалось скопировать в буфер",
  "log.saved": "Конфиг сохранён в файл",
  "log.hostRequired": "Укажите хост для проверки",
  "log.hostBlockedList": "{host} — в списке заблокированных",
  "log.hostOk": "{host} — доступен",
  "log.hostUnreachable": "{host} — недоступен ({error})",
  "log.copiedConf": "Конфиг скопирован в буфер",
  "log.copiedJson": "JSON скопирован в буфер",

  /* ── Generated .conf comments ─────────────────────────────────────────── */
  "conf.privateKey": "PrivateKey = <ваш приватный ключ>",
  "conf.address": "Address = 10.0.0.2/32",
  "conf.cpsClientOnly": "I1-I5 работают только на клиенте (AWG 1.5):",
  "conf.noCps": "I1-I5 не поддерживаются в AWG 1.0",
  "conf.awg3Hpk":
    "AWG 3.0 — общий ключ защиты заголовков (одинаковый на обеих сторонах)",
  "conf.awg3Cpa": "AWG 3.0 — случайный паддинг транспортных пакетов",
  "conf.awg3Timers": "AWG 3.0 — рандомизация таймингов протокола",

  /* ── History ──────────────────────────────────────────────────────────── */
  "history.title": "История генераций",
  "history.empty": "Пока нет генераций.",
  "history.clear": "Очистить историю",
  "history.restore": "Восстановить конфиг",
  "history.restored": "Восстановлен конфиг AWG {version} от {time}",
  "history.copy": "Копировать конфиг",
  "history.delete": "Удалить",
  "history.legacy": "Старая запись — только копирование",

  /* ── Knowledge base CTA ───────────────────────────────────────────────── */
  "kb.title": "База знаний переехала в FAQ",
  "kb.desc":
    "Разбор параметров, различия версий 1.0–3.0, подбор конфигурации и типичные проблемы — теперь в одном месте, с поиском и фильтрами.",
  "kb.action": "Открыть FAQ",

  /* ── Parameter groups ─────────────────────────────────────────────────── */
  "params.title": "Параметры",
  "params.group.junk": "Junk Train",
  "params.group.sizes": "Размеры пакетов",
  "params.group.headers": "Заголовки",
  "params.group.cps": "CPS Signatures",
  "params.group.cpsClient": "CPS (только клиент)",
  "params.group.awg3": "AmneziaWG 3.0",

  /* ── Actions ──────────────────────────────────────────────────────────── */
  "action.generate": "Сгенерировать",
  "action.copy": "Копировать",
  "action.copied": "Скопировано",
  "action.download": "Скачать",
  "action.retry": "Ещё раз",

  /* ── About page ───────────────────────────────────────────────────────── */
  "about.badge": "О ПРОЕКТЕ",
  "about.subtitle.1": "Генератор обфускации нового поколения.",
  "about.subtitle.2": "Твой протокол — твои правила.",
  "about.subtitle.3": "Невидимость по стандарту.",

  "about.legal.title": "Юридическая информация",
  "about.legal.warning":
    "Этот проект создан исключительно в ознакомительных и исследовательских целях.",
  "about.legal.scope":
    "Проект никогда не создавался для использования в России или странах СНГ. Автор не несёт ответственности за любое использование данного программного обеспечения.",
  "about.legal.allowedTitle": "Разрешённое использование:",
  "about.legal.allowed.1": "Пентест и исследования безопасности",
  "about.legal.allowed.2": "CTF-соревнования",
  "about.legal.allowed.3": "Научные исследования",
  "about.legal.allowed.4": "Тестирование собственных сетей",
  "about.legal.disclaimer":
    "Использование инструментов обфускации трафика может нарушать законодательство вашей страны. Никакие материалы этого проекта не являются призывом к нарушению законов.",

  "about.stat.profiles": "Профили мимикрии",
  "about.stat.params": "Параметров генерации",
  "about.stat.tests": "Автотестов",
  "about.stat.clients": "Поддерживаемых клиентов",

  "about.what.title": "Что такое AmneziaWG Architect?",
  "about.what.p1":
    "AmneziaWG Architect — это продвинутый веб-инструмент для создания уникальных профилей обфускации протокола AmneziaWG, а также для работы с ключами Amnezia VPN.",
  "about.what.p2":
    "Если обычный VPN просто шифрует данные, то Architect помогает замаскировать сам факт использования VPN. Системы DPI анализируют структуру пакетов и умеют определять WireGuard по фиксированным заголовкам и размерам. Architect генерирует параметры, которые делают ваш трафик похожим на QUIC, TLS, SIP или другие протоколы.",

  "about.feature.profiles.title": "11 профилей мимикрии",
  "about.feature.profiles.desc":
    "QUIC, TLS, DTLS, SIP, HTTP/3, Noise_IK и другие протоколы. Параметры H1–H4, S1–S4 и I1–I5 точно соответствуют полям AmneziaVPN.",
  "about.feature.smart.title": "Умная генерация",
  "about.feature.smart.desc":
    "Не случайные числа, а структуры реальных сетевых пакетов. Выбор целевого клиента и матрица совместимости исключают несовместимые параметры.",
  "about.feature.check.title": "Проверка конфигов",
  "about.feature.check.desc":
    "Health Checker находит ошибки в .conf до передачи в клиент. Batch-генератор создаёт до 1000 конфигов в Web Worker.",
  "about.feature.advanced.title": "Для продвинутых",
  "about.feature.advanced.desc":
    "Симулятор пакетов визуализирует handshake, есть ручное управление CPS-тегами, MTU и профилями мимикрии.",

  "about.timeline.title": "Эволюция проекта",
  "about.timeline.lede":
    "За свою короткую жизнь Architect пережил несколько кардинальных трансформаций — от одного HTML-файла до полноценного SPA на Vue 3. Каждое обновление делало его удобнее, функциональнее и красивее.",

  "about.mergekeys.lede":
    "Помимо генератора обфускации, Architect включает модуль MergeKeys — инструмент для работы с ключами Amnezia VPN формата vpn://.",
  "about.mergekeys.update.title": "Обновление обфускации",
  "about.mergekeys.update.desc":
    "Применить новые Jc, Jmin, Jmax и I1–I5 к существующему ключу без пересоздания. Серверные параметры не тронуты.",
  "about.mergekeys.merge.title": "Объединение ключей",
  "about.mergekeys.merge.desc":
    "Собрать контейнеры из нескольких vpn://-ключей в один мастер-ключ. Дубликаты обнаруживаются автоматически.",
  "about.mergekeys.goto": "Перейти к MergeKeys",
  "about.mergekeys.combine": "Объединить ключи",

  "about.privacy.lede.bold": "Мы не собираем от вас никаких данных.",
  "about.privacy.lede":
    "У нас нет своих серверов, нет аналитики, нет трекеров, нет баз данных и нет скрытых запросов куда-либо. Всё, что вы видите на этой странице, работает исключительно внутри вашего браузера. Исходный код полностью открыт — любой может проверить, что здесь нет ничего лишнего, форкнуть репозиторий и запустить Architect у себя.",
  "about.privacy.local.title": "Только ваш браузер",
  "about.privacy.local.desc":
    "Генерация обфускации, декодирование vpn://-ключей, патчинг параметров и симуляция пакетов выполняются локально на вашем устройстве. Мы физически не можем видеть ваши конфиги, ключи или выбор параметров.",
  "about.privacy.notrack.title": "Ноль метрик и трекеров",
  "about.privacy.notrack.desc":
    "Нет Google Analytics, Yandex.Metrika, Amplitude или самописной аналитики. Нет cookies, fingerprinting и сторонних скриптов. Мы ничего не собираем, не логируем и не передаём.",
  "about.privacy.offline.title": "Работает без интернета",
  "about.privacy.offline.desc":
    "Сохраните страницу через Ctrl+S или Cmd+S — и пользуйтесь ей офлайн. Вся логика генерации, проверки конфигов и работы с ключами не требует сети или наших серверов.",
  "about.privacy.oss.title": "Открытый код и локальный запуск",
  "about.privacy.oss.desc":
    "Весь исходный код доступен на GitHub. Вы можете просмотреть его, провести аудит, собрать проект локально и запустить у себя — без какой-либо зависимости от нас.",

  "about.oss.lede":
    "Все исходники проекта полностью открыты. Кто угодно может прочитать код, убедиться в безопасности, предложить улучшения, форкнуть и задеплоить свою версию.",
  "about.oss.stack.title": "Современный стек",
  "about.oss.stack.desc":
    "Исходный код доступен на GitHub. Vue 3, TypeScript и Vite — современный стек без магии.",
  "about.oss.audit.title": "Аудит приветствуется",
  "about.oss.audit.desc":
    "Весь код генерации и работы с ключами открыт для аудита. Никаких обфусцированных бандлов — только чистый TypeScript.",
  "about.oss.github": "Исходники на GitHub",

  "about.dev.solo.title": "Единственный разработчик",
  "about.dev.solo.desc":
    "Architect создаётся и поддерживается одним человеком. Баги устраняются оперативно, часто в тот же день. Проект живёт благодаря энтузиазму и свободному времени.",
  "about.dev.feedback.title": "Нашли баг? Есть идея?",
  "about.dev.feedback.desc":
    "Приглашаю ловить баги и присылать идеи. Пишите в обсуждение в чате или заводите issue на GitHub — а вскоре и на git.vai-rice.space.",
  "about.dev.noDm":
    "Пожалуйста, не пишите в личные сообщения — только через общий чат или issue.",
  "about.mergekeys.title": "MergeKeys — управление ключами",
  "about.privacy.title": "Манифест приватности",
  "about.opensource.title": "Открытый исходный код",
  "about.dev.title": "Разработчик и обратная связь",

  /* ── Donations ────────────────────────────────────────────────────────── */
  "donate.title": "Поддержать проект",
  "donate.desc":
    "Проект развивается на энтузиазме и не собирает ни данных, ни денег с пользователей. Если он вам помог — можно закинуть на кофе в крипте.",
  "donate.copyAddress": "Скопировать адрес",
  "donate.copied": "Адрес скопирован",
  "donate.network": "Сеть",
  "donate.warning":
    "Проверяйте сеть перед отправкой: перевод в неверной сети означает безвозвратную потерю средств.",

  /* ── Footer ───────────────────────────────────────────────────────────── */
  "footer.slogan.lead": "Шифруем реальность.",
  "footer.slogan.accent": "Архитектура свободы",
  "footer.slogan.tail": "— в каждом пакете.",
  "footer.donate.title": "Поддержать проект",
  "footer.donate.methods": "YooMoney · Patreon · DaLink · крипта",
  "footer.col.resources": "Ресурсы",
  "footer.col.community": "Сообщество",
  "footer.col.research": "Исследования",
  "footer.link.source": "Исходный код",
  "footer.link.amneziaGithub": "Amnezia VPN GitHub",
  "footer.link.telegram": "Чат в Telegram",
  "footer.link.author": "Автор проекта",
  "footer.credits.basedOn": "Основано на идеях",
  "footer.credits.from": "от",
  "footer.madeWith": "Разработано с",
  "footer.forCommunity": "для сообщества AmneziaVPN",
  "footer.build": "Последняя сборка",
  "footer.local": "100% локально: данные не покидают браузер",

  /* ── Common ───────────────────────────────────────────────────────────── */
  "common.and": "и",
  "common.copy": "Копировать",
  "common.close": "Закрыть",
  "common.back": "Назад",
  "common.loading": "Загрузка…",
  "common.error": "Ошибка",
  "common.configs": {
    one: "{n} конфиг",
    few: "{n} конфига",
    many: "{n} конфигов",
    other: "{n} конфигов",
  },
} as const satisfies Record<string, MessageValue>;

export type MessageKey = keyof typeof ru;
export type Catalog = Record<MessageKey, MessageValue>;

export default ru;
