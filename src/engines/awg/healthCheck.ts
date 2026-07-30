/**
 * AmneziaWG Architect — Config Health Checker.
 *
 * Validates a wg-quick / AmneziaWG .conf for structural correctness,
 * required fields, key format, and client-specific compatibility.
 *
 * Pure module — returns findings, never throws.
 */

import type { Finding } from "@/engines/awg/awgValidate";
import { parseConf, getField } from "@/engines/awg/awgFormat";
import { validateAwgParams } from "@/engines/awg/awgValidate";
import { CLIENTS, DEFAULT_CLIENT_ID } from "@/engines/awg/generator/clients";

const AWG_FIELDS = [
  "Jc",
  "Jmin",
  "Jmax",
  "S1",
  "S2",
  "S3",
  "S4",
  "H1",
  "H2",
  "H3",
  "H4",
  "I1",
  "I2",
  "I3",
  "I4",
  "I5",
];

const REQUIRED_INTERFACE_FIELDS = ["PrivateKey", "Address"];
const REQUIRED_PEER_FIELDS = ["PublicKey", "Endpoint"];

function isBase64(s: string): boolean {
  if (!s) return false;
  return /^[A-Za-z0-9+/]+={0,2}$/.test(s) && s.length >= 32;
}

function isValidEndpoint(s: string): boolean {
  if (!s) return false;
  // IPv4:port, [IPv6]:port, hostname:port
  return /^((\[?[\dA-Fa-f:]+]?)|([\w\-.]+)):\d{1,5}$/.test(s);
}

/**
 * Run a health check on a wg-quick / AmneziaWG .conf text.
 *
 * @param confText   the raw .conf text
 * @param clientId   optional target client id from the compatibility matrix
 * @returns          array of findings (error / warn)
 */
export function healthCheckConf(
  confText: string,
  clientId?: string,
): Finding[] {
  const out: Finding[] = [];

  let parsed;
  try {
    parsed = parseConf(confText);
  } catch (e) {
    out.push({
      field: "parse",
      level: "error",
      msg: "Не удалось разобрать .conf: " + (e instanceof Error ? e.message : String(e)),
    });
    return out;
  }

  const sections = parsed.sections;
  const iface = sections.find((s) => s.name === "Interface");
  const peers = sections.filter((s) => s.name === "Peer");

  if (!iface) {
    out.push({ field: "[Interface]", level: "error", msg: "Отсутствует секция [Interface]." });
    return out;
  }

  if (peers.length === 0) {
    out.push({
      field: "[Peer]",
      level: "warn",
      msg: "Нет секций [Peer] — конфиг только для сервера?",
    });
  }

  // Required interface fields
  for (const key of REQUIRED_INTERFACE_FIELDS) {
    const value = getField(parsed, key);
    if (!value) {
      out.push({ field: key, level: "error", msg: `Отсутствует обязательное поле ${key}.` });
    }
  }

  // PrivateKey format
  const privateKey = getField(parsed, "PrivateKey");
  if (privateKey && !isBase64(privateKey)) {
    out.push({
      field: "PrivateKey",
      level: "error",
      msg: "PrivateKey не выглядит как валидный base64 WireGuard-ключ.",
    });
  }

  // Peer checks
  peers.forEach((peer, idx) => {
    for (const key of REQUIRED_PEER_FIELDS) {
      const value = peer.entries.find((e) => e.key === key)?.value;
      if (!value) {
        out.push({
          field: `${key}#${idx + 1}`,
          level: "error",
          msg: `Peer #${idx + 1}: отсутствует ${key}.`,
        });
      }
    }

    const pubkey = peer.entries.find((e) => e.key === "PublicKey")?.value;
    if (pubkey && !isBase64(pubkey)) {
      out.push({
        field: `PublicKey#${idx + 1}`,
        level: "error",
        msg: `Peer #${idx + 1}: PublicKey не выглядит как валидный base64-ключ.`,
      });
    }

    const endpoint = peer.entries.find((e) => e.key === "Endpoint")?.value;
    if (endpoint && !isValidEndpoint(endpoint)) {
      out.push({
        field: `Endpoint#${idx + 1}`,
        level: "warn",
        msg: `Peer #${idx + 1}: Endpoint имеет нестандартный формат.`,
      });
    }
  });

  // AWG-specific obfuscation checks
  const hasAnyAwkField = AWG_FIELDS.some((key) => getField(parsed, key) !== null);
  if (!hasAnyAwkField) {
    out.push({
      field: "AWG",
      level: "warn",
      msg: "В конфиге не найдены параметры AmneziaWG (H/S/J/I). Возможно, это обычный WireGuard.",
    });
  } else {
    // Build flat param map for awgValidate
    const params: Record<string, string | number> = {};
    for (const key of AWG_FIELDS) {
      const value = getField(parsed, key);
      if (value !== null) params[key] = value;
    }
    out.push(...validateAwgParams(params));

    // Client compatibility check
    const targetClient = clientId ?? DEFAULT_CLIENT_ID;
    const client = CLIENTS[targetClient];
    if (client) {
      // S4 client limit
      const s4 = params.S4 !== undefined ? Number(params.S4) : NaN;
      if (!Number.isNaN(s4) && s4 > client.maxS4) {
        out.push({
          field: "S4",
          level: "error",
          msg: `S4=${s4} превышает лимит ${client.maxS4} для ${client.name}.`,
        });
      }

      // Jc client limit
      const jc = params.Jc !== undefined ? Number(params.Jc) : NaN;
      if (!Number.isNaN(jc) && jc > client.maxJc) {
        out.push({
          field: "Jc",
          level: "warn",
          msg: `Jc=${jc} превышает рекомендуемый максимум ${client.maxJc} для ${client.name}.`,
        });
      }

      // Unsupported CPS tags
      const cps = ["I1", "I2", "I3", "I4", "I5"]
        .map((k) => String(params[k] ?? ""))
        .join(" ");
      if (cps.includes("<c>") && !client.supportsCpsTagC) {
        out.push({
          field: "I1-I5",
          level: "error",
          msg: `Тег <c> не поддерживается клиентом ${client.name}.`,
        });
      }
      if (/<rc\s+\d+>/.test(cps) && !client.supportsCpsTagRC) {
        out.push({
          field: "I1-I5",
          level: "error",
          msg: `Тег <rc N> не поддерживается клиентом ${client.name}.`,
        });
      }
      if (/<rd\s+\d+>/.test(cps) && !client.supportsCpsTagRD) {
        out.push({
          field: "I1-I5",
          level: "error",
          msg: `Тег <rd N> не поддерживается клиентом ${client.name}.`,
        });
      }
    }
  }

  return out;
}
