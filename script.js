var ver = "2.0",
  inten = "medium",
  iter = 0,
  cp = null;

/**
 * AmneziaWG Architect — hostPools v2.2
 *
 * Последнее обновление пула: март 2026.
 *
 * Критерии отбора доменов:
 *   1. Поддержка релевантного протокола (QUIC/HTTP3, TLS1.3, DTLS/STUN, SIP)
 *   2. Доступность из России на момент Q1 2026 — не внесены в блок-листы РКН/TSPU
 *   3. Достаточно крупный трафик: блокировка приводит к заметному ущербу (банки,
 *      госуслуги, массовые сервисы), что снижает риск цензурного коллапса
 *
 * ── САЙТЫ, ЗАБЛОКИРОВАННЫЕ в России на момент марта 2026 ─────────────────────
 *  YouTube         — полностью заблокирован с 2024 (удаление из NSDI)
 *  Cloudflare CDN  — блокировка *.cloudflare.com, 1.1.1.1, *.workers.dev
 *  Discord         — полностью заблокирован с 2024
 *  Facebook/Meta   — полностью заблокирован (экстремистская организация)
 *  Instagram       — полностью заблокирован (экстремистская организация)
 *  WhatsApp        — полностью заблокирован с 11.02.2026 (DNS удалены из NSDI)
 *  Snapchat        — блокируется
 *  LinkedIn        — блокируется с 2016
 *  Google services — частично: поиск/YouTube блокированы; GCP/Firebase часто доступны
 *                    (но отдельные STUN/IP-диапазоны недоступны)
 *  Twitter/X       — доступ существенно ограничен, считается заблокированным
 *
 * ── Статус CDN Telegram ─────────────────────────────────────────────────────
 *  На 01.03.2026 Telegram заметно ТРОТТЛИТСЯ (медиа загружаются ≈10% скорости).
 *  Ожидается возможная полная блокировка — поэтому cdn1-5.telegram.org исключены
 *  из пулов по умолчанию. При уверенной доступности у вашего провайдера —
 *  можно возвращать их в пул вручную.
 *
 * ── Уровни «безопасности» по пулам ──────────────────────────────────────────
 *  🟢 RU-domestic  — полностью российские сервисы, минимальный риск блокировки
 *  🔵 CDN-infra    — CDN, обслуживающие банки/госструктуры; блокировка приводит к
 *                   экономическим последствиям и потому менее вероятна
 *  🟡 Tech-neutral — GitHub, Steam, Apple, Microsoft — массово используемые сервисы
 *  🟠 International — международные провайдеры; доступны, но имеют меньшую гарантию
 */

var hostPools = {
  /* ──────────────────────────────────────────────────────────────────────────
   * QUIC Initial (RFC 9000, Long Header 0xC0-0xC3, UDP 443)
   * Хосты, у которых подтверждена установка HTTP/3 (QUIC) по UDP/443 и которые
   * доступны из России. Пулы формируются с приоритетом на отказоустойчивость
   * и минимальный риск региональных блокировок.
   * ────────────────────────────────────────────────────────────────────────── */
  quic_initial: [
    // 🟢 RU-domestic CDN & portals
    "yandex.net", // Yandex CDN backbone — HTTP/3 enabled
    "yastatic.net", // Yandex static CDN
    "s3.yandex.net", // Yandex Object Storage
    "storage.yandexcloud.net",
    "cloud.yandex.ru",
    "dzen.ru", // Dzen (ex-Yandex Zen)
    "music.yandex.ru",
    "vk.com",
    "mycdn.me", // VK CDN
    "vk-cdn.net",
    "userapi.com",
    "ok.ru",
    "mail.ru",
    "imgsmail.ru",
    "cdn.mail.ru",
    "avito.ru", // #1 RU classifieds — HTTP/3
    "ozon.ru",
    "cdn1.ozone.ru",
    "wildberries.ru",
    "wbstatic.net", // WB CDN
    "kinopoisk.ru",
    "ivi.ru",
    "rutube.ru",
    "rt.ru", // RT (state media) — always accessible
    "sber.ru",
    "sberbank.ru",
    "sbp.ru",
    "tbank.ru",
    "raiffeisen.ru",
    "vtb.ru",
    "alfabank.ru",
    "kaspersky.ru",
    "kaspersky.com",
    "drweb.ru",
    "selectel.ru", // Selectel (RU cloud)
    "selectel.com",
    "timeweb.cloud",
    "timeweb.com",
    "reg.ru",
    "beget.com",
    "mchost.ru",
    "nic.ru",
    "dataline.ru",
    "mts.ru", // Mobile operators — unblockable
    "beeline.ru",
    "megafon.ru",
    "rostelecom.ru",

    // 🔵 CDN-infra (RU banks/gov/enterprises depend on these)
    "gcore.com", // Gcore (Luxembourg HQ, PoP in Moscow/SPb) — HTTP/3
    "api.gcore.com",
    "cdn.gcore.com",
    "g.gcdn.co", // Gcore edge alias
    "bunny.net", // BunnyCDN — HTTP/3 default, Fastly backend
    "b-cdn.net",
    "storage.bunnycdn.com",
    "cdn77.com", // CDN77 — HTTP/3, serves Avast, European Space Agency
    "rsc.cdn77.org",
    "fastly.net", // Fastly — serves GitHub, npm, Spotify
    "a.ssl.fastly.net",
    "global.fastly.net",
    "fastlylabs.com",
    "a248.e.akamai.net", // Akamai — serves RU Sberbank, Tinkoff, VTB CDN
    "akamaiedge.net",
    "akamaihd.net",
    "akamaistream.net",
    "edgekey.net",
    "cloudfront.net", // AWS CloudFront — serves RU banking APIs
    "d1.awsstatic.com",
    "d2.awsstatic.com",
    "s3.amazonaws.com",
    "msedge.net", // Microsoft CDN — Win Update, Office365
    "cdn.office.net",
    "azureedge.net",
    "live.com",
    "outlook.com",
    "office.com",
    "microsoft.com",
    "xbox.com",
    "xboxlive.com",
    "onedrive.live.com",
    "icloud.com", // Apple — ~50M RU iOS devices
    "cdn-apple.com",
    "mzstatic.com",
    "apple.com",
    "appleid.apple.com",

    // 🟡 Tech-neutral
    "github.com",
    "objects.githubusercontent.com",
    "raw.githubusercontent.com",
    "codeload.github.com",
    "github.githubassets.com",
    "avatars.githubusercontent.com",
    "gitlab.com", // GitLab (not blocked)
    "cdn.jsdelivr.net", // jsDelivr — open CDN for npm/GitHub
    "unpkg.com",
    "registry.npmjs.org",
    "pypi.org", // Python Package Index
    "files.pythonhosted.org",
    "archive.ubuntu.com", // Ubuntu mirrors — used by every Linux VPS
    "security.ubuntu.com",
    "packages.ubuntu.com",
    "deb.debian.org",
    "ftp.debian.org",
    "steamstatic.com", // Steam/Valve
    "steamcontent.com",
    "steampowered.com",
    "steamcdn-a.akamaihd.net",
    "spotify.com", // Spotify (accessible in RU)
    "scdn.co",
    "heads-ak.spotify.com",
    "jtvnw.net", // Twitch media CDN (Akamai-backed)
    "twitchsvc.net",
    "wikipedia.org", // Wikipedia — never blocked
    "upload.wikimedia.org",
    "wikimedia.org",
    "wikidata.org",

    // 🟡 Hetzner / OVH / Selectel (popular RU dev/business VPS)
    "hetzner.com",
    "hetzner.de",
    "hetzner.cloud",
    "your-server.de",
    "ovhcloud.com",
    "ovh.net",
    "ovh.com",

    // 🟠 Asian CDN / cloud
    "tencentcs.com",
    "tencent.com",
    "myqcloud.com",
    "qpic.cn",
    "alicdn.com",
    "aliyuncs.com",
    "alibabacloud.com",
    "taobao.com",
    "huaweicloud.com",
    "hwcdn.net",

    // 🟠 Additional international accessible in RU
    "dropbox.com",
    "dropboxstatic.com",
    "epicgames.com",
    "ea.com",
    "battle.net",
    "blizzard.com",
    "ubisoft.com",
  ],

  /* ──────────────────────────────────────────────────────────────────────────
   * QUIC 0-RTT (Long Header 0xD0-0xD3, возобновление сессии)
   * Пулы — только те CDN/сервисы, где подтверждена поддержка 0-RTT / session tickets.
   * Используется для правдоподобного эмулирования ранних данных (Early Data).
   * ────────────────────────────────────────────────────────────────────────── */
  quic_0rtt: [
    // 🟢 RU-domestic
    "yandex.net",
    "yastatic.net",
    "storage.yandexcloud.net",
    "vk.com",
    "mycdn.me",
    "vk-cdn.net",
    "mail.ru",
    "ozon.ru",
    "avito.ru",
    "wildberries.ru",
    "wbstatic.net",
    "kinopoisk.ru",
    "sber.ru",
    "kaspersky.com",
    "selectel.ru",
    "timeweb.cloud",

    // 🔵 CDN-infra (confirmed 0-RTT)
    "gcore.com",
    "cdn.gcore.com",
    "g.gcdn.co",
    "bunny.net",
    "b-cdn.net",
    "cdn77.com",
    "fastly.net",
    "a.ssl.fastly.net",
    "global.fastly.net",
    "cloudfront.net", // CloudFront: 0-RTT via TLS 1.3 session tickets
    "s3.amazonaws.com",
    "d1.awsstatic.com",
    "msedge.net",
    "cdn.office.net",
    "live.com",
    "office.com",
    "xbox.com",
    "icloud.com", // Apple QUIC: confirmed 0-RTT in iOS 17+
    "cdn-apple.com",
    "mzstatic.com",

    // 🟡 Tech-neutral
    "github.com",
    "objects.githubusercontent.com",
    "cdn.jsdelivr.net",
    "unpkg.com",
    "registry.npmjs.org",
    "archive.ubuntu.com",
    "steamstatic.com",
    "steamcontent.com",
    "spotify.com",
    "scdn.co",
    "wikipedia.org",
    "wikimedia.org",
    "dropbox.com",
    "epicgames.com",

    // 🟠 Asian CDN
    "alicdn.com",
    "tencentcs.com",
    "myqcloud.com",
    "huaweicloud.com",
  ],

  /* ──────────────────────────────────────────────────────────────────────────
   * TLS 1.3 Client Hello
   * Самый широкий пул: любой HTTPS-хост подходит, список отсортирован по
   * надёжности и доступности в России на 2026 год.
   * ────────────────────────────────────────────────────────────────────────── */
  tls_client_hello: [
    // 🟢 RU-domestic: top-100 Russian websites
    "yandex.net",
    "yandex.ru",
    "yastatic.net",
    "s3.yandex.net",
    "storage.yandexcloud.net",
    "cloud.yandex.ru",
    "dzen.ru",
    "music.yandex.ru",
    "vk.com",
    "mycdn.me",
    "vk-cdn.net",
    "userapi.com",
    "ok.ru",
    "mail.ru",
    "imgsmail.ru",
    "cdn.mail.ru",
    "avito.ru",
    "ozon.ru",
    "cdn1.ozone.ru",
    "wildberries.ru",
    "wbstatic.net",
    "kinopoisk.ru",
    "ivi.ru",
    "rutube.ru",
    "premier.one",
    "okko.tv",
    "more.tv",
    "rt.ru",
    "russia.tv",
    "1tv.ru",
    "ntv.ru",
    "ren.tv",
    "tvc.ru",
    "sber.ru",
    "sberbank.ru",
    "sbp.ru",
    "online.sberbank.ru",
    "tbank.ru",
    "raiffeisen.ru",
    "vtb.ru",
    "vtb24.ru",
    "alfabank.ru",
    "gazprombank.ru",
    "sovcombank.ru",
    "rosbank.ru",
    "kaspersky.ru",
    "kaspersky.com",
    "drweb.ru",
    "drweb.com",
    "roscosmos.ru",
    "gosuslugi.ru", // Russian government portals
    "mts.ru",
    "beeline.ru",
    "megafon.ru",
    "tele2.ru",
    "rostelecom.ru",
    "selectel.ru",
    "selectel.com",
    "timeweb.cloud",
    "timeweb.com",
    "reg.ru",
    "beget.com",
    "nic.ru",
    "dataline.ru",
    "mchost.ru",
    "citilink.ru",
    "mvideo.ru",
    "sbermegamarket.ru",
    "lamoda.ru",
    "eldorado.ru",
    "detmir.ru",
    "sportmaster.ru",
    "letoile.ru",
    "gazeta.ru",
    "rbc.ru",
    "kommersant.ru",
    "tass.ru",
    "ria.ru",
    "hh.ru",
    "superjob.ru",
    "rabota.ru",
    "rambler.ru",
    "lenta.ru",
    "rg.ru",
    "2gis.ru",
    "maps.yandex.ru",
    "gosuslugi.ru",
    "mos.ru",
    "nalog.ru",
    "pfr.gov.ru",

    // 🔵 CDN-infra
    "gcore.com",
    "api.gcore.com",
    "cdn.gcore.com",
    "g.gcdn.co",
    "bunny.net",
    "b-cdn.net",
    "storage.bunnycdn.com",
    "cdn77.com",
    "rsc.cdn77.org",
    "fastly.net",
    "a.ssl.fastly.net",
    "global.fastly.net",
    "fastlylabs.com",
    "a248.e.akamai.net",
    "akam.net",
    "akamaiedge.net",
    "akamaihd.net",
    "akamaistream.net",
    "edgekey.net",
    "cloudfront.net",
    "d1.awsstatic.com",
    "d2.awsstatic.com",
    "s3.amazonaws.com",
    "aws.amazon.com",
    "msedge.net",
    "azure.microsoft.com",
    "azureedge.net",
    "cdn.office.net",
    "live.com",
    "outlook.com",
    "hotmail.com",
    "office.com",
    "onedrive.live.com",
    "xbox.com",
    "xboxlive.com",
    "microsoft.com",
    "icloud.com",
    "cdn-apple.com",
    "mzstatic.com",
    "apple.com",
    "appleid.apple.com",

    // 🟡 Tech-neutral
    "github.com",
    "objects.githubusercontent.com",
    "raw.githubusercontent.com",
    "codeload.github.com",
    "github.githubassets.com",
    "avatars.githubusercontent.com",
    "gitlab.com",
    "bitbucket.org",
    "cdn.jsdelivr.net",
    "unpkg.com",
    "registry.npmjs.org",
    "pypi.org",
    "files.pythonhosted.org",
    "archive.ubuntu.com",
    "security.ubuntu.com",
    "packages.ubuntu.com",
    "deb.debian.org",
    "ftp.debian.org",
    "launchpad.net",
    "snapcraft.io",
    "steamstatic.com",
    "steamcontent.com",
    "steampowered.com",
    "steamcdn-a.akamaihd.net",
    "store.steampowered.com",
    "epicgames.com",
    "ea.com",
    "ubisoft.com",
    "battle.net",
    "blizzard.com",
    "riotgames.com",
    "leagueoflegends.com",
    "spotify.com",
    "scdn.co",
    "heads-ak.spotify.com",
    "jtvnw.net",
    "twitchsvc.net",
    "wikipedia.org",
    "upload.wikimedia.org",
    "wikimedia.org",
    "wikidata.org",
    "commons.wikimedia.org",
    "hetzner.com",
    "hetzner.de",
    "hetzner.cloud",
    "your-server.de",
    "ovhcloud.com",
    "ovh.net",
    "ovh.com",
    "gra-g1.ovh.net",
    "dropbox.com",
    "dropboxstatic.com",
    "dropboxapi.com",
    "notion.so",
    "notionusercontent.com", // Notion (accessible in RU)
    "zoom.us",
    "zmtr.cn", // Zoom (accessible in RU)

    // 🟠 Asian CDN
    "tencentcs.com",
    "tencent.com",
    "myqcloud.com",
    "qpic.cn",
    "alicdn.com",
    "aliyuncs.com",
    "alibabacloud.com",
    "huaweicloud.com",
    "hwcdn.net",
    "baidu.com",
    "bdstatic.com", // Baidu CDN
  ],

  /* ──────────────────────────────────────────────────────────────────────────
   * DTLS 1.3  —  хосты/сервисы, использующие DTLS (WebRTC, STUN/TURN)
   *
   * ⚠ ИСКЛЮЧЕНИЯ: stun.l.google.com и похожие — IP Google (74.125.x.x,
   *   172.217.x.x) частично блокируются и не подходят для пула.
   * ⚠ ИСКЛЮЧЕНИЯ: stun.cloudflare.com — Cloudflare в блок-листах.
   * ⚠ ИСКЛЮЧЕНИЯ: stun.telegram.org / turn.telegram.org — Telegram сейчас
   *   троттлится; ожидается возможная полная блокировка.
   * Рекомендуется не добавлять серверы с неопределённой доступностью.
   * ────────────────────────────────────────────────────────────────────────── */
  dtls: [
    // 🟢 RU-domestic STUN/TURN (operators and services)
    "turn.yandex.net", // Yandex Telemost (video conf)
    "stun.yandex.net",
    "stun1.yandex.net",
    "telemost.yandex.ru",
    "turn.vk.com", // VK Video Calls
    "stun.vk.com",
    "stun1.vk.com",
    "rtc.vk.com",
    "stun.mail.ru",
    "turn.mail.ru",
    "stun.sipnet.ru", // Sipnet (RU SIP provider)
    "stun.sipnet.net",
    "stun.zadarma.com", // Zadarma (RU-friendly VoIP)
    "turn.zadarma.com",
    "stun.zepter.ru", // Zepter Russia WebRTC
    "stun.mango-office.ru", // MangoOffice (RU PBX)
    "stun.beeline.ru",
    "stun.mts.ru",
    "stun.megafon.ru",
    "stun.rostelecom.ru",

    // 🔵 Well-known public STUN (globally routed, not blocked in RU)
    "stun.stunprotocol.org", // RFC-compliant, maintained by volunteers
    "stun.voip.ipp2p.com",
    "stun.voipstunt.com",
    "stun.voipbuster.com",
    "stun.voipwise.com",
    "stun.voiptia.net",
    "stun.voxox.com",
    "stun.voxgratia.org",
    "stun.voys.nl",
    "stun.voztele.com",
    "stun.ippi.fr",
    "stun.antisip.com",
    "stun.freecall.com",
    "stun.internetcalls.com",
    "stun.counterpath.com",
    "stun.counterpath.net",
    "stun.softjoys.com",
    "stun.sipgate.net",
    "stun.sip.us",
    "stun.ekiga.net",
    "stun.ideasip.com",
    "stun.schlund.de",
    "stun.xs4all.nl",
    "stun.xten.com",
    "stun.sonetel.com",
    "stun.sonetel.net",
    "stun.rock.com",
    "stun.ooma.com",
    "stun.vyke.com",
    "stun.webcalldirect.com",
    "stun.wwdl.net",
    "stun.yesdates.com",
    "stun.zoiper.com",
    "stun01.sipphone.com",
    "stun1.faktortel.com.au",
    "stun.noc.ams-ix.net",
    "stun.voipzoom.com",

    // 🟡 Open-source / hosted WebRTC infrastructure
    "meet.jit.si", // Jitsi Meet — open video conf, not blocked
    "stun.jit.si",
    "turn.jit.si",
    "8x8.vc",
    "stun.services.mozilla.com", // Firefox WebRTC
    "turn.matrix.org", // Matrix / Element
    "stun.matrix.org",
    "stun.nextcloud.com", // Nextcloud Talk
    "turn.nextcloud.com",
    "janus.conf.meetecho.com", // Janus WebRTC Gateway
    "stun.meetecho.com",

    // 🟡 Commercial VoIP STUN (EU/US, accessible from RU)
    "global.stun.twilio.com",
    "stun.us1.twilio.com",
    "stun.ie1.twilio.com",
    "stun.au1.twilio.com",
    "stun.nexmo.com",
    "stun.vonage.com",
    "global.stun.bandwidth.com",
    "stun.plivo.com",

    // 🟠 TURN relays (free tiers, not blocked in RU)
    "openrelay.metered.ca", // OpenRelay — free, 500 MB/mo
    "coturn.net",
    "freestun.net", // freestun.net:3479 — free STUN/TURN
    "relay.webwormhole.io",
    "stun.f.haeder.net",
    "stunserver.stunprotocol.org",
  ],

  /* ──────────────────────────────────────────────────────────────────────────
   * SIP REGISTER  —  SIP-регистраторы и прокси-серверы
   * Текстовый UDP-протокол; имя хоста включается прямо в заголовки REGISTER,
   * поэтому мы кодируем домен в начале CPS-пакета для правдоподобия.
   * ────────────────────────────────────────────────────────────────────────── */
  sip: [
    // 🟢 RU mobile operators (SIP trunks, required by law to work)
    "sip.beeline.ru",
    "voip.beeline.ru",
    "sip.mts.ru",
    "voip.mts.ru",
    "sip.megafon.ru",
    "voip.megafon.ru",
    "sip.tele2.ru",
    "voip.tele2.ru",
    "sip.rostelecom.ru",
    "voip.rostelecom.ru",
    "sip.mtt.ru",
    "voip.mtt.ru", // MTT Telecom (RU carrier)

    // 🟢 RU SIP / cloud PBX providers
    "sip.vk.com",
    "sip.yandex.ru",
    "sip.mail.ru",
    "voip.sberbank.ru",
    "sip.tbank.ru",
    "sip.sipnet.ru",
    "sip.sipnet.net",
    "sip.mango-office.ru",
    "pbx.mango-office.ru",
    "sip.zadarma.com",
    "pbx.zadarma.com",
    "sip.gravitel.ru",
    "sip.onlinepbx.ru",
    "sip.uis.ru",
    "pbx.uis.ru",
    "sip.comagic.ru",
    "sip.binotel.ru",
    "sip.novofon.ru",
    "sip.megacall.ru",
    "sip.zebra-telecom.ru",
    "sip.obit.ru",
    "sip.mtsglobaltelecom.ru",
    "sip.vats.sber.ru",
    "pbx.rt.ru", // Rostelecom PBX

    // 🟡 International SIP (accessible from RU, commonly used)
    "sip2sip.info",
    "sip.linphone.org", // Linphone open-source client registrar
    "proxy.sipthor.net",
    "sip.sipthor.net",
    "sip.antisip.com",
    "sip.ippi.fr",
    "sip.voipbuster.com",
    "sip.voipstunt.com",
    "sip.freecall.com",
    "sip.powervoip.com",
    "sip.poivy.com",
    "sip.voipwise.com",
    "sip.internetcalls.com",
    "sip.counterpath.com",
    "sipml5.org",
    "sip.zoiper.com",
    "sip.microsip.org",
    "asterisk.org",
    "sip.asterisk.org",

    // 🟠 Enterprise / cloud PBX (EU/US, accessible from RU)
    "sip.vonage.com",
    "sip.ringcentral.com",
    "sip.8x8.com",
    "sip.plivo.com",
    "sip.telnyx.com",
    "sip.bandwidth.com",
    "sip.twilio.com",
    "global.sip.twilio.com",
    "sip.infobip.com",
    "sip.messagebird.com",
    "sip.signalwire.com",
    "sip.did.telnyx.com",
  ],
};

// ── core helpers ──────────────────────────────────────────────────────────────

/**
 * getHost(profile) — возвращает текущий пользовательский хост (если введён),
 * иначе выбирает случайный хост из пула, соответствующего профилю.
 * При неизвестном профиле используется пул TLS/HTTP3 по умолчанию.
 */
function getHost(profile) {
  var elem = document.getElementById("customHost");
  var custom = elem ? elem.value.trim() : "";
  if (custom) return custom;
  var pool = hostPools[profile] || hostPools.tls_client_hello;
  return pool[rnd(0, pool.length - 1)];
}

function rnd(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

/**
 * rh(n) — n байт случайного hex. Аргумент приводится к целому.
 * Возвращает строку длиной ровно n*2 символов (всегда чётная).
 */
function rh(n) {
  var bytes = Math.max(0, Math.floor(n));
  var s = "";
  for (var i = 0; i < bytes; i++)
    s += ("0" + Math.floor(Math.random() * 256).toString(16)).slice(-2);
  return s;
}

/**
 * hexPad(value, byteLen) — число → hex-строка ровно byteLen байт (byteLen*2 символов).
 * Заменяет опасный .toString(16) без гарантии чётной длины.
 */
function hexPad(value, byteLen) {
  var hex = Math.floor(value).toString(16);
  while (hex.length < byteLen * 2) hex = "0" + hex;
  return hex.slice(-(byteLen * 2));
}

/**
 * assertEvenHex(hex, label) — страховочная проверка.
 * Если вдруг hex нечётный — логирует и дополняет нулём.
 * При корректном использовании hexPad/rh эта ветка никогда не должна срабатывать.
 */
function assertEvenHex(hex, label) {
  if (hex.length % 2 !== 0) {
    console.warn("[AWG] odd hex in " + (label || "?") + " len=" + hex.length);
    hex = hex + "0";
  }
  return hex;
}

function rRange(base, spread) {
  var s = base + rnd(0, spread || 500000);
  return s + "-" + (s + rnd(1000, 50000));
}

// ── protocol generators ───────────────────────────────────────────────────────

/**
 * mkQUICi — QUIC Initial (RFC 9000, Long Header 0xC0-0xC3)
 *
 * Long Header layout:
 *   1B flags | 4B version | 1B dcid_len | dcid | 1B scid_len | scid
 *   | 1B token_len | token | 4B reserved/PN
 *
 * Все части чётные по определению:
 *   hexPad(x, n) → 2n символов; rh(k) → 2k символов.
 */
function mkQUICi(iv) {
  var host = getHost("quic_initial");
  var dcid = rnd(8, 20);
  var scid = rnd(0, 20);
  var tokenLen = rnd(0, 1) === 0 ? 0 : rnd(8, 32);
  var sniRc = Math.min(host.length + rnd(0, 6), 64);
  var rLen = Math.min(rnd(20, 80) * iv, 500);

  var getT = (id) => (document.getElementById(id) || { checked: true }).checked;

  var hex = assertEvenHex(
    hexPad(0xc0 | rnd(0, 3), 1) + // 1B flags
      "00000001" + // 4B version
      hexPad(dcid, 1) + // 1B DCID length
      rh(dcid) + // N bytes DCID
      hexPad(scid, 1) + // 1B SCID length
      rh(scid) + // N bytes SCID
      hexPad(tokenLen, 1) + // 1B token length
      rh(tokenLen) + // N bytes token
      rh(4), // 4B reserved/PN
    "mkQUICi",
  );

  return (
    "<b 0x" +
    hex +
    ">" +
    (getT("useTagRC") ? "<rc " + sniRc + ">" : "") +
    (getT("useTagC") ? "<c>" : "") +
    (getT("useTagT") ? "<t>" : "") +
    (getT("useTagR") ? "<r " + rLen + ">" : "")
  );
}

/**
 * mkQUIC0 — QUIC 0-RTT (Long Header 0xD0-0xD3)
 */
function mkQUIC0(iv) {
  var host = getHost("quic_0rtt");
  var dcid = rnd(8, 20);
  var scid = rnd(0, 20);
  var ticketHint = Math.min(host.length + rnd(4, 16), 48);
  var rLen = Math.min(rnd(30, 120) * iv, 600);

  var getT = (id) => (document.getElementById(id) || { checked: true }).checked;

  var hex = assertEvenHex(
    hexPad(0xd0 | rnd(0, 3), 1) +
      "00000001" +
      hexPad(dcid, 1) +
      rh(dcid) +
      hexPad(scid, 1) +
      rh(scid) +
      rh(4),
    "mkQUIC0",
  );

  return (
    "<b 0x" +
    hex +
    ">" +
    (getT("useTagT") ? "<t>" : "") +
    (getT("useTagR") ? "<r " + rLen + ">" : "") +
    (getT("useTagRC") ? "<rc " + ticketHint + ">" : "") +
    (getT("useTagC") ? "<c>" : "")
  );
}

/**
 * mkTLS — TLS 1.3 Client Hello
 *
 * TLS Record: 16 03 01 [2B recLen] 01 [3B hsLen] 03 03 [32B random]
 *
 * Все числовые поля через hexPad — гарантированно чётные.
 */
function mkTLS(iv) {
  var host = getHost("tls_client_hello");
  var recLen = rnd(300, 550);
  var hsLen = recLen - rnd(4, 9);
  var sniExt = 2 + 2 + 2 + 1 + 2 + host.length;
  var sniRc = Math.min(sniExt, 64);
  var rLen = Math.min(rnd(20, 60) * iv, 300);

  var getT = (id) => (document.getElementById(id) || { checked: true }).checked;

  var hex = assertEvenHex(
    "160301" + // 3B: record type + legacy version
      hexPad(recLen, 2) + // 2B: record length
      "01" + // 1B: handshake type = ClientHello
      hexPad(hsLen, 3) + // 3B: handshake length
      "0303" + // 2B: client_version (TLS 1.2 legacy)
      rh(32), // 32B: client random
    "mkTLS",
  );

  return (
    "<b 0x" +
    hex +
    ">" +
    (getT("useTagRC") ? "<rc " + sniRc + ">" : "") +
    (getT("useTagR") ? "<r " + rLen + ">" : "") +
    (getT("useTagC") ? "<c>" : "") +
    (getT("useTagT") ? "<t>" : "")
  );
}

/**
 * mkNoise — WireGuard Noise_IK Handshake Initiation
 * Разбит на несколько <b> тегов для удобства отображения.
 * rh(n) всегда чётный — каждый тег корректен.
 */
function mkNoise(iv) {
  var rLen = Math.min(rnd(10, 40) * iv, 200);
  var rcLen = rnd(4, 12);
  var getT = (id) => (document.getElementById(id) || { checked: true }).checked;

  return (
    "<b 0x01000000" +
    rh(4) +
    ">" + // type(1) + reserved(3) + sender_index(4)
    "<b 0x" +
    rh(32) +
    ">" + // ephemeral public key
    "<b 0x" +
    rh(48) +
    ">" + // encrypted static
    "<b 0x" +
    rh(28) +
    ">" + // encrypted timestamp
    (getT("useTagR") ? "<r " + rLen + ">" : "") +
    (getT("useTagT") ? "<t>" : "") +
    (getT("useTagRC") ? "<rc " + rcLen + ">" : "")
  );
}

/**
 * mkDTLS — DTLS 1.2 Client Hello
 *
 * DTLS Record:
 *   1B content_type | 2B version=0xFEFD | 2B epoch | 6B seq_num
 *   | 2B length | 1B hs_type | 3B hs_len | 2B msg_seq | 3B frag_offset
 *   | 3B frag_len | 2B dtls_version | 4B epoch+rnd | 32B random
 *
 * epoch через hexPad(epoch, 2) = ровно 4 hex-символа.
 */
function mkDTLS(iv) {
  var host = getHost("dtls");
  var fragLen = rnd(100, 300);
  var sniRc = Math.min(host.length + rnd(2, 8), 60);
  var epoch = rnd(0, 255);
  var rLen = Math.min(rnd(15, 50) * iv, 250);

  var getT = (id) => (document.getElementById(id) || { checked: true }).checked;

  var hex = assertEvenHex(
    "16" + // 1B: content_type = Handshake
      "fefd" + // 2B: version = DTLS 1.2
      hexPad(epoch, 2) + // 2B: epoch  ← hexPad гарантирует 4 символа
      rh(6) + // 6B: sequence number
      hexPad(fragLen, 2) + // 2B: fragment length
      "01" + // 1B: handshake type = ClientHello
      rh(6) + // 3B hs_len + 2B msg_seq + 1B pad
      "fefd0000" + // 2B dtls_version + 2B cookie_len
      rh(4) + // 4B random prefix
      rh(32), // 32B random
    "mkDTLS",
  );

  return (
    "<b 0x" +
    hex +
    ">" +
    (getT("useTagRC") ? "<rc " + sniRc + ">" : "") +
    (getT("useTagC") ? "<c>" : "") +
    (getT("useTagT") ? "<t>" : "") +
    (getT("useTagR") ? "<r " + rLen + ">" : "")
  );
}

/**
 * mkHTTP3 — HTTP/3 over QUIC (QUIC Long Header с расширенным набором типов)
 */
function mkHTTP3(iv) {
  var host = getHost("quic_initial");
  var ptypes = [0xc0, 0xc1, 0xc2, 0xc3, 0xe0, 0xe1, 0xe2];
  var dcid = rnd(8, 20);
  var scid = rnd(0, 20);
  var sniLen = Math.min(host.length + 9 + rnd(0, 6), 64);
  var rLen = Math.min(rnd(30, 100) * iv, 500);

  var getT = (id) => (document.getElementById(id) || { checked: true }).checked;

  var hex = assertEvenHex(
    hexPad(ptypes[rnd(0, ptypes.length - 1)], 1) +
      "00000001" +
      hexPad(dcid, 1) +
      rh(dcid) +
      hexPad(scid, 1) +
      rh(scid) +
      rh(4),
    "mkHTTP3",
  );

  return (
    "<b 0x" +
    hex +
    ">" +
    (getT("useTagRC") ? "<rc " + sniLen + ">" : "") +
    (getT("useTagR") ? "<r " + rLen + ">" : "") +
    (getT("useTagC") ? "<c>" : "") +
    (getT("useTagT") ? "<t>" : "")
  );
}

/**
 * mkSIP — SIP REGISTER request
 *
 * ASCII "REGISTER sip:" = 13 символов = 26 hex (чётное).
 * hostHex: каждый ASCII-символ → 2 hex (всегда чётное).
 * " " (0x20) = 2 hex-символа.
 * rh(4) = 8 hex-символов.
 * Итого: гарантированно чётное.
 */
function mkSIP(iv) {
  var host = getHost("sip");
  var hostHex = "";
  for (var i = 0; i < host.length; i++)
    hostHex += ("0" + host.charCodeAt(i).toString(16)).slice(-2);

  var hex = assertEvenHex(
    "524547495354455220736970" + // "REGISTER sip"
      "3a" + // ":"
      hostHex + // host as ASCII hex
      "20" + // " "
      rh(4), // 4B random suffix
    "mkSIP",
  );

  var rcVal = Math.min(host.length + rnd(8, 24) * iv, 150);
  var rLen = Math.min(rnd(5, 30) * iv, 120);

  var getT = (id) => (document.getElementById(id) || { checked: true }).checked;

  return (
    "<b 0x" +
    hex +
    ">" +
    (getT("useTagRC") ? "<rc " + rcVal + ">" : "") +
    (getT("useTagC") ? "<c>" : "") +
    (getT("useTagT") ? "<t>" : "") +
    (getT("useTagR") ? "<r " + rLen + ">" : "")
  );
}

/**
 * Генерирует пакеты энтропии (I2-I5) с учетом выбранных пользователем тегов.
 * Создает смесь из случайных данных, времени и счетчиков для обхода статистического анализа.
 */
function mkEntropy(idx, iv) {
  var rLen = Math.min(rnd(10, 40) * iv, 300),
    rcLen = rnd(4, 12),
    rdLen = rnd(4, 8);

  var getT = (id) => (document.getElementById(id) || { checked: true }).checked;

  var tags = {
    c: getT("useTagC") ? "<c>" : "",
    t: getT("useTagT") ? "<t>" : "",
    r: getT("useTagR") ? "<r " + rLen + ">" : "",
    rc: getT("useTagRC") ? "<rc " + rcLen + ">" : "",
    rd: getT("useTagRD") ? "<rd " + rdLen + ">" : "",
    b: "",
  };

  if (iv >= 2) {
    tags.b = "<b 0x" + rh(rnd(4, 8 * iv)) + ">";
  }

  // Набор шаблонов для перемешивания тегов
  var p = [
    tags.b + tags.r + tags.t + tags.rc + tags.c + tags.rd,
    tags.c + tags.t + tags.b + tags.r + tags.rc + tags.rd,
    tags.rc + tags.b + tags.r + tags.c + tags.t + tags.rd,
    tags.t + tags.r + tags.c + tags.rc + tags.b + tags.rd,
    tags.r + tags.rc + tags.b + tags.t + tags.c + tags.rd,
  ];

  var res = p[(idx + rnd(0, 4)) % p.length];
  // Если все теги выключены, гарантируем хотя бы минимальный шум
  return res || "<r 10>";
}

/**
 * Главный распределитель для генерации первого пакета (I1).
 * Вызывает специализированную функцию в зависимости от выбранного протокола мимикрии.
 */
function genI1(profile, iv) {
  var m = {
    quic_initial: function () {
      return mkQUICi(iv);
    },
    quic_0rtt: function () {
      return mkQUIC0(iv);
    },
    tls_client_hello: function () {
      return mkTLS(iv);
    },
    wireguard_noise: function () {
      return mkNoise(iv);
    },
    dtls: function () {
      return mkDTLS(iv);
    },
    http3: function () {
      return mkHTTP3(iv);
    },
    sip: function () {
      return mkSIP(iv);
    },
  };
  if (profile === "random") {
    var k = Object.keys(m);
    return genI1(k[rnd(0, k.length - 1)], iv);
  }
  return (m[profile] || m.quic_initial)();
}

/* ── generate config ── */

/**
 * Основная функция сборки конфигурации.
 * Рассчитывает все параметры (H1-H4, S1-S4, Junk, I1-I5) на основе
 * выбранной версии протокола, интенсивности и истории неудачных попыток (iter).
 */
function genCfg() {
  var profile = document.getElementById("quicProfile").value;
  var jc = parseInt(document.getElementById("junkLevel").value);
  var mimicAllElem = document.getElementById("mimicAll");
  var doMimicAll = mimicAllElem && mimicAllElem.checked;
  var imap = { low: 1, medium: 2, high: 3 };
  var boost = iter * 5;
  var iv = imap[inten] + (iter > 3 ? 1 : 0);

  var h1 = rRange(100000000);
  var h2 = rRange(1200000000);
  var h3 = rRange(2400000000);
  var h4 = rRange(3600000000);
  var h1s = 100000000 + rnd(0, 4000000);
  var h2s = 1200000000 + rnd(0, 4000000);
  var h3s = 2400000000 + rnd(0, 4000000);
  var h4s = 3600000000 + rnd(0, 4000000);

  var s1 = Math.min(64, rnd(15, 32) + boost);
  var s2 = Math.min(64, rnd(15, 32) + boost);
  if (s2 === s1 + 56) s2 += 1;
  var s3 = Math.min(64, rnd(8, 24) + boost);
  var s4 = Math.min(32, rnd(6, 18) + boost);
  var jcv = Math.min(10, jc + (inten === "high" ? 2 : 0));
  var jmin = 64 + boost * 2;
  var jmax = Math.min(1024, 256 + iv * 150 + boost * 5);

  return {
    h1,
    h2,
    h3,
    h4,
    h1s,
    h2s,
    h3s,
    h4s,
    s1,
    s2,
    s3,
    s4,
    jc: jcv,
    jmin,
    jmax,
    i1: genI1(profile, iv),
    i2: doMimicAll ? genI1(profile, iv) : mkEntropy(1, iv),
    i3: doMimicAll ? genI1(profile, iv) : mkEntropy(2, iv),
    i4: doMimicAll ? genI1(profile, iv) : mkEntropy(3, iv),
    i5: doMimicAll ? genI1(profile, iv) : mkEntropy(4, iv),
    profile,
  };
}

// ── rendering ─────────────────────────────────────────────────────────────────

var plabs = {
  quic_initial: "QUIC Initial",
  quic_0rtt: "QUIC 0-RTT",
  tls_client_hello: "TLS 1.3",
  wireguard_noise: "Noise_IK",
  dtls: "DTLS 1.3",
  http3: "HTTP/3",
  sip: "SIP",
  random: "Random",
};

/**
 * Отрисовывает сгенерированные параметры в таблицу на странице.
 * Добавляет визуальные эффекты и пояснения к полям.
 */
function renderCfg(p) {
  var tbl = document.getElementById("configTable");
  tbl.classList.add("shimmer");
  setTimeout(function () {
    tbl.classList.remove("shimmer");
  }, 650);
  var pn = plabs[p.profile] || p.profile;
  var html = "";

  if (ver === "2.0") {
    html += sec("DYNAMIC HEADERS H1–H4", [
      ["H1", p.h1, "va", "— Init type (диапазон)"],
      ["H2", p.h2, "va", "— Response type"],
      ["H3", p.h3, "va", "— Cookie Reply"],
      ["H4", p.h4, "va", "— Data type"],
    ]);
    html += sec("PACKET SIZE PREFIXES S1–S4", [
      ["S1", p.s1, "vp", "— Init ≤64 B"],
      [
        "S2",
        p.s2,
        "vp",
        '— Resp ≤64 B <span style="color:var(--text3);font-size:9px">S1+56≠S2 ✓</span>',
      ],
      ["S3", p.s3, "vp", "— Cookie ≤64 B"],
      ["S4", p.s4, "vp", "— Data ≤32 B"],
    ]);
    html += sec("JUNK TRAIN", [
      ["Jc", p.jc, "vb", "— пакетов"],
      ["Jmin", p.jmin, "vb", "— min байт"],
      ["Jmax", p.jmax, "vb", "— max байт"],
    ]);
  } else {
    html += sec("HEADERS H1–H4 (одно значение)", [
      ["H1", p.h1s, "va", ""],
      ["H2", p.h2s, "va", ""],
      ["H3", p.h3s, "va", ""],
      ["H4", p.h4s, "va", ""],
    ]);
    html += sec("PREFIXES S1–S2", [
      ["S1", p.s1, "vp", "≤64 B"],
      [
        "S2",
        p.s2,
        "vp",
        '≤64 B <span style="color:var(--text3);font-size:9px">S1+56≠S2 ✓</span>',
      ],
    ]);
    html += sec("JUNK TRAIN", [
      ["Jc", p.jc, "vb", ""],
      ["Jmin", p.jmin, "vb", ""],
      ["Jmax", p.jmax, "vb", ""],
    ]);
  }

  if (ver !== "1.0") {
    var lbl = "CPS SIGNATURE CHAIN I1–I5";
    if (ver === "1.5")
      lbl +=
        '<span style="color:var(--text3);font-size:9px;margin-left:6px">CLIENT ONLY</span>';
    html +=
      '<div class="psec"><div class="pseclabel">' +
      lbl +
      '<span class="qbadge">✦ ' +
      pn +
      "</span></div>";
    for (var n = 1; n <= 5; n++) {
      var i1 = n === 1;
      html +=
        '<div class="prow" style="animation-delay:' +
        n * 0.04 +
        's">' +
        '<div class="pkey">I' +
        n +
        (i1 ? " ✦" : "") +
        "</div>" +
        '<div class="pval ' +
        (i1 ? "vc" : "vg") +
        '" style="font-size:10.5px">' +
        esc(p["i" + n]) +
        "</div></div>";
    }
    html += "</div>";
  }

  tbl.innerHTML = html;
  renderPrev(p);
}

/** Хелпер для создания HTML-секций в таблице параметров */
function sec(label, rows) {
  var h = '<div class="psec"><div class="pseclabel">' + label + "</div>";
  rows.forEach(function (r, idx) {
    h +=
      '<div class="prow" style="animation-delay:' +
      idx * 0.04 +
      's">' +
      '<div class="pkey">' +
      r[0] +
      "</div>" +
      '<div class="pval ' +
      r[2] +
      '">' +
      r[1] +
      (r[3]
        ? '<span style="color:var(--text3);font-size:10px"> ' + r[3] + "</span>"
        : "") +
      "</div></div>";
  });
  return h + "</div>";
}

/** Экранирует HTML-символы для безопасного вывода CPS-строк */
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Генерирует текстовый блок [Interface] для предпросмотра конфига */
function renderPrev(p) {
  var lines = [];
  lines.push('<span class="cm"># AmneziaWG ' + ver + "</span>");
  lines.push('<span class="cm">[Interface]</span>');
  lines.push(
    '<span class="cm"># PrivateKey = &lt;ключ&gt;  Address = 10.0.0.2/32</span>',
  );
  function kv(k, v) {
    lines.push(
      '<span class="kk">' + k + '</span> = <span class="vv">' + v + "</span>",
    );
  }
  if (ver === "2.0") {
    kv("H1", p.h1);
    kv("H2", p.h2);
    kv("H3", p.h3);
    kv("H4", p.h4);
    kv("S1", p.s1);
    kv("S2", p.s2);
    kv("S3", p.s3);
    kv("S4", p.s4);
    kv("Jc", p.jc);
    kv("Jmin", p.jmin);
    kv("Jmax", p.jmax);
    kv("I1", esc(p.i1));
    kv("I2", esc(p.i2));
    kv("I3", esc(p.i3));
    kv("I4", esc(p.i4));
    kv("I5", esc(p.i5));
  } else if (ver === "1.5") {
    kv("H1", p.h1s);
    kv("H2", p.h2s);
    kv("H3", p.h3s);
    kv("H4", p.h4s);
    kv("S1", p.s1);
    kv("S2", p.s2);
    kv("Jc", p.jc);
    kv("Jmin", p.jmin);
    kv("Jmax", p.jmax);
    lines.push('<span class="cm"># I1-I5 только клиент (AWG 1.5):</span>');
    kv("I1", esc(p.i1));
    kv("I2", esc(p.i2));
    kv("I3", esc(p.i3));
    kv("I4", esc(p.i4));
    kv("I5", esc(p.i5));
  } else {
    kv("H1", p.h1s);
    kv("H2", p.h2s);
    kv("H3", p.h3s);
    kv("H4", p.h4s);
    kv("S1", p.s1);
    kv("S2", p.s2);
    kv("Jc", p.jc);
    kv("Jmin", p.jmin);
    kv("Jmax", p.jmax);
    lines.push('<span class="cm"># I1-I5 не поддерживаются в AWG 1.0</span>');
  }
  document.getElementById("previewCode").innerHTML = lines.join("\n");
}

/** Формирует финальный текст конфигурационного файла для копирования или скачивания */
function getPlain(p) {
  var l = [
    "# AmneziaWG " + ver,
    "[Interface]",
    "# PrivateKey = <ключ>",
    "# Address = 10.0.0.2/32",
  ];
  if (ver === "2.0") {
    l.push("H1 = " + p.h1, "H2 = " + p.h2, "H3 = " + p.h3, "H4 = " + p.h4);
    l.push("S1 = " + p.s1, "S2 = " + p.s2, "S3 = " + p.s3, "S4 = " + p.s4);
    l.push("Jc = " + p.jc, "Jmin = " + p.jmin, "Jmax = " + p.jmax);
    l.push(
      "I1 = " + p.i1,
      "I2 = " + p.i2,
      "I3 = " + p.i3,
      "I4 = " + p.i4,
      "I5 = " + p.i5,
    );
  } else if (ver === "1.5") {
    l.push("H1 = " + p.h1s, "H2 = " + p.h2s, "H3 = " + p.h3s, "H4 = " + p.h4s);
    l.push(
      "S1 = " + p.s1,
      "S2 = " + p.s2,
      "Jc = " + p.jc,
      "Jmin = " + p.jmin,
      "Jmax = " + p.jmax,
    );
    l.push(
      "# I1-I5 только клиент:",
      "I1 = " + p.i1,
      "I2 = " + p.i2,
      "I3 = " + p.i3,
      "I4 = " + p.i4,
      "I5 = " + p.i5,
    );
  } else {
    l.push("H1 = " + p.h1s, "H2 = " + p.h2s, "H3 = " + p.h3s, "H4 = " + p.h4s);
    l.push(
      "S1 = " + p.s1,
      "S2 = " + p.s2,
      "Jc = " + p.jc,
      "Jmin = " + p.jmin,
      "Jmax = " + p.jmax,
    );
  }
  return l.join("\n");
}

// ── actions ───────────────────────────────────────────────────────────────────

function generate() {
  cp = genCfg();
  renderCfg(cp);
  var s = document.getElementById("quicProfile");
  var wrap = document.getElementById("customHostWrap");
  var hint = document.getElementById("customHostHint");
  var noHost = s.value === "wireguard_noise";
  if (wrap) {
    if (!noHost) wrap.classList.add("show");
    else wrap.classList.remove("show");
  }
  if (hint) {
    var hintMap = {
      quic_initial: "QUIC-capable: fastly.net, cdn-apple.com, yastatic.net …",
      quic_0rtt: "QUIC 0-RTT: fastly.net, s3.amazonaws.com, yastatic.net …",
      tls_client_hello: "Любой HTTPS-хост: vk.com, github.com, ozon.ru …",
      dtls: "STUN/TURN-сервер: stun.yandex.net, stun.jit.si …",
      http3: "HTTP/3-хост: fastly.net, cdn.gcore.com, yandex.net …",
      sip: "SIP-регистратор: sip.zadarma.com, sip.linphone.org …",
      random:
        "Пул выбирается по случайному профилю (опционально укажите свой хост)",
    };
    hint.textContent = hintMap[s.value] || "";
  }
  var input = document.getElementById("customHost");
  if (input) {
    var phMap = {
      quic_initial: "Хост с QUIC (напр., fastly.net)",
      quic_0rtt: "Хост с QUIC 0-RTT (напр., cdn-apple.com)",
      tls_client_hello: "Любой домен (напр., github.com)",
      dtls: "STUN/TURN-хост (напр., stun.jit.si)",
      http3: "HTTP/3-домен (напр., vk.com)",
      sip: "SIP-сервер (напр., sip.zadarma.com)",
      random: "Свой домен (опционально)",
    };
    input.placeholder = phMap[s.value] || "Свой домен";
  }
  addLog("✦ Сгенерирован — " + s.options[s.selectedIndex].text, "info");
}

function setVersion(v, btn) {
  ver = v;
  document.querySelectorAll(".tab-btn").forEach(function (b) {
    b.classList.remove("active");
  });
  btn.classList.add("active");
  if (cp) renderCfg(cp);
}

function setIntensity(level) {
  inten = level;
  var map = { low: "al", medium: "am", high: "ah" };
  ["low", "medium", "high"].forEach(function (l) {
    var b = document.getElementById("i" + l.slice(0, 3));
    b.className = "int-b";
    if (l === level) b.classList.add(map[l]);
  });
  document.getElementById("modeLabel").textContent = level.toUpperCase();
  if (cp) generate();
}

function feedback(ok) {
  if (ok) {
    addLog("✓ Конфигурация подтверждена!", "ok");
    iter = 0;
  } else {
    iter++;
    generate();
    addLog(
      iter > 3
        ? "✗ Попытка " + iter + ": HIGH режим, максимальная обфускация..."
        : "✗ Попытка " + iter + ": перегенерация, усиленные параметры",
      "bad",
    );
  }
  updateIter();
}

function updateIter() {
  document.getElementById("iterCount").textContent = iter;
  for (var d = 0; d < 5; d++) {
    var dot = document.getElementById("d" + d);
    dot.className = "idot";
    if (d < iter) dot.classList.add(iter > 3 ? "fh" : "fi");
  }
}

function addLog(msg, type) {
  var log = document.getElementById("statusLog");
  var e = document.createElement("div");
  e.className = "logent log-" + type;
  e.textContent = msg;
  log.insertBefore(e, log.firstChild);
  while (log.children.length > 4) log.removeChild(log.lastChild);
}

function copyConfig() {
  if (!cp) {
    addLog("⚠ Сначала сгенерируйте конфиг", "bad");
    return;
  }
  var text = getPlain(cp);
  var btn = document.getElementById("copyBtn");
  function done() {
    btn.textContent = "✓ Скопировано!";
    btn.classList.add("copied");
    setTimeout(function () {
      btn.textContent = "📋 Копировать";
      btn.classList.remove("copied");
    }, 2000);
  }
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(done).catch(fb);
  } else {
    fb();
  }
  function fb() {
    var ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    done();
  }
}

function downloadConfig() {
  if (!cp) {
    addLog("⚠ Сначала сгенерируйте конфиг", "bad");
    return;
  }
  var blob = new Blob([getPlain(cp)], { type: "text/plain" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "amneziawg-" + ver + "-" + Date.now() + ".conf";
  a.click();
  URL.revokeObjectURL(url);
}

function toggleFaq(head) {
  head.parentElement.classList.toggle("open");
}

window.addEventListener("DOMContentLoaded", function () {
  generate();
});
