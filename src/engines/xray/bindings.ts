/**
 * Which catalogue parameters the interface can actually edit, and where.
 *
 * The catalogue describes a parameter as the core spells it and points `field`
 * at the *config* object. What a form has to write to is the *input* object,
 * and the two are not the same shape: the input is what a person fills in and
 * the config is what the generator makes of it.
 *
 * So this is the missing half — key to a path on `XrayInput` — and it is a
 * table rather than a convention because two of them genuinely disagree:
 * `tcpcongestion` is stored as `tcpCongestion`, and `interface` cannot be a
 * field name in a TypeScript interface so it is `bindInterface`. A rule that
 * lowercases or camelises would get both wrong, silently, and write into a
 * property nobody reads.
 *
 * A parameter with no entry here is not editable yet. That is the honest state
 * of it, and the interface says so rather than rendering a control that
 * changes nothing — which is the failure mode this table exists to prevent.
 */

/** Groups whose parameters this table covers completely. */
export const EDITABLE_GROUPS = ["sockopt"] as const;

/**
 * Catalogue key → dotted path on `XrayInput`.
 *
 * Only the pairs that differ are written out; everything else in a covered
 * group maps to `<group root>.<key>`, which is checked by a test rather than
 * assumed.
 */
const RENAMED: Record<string, string> = {
  tcpcongestion: "tcpCongestion",
  interface: "bindInterface",
};

/** Where a group's values live on the input. */
const GROUP_ROOT: Record<string, string> = {
  sockopt: "sockopt",
};

/**
 * The path to write, or null when the parameter is not wired.
 *
 * Null is a real answer and the reason this returns one: an interface that
 * guesses a path renders a control that appears to work and changes nothing,
 * which is worse than a control that is honestly absent.
 */
export function inputPathFor(group: string, key: string): string | null {
  const root = GROUP_ROOT[group];
  if (!root) return null;
  return `${root}.${RENAMED[key] ?? key}`;
}

/** Read a dotted path off an object. */
export function readPath(obj: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === "object"
          ? (acc as Record<string, unknown>)[part]
          : undefined,
      obj,
    );
}

/** Write a dotted path on an object, leaving missing parents alone. */
export function writePath(obj: unknown, path: string, value: unknown): boolean {
  const parts = path.split(".");
  const last = parts.pop();
  if (!last) return false;

  let target: unknown = obj;
  for (const part of parts) {
    if (!target || typeof target !== "object") return false;
    target = (target as Record<string, unknown>)[part];
  }
  if (!target || typeof target !== "object") return false;

  (target as Record<string, unknown>)[last] = value;
  return true;
}
