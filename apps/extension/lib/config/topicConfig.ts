/**
 * Topic Config — thin adapter over `@0xsofia/taxonomy`, the single source of
 * truth shared with the explorer. The package owns the on-chain atom ids,
 * canonical labels, colors (via `TOPIC_META`) and Material Symbols glyphs;
 * this module only re-shapes them to the names the extension already imports,
 * so the two apps can never drift.
 *
 * (Previously a hand-maintained copy of the explorer's atom/label/color/icon
 * tables — verified identical before the swap: same 16 atom ids, labels,
 * colors and glyphs.)
 */
import { TOPIC_LABEL, TOPIC_META } from "@0xsofia/taxonomy"

export {
  ATOM_ID_TO_TOPIC,
  getTopicIcon,
  TOPIC_ATOM_IDS,
  TOPIC_ICON,
  TOPIC_TERM_IDS
} from "@0xsofia/taxonomy"

// The extension uses the plural name; the package canonical is `TOPIC_LABEL`.
export const TOPIC_LABELS: Record<string, string> = TOPIC_LABEL

// The package exposes color via `TOPIC_META`; flatten to the slug→hex map the
// extension's pills, badges and hover states expect.
export const TOPIC_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(TOPIC_META).map(([slug, meta]) => [slug, meta.color])
)
