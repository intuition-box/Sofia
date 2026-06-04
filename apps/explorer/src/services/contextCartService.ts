/**
 * contextCartService — pure builders for the Context Manager.
 *
 * Adding a topic context to an existing certification is a nested
 * triple mint:
 *
 *   subject   = cert.termId (the visits_for_* triple already on-chain)
 *   predicate = IN_CONTEXT_OF_PREDICATE_ID
 *   object    = TOPIC_ATOM_IDS[topicSlug]
 *
 * Each (cert, topic) pair maps to one cart item with
 * `kind: 'create-triple'`, so WeightModal's existing create-triple
 * batch path handles the on-chain side without modification.
 *
 * Lives in `services/` to mirror `circleJoinService` — keeps the
 * predicate / atom-id wiring out of React components.
 */

import { IN_CONTEXT_OF_PREDICATE_ID } from '@/config/atomIds'
import { contextAtomIdForSlug } from '@/config/contextNodes'
import type { CartItem } from '@/hooks/useCart'

export interface AddContextInput {
  /** The cert triple's term_id — becomes the nested triple's subject. */
  certTermId: string
  /** Topic slug (key of `TOPIC_ATOM_IDS`). */
  topicSlug: string
  /** Display label surfaced in the cart row + WeightModal triplet card. */
  topicLabel: string
  /** Colour token surfaced as the cart row's left dot. */
  topicColor: string
  /** Title shown in the cart row — usually the URL's page title or
   *  domain, so the row reads as "Tag: <site> · <topic>". */
  certTitle: string
  /** Optional favicon shown next to the row title. */
  certFavicon?: string
}

/** Stable cart id so the same (cert, topic) pair never appears twice. */
export function contextCartId(certTermId: string, topicSlug: string): string {
  return `context-${certTermId}-${topicSlug}`
}

/**
 * Build a cart item that, once submitted, mints a nested
 * `(cert, in_context_of, topic)` triple. Returns `null` when the
 * topic slug isn't in the local taxonomy so callers can short-circuit
 * without throwing.
 */
export function buildContextCartItem(input: AddContextInput): CartItem | null {
  const {
    certTermId,
    topicSlug,
    topicLabel,
    topicColor,
    certTitle,
    certFavicon,
  } = input
  // `topicSlug` is a context slug — a topic OR a category slug.
  const topicAtomId = contextAtomIdForSlug(topicSlug)
  if (!certTermId || !topicAtomId) return null

  return {
    id: contextCartId(certTermId, topicSlug),
    kind: 'create-triple',
    side: 'support',
    // Placeholder for cart dedupe; the actual triple_id is computed
    // by SofiaFeeProxy.calculateTripleId at submit time.
    termId: `triple-${certTermId}-${topicSlug}`,
    subjectId: certTermId,
    predicateId: IN_CONTEXT_OF_PREDICATE_ID,
    objectId: topicAtomId,
    intention: `Context · ${topicLabel}`,
    title: certTitle,
    favicon: certFavicon ?? '',
    intentionColor: topicColor,
  }
}

/**
 * Bulk variant — given a cert and a set of topic slugs, returns one
 * cart item per (cert, topic) pair. Filters out unknown slugs so a
 * stale local taxonomy never poisons the cart.
 */
export function buildContextCartItems(
  certTermId: string,
  certTitle: string,
  certFavicon: string | undefined,
  topics: ReadonlyArray<{ slug: string; label: string; color: string }>,
): CartItem[] {
  const out: CartItem[] = []
  for (const t of topics) {
    const item = buildContextCartItem({
      certTermId,
      certTitle,
      certFavicon,
      topicSlug: t.slug,
      topicLabel: t.label,
      topicColor: t.color,
    })
    if (item) out.push(item)
  }
  return out
}
