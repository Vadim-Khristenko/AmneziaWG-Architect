import { describe, it, expect } from "vitest";
import { validateAwgParams } from "@/utils/awgValidate";

const findings = (p: Record<string, string | number>, mtu?: number) =>
  validateAwgParams(p, { mtu });

describe("validateAwgParams", () => {
  it("flags Jc above 128 as error", () => {
    const f = findings({ Jc: 200 });
    expect(f.some((x) => x.field === "Jc" && x.level === "error")).toBe(true);
  });
  it("accepts Jc in range with no finding", () => {
    expect(findings({ Jc: 8 }).some((x) => x.field === "Jc")).toBe(false);
  });
  it("warns on a very high (but valid) Jc", () => {
    expect(
      findings({ Jc: 120 }).some((x) => x.field === "Jc" && x.level === "warn"),
    ).toBe(true);
  });
  it("flags Jmin >= Jmax as error", () => {
    expect(
      findings({ Jmin: 100, Jmax: 80 }).some(
        (x) => x.level === "error" && x.field === "Jmin",
      ),
    ).toBe(true);
  });
  it("warns when Jmax >= MTU (fragmentation)", () => {
    expect(
      findings({ Jmin: 40, Jmax: 1500 }, 1280).some(
        (x) => x.field === "Jmax" && x.level === "warn",
      ),
    ).toBe(true);
  });
  it("warns when S1 + 56 === S2", () => {
    expect(
      findings({ S1: 50, S2: 106 }).some(
        (x) => x.level === "warn" && /S1|S2/.test(x.field),
      ),
    ).toBe(true);
  });
  it("errors on overlapping H ranges", () => {
    expect(
      findings({ H1: "100-200", H2: "150-300" }).some(
        (x) => x.level === "error" && /H/.test(x.field),
      ),
    ).toBe(true);
  });
  it("accepts non-overlapping H ranges", () => {
    expect(
      findings({ H1: "100-200", H2: "300-400" }).some((x) => x.level === "error"),
    ).toBe(false);
  });
  it("errors on malformed I-tag", () => {
    expect(
      findings({ I1: "<x 0xZZ>" }).some(
        (x) => x.field === "I1" && x.level === "error",
      ),
    ).toBe(true);
  });
  it("accepts a valid I-tag chain", () => {
    expect(
      findings({ I1: "<b 0xC0><r 100><t>" }).some((x) => x.field === "I1"),
    ).toBe(false);
  });
  it("skips disabled I-tags ('0' / empty)", () => {
    expect(findings({ I1: "0", I2: "" }).some((x) => /I[12]/.test(x.field))).toBe(
      false,
    );
  });
});
