import { describe, it, expect } from "vitest";

import { awgEngine } from "../index";
import { genCfg, type GeneratorInput } from "@/engines/awg/generator";
import {
  quicVarint,
  quicVarintLength,
} from "@/engines/awg/generator/utils";

/**
 * The junk packet is supposed to *be* a QUIC Initial, not merely resemble
 * one. Anything that parses QUIC rather than glancing at it reads the Length
 * field, and a Length of four random bytes does not decode to the length of
 * what follows.
 *
 * So this test parses what the generator emits, the way a QUIC stack would.
 */

const seeded = (over: Partial<GeneratorInput> = {}): GeneratorInput => ({
  ...awgEngine.createDefaults(),
  profile: "quic_initial",
  useTagR: true,
  useTagRC: false,
  useTagC: false,
  useTagT: false,
  ...over,
});

/** The `<b 0x…>` blob and the total bytes of `<r N>` padding after it. */
function readChain(chain: string): { header: Uint8Array; padding: number } {
  const blob = /<b 0x([0-9a-fA-F]*)>/.exec(chain);
  if (!blob) throw new Error(`no <b> tag in: ${chain}`);

  const hex = blob[1]!;
  const header = new Uint8Array(hex.length / 2);
  for (let i = 0; i < header.length; i++) {
    header[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  const padding = [...chain.matchAll(/<r (\d+)>/g)].reduce(
    (sum, m) => sum + Number(m[1]),
    0,
  );
  return { header, padding };
}

/** Read a QUIC variable-length integer at `at`. RFC 9000 §16. */
function readVarint(bytes: Uint8Array, at: number): { value: number; size: number } {
  const first = bytes[at]!;
  const size = 1 << (first >> 6);
  let value = first & 0x3f;
  for (let i = 1; i < size; i++) value = value * 256 + bytes[at + i]!;
  return { value, size };
}

/** Parse the header the way a QUIC stack would, failing loudly if it cannot. */
function parseInitial(header: Uint8Array) {
  let at = 0;
  const first = header[at++]!;

  const version =
    (header[at++]! << 24) |
    (header[at++]! << 16) |
    (header[at++]! << 8) |
    header[at++]!;

  const dcidLen = header[at++]!;
  at += dcidLen;
  const scidLen = header[at++]!;
  at += scidLen;

  const token = readVarint(header, at);
  at += token.size + token.value;

  const length = readVarint(header, at);
  at += length.size;

  const pnLen = (first & 0x03) + 1;
  at += pnLen;

  return {
    headerForm: first >> 7,
    fixedBit: (first >> 6) & 1,
    packetType: (first >> 4) & 0x03,
    pnLen,
    version: version >>> 0,
    dcidLen,
    scidLen,
    tokenLen: token.value,
    length: length.value,
    consumed: at,
  };
}

describe("quicVarint", () => {
  it("uses one byte below 64", () => {
    expect(quicVarint(0)).toBe("00");
    expect(quicVarint(63)).toBe("3f");
    expect(quicVarintLength(63)).toBe(1);
  });

  it("uses two bytes up to 16383, with the 01 prefix", () => {
    expect(quicVarint(64)).toBe("4040");
    expect(quicVarint(16383)).toBe("7fff");
    expect(quicVarintLength(16383)).toBe(2);
  });

  it("uses four bytes above that, with the 10 prefix", () => {
    expect(quicVarint(16384)).toBe("80004000");
    expect(quicVarintLength(16384)).toBe(4);
  });

  it("round-trips through the reader", () => {
    for (const value of [0, 1, 63, 64, 500, 16383, 16384, 1_000_000]) {
      const hex = quicVarint(value);
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
      }
      expect(readVarint(bytes, 0).value, String(value)).toBe(value);
    }
  });
});

describe("the QUIC Initial the generator emits", () => {
  it("parses as a long-header Initial of version 1", () => {
    for (let attempt = 0; attempt < 30; attempt++) {
      const { header } = readChain(genCfg(seeded()).i1);
      const packet = parseInitial(header);

      expect(packet.headerForm, "header form").toBe(1);
      // The fixed bit is called fixed because it must be 1; a zero there is
      // how a middlebox spots something that is not QUIC.
      expect(packet.fixedBit, "fixed bit").toBe(1);
      expect(packet.packetType, "packet type").toBe(0);
      expect(packet.version, "version").toBe(0x0000_0001);
    }
  });

  it("gives the connection IDs lengths the RFC allows", () => {
    for (let attempt = 0; attempt < 30; attempt++) {
      const { header } = readChain(genCfg(seeded()).i1);
      const packet = parseInitial(header);

      // A client's first Initial must carry a DCID of at least 8 bytes; both
      // IDs cap at 20.
      expect(packet.dcidLen, "dcid").toBeGreaterThanOrEqual(8);
      expect(packet.dcidLen, "dcid").toBeLessThanOrEqual(20);
      expect(packet.scidLen, "scid").toBeLessThanOrEqual(20);
    }
  });

  it("writes a Length that covers the packet number and the payload", () => {
    // This is the one that was wrong: the field used to be four random bytes,
    // so it decoded to some enormous number unrelated to what followed.
    for (let attempt = 0; attempt < 30; attempt++) {
      const chain = genCfg(seeded()).i1;
      const { header, padding } = readChain(chain);
      const packet = parseInitial(header);

      expect(packet.length, `attempt ${attempt}: ${chain.slice(0, 60)}`).toBe(
        packet.pnLen + padding,
      );
    }
  });

  it("consumes the whole header, with nothing left over", () => {
    for (let attempt = 0; attempt < 30; attempt++) {
      const { header } = readChain(genCfg(seeded()).i1);
      // A parser that ends anywhere but the end of the blob means the header
      // has a field the generator wrote at the wrong width.
      expect(parseInitial(header).consumed).toBe(header.length);
    }
  });

  it("still parses with every tag turned on", () => {
    for (let attempt = 0; attempt < 20; attempt++) {
      const cfg = genCfg(
        seeded({ useTagC: true, useTagT: true, useTagRC: true }),
      );
      const { header } = readChain(cfg.i1);
      const packet = parseInitial(header);

      expect(packet.fixedBit).toBe(1);
      expect(packet.consumed).toBe(header.length);
    }
  });
});

describe("the other QUIC packets the generator emits", () => {
  /** Long-header packets share everything up to the token, which varies. */
  function parseLongHeader(header: Uint8Array, hasToken: boolean) {
    let at = 0;
    const first = header[at++]!;
    at += 4; // version

    const dcidLen = header[at++]!;
    at += dcidLen;
    const scidLen = header[at++]!;
    at += scidLen;

    if (hasToken) {
      const token = readVarint(header, at);
      at += token.size + token.value;
    }

    const length = readVarint(header, at);
    at += length.size;

    const pnLen = (first & 0x03) + 1;
    at += pnLen;

    return {
      packetType: (first >> 4) & 0x03,
      fixedBit: (first >> 6) & 1,
      pnLen,
      length: length.value,
      consumed: at,
    };
  }

  it("writes 0-RTT with no token field, and a Length that adds up", () => {
    for (let attempt = 0; attempt < 30; attempt++) {
      const { header, padding } = readChain(
        genCfg(seeded({ profile: "quic_0rtt" })).i1,
      );
      // 0-RTT is type 01, and RFC 9000 gives only Initial a token.
      const packet = parseLongHeader(header, false);

      expect(packet.fixedBit, "fixed bit").toBe(1);
      expect(packet.packetType, "0-RTT").toBe(1);
      expect(packet.length).toBe(packet.pnLen + padding);
      expect(packet.consumed).toBe(header.length);
    }
  });

  it("writes HTTP/3 packets whose structure matches their own type", () => {
    let sawInitial = false;
    let sawHandshake = false;

    for (let attempt = 0; attempt < 60; attempt++) {
      const { header, padding } = readChain(genCfg(seeded({ profile: "http3" })).i1);
      const type = (header[0]! >> 4) & 0x03;

      // Initial is 00 and Handshake is 10; only the first has a token, which
      // is what the old code got wrong by writing one structure for both.
      expect([0, 2], "packet type").toContain(type);
      const packet = parseLongHeader(header, type === 0);

      expect(packet.length).toBe(packet.pnLen + padding);
      expect(packet.consumed).toBe(header.length);

      if (type === 0) sawInitial = true;
      if (type === 2) sawHandshake = true;
    }

    // Both kinds should turn up, or the branch is dead code.
    expect(sawInitial && sawHandshake).toBe(true);
  });
});
