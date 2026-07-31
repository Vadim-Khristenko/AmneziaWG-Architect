import { describe, it, expect } from "vitest";

import { awgEngine } from "../index";
import { genCfg, type GeneratorInput } from "@/engines/awg/generator";

/**
 * A junk packet is meant to *be* the protocol it imitates. The cheapest way
 * to fail that is a declared length that does not match what follows — the
 * first thing any parser checks, and something no amount of plausible-looking
 * random bytes makes up for.
 *
 * These parse what the generator emits the way the real protocol's reader
 * would, and stop at the first field that does not add up.
 */

const seeded = (over: Partial<GeneratorInput> = {}): GeneratorInput => ({
  ...awgEngine.createDefaults(),
  useTagR: true,
  useTagRC: false,
  useTagC: false,
  useTagT: false,
  ...over,
});

/** The `<b 0x…>` blob, plus the bytes every following tag contributes. */
function readChain(chain: string) {
  const blob = /<b 0x([0-9a-fA-F]*)>/.exec(chain);
  if (!blob) throw new Error(`no <b> tag in: ${chain}`);

  const hex = blob[1]!;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  const sum = (re: RegExp) =>
    [...chain.matchAll(re)].reduce((n, m) => n + Number(m[1]), 0);

  return {
    bytes,
    padding: sum(/<r (\d+)>/g),
    rc: sum(/<rc (\d+)>/g),
    counters: (chain.match(/<c>/g)?.length ?? 0) * 4,
    stamps: (chain.match(/<t>/g)?.length ?? 0) * 4,
  };
}

const u16 = (b: Uint8Array, at: number) => (b[at]! << 8) | b[at + 1]!;
const u24 = (b: Uint8Array, at: number) =>
  (b[at]! << 16) | (b[at + 1]! << 8) | b[at + 2]!;

/* ── TLS ──────────────────────────────────────────────────────────────────── */

describe("the TLS ClientHello the generator emits", () => {
  it("is a handshake record announcing TLS 1.0 on the wire", () => {
    for (let attempt = 0; attempt < 30; attempt++) {
      const { bytes } = readChain(genCfg(seeded({ profile: "tls_client_hello" })).i1);

      // Content type 22 is handshake; the record's legacy version is 0x0301
      // for compatibility, with the real version inside the hello.
      expect(bytes[0], "content type").toBe(0x16);
      expect(u16(bytes, 1), "legacy record version").toBe(0x0301);
      expect(bytes[5], "handshake type").toBe(0x01);
      expect(u16(bytes, 9), "client version").toBe(0x0303);
    }
  });

  it("declares a record length covering everything after the header", () => {
    // This is what was wrong: the handshake length was `recLen - rnd(4, 9)`,
    // so the record and the message disagreed about their own sizes.
    for (const tags of [
      {},
      { useTagRC: true },
      { useTagC: true, useTagT: true },
      { useTagRC: true, useTagC: true, useTagT: true },
    ]) {
      for (let attempt = 0; attempt < 15; attempt++) {
        const chain = genCfg(
          seeded({ profile: "tls_client_hello", ...tags }),
        ).i1;
        const { bytes, padding, rc, counters, stamps } = readChain(chain);

        const declared = u16(bytes, 3);
        const afterHeader = bytes.length - 5 + padding + rc + counters + stamps;
        expect(declared, `${JSON.stringify(tags)}: ${chain.slice(0, 50)}`).toBe(
          afterHeader,
        );
      }
    }
  });

  it("declares a handshake body of exactly the record minus its own header", () => {
    for (let attempt = 0; attempt < 30; attempt++) {
      const { bytes } = readChain(genCfg(seeded({ profile: "tls_client_hello" })).i1);
      expect(u24(bytes, 6)).toBe(u16(bytes, 3) - 4);
    }
  });
});

/* ── DNS ──────────────────────────────────────────────────────────────────── */

/** Walk a DNS message the way a resolver would, returning where it ended. */
function parseDns(bytes: Uint8Array) {
  const counts = {
    qd: u16(bytes, 4),
    an: u16(bytes, 6),
    ns: u16(bytes, 8),
    ar: u16(bytes, 10),
  };

  let at = 12;
  for (let q = 0; q < counts.qd; q++) {
    while (bytes[at] !== 0) {
      const len = bytes[at]!;
      // Above 63 the two high bits mean a compression pointer, not a length.
      if (len > 63) throw new Error(`label length ${len} at ${at}`);
      at += 1 + len;
    }
    at += 1; // root label
    at += 4; // QTYPE and QCLASS
  }

  const additional: { rdlength: number; optionCode?: number; optionLen?: number }[] =
    [];
  for (let r = 0; r < counts.ar; r++) {
    at += 1; // root name
    const type = u16(bytes, at);
    at += 2 + 2 + 4; // type, class, ttl
    const rdlength = u16(bytes, at);
    at += 2;

    if (type === 41 && rdlength >= 4) {
      additional.push({
        rdlength,
        optionCode: u16(bytes, at),
        optionLen: u16(bytes, at + 2),
      });
      at += 4;
    } else {
      additional.push({ rdlength });
      at += rdlength;
    }
  }

  return { counts, additional, consumed: at, flags: u16(bytes, 2) };
}

describe("the DNS query the generator emits", () => {
  it("is a standard recursive query for one name", () => {
    for (let attempt = 0; attempt < 30; attempt++) {
      const { bytes } = readChain(genCfg(seeded({ profile: "dns_query" })).i1);
      const message = parseDns(bytes);

      // QR 0, opcode 0, RD set.
      expect(message.flags, "flags").toBe(0x0100);
      expect(message.counts.qd, "qdcount").toBe(1);
      expect(message.counts.an).toBe(0);
      expect(message.counts.ns).toBe(0);
    }
  });

  it("accounts for its padding with an OPT record instead of trailing junk", () => {
    for (let attempt = 0; attempt < 30; attempt++) {
      const chain = genCfg(seeded({ profile: "dns_query" })).i1;
      const { bytes, padding } = readChain(chain);
      const message = parseDns(bytes);

      if (padding === 0) {
        expect(message.counts.ar, "arcount with no padding").toBe(0);
        continue;
      }

      // One OPT record, carrying option 12 — Padding — whose length is
      // exactly the bytes the tags go on to emit.
      expect(message.counts.ar, "arcount").toBe(1);
      const opt = message.additional[0]!;
      expect(opt.optionCode, "option code").toBe(12);
      expect(opt.optionLen, `option length: ${chain.slice(0, 60)}`).toBe(padding);
      expect(opt.rdlength, "rdlength").toBe(padding + 4);
    }
  });

  it("parses to exactly the end of the blob", () => {
    for (let attempt = 0; attempt < 30; attempt++) {
      const { bytes } = readChain(genCfg(seeded({ profile: "dns_query" })).i1);
      expect(parseDns(bytes).consumed).toBe(bytes.length);
    }
  });

  it("never writes a label a resolver would read as a pointer", () => {
    // A host with a long label used to be encoded with a length byte above
    // 63, whose top bits mean "compression pointer" — the name stops parsing
    // there and the message is garbage from that byte on.
    const long = "a".repeat(120);
    const chain = genCfg(
      seeded({ profile: "dns_query", customHost: `${long}.example.com` }),
    ).i1;

    expect(() => parseDns(readChain(chain).bytes)).not.toThrow();
  });
});
