/**
 * Per-locale page metadata.
 *
 * Kept apart from the UI catalog because these strings are consumed by the
 * router and by the build-time stub generator rather than by components, and
 * because search engines read them — they are prose, not labels.
 */

import type { Locale , Localised } from "./types";

export interface RouteSeo {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  /** Filename inside /assets, resolved against the deploy base at runtime. */
  ogImage: string;
  /** Keywords are a weak ranking signal but still parsed by some engines. */
  keywords?: string;
}

/** Route name → locale → metadata. */
export type SeoTable = Record<string, Localised<RouteSeo>>;

export const ROUTE_SEO: SeoTable = {
  /*
   * The root is the landing now, so its metadata describes the project rather
   * than the AmneziaWG generator — that copy moved to `amneziawg` below,
   * unchanged, along with the page it was written for.
   */
  home: {
    ru: {
      title: "Any Tech ARCHITECT — конструктор параметров обфускации",
      description:
        "Конструктор параметров обфускации для AmneziaWG и XRay/REALITY. Junk-поезда, диапазоны заголовков, подписи CPS и одиннадцать профилей мимикрии, собранных по RFC. Всё считается в браузере — ключи и параметры не покидают устройство.",
      ogTitle: "Any Tech ARCHITECT",
      ogDescription:
        "Собирает параметры обфускации и объясняет каждое число. AmneziaWG 1.0–3.0 сегодня, XRay/REALITY следом. Ничего не уходит из браузера.",
      ogImage: "og-image.png",
      keywords:
        "Any Tech Architect, AmneziaWG, XRay, REALITY, обход блокировок, DPI, обфускация, генератор конфигов, VPN",
    },
    en: {
      title: "Any Tech ARCHITECT — an obfuscation parameter workbench",
      description:
        "A workbench for the obfuscation parameters of AmneziaWG and XRay/REALITY. Junk trains, header ranges, CPS signature chains and eleven mimicry profiles built from the RFCs. Everything is computed in your browser — keys and parameters never leave the device.",
      ogTitle: "Any Tech ARCHITECT",
      ogDescription:
        "Builds obfuscation parameters and explains every number in them. AmneziaWG 1.0–3.0 today, XRay/REALITY next. Nothing leaves the browser.",
      ogImage: "og-image-en.png",
      keywords:
        "Any Tech Architect, AmneziaWG, XRay, REALITY, censorship circumvention, DPI, obfuscation, config generator, VPN",
    },
  },
  amneziawg: {
    ru: {
      title: "AmneziaWG Architect — генератор конфигураций AmneziaWG 3.0",
      description:
        "Генератор конфигураций AmneziaWG с поддержкой 3.0: HeaderProtectionKey, ContentPaddingAddition и рандомизация таймеров. Тонкая настройка Jc, Jmin, Jmax, S1–S4, H1–H4 и CPS-цепочек I1–I5. Всё считается в браузере — ключи и параметры не покидают устройство.",
      ogTitle: "AmneziaWG Architect — генератор конфигураций",
      ogDescription:
        "Обфускация AmneziaWG 1.0–3.0: junk-пакеты, магические заголовки, профили мимикрии QUIC/TLS/DTLS/SIP и защита заголовков ChaCha20.",
      ogImage: "og-amneziawg.png",
      keywords:
        "AmneziaWG, AmneziaWG 3.0, обход блокировок, DPI, WireGuard, обфускация, генератор конфигов, VPN, Jc, Jmin, Jmax, HeaderProtectionKey",
    },
    en: {
      title: "AmneziaWG Architect — AmneziaWG 3.0 config generator",
      description:
        "AmneziaWG configuration generator with 3.0 support: HeaderProtectionKey, ContentPaddingAddition and randomised protocol timers. Tune Jc, Jmin, Jmax, S1–S4, H1–H4 and the I1–I5 CPS chains. Everything is computed in your browser — keys and parameters never leave your device.",
      ogTitle: "AmneziaWG Architect — config generator",
      ogDescription:
        "AmneziaWG 1.0–3.0 obfuscation: junk packets, magic headers, QUIC/TLS/DTLS/SIP mimicry profiles and ChaCha20 header protection.",
      ogImage: "og-amneziawg-en.png",
      keywords:
        "AmneziaWG, AmneziaWG 3.0, DPI bypass, WireGuard, obfuscation, config generator, VPN, censorship circumvention, HeaderProtectionKey",
    },
  },
  xray: {
    ru: {
      title: "XRay ARCHITECT — генератор конфигураций XRay / REALITY",
      description:
        "Движок XRay/REALITY: ключи X25519 и shortIds, ML-DSA-65, DSL шифрования VLESS, транспорты XHTTP, отпечатки браузеров и FinalMask. Проверен против выпущенных ядер Xray. Интерфейс собирается.",
      ogTitle: "XRay / REALITY — в работе",
      ogDescription:
        "Движок написан и покрыт тестами против выпущенных ядер. Интерфейс к нему ещё собирается — здесь видно, что уже готово, а чего пока нет.",
      ogImage: "og-xray.png",
      keywords: "XRay, REALITY, VLESS, XHTTP, ML-DSA-65, fingerprint, обход блокировок",
    },
    en: {
      title: "XRay ARCHITECT — XRay / REALITY config generator",
      description:
        "The XRay/REALITY engine: X25519 keys and shortIds, ML-DSA-65, the VLESS encryption DSL, XHTTP transports, browser fingerprints and FinalMask. Tested against released Xray cores. The interface is being built.",
      ogTitle: "XRay / REALITY — in progress",
      ogDescription:
        "The engine is written and tested against released cores. The interface to it is still being built; this page states what is done and what is not.",
      ogImage: "og-xray-en.png",
      keywords: "XRay, REALITY, VLESS, XHTTP, ML-DSA-65, fingerprint, censorship circumvention",
    },
  },

  mergekeys: {
    ru: {
      title: "MergeKeys — объединение ключей Amnezia VPN",
      description:
        "Обновите обфускацию AWG-ключа или объедините несколько ключей Amnezia VPN в один контейнер. Обработка идёт локально в браузере — ключи никуда не отправляются.",
      ogTitle: "MergeKeys — AmneziaWG Architect",
      ogDescription:
        "Объединяйте ключи Amnezia VPN и обновляйте обфускацию — всё локально в браузере.",
      ogImage: "og-mergekeys.png",
      keywords:
        "Amnezia VPN, vpn://, объединение ключей, AmneziaWG, обфускация, MergeKeys",
    },
    en: {
      title: "MergeKeys — merge Amnezia VPN keys",
      description:
        "Refresh the obfuscation on an AWG key or merge several Amnezia VPN keys into a single container. Everything is processed locally in your browser — keys are never uploaded.",
      ogTitle: "MergeKeys — AmneziaWG Architect",
      ogDescription:
        "Merge Amnezia VPN keys and refresh obfuscation — entirely in your browser.",
      ogImage: "og-mergekeys-en.png",
      keywords:
        "Amnezia VPN, vpn://, merge keys, AmneziaWG, obfuscation, MergeKeys",
    },
  },

  simulator: {
    ru: {
      title: "Packet Simulator — визуализация handshake AmneziaWG",
      description:
        "Посмотрите, как выглядит старт сессии AmneziaWG: CPS-сигнатуры, junk-train, handshake и передача данных. Наглядная симуляция того, что увидит DPI.",
      ogTitle: "Packet Simulator — AmneziaWG Architect",
      ogDescription:
        "Симуляция пакетов AmneziaWG: CPS, junk-train, handshake, data.",
      ogImage: "og-simulator.png",
      keywords: "AmneziaWG, handshake, симулятор пакетов, DPI, обфускация",
    },
    en: {
      title: "Packet Simulator — visualise the AmneziaWG handshake",
      description:
        "See what an AmneziaWG session start actually looks like: CPS signatures, the junk train, the handshake and data transfer — a visual model of what DPI observes.",
      ogTitle: "Packet Simulator — AmneziaWG Architect",
      ogDescription:
        "Simulate AmneziaWG packets: CPS, junk train, handshake, data.",
      ogImage: "og-simulator-en.png",
      keywords: "AmneziaWG, handshake, packet simulator, DPI, obfuscation",
    },
  },

  about: {
    ru: {
      title: "О проекте — AmneziaWG Architect",
      description:
        "Что такое AmneziaWG Architect, как устроен генератор, почему он работает полностью офлайн и на чём основаны его параметры. Разбор архитектуры, безопасности и принципов работы.",
      ogTitle: "О проекте — AmneziaWG Architect",
      ogDescription:
        "Твой протокол — твои правила. Разбор архитектуры, безопасности и принципов работы генератора.",
      ogImage: "og-about.png",
      keywords: "AmneziaWG Architect, о проекте, приватность, открытый код",
    },
    en: {
      title: "About — AmneziaWG Architect",
      description:
        "What AmneziaWG Architect is, how the generator works, why it runs entirely offline and where its parameters come from. A walkthrough of the architecture, security model and design principles.",
      ogTitle: "About — AmneziaWG Architect",
      ogDescription:
        "Your protocol, your rules. A walkthrough of the generator's architecture, security and principles.",
      ogImage: "og-about-en.png",
      keywords: "AmneziaWG Architect, about, privacy, open source",
    },
  },

  faq: {
    ru: {
      title: "FAQ — вопросы по AmneziaWG и обходу блокировок",
      description:
        "Ответы на вопросы про AmneziaWG: чем версии 1.0, 1.5, 2.0 и 3.0 отличаются, что значат Jc, Jmin, Jmax, S1–S4, H1–H4 и I1–I5, как подобрать параметры под свой канал и что делать, если соединение не поднимается.",
      ogTitle: "FAQ — AmneziaWG Architect",
      ogDescription:
        "Параметры AmneziaWG, различия версий, подбор конфигурации и разбор типичных проблем.",
      ogImage: "og-faq.png",
      keywords:
        "AmneziaWG FAQ, Jc, Jmin, Jmax, S1, S2, S3, S4, H1, H2, H3, H4, I1, CPS, не подключается",
    },
    en: {
      title: "FAQ — AmneziaWG and censorship circumvention questions",
      description:
        "Answers about AmneziaWG: how versions 1.0, 1.5, 2.0 and 3.0 differ, what Jc, Jmin, Jmax, S1–S4, H1–H4 and I1–I5 actually do, how to tune them for your link, and what to check when the tunnel will not come up.",
      ogTitle: "FAQ — AmneziaWG Architect",
      ogDescription:
        "AmneziaWG parameters, version differences, tuning guidance and common failure modes.",
      ogImage: "og-faq-en.png",
      keywords:
        "AmneziaWG FAQ, Jc, Jmin, Jmax, S1, S2, S3, S4, H1, H2, H3, H4, I1, CPS, not connecting",
    },
  },

  vaiexia: {
    ru: {
      title: "VAIEXIA — веб-панель и боты для управления сервером",
      description:
        "VAIEXIA — веб-панель и бот для Telegram, Discord и Matrix. Управляйте сервером или кластером откуда угодно: установка пакетов в один клик и продвинутая настройка протоколов.",
      ogTitle: "VAIEXIA — веб-панель и Telegram/Discord/Matrix бот",
      ogDescription:
        "Управляйте сервером или кластером где угодно и как угодно. Установка пакетов в один клик.",
      ogImage: "og-vaiexia.png",
      keywords:
        "VAIEXIA, веб-панель, управление сервером, Telegram бот, Discord, Matrix, VPN панель",
    },
    en: {
      title: "VAIEXIA — web panel and bots for server management",
      description:
        "VAIEXIA is a web panel plus a Telegram, Discord and Matrix bot. Run your server or cluster from anywhere: one-click package installs and advanced protocol configuration.",
      ogTitle: "VAIEXIA — web panel and Telegram/Discord/Matrix bot",
      ogDescription:
        "Run your server or cluster anywhere, any way you like. One-click package installs.",
      ogImage: "og-vaiexia-en.png",
      keywords:
        "VAIEXIA, web panel, server management, Telegram bot, Discord, Matrix, VPN panel",
    },
  },

  "not-found": {
    ru: {
      title: "Страница не найдена — AmneziaWG Architect",
      description:
        "Кажется, вы перешли по неверной ссылке или страница была удалена.",
      ogTitle: "Страница не найдена — AmneziaWG Architect",
      ogDescription: "Такой страницы нет.",
      ogImage: "og-image.png",
    },
    en: {
      title: "Page not found — AmneziaWG Architect",
      description: "That link looks wrong, or the page has been removed.",
      ogTitle: "Page not found — AmneziaWG Architect",
      ogDescription: "No such page.",
      ogImage: "og-image-en.png",
    },
  },
};

/** Look up metadata, falling back to the home page rather than rendering blank. */
export function seoFor(routeName: string, loc: Locale): RouteSeo {
  const entry = ROUTE_SEO[routeName] ?? ROUTE_SEO.home;
  return entry[loc] ?? entry.ru;
}
