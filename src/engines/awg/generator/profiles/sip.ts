/**
 * AmneziaWG Architect — SIP REGISTER profile generator.
 */

import type { GeneratorInput } from "../types";
import { rnd, rh, assertEvenHex, calcPadding, splitPad, getHost } from "../utils";

export function mkSIP(input: GeneratorInput, iv: number): string {
  const host = getHost(input, "sip");
  let hostHex = "";
  for (let i = 0; i < host.length; i++) {
    hostHex += host.charCodeAt(i).toString(16).padStart(2, "0");
  }

  const hex = assertEvenHex(
    "524547495354455220736970" + // "REGISTER sip"
      "3a" + // ":"
      hostHex + // host as ASCII hex
      "20" + // " "
      rh(4),
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
      mtu - headerB - rcVal - (input.useTagC ? 4 : 0) - (input.useTagT ? 4 : 0),
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
