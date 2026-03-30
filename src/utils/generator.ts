/**
 * AmneziaWG Architect — Core Generator (TypeScript)
 *
 * Полный порт логики старого script.js. Содержит:
 *   - Пулы хостов (hostPools) для всех протоколов мимикрии
 *   - BFP — таблицы реальных размеров пакетов по браузерам
 *   - Утилиты: rnd, rh, hexPad, assertEvenHex, rRange, splitPad, calcPadding
 *   - Генераторы I1: mkQUICi, mkQUIC0, mkTLS, mkNoise, mkDTLS, mkHTTP3, mkSIP
 *   - mkEntropy — энтропийные пакеты I2–I5
 *   - genI1, genCfg — точки входа генерации
 *
 * Не содержит DOM-зависимостей. Все входные параметры передаются через GeneratorInput.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Типы
// ─────────────────────────────────────────────────────────────────────────────

export type AWGVersion = "1.0" | "1.5" | "2.0";
export type Intensity = "low" | "medium" | "high";
export type MimicProfile =
  | "quic_initial"
  | "quic_0rtt"
  | "tls_client_hello"
  | "wireguard_noise"
  | "dtls"
  | "http3"
  | "sip"
  | "tls_to_quic"
  | "quic_burst"
  | "random";

export type BrowserProfile =
  | "chrome"
  | "edge"
  | "firefox"
  | "safari"
  | "yandex_desktop"
  | "yandex_mobile"
  | "";

export type BfpSlot = "qi" | "q0" | "h3" | "tls" | "nx" | "dtls";

/** Входные параметры генератора — всё что раньше читалось из DOM */
export interface GeneratorInput {
  version: AWGVersion;
  intensity: Intensity;
  profile: MimicProfile;
  customHost: string;
  mimicAll: boolean;

  useTagC: boolean;
  useTagT: boolean;
  useTagR: boolean;
  useTagRC: boolean;
  useTagRD: boolean;

  useBrowserFp: boolean;
  browserProfile: BrowserProfile;
  mtu: number;
  junkLevel: number;

  /** Счётчик неудачных попыток (для автоматического усиления) */
  iterCount: number;

  /** Режим роутера: минимальные шумы для слабых устройств (NanoPi, Keenetic, OpenWrt) */
  routerMode: boolean;
}

/** Итоговая конфигурация AWG */
export interface AWGConfig {
  // Версия (для корректного рендера)
  version: AWGVersion;
  profile: MimicProfile;

  // Dynamic headers (AWG 2.0 — диапазоны; 1.x — одиночные значения)
  h1: string;
  h2: string;
  h3: string;
  h4: string;

  // Одиночные значения заголовков (AWG 1.x)
  h1s: number;
  h2s: number;
  h3s: number;
  h4s: number;

  // Packet size prefixes
  s1: number;
  s2: number;
  s3: number;
  s4: number;

  // Junk train
  jc: number;
  jmin: number;
  jmax: number;

  // CPS signature chain
  i1: string;
  i2: string;
  i3: string;
  i4: string;
  i5: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Константы
// ─────────────────────────────────────────────────────────────────────────────

export const YANDEX_UNSTABLE_PROFILES: BrowserProfile[] = [
  "yandex_desktop",
  "yandex_mobile",
];

export const PROFILE_LABELS: Record<MimicProfile, string> = {
  quic_initial: "QUIC Initial",
  quic_0rtt: "QUIC 0-RTT",
  tls_client_hello: "TLS 1.3",
  wireguard_noise: "Noise_IK",
  dtls: "DTLS 1.3",
  http3: "HTTP/3",
  sip: "SIP",
  tls_to_quic: "TLS → QUIC",
  quic_burst: "QUIC Burst",
  random: "Random",
};

// ─────────────────────────────────────────────────────────────────────────────
// Пулы хостов
// ─────────────────────────────────────────────────────────────────────────────

/**
 * hostPools — пулы доменов для каждого профиля мимикрии.
 *
 * Критерии отбора:
 *   1. Поддержка нужного протокола (QUIC/HTTP3, TLS1.3, DTLS/STUN, SIP)
 *   2. Доступность из России на Q1 2026 — не в блок-листах РКН/ТСПУ
 *   3. Достаточно крупный трафик: блокировка причиняет экономический ущерб
 *
 * Исключены (заблокированы в РФ на март 2026):
 *   YouTube, Cloudflare CDN, Discord, Facebook/Meta, Instagram,
 *   WhatsApp (с 11.02.2026), LinkedIn, Twitter/X,
 *   Google STUN (74.125.x.x / 172.217.x.x перекрываются с YouTube),
 *   Telegram CDN (троттлится ≈10%, ожидается полная блокировка)
 */
export const hostPools: Record<string, string[]> = {
  // ── QUIC Initial (RFC 9000, Long Header 0xC0–0xC3, UDP 443) ──────────────
  // Хосты с подтверждённой поддержкой HTTP/3 по UDP/443, доступные из России.
  quic_initial: [
    // 🟢 RU-domestic CDN & порталы
    "yandex.net",
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
    "rt.ru",
    "sber.ru",
    "sberbank.ru",
    "sbp.ru",
    "tbank.ru",
    "raiffeisen.ru",
    "vtb.ru",
    "alfabank.ru",
    "gazprombank.ru",
    "sovcombank.ru",
    "rosbank.ru",
    "kaspersky.ru",
    "kaspersky.com",
    "drweb.ru",
    "selectel.ru",
    "selectel.com",
    "timeweb.cloud",
    "timeweb.com",
    "reg.ru",
    "beget.com",
    "mchost.ru",
    "nic.ru",
    "dataline.ru",
    "mts.ru",
    "beeline.ru",
    "megafon.ru",
    "rostelecom.ru",
    "tele2.ru",
    "mvideo.ru",
    "eldorado.ru",
    "dns-shop.ru",
    "citilink.ru",
    "lamoda.ru",
    "sportmaster.ru",
    "detmir.ru",
    "sbermegamarket.ru",
    // 🟢 Государственные — абсолютно незаблокируемые
    "gosuslugi.ru",
    "mos.ru",
    "nalog.ru",
    "pfr.gov.ru",
    "cbr.ru",
    "roscosmos.ru",
    // 🟢 RU VOD & ТВ
    "premier.one",
    "okko.tv",
    "more.tv",
    "1tv.ru",
    "ntv.ru",
    "russia.tv",
    // 🟢 RU новости & разное
    "rbc.ru",
    "tass.ru",
    "ria.ru",
    "gazeta.ru",
    "lenta.ru",
    "hh.ru",
    "superjob.ru",
    "2gis.ru",
    "championat.com",
    "sports.ru",
    "rambler.ru",
    "livejournal.com",
    // 🔵 CDN-инфраструктура (банки/госструктуры зависят — блокировка маловероятна)
    "gcore.com",
    "api.gcore.com",
    "cdn.gcore.com",
    "g.gcdn.co",
    "gcdn.co",
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
    "akamaiedge.net",
    "akamaihd.net",
    "akamaistream.net",
    "edgekey.net",
    "akam.net",
    "cloudfront.net",
    "d1.awsstatic.com",
    "d2.awsstatic.com",
    "s3.amazonaws.com",
    "msedge.net",
    "cdn.office.net",
    "azureedge.net",
    "azure.microsoft.com",
    "live.com",
    "outlook.com",
    "office.com",
    "hotmail.com",
    "microsoft.com",
    "xbox.com",
    "xboxlive.com",
    "onedrive.live.com",
    "trafficmanager.net",
    "icloud.com",
    "cdn-apple.com",
    "mzstatic.com",
    "apple.com",
    "appleid.apple.com",
    "limelight.com",
    "llnwd.net",
    "edg.io",
    "highwinds.com",
    "stackpathdns.com",
    "cachefly.net",
    "imperva.com",
    // 🟡 Tech-neutral
    "github.com",
    "objects.githubusercontent.com",
    "raw.githubusercontent.com",
    "codeload.github.com",
    "github.githubassets.com",
    "avatars.githubusercontent.com",
    "releases.githubusercontent.com",
    "gitlab.com",
    "cdn.jsdelivr.net",
    "unpkg.com",
    "registry.npmjs.org",
    "pypi.org",
    "files.pythonhosted.org",
    "archive.ubuntu.com",
    "security.ubuntu.com",
    "deb.debian.org",
    "steamstatic.com",
    "steamcontent.com",
    "steampowered.com",
    "epicgames.com",
    "ea.com",
    "battle.net",
    "blizzard.com",
    "ubisoft.com",
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
    "hetzner.com",
    "hetzner.de",
    "hetzner.cloud",
    "your-server.de",
    "ovhcloud.com",
    "ovh.net",
    "ovh.com",
    "digitalocean.com",
    "dropbox.com",
    "dropboxstatic.com",
    "dropboxapi.com",
    "notion.so",
    "notionusercontent.com",
    "zoom.us",
    "valve.net",
    "linode.com",
    // 🟠 Asian CDN / cloud
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
    "bdstatic.com",
    "bceloss.com",
  ],

  // ── QUIC 0-RTT (Early Data, Long Header 0xD0–0xD3, UDP 443) ─────────────
  // Только CDN/сервисы с подтверждённой поддержкой 0-RTT / QUIC session tickets.
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
    "tbank.ru",
    "alfabank.ru",
    "gosuslugi.ru",
    // 🔵 CDN-infra (подтверждён 0-RTT)
    "gcore.com",
    "cdn.gcore.com",
    "g.gcdn.co",
    "gcdn.co",
    "bunny.net",
    "b-cdn.net",
    "cdn77.com",
    "fastly.net",
    "a.ssl.fastly.net",
    "global.fastly.net",
    // CloudFront: 0-RTT через TLS 1.3 session tickets
    "cloudfront.net",
    "s3.amazonaws.com",
    "d1.awsstatic.com",
    "msedge.net",
    "cdn.office.net",
    "live.com",
    "office.com",
    "xbox.com",
    // Apple: 0-RTT подтверждён в iOS 17+
    "icloud.com",
    "cdn-apple.com",
    "mzstatic.com",
    "akamaiedge.net",
    "akamaihd.net",
    "edgekey.net",
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
    "bdstatic.com",
  ],

  // ── TLS 1.3 Client Hello (TCP 443) ───────────────────────────────────────
  // Широкий пул — TLS используется практически везде.
  tls_client_hello: [
    // 🟢 RU-domestic: топ российских сайтов
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
    "5-tv.ru",
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
    "otkritie.ru",
    "rshb.ru",
    "pochtabank.ru",
    "bspb.ru",
    "kaspersky.ru",
    "kaspersky.com",
    "drweb.ru",
    "drweb.com",
    "roscosmos.ru",
    "gosuslugi.ru",
    "mos.ru",
    "nalog.ru",
    "pfr.gov.ru",
    "cbr.ru",
    "esia.gosuslugi.ru",
    "epgu.gosuslugi.ru",
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
    "spaceweb.ru",
    "sweb.ru",
    "ihc.ru",
    "fastvps.ru",
    "citilink.ru",
    "mvideo.ru",
    "sbermegamarket.ru",
    "lamoda.ru",
    "eldorado.ru",
    "detmir.ru",
    "sportmaster.ru",
    "letoile.ru",
    "dns-shop.ru",
    "technopark.ru",
    "nix.ru",
    "aliexpress.ru",
    "joom.com",
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
    "kp.ru",
    "mk.ru",
    "izvestia.ru",
    "iz.ru",
    "vedomosti.ru",
    "2gis.ru",
    "maps.yandex.ru",
    "championat.com",
    "sports.ru",
    "matchtv.ru",
    "livejournal.com",
    "pikabu.ru",
    "habr.com",
    "vc.ru",
    "spark.ru",
    "ruvds.com",
    "vdsina.ru",
    "gcorelabs.com",
    // 🔵 CDN-инфраструктура
    "gcore.com",
    "api.gcore.com",
    "cdn.gcore.com",
    "g.gcdn.co",
    "gcdn.co",
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
    "trafficmanager.net",
    "icloud.com",
    "cdn-apple.com",
    "mzstatic.com",
    "apple.com",
    "appleid.apple.com",
    "limelight.com",
    "llnwd.net",
    "edg.io",
    "stackpathdns.com",
    "cachefly.net",
    "imperva.com",
    "incapsula.com",
    "sucuri.net",
    // 🟡 Tech-neutral
    "github.com",
    "objects.githubusercontent.com",
    "raw.githubusercontent.com",
    "codeload.github.com",
    "github.githubassets.com",
    "avatars.githubusercontent.com",
    "releases.githubusercontent.com",
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
    "alpinelinux.org",
    "archlinux.org",
    "centos.org",
    "fedoraproject.org",
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
    "digitalocean.com",
    "do.co",
    "linode.com",
    "vultr.com",
    "dropbox.com",
    "dropboxstatic.com",
    "dropboxapi.com",
    "notion.so",
    "notionusercontent.com",
    "zoom.us",
    "zmtr.cn",
    "docker.com",
    "hub.docker.com",
    "registry-1.docker.io",
    "quay.io",
    "ghcr.io",
    "jetbrains.com",
    "plugins.jetbrains.com",
    "download.jetbrains.com",
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
    "bdstatic.com",
    "bceloss.com",
  ],

  // ── DTLS 1.3 (WebRTC STUN/TURN) ─────────────────────────────────────────
  // ⚠ ИСКЛЮЧЕНО: stun.l.google.com — IP 74.125.x.x/172.217.x.x заблокированы ТСПУ
  // ⚠ ИСКЛЮЧЕНО: stun.cloudflare.com — Cloudflare заблокирован в РФ
  // ⚠ ИСКЛЮЧЕНО: stun/turn.telegram.org — Telegram CDN троттлится
  dtls: [
    // 🟢 RU-domestic STUN/TURN
    "turn.yandex.net",
    "stun.yandex.net",
    "stun1.yandex.net",
    "telemost.yandex.ru",
    "turn.vk.com",
    "stun.vk.com",
    "stun1.vk.com",
    "rtc.vk.com",
    "stun.mail.ru",
    "turn.mail.ru",
    "stun.sipnet.ru",
    "stun.sipnet.net",
    "stun.zadarma.com",
    "turn.zadarma.com",
    "stun.zepter.ru",
    "stun.mango-office.ru",
    "stun.beeline.ru",
    "stun.mts.ru",
    "stun.megafon.ru",
    "stun.rostelecom.ru",
    "stun.tele2.ru",
    "stun.sber.ru",
    // 🔵 Публичные STUN-серверы (не заблокированы в РФ)
    "stun.stunprotocol.org",
    "stunserver.stunprotocol.org",
    "stun.voip.ipp2p.com",
    "stun.voipstunt.com",
    "stun.voipbuster.com",
    "stun.voipwise.com",
    "stun.voiptia.net",
    "stun.voxox.com",
    "stun.voxgratia.org",
    "stun.voys.nl",
    "stun.voztele.com",
    "stun.voipzoom.com",
    "stun.vopium.com",
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
    "stun.yesss.at",
    "stun.zoiper.com",
    "stun01.sipphone.com",
    "stun1.faktortel.com.au",
    "stun.noc.ams-ix.net",
    "stun.xtratelecom.es",
    "stun.wifirst.net",
    "stun.whoi.edu",
    "stun.zadv.com",
    "stun.zentauron.de",
    "stun.voztovoice.org",
    "stun1.voiceeclipse.net",
    "stun.f.haeder.net",
    // 🟡 Open-source WebRTC
    "meet.jit.si",
    "stun.jit.si",
    "turn.jit.si",
    "8x8.vc",
    "stun.services.mozilla.com",
    "turn.matrix.org",
    "stun.matrix.org",
    "stun.nextcloud.com",
    "turn.nextcloud.com",
    "janus.conf.meetecho.com",
    "stun.meetecho.com",
    // 🟡 Commercial VoIP STUN
    "global.stun.twilio.com",
    "stun.us1.twilio.com",
    "stun.ie1.twilio.com",
    "stun.au1.twilio.com",
    "stun.us2.twilio.com",
    "stun.nexmo.com",
    "stun.vonage.com",
    "global.stun.bandwidth.com",
    "stun.plivo.com",
    "stun.signalwire.com",
    "stun.livekit.cloud",
    "stun.metered.ca",
    // 🟠 TURN-реле (бесплатные тиры)
    "openrelay.metered.ca",
    "coturn.net",
    "freestun.net",
    "relay.webwormhole.io",
    "expressturn.com",
  ],

  // ── SIP REGISTER (UDP 5060 / TLS 5061) ───────────────────────────────────
  sip: [
    // 🟢 RU-операторы (SIP trunks, обязаны работать по закону)
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
    "voip.mtt.ru",
    // 🟢 RU SIP / cloud PBX провайдеры
    "sip.vk.com",
    "sip.yandex.ru",
    "sip.mail.ru",
    "voip.sberbank.ru",
    "sip.vats.sber.ru",
    "sip.tbank.ru",
    "sip.sipnet.ru",
    "sip.sipnet.net",
    "sip2.sipnet.ru",
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
    "pbx.rt.ru",
    "sip.telfin.ru",
    "sip.uiscom.ru",
    "sip.voxlink.ru",
    "sip.datafox.ru",
    "sip.sipmarket.net",
    "sip.ngs.ru",
    "sip.kolabora.com",
    "sip.sipuni.com",
    "sip.voximplant.com",
    "sip.exolve.ru",
    "sip.dialpad.ru",
    "sip.oblako.ru",
    "pbx.onlinesim.ru",
    "sip.onlinesim.ru",
    "sip.iptel.org",
    // 🟡 Международные SIP (доступны из РФ)
    "sip2sip.info",
    "sip.linphone.org",
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
    "sip.kamailio.org",
    "sip.opensips.org",
    "sip.freeswitch.org",
    // 🟠 Enterprise / cloud PBX (EU/US)
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
    "sip.livekit.cloud",
    "sip.dialpad.com",
    "sip.aircall.io",
    "sip.3cx.com",
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Browser Fingerprint (BFP) — таблицы реальных размеров UDP payload
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Источники: RFC 9000 §14.1, Chromium quiche, замеры перехваченного трафика.
 *
 * Слоты:
 *   qi   — QUIC Initial (Long Header 0xC0–0xC3)
 *           Chrome/Edge: 1250 фиксированно (PADDING frame)
 *           Firefox: 1200–1252 (адаптивный, минимум RFC 9000 §14.1)
 *           Safari: 1250 или 1252 (iOS 15+)
 *
 *   q0   — QUIC 0-RTT Early Data (Long Header 0xD0–0xD3)
 *           Зависит от данных запроса; выравнивается до ~1250 или растёт до MTU.
 *
 *   h3   — HTTP/3 DATA-пакеты после хендшейка
 *           Браузеры заполняют до MTU: ~1350 байт
 *           (1500 − 20 IP − 8 UDP − ~122 QUIC/TLS overhead).
 *
 *   tls  — TLS 1.3 Client Hello ("голый" TLS поверх TCP)
 *           512–800 байт; Chrome выравнивает до кратного 128 (padding ext 0x0015).
 *
 *   nx   — WireGuard Noise_IK Initiation
 *           Строго 148 байт без padding. При включённом fp добивается до 1200–1250.
 *
 *   dtls — DTLS 1.2/1.3 Client Hello (WebRTC)
 *           Браузеры держат < 1200 байт — исключают IP-фрагментацию.
 *
 * Формат: [min, max] байт UDP payload (без UDP/IP заголовков).
 */
type BfpTable = Record<BfpSlot, [number, number]>;

export const BFP: Record<string, BfpTable> = {
  chrome: {
    qi: [1250, 1250],
    q0: [1250, 1350],
    h3: [1250, 1350],
    tls: [512, 800],
    nx: [1200, 1250],
    dtls: [1100, 1200],
  },
  edge: {
    qi: [1250, 1250],
    q0: [1250, 1350],
    h3: [1250, 1350],
    tls: [512, 800],
    nx: [1200, 1250],
    dtls: [1100, 1200],
  },
  firefox: {
    qi: [1200, 1252],
    q0: [1200, 1300],
    h3: [1200, 1350],
    tls: [512, 700],
    nx: [1200, 1250],
    dtls: [1050, 1200],
  },
  safari: {
    qi: [1250, 1252],
    q0: [1250, 1300],
    h3: [1250, 1350],
    tls: [512, 750],
    nx: [1200, 1250],
    dtls: [1100, 1200],
  },
  // ⚠ Нестабильный профиль — параметры получены эмпирически.
  // Яндекс Браузер основан на Chromium/quiche с оптимизациями под RU-инфраструктуру.
  // Desktop: QUIC Initial = 1250 (как Chromium), DATA → максимум MTU.
  yandex_desktop: {
    qi: [1250, 1250],
    q0: [1250, 1350],
    h3: [1350, 1350],
    tls: [512, 800],
    nx: [1200, 1250],
    dtls: [1100, 1200],
  },
  // Mobile: QUIC Initial = 1232 (кратно 16, удобно для AES в Turbo-режиме).
  yandex_mobile: {
    qi: [1232, 1232],
    q0: [1250, 1350],
    h3: [1350, 1350],
    tls: [512, 800],
    nx: [1200, 1250],
    dtls: [1100, 1200],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Утилиты (чистые функции, без DOM)
// ─────────────────────────────────────────────────────────────────────────────

/** Случайное целое из диапазона [a, b] включительно */
export function rnd(a: number, b: number): number {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

/**
 * rh(n) — n байт случайного hex.
 * Всегда возвращает строку длиной ровно n*2 символов (чётная).
 */
export function rh(n: number): string {
  const bytes = Math.max(0, Math.floor(n));
  let s = "";
  for (let i = 0; i < bytes; i++) {
    s += ("0" + Math.floor(Math.random() * 256).toString(16)).slice(-2);
  }
  return s;
}

/**
 * hexPad(value, byteLen) — число → hex ровно byteLen байт (byteLen*2 символов).
 * Безопаснее голого .toString(16) — гарантирует чётную длину.
 */
export function hexPad(value: number, byteLen: number): string {
  let hex = Math.floor(value).toString(16);
  while (hex.length < byteLen * 2) hex = "0" + hex;
  return hex.slice(-(byteLen * 2));
}

/**
 * assertEvenHex — страховка: если hex нечётный, дополняем нулём и логируем.
 * При корректном использовании hexPad/rh эта ветка не должна срабатывать.
 */
export function assertEvenHex(hex: string, label = "?"): string {
  if (hex.length % 2 !== 0) {
    console.warn(`[AWG] odd hex in ${label} len=${hex.length}`);
    return hex + "0";
  }
  return hex;
}

/**
 * rRange(base, spread?) — генерирует строку-диапазон "start-end" для H1–H4.
 * AmneziaWG принимает диапазон вида "100000000-150000000".
 */
export function rRange(base: number, spread = 500_000): string {
  const s = base + rnd(0, spread);
  return `${s}-${s + rnd(1000, 50_000)}`;
}

/**
 * splitPad(n, tag?) — разбивает N байт паддинга на CPS-теги,
 * соблюдая лимит AmneziaWG: не более 1000 байт на один тег <r>/<rc>/<rd>.
 *
 * Примеры:
 *   splitPad(1200)       → "<r 1000><r 200>"
 *   splitPad(2500)       → "<r 1000><r 1000><r 500>"
 *   splitPad(64, 'rc')   → "<rc 64>"
 *   splitPad(0)          → ""
 */
export function splitPad(n: number, tag: "r" | "rc" | "rd" = "r"): string {
  n = Math.max(0, Math.floor(n));
  if (n === 0) return "";
  let out = "";
  while (n > 1000) {
    out += `<${tag} 1000>`;
    n -= 1000;
  }
  out += `<${tag} ${n}>`;
  return out;
}

/**
 * tagOverhead(useC, useT) — суммарный фиксированный вес служебных тегов.
 *   <c> = 4 байта (32-bit counter, network byte order)
 *   <t> = 4 байта (32-bit unix timestamp, network byte order)
 */
export function tagOverhead(useC: boolean, useT: boolean): number {
  return (useC ? 4 : 0) + (useT ? 4 : 0);
}

/**
 * calcPadding — вычисляет размер паддинга в байтах.
 *
 * @param headerB  — байты, занятые тегом <b 0x...>
 * @param extraB   — байты от других фиксированных тегов (<rc N> и т.п.)
 * @param range    — [min, max] из BFP или null (fallback)
 * @param iv       — intensity value [1..3+] (используется если range=null)
 * @param mtu      — MTU интерфейса (ограничивает максимум)
 *
 * Если range задан: добивает occupied до min, с jitter до max, но ≤ MTU.
 * Если range null: энтропийный размер (20–80 * iv, но ≤ 500 и ≤ MTU).
 *
 * Возвращаемое значение может превышать 1000 — используй splitPad() при рендере.
 */
export function calcPadding(
  headerB: number,
  extraB: number,
  range: [number, number] | null,
  iv: number,
  mtu: number,
): number {
  const maxPad = Math.max(0, mtu - headerB - extraB);

  if (!range) {
    return Math.min(rnd(20, 80) * iv, 500, maxPad);
  }

  const occupied = headerB + extraB;
  const [min, max] = range;
  const clampedMin = Math.min(min, mtu);
  const clampedMax = Math.min(max, mtu);
  const needed = Math.max(0, clampedMin - occupied);
  const jitter = Math.max(
    0,
    Math.min(clampedMax - clampedMin, clampedMax - occupied - needed, 20),
  );
  const pad = needed + (jitter > 0 ? rnd(0, jitter) : 0);
  return Math.min(pad, maxPad);
}

/**
 * alignTo128(n) — выравнивает размер TLS ClientHello до кратного 128 байт,
 * как это делает Chrome/Chromium для скрытия набора TLS-расширений.
 */
export function alignTo128(n: number): number {
  return Math.ceil(n / 128) * 128;
}

// ─────────────────────────────────────────────────────────────────────────────
// Вспомогательные функции доступа к данным
// ─────────────────────────────────────────────────────────────────────────────

function getHost(input: GeneratorInput, poolKey: string): string {
  if (input.customHost.trim()) return input.customHost.trim();
  const pool = hostPools[poolKey] ?? hostPools.tls_client_hello;
  return pool[rnd(0, pool.length - 1)];
}

function getFpRange(
  input: GeneratorInput,
  slot: BfpSlot,
): [number, number] | null {
  if (!input.useBrowserFp || !input.browserProfile) return null;
  const table = BFP[input.browserProfile];
  return table?.[slot] ?? null;
}

const CHROMIUM_PROFILES = new Set([
  "chrome",
  "edge",
  "yandex_desktop",
  "yandex_mobile",
]);

// ─────────────────────────────────────────────────────────────────────────────
// Генераторы протоколов (I1)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * mkQUICi — QUIC Initial (RFC 9000, Long Header 0xC0–0xC3)
 *
 * Long Header layout:
 *   1B  flags       0xC0 | version_bits
 *   4B  version     0x00000001
 *   1B  dcid_len    (8–20)
 *   N   dcid
 *   1B  scid_len    (0–20)
 *   M   scid
 *   1B  token_len   (0 или 8–32)
 *   K   token
 *   4B  reserved/PN
 *
 * Браузерный padding (RFC 9000 §14.1):
 *   Chrome/Edge → 1250 байт фиксированно
 *   Firefox     → 1200–1252 байт (адаптивный)
 *   Safari      → 1250–1252 байт
 */
function mkQUICi(input: GeneratorInput, iv: number): string {
  const host = getHost(input, "quic_initial");
  const dcid = rnd(8, 20);
  const scid = rnd(0, 20);
  const tokenLen = rnd(0, 1) === 0 ? 0 : rnd(8, 32);
  const sniRc = Math.min(host.length + rnd(0, 6), 64);

  const hex = assertEvenHex(
    hexPad(0xc0 | rnd(0, 3), 1) + // 1B  flags
      "00000001" + // 4B  version = 1
      hexPad(dcid, 1) + // 1B  DCID length
      rh(dcid) + // N   DCID
      hexPad(scid, 1) + // 1B  SCID length
      rh(scid) + // M   SCID
      hexPad(tokenLen, 1) + // 1B  token length
      rh(tokenLen) + // K   token
      rh(4), // 4B  reserved / Packet Number
    "mkQUICi",
  );

  const mtu = input.mtu;
  const headerB = hex.length / 2;
  const extraB =
    (input.useTagRC ? sniRc : 0) + tagOverhead(input.useTagC, input.useTagT);
  const pad = calcPadding(headerB, extraB, getFpRange(input, "qi"), iv, mtu);

  return (
    `<b 0x${hex}>` +
    (input.useTagRC ? `<rc ${sniRc}>` : "") +
    (input.useTagC ? "<c>" : "") +
    (input.useTagT ? "<t>" : "") +
    (input.useTagR ? splitPad(pad) : "")
  );
}

/**
 * mkQUIC0 — QUIC 0-RTT Early Data (Long Header 0xD0–0xD3)
 *
 * Размер вариативен: зависит от данных запроса (обычно GET + заголовки).
 * Браузеры выравнивают по той же 1250-байтной границе или растут до ~1350 (MTU).
 * ticketHint в <rc> имитирует TLS session-ticket hint (ASCII).
 */
function mkQUIC0(input: GeneratorInput, iv: number): string {
  const host = getHost(input, "quic_0rtt");
  const dcid = rnd(8, 20);
  const scid = rnd(0, 20);
  const ticketHint = Math.min(host.length + rnd(4, 16), 48);

  const hex = assertEvenHex(
    hexPad(0xd0 | rnd(0, 3), 1) + // 1B  flags (0-RTT type)
      "00000001" + // 4B  version = 1
      hexPad(dcid, 1) + // 1B  DCID length
      rh(dcid) + // N   DCID
      hexPad(scid, 1) + // 1B  SCID length
      rh(scid) + // M   SCID
      rh(4), // 4B  reserved / Packet Number
    "mkQUIC0",
  );

  const mtu = input.mtu;
  const headerB = hex.length / 2;
  const extraB =
    (input.useTagRC ? ticketHint : 0) +
    tagOverhead(input.useTagC, input.useTagT);
  const pad = calcPadding(headerB, extraB, getFpRange(input, "q0"), iv, mtu);

  return (
    `<b 0x${hex}>` +
    (input.useTagT ? "<t>" : "") +
    (input.useTagR ? splitPad(pad) : "") +
    (input.useTagRC ? `<rc ${ticketHint}>` : "") +
    (input.useTagC ? "<c>" : "")
  );
}

/**
 * mkTLS — TLS 1.3 Client Hello (поверх TCP или внутри QUIC Initial)
 *
 * TLS Record layout:
 *   1B  content_type   0x16 (Handshake)
 *   2B  legacy_version 0x0301
 *   2B  record_length  (300–550)
 *   1B  hs_type        0x01 (ClientHello)
 *   3B  hs_length      (record_length − 4..9)
 *   2B  client_version 0x0303 (TLS 1.2 legacy field)
 *  32B  client random
 *
 * Chrome выравнивает ClientHello до кратного 128 байт (padding extension 0x0015).
 * Внутри QUIC Initial TLS-фрейм упакован в пакет 1250 байт.
 */
function mkTLS(input: GeneratorInput, iv: number): string {
  const host = getHost(input, "tls_client_hello");
  const sniExt = 2 + 2 + 2 + 1 + 2 + host.length; // приближение размера SNI extension
  const sniRc = Math.min(sniExt, 64);

  const fpRange = getFpRange(input, "tls");
  const baseLen = fpRange ? rnd(fpRange[0], fpRange[1]) : rnd(300, 550);
  const recLen = CHROMIUM_PROFILES.has(input.browserProfile)
    ? alignTo128(baseLen)
    : baseLen;
  const hsLen = recLen - rnd(4, 9);

  const mtu = input.mtu;
  const rLen = Math.min(
    rnd(20, 60) * iv,
    300,
    Math.max(0, mtu - 44 - sniRc - tagOverhead(input.useTagC, input.useTagT)),
  );

  const hex = assertEvenHex(
    "160301" + // 3B  content_type (0x16) + legacy_version (0x0301)
      hexPad(recLen, 2) + // 2B  record length
      "01" + // 1B  handshake type = ClientHello
      hexPad(hsLen, 3) + // 3B  handshake length
      "0303" + // 2B  client_version (TLS 1.2 legacy)
      rh(32), // 32B client random
    "mkTLS",
  );

  return (
    `<b 0x${hex}>` +
    (input.useTagRC ? `<rc ${sniRc}>` : "") +
    (input.useTagR ? splitPad(rLen) : "") +
    (input.useTagC ? "<c>" : "") +
    (input.useTagT ? "<t>" : "")
  );
}

/**
 * mkNoise — WireGuard Noise_IK Handshake Initiation
 *
 * Структура строго 148 байт:
 *   4B  message_type + reserved   0x01000000
 *   4B  sender_index              (random)
 *  32B  ephemeral public key      (random)
 *  48B  encrypted static key      (Poly1305-тег включён)
 *  28B  encrypted timestamp       (Poly1305-тег включён)
 *  16B  MAC1
 *  16B  MAC2
 *
 * DPI легко идентифицирует Noise по фиксированному размеру 148 байт.
 * При включённом fp добиваем до 1200–1250 байт через splitPad(<r>),
 * имитируя QUIC-обёртку.
 */
function mkNoise(input: GeneratorInput, iv: number): string {
  const rcLen = rnd(4, 12);
  const headerB = 148; // Noise_IK строго 148 байт

  const mtu = input.mtu;
  const extraB =
    (input.useTagRC ? rcLen : 0) + tagOverhead(input.useTagC, input.useTagT);
  const range = getFpRange(input, "nx");
  const pad = range
    ? calcPadding(headerB, extraB, range, iv, mtu)
    : Math.min(rnd(10, 40) * iv, 200, Math.max(0, mtu - headerB - extraB));

  return (
    `<b 0x01000000${rh(4)}>` + // 4B type=1 + 3B reserved + 4B sender_index
    `<b 0x${rh(32)}>` + // 32B ephemeral public key
    `<b 0x${rh(48)}>` + // 48B encrypted static (32B key + 16B tag)
    `<b 0x${rh(28)}>` + // 28B encrypted timestamp (12B ts + 16B tag)
    `<b 0x${rh(32)}>` + // 32B MAC1 + MAC2
    (input.useTagR ? splitPad(pad) : "") +
    (input.useTagT ? "<t>" : "") +
    (input.useTagRC ? `<rc ${rcLen}>` : "")
  );
}

/**
 * mkDTLS — DTLS 1.2 Client Hello (WebRTC)
 *
 * DTLS Record layout:
 *   1B  content_type   0x16 (Handshake)
 *   2B  version        0xFEFD (DTLS 1.2)
 *   2B  epoch          (0–255)
 *   6B  sequence_number
 *   2B  fragment_length
 *   1B  hs_type        0x01 (ClientHello)
 *   3B  hs_length + 2B msg_seq + 1B pad
 *   2B  dtls_version   0xFEFD
 *   2B  cookie_length  0x0000
 *   4B  random prefix
 *  32B  random
 *
 * Браузеры держат ClientHello < 1200 байт — DTLS не умеет пересобирать фрагменты
 * на этапе хендшейка. BFP-диапазон "dtls": 1050–1200 байт.
 */
function mkDTLS(input: GeneratorInput, iv: number): string {
  const host = getHost(input, "dtls");
  const fragLen = rnd(100, 300);
  const sniRc = Math.min(host.length + rnd(2, 8), 60);
  const epoch = rnd(0, 255);

  const hex = assertEvenHex(
    "16" + // 1B  content_type = Handshake
      "fefd" + // 2B  version = DTLS 1.2
      hexPad(epoch, 2) + // 2B  epoch
      rh(6) + // 6B  sequence number
      hexPad(fragLen, 2) + // 2B fragment length
      "01" + // 1B  hs_type = ClientHello
      rh(6) + // 3B hs_len + 2B msg_seq + 1B pad
      "fefd0000" + // 2B dtls_version + 2B cookie_len
      rh(4) + // 4B  random prefix
      rh(32), // 32B random
    "mkDTLS",
  );

  const mtu = input.mtu;
  const headerB = hex.length / 2;
  const extraB =
    (input.useTagRC ? sniRc : 0) + tagOverhead(input.useTagC, input.useTagT);
  const pad = calcPadding(headerB, extraB, getFpRange(input, "dtls"), iv, mtu);

  return (
    `<b 0x${hex}>` +
    (input.useTagRC ? `<rc ${sniRc}>` : "") +
    (input.useTagC ? "<c>" : "") +
    (input.useTagT ? "<t>" : "") +
    (input.useTagR ? splitPad(pad) : "")
  );
}

/**
 * mkHTTP3 — HTTP/3 Host Mimicry (QUIC Long Header, расширенный набор типов)
 *
 * Стратегия: копируем поведение Chrome QUIC.
 *   Хендшейк (Initial/0-RTT): 1250 байт
 *   DATA-пакеты после хендшейка: до MTU ~1350 байт
 *
 * Расширенный набор type-байт (0xC0–0xC3, 0xE0–0xE2) имитирует QUIC v2
 * и черновые расширения для большего разнообразия.
 */
function mkHTTP3(input: GeneratorInput, iv: number): string {
  const host = getHost(input, "quic_initial");
  const ptypes = [0xc0, 0xc1, 0xc2, 0xc3, 0xe0, 0xe1, 0xe2];
  const dcid = rnd(8, 20);
  const scid = rnd(0, 20);
  const sniLen = Math.min(host.length + 9 + rnd(0, 6), 64);

  const hex = assertEvenHex(
    hexPad(ptypes[rnd(0, ptypes.length - 1)], 1) + // 1B  flags (QUIC Long Header variant)
      "00000001" + // 4B  version = 1
      hexPad(dcid, 1) + // 1B  DCID length
      rh(dcid) + // N   DCID
      hexPad(scid, 1) + // 1B  SCID length
      rh(scid) + // M   SCID
      rh(4), // 4B  reserved / Packet Number
    "mkHTTP3",
  );

  const mtu = input.mtu;
  const headerB = hex.length / 2;
  const extraB =
    (input.useTagRC ? sniLen : 0) + tagOverhead(input.useTagC, input.useTagT);
  // HTTP/3 DATA стремится к MTU — слот h3 (1250–1350 байт)
  const pad = calcPadding(headerB, extraB, getFpRange(input, "h3"), iv, mtu);

  return (
    `<b 0x${hex}>` +
    (input.useTagRC ? `<rc ${sniLen}>` : "") +
    (input.useTagR ? splitPad(pad) : "") +
    (input.useTagC ? "<c>" : "") +
    (input.useTagT ? "<t>" : "")
  );
}

/**
 * mkSIP — SIP REGISTER request (VoIP Signaling)
 *
 * "REGISTER sip:<host> " в hex-форме:
 *   "REGISTER sip:" = 13 ASCII-байт (чётное кол-во hex)
 *   hostHex         = host.length * 2 hex (каждый ASCII → 2 hex)
 *   " " (0x20)      = 2 hex
 *   rh(4)           = 8 hex
 *   Итого: гарантированно чётная длина hex.
 *
 * SIP — специфичный VoIP-протокол. BFP не применяется.
 */
function mkSIP(input: GeneratorInput, iv: number): string {
  const host = getHost(input, "sip");
  let hostHex = "";
  for (let i = 0; i < host.length; i++) {
    hostHex += ("0" + host.charCodeAt(i).toString(16)).slice(-2);
  }

  const hex = assertEvenHex(
    "524547495354455220736970" + // "REGISTER sip"
      "3a" + // ":"
      hostHex + // host as ASCII hex
      "20" + // " " (SP)
      rh(4), // 4B random suffix
    "mkSIP",
  );

  const mtu = input.mtu;
  const headerB = hex.length / 2;
  const rcVal = Math.min(host.length + rnd(8, 24) * iv, 150);
  const rLen = Math.min(
    rnd(5, 30) * iv,
    120,
    Math.max(
      0,
      mtu - headerB - rcVal - tagOverhead(input.useTagC, input.useTagT),
    ),
  );

  return (
    `<b 0x${hex}>` +
    (input.useTagRC ? `<rc ${rcVal}>` : "") +
    (input.useTagC ? "<c>" : "") +
    (input.useTagT ? "<t>" : "") +
    (input.useTagR ? splitPad(rLen) : "")
  );
}

/**
 * mkEntropy(idx, iv) — генерирует энтропийные пакеты I2–I5.
 *
 * Создаёт разнообразную смесь тегов для обхода статистического анализа DPI.
 * Каждый пакет использует другой порядок тегов (5 шаблонов, ротация по idx).
 * Если все теги выключены — гарантируется минимальный шум `<r 10>`.
 */
function mkEntropy(input: GeneratorInput, idx: number, iv: number): string {
  const mtu = input.mtu;

  // Бимодальное распределение: 60% маленькие (ACK-like), 40% большие (DATA-like)
  const isBig = rnd(1, 10) > 6;
  const baseLen = isBig ? rnd(200, 500) : rnd(4, 20);
  const rLen = Math.min(
    baseLen * iv,
    isBig ? 500 : 60,
    Math.max(0, mtu - 20 - tagOverhead(input.useTagC, input.useTagT)),
  );

  const rcLen = rnd(4, 12);
  const rdLen = rnd(4, 8);

  const c = input.useTagC ? "<c>" : "";
  const t = input.useTagT ? "<t>" : "";
  const r = input.useTagR ? splitPad(rLen) : "";
  const rc = input.useTagRC ? `<rc ${rcLen}>` : "";
  const rd = input.useTagRD ? `<rd ${rdLen}>` : "";
  const b = iv >= 2 ? `<b 0x${rh(rnd(4, 8 * iv))}>` : "";
  // Второй бинарный блок для асимметрии при высоком iv
  const b2 = iv >= 3 ? `<b 0x${rh(rnd(2, 4))}>` : "";

  const patterns = [
    b + r + t + rc + c + rd,
    c + t + b + r + rc + rd,
    rc + b + r + c + t + rd,
    t + r + c + rc + b + rd,
    r + rc + b + t + c + rd,
    b2 + t + r + b + rc + c + rd,
    rd + b + rc + r + t + c + b2,
    c + b + b2 + t + rc + r + rd,
  ];

  const result = patterns[(idx + rnd(0, patterns.length - 1)) % patterns.length];
  return result || "<r 10>";
}

// ─────────────────────────────────────────────────────────────────────────────
// Диспетчер I1 и главная функция генерации
// ─────────────────────────────────────────────────────────────────────────────

/**
 * genI1 — выбирает и вызывает нужный генератор по профилю мимикрии.
 * При profile="random" — случайный выбор из всех профилей кроме random.
 */
export function genI1(
  input: GeneratorInput,
  profile: MimicProfile,
  iv: number,
): string {
  const dispatch: Record<string, (i: GeneratorInput, iv: number) => string> = {
    quic_initial: mkQUICi,
    quic_0rtt: mkQUIC0,
    tls_client_hello: mkTLS,
    wireguard_noise: mkNoise,
    dtls: mkDTLS,
    http3: mkHTTP3,
    sip: mkSIP,
    tls_to_quic: mkTLS,     // I1 = TLS, I2 = QUIC (задаётся в genCfg)
    quic_burst: mkQUICi,    // I1 = QUIC Initial, I2-I3 задаются в genCfg
  };

  if (profile === "random") {
    const keys = Object.keys(dispatch) as MimicProfile[];
    return genI1(input, keys[rnd(0, keys.length - 1)], iv);
  }

  const fn = dispatch[profile] ?? dispatch.quic_initial;
  return fn(input, iv);
}

/**
 * genCfg — основная функция сборки полной конфигурации AWG.
 *
 * Вычисляет все параметры (H1–H4, S1–S4, Junk, I1–I5) на основе:
 *   - версии протокола (version)
 *   - интенсивности обфускации (intensity)
 *   - профиля мимикрии (profile)
 *   - истории неудачных попыток (iterCount — автоматически усиливает параметры)
 *
 * Правила корректности:
 *   S1 + 56 ≠ S2  (иначе +1 к S2)
 *   S4 ≤ 32
 *   Jmax > 81 при AWG 1.0 (требование официального клиента)
 */
export function genCfg(input: GeneratorInput): AWGConfig {
  const { version, intensity, profile, iterCount, junkLevel } = input;

  const imap: Record<Intensity, number> = { low: 1, medium: 2, high: 3 };
  const boost = iterCount * 5;
  const iv = imap[intensity] + (iterCount > 3 ? 1 : 0);

  // ── H1–H4: диапазоны для AWG 2.0 ─────────────────────────────────────────
  // Диапазоны H1–H4 НЕ должны пересекаться. Базы подобраны с запасом.
  // Это гарантирует уникальность заголовков и невозможность создать универсальное DPI-правило.
  //
  // Обновлённые диапазоны (Q1 2026) — шире и динамичнее:
  //   H1: 100M - 1.1B  (Init Packet)
  //   H2: 1.2B - 2.3B  (Response Packet)
  //   H3: 2.4B - 3.5B  (Cookie Reply Packet)
  //   H4: 3.6B - 4.29B (Data Packet, максимум uint32)
  const h1 = rRange(rnd(100_000_000, 900_000_000), 100_000_000);
  const h2 = rRange(rnd(1_200_000_000, 2_000_000_000), 100_000_000);
  const h3 = rRange(rnd(2_400_000_000, 3_200_000_000), 100_000_000);
  const h4 = rRange(rnd(3_600_000_000, 4_000_000_000), 150_000_000);

  // ── H1s–H4s: одиночные значения для AWG 1.x ──────────────────────────────
  const h1s = 100_000_000 + rnd(0, 4_000_000);
  const h2s = 1_200_000_000 + rnd(0, 4_000_000);
  const h3s = 2_400_000_000 + rnd(0, 4_000_000);
  const h4s = 3_600_000_000 + rnd(0, 4_000_000);

  // ── S1–S4: рандомизация длин пакетов ──────────────────────────────────────
  // Длина пакетов в классическом WireGuard фиксирована — DPI легко их идентифицирует.
  // AmneziaWG добавляет случайный префикс 0..S1 байт к каждому типу пакета.
  //
  // Обновлённые диапазоны (Q1 2026) — лучше официального клиента:
  //   Официал: S1-S2: 15-150, S3: 1-64, S4: 1-20
  //   Наш вариант: S1-S2: 1-150 (шире), S3: 1-64, S4: 1-32
  //
  // Важно: S1-S4 должны быть >= 1, иначе сервер считает что параметр отключён.
  //
  // Правила уникальности (как в официальном клиенте):
  //   S1 + 56 ≠ S2  (size(init) ≠ size(resp))
  //   S1 + 56 ≠ S3  (size(init) ≠ size(cookie))
  //   S2 + 92 ≠ S3  (size(resp) ≠ size(cookie))
  let s1 = rnd(1, 150);
  let s2 = rnd(1, 150);

  // Гарантируем S1 + 56 ≠ S2 (Init ≠ Response по размеру)
  while (s2 === s1 + 56) {
    s2 = rnd(1, 150);
  }

  // Гарантируем S1 + 56 ≠ S3 и S2 + 92 ≠ S3
  let s3 = rnd(1, 64); // Cookie Reply
  let s3Attempts = 0;
  while ((s3 === s1 + 56 || s3 === s2 + 92) && s3Attempts < 10) {
    s3 = rnd(1, 64);
    s3Attempts++;
  }

  const s4 = rnd(1, 32); // Data: 1-32 (жёсткий лимит протокола)

  // ── Junk Train ────────────────────────────────────────────────────────────
  // Серия Jc случайных UDP-пакетов перед хендшейком.
  // Размывает временной и размерный профиль старта сессии.
  // Для AWG 1.0: Jc ≥ 4 и Jmax > 81 — требования официального клиента.
  //
  // Динамичная генерация с широкими диапазонами для уникальности каждой конфигурации.
  const minJc = version === "1.0" ? 4 : 3;

  // Jc: базовое значение от junkLevel + рандомизация
  const jcBase = Math.max(minJc, junkLevel);
  const jcRandom = rnd(0, intensity === "high" ? 6 : intensity === "medium" ? 4 : 2);
  let jcv = Math.min(15, jcBase + jcRandom);
  if (version === "1.0") jcv = Math.max(4, jcv);

  // Jmin: широкие диапазоны в зависимости от интенсивности
  const jminRanges: Record<Intensity, [number, number]> = {
    low: [64, 256],
    medium: [128, 512],
    high: [256, 768],
  };
  let jmin = rnd(jminRanges[intensity][0], jminRanges[intensity][1]);

  // Jmax: широкие диапазоны + гарантия что Jmax > Jmin + 64
  const jmaxRanges: Record<Intensity, [number, number]> = {
    low: [256, 512],
    medium: [512, 1024],
    high: [768, 1280],
  };
  let jmax = rnd(jmaxRanges[intensity][0], jmaxRanges[intensity][1]);

  // Гарантируем Jmax > Jmin + 64
  const minJmax = jmin + 64;
  if (jmax < minJmax) {
    jmax = minJmax + rnd(64, 256);
  }

  // Для AWG 1.0: Jmax > 81 (требование протокола)
  if (version === "1.0" && jmax <= 81) {
    jmax = 82 + rnd(50, 200);
  }

  // ── Router Low-Power Mode ─────────────────────────────────────────────────
  // Жёсткие лимиты для роутеров с ограниченными ресурсами.
  // Применяются ПОСЛЕ базовых вычислений — только уменьшают значения.
  // minJc сохраняется для AWG 1.0 (протокольное требование).
  if (input.routerMode) {
    s1 = Math.min(s1, 20);
    s2 = Math.min(s2, 20);
    if (s2 === s1 + 56) s2 = Math.min(s2 + 1, 20);
    jcv = Math.max(minJc, Math.min(jcv, 2));
    jmin = Math.min(jmin, 40);
    jmax = Math.min(jmax, 128);
  }

  // ── CPS Signature Chain (I1–I5) ───────────────────────────────────────────
  // Не генерируем I1–I5 для AWG 1.0 — там эти параметры не поддерживаются.
  const hasCPS = version !== "1.0";
  const isComposite = profile === "tls_to_quic" || profile === "quic_burst";

  let i1 = "", i2 = "", i3 = "", i4 = "", i5 = "";

  if (!hasCPS) {
    // AWG 1.0 — без CPS
  } else if (isComposite && profile === "tls_to_quic") {
    // TLS ClientHello → QUIC Initial → Entropy
    i1 = mkTLS(input, iv);
    i2 = mkQUICi(input, iv);
    i3 = mkEntropy(input, 2, iv);
    i4 = mkEntropy(input, 3, iv);
    i5 = mkEntropy(input, 4, iv);
  } else if (isComposite && profile === "quic_burst") {
    // QUIC Initial → QUIC 0-RTT → HTTP/3 → Entropy
    i1 = mkQUICi(input, iv);
    i2 = mkQUIC0(input, iv);
    i3 = mkHTTP3(input, iv);
    i4 = mkEntropy(input, 3, iv);
    i5 = mkEntropy(input, 4, iv);
  } else {
    // Стандартная логика
    i1 = genI1(input, profile, iv);
    i2 = input.mimicAll ? genI1(input, profile, iv) : mkEntropy(input, 1, iv);
    i3 = input.mimicAll ? genI1(input, profile, iv) : mkEntropy(input, 2, iv);
    i4 = input.mimicAll ? genI1(input, profile, iv) : mkEntropy(input, 3, iv);
    i5 = input.mimicAll ? genI1(input, profile, iv) : mkEntropy(input, 4, iv);
  }

  // Router mode: отключить I2–I5 для снижения нагрузки
  if (input.routerMode && hasCPS) {
    i2 = ""; i3 = ""; i4 = ""; i5 = "";
  }

  return {
    version,
    profile,
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
    i1,
    i2,
    i3,
    i4,
    i5,
  };
}
