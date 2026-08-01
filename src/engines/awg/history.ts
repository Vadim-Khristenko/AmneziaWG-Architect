/**
 * What AmneziaWG remembers about a generation.
 *
 * The shape lived inside the generator view, which was fine while there was
 * one protocol and one page. `useHistory` is deliberately ignorant of it — it
 * fixes only `id` and `timestamp`, so XRay can keep a history of a completely
 * different shape under its own key — and that is exactly why the shape has to
 * be stated somewhere the panel and the page can both read.
 */

import type { HistoryRecord } from "@/types/history";
import type { AWGConfig } from "./generator";

export interface AwgHistoryEntry extends HistoryRecord {
  version: string;
  intensity: string;
  profile: string;
  /** The rendered `.conf`, which is what a copy puts on the clipboard. */
  text: string;
  params: Record<string, string | number>;
  /**
   * The full config, so an entry can be restored rather than only copied.
   *
   * Optional because entries persisted by older builds lack it, and dropping
   * them on upgrade would read as data loss however good the reason.
   */
  cfg?: AWGConfig;
}
