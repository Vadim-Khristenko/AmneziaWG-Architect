import { describe, it, expect, vi, afterEach } from "vitest";

import { copyText } from "../clipboard";

/**
 * The point of this helper is that it tells the caller the truth about whether
 * the text reached the clipboard. Five of the call sites it replaced reported
 * success unconditionally, so these are the cases that used to lie.
 *
 * The suite runs under the `node` environment, so `navigator` and `document`
 * are stubbed per test rather than provided by a DOM.
 */

interface FakeField {
  value: string;
  style: { cssText: string };
  setAttribute: (name: string, value: string) => void;
  select: () => void;
  setSelectionRange: (start: number, end: number) => void;
}

/**
 * A document just real enough for the selection fallback: it records what was
 * appended and whether it was cleaned up again.
 */
function stubDocument(execCopy: () => boolean) {
  const state = {
    fields: [] as FakeField[],
    attached: 0,
    execCalls: 0,
  };

  vi.stubGlobal("document", {
    createElement: (): FakeField => {
      const field: FakeField = {
        value: "",
        style: { cssText: "" },
        setAttribute: () => {},
        select: () => {},
        setSelectionRange: () => {},
      };
      state.fields.push(field);
      return field;
    },
    body: {
      appendChild: () => {
        state.attached += 1;
      },
      removeChild: () => {
        state.attached -= 1;
      },
    },
    execCommand: () => {
      state.execCalls += 1;
      return execCopy();
    },
  });

  return state;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("copyText", () => {
  it("uses the Clipboard API when it works", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const doc = stubDocument(() => true);

    expect(await copyText("Jc = 4")).toBe(true);
    expect(writeText).toHaveBeenCalledWith("Jc = 4");
    // No need to touch the DOM when the modern path succeeded.
    expect(doc.execCalls).toBe(0);
  });

  it("falls back to the selection route when the API rejects", async () => {
    // Permissions-Policy denial and non-secure contexts both look like this.
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const doc = stubDocument(() => true);

    expect(await copyText("H1 = 1")).toBe(true);
    expect(doc.execCalls).toBe(1);
    expect(doc.fields[0]?.value).toBe("H1 = 1");
  });

  it("falls back when the API is missing entirely", async () => {
    vi.stubGlobal("navigator", {});
    const doc = stubDocument(() => true);

    expect(await copyText("S1 = 12")).toBe(true);
    expect(doc.execCalls).toBe(1);
  });

  it("reports failure rather than claiming a copy that did not happen", async () => {
    vi.stubGlobal("navigator", {});
    stubDocument(() => false);

    expect(await copyText("nope")).toBe(false);
  });

  it("removes the field even when the copy throws", async () => {
    vi.stubGlobal("navigator", {});
    const doc = stubDocument(() => {
      throw new Error("execCommand is gone");
    });

    expect(await copyText("boom")).toBe(false);
    // A leaked textarea per click would pile up on a page full of copy buttons.
    expect(doc.attached).toBe(0);
  });

  it("returns false without a document instead of throwing", async () => {
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("document", undefined);

    expect(await copyText("ssr")).toBe(false);
  });
});
