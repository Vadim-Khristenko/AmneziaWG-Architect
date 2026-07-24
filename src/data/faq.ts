/**
 * FAQ content, bilingual.
 *
 * Answers about protocol behaviour are written from the AmneziaWG source
 * (amneziawg-go v3.0.1, amneziawg-tools) rather than from the published docs,
 * which currently describe 2.0. Where a claim is version-specific it says so,
 * because getting this wrong costs someone a working tunnel.
 *
 * `answer` is plain text on purpose: it renders into the page *and* into the
 * FAQPage JSON-LD, and structured data must not carry markup.
 */

import type { Locale } from "@/i18n";

export type FaqCategoryId =
  | "basics"
  | "params"
  | "awg2"
  | "awg3"
  | "clients"
  | "tuning"
  | "warnings"
  | "troubleshooting"
  | "privacy";

export interface FaqCategory {
  id: FaqCategoryId;
  label: Record<Locale, string>;
}

export interface FaqEntry {
  id: string;
  category: FaqCategoryId;
  question: Record<Locale, string>;
  answer: Record<Locale, string>;
  /** Extra search terms that do not appear verbatim in the text. */
  keywords?: string[];
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  { id: "basics", label: { ru: "Основы", en: "Basics" } },
  { id: "params", label: { ru: "Параметры", en: "Parameters" } },
  { id: "awg2", label: { ru: "AmneziaWG 2.0", en: "AmneziaWG 2.0" } },
  { id: "awg3", label: { ru: "AmneziaWG 3.0", en: "AmneziaWG 3.0" } },
  { id: "clients", label: { ru: "Клиенты", en: "Clients" } },
  { id: "tuning", label: { ru: "Настройка", en: "Tuning" } },
  { id: "warnings", label: { ru: "Предупреждения", en: "Warnings" } },
  {
    id: "troubleshooting",
    label: { ru: "Проблемы", en: "Troubleshooting" },
  },
  { id: "privacy", label: { ru: "Приватность", en: "Privacy" } },
];

export const FAQ_ENTRIES: FaqEntry[] = [
  /* ── Basics ───────────────────────────────────────────────────────────── */
  {
    id: "what-is-amneziawg",
    category: "basics",
    question: {
      ru: "Что такое AmneziaWG и чем он отличается от обычного WireGuard?",
      en: "What is AmneziaWG and how does it differ from plain WireGuard?",
    },
    answer: {
      ru: "AmneziaWG — форк WireGuard, который решает одну конкретную проблему: обычный WireGuard слишком легко опознать. Его пакеты имеют фиксированный первый байт типа сообщения и предсказуемые размеры (148 байт на handshake initiation, 92 на response), поэтому DPI определяет протокол по первому же пакету и блокирует его целиком. AmneziaWG добавляет слой обфускации поверх той же криптографии: случайные заголовки вместо фиксированных, паддинг переменной длины, мусорные пакеты перед сессией и имитацию чужих протоколов. Криптография Noise при этом не трогается — меняется только то, как соединение выглядит снаружи.",
      en: "AmneziaWG is a WireGuard fork that solves one specific problem: plain WireGuard is trivial to identify. Its packets carry a fixed message-type byte and predictable sizes (148 bytes for a handshake initiation, 92 for a response), so DPI can classify the protocol from the very first packet and block it wholesale. AmneziaWG adds an obfuscation layer over the same cryptography: randomised headers instead of fixed ones, variable-length padding, junk packets before the session and mimicry of other protocols. The Noise cryptography is untouched — only what the connection looks like from outside changes.",
    },
    keywords: ["wireguard", "форк", "fork", "dpi", "noise"],
  },
  {
    id: "version-differences",
    category: "basics",
    question: {
      ru: "Чем отличаются версии 1.0, 1.5, 2.0 и 3.0?",
      en: "How do versions 1.0, 1.5, 2.0 and 3.0 differ?",
    },
    answer: {
      ru: "1.0 — базовая обфускация: junk-пакеты (Jc, Jmin, Jmax), паддинг S1 и S2, фиксированные магические заголовки H1–H4. 1.5 добавляет CPS-цепочки I1–I5, но работают они только на стороне клиента. 2.0 расширяет набор: появляются S3 и S4 (паддинг cookie- и транспортных пакетов), а H1–H4 задаются диапазонами, а не одним числом — заголовок каждого пакета выбирается из диапазона случайно. 3.0 добавляет три вещи поверх 2.0: HeaderProtectionKey (шифрование заголовков ChaCha20), ContentPaddingAddition (случайный паддинг транспорта) и рандомизацию таймеров протокола.",
      en: "1.0 is the baseline: junk packets (Jc, Jmin, Jmax), S1 and S2 padding, and fixed magic headers H1–H4. 1.5 adds the I1–I5 CPS chains, but they apply on the client side only. 2.0 widens the set: S3 and S4 arrive (padding for cookie and transport packets) and H1–H4 become ranges rather than single values, so each packet's header is drawn at random from its range. 3.0 adds three things on top of 2.0: HeaderProtectionKey (ChaCha20 header encryption), ContentPaddingAddition (random transport padding) and randomisation of the protocol timers.",
    },
    keywords: ["версии", "versions", "1.0", "1.5", "2.0", "3.0"],
  },
  {
    id: "both-sides",
    category: "basics",
    question: {
      ru: "Нужно ли настраивать одинаковые параметры на сервере и клиенте?",
      en: "Do the server and client need matching parameters?",
    },
    answer: {
      ru: "Частично. Jc, Jmin и Jmax — чисто клиентские: сервер о них ничего не знает и знать не должен. I1–I5 тоже отправляются только клиентом. А вот H1–H4, S1–S4 и все параметры 3.0, включая HeaderProtectionKey, обязаны совпадать на обеих сторонах: это то, как стороны договорились кодировать пакеты. Если они разойдутся, сервер просто не распознает пакеты клиента, и соединение не поднимется — без внятной ошибки, туннель будет молча молчать.",
      en: "Partly. Jc, Jmin and Jmax are client-only: the server neither knows nor needs to know them. I1–I5 are also sent by the client alone. But H1–H4, S1–S4 and every 3.0 parameter including HeaderProtectionKey must match on both ends — they define how the two sides agreed to encode packets. If they diverge the server simply will not recognise the client's packets and the tunnel never comes up, with no clear error to point at.",
    },
    keywords: ["сервер", "server", "клиент", "client", "симметрия"],
  },

  /* ── Parameters ───────────────────────────────────────────────────────── */
  {
    id: "jc-jmin-jmax",
    category: "params",
    question: {
      ru: "Что делают Jc, Jmin и Jmax?",
      en: "What do Jc, Jmin and Jmax do?",
    },
    answer: {
      ru: "Перед началом сессии клиент отправляет Jc мусорных UDP-пакетов случайной длины между Jmin и Jmax байт. Смысл в том, чтобы размазать временной и размерный профиль старта соединения: вместо чистого «148 байт, затем 92» DPI видит очередь пакетов разного размера, среди которых настоящий handshake не выделяется. Платой идёт трафик и время на старте — каждый junk-пакет реально уходит в сеть. Jc от 3 до 7 обычно достаточно; большие значения заметно замедляют подключение, особенно на мобильной сети.",
      en: "Before a session starts, the client sends Jc junk UDP packets of random length between Jmin and Jmax bytes. The point is to smear the timing and size profile of connection setup: instead of a clean \"148 bytes, then 92\", DPI sees a queue of differently sized packets in which the real handshake does not stand out. The cost is bandwidth and setup latency — every junk packet genuinely goes out on the wire. Jc between 3 and 7 is usually enough; larger values noticeably slow connection setup, especially on mobile networks.",
    },
    keywords: ["junk", "мусорные пакеты", "jc", "jmin", "jmax"],
  },
  {
    id: "s-params",
    category: "params",
    question: {
      ru: "Что означают S1, S2, S3 и S4?",
      en: "What do S1, S2, S3 and S4 mean?",
    },
    answer: {
      ru: "Это количество случайных байт, дописываемых перед пакетом, чтобы сбить его характерный размер. S1 — для handshake initiation, S2 — для handshake response, S3 — для cookie reply, S4 — для транспортных пакетов. Итоговые размеры становятся 148 + S1 и 92 + S2 вместо фиксированных. Важное следствие: если S1 + 56 окажется равным S2, initiation и response снова станут одного размера и вы вернёте ровно тот отпечаток, от которого уходили. Генератор такие совпадения отслеживает и не выпускает. S4 ограничен 32 байтами протоколом.",
      en: "They are counts of random bytes prepended to a packet to break its characteristic size. S1 covers the handshake initiation, S2 the handshake response, S3 the cookie reply and S4 transport packets. The resulting sizes become 148 + S1 and 92 + S2 instead of fixed values. One consequence matters: if S1 + 56 happens to equal S2, the initiation and response end up the same size again and you have recreated exactly the fingerprint you were escaping. The generator watches for these collisions and refuses to emit them. S4 is capped at 32 bytes by the protocol.",
    },
    keywords: ["s1", "s2", "s3", "s4", "паддинг", "padding", "размер"],
  },
  {
    id: "h-params",
    category: "params",
    question: {
      ru: "Что такое H1–H4 и почему они не должны пересекаться?",
      en: "What are H1–H4 and why must they not overlap?",
    },
    answer: {
      ru: "H1–H4 заменяют предсказуемые идентификаторы типа сообщения WireGuard (1, 2, 3, 4) на произвольные 32-битные значения: H1 — initiation, H2 — response, H3 — cookie reply, H4 — транспорт. В версии 2.0 и выше это диапазоны, и для каждого пакета значение берётся из диапазона случайно. Пересекаться они не должны по простой причине: получатель определяет тип пакета именно по этому числу. Если диапазоны H1 и H4 накладываются, пакет из зоны перекрытия невозможно однозначно классифицировать, и он будет отброшен. Генератор разносит все четыре диапазона и проверяет это перед выдачей.",
      en: "H1–H4 replace WireGuard's predictable message-type identifiers (1, 2, 3, 4) with arbitrary 32-bit values: H1 for the initiation, H2 for the response, H3 for the cookie reply, H4 for transport. From 2.0 onward these are ranges, and each packet draws its value at random from within one. They must not overlap for a simple reason: the receiver identifies a packet's type by exactly this number. If the H1 and H4 ranges intersect, a packet landing in the overlap cannot be classified unambiguously and gets dropped. The generator spaces all four ranges apart and verifies it before emitting.",
    },
    keywords: ["h1", "h2", "h3", "h4", "магические заголовки", "magic headers"],
  },
  {
    id: "cps-tags",
    category: "params",
    question: {
      ru: "Как устроены I1–I5 и какие теги в них доступны?",
      en: "How do I1–I5 work and which tags are available?",
    },
    answer: {
      ru: "I1–I5 — это до пяти пакетов, которые клиент отправляет перед handshake, чтобы начало сессии выглядело как чужой протокол. Содержимое описывается тегами: <b hex> — статические байты (например, шапка QUIC Initial), <t> — 32-битная метка времени в сетевом порядке байт, <r N> — N криптослучайных байт, <rc N> — N случайных латинских букв, <rd N> — N случайных цифр. Обычно I1 несёт узнаваемую сигнатуру реального протокола, а I2–I5 добавляют энтропию, чтобы пачка не выглядела одинаково от сессии к сессии.",
      en: "I1–I5 are up to five packets the client sends before the handshake so that session start resembles some other protocol. Their contents are described with tags: <b hex> for static bytes (a QUIC Initial header, say), <t> for a 32-bit timestamp in network byte order, <r N> for N cryptographically random bytes, <rc N> for N random Latin letters and <rd N> for N random digits. Typically I1 carries a recognisable signature of a real protocol while I2–I5 add entropy, so the burst does not look identical from session to session.",
    },
    keywords: ["i1", "i2", "cps", "теги", "tags", "мимикрия", "mimicry"],
  },
  {
    id: "d-tags",
    category: "params",
    question: {
      ru: "Почему генератор не выдаёт теги <d>, <ds> и <dz>?",
      en: "Why does the generator never emit the <d>, <ds> and <dz> tags?",
    },
    answer: {
      ru: "Потому что в текущем релизе они ничего не делают. В amneziawg-go v3.0.1 эти теги действительно разбираются парсером, но цепочки I1–I5 вызываются в коде отправки только с пустой полезной нагрузкой, так что теги, работающие с данными пакета, не получают ничего. Судя по ветке feature/awg4 в amneziawg-tools, где эти семь ключей 3.0 заменены на DI, DR, DC и DT, это задел под маскировку транспортных пакетов в AmneziaWG 4.0. Пока фича не собрана целиком, выдавать её в конфиге — значит выдать неработающий конфиг.",
      en: "Because in the current release they do nothing. In amneziawg-go v3.0.1 the parser does accept these tags, but the send path only ever invokes the I1–I5 chains with an empty payload, so the tags that operate on packet data receive nothing. Judging by the feature/awg4 branch of amneziawg-tools, where the seven 3.0 keys are replaced by DI, DR, DC and DT, this is groundwork for transport-packet mimicry in AmneziaWG 4.0. Until the feature is wired up end to end, emitting it would mean handing you a config that does not work.",
    },
    keywords: ["d", "ds", "dz", "awg4", "4.0"],
  },

  /* ── AWG 2.0 ──────────────────────────────────────────────────────────── */
  {
    id: "awg2-what-changed",
    category: "awg2",
    question: {
      ru: "Что именно 2.0 добавила по сравнению с 1.x?",
      en: "What exactly did 2.0 add over 1.x?",
    },
    answer: {
      ru: "Два принципиальных изменения. Первое: появились S3 и S4 — паддинг для cookie reply и транспортных пакетов. До этого обфусцировался только handshake, а весь последующий поток данных шёл с узнаваемой структурой. Второе: H1–H4 стали диапазонами вместо одиночных значений. В 1.x магический заголовок был хоть и произвольным, но постоянным числом, то есть сам по себе становился стабильным отпечатком конкретного сервера. В 2.0 значение выбирается заново для каждого пакета из заданного диапазона.",
      en: "Two changes of substance. First, S3 and S4 arrived — padding for cookie replies and transport packets. Before that only the handshake was obfuscated while the entire subsequent data stream kept a recognisable shape. Second, H1–H4 became ranges instead of single values. In 1.x the magic header was arbitrary but constant, which made it a stable fingerprint of that particular server. In 2.0 the value is redrawn from its range for every packet.",
    },
    keywords: ["2.0", "s3", "s4", "диапазоны", "ranges"],
  },
  {
    id: "awg2-vs-awg3-choice",
    category: "awg2",
    question: {
      ru: "Стоит ли переходить на 3.0 или 2.0 всё ещё достаточно?",
      en: "Should I move to 3.0, or is 2.0 still enough?",
    },
    answer: {
      ru: "2.0 остаётся полностью рабочей и на сегодня наиболее совместимой версией: её понимают все актуальные клиенты. 3.0 сильнее там, где против вас работает статистический анализ, а не сигнатурный — шифрование заголовков и рандомизация таймеров закрывают именно те каналы утечки, которые 2.0 оставляет открытыми. Но за это приходится платить совместимостью: обе стороны должны быть собраны с поддержкой 3.0. Разумный порядок такой: если 2.0 у вас работает и не блокируется, переходить незачем; если начались блокировки, которые 2.0 не переживает, — 3.0 даёт следующий уровень.",
      en: "2.0 remains fully functional and is currently the most compatible version — every current client understands it. 3.0 is stronger where statistical analysis rather than signature matching is being used against you: header encryption and timer randomisation close exactly the leaks 2.0 leaves open. The price is compatibility, since both ends must be built with 3.0 support. A sensible rule: if 2.0 works and is not being blocked, there is no reason to move; if blocking starts and 2.0 cannot survive it, 3.0 is the next step.",
    },
    keywords: ["2.0", "3.0", "переход", "upgrade", "migration"],
  },
  {
    id: "awg2-h-ranges-width",
    category: "awg2",
    question: {
      ru: "Насколько широкими делать диапазоны H1–H4 в 2.0?",
      en: "How wide should the H1–H4 ranges be in 2.0?",
    },
    answer: {
      ru: "Достаточно широкими, чтобы значения не повторялись слишком часто, но это не тот параметр, который стоит выкручивать до предела. Важнее два других условия: диапазоны не должны пересекаться между собой и не должны попадать в зону 1–4, зарезервированную оригинальным WireGuard, — иначе пакет можно спутать с немодифицированным протоколом. Генератор разносит диапазоны по разным зонам 32-битного пространства и проверяет оба условия, так что вручную это подбирать не нужно.",
      en: "Wide enough that values do not repeat too often, but this is not a parameter worth maxing out. Two other conditions matter more: the ranges must not overlap each other, and must not fall in the 1–4 zone reserved by upstream WireGuard, or a packet could be confused with the unmodified protocol. The generator spreads the ranges across separate zones of the 32-bit space and checks both conditions, so there is nothing to tune by hand.",
    },
    keywords: ["h1", "диапазон", "range", "2.0", "ширина"],
  },

  /* ── Clients ──────────────────────────────────────────────────────────── */
  {
    id: "which-client",
    category: "clients",
    question: {
      ru: "Какой клиент лучше использовать?",
      en: "Which client should I use?",
    },
    answer: {
      ru: "Лучший выбор на сегодня — клиенты, которые выпускают сами разработчики Amnezia: приложения Amnezia VPN и официальные сборки AmneziaWG для Android, iOS и Windows. Генератор в первую очередь гарантирует работу именно с ними — на них проверяются диапазоны параметров и ограничения, и именно они раньше всех получают поддержку новых версий протокола. Сторонние клиенты и прошивки поддерживаются во вторую очередь: они учтены в матрице совместимости, генератор подстраивает под них параметры, но их поведение зависит от чужого графика обновлений, а не от нашего.",
      en: "The best choice today is whatever the Amnezia developers ship themselves: the Amnezia VPN apps and the official AmneziaWG builds for Android, iOS and Windows. The generator guarantees compatibility with those first — parameter ranges and limits are validated against them, and they are the first to receive support for new protocol versions. Third-party clients and firmware are supported second: they are covered by the compatibility matrix and the generator adapts parameters to them, but their behaviour depends on someone else's release schedule rather than ours.",
    },
    keywords: [
      "клиент",
      "client",
      "amnezia vpn",
      "официальный",
      "official",
      "выбор",
    ],
  },
  {
    id: "client-limits",
    category: "clients",
    question: {
      ru: "Почему при выборе клиента часть параметров меняется?",
      en: "Why do some parameters change when I pick a client?",
    },
    answer: {
      ru: "Потому что реализации отличаются в мелочах, и эти мелочи ломают конфиги. Клиент AmneziaWG для Windows, например, ограничен INT32_MAX для значений H, тогда как остальные принимают весь 32-битный диапазон, — конфиг с H около четырёх миллиардов там просто не примется. Некоторые сборки не реализуют теги <c>, <rc> или <rd>, и цепочка с ними отвалится с ошибкой. Генератор знает эти ограничения и подрезает параметры под выбранный клиент, вместо того чтобы выдать красивый конфиг, который не заработает.",
      en: "Because implementations differ in small ways, and those small ways break configs. The AmneziaWG client for Windows, for instance, caps H values at INT32_MAX while others accept the full 32-bit range — a config with an H near four billion is simply rejected there. Some builds do not implement the <c>, <rc> or <rd> tags, and a chain using them fails outright. The generator knows these limits and trims parameters to the selected client rather than handing you an elegant config that will not run.",
    },
    keywords: ["совместимость", "compatibility", "int32", "windows", "лимиты"],
  },
  {
    id: "report-problem",
    category: "clients",
    question: {
      ru: "Нашёл ошибку или что-то не работает — куда написать?",
      en: "I found a bug or something does not work — where do I report it?",
    },
    answer: {
      ru: "Пожалуйста, напишите — это лучший способ починить то, о чём мы не знаем. Можно присоединиться к обсуждению в чате, завести issue на GitHub в репозитории проекта, а вскоре и на git.vai-rice.space. Если проблема в конкретном конфиге, приложите версию AmneziaWG, клиент и его версию, а также сами параметры без приватных ключей — этого почти всегда достаточно, чтобы воспроизвести. Замечания по формулировкам и переводу тоже приветствуются.",
      en: "Please do — it is the best way to fix things we do not know about. You can join the discussion in the chat, open an issue on the project's GitHub repository, and soon on git.vai-rice.space as well. If the problem is a specific config, include the AmneziaWG version, the client and its version, and the parameters themselves with private keys removed — that is almost always enough to reproduce it. Notes on wording and translation are welcome too.",
    },
    keywords: [
      "баг",
      "bug",
      "issue",
      "сообщить",
      "report",
      "github",
      "чат",
      "обратная связь",
      "feedback",
    ],
  },

  /* ── Warnings ─────────────────────────────────────────────────────────── */
  {
    id: "warn-tag-c",
    category: "warnings",
    question: {
      ru: "Почему тег <c> помечен как проблемный?",
      en: "Why is the <c> tag flagged as problematic?",
    },
    answer: {
      ru: "Он не реализован в ряде сборок amneziawg-go и вызывает там ошибку ErrorCode 1000 — конфиг не применяется целиком. Кроме того, разработчики Amnezia позднее от него отказались, так что он может перестать работать и в тех клиентах, где сейчас работает. По умолчанию генератор его не включает, а для клиентов, где он заведомо не поддерживается, отключает принудительно. Если у вас нет конкретной причины его использовать, лучше обойтись без него.",
      en: "It is unimplemented in several amneziawg-go builds, where it raises ErrorCode 1000 and the whole config fails to apply. Amnezia's developers also stepped away from it later, so it may stop working even in clients where it works today. The generator leaves it off by default and force-disables it for clients known not to support it. Unless you have a specific reason to use it, do without.",
    },
    keywords: ["<c>", "errorcode 1000", "тег", "предупреждение", "warning"],
  },
  {
    id: "warn-extreme",
    category: "warnings",
    question: {
      ru: "Чем рискуют «экстремальные максимумы»?",
      en: "What is the risk of the \"extreme maximums\" option?",
    },
    answer: {
      ru: "Она снимает разумные потолки: Jc поднимается до 128, S3 выходит за 64 байта, разбросы H увеличиваются. Формально это допустимо, но практических проблем от этого обычно больше, чем пользы. Сотня мусорных пакетов перед каждым handshake заметно тормозит подключение и сама по себе выглядит аномально — очередь UDP такой длины встречается редко, и это уже отдельный признак. Плюс не все клиенты и прошивки корректно переваривают предельные значения. Режим полезен для экспериментов, а не как настройка по умолчанию.",
      en: "It removes the sensible ceilings: Jc rises to 128, S3 goes past 64 bytes, the H spreads widen. This is formally valid, but usually causes more practical trouble than it solves. A hundred junk packets before every handshake noticeably slows connection setup and looks anomalous in itself — UDP bursts that long are rare, which is a signal of its own. On top of that, not every client and firmware digests extreme values correctly. Treat it as an experiment, not a default.",
    },
    keywords: ["экстремальные", "extreme", "максимумы", "jc 128", "риск"],
  },
  {
    id: "warn-yandex-fp",
    category: "warnings",
    question: {
      ru: "Почему некоторые браузерные отпечатки помечены как нестабильные?",
      en: "Why are some browser fingerprints marked unstable?",
    },
    answer: {
      ru: "Браузерный отпечаток подгоняет размеры пакетов под характерные для конкретного браузера. Проблема в том, что эти размеры меняются от версии к версии, и профили, привязанные к быстро обновляющимся браузерам, устаревают быстрее остальных: сегодня они имитируют реальный трафик, а через пару релизов — трафик, которого в сети уже нет. Такой профиль хуже, чем никакой, потому что редкий отпечаток заметнее обычного. Помеченные варианты не сломаны, но требуют более частой перегенерации.",
      en: "A browser fingerprint shapes packet sizes to match a particular browser. The catch is that those sizes shift between versions, and profiles tied to fast-moving browsers go stale sooner than the rest: today they imitate real traffic, and a couple of releases later they imitate traffic that no longer exists on the network. Such a profile is worse than none, because a rare fingerprint stands out more than an ordinary one. The flagged options are not broken, but they need regenerating more often.",
    },
    keywords: [
      "отпечаток",
      "fingerprint",
      "браузер",
      "нестабильный",
      "unstable",
    ],
  },
  {
    id: "warn-ip-blocking",
    category: "warnings",
    question: {
      ru: "Когда обфускация не поможет вообще?",
      en: "When will obfuscation not help at all?",
    },
    answer: {
      ru: "Когда блокируют не протокол, а адрес. Обфускация прячет тип трафика от DPI: система видит QUIC, TLS или SIP вместо WireGuard и пропускает пакет. Но если провайдер блокирует диапазоны IP-адресов датацентров целиком или работает по белому списку разрешённых адресов, разбирать содержимое пакетов ему не нужно — соединение не установится независимо от того, насколько хороша обфускация. Признак именно этого случая: туннель не поднимается ни с какими параметрами, а сам сервер недоступен даже по обычному пингу. Лечится это сменой адреса или хостинга, а не настройками AmneziaWG.",
      en: "When the address is being blocked rather than the protocol. Obfuscation hides traffic type from DPI: the system sees QUIC, TLS or SIP instead of WireGuard and lets the packet through. But if your provider blocks entire datacentre IP ranges, or operates an allowlist, it never needs to inspect packet contents — the connection fails no matter how good the obfuscation is. The tell is specific: the tunnel comes up with no parameter set at all, and the server is unreachable even by plain ping. The fix is a different address or host, not different AmneziaWG settings.",
    },
    keywords: [
      "ip",
      "блокировка по ip",
      "белый список",
      "allowlist",
      "датацентр",
      "не помогает",
    ],
  },
  {
    id: "mimicry-profiles",
    category: "tuning",
    question: {
      ru: "Чем отличаются профили мимикрии между собой?",
      en: "How do the mimicry profiles differ from each other?",
    },
    answer: {
      ru: "Каждый профиль подделывает начало соединения под конкретный протокол. QUIC Initial имитирует старт HTTP/3-сессии — самый универсальный вариант там, где есть браузерный UDP-трафик. QUIC 0-RTT изображает возобновление сессии с ранними данными. TLS 1.3 Client Hello выглядит как начало HTTPS-соединения. DTLS 1.3 похож на рукопожатие WebRTC и уместен в сетях, где много видеозвонков. HTTP/3 использует расширенный набор QUIC-типов. SIP имитирует сигнализацию VoIP. DNS Query маскируется под обычный запрос к 53-му порту. Вариант Noise_IK не подделывает ничего — он оставляет структуру WireGuard, добавляя только паддинг.",
      en: "Each profile disguises the start of a connection as a specific protocol. QUIC Initial imitates the start of an HTTP/3 session — the most universal option wherever browser UDP traffic exists. QUIC 0-RTT poses as a session resumption with early data. TLS 1.3 Client Hello looks like the opening of an HTTPS connection. DTLS 1.3 resembles a WebRTC handshake and suits networks full of video calls. HTTP/3 uses a wider set of QUIC types. SIP imitates VoIP signalling. DNS Query passes as an ordinary port 53 lookup. The Noise_IK option imitates nothing — it keeps WireGuard's own structure and only adds padding.",
    },
    keywords: [
      "профили",
      "profiles",
      "quic",
      "dtls",
      "sip",
      "http3",
      "noise_ik",
    ],
  },
  {
    id: "warn-not-anonymity",
    category: "warnings",
    question: {
      ru: "Даёт ли обфускация анонимность?",
      en: "Does obfuscation give me anonymity?",
    },
    answer: {
      ru: "Нет, и это важно не перепутать. Обфускация решает ровно одну задачу — сделать так, чтобы трафик не опознали как VPN и не заблокировали. Она не скрывает факт соединения с конкретным IP, не защищает от анализа объёмов и времени активности, и уж точно ничего не делает с тем, что вы сами сообщаете сайтам, куда заходите. Ваш провайдер по-прежнему видит, что вы обмениваетесь данными с некоторым сервером. Если ваша модель угроз — это анонимность, а не доступ, вам нужны другие инструменты.",
      en: "No, and the distinction matters. Obfuscation solves exactly one problem: keeping traffic from being identified as VPN and blocked. It does not hide that you are connected to a particular IP, does not protect against volume or timing analysis, and certainly does nothing about what you tell the sites you visit. Your provider still sees that you are exchanging data with some server. If your threat model is anonymity rather than access, you need different tools.",
    },
    keywords: [
      "анонимность",
      "anonymity",
      "безопасность",
      "security",
      "модель угроз",
    ],
  },

  /* ── AWG 3.0 ──────────────────────────────────────────────────────────── */
  {
    id: "header-protection",
    category: "awg3",
    question: {
      ru: "Что даёт HeaderProtectionKey?",
      en: "What does HeaderProtectionKey give you?",
    },
    answer: {
      ru: "До версии 3.0 поле типа пакета всего лишь случайно выбиралось из диапазона H1–H4. Наблюдатель не видел фиксированной сигнатуры, но в принципе мог копить статистику и оценивать границы диапазонов. В 3.0 появляется общий 32-байтный ключ, которым заголовок шифруется потоковым шифром ChaCha20. Разница качественная: без ключа гипотезу о типе пакета невозможно даже проверить — считать попросту нечего. У handshake-пакетов и cookie reply шифруется всё сообщение целиком, у транспортных — только 16-байтный заголовок.",
      en: "Before 3.0 the packet-type field was merely drawn at random from the H1–H4 ranges. An observer saw no fixed signature, but could in principle accumulate statistics and estimate where the range boundaries sat. 3.0 introduces a shared 32-byte key that encrypts the header with the ChaCha20 stream cipher. The difference is qualitative: without the key a hypothesis about packet type cannot even be tested — there is nothing to compute against. Handshake packets and cookie replies are encrypted whole; transport packets only in their 16-byte header.",
    },
    keywords: ["headerprotectionkey", "chacha20", "3.0", "заголовки"],
  },
  {
    id: "s-floor-12",
    category: "awg3",
    question: {
      ru: "Почему при включённом HeaderProtectionKey S1–S4 не могут быть меньше 12?",
      en: "Why can't S1–S4 go below 12 when HeaderProtectionKey is set?",
    },
    answer: {
      ru: "Потому что nonce шифра нигде не передаётся отдельно — он берётся из первых 12 байт того самого случайного паддинга, который задают S1–S4. Это видно в коде отправки: буфер паддинга режется на 12 байт и используется как nonce. Если паддинг короче, срез уходит за его границу в тело сообщения. В Go это не вызывает паники, потому что срез остаётся в пределах ёмкости буфера, — и именно поэтому проблема опасна: ошибки не будет, шифр просто тихо начнёт работать на предсказуемом nonce. Поэтому генератор поднимает все четыре S до 12 байт, а валидатор отклоняет конфиги, где это нарушено.",
      en: "Because the cipher nonce is never transmitted separately — it is taken from the first 12 bytes of the same random padding that S1–S4 define. You can see it in the send path: the padding buffer is sliced to 12 bytes and used as the nonce. If the padding is shorter, that slice runs past its end into the message body. In Go this raises no panic, because the slice stays within the buffer's capacity — which is exactly what makes it dangerous: there is no error, the cipher just quietly starts running on a predictable nonce. So the generator raises all four S values to 12 bytes and the validator rejects configs that break it.",
    },
    keywords: ["nonce", "12", "s1", "паддинг", "chacha20"],
  },
  {
    id: "random-timings",
    category: "awg3",
    question: {
      ru: "Зачем рандомизировать таймеры и можно ли этим сломать туннель?",
      en: "Why randomise the timers, and can it break the tunnel?",
    },
    answer: {
      ru: "WireGuard использует фиксированные константы: рекей через 120 секунд, таймаут 5, отбраковка через 180, keepalive 10. Это ровный ритм, по которому соединение опознаётся статистически, даже если каждый отдельный пакет неотличим. В 3.0 все они задаются диапазонами. Сломать этим туннель можно, и легко: RejectAfterTime обязан оставаться заметно выше суммы KeepaliveTimeout и RekeyTimeout, иначе окно обновления ключей на приёме схлопывается в ноль и сессия умрёт по истечении срока. RekeyAfterTime, соответственно, должен успевать сработать до RejectAfterTime. Генератор соблюдает оба условия и проверяет их перед выдачей.",
      en: "WireGuard uses fixed constants: rekey after 120 seconds, a 5-second timeout, rejection at 180, keepalive at 10. That steady rhythm identifies a connection statistically even when individual packets are indistinguishable. In 3.0 all of them become ranges. It is entirely possible to break a tunnel this way: RejectAfterTime must stay well above the sum of KeepaliveTimeout and RekeyTimeout, otherwise the receiving side's key-refresh window collapses to zero and the session dies when the deadline passes. RekeyAfterTime must likewise fire before RejectAfterTime. The generator honours both constraints and verifies them before emitting.",
    },
    keywords: ["rekey", "таймеры", "timers", "rejectaftertime", "keepalive"],
  },
  {
    id: "awg3-support",
    category: "awg3",
    question: {
      ru: "Какие клиенты уже поддерживают параметры 3.0?",
      en: "Which clients already support the 3.0 parameters?",
    },
    answer: {
      ru: "Поддержка на стороне ядра появилась в amneziawg-go начиная с версии 3.0.1. С пользовательскими утилитами ситуация сложнее: разбор новых ключей в .conf на момент написания живёт в ветке feat/awg3 репозитория amneziawg-tools, а не в master. Практический вывод: прежде чем разворачивать конфиг 3.0, убедитесь, что и клиент, и сервер собраны с поддержкой этих параметров. Если сомневаетесь — 2.0 остаётся полностью рабочим вариантом, и генератор его никуда не убирал.",
      en: "Kernel-side support landed in amneziawg-go from version 3.0.1. The userspace tooling is messier: at the time of writing, parsing the new .conf keys lives on the feat/awg3 branch of amneziawg-tools rather than on master. The practical takeaway is to confirm that both your client and your server are built with these parameters before deploying a 3.0 config. If in doubt, 2.0 remains fully functional and the generator still offers it.",
    },
    keywords: ["поддержка", "support", "amneziawg-go", "tools", "клиенты"],
  },

  /* ── Tuning ───────────────────────────────────────────────────────────── */
  {
    id: "which-profile",
    category: "tuning",
    question: {
      ru: "Какой профиль мимикрии выбрать?",
      en: "Which mimicry profile should I choose?",
    },
    answer: {
      ru: "Универсального ответа нет — выбирать стоит по тому, что в вашей сети выглядит обычно. QUIC Initial и HTTP/3 хороши там, где браузерный трафик по UDP/443 привычен, то есть в большинстве домашних и мобильных сетей. DNS Query подходит для сетей, где UDP-трафик жёстко фильтруется, но 53-й порт открыт. TLS Client Hello уместен, если в вашей сети UDP редкость и правдоподобнее выглядит TCP-подобная сигнатура. Если непонятно, с чего начать — QUIC Initial разумный выбор по умолчанию.",
      en: "There is no universal answer — pick whatever looks unremarkable on your network. QUIC Initial and HTTP/3 work well where browser traffic over UDP/443 is routine, which covers most home and mobile networks. DNS Query suits networks that filter UDP aggressively but leave port 53 open. TLS Client Hello fits when UDP is rare on your network and a TCP-shaped signature is the more plausible cover. If you have no idea where to start, QUIC Initial is a reasonable default.",
    },
    keywords: ["профиль", "profile", "quic", "tls", "dns", "мимикрия"],
  },
  {
    id: "router-mode",
    category: "tuning",
    question: {
      ru: "Что делает режим роутера?",
      en: "What does router mode do?",
    },
    answer: {
      ru: "Он урезает всё, что стоит процессорного времени и памяти: ограничивает Jc, уменьшает Jmin и Jmax, зажимает S1 и S2 и оставляет только цепочку I1, обнуляя I2–I5. Это осознанный размен: обфускация становится слабее, зато конфиг переваривает слабое железо вроде домашних роутеров и одноплатников. Если ваш клиент — обычный компьютер или телефон, режим лучше не включать.",
      en: "It trims everything that costs CPU time and memory: it caps Jc, lowers Jmin and Jmax, clamps S1 and S2 and keeps only the I1 chain, clearing I2–I5. This is a deliberate trade: obfuscation gets weaker, but the config becomes digestible for weak hardware such as home routers and single-board devices. If your client is an ordinary computer or phone, leave it off.",
    },
    keywords: ["роутер", "router", "openwrt", "keenetic", "слабое железо"],
  },
  {
    id: "mtu",
    category: "tuning",
    question: {
      ru: "Какой MTU выставлять?",
      en: "What MTU should I set?",
    },
    answer: {
      ru: "1500 — стандартный Ethernet и подходит для большинства проводных подключений. 1420 стоит выбрать для PPPoE и мобильных сетей, где часть пакета съедает инкапсуляция. 1280 — минимальный MTU, гарантированный IPv6: вариант на случай, когда соединение устанавливается, но крупные пакеты теряются. Симптом последнего узнаваемый: пинг проходит, лёгкие страницы открываются, а тяжёлые сайты и загрузки зависают.",
      en: "1500 is standard Ethernet and fits most wired links. Choose 1420 for PPPoE and mobile networks, where encapsulation eats part of the packet. 1280 is the minimum MTU IPv6 guarantees — the option to reach for when a connection establishes but large packets vanish. That last failure has a recognisable signature: pings succeed and light pages load, but heavy sites and downloads hang.",
    },
    keywords: ["mtu", "1500", "1420", "1280", "фрагментация"],
  },

  /* ── Troubleshooting ──────────────────────────────────────────────────── */
  {
    id: "not-connecting",
    category: "troubleshooting",
    question: {
      ru: "Конфиг сгенерирован, но соединение не поднимается. С чего начать?",
      en: "The config is generated but the tunnel will not come up. Where do I start?",
    },
    answer: {
      ru: "Сначала проверьте симметрию: H1–H4, S1–S4 и параметры 3.0 обязаны совпадать на сервере и клиенте — это причина большинства случаев. Затем убедитесь, что версия совпадает с тем, что реально поддерживает ваш клиент: конфиг 2.0 на клиенте, знающем только 1.0, не заработает, а параметры 3.0 требуют amneziawg-go 3.0.1 или новее. Если с этим порядок, попробуйте уменьшить Jc до 2–3: некоторые провайдеры режут длинные очереди UDP-пакетов на старте. Наконец, проверьте, что H-диапазоны не пересекаются — генератор это гарантирует, но если конфиг правился руками, пересечение легко внести.",
      en: "Start with symmetry: H1–H4, S1–S4 and the 3.0 parameters must match on server and client — this accounts for most cases. Next confirm the version matches what your client actually supports: a 2.0 config will not work against a client that only knows 1.0, and the 3.0 parameters need amneziawg-go 3.0.1 or newer. If that all checks out, try lowering Jc to 2 or 3, since some providers throttle long UDP bursts at connection start. Finally verify the H ranges do not overlap — the generator guarantees this, but a hand-edited config can easily reintroduce it.",
    },
    keywords: ["не работает", "not working", "handshake", "отладка", "debug"],
  },
  {
    id: "slow-connect",
    category: "troubleshooting",
    question: {
      ru: "Соединение работает, но подключается очень долго.",
      en: "It connects, but setup takes far too long.",
    },
    answer: {
      ru: "Скорее всего дело в junk-пакетах. Каждый из Jc пакетов реально уходит в сеть перед handshake, и на мобильной сети с высокой задержкой это ощутимо. Попробуйте снизить Jc и уменьшить Jmax. Если используются все пять цепочек I1–I5, они тоже отправляются перед каждым handshake — оставьте только I1 и посмотрите, изменится ли ощущение.",
      en: "Junk packets are the usual culprit. Each of the Jc packets genuinely goes out before the handshake, and on a high-latency mobile link that adds up. Try lowering Jc and reducing Jmax. If all five I1–I5 chains are in use they are also sent ahead of every handshake — keep only I1 and see whether it feels different.",
    },
    keywords: ["медленно", "slow", "задержка", "latency", "долго"],
  },
  {
    id: "worked-then-stopped",
    category: "troubleshooting",
    question: {
      ru: "Конфиг работал, а через какое-то время перестал.",
      en: "The config worked, then stopped after a while.",
    },
    answer: {
      ru: "Если разрыв происходит примерно через одинаковые промежутки, дело может быть в таймерах: при некорректных диапазонах в 3.0 сессия обновляет ключи не вовремя и умирает по RejectAfterTime. Сгенерируйте конфиг заново — валидатор такие сочетания не пропускает. Если же конфиг перестал работать после периода нормальной работы и заново не поднимается, вероятнее, что провайдер начал блокировать конкретную сигнатуру: смените профиль мимикрии и перегенерируйте параметры, кнопка «Не работает» усиливает обфускацию с каждой попыткой.",
      en: "If the drops come at roughly regular intervals, the timers may be to blame: with badly chosen 3.0 ranges the session rekeys out of step and dies at RejectAfterTime. Regenerate the config — the validator does not let those combinations through. If instead it worked for a while and now refuses to come up at all, it is more likely your provider started blocking that particular signature: change the mimicry profile and regenerate, and note that the \"not working\" button strengthens obfuscation with each attempt.",
    },
    keywords: ["перестал", "stopped", "разрыв", "drops", "блокировка"],
  },

  /* ── Privacy ──────────────────────────────────────────────────────────── */
  {
    id: "data-leaves",
    category: "privacy",
    question: {
      ru: "Отправляются ли мои ключи или конфиги куда-либо?",
      en: "Are my keys or configs sent anywhere?",
    },
    answer: {
      ru: "Нет. Вся генерация происходит в браузере на вашем устройстве: у проекта нет бэкенда, который мог бы что-то принять. Шрифты тоже загружаются со своего домена, а не из Google Fonts, поэтому сторонних запросов при работе страницы не возникает. Проверить это проще всего самому — откройте вкладку «Сеть» в инструментах разработчика и посмотрите, что уходит во время генерации.",
      en: "No. All generation happens in your browser on your device: the project has no backend that could receive anything. Fonts are served from the site's own domain rather than Google Fonts, so no third-party requests occur while the page is in use. The easiest way to confirm this is to check yourself — open the Network tab in your developer tools and watch what leaves during generation.",
    },
    keywords: ["приватность", "privacy", "данные", "телеметрия", "offline"],
  },
  {
    id: "randomness",
    category: "privacy",
    question: {
      ru: "Насколько случайны генерируемые значения?",
      en: "How random are the generated values?",
    },
    answer: {
      ru: "Все параметры берутся из crypto.getRandomValues() — криптографического источника случайности браузера, того же, что используется для генерации ключей. Math.random() в генераторе не используется нигде. Дополнительно выборка сделана с отбраковкой, чтобы исключить смещение при делении по модулю: без этого некоторые значения выпадали бы чаще других, что для параметров обфускации нежелательно.",
      en: "Every parameter comes from crypto.getRandomValues(), the browser's cryptographic randomness source — the same one used for key generation. Math.random() appears nowhere in the generator. Sampling additionally uses rejection to eliminate modulo bias: without it some values would come up more often than others, which is undesirable for obfuscation parameters.",
    },
    keywords: ["случайность", "randomness", "crypto", "энтропия", "entropy"],
  },
];
