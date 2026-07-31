/**
 * Recently generated configurations, kept across reloads.
 *
 * The mechanism — a capped list in localStorage, ids that survive a reload,
 * and never letting corrupt or full storage take the page down — has nothing
 * to do with AmneziaWG, but it lived inside the AmneziaWG view under a single
 * global key. A second protocol on that key would have shown its entries in
 * the other one's panel and restored them into a generator that cannot read
 * them.
 *
 * So the storage key is per engine, and what goes in an entry is the engine's
 * own type. Only `id` and `timestamp` are fixed, because those are the only
 * fields this file touches.
 */

import { ref, type Ref } from "vue";

/** What every history entry has, whatever protocol produced it. */
export interface HistoryRecord {
  id: number;
  /** Unix milliseconds. */
  timestamp: number;
}

export interface HistoryOptions {
  /**
   * Engine this history belongs to — "awg", "xray". It becomes part of the
   * storage key, which is what keeps two protocols' entries apart.
   */
  engineId: string;
  /** How many entries to keep. Older ones fall off the end. */
  limit?: number;
  /**
   * A key written by an earlier build, migrated on first load.
   *
   * Without this the AmneziaWG history would simply vanish the day it moved
   * under a namespaced key, which reads as data loss however good the reason.
   */
  legacyKey?: string;
}

export interface History<T extends HistoryRecord> {
  entries: Ref<T[]>;
  /** Read storage. Safe to call more than once. */
  load: () => void;
  /** Store an entry, stamping it with an id and the time. */
  add: (entry: Omit<T, "id" | "timestamp">) => T;
  remove: (id: number) => void;
  clear: () => void;
  /** The key this history is stored under, for tests and diagnostics. */
  storageKey: string;
}

const DEFAULT_LIMIT = 20;

/** Namespace shared with the rest of the app's stored state. */
const PREFIX = "awg-architect:history";

export function storageKeyFor(engineId: string): string {
  return `${PREFIX}:${engineId}`;
}

export function useHistory<T extends HistoryRecord>(
  options: HistoryOptions,
): History<T> {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const storageKey = storageKeyFor(options.engineId);

  const entries = ref<T[]>([]) as Ref<T[]>;
  let idCounter = 0;

  function read(key: string): T[] | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : null;
    } catch {
      // Corrupt JSON, or storage blocked entirely. Either way the page has to
      // keep working; history is a convenience, not the product.
      return null;
    }
  }

  function save(): void {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(entries.value.slice(0, limit)),
      );
    } catch {
      // Quota exceeded or storage blocked — the list stays in memory only.
    }
  }

  function load(): void {
    const stored = read(storageKey) ?? readLegacy();
    entries.value = (stored ?? []).slice(0, limit);
    // Continue from the highest id rather than from zero: reusing an id after
    // a reload makes "delete this one" delete a different one.
    idCounter = entries.value.reduce(
      (max, entry) => Math.max(max, Number(entry.id) || 0),
      0,
    );
  }

  function readLegacy(): T[] | null {
    if (!options.legacyKey) return null;
    const stored = read(options.legacyKey);
    if (!stored) return null;

    entries.value = stored.slice(0, limit);
    save();
    try {
      // Moved, not copied: leaving it behind means the next build has to
      // decide which of the two is current.
      localStorage.removeItem(options.legacyKey);
    } catch {
      // Read-only storage. The entries are already under the new key.
    }
    return stored;
  }

  function add(entry: Omit<T, "id" | "timestamp">): T {
    const stored = {
      ...entry,
      id: ++idCounter,
      timestamp: Date.now(),
    } as T;

    entries.value = [stored, ...entries.value].slice(0, limit);
    save();
    return stored;
  }

  function remove(id: number): void {
    entries.value = entries.value.filter((entry) => entry.id !== id);
    save();
  }

  function clear(): void {
    entries.value = [];
    save();
  }

  return { entries, load, add, remove, clear, storageKey };
}
