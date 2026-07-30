/**
 * AmneziaWG Architect — DNS query profile generator.
 */

import type { GeneratorInput } from "../types";
import { rnd, rh, assertEvenHex, calcPadding, splitPad, getHost } from "../utils";

export function mkDNS(input: GeneratorInput, iv: number): string {
  const host = getHost(input, "dns_query");

  let queryNameHex = "";
  const labels = host.split(".");
  for (const label of labels) {
    const lenHex = label.length.toString(16).padStart(2, "0");
    const labelHex = Array.from(label)
      .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("");
    queryNameHex += lenHex + labelHex;
  }
  queryNameHex += "00";

  const txid = rh(2);
  const flags = "0100";
  const qdcount = "0001";
  const ancount = "0000";
  const nscount = "0000";
  const arcount = "0000";
  const qtype = iv % 2 === 0 ? "0001" : "001c";
  const qclass = "0001";

  const dnsQueryHex =
    txid + flags + qdcount + ancount + nscount + arcount + queryNameHex + qtype + qclass;

  const hex = assertEvenHex(dnsQueryHex, "mkDNS");

  const mtu = input.mtu;
  const headerB = hex.length / 2;
  const targetSize = rnd(64, Math.min(512, mtu - 20));
  const rLen = Math.max(0, targetSize - headerB);

  return (
    `<b 0x${hex}>` +
    (input.useTagR && rLen > 0 ? splitPad(Math.min(rLen, 200)) : "") +
    (input.useTagT ? "<t>" : "") +
    (input.useTagC ? "<c>" : "")
  );
}
