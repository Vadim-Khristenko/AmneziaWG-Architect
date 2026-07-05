import { describe, it, expect } from "vitest";
import { simulateHandshake, kindColor, kindLabel } from "@/utils/packetSim";
import type { AWGConfig } from "@/utils/generator/types";

const cfg: AWGConfig = {
  version: "2.0",
  profile: "quic_initial",
  h1: "100000000-100000100",
  h2: "1200000000-1200000100",
  h3: "2400000000-2400000100",
  h4: "3600000000-3600000100",
  h1s: 100_000_000,
  h2s: 1_200_000_000,
  h3s: 2_400_000_000,
  h4s: 3_600_000_000,
  s1: 10,
  s2: 10,
  s3: 10,
  s4: 10,
  jc: 3,
  jmin: 100,
  jmax: 200,
  i1: "<b 0x00>",
  i2: "",
  i3: "",
  i4: "",
  i5: "",
};

describe("simulateHandshake", () => {
  it("returns packets for a 2.0 config", () => {
    const sim = simulateHandshake(cfg);
    expect(sim.packets.length).toBeGreaterThan(0);
    expect(sim.totalBytes).toBeGreaterThan(0);
    expect(sim.handshakeBytes).toBeGreaterThan(0);
  });

  it("includes init, response and data packets", () => {
    const sim = simulateHandshake(cfg);
    expect(sim.packets.some((p) => p.kind === "init")).toBe(true);
    expect(sim.packets.some((p) => p.kind === "response")).toBe(true);
    expect(sim.packets.some((p) => p.kind === "data")).toBe(true);
  });

  it("emits jc junk packets", () => {
    const sim = simulateHandshake(cfg);
    expect(sim.packets.filter((p) => p.kind === "junk").length).toBe(cfg.jc);
  });
});

describe("helpers", () => {
  it("kindColor returns a hex color", () => {
    expect(kindColor("init")).toMatch(/^#/);
  });

  it("kindLabel returns a label", () => {
    expect(kindLabel("data")).toBe("Data");
  });
});
