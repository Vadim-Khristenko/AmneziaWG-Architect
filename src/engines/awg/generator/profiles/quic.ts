/**
 * AmneziaWG Architect — QUIC Initial / 0-RTT / HTTP3 profile generators.
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
  quicVarint,
} from "../utils";

/**
 * A QUIC Initial packet, per RFC 9000 §17.2.
 *
 * The header is built in the order the wire has it, and the Length field is
 * computed rather than filled with random bytes: it is a varint covering the
 * packet number plus everything after it, so it depends on how much padding
 * follows. That means the padding is decided first and the header assembled
 * around it.
 *
 * First byte: `1` header form, `1` fixed bit, `00` type Initial, `RR` reserved
 * (encrypted on the wire, so any value is plausible), `PP` packet number
 * length minus one. The client's first Initial must carry a Destination
 * Connection ID of at least 8 bytes (§7.2), and both connection IDs cap at 20.
 */
export function mkQUICi(input: GeneratorInput, iv: number): string {
  const host = getHost(input, "quic_initial");
  const dcid = rnd(8, 20);
  const scid = rnd(0, 20);
  const tokenLen = rnd(0, 1) === 0 ? 0 : rnd(8, 32);
  const sniRc = Math.min(host.length + rnd(0, 6), 64);
  const pnLen = rnd(1, 4);

  const prefix =
    hexPad(0xc0 | (pnLen - 1), 1) +
    "00000001" +
    hexPad(dcid, 1) +
    rh(dcid) +
    hexPad(scid, 1) +
    rh(scid) +
    quicVarint(tokenLen) +
    rh(tokenLen);

  const extraB =
    (input.useTagRC ? sniRc : 0) +
    (input.useTagC ? 4 : 0) +
    (input.useTagT ? 4 : 0);

  // The padding is the packet's payload, so it has to be known before the
  // Length that covers it. Two bytes are reserved for the Length varint —
  // anything past 63 bytes of payload needs them, and a QUIC Initial that
  // short would be strange in itself.
  const headerB = prefix.length / 2 + 2 + pnLen;
  const pad = calcPadding(headerB, extraB, getFpRange(input, "qi"), iv, input.mtu);

  const hex = assertEvenHex(
    prefix + quicVarint(pnLen + pad) + rh(pnLen),
    "mkQUICi",
  );

  return (
    `<b 0x${hex}>` +
    (input.useTagRC ? `<rc ${sniRc}>` : "") +
    (input.useTagC ? "<c>" : "") +
    (input.useTagT ? "<t>" : "") +
    (input.useTagR ? splitPad(pad) : "")
  );
}

export function mkQUIC0(input: GeneratorInput, iv: number): string {
  const host = getHost(input, "quic_0rtt");
  const dcid = rnd(8, 20);
  const scid = rnd(0, 20);
  const ticketHint = Math.min(host.length + rnd(4, 16), 48);

  const hex = assertEvenHex(
    hexPad(0xd0 | rnd(0, 3), 1) +
      "00000001" +
      hexPad(dcid, 1) +
      rh(dcid) +
      hexPad(scid, 1) +
      rh(scid) +
      rh(4),
    "mkQUIC0",
  );

  const mtu = input.mtu;
  const headerB = hex.length / 2;
  const extraB =
    (input.useTagRC ? ticketHint : 0) +
    (input.useTagC ? 4 : 0) +
    (input.useTagT ? 4 : 0);
  const pad = calcPadding(headerB, extraB, getFpRange(input, "q0"), iv, mtu);

  return (
    `<b 0x${hex}>` +
    (input.useTagT ? "<t>" : "") +
    (input.useTagR ? splitPad(pad) : "") +
    (input.useTagRC ? `<rc ${ticketHint}>` : "") +
    (input.useTagC ? "<c>" : "")
  );
}

export function mkHTTP3(input: GeneratorInput, iv: number): string {
  const host = getHost(input, "quic_initial");
  const ptypes = [0xc0, 0xc1, 0xc2, 0xc3, 0xe0, 0xe1, 0xe2];
  const dcid = rnd(8, 20);
  const scid = rnd(0, 20);
  const sniLen = Math.min(host.length + 9 + rnd(0, 6), 64);

  const hex = assertEvenHex(
    hexPad(ptypes[rnd(0, ptypes.length - 1)], 1) +
      "00000001" +
      hexPad(dcid, 1) +
      rh(dcid) +
      hexPad(scid, 1) +
      rh(scid) +
      rh(4),
    "mkHTTP3",
  );

  const mtu = input.mtu;
  const headerB = hex.length / 2;
  const extraB =
    (input.useTagRC ? sniLen : 0) +
    (input.useTagC ? 4 : 0) +
    (input.useTagT ? 4 : 0);
  const pad = calcPadding(headerB, extraB, getFpRange(input, "h3"), iv, mtu);

  return (
    `<b 0x${hex}>` +
    (input.useTagRC ? `<rc ${sniLen}>` : "") +
    (input.useTagR ? splitPad(pad) : "") +
    (input.useTagC ? "<c>" : "") +
    (input.useTagT ? "<t>" : "")
  );
}
