import { describe, it, expect } from "vitest";
import { pluralRu } from "@/utils/plural";

const K: [string, string, string] = ["ключ", "ключа", "ключей"];

describe("pluralRu", () => {
  it("picks the 'one' form", () => {
    expect(pluralRu(1, K)).toBe("ключ");
    expect(pluralRu(21, K)).toBe("ключ");
    expect(pluralRu(101, K)).toBe("ключ");
  });
  it("picks the 'few' form", () => {
    expect(pluralRu(2, K)).toBe("ключа");
    expect(pluralRu(3, K)).toBe("ключа");
    expect(pluralRu(4, K)).toBe("ключа");
    expect(pluralRu(22, K)).toBe("ключа");
  });
  it("picks the 'many' form", () => {
    expect(pluralRu(5, K)).toBe("ключей");
    expect(pluralRu(10, K)).toBe("ключей");
    expect(pluralRu(0, K)).toBe("ключей");
  });
  it("teens are always 'many'", () => {
    expect(pluralRu(11, K)).toBe("ключей");
    expect(pluralRu(12, K)).toBe("ключей");
    expect(pluralRu(14, K)).toBe("ключей");
    expect(pluralRu(111, K)).toBe("ключей");
  });
});
