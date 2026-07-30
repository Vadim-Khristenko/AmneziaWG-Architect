/**
 * Copying text, with the fallback every call site needs.
 *
 * `navigator.clipboard` is unavailable over plain HTTP and in hardened
 * browsers, and it rejects rather than throwing synchronously — so a bare
 * `await navigator.clipboard.writeText(...)` inside a `try {} catch {}` looks
 * like it handles failure while actually doing nothing about it.
 *
 * Seven call sites had grown their own version of this. Two carried a textarea
 * fallback; the other five silently did nothing when the API was missing,
 * which on a page whose whole job is handing people values to paste is a bad
 * way to fail. One implementation now, with the fallback everywhere.
 */

/**
 * Put `text` on the clipboard. Resolves to whether it worked, so a caller can
 * tell the difference between success and a browser that would not allow it.
 */
export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Denied or unavailable — fall through to the selection route rather
      // than reporting a failure the user could have worked around.
    }
  }
  return copyViaSelection(text);
}

/**
 * The pre-Clipboard-API route: a hidden textarea, selected and copied.
 *
 * Kept off-screen rather than hidden with `display: none` or zero size —
 * a field that is not rendered cannot be selected, so those would silently
 * copy nothing.
 */
function copyViaSelection(text: string): boolean {
  if (typeof document === "undefined") return false;

  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
  document.body.appendChild(field);

  let ok = false;
  try {
    field.select();
    // iOS ignores select() on a readonly field unless a range is set too.
    field.setSelectionRange(0, text.length);
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  } finally {
    document.body.removeChild(field);
  }
  return ok;
}
