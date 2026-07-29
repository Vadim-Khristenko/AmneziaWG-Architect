import { describe, it, expect } from "vitest";
import { parseRich, stripRich } from "../richText";
import { FAQ_ENTRIES } from "@/data/faq";
import { TIMELINE } from "@/data/changelog";

describe("parseRich", () => {
  it("splits on blank lines", () => {
    expect(parseRich("one\n\ntwo\n\nthree")).toHaveLength(3);
  });

  it("reads bold, italic and code", () => {
    // Compare shape only; strong and em also carry parsed children.
    expect(
      parseRich("a **b** c *d* e `f` g")[0].tokens.map((t) => [t.t, t.v]),
    ).toEqual([
      ["text", "a "],
      ["strong", "b"],
      ["text", " c "],
      ["em", "d"],
      ["text", " e "],
      ["code", "f"],
      ["text", " g"],
    ]);
  });

  it("reads headings", () => {
    const b = parseRich("## Two\n\n### Three\n\nbody");
    expect(b.map((x) => x.t)).toEqual(["h2", "h3", "p"]);
    expect(b[0].tokens[0].v).toBe("Two");
  });

  it("nests code inside bold", () => {
    // Marks combine: this is the common case, and a flat parser printed the
    // backticks instead of rendering them.
    const tok = parseRich("**set `Jc` first**")[0].tokens[0];
    expect(tok.t).toBe("strong");
    expect(tok.children).toEqual([
      { t: "text", v: "set " },
      { t: "code", v: "Jc" },
      { t: "text", v: " first" },
    ]);
  });

  it("nests code inside link text", () => {
    const tok = parseRich("[`receive.go`](https://example.com/r)")[0].tokens[0];
    expect(tok.t).toBe("link");
    expect(tok.children).toEqual([{ t: "code", v: "receive.go" }]);
  });

  it("keeps a link and its href", () => {
    const tok = parseRich("see [docs](https://example.com/x)")[0].tokens[1];
    expect(tok.t).toBe("link");
    expect(tok.href).toBe("https://example.com/x");
    expect(tok.v).toBe("docs");
  });

  it("only links safe schemes wherever they appear", () => {
    for (const e of FAQ_ENTRIES) {
      for (const loc of ["ru", "en"] as const) {
        for (const url of e.answer[loc].matchAll(/\]\(([^)\s]+)\)/g)) {
          expect(url[1], `${e.id}/${loc}`).toMatch(/^https:\/\//);
        }
      }
    }
  });

  it("refuses a dangerous scheme, keeping the text", () => {
    for (const bad of [
      "[click](javascript:alert(1))",
      "[click](data:text/html,x)",
      "[click](vbscript:x)",
    ]) {
      const tok = parseRich(bad)[0].tokens;
      expect(tok.some((t) => t.t === "link"), bad).toBe(false);
      expect(tok.map((t) => t.v).join(""), bad).toContain("click");
    }
  });

  it("leaves an unclosed mark as literal text", () => {
    // A typo should look wrong on the page, not silently eat the rest.
    expect(parseRich("a **b c")[0].tokens).toEqual([{ t: "text", v: "a **b c" }]);
  });
});

describe("stripRich", () => {
  it("removes every mark", () => {
    expect(stripRich("**bold** and `code`")).toBe("bold and code");
  });

  it("joins paragraphs into one line", () => {
    expect(stripRich("one\n\ntwo")).toBe("one two");
  });

  it("leaves no markup for the structured data to carry", () => {
    for (const e of FAQ_ENTRIES) {
      for (const loc of ["ru", "en"] as const) {
        const flat = stripRich(e.answer[loc]);
        expect(flat, `${e.id}/${loc}`).not.toMatch(/\*\*|`|\n|\]\(|^#/);
      }
    }
  });
});

describe("editorial content", () => {
  it("has balanced marks in every FAQ answer", () => {
    for (const e of FAQ_ENTRIES) {
      for (const loc of ["ru", "en"] as const) {
        const text = e.answer[loc];
        expect((text.match(/\*\*/g) ?? []).length % 2, `${e.id}/${loc} bold`).toBe(0);
        expect((text.match(/`/g) ?? []).length % 2, `${e.id}/${loc} code`).toBe(0);
      }
    }
  });

  it("has balanced marks in every changelog entry", () => {
    for (const e of TIMELINE) {
      for (const loc of ["ru", "en"] as const) {
        const text = e.desc[loc];
        expect((text.match(/\*\*/g) ?? []).length % 2, `${e.version}/${loc}`).toBe(0);
        expect((text.match(/`/g) ?? []).length % 2, `${e.version}/${loc}`).toBe(0);
      }
    }
  });

  it("breaks long answers into paragraphs", () => {
    // A wall of text is what this formatting exists to prevent, so hold the
    // line: anything past a screenful has to be split.
    const walls = FAQ_ENTRIES.flatMap((e) =>
      (["ru", "en"] as const)
        .filter(
          (loc) =>
            stripRich(e.answer[loc]).length > 700 &&
            parseRich(e.answer[loc]).length < 2,
        )
        .map((loc) => `${e.id}/${loc}`),
    );
    expect(walls).toEqual([]);
  });
});
