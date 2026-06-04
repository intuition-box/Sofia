/**
 * Topic UI metadata — colours and icons.
 *
 * Single source of truth = `SOFIA_TOPICS` in `./taxonomy.ts`. Everything
 * here is derived from it so the two files cannot drift. When the taxonomy
 * moves into `@0xsofia/design-system` (see INTEGRATION.md §5) this module
 * will re-export from the package instead.
 */
import { SOFIA_TOPICS } from './taxonomy'

export interface TopicMeta {
  icon: string
  color: string
}

export const TOPIC_META: Record<string, TopicMeta> = Object.fromEntries(
  SOFIA_TOPICS.map((t) => [t.id, { icon: t.icon, color: t.color }]),
)

/**
 * Canonical display label per topic slug — the single short form shown
 * everywhere (feed, Echoes, Interest, Scores, Context Manager). Derived
 * from `SOFIA_TOPICS` so it can't drift. Used to OVERRIDE the on-chain
 * atom label (which is the long form, e.g. "Web3 & Crypto") in
 * `fetchTaxonomy`, so a topic reads identically across the app and the
 * extension regardless of whether the taxonomy is served on-chain or
 * from the static fallback.
 */
export const TOPIC_LABEL: Record<string, string> = Object.fromEntries(
  SOFIA_TOPICS.map((t) => [t.id, t.label]),
)
