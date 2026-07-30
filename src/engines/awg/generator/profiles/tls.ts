/**
 * AmneziaWG Architect — TLS 1.3 Client Hello profile generator.
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
  alignTo128,
  CHROMIUM_PROFILES,
} from "../utils";

export function mkTLS(input: GeneratorInput, iv: number): string {
  const host = getHost(input, "tls_client_hello");
  const sniExt = 2 + 2 + 2 + 1 + 2 + host.length;
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
    Math.max(0, mtu - 44 - sniRc - (input.useTagC ? 4 : 0) - (input.useTagT ? 4 : 0)),
  );

  const hex = assertEvenHex(
    "160301" +
      hexPad(recLen, 2) +
      "01" +
      hexPad(hsLen, 3) +
      "0303" +
      rh(32),
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
