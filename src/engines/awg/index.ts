/**
 * AmneziaWG as an Engine.
 *
 * This is an adapter and nothing more: it calls the existing functions in
 * `utils/generator` and reshapes their results to the contract. Not one line
 * of the generator moved to make it fit, which was the condition — an
 * abstraction that requires rewriting the thing it abstracts has been drawn
 * in the wrong place.
 *
 * Two mismatches were worth noting rather than papering over:
 *
 *   - Validation lives in three functions here (sizes, client compatibility,
 *     the 3.0 block) and the contract asks for one call, so the adapter joins
 *     them. That is a real simplification for the shell, which never wanted
 *     to know the split.
 *
 *   - `RenderLabels` is a fixed set of named fields, while the contract passes
 *     a plain record. The cast is contained here, in the one place that knows
 *     both shapes.
 */

import { Shield } from "lucide-vue-next";

import {
  genCfg,
  renderConfLines,
  validateGeneratedConfig,
  validateAwg3,
  DEFAULT_CLIENT_ID,
  type AWGConfig,
  type GeneratorInput,
  type RenderLabels,
} from "@/engines/awg/generator";
import { AWG_VERSIONS } from "@/engines/awg/generator/versions";
import { buildVpnConfig } from "@/engines/awg/awgFormat";

import { defineEngine, linesToText } from "@/types/engine";
import type { EngineLabels, EngineLine, EngineFinding } from "@/types/engine";
import { parseAwgConf } from "./parse";

/**
 * Same defaults the generator page has always started from. Kept here rather
 * than imported from the composable so an engine can be exercised without a
 * Vue runtime — the batch worker and the tests both need that.
 */
function createDefaults(): GeneratorInput {
  return {
    version: "3.0",
    intensity: "medium",
    profile: "quic_initial",
    customHost: "",
    mimicAll: false,

    useTagC: false,
    useTagT: true,
    useTagR: true,
    useTagRC: true,
    useTagRD: true,

    useBrowserFp: false,
    browserProfile: "chrome",

    mtu: 1500,
    junkLevel: 5,
    iterCount: 0,
    routerMode: false,
    useExtremeMax: false,
    clientId: DEFAULT_CLIENT_ID,

    useHeaderProtection: true,
    useContentPadding: true,
    useRandomTimings: true,
  };
}

export const awgEngine = defineEngine<GeneratorInput, AWGConfig>({
  id: "awg",
  label: "AmneziaWG",
  route: "/amnezia",
  icon: Shield,

  versions: AWG_VERSIONS.map((v) => ({
    id: v.id,
    label: v.label,
    isNewest: v.isNewest,
  })),

  // `vpn://` links are handled by the MergeKeys page rather than here, so the
  // engine only claims the format it reads end to end.
  formats: ["text"],

  createDefaults,

  parse: parseAwgConf,

  generate: (input) => genCfg(input),

  render(config, labels: EngineLabels): EngineLine[] {
    return renderConfLines(config, { labels: labels as Partial<RenderLabels> });
  },

  validate(config): EngineFinding[] {
    // The generator splits validation by concern; the shell only ever wants
    // the union. `defineEngine` handles the ordering.
    const legacy = [...validateGeneratedConfig(config), ...validateAwg3(config)];

    // The older validators carry a ready-made sentence and, in some cases, no
    // code. Both are kept: the code selects a catalogue message where there is
    // one, and `msg` remains as the fallback until each rule is ported. A
    // finding without either would be a rule that silently stopped reporting,
    // so the field name stands in as a last resort.
    return legacy.map((f) => ({
      field: f.field,
      level: f.level,
      code: f.code ?? `awg.legacy.${f.field.toLowerCase()}`,
      msg: f.msg,
    }));
  },

  toClientPayload(config) {
    // Amnezia's apps import a VpnConfig built from the rendered text, so the
    // payload is derived from the same render everyone else sees.
    return buildVpnConfig(linesToText(renderConfLines(config)));
  },
});
