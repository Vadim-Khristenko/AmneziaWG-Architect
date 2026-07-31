import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  storageKeyFor,
  useHistory,
  type HistoryRecord,
} from "../useHistory";

/**
 * The history used to live in the AmneziaWG view under one global key. A
 * second protocol on that key would have shown its entries in the other one's
 * panel and offered them to a generator that cannot read them, so the key is
 * per engine — and the entries a user already has have to survive the move.
 */

interface Entry extends HistoryRecord {
  text: string;
}

function stubStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  const api = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: vi.fn((k: string, v: string) => {
      store.set(k, v);
    }),
    removeItem: vi.fn((k: string) => {
      store.delete(k);
    }),
    store,
  };
  vi.stubGlobal("localStorage", api);
  return api;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-31T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("storage keys", () => {
  it("namespaces by engine", () => {
    expect(storageKeyFor("awg")).not.toBe(storageKeyFor("xray"));
  });

  it("keeps two engines' entries apart", () => {
    stubStorage();
    const awg = useHistory<Entry>({ engineId: "awg" });
    const xray = useHistory<Entry>({ engineId: "xray" });

    awg.add({ text: "awg config" });
    xray.load();

    // The whole point: an XRay panel must never offer an AmneziaWG config
    // for restoring into a generator that cannot read it.
    expect(xray.entries.value).toEqual([]);
  });
});

describe("adding and reading", () => {
  it("stamps an id and a time", () => {
    stubStorage();
    const history = useHistory<Entry>({ engineId: "awg" });

    const entry = history.add({ text: "one" });
    expect(entry.id).toBe(1);
    expect(entry.timestamp).toBe(Date.parse("2026-07-31T12:00:00Z"));
  });

  it("puts the newest first", () => {
    stubStorage();
    const history = useHistory<Entry>({ engineId: "awg" });

    history.add({ text: "older" });
    history.add({ text: "newer" });
    expect(history.entries.value.map((e) => e.text)).toEqual([
      "newer",
      "older",
    ]);
  });

  it("drops the oldest past the limit", () => {
    stubStorage();
    const history = useHistory<Entry>({ engineId: "awg", limit: 2 });

    history.add({ text: "a" });
    history.add({ text: "b" });
    history.add({ text: "c" });
    expect(history.entries.value.map((e) => e.text)).toEqual(["c", "b"]);
  });

  it("continues ids from what was stored", () => {
    stubStorage({
      [storageKeyFor("awg")]: JSON.stringify([
        { id: 7, timestamp: 1, text: "old" },
      ]),
    });
    const history = useHistory<Entry>({ engineId: "awg" });
    history.load();

    // Restarting at 1 would make "delete this one" delete a different one.
    expect(history.add({ text: "new" }).id).toBe(8);
  });
});

describe("surviving bad storage", () => {
  it("starts empty on corrupt JSON instead of throwing", () => {
    stubStorage({ [storageKeyFor("awg")]: "{not json" });
    const history = useHistory<Entry>({ engineId: "awg" });

    expect(() => history.load()).not.toThrow();
    expect(history.entries.value).toEqual([]);
  });

  it("ignores stored data that is not a list", () => {
    stubStorage({ [storageKeyFor("awg")]: JSON.stringify({ nope: true }) });
    const history = useHistory<Entry>({ engineId: "awg" });
    history.load();

    expect(history.entries.value).toEqual([]);
  });

  it("keeps working in memory when the quota is full", () => {
    const storage = stubStorage();
    storage.setItem.mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    const history = useHistory<Entry>({ engineId: "awg" });

    expect(() => history.add({ text: "one" })).not.toThrow();
    // History is a convenience; a full disk must not cost the user the entry
    // they are looking at.
    expect(history.entries.value).toHaveLength(1);
  });
});

describe("migrating the un-namespaced key", () => {
  const legacyKey = "awg-architect:history";

  it("moves what an earlier build wrote", () => {
    const storage = stubStorage({
      [legacyKey]: JSON.stringify([{ id: 3, timestamp: 1, text: "kept" }]),
    });
    const history = useHistory<Entry>({ engineId: "awg", legacyKey });
    history.load();

    expect(history.entries.value.map((e) => e.text)).toEqual(["kept"]);
    expect(storage.store.get(storageKeyFor("awg"))).toContain("kept");
    // Moved, not copied: two copies would leave the next build guessing which
    // one is current.
    expect(storage.store.has(legacyKey)).toBe(false);
  });

  it("prefers the namespaced key once it exists", () => {
    stubStorage({
      [legacyKey]: JSON.stringify([{ id: 1, timestamp: 1, text: "stale" }]),
      [storageKeyFor("awg")]: JSON.stringify([
        { id: 2, timestamp: 2, text: "current" },
      ]),
    });
    const history = useHistory<Entry>({ engineId: "awg", legacyKey });
    history.load();

    expect(history.entries.value.map((e) => e.text)).toEqual(["current"]);
  });
});

describe("removing", () => {
  it("removes one entry by id", () => {
    stubStorage();
    const history = useHistory<Entry>({ engineId: "awg" });
    const first = history.add({ text: "a" });
    history.add({ text: "b" });

    history.remove(first.id);
    expect(history.entries.value.map((e) => e.text)).toEqual(["b"]);
  });

  it("clears everything, and writes that through", () => {
    const storage = stubStorage();
    const history = useHistory<Entry>({ engineId: "awg" });
    history.add({ text: "a" });

    history.clear();
    expect(history.entries.value).toEqual([]);
    expect(storage.store.get(storageKeyFor("awg"))).toBe("[]");
  });
});
