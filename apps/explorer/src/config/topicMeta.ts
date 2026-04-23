/**
 * Topic UI metadata — colours and icons.
 *
 * Single source of truth = `SOFIA_TOPICS` in `./taxonomy.ts`. Everything
 * here is derived from it so the two files cannot drift. When the taxonomy
 * moves into `@0xsofia/design-system` (see INTEGRATION.md §5) this module
 * will re-export from the package instead.
 */
import { SOFIA_TOPICS } from "./taxonomy"

export interface TopicMeta {
  icon: string
  color: string
}

export const TOPIC_META: Record<string, TopicMeta> = Object.fromEntries(
  SOFIA_TOPICS.map((t) => [t.id, { icon: t.icon, color: t.color }]),
)
