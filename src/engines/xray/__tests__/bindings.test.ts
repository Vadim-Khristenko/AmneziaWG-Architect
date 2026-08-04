/**
 * Every editable parameter must land on a real property.
 *
 * A binding that points at a path the input does not have renders a control
 * that appears to work and changes nothing — the exact failure the table
 * exists to prevent, and one no type check catches, because the paths are
 * strings.
 */
import { describe, it, expect } from "vitest";
import { createDefaults } from "../generate";
import { XRAY_PARAMETERS } from "../params";
import { EDITABLE_GROUPS, inputPathFor, readPath, writePath } from "../bindings";

describe("editable parameter bindings", () => {
  const covered = XRAY_PARAMETERS.filter((p) =>
    (EDITABLE_GROUPS as readonly string[]).includes(p.group),
  );

  it("covers every parameter of an editable group", () => {
    const unbound = covered
      .filter((p) => inputPathFor(p.group, p.key) === null)
      .map((p) => `${p.group}.${p.key}`);
    expect(unbound).toEqual([]);
  });

  it("points every one of them at a property that exists", () => {
    const input = createDefaults();
    const missing = covered
      .filter((p) => readPath(input, inputPathFor(p.group, p.key)!) === undefined)
      .map((p) => `${p.group}.${p.key} → ${inputPathFor(p.group, p.key)}`);
    expect(missing).toEqual([]);
  });

  it("writes where it says it writes", () => {
    const input = createDefaults();
    for (const p of covered) {
      const path = inputPathFor(p.group, p.key)!;
      const before = readPath(input, path);
      const probe = typeof before === "number" ? 4242 : typeof before === "boolean" ? !before : "probe";
      expect(writePath(input, path, probe), path).toBe(true);
      expect(readPath(input, path), path).toEqual(probe);
    }
  });

  it("refuses a group it does not cover", () => {
    expect(inputPathFor("xhttp", "path")).toBeNull();
  });
});
