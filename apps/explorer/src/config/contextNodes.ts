/**
 * Context-node resolution — the single helper that turns the object atom of
 * an `in context of` triple into a structured node.
 *
 * A cert can be tagged with either a TOPIC atom (e.g. "Web3") or a CATEGORY
 * atom (e.g. "DeFi"). Both flow through the same `in context of` predicate.
 * For reputation we ROLL a category up to its parent topic, so a category
 * tag still scores under its topic — while the precise category slug stays
 * available for display.
 */
import {
  ATOM_ID_TO_TOPIC,
  ATOM_ID_TO_CATEGORY,
  TOPIC_ATOM_IDS,
  CATEGORY_ATOM_IDS,
} from './atomIds'
import { CATEGORY_TO_TOPIC } from './taxonomy'

export type ContextLevel = 'topic' | 'category'

export interface ContextNode {
  /** Precise slug — the topic slug or the category slug. */
  slug: string
  level: ContextLevel
  /** Parent topic slug (itself for a topic, the owner for a category). */
  topicSlug: string
}

/** Resolve an `in context of` object atom id to its node, or null if the
 *  atom isn't a known topic or category. */
export function resolveContextAtom(atomId: string): ContextNode | null {
  const topic = ATOM_ID_TO_TOPIC.get(atomId)
  if (topic) return { slug: topic, level: 'topic', topicSlug: topic }
  const category = ATOM_ID_TO_CATEGORY.get(atomId)
  if (category) {
    return {
      slug: category,
      level: 'category',
      topicSlug: CATEGORY_TO_TOPIC[category] ?? '',
    }
  }
  return null
}

/** Resolve a context slug (topic or category) to its on-chain atom id. */
export function contextAtomIdForSlug(slug: string): string | undefined {
  return TOPIC_ATOM_IDS[slug] ?? CATEGORY_ATOM_IDS[slug]
}
