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
    "ChaCha20 поверх заголовков. Хендшейк и cookie шифруются целиком, транспорт — только заголовок. Nonce берётся из паддинга, поэтому S1–S4 не могут быть меньше 12 байт: значение ниже порога перевыбирается в допустимом диапазоне, а не прижимается к 12.",
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
  "client.note.windowsHCap":
    "До версии 2.0.2 редактор подчёркивает H-значения выше 2 147 483 647 красным и не даёт сохранить конфиг. На сервере такие значения работают нормально — ограничение было только в проверке на стороне клиента (PR #85, исправлено в #87).",
  "client.note.wgTunnelBattery":
    "Большие S3/S4 могут сажать батарею и вести себя непредсказуемо — держите S4 умеренным.",
  "client.note.keeneticI1":
    "Чувствителен к I1: лучше простой <r 64> или профиль мимикрии под DNS.",
  "client.note.awgGoTagC":
    "Тег <c> не реализован — ErrorCode 1000.",
  "gen.client.releaseCurrent": "Текущая версия клиента",
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
  "history.empty": "Пока нет генераций. Нажмите «Сгенерировать», чтобы начать.",
  "history.clear": "Очистить историю",
  "history.restore": "Восстановить конфиг",
  "history.restored": "Восстановлен конфиг AWG {version} от {time}",
  "history.copy": "Копировать конфиг",
  "history.delete": "Удалить",
  "history.legacy": "Старая запись — только копирование",

  /* ── Knowledge base CTA ───────────────────────────────────────────────── */
  "kb.fields.short": "Форма клиента с вашими значениями",
  "kb.fields.title": "Куда вставлять эти параметры?",
  "kb.fields.desc":
    "Форма приложения Amnezia поле за полем, с вашими значениями — чтобы не гадать, что куда.",
  "kb.fields.action": "Показать поля",
  "kb.short": "Параметры, версии, типичные проблемы",
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

  /* ── 404 ──────────────────────────────────────────────────────────────── */
  "nf.badge": "ПАКЕТ ПОТЕРЯН",
  "nf.title": "Страница не найдена",
  "nf.desc":
    "Такого маршрута здесь нет — возможно, ссылка устарела или в адресе опечатка. Ваши ключи и конфиги при этом никуда не делись: они и так живут только в вашем браузере.",
  "nf.requested": "Запрошенный адрес",
  "nf.home": "На главную",
  "nf.back": "Вернуться назад",
  "nf.elsewhere": "Может быть, вы искали это",
  "nf.link.generator": "Генератор конфигураций",
  "nf.link.faq": "Ответы на частые вопросы",
  "nf.link.mergekeys": "Работа с ключами Amnezia",

  /* ── Packet simulator ─────────────────────────────────────────────────── */
  "sim.noData": "Нет данных для симуляции. Сначала",
  "sim.noData.link": "сгенерируйте конфиг",
  "sim.restart": "Перезапустить",
  "sim.stat.packets": "пакетов",
  "sim.stat.bytes": "байт всего",
  "sim.stat.handshake": "рукопожатие",
  "sim.stat.overhead": "оверхед",
  "sim.stat.at10mbit": "на 10 Мбит/с",
  "sim.diagram.title": "Диаграмма обмена пакетами",
  "sim.client": "Клиент",
  "sim.server": "Сервер",
  "sim.legend.title": "Легенда",
  "sim.packet": "Пакет",
  "sim.detail.direction": "Направление",
  "sim.detail.size": "Размер",
  "sim.detail.header": "Заголовок (H)",
  "sim.detail.payload": "Полезная нагрузка",
  "sim.bytes": "байт",
  "sim.table.title": "Таблица пакетов",
  "sim.table.type": "Тип",
  "sim.table.direction": "Направление",
  "sim.table.size": "Размер",
  "sim.table.header": "Заголовок",
  "sim.table.desc": "Описание",
  "sim.desc.cps": "CPS-пакет I{n}: {profile}",
  "sim.desc.junk": "Junk-train {i}/{total} — маскировка трафика",
  "sim.desc.init": "WG Handshake Initiation, H1={h1}, S1={s1}",
  "sim.desc.response": "WG Handshake Response, H2={h2}, S2={s2}",
  "sim.desc.cookie": "Cookie Reply, H3={h3}, S3={s3}",
  "sim.desc.data": "Передача данных, H4={h4}, S4={s4}",
  "sim.desc.data3": "Передача данных, H4={h4}, S4={s4}, паддинг +{pad} Б",
  "sim.hp.badge": "Заголовок зашифрован",
  "sim.hp.whole": "Сообщение зашифровано целиком",
  "sim.hp.note":
    "AWG 3.0: HeaderProtectionKey задан — заголовки шифруются ChaCha20. Хендшейк и cookie шифруются целиком, транспортные пакеты — только заголовок.",
  "sim.version.note.10":
    "AWG 1.0: нет CPS-цепочек и Cookie Reply с паддингом, заголовки H1–H4 фиксированные.",
  "sim.version.note.15":
    "AWG 1.5: CPS-цепочки только на клиенте, S3/S4 отсутствуют, заголовки H1–H4 фиксированные.",
  "sim.legend.cps":
    "Цепочка сигнатур, которая делает трафик похожим на выбранный протокол.",
  "sim.legend.junk":
    "Фиктивные пакеты, запутывающие DPI перед настоящим handshake.",
  "sim.legend.init":
    "WireGuard Handshake Initiation — первый реальный WG-пакет.",
  "sim.legend.response": "WireGuard Handshake Response — ответ сервера.",
  "sim.legend.cookie": "Cookie Reply — защита от DDoS и amplification.",
  "sim.legend.data": "Зашифрованные данные VPN-туннеля.",
  /* XRay: те же роли, но у другого протокола. */
  "sim.legend.clientHello":
    "TLS ClientHello. При REALITY именно он несёт аутентификацию — по размеру и набору расширений неотличим от настоящего браузера.",
  "sim.legend.serverHello":
    "ServerHello и цепочка сертификатов. При REALITY они берутся у настоящего сайта-донора, поэтому и размер задаёт он.",
  "sim.legend.handshakeFinish": "Finished — завершение TLS-хендшейка.",
  "sim.legend.vlessRequest":
    "Заголовок запроса VLESS: версия, UUID, flow, адрес и порт назначения. Едет внутри первой прикладной записи.",
  "sim.legend.appData": "Полезная нагрузка — то, ради чего всё остальное.",
  "sim.legend.padding": "Паддинг и обмен ключами VLESS Encryption.",
  "sim.desc.xrayHelloReality":
    "ClientHello, SNI={sni}, отпечаток {fp}. Аутентификация REALITY спрятана в полях самого приветствия.",
  "sim.desc.xrayHelloTls": "ClientHello, отпечаток {fp}.",
  "sim.desc.xrayServerHelloReality":
    "Ответ от {dest}: сертификат настоящий, потому что он и есть настоящий.",
  "sim.desc.xrayServerHelloTls": "ServerHello и сертификат сервера.",
  "sim.desc.xrayFinished": "Finished — хендшейк закрыт, дальше идёт прикладной трафик.",
  "sim.desc.xrayVlessRequest": "Заголовок VLESS, {bytes} Б, flow={flow}",
  "sim.desc.xrayEncryption": "Обмен ключами VLESS Encryption: ML-KEM-768 плюс X25519.",
  "sim.desc.xrayAppData": "Прикладные данные поверх {transport}, +{overhead} Б обвязки",

  /* ── MergeKeys ────────────────────────────────────────────────────────── */
  "mk.subtitle": "Редактор ключей и объединение контейнеров Amnezia VPN",
  "mk.loaded.title": "Конфиг из генератора загружен.",
  "mk.loaded.hint":
    "Перейдите во вкладку «Редактор» и нажмите «Применить обфускацию».",
  "mk.notice.title": "Конфиг обфускации не передан.",
  "mk.notice.body":
    "Для обновления параметров Jc/Jmin/Jmax/I1–I5 вернитесь на главную страницу, нажмите «Сгенерировать», затем «Открыть MergeKeys».",
  "mk.notice.manual": "Ключ можно отредактировать вручную во вкладке «Редактор».",
  "mk.notice.mergeWorks": "Вкладка «Объединить ключи» работает без генератора.",
  "mk.tab.editor": "Редактор и конвертер",
  "mk.tab.merge": "Объединить ключи",

  "mk.how.title": "Зачем объединять ключи?",
  "mk.how.1":
    "Amnezia VPN поддерживает несколько контейнеров (протоколов) в одном ключе: AWG + XRay, AWG + OpenVPN и так далее. Это позволяет переключаться между протоколами, не меняя ключ.",
  "mk.how.2":
    "Вставьте два или более vpn://-ключа в слоты ниже. Например, первый — ключ AWG, второй — ключ XRay от того же сервера.",
  "mk.how.3":
    "Нажмите «Объединить». Контейнеры из всех ключей будут собраны в один мастер-ключ. Дубликаты (одинаковое имя контейнера) пропускаются с предупреждением.",
  "mk.how.4":
    "Если страница открыта из генератора, новые параметры обфускации AWG применятся автоматически к AWG-контейнерам в итоговом ключе.",
  "mk.how.5":
    "Метаданные (dns1, dns2, hostName, defaultContainer) берутся из первого ключа. Описание объединяется через « + ».",

  "mk.slots.title": "Ключи для объединения",
  "mk.slots.limits": "минимум 2, максимум 4",
  "mk.slot.remove": "Удалить слот",
  "mk.slot.viewJson": "Просмотр JSON",
  "mk.slot.clear": "Очистить",
  "mk.slot.add": "Добавить ещё один ключ",
  "mk.action.merge": "Объединить",
  "mk.action.clearAll": "Очистить всё",
  "mk.result.title": "Ключи объединены",
  "mk.result.label": "Объединённый ключ",
  "mk.action.copy": "Копировать",
  "mk.action.copied": "Скопировано",
  "mk.action.downloadJson": "Скачать JSON",

  "mk.editor.title": "Редактор и конвертер",
  "mk.editor.activeKey": "Активный ключ",
  "mk.editor.key": "Ключ",
  "mk.editor.open": "Открыть",
  "mk.editor.openHint": "Открыть для превью и правки",
  "mk.editor.backToList": "назад к списку",
  "mk.editor.tabCode": "Код",
  "mk.editor.tabFields": "Поля",
  "mk.editor.import": "Импортировать",
  "mk.editor.showAs": "Показать как",
  "mk.editor.noAwgContainer": "Нет AmneziaWG-контейнера",
  "mk.editor.multiHint":
    "Каждый ключ с новой строки. «Обновить обфускацию» применится ко всем; нажмите «Открыть», чтобы смотреть превью и править один ключ.",
  "mk.editor.placeholder":
    "Вставьте vpn:// ключ, AmneziaWG .conf или JSON… (несколько ключей — с новой строки)",
  "mk.editor.empty": "Загрузите vpn:// ключ или .conf, чтобы редактировать поля.",
  "mk.editor.obfParams": "Параметры обфускации",
  "mk.editor.dangerZone":
    "Опасная зона — меняйте, только если понимаете последствия",
  "mk.editor.checkHide": "Скрыть",
  "mk.editor.checkShow": "Проверить",
  "mk.editor.checkConfig": "конфиг",
  "mk.editor.noIssues": "Проблем не найдено.",
  "mk.editor.applyObf": "Обновить обфускацию",
  "mk.editor.generateFirst": "Сначала сгенерируйте конфиг на главной",
  "mk.editor.pickContainer": "Выбор AWG-контейнера",
  "mk.editor.openOneToExport": "Откройте один ключ для экспорта",
  "mk.editor.openOneToDownload": "Откройте один ключ для скачивания",
  "mk.editor.exportVpn": "Экспорт vpn://",
  "mk.editor.exportConf": "Экспорт .conf",
  "mk.editor.download": "Скачать",

  "mk.msg.loadedConf":
    "Загружен конфиг AWG {version} (Jc={jc}, Jmin={jmin}, Jmax={jmax}).",
  "mk.msg.cpsReady": "CPS I1–I5 готовы к вставке.",
  "mk.msg.onlyJunk": "AWG 1.0: только Jc/Jmin/Jmax.",
  "mk.msg.noConfig": "Нет конфига",
  "mk.msg.noCps": "I1–I5 не поддерж.",
  "mk.msg.keyContents": "Содержимое ключа",
  "mk.msg.keyContentsN": "Содержимое ключа №{n}",
  "mk.msg.slotEmpty": "Слот №{n} пуст.",
  "mk.msg.slotError": "Ошибка в ключе №{n}: {error}",
  "mk.msg.needTwo": "Заполните минимум 2 поля с ключами vpn://.",
  "mk.msg.merged": "Объединено контейнеров: {unique} из {keys} ключей.",
  "mk.msg.dupes": "Пропущено дублей: {n}.",
  "mk.msg.obfUpdated": "Обфускация AWG обновлена: {fields}.",
  "mk.msg.unknownFormat": "Не удалось распознать формат (vpn:// / .conf / JSON).",
  "mk.msg.obfUpdatedKeys": "Обфускация обновлена в {n} {keyWord}: {fields}.",
  "mk.msg.obfUpdatedOne":
    "Обфускация обновлена: {fields} ({n} AWG-{containerWord}).",
  "mk.msg.alreadyCurrent": "Параметры уже актуальны — изменений не потребовалось.",
  "mk.msg.convertOne":
    "Конвертация доступна для одного ключа. Оставьте в редакторе один ключ.",
  "mk.slot.1": "Первый ключ",
  "mk.slot.2": "Второй ключ",
  "mk.slot.3": "Третий ключ",
  "mk.slot.4": "Четвёртый ключ",
  "mk.slot.n": "Ключ №{n}",

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
    "Приглашаю ловить баги и присылать идеи. Пишите в обсуждение в чате или заводите issue на GitHub. Если он недоступен, исходный код продублирован на git.vai-rice.space.",
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
  "footer.link.sourceMirror": "Исходный код на VIA GIT",
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

  /* ── Находки валидаторов ────────────────────────────────────────────── */
  // Тексты живут здесь, а не в валидаторах: находка несёт код и значения,
  // а предложение собирается на языке читателя.
  "find.awg3.version_mismatch":
    "Параметры AWG 3.0 заданы, но версия конфига — {version}.",
  "find.awg3.hpk_format":
    "HeaderProtectionKey должен быть {bytes} байт в base64 ({chars} символа).",
  "find.awg3.s_below_nonce":
    "{name}={value} < {min}: при HeaderProtectionKey из паддинга берётся nonce шифра, и более короткий паддинг молча ослабляет шифрование.",
  "find.awg3.cpa_format":
    "ContentPaddingAddition должен быть числом или диапазоном «мин-макс».",
  "find.awg3.cpa_zero":
    "ContentPaddingAddition = 0 — дополнительный паддинг отключён.",
  "find.awg3.timing_format":
    "{name} должен быть числом или диапазоном «мин-макс».",
  "find.awg3.timing_inverted":
    "{name}: нижняя граница больше верхней.",
  "find.awg3.reject_too_low":
    "RejectAfterTime ({reject}с) должен быть больше KeepaliveTimeout + RekeyTimeout ({floor}с), иначе сессия умрёт раньше, чем успеет обновиться.",
  "find.awg3.rekey_after_reject":
    "RekeyAfterTime (до {rekey}с) должен быть меньше RejectAfterTime (от {reject}с).",
  "find.awg3.attempts_zero":
    "MaxHandshakeAttempts должен быть не меньше 1.",
  "find.parse.empty":
    "Пустой конфиг.",
  "find.parse.not_awg":
    "Не похоже на конфигурацию AmneziaWG: не найдено ни одного параметра.",
  "find.parse.plain_wireguard":
    "Не найден Jc — это конфигурация WireGuard без обфускации AmneziaWG.",
  "find.parse.missing":
    "Параметр {key} отсутствует.",
  "find.parse.not_a_number":
    "{key} должен быть неотрицательным числом, получено «{value}».",
  "find.parse.not_a_range":
    "{key} должен быть диапазоном «начало-конец» в версии {version}.",
  "find.parse.unsupported_for_version":
    "{key} не используется в версии {version} и будет проигнорирован.",
  "find.parse.unknown_version":
    "Версия {version} неизвестна этой сборке.",

  /* ── Находки движка XRay ────────────────────────────────────────────── */
  "find.xray.address_missing":
    "Не указан адрес сервера.",
  "find.xray.port_range":
    "Порт {port} вне диапазона 1–65535.",
  "find.xray.vision_needs_tls":
    "xtls-rprx-vision работает только поверх TLS или REALITY: «XTLS only supports TLS and REALITY directly for now».",
  "find.xray.vision_no_udp":
    "xtls-rprx-vision не поддерживает UDP и требует TLS 1.3 на внешнем слое.",
  "find.xray.flow_mismatch":
    "Значение flow должно совпадать у клиента и сервера: пустой flow против vision-аккаунта отклоняется.",
  "find.xray.reality_transport":
    "REALITY не работает поверх транспорта {transport}: поддерживаются только RAW, XHTTP и gRPC.",
  "find.xray.hysteria_unsupported":
    "Транспорт Hysteria появился в v26.1.13 — на версии {version} ядро отвечает «unknown transport protocol» и не запускается. Генератор заменяет его на XHTTP.",
  "find.xray.transport_deprecated":
    "Транспорт {transport} объявлен устаревшим — ядро рекомендует XHTTP.",
  "find.xray.reality_missing":
    "Выбран REALITY, но блок его параметров отсутствует.",
  "find.xray.server_names_empty":
    "serverNames не может быть пустым на стороне сервера.",
  "find.xray.server_name_risky":
    "{name}: ядро предупреждает, что такая мишень повышает вероятность блокировки IP.",
  "find.xray.dest_missing":
    "Не указан target — сайт, под который маскируется рукопожатие.",
  "find.xray.xver_range":
    "xver = {xver}: допустимы только 0, 1 и 2.",
  "find.xray.key_length":
    "Ключ должен быть 32 байта в base64 RawURL без паддинга.",
  "find.xray.short_ids_empty":
    "shortIds не может быть пустым на стороне сервера.",
  "find.xray.short_id_long":
    "shortId «{id}» длиннее 16 символов.",
  "find.xray.short_id_odd":
    "shortId «{id}» имеет нечётную длину и не декодируется как hex.",
  "find.xray.short_id_hex":
    "shortId «{id}» содержит символы вне hex.",
  "find.xray.spider_x_slash":
    "spiderX должен начинаться со слеша.",
  /* Проверки, выведенные из описания параметра, а не написанные для каждого. */
  /* Структура .conf — то, что про файл, а не про обфускацию. */
  /* Правила параметров обфускации — engines/awg/rules.ts. */
  "find.awg.jc_range":
    "Jc должно быть от {min} до {max} — это предел ядра.",
  "find.awg.jc_slow":
    "Jc = {jc}: каждый мусорный пакет уходит до рукопожатия, так что оно заметно замедлится.",
  "find.awg.jc_over_client":
    "Jc = {jc} выше рекомендуемого максимума {max} для клиента {client}.",
  "find.awg.jmin_not_below_jmax":
    "Jmin должен быть строго меньше Jmax.",
  "find.awg.jmax_over_mtu":
    "Jmax = {jmax} не меньше MTU ({mtu}) — мусорные пакеты будут фрагментироваться, а фрагментация сама по себе заметна.",
  "find.awg.size_max":
    "{key} = {value}: максимум {max}, иначе пакет не помещается в UDP-датаграмму.",
  "find.awg.s4_max":
    "S4 = {s4}: протокол ограничивает транспортный паддинг {max} байтами.",
  "find.awg.s4_zero":
    "S4 = 0 — обфускация транспортных пакетов выключена.",
  "find.awg.s4_over_client":
    "S4 = {s4} превышает максимум {max} для клиента {client}.",
  "find.awg.size_collision":
    "{a} и {b} дают одинаковую длину пакета — два типа сообщений становятся неразличимы по размеру, а паддинг ставится ровно чтобы этого не было.",
  "find.awg.h_overlap":
    "Диапазоны {a} и {b} пересекаются: получатель не сможет отличить один тип сообщения от другого.",
  "find.awg.h_reserved":
    "{key} попадает в зону 1–4, зарезервированную под собственные типы сообщений WireGuard.",
  "find.awg.h_over_client":
    "{key} выходит за максимум {max} для клиента {client}.",
  "find.awg.cps_syntax":
    "{key}: неверный синтаксис CPS-цепочки.",
  "find.awg.cps_tag_unsupported":
    "Тег {tag} не поддерживается клиентом {client}.",
  "find.awg.conf.not_obfuscated":
    "Параметров AmneziaWG (H/S/J/I) в конфиге нет — похоже, это обычный WireGuard.",
  "find.awg.conf.template":
    "Это шаблон: PrivateKey и Address оставлены закомментированными — подставьте свои перед использованием.",
  "find.awg.conf.unparsable": "Не удалось разобрать .conf: {reason}",
  "find.awg.conf.no_interface": "Отсутствует секция [Interface].",
  "find.awg.conf.no_peer": "Нет секций [Peer] — конфиг только для сервера?",
  "find.awg.conf.missing_field": "Отсутствует обязательное поле {key}.",
  "find.awg.conf.bad_key": "{key} не выглядит как ключ WireGuard: ожидается 32 байта в base64 (44 символа).",
  "find.awg.conf.peer_missing_field": "Peer #{n}: отсутствует {key}.",
  "find.awg.conf.peer_bad_key": "Peer #{n}: {key} не выглядит как ключ WireGuard.",
  "find.awg.conf.peer_bad_endpoint": "Peer #{n}: Endpoint имеет нестандартный формат — ожидается хост:порт.",
  "find.param.not_a_number": "{key}: ожидается число.",
  "find.param.not_a_range": "{key}: ожидается диапазон вида «мин-макс».",
  "find.param.range_inverted": "{key}: нижняя граница {lo} больше верхней {hi}.",
  "find.param.below_min": "{key} = {actual}: меньше минимума {min}.",
  "find.param.above_max": "{key} = {actual}: больше максимума {max}.",
  "find.param.not_encoded": "{key}: значение не декодируется как {encoding}.",
  "find.param.wrong_length": "{key}: ожидается {expected} байт после декодирования, получено {actual}.",
  "find.param.too_long": "{key}: длина {actual} символов, максимум {max}.",
  "find.param.not_allowed": "{key}: значение «{value}» не входит в допустимые ({allowed}).",
  "find.validator.crashed": "Проверка «{rule}» упала: {reason}. Это баг Архитектора, а не конфига.",
  "find.xray.fingerprint_refused":
    "Отпечаток {fingerprint} отклоняется REALITY.",
  "find.xray.mldsa_unsupported":
    "ML-DSA-65 появился в v25.7.23 и недоступен в версии {version}.",
  "find.xray.mldsa_required":
    "В v{version} REALITY не запускается без mldsa65Seed — на этом ядре поле обязательное, а не опциональное.",
  "find.xray.mldsa_seed_length":
    "mldsa65Seed должен быть 32 байта в base64 RawURL.",
  "find.xray.mldsa_seed_equals_key":
    "mldsa65Seed не может совпадать с privateKey — ядро это отклоняет.",
  "find.xray.mldsa_verify_pending":
    "mldsa65Verify выводится самим алгоритмом ML-DSA-65: получите его командой xray mldsa65 из этого seed.",
  "find.xray.mldsa_verify_length":
    "mldsa65Verify должен быть ровно 1952 байта.",
  "find.xray.vless_enc_unsupported":
    "VLESS Encryption появился в v25.8.29 и недоступен в версии {version}.",
  "find.xray.vless_enc_format":
    "Строка шифрования должна начинаться с mlkem768x25519plus и содержать минимум четыре элемента.",
  "find.xray.vless_enc_mode":
    "Режим «{mode}» неизвестен: допустимы native, xorpub и random.",
  "find.xray.xhttp_path_slash":
    "Путь XHTTP должен начинаться со слеша.",
  "find.xray.xhttp_split_mode":
    "Раздельная загрузка включена, но режим разрешился в {mode}, а не stream-up.",
  "find.xray.xhttp_basic_only":
    "На v{version} у XHTTP есть только базовые ручки: имена паддинга, идентификатор сессии, счётчик частей и размещение восходящих данных появились в v26.6.22. Они не переименованы — их там нет, поэтому конфиг генерируется без них, а не с ключами, которых ядро не читает.",
  "find.xray.xhttp_session_names":
    "В версии {version} ключи сессии называются session*, а не sessionID* — конфиг собран под старое имя.",
  "find.xray.parse.not_vless":
    "Ссылка должна начинаться с vless://.",
  "find.xray.parse.malformed_uri":
    "Не удалось разобрать ссылку.",
  "find.xray.parse.no_uuid":
    "В ссылке нет идентификатора клиента.",
  "find.xray.parse.unknown_transport":
    "Неизвестный транспорт «{transport}».",
  "find.xray.parse.version_assumed":
    "Версия ядра в конфиге не указана — принята {version}.",
  "find.xray.parse.no_public_key":
    "В ссылке нет публичного ключа (pbk).",
  "find.xray.parse.client_half_only":
    "Это клиентская половина: приватный ключ и target в ссылку не входят.",
  "find.xray.parse.server_half_only":
    "Это серверная половина: публичный ключ выводится из приватного и в конфиге не хранится.",
  "find.xray.parse.bad_json":
    "Не удалось разобрать JSON.",
  "find.xray.parse.not_vless_inbound":
    "Ожидался inbound с protocol = vless, получен «{protocol}».",
  "find.xray.parse.no_clients":
    "В конфиге нет ни одного клиента.",
  "find.xray.parse.unrecognised":
    "Не похоже ни на ссылку vless://, ни на JSON-конфиг.",

  /* ── Client field guide ───────────────────────────────────────────────── */
  "clientFields.toggle.title": "Куда вставлять параметры в клиенте",
  "clientFields.toggle.filled": "Форма приложения Amnezia с вашими значениями",
  "clientFields.toggle.empty": "Форма приложения Amnezia, поле за полем",
  "clientFields.intro":
    "Так выглядит форма параметров в приложении Amnezia. Названия полей приведены по-английски, как в самом клиенте — оно не переводит их даже при русском интерфейсе. Пояснения даны рядом, серым.",
  "clientFields.state.filled":
    "Показаны значения вашего последнего конфига — нажмите на поле, чтобы скопировать.",
  "clientFields.state.empty":
    "Сгенерируйте конфиг на главной, и здесь появятся ваши значения.",
  "clientFields.group.junk": "Мусорные пакеты",
  "clientFields.group.sizes": "Размеры паддинга",
  "clientFields.group.headers": "Магические заголовки",
  "clientFields.group.cps": "CPS-цепочки",
  "clientFields.hint.jc": "количество мусорных пакетов",
  "clientFields.hint.jmin": "минимальный размер мусорного пакета",
  "clientFields.hint.jmax": "максимальный размер мусорного пакета",
  "clientFields.hint.s1": "паддинг пакета init",
  "clientFields.hint.s2": "паддинг пакета response",
  "clientFields.hint.s3": "паддинг cookie reply",
  "clientFields.hint.s4": "паддинг транспортного пакета",
  "clientFields.hint.h1": "заголовок пакета init",
  "clientFields.hint.h2": "заголовок пакета response",
  "clientFields.hint.h3": "заголовок cookie reply",
  "clientFields.hint.h4": "заголовок транспортного пакета",
  "clientFields.hint.cps": "CPS-цепочка {n}",

  /* ── MergeKeys: what the engine reports ───────────────────────────────── */
  "mk.err.lengthMismatch":
    "Длина после распаковки ({got}) не совпадает с заголовком ({expected}).",
  "mk.err.decode": "Не удалось декодировать ключ: {error}",
  "mk.err.noConfig":
    "Конфиг не сгенерирован. Вернитесь на главную и нажмите «СГЕНЕРИРОВАТЬ».",
  "mk.err.noAwgContainer":
    "В ключе не найдено ни одного AWG-контейнера. Этот инструмент работает только с AmneziaWG-ключами.",
  "mk.err.noConfField":
    "Не удалось извлечь .conf из AWG-контейнера: в нём нет поля config.",
  "mk.err.needTwo": "Для объединения нужно минимум 2 ключа.",
  "mk.warn.duplicateContainer":
    "Дубликат контейнера «{name}» из ключа #{from} пропущен — он уже есть из ключа #{seen}.",

  /* ── Counted nouns ────────────────────────────────────────────────────── */
  "count.key": {
    one: "ключ",
    few: "ключа",
    many: "ключей",
    other: "ключей",
  },
  "count.keyIn": {
    one: "ключе",
    few: "ключах",
    many: "ключах",
    other: "ключах",
  },
  "count.container": {
    one: "контейнер",
    few: "контейнера",
    many: "контейнеров",
    other: "контейнеров",
  },

  /* ── Generator: the custom-host field ─────────────────────────────────── */
  "gen.host.hint.quic": "Хост с HTTP/3. Примеры из базы: {examples}",
  "gen.host.hint.tls": "Любой хост с TLS 1.3. Примеры из базы: {examples}",
  "gen.host.hint.dtls": "Хост, отвечающий по DTLS — WebRTC или TURN: {examples}",
  "gen.host.hint.sip": "Хост, который действительно отвечает по SIP: {examples}",
  "gen.host.hint.stun": "STUN-сервер, отвечающий на 3478: {examples}",
  "gen.host.hint.dns": "Имя, у которого есть A-запись: {examples}",
  "gen.host.hint.random":
    "Профиль выбирается случайно, имя — под него. Можно указать своё.",
  "gen.host.placeholder.quic": "например, {example}",
  "gen.host.placeholder.tls": "например, {example}",
  "gen.host.placeholder.dtls": "например, {example}",
  "gen.host.placeholder.sip": "например, {example}",
  "gen.host.placeholder.stun": "например, {example}",
  "gen.host.placeholder.dns": "например, {example}",
  "gen.host.placeholder.random": "свой хост (необязательно)",
} as const satisfies Record<string, MessageValue>;

export type MessageKey = keyof typeof ru;
export type Catalog = Record<MessageKey, MessageValue>;

export default ru;
