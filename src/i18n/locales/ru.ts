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
  "awg3.groundwork.note":
    "в v3.0.1 разбираются, но ещё не подключены к отправке пакетов — это задел под AWG 4.0, поэтому генератор их не выдаёт.",

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
  "footer.madeWith": "Сделано с",
  "footer.by": "для свободного интернета",
  "footer.privacy": "Данные не покидают ваш браузер",

  /* ── Common ───────────────────────────────────────────────────────────── */
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
