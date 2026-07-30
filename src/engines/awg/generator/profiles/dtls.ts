/**
 * AmneziaWG Architect — DTLS 1.2/1.3 Client Hello profile generator.
 */

import type { GeneratorInput } from "../types";
import {
  rnd,
  rh,
  hexPad,
  assertEvenHex,
  calcPadding,
  splitPad,
  getHost,
  getFpRange,
} from "../utils";

export function mkDTLS(input: GeneratorInput, iv: number): string {
  const host = getHost(input, "dtls");
  const fragLen = rnd(100, 300);
  const sniRc = Math.min(host.length + rnd(2, 8), 60);
  const epoch = rnd(0, 255);

  const hex = assertEvenHex(
    "16" +
      "fefd" +
      hexPad(epoch, 2) +
      rh(6) +
      hexPad(fragLen, 2) +
      "01" +
      rh(6) +
      "fefd0000" +
      rh(4) +
      rh(32),
    "mkDTLS",
  );

  const mtu = input.mtu;
  const headerB = hex.length / 2;
  const extraB =
    (input.useTagRC ? sniRc : 0) +
    (input.useTagC ? 4 : 0) +
    (input.useTagT ? 4 : 0);
  const pad = calcPadding(headerB, extraB, getFpRange(input, "dtls"), iv, mtu);

  return (
    `<b 0x${hex}>` +
    (input.useTagRC ? `<rc ${sniRc}>` : "") +
    (input.useTagC ? "<c>" : "") +
    (input.useTagT ? "<t>" : "") +
    (input.useTagR ? splitPad(pad) : "")
  );
}
