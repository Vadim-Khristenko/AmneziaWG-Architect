/**
 * Synthetic `vpn://` keys, one per shape the decoder has to survive.
 *
 * Built rather than pasted. Real keys carry real credentials — an Amnezia
 * `api_key` is a live token in someone's account — so none belong in a
 * repository, and a fixture that has to be redacted before it can be committed
 * is a fixture nobody can regenerate.
 *
 * Building them is also the stronger test. The property that matters most here
 * is that the four-byte length header cannot be trusted: the API keys the
 * client issues declare 0xFF whatever they actually contain. Observed in the
 * wild that is an accident of whatever writes them; constructed here it is
 * deliberate and named, so a future change that reintroduces the strict check
 * fails against a case that says why it exists.
 *
 * Every address, key and token below is fake: documentation ranges from
 * RFC 5737 and RFC 3849, and obviously-inert base64.
 */

import pako from "pako";

/* ── Envelopes ────────────────────────────────────────────────────────────── */

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * The compressed envelope: four big-endian bytes, then zlib.
 *
 * `declaredLength` exists so a test can build the dishonest header on purpose.
 * Left out, the header tells the truth — which is what server-issued
 * configuration keys do.
 */
export function encodeCompressed(
  value: unknown,
  declaredLength?: number,
): string {
  const json = new TextEncoder().encode(JSON.stringify(value));
  const body = pako.deflate(json);
  const len = declaredLength ?? json.length;

  const out = new Uint8Array(4 + body.length);
  out[0] = (len >>> 24) & 0xff;
  out[1] = (len >>> 16) & 0xff;
  out[2] = (len >>> 8) & 0xff;
  out[3] = len & 0xff;
  out.set(body, 4);
  return `vpn://${toBase64Url(out)}`;
}

/** No envelope at all — base64 of the JSON, which older keys use. */
export function encodePlain(value: unknown): string {
  return `vpn://${toBase64Url(new TextEncoder().encode(JSON.stringify(value)))}`;
}

/** What the API keys put in their header regardless of payload size. */
export const UNTRUE_HEADER = 0xff;

/* ── API service keys ─────────────────────────────────────────────────────── */

/**
 * The current shape: compressed, `config_version` 2, a service rather than a
 * tunnel — `api_config` describes what to ask for and `auth_data` how to
 * authenticate. It has no containers, so there is nothing here to merge.
 */
export function apiKeyV2(
  serviceType: "amnezia-premium" | "amnezia-free" = "amnezia-premium",
): string {
  return encodeCompressed(
    {
      name: serviceType === "amnezia-free" ? "Amnezia Free" : "Amnezia Premium",
      description: "Example service key, not issued by anyone",
      config_version: 2,
      api_config: {
        service_type: serviceType,
        service_protocol: "awg",
        user_country_code: "ru",
      },
      auth_data: { api_key: "EXAMPLEKEY.0000000000000000000000000000000000" },
    },
    UNTRUE_HEADER,
  );
}

/**
 * The older shape: no envelope, and the fields sit flat rather than under
 * `api_config` / `auth_data`.
 */
export function apiKeyV1(): string {
  return encodePlain({
    config_version: 1.0,
    api_endpoint: "https://192.0.2.10/api/v1/request/awg/",
    protocol: "awg",
    name: "Amnezia Free RU",
    description: "Example service key, not issued by anyone",
    api_key: "EXAMPLEKEY.0000000000000000000000000000000000",
  });
}

/* ── Tunnel keys ──────────────────────────────────────────────────────────── */

const CLIENT_PRIV = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
const CLIENT_PUB = "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=";
const SERVER_PUB = "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC=";
const PSK = "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD=";
const HOST = "198.51.100.7";

function wgQuick(extra = ""): string {
  return [
    "[Interface]",
    "Address = 10.8.1.6/32",
    "DNS = 1.1.1.1, 1.0.0.1",
    `PrivateKey = ${CLIENT_PRIV}`,
    extra,
    "",
    "[Peer]",
    `PublicKey = ${SERVER_PUB}`,
    `PresharedKey = ${PSK}`,
    "AllowedIPs = 0.0.0.0/0, ::/0",
    `Endpoint = ${HOST}:44200`,
    "PersistentKeepalive = 25",
    "",
  ]
    .filter((l) => l !== "")
    .join("\n");
}

/** The inner object a container stores under `last_config`, as a JSON string. */
function lastConfig(extra: Record<string, unknown> = {}, quickExtra = "") {
  return JSON.stringify({
    allowed_ips: ["0.0.0.0/0", "::/0"],
    clientId: CLIENT_PUB,
    client_ip: "10.8.1.6",
    client_priv_key: CLIENT_PRIV,
    client_pub_key: CLIENT_PUB,
    config: wgQuick(quickExtra),
    hostName: HOST,
    mtu: "1420",
    persistent_keep_alive: "25",
    port: 44200,
    psk_key: PSK,
    server_pub_key: SERVER_PUB,
    ...extra,
  });
}

function envelope(container: string, body: Record<string, unknown>) {
  return {
    containers: [{ container, [containerProtocol(container)]: body }],
    defaultContainer: container,
    description: "Example server",
    dns1: "1.1.1.1",
    dns2: "1.0.0.1",
    hostName: HOST,
  };
}

/** The protocol key a container nests its settings under. */
function containerProtocol(container: string): string {
  if (container === "amnezia-wireguard") return "wireguard";
  if (container === "amnezia-xray") return "xray";
  if (container === "amnezia-openvpn") return "openvpn";
  return "awg";
}

/** Plain WireGuard: no obfuscation fields anywhere. */
export function wireguardKey(): string {
  return encodeCompressed(
    envelope("amnezia-wireguard", {
      last_config: lastConfig(),
      port: "44200",
      subnet_address: "10.8.1.0",
      transport_proto: "udp",
    }),
  );
}

/**
 * AmneziaWG. `version` picks how much obfuscation the container carries, which
 * is the difference the field editor has to read.
 */
export function awgKey(version: "1.0" | "2.0" | "3.0" = "2.0"): string {
  const base: Record<string, unknown> = {
    Jc: "4",
    Jmin: "40",
    Jmax: "70",
    H1: "1234567890",
    H2: "1234567891",
    H3: "1234567892",
    H4: "1234567893",
    S1: "60",
    S2: "80",
  };

  if (version !== "1.0") {
    Object.assign(base, {
      S3: "30",
      S4: "20",
      I1: "<b 0xf0f0>",
      I2: "<b 0xa1a1>",
    });
  }

  if (version === "3.0") {
    Object.assign(base, {
      HeaderProtectionKey: "EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE=",
      ContentPaddingAddition: "16",
      RekeyAfterTime: "110-130",
      RekeyTimeout: "4-6",
      RejectAfterTime: "170-190",
      KeepaliveTimeout: "9-11",
      MaxHandshakeAttempts: "17-20",
    });
  }

  /*
   * The obfuscation fields go into the wg-quick text as well, which is what a
   * real AmneziaWG key does — it is the third copy, and the one an editor is
   * most likely to leave behind.
   */
  const quickExtra = Object.entries(base)
    .map(([k, v]) => `${k} = ${String(v)}`)
    .join("\n");

  return encodeCompressed(
    envelope("amnezia-awg", {
      ...base,
      last_config: lastConfig(base, quickExtra),
      port: "44200",
      subnet_address: "10.8.1.0",
      transport_proto: "udp",
    }),
  );
}

/**
 * XRay inside a `vpn://` key.
 *
 * The field names are the client's own, from
 * `client/core/utils/constants/configKeys.h` — `xray_security`, `xray_flow`
 * and the `xhttp_*` family — rather than the query names a `vless://` link
 * uses. The two describe the same connection in different vocabularies.
 */
export function xrayKey(): string {
  return encodeCompressed(
    envelope("amnezia-xray", {
      last_config: JSON.stringify({
        config: JSON.stringify({ outbounds: [{ protocol: "vless" }] }),
        // The client identifier lives with the address, one level in, which
        // is where a link has to be assembled from.
        clientId: "b831381d-6324-4d53-ad4f-8cda48b30811",
        hostName: HOST,
        port: 443,
      }),
      xray_security: "reality",
      xray_flow: "xtls-rprx-vision",
      xray_fingerprint: "chrome",
      xray_sni: "www.example.com",
      xray_transport: "xhttp",
      xhttp_mode: "Auto",
      xhttp_path: "/example",
      port: "443",
      transport_proto: "tcp",
    }),
  );
}

/** Two containers in one key — what merging produces and has to re-read. */
export function multiContainerKey(): string {
  const awg = JSON.parse(
    JSON.stringify({ container: "amnezia-awg", awg: { Jc: "4", Jmin: "40", Jmax: "70" } }),
  );
  const xray = { container: "amnezia-xray", xray: { xray_security: "reality" } };
  return encodeCompressed({
    containers: [awg, xray],
    defaultContainer: "amnezia-awg",
    description: "Example server",
    hostName: HOST,
  });
}
