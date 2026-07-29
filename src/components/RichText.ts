/**
 * Renders the editorial markup from `utils/richText` as real elements.
 *
 * A render function rather than a template, because marks nest: bold can hold
 * code, a link can hold both, and a template cannot recurse into itself
 * without being registered as its own component. It also keeps FAQ answers
 * and changelog entries rendering through exactly one code path.
 *
 * Nothing here touches innerHTML — every node is constructed, so the markup
 * cannot carry HTML even if someone writes a tag into the source text.
 */

import { defineComponent, h, type PropType, type VNode } from "vue";
import { parseRich, type RichToken } from "@/utils/richText";

function renderTokens(tokens: RichToken[]): (VNode | string)[] {
  return tokens.map((tok) => {
    switch (tok.t) {
      case "code":
        return h("code", tok.v);
      case "strong":
        return h("strong", renderTokens(tok.children ?? []));
      case "em":
        return h("em", renderTokens(tok.children ?? []));
      case "link":
        return h(
          "a",
          { href: tok.href, target: "_blank", rel: "noopener noreferrer" },
          renderTokens(tok.children ?? []),
        );
      default:
        return tok.v;
    }
  });
}

export default defineComponent({
  name: "RichText",
  props: {
    text: { type: String as PropType<string>, required: true },
  },
  setup(props) {
    return () =>
      parseRich(props.text).map((block) =>
        h(block.t, renderTokens(block.tokens)),
      );
  },
});
