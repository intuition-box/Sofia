/**
 * circleJoinService — pure builder for the cart item that represents
 * "user wants to join group X". Stateless: no cart access, no auth
 * lookup, no side effects. Callers are responsible for adding the
 * returned item to the cart and opening the drawer.
 *
 * Lives in `services/` to mirror the rest of the cart-item factories
 * (see CreateCircleDrawer for the create-circle equivalent) and keeps
 * the predicate / atom-id wiring out of the React layer.
 */

import { PREDICATE_IDS } from '@/config'
import type { CartItem } from '@/hooks/useCart'

export interface JoinCircleInput {
  /** Group atom term_id. */
  groupTermId: string
  /** Display name — shown in the cart row and WeightModal triplet card. */
  groupLabel: string
  /** Optional avatar URL surfaced as the cart row's favicon. */
  groupImage?: string | null
  /** User's Account atom term_id — the subject of the membership triple. */
  userAccountAtomId: string
  /** Tinted dot color for the cart row. Defaults to the protocol's
   *  generic accent if the caller doesn't have a topic-derived color
   *  on hand. */
  color?: string
}

/** Stable cart id prefix so two `Join X` items for the same group never
 *  show up twice. Keep public — `useCart().items.some(i => i.id === joinCartId(termId))`
 *  is the idiomatic "is queued?" check. */
export function joinCartId(groupTermId: string): string {
  return `join-${groupTermId}`
}

/**
 * Build the cart item for a "join this group" intent. Returns `null`
 * when any required input is missing so the caller can short-circuit
 * without throwing.
 */
export function buildJoinCartItem(input: JoinCircleInput): CartItem | null {
  const { groupTermId, groupLabel, groupImage, userAccountAtomId, color } =
    input
  if (!groupTermId || !userAccountAtomId) return null

  return {
    id: joinCartId(groupTermId),
    kind: 'create-triple',
    side: 'support',
    // Placeholder triple term_id for cart dedupe — the real one is
    // computed by SofiaFeeProxy.calculateTripleId at submit time.
    termId: `triple-${groupTermId}`,
    subjectId: userAccountAtomId,
    predicateId: PREDICATE_IDS.MEMBER_OF,
    objectId: groupTermId,
    intention: 'Join group',
    title: groupLabel,
    favicon: groupImage ?? '',
    intentionColor: color ?? 'var(--ds-accent, #a78bdb)',
  }
}
