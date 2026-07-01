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
import { CATEGORY_TO_TOPIC, CATEGORY_BY_ID, TOPIC_BY_ID } from './taxonomy'

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

/** IPFS "Thing" payload for a taxonomy context atom (structurally identical to
 *  the apps' AtomIPFSPayload — kept dependency-free here). */
export interface ContextAtomPayload {
  name: string
  description: string
  image: string
  url: string
}

/**
 * Canonical, FROZEN payload for a taxonomy context atom. Both the explorer and
 * the extension build it identically, so a first-time mint content-addresses to
 * ONE shared atom (same IPFS CID → same on-chain atom id) instead of forking a
 * per-user atom. DO NOT change `name`/`url` once live — it would re-key every
 * derived atom and orphan the existing triples.
 */
export function contextAtomPayload(
  slug: string,
  label: string,
): ContextAtomPayload {
  return {
    name: label,
    description: '',
    image: '',
    url: `sofia:context:${slug}`,
  }
}

/** An on-chain reference for a context slug:
 *   - `known` → a registered/inline atom id, reuse it (backward-compatible).
 *   - `mint`  → no id yet; carries the canonical payload to mint on the fly. */
export type ContextAtomRef =
  | { kind: 'known'; slug: string; label: string; termId: string }
  | { kind: 'mint'; slug: string; label: string; payload: ContextAtomPayload }

/**
 * Hybrid resolver: look the slug up in the registry (or its inline taxonomy
 * `termId`) first; if it has no atom yet, return a `mint` ref carrying the
 * canonical payload so the caller can create the atom at submit time. Returns
 * `null` when the slug isn't part of the taxonomy at all.
 */
export function contextAtomRefForSlug(slug: string): ContextAtomRef | null {
  const cat = CATEGORY_BY_ID.get(slug)
  const label = cat?.label ?? TOPIC_BY_ID.get(slug)?.label
  if (!label) return null
  const known = TOPIC_ATOM_IDS[slug] ?? CATEGORY_ATOM_IDS[slug] ?? cat?.termId
  if (known) return { kind: 'known', slug, label, termId: known }
  return { kind: 'mint', slug, label, payload: contextAtomPayload(slug, label) }
}

/** Display-pill shape for a category context (matches FeedCardTopic). */
export interface CategoryPill {
  id: string
  label: string
  color: string
  /** Parent topic id — drives the pill's family glyph. */
  glyphTopicId: string
}

/** From a cert's `contextSlugs`, build display pills for the CATEGORY-level
 *  contexts only — each carrying its parent topic's color + glyph. Topic-level
 *  slugs are skipped (the card already shows the rolled-up topic pill). */
export function categoryPills(contextSlugs: readonly string[]): CategoryPill[] {
  const out: CategoryPill[] = []
  for (const slug of contextSlugs) {
    const cat = CATEGORY_BY_ID.get(slug)
    if (!cat) continue
    const parent = TOPIC_BY_ID.get(cat.topicId)
    out.push({
      id: slug,
      label: cat.label,
      color: parent?.color ?? 'var(--ds-muted)',
      glyphTopicId: cat.topicId,
    })
  }
  return out
}
