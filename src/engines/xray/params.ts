/**
 * Every XRay parameter this product knows about, described once.
 *
 * AmneziaWG got this treatment first and it immediately paid for itself:
 * "which version has S3" stopped being a question you answered by reading
 * four files. XRay had nothing equivalent — its version rules lived as
 * booleans inside the generator, which is exactly how three of them ended up
 * disagreeing with the released cores.
 *
 * Two things make this catalogue different from AmneziaWG's:
 *
 *   1. It is deliberately larger than what the generator emits today. Every
 *      entry carries `generated`, so "what is left to support" is a query
 *      against data rather than an opinion, and `params.test.ts` fails if the
 *      generator and the catalogue drift apart.
 *   2. `since` is a CalVer string, so the ordering is the version list's, not
 *      a string comparison's.
 *
 * Field names and constraints are read from Xray-core v26.7.11:
 * `infra/conf/transport_internet.go`, `transport_security.go` and
 * `transport_method.go`. Where a bound is stated, it is one the core enforces
 * — not advice.
 */

import type { ParamDescriptor, ParamSet } from "@/types/protocol";
import {
  hasParam as hasParamIn,
  paramFor as paramForIn,
  paramSetFor,
  paramsInScope,
  type ParamCatalogue,
} from "@/shared/params";
import { XRAY_VERSIONS } from "./versions";

/**
 * An XRay parameter, plus whether the generator produces it yet.
 *
 * The flag is on the catalogue rather than in a TODO comment because a
 * comment cannot be tested. `generated: false` means the core accepts the
 * parameter and Architect does not offer it — a gap, listed where it can be
 * counted.
 */
export interface XrayParam extends ParamDescriptor {
  /** Which block of the config it belongs to, for grouping in the UI. */
  group:
    | "inbound"
    | "reality"
    | "tls"
    | "vless"
    | "xhttp"
    | "xmux"
    | "transport"
    | "sockopt"
    | "finalmask";
  /** True when `generateXray` emits it today. */
  generated: boolean;
}

const FLOOR = "24.11.11";

/** Shorthand: most entries share the floor version and are server-side. */
function p(param: Omit<XrayParam, "since"> & { since?: string }): XrayParam {
  return { since: FLOOR, ...param };
}

/* ── The catalogue ────────────────────────────────────────────────────────── */

export const XRAY_PARAMETERS: readonly XrayParam[] = [
  /* ── Inbound ──────────────────────────────────────────────────────────── */
  p({
    key: "port",
    group: "inbound",
    kind: "int",
    scope: "shared",
    field: "port",
    bounds: { min: 1, max: 65535 },
    generated: true,
    note: "Порт, который слушает сервер и в который идёт клиент.",
  }),
  p({
    key: "id",
    group: "vless",
    kind: "text",
    scope: "shared",
    field: "clients.0.id",
    generated: true,
    source: "proxy/vless/inbound: non-UUID strings are hashed into one",
    note: "UUID клиента. Строка не-UUID тоже принимается — ядро хеширует её в UUID.",
  }),
  p({
    key: "flow",
    group: "vless",
    kind: "enum",
    scope: "shared",
    field: "clients.0.flow",
    bounds: { oneOf: ["", "xtls-rprx-vision"] },
    generated: true,
    source: "infra/conf/vless.go",
    note: "Vision работает только поверх TLS или REALITY.",
  }),
  p({
    key: "decryption",
    group: "vless",
    kind: "text",
    scope: "shared",
    since: "26.1.13",
    field: "vlessEncryption.decryption",
    generated: true,
    source: "infra/conf/vless.go: mlkem768x25519plus.<mode>.<seconds>.<key>",
    note: "VLESS Encryption. Появилась в v26.1.13 — на v25.8.29 ядро её не знает.",
  }),
  p({
    key: "fallbacks",
    group: "inbound",
    kind: "text",
    scope: "local",
    field: "fallbacks",
    generated: false,
    source: "infra/conf/vless.go: FallbackConfig",
    note: "Куда отдавать трафик, не прошедший аутентификацию.",
  }),

  /* ── REALITY ──────────────────────────────────────────────────────────── */
  p({
    key: "target",
    group: "reality",
    kind: "text",
    scope: "local",
    field: "reality.dest",
    generated: true,
    aliases: ["dest"],
    source: "transport_security.go: c.Target overrides c.Dest",
    note: "Сайт-донор: к нему идёт трафик, не прошедший аутентификацию REALITY.",
  }),
  p({
    key: "serverNames",
    group: "reality",
    kind: "text",
    scope: "shared",
    field: "reality.serverNames",
    generated: true,
    source: 'transport_security.go: empty "serverNames" is refused',
    note: "SNI, которые сервер готов обслужить. Клиент шлёт один из них.",
  }),
  p({
    key: "privateKey",
    group: "reality",
    kind: "key",
    scope: "shared",
    field: "reality.keys.privateKey",
    bounds: { byteLength: 32 },
    generated: true,
    source: "transport_security.go: base64.RawURLEncoding, 32 bytes",
  }),
  p({
    key: "shortIds",
    group: "reality",
    kind: "hex",
    scope: "shared",
    field: "reality.shortIds.0",
    bounds: { max: 16 },
    generated: true,
    source: "transport_security.go: hex.Decode into 8 bytes, length ≤ 16",
    note: "Чётное число hex-символов: нечётное не декодируется.",
  }),
  p({
    key: "xver",
    group: "reality",
    kind: "int",
    scope: "local",
    field: "reality.xver",
    bounds: { min: 0, max: 2 },
    generated: true,
    source: 'transport_security.go: "xver" only accepts 0, 1, 2',
  }),
  p({
    key: "minClientVer",
    group: "reality",
    kind: "text",
    scope: "shared",
    field: "reality.minClientVer",
    generated: true,
    source: "transport_security.go: three bytes, each < 256",
    note: "Пишется только там, где у ядра нет своего дефолта: с v26.7.11 оно подставляет 26.3.27 само, и поле не выдаётся.",
  }),
  p({
    key: "maxClientVer",
    group: "reality",
    kind: "text",
    scope: "shared",
    field: "reality.maxClientVer",
    generated: false,
    source: "transport_security.go: MaxClientVer",
    note: "Верхняя граница версии клиента. Зеркало minClientVer.",
  }),
  p({
    key: "maxTimeDiff",
    group: "reality",
    kind: "int",
    scope: "shared",
    field: "reality.maxTimeDiff",
    generated: false,
    source: "transport_security.go: MaxTimeDiff",
    note: "Допустимое расхождение часов между сторонами, мс.",
  }),
  p({
    key: "mldsa65Seed",
    group: "reality",
    kind: "key",
    scope: "shared",
    since: "25.7.23",
    field: "reality.mldsa65.seed",
    bounds: { byteLength: 32 },
    generated: true,
    source: "transport_security.go: 32 bytes, must differ from privateKey",
    note: "На v25.7.23 обязателен: без него REALITY не стартует.",
  }),
  p({
    key: "mldsa65Verify",
    group: "reality",
    kind: "key",
    scope: "shared",
    since: "25.7.23",
    field: "reality.mldsa65.verify",
    bounds: { byteLength: 1952 },
    generated: false,
    source: "transport_security.go: 1952 bytes",
    note: "Поле есть, но пустое: 1952 байта выводятся из seed самим ML-DSA-65, а этот алгоритм страница не носит. Заполняется командой ядра mldsa65.",
  }),
  p({
    key: "limitFallbackUpload",
    group: "reality",
    kind: "text",
    scope: "local",
    field: "reality.limitFallbackUpload",
    generated: false,
    source: "transport_security.go: LimitFallback",
    note: "Троттлинг трафика, ушедшего на сайт-донор.",
  }),
  p({
    key: "limitFallbackDownload",
    group: "reality",
    kind: "text",
    scope: "local",
    field: "reality.limitFallbackDownload",
    generated: false,
    source: "transport_security.go: LimitFallback",
  }),
  p({
    key: "fingerprint",
    // Not an enum: the uTLS fingerprint list is long, changes between
    // releases and lives in the shared fingerprint registry. A `oneOf` here
    // would go stale the first time uTLS adds a browser.
    group: "reality",
    kind: "text",
    scope: "local",
    field: "reality.fingerprint",
    generated: true,
    source: 'transport_security.go: "unsafe" and "hellogolang" are refused',
    note: "Клиентская сторона: какой браузер имитирует uTLS.",
  }),
  p({
    key: "spiderX",
    group: "reality",
    kind: "text",
    scope: "local",
    field: "reality.spiderX",
    generated: true,
    source: "transport_security.go: must start with /",
    note: "Путь для «паука». Параметры p/c/t/i/r в query задают spiderY.",
  }),
  p({
    key: "spiderY",
    group: "reality",
    kind: "text",
    scope: "local",
    field: "reality.spiderY",
    generated: false,
    source: "transport_security.go: parse(p|c|t|i|r) into ten int64s",
    note: "Тонкая настройка обхода: паддинг, конкурентность, повторы, интервал, возврат.",
  }),

  /* ── XHTTP ────────────────────────────────────────────────────────────── */
  p({
    key: "path",
    group: "xhttp",
    kind: "text",
    scope: "shared",
    field: "xhttp.path",
    generated: true,
    source: "transport_method.go: SplitHTTPConfig.Path",
    note: "Клиент и сервер должны совпасть по пути, иначе запрос уходит в 404.",
  }),
  p({
    key: "host",
    group: "xhttp",
    kind: "text",
    scope: "shared",
    field: "xhttp.host",
    generated: true,
    source: "transport_method.go: priority host > serverName > address",
    note: "Заголовок Host. Пустой — берётся адрес.",
  }),
  p({
    key: "mode",
    group: "xhttp",
    kind: "enum",
    scope: "shared",
    field: "xhttp.resolvedMode",
    bounds: { oneOf: ["auto", "packet-up", "stream-up", "stream-one"] },
    generated: true,
    source: "transport_method.go: unsupported mode is a hard error",
    note: "v24.11.11 не знает stream-one.",
  }),
  p({
    key: "headers",
    group: "xhttp",
    kind: "text",
    scope: "shared",
    field: "xhttp.headers",
    generated: false,
    source: 'transport_method.go: "headers" can not contain "host"',
  }),
  p({
    key: "xPaddingBytes",
    group: "xhttp",
    kind: "range",
    scope: "sender",
    field: "xhttp.paddingBytes",
    generated: true,
    source: "transport_method.go: xPaddingBytes cannot be disabled",
    note: "Обе границы строго больше нуля — иначе ядро отказывается.",
  }),
  p({
    key: "xPaddingObfsMode",
    group: "xhttp",
    kind: "flag",
    scope: "sender",
    field: "xhttp.paddingObfsMode",
    generated: true,
  }),
  p({
    key: "xPaddingPlacement",
    group: "xhttp",
    kind: "enum",
    scope: "shared",
    field: "xhttp.paddingPlacement",
    bounds: { oneOf: ["auto", "cookie", "header", "query", "queryInHeader"] },
    generated: true,
    source: "transport_method.go: default queryInHeader",
    note: "Где едет паддинг. Обе стороны должны его там искать.",
  }),
  p({
    key: "xPaddingKey",
    group: "xhttp",
    kind: "text",
    scope: "shared",
    field: "xhttp.paddingKey",
    generated: false,
    source: "transport_method.go: default x_padding",
    note: "Имя параметра паддинга. Дефолт узнаваем — своё значение менее типично.",
  }),
  p({
    key: "xPaddingHeader",
    group: "xhttp",
    kind: "text",
    scope: "shared",
    field: "xhttp.paddingHeader",
    generated: false,
    source: "transport_method.go: default X-Padding",
  }),
  p({
    key: "xPaddingMethod",
    group: "xhttp",
    kind: "enum",
    scope: "shared",
    field: "xhttp.paddingMethod",
    bounds: { oneOf: ["repeat-x", "tokenish"] },
    generated: false,
    source: "transport_method.go: default repeat-x",
    note: "tokenish делает паддинг похожим на токен, а не на строку из «x».",
  }),
  p({
    key: "uplinkHTTPMethod",
    group: "xhttp",
    kind: "text",
    scope: "shared",
    field: "xhttp.uplinkHttpMethod",
    generated: false,
    source: "transport_method.go: GET only in packet-up mode",
  }),
  p({
    key: "sessionIDPlacement",
    group: "xhttp",
    kind: "enum",
    scope: "shared",
    field: "xhttp.sessionIdPlacement",
    bounds: { oneOf: ["auto", "path", "cookie", "header", "query"] },
    generated: true,
    source: "transport_method.go: default path",
    note: "До v26.6.22 поле называется sessionPlacement.",
  }),
  p({
    key: "sessionIDLength",
    group: "xhttp",
    kind: "range",
    scope: "shared",
    field: "xhttp.sessionIdLength",
    generated: true,
    source: "transport_method.go: checked against sessionIDTable room",
    note: "Длина идентификатора сессии. Вместе с алфавитом задаёт, как он выглядит в URL.",
  }),
  p({
    key: "sessionIDKey",
    group: "xhttp",
    kind: "text",
    scope: "shared",
    field: "xhttp.sessionIdKey",
    generated: false,
    source: "transport_method.go: default x_session / X-Session",
    note: "Имя параметра идентификатора сессии, когда он не в пути.",
  }),
  p({
    key: "sessionIDTable",
    group: "xhttp",
    kind: "text",
    scope: "shared",
    field: "xhttp.sessionIdTable",
    generated: false,
    source: "transport_method.go: ASCII only, room must exceed 2^31",
    note: "Алфавит идентификатора сессии. Меняет то, как он выглядит в URL.",
  }),
  p({
    key: "seqPlacement",
    group: "xhttp",
    kind: "enum",
    scope: "shared",
    field: "xhttp.seqPlacement",
    bounds: { oneOf: ["path", "cookie", "header", "query"] },
    generated: false,
    source: "transport_method.go: default path",
    note: "Где едет номер части. Обе стороны должны читать его из одного места.",
  }),
  p({
    key: "seqKey",
    group: "xhttp",
    kind: "text",
    scope: "shared",
    field: "xhttp.seqKey",
    generated: false,
    source: "transport_method.go: default x_seq / X-Seq",
    note: "Имя параметра для номера части, когда он не в пути.",
  }),
  p({
    key: "uplinkDataPlacement",
    group: "xhttp",
    kind: "enum",
    scope: "shared",
    field: "xhttp.uplinkDataPlacement",
    bounds: { oneOf: ["auto", "body", "cookie", "header"] },
    generated: false,
    source: "transport_method.go: cookie/header only in packet-up",
  }),
  p({
    key: "uplinkDataKey",
    group: "xhttp",
    kind: "text",
    scope: "shared",
    field: "xhttp.uplinkDataKey",
    generated: false,
    source: "transport_method.go: default x_data / X-Data",
    note: "Имя параметра, в котором едут данные восходящего потока.",
  }),
  p({
    key: "uplinkChunkSize",
    group: "xhttp",
    kind: "range",
    scope: "sender",
    field: "xhttp.uplinkChunkSize",
    generated: false,
  }),
  p({
    key: "noGRPCHeader",
    group: "xhttp",
    kind: "flag",
    scope: "shared",
    field: "xhttp.noGrpcHeader",
    generated: true,
    source: "transport_method.go: NoGRPCHeader",
    note: "Убирает заголовок, по которому поток выглядит как gRPC.",
  }),
  p({
    key: "noSSEHeader",
    group: "xhttp",
    kind: "flag",
    scope: "shared",
    field: "xhttp.noSseHeader",
    generated: true,
    source: "transport_method.go: NoSSEHeader",
    note: "Убирает заголовок, по которому поток выглядит как SSE.",
  }),
  p({
    key: "scMaxEachPostBytes",
    group: "xhttp",
    kind: "range",
    scope: "sender",
    field: "xhttp.scMaxEachPostBytes",
    generated: false,
    note: "Сколько байт уходит одним POST. Заметно влияет на форму трафика.",
  }),
  p({
    key: "scMinPostsIntervalMs",
    group: "xhttp",
    kind: "range",
    scope: "sender",
    field: "xhttp.scMinPostsIntervalMs",
    generated: false,
  }),
  p({
    key: "scMaxBufferedPosts",
    group: "xhttp",
    kind: "int",
    scope: "sender",
    field: "xhttp.scMaxBufferedPosts",
    generated: false,
  }),
  p({
    key: "scStreamUpServerSecs",
    group: "xhttp",
    kind: "range",
    scope: "sender",
    field: "xhttp.scStreamUpServerSecs",
    generated: false,
  }),
  p({
    key: "serverMaxHeaderBytes",
    group: "xhttp",
    kind: "int",
    scope: "local",
    field: "xhttp.serverMaxHeaderBytes",
    bounds: { min: 0 },
    generated: false,
    source: "transport_method.go: negative is refused",
  }),
  p({
    key: "downloadSettings",
    group: "xhttp",
    kind: "text",
    scope: "shared",
    field: "xhttp.downloadSettings",
    generated: false,
    source: "transport_method.go: forbidden in stream-one mode",
    note: "Отдельный транспорт под нисходящий поток.",
  }),

  /* ── XMUX ─────────────────────────────────────────────────────────────── */
  p({
    key: "maxConcurrency",
    group: "xmux",
    kind: "range",
    scope: "sender",
    field: "xhttp.xmuxMaxConcurrency",
    generated: true,
    source: "transport_method.go: cannot be set together with maxConnections",
  }),
  p({
    key: "maxConnections",
    group: "xmux",
    kind: "range",
    scope: "sender",
    field: "xhttp.xmuxMaxConnections",
    generated: true,
  }),
  p({
    key: "cMaxReuseTimes",
    group: "xmux",
    kind: "range",
    scope: "sender",
    field: "xhttp.xmuxCMaxReuseTimes",
    generated: false,
  }),
  p({
    key: "hMaxRequestTimes",
    group: "xmux",
    kind: "range",
    scope: "sender",
    field: "xhttp.xmuxHMaxRequestTimes",
    generated: false,
  }),
  p({
    key: "hMaxReusableSecs",
    group: "xmux",
    kind: "range",
    scope: "sender",
    field: "xhttp.xmuxHMaxReusableSecs",
    generated: false,
  }),
  p({
    key: "hKeepAlivePeriod",
    group: "xmux",
    kind: "int",
    scope: "sender",
    field: "xhttp.xmuxHKeepAlivePeriod",
    generated: false,
  }),

  /* ── Other transports ─────────────────────────────────────────────────── */
  p({
    key: "acceptProxyProtocol",
    group: "transport",
    kind: "flag",
    scope: "local",
    field: "raw.acceptProxyProtocol",
    generated: false,
    source: "transport_method.go: TCPConfig, WebSocketConfig, HttpUpgradeConfig",
  }),
  p({
    key: "header",
    group: "transport",
    kind: "text",
    scope: "shared",
    field: "raw.header",
    generated: false,
    source: "transport_method.go: tcpHeaderLoader, none | http",
    note: "HTTP-маскировка поверх RAW: своя мимикрия, отдельная от REALITY.",
  }),
  p({
    key: "heartbeatPeriod",
    group: "transport",
    kind: "int",
    scope: "sender",
    field: "ws.heartbeatPeriod",
    generated: false,
    source: "transport_method.go: WebSocketConfig",
  }),
  p({
    key: "serviceName",
    group: "transport",
    kind: "text",
    scope: "shared",
    field: "grpc.serviceName",
    generated: false,
    source: "transport_method.go: GRPCConfig",
  }),
  p({
    key: "multiMode",
    group: "transport",
    kind: "flag",
    scope: "shared",
    field: "grpc.multiMode",
    generated: false,
    source: "transport_method.go: GRPCConfig.MultiMode",
    note: "Обе стороны должны совпасть: односторонний multiMode ломает поток.",
  }),
  p({
    key: "hysteria",
    group: "transport",
    kind: "text",
    scope: "shared",
    since: "26.1.13",
    field: "hysteria",
    generated: false,
    source: "transport_method.go: HysteriaConfig, version must be 2",
    note: "Транспорт Hysteria 2 с маскарадом. Версии ниже v26.1.13 его не знают.",
  }),

  /* ── sockopt and finalmask ────────────────────────────────────────────── */
  p({
    key: "sockopt",
    group: "sockopt",
    kind: "text",
    scope: "local",
    field: "sockopt",
    generated: false,
    source: "transport_internet.go: SocketConfig",
    note: "Настройки сокета: mark, TCP Fast Open, tproxy, интерфейс.",
  }),
  p({
    key: "finalmask",
    group: "finalmask",
    kind: "text",
    scope: "shared",
    since: "26.6.22",
    field: "finalmask",
    generated: false,
    source: "transport_internet.go: FinalMask, Tcpmasks / Udpmasks / QuicParams",
    note: "Собственная обфускация XRay поверх транспорта — ближайший аналог того, чем занимается AmneziaWG.",
  }),
];

/* ── Sets and questions ───────────────────────────────────────────────────── */

/** The catalogue with XRay's version ordering — oldest first. */
export const XRAY_CATALOGUE: ParamCatalogue = {
  parameters: XRAY_PARAMETERS,
  order: [...XRAY_VERSIONS].map((v) => v.id).reverse(),
};

/** Parameters a version understands. */
export function xrayParamsFor(version: string): ParamSet {
  return paramSetFor(XRAY_CATALOGUE, version);
}

/** The description a version uses for a key, if it has one. */
export function xrayParamFor(version: string, key: string) {
  return paramForIn(XRAY_CATALOGUE, version, key);
}

/** Does this version understand this key at all? */
export function xrayHasParam(version: string, key: string): boolean {
  return hasParamIn(XRAY_CATALOGUE, version, key);
}

/** Parameters both ends must agree on. */
export function xraySharedParams(version: string): ParamSet {
  return paramsInScope(XRAY_CATALOGUE, version, "shared");
}

/* ── Coverage ─────────────────────────────────────────────────────────────── */

/** Parameters the generator emits today. */
export const XRAY_GENERATED = XRAY_PARAMETERS.filter((p) => p.generated);

/**
 * Parameters the core accepts and Architect does not offer yet.
 *
 * This list is the roadmap. It is data rather than a comment so it can be
 * counted, grouped and shown — and so that adding support for one means
 * flipping a flag, not remembering to delete a TODO.
 */
export const XRAY_MISSING = XRAY_PARAMETERS.filter((p) => !p.generated);

/** How much of the known surface is generated, per block. */
export function xrayCoverage(): Record<string, { done: number; total: number }> {
  const out: Record<string, { done: number; total: number }> = {};
  for (const param of XRAY_PARAMETERS) {
    const bucket = (out[param.group] ??= { done: 0, total: 0 });
    bucket.total += 1;
    if (param.generated) bucket.done += 1;
  }
  return out;
}
