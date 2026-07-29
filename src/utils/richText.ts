/**
 * A very small Markdown subset for editorial content.
 *
 * FAQ answers and changelog entries are written once and used twice: rendered
 * into the page, and emitted into FAQPage JSON-LD, which must not carry
 * markup. Storing HTML would break the second use; storing flat text made the
 * first one a wall of prose with no way to tell a rule from an aside.
 *
 * So the source carries a handful of marks and nothing else:
 *
 *   blank line          paragraph break
 *   ## / ###            a subheading, for answers long enough to have parts
 *   **bold**            the claim a reader must not miss
 *   *italic*            an aside, a caveat, something safe to skip
 *   `code`              anything spelled exactly — parameters, files, commands
 *   [text](url)         a source worth citing
 *
 * The page renders these as elements; the structured data and the search
 * index get them stripped. No HTML exists anywhere in the pipeline, so there
 * is nothing to escape and nothing to inject. Links are checked against an
 * allowlist of schemes at parse time rather than trusted.
 */

export type RichTokenType = "text" | "strong" | "em" | "code" | "link";

export interface RichToken {
  t: RichTokenType;
  /** Text content. Meaningful for `text` and `code`, which do not nest. */
  v: string;
  /** Present only on links. Always a safe scheme — see SAFE_HREF. */
  href?: string;
  /**
   * Bold, italic and links carry parsed children rather than raw text, so
   * **a `param` in bold** renders as bold with real code inside it instead of
   * printing the backticks. `text` and `code` are leaves.
   */
  children?: RichToken[];
}

export type RichBlockType = "p" | "h2" | "h3";

export interface RichBlock {
  t: RichBlockType;
  tokens: RichToken[];
}

/**
 * Only absolute http(s) links and in-page anchors. Everything else — most of
 * all `javascript:` — is rendered as plain text instead of becoming a link.
 */
const SAFE_HREF = /^(https?:\/\/|#|\/)/i;

/**
 * One alternation, so the leftmost mark always wins and a backtick inside
 * bold cannot be reinterpreted. Order matters only for `**` before `*`.
 */
const INLINE =
  /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g;

/**
 * Split one block into tokens. An unclosed mark is left as literal text
 * rather than swallowed — a typo should look wrong, not eat the paragraph.
 */
function tokenize(text: string, depth = 0): RichToken[] {
  const out: RichToken[] = [];
  let last = 0;

  // Marks nest — bold around code is the common case — but only a couple of
  // levels deep are meaningful, and the bound keeps a pathological string
  // from recursing far.
  const nest = (inner: string): RichToken[] =>
    depth < 3 ? tokenize(inner, depth + 1) : [{ t: "text", v: inner }];

  for (const m of text.matchAll(INLINE)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ t: "text", v: text.slice(last, at) });

    if (m[1] !== undefined) {
      const href = m[2];
      // An unsafe scheme keeps its text and loses its link, so the sentence
      // still reads correctly.
      if (SAFE_HREF.test(href)) {
        out.push({ t: "link", v: m[1], href, children: nest(m[1]) });
      } else {
        out.push({ t: "text", v: m[1] });
      }
    } else if (m[3] !== undefined) {
      out.push({ t: "strong", v: m[3], children: nest(m[3]) });
    } else if (m[4] !== undefined) {
      out.push({ t: "em", v: m[4], children: nest(m[4]) });
    } else {
      out.push({ t: "code", v: m[5] });
    }

    last = at + m[0].length;
  }

  if (last < text.length) out.push({ t: "text", v: text.slice(last) });
  return out.length ? out : [{ t: "text", v: text }];
}

/** Parse editorial text into renderable blocks. */
export function parseRich(text: string): RichBlock[] {
  return text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((block): RichBlock => {
      const h = block.match(/^(#{2,3})\s+(.*)$/s);
      if (h) {
        return {
          t: h[1].length === 2 ? "h2" : "h3",
          tokens: tokenize(h[2].trim()),
        };
      }
      return { t: "p", tokens: tokenize(block) };
    });
}

/**
 * The same text with every mark removed and blocks joined by a space — what
 * goes into JSON-LD and into the search index, so a search for a parameter
 * name still matches where the answer writes it in backticks.
 */
export function stripRich(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{2,3}\s+/gm, "")
    .split(/\n\s*\n/)
    .map((b) => b.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .join(" ");
}
