/**
 * trustEmissionService — pure builder for the cart item that represents
 * "user wants to emit `I → trusts → memberX` on-chain". Stateless: no
 * cart access, no auth lookup, no side effects. Callers add the
 * returned item to the cart and open the drawer.
 *
 * Mirrors `circleJoinService` so all our `create-triple` cart items go
 * through the same WeightModal pipeline (atomCreationService +
 * SofiaFeeProxy.createTriples) at submit time.
 */

import { PREDICATE_IDS } from '@/config'
import type { CartItem } from '@/hooks/useCart'

export interface TrustMemberInput {
  /** Atom term_id of the member to trust. Required. */
  memberTermId: string
  /** Display name — shown in the cart row and WeightModal triplet card. */
  memberLabel: string
  /** Optional avatar URL surfaced as the cart row's favicon. */
  memberImage?: string | null
  /** User's Account atom term_id — the subject of the trust triple. */
  userAccountAtomId: string
  /** Tinted dot color for the cart row. Defaults to the trusted accent. */
  color?: string
}

/** Stable cart id prefix so two "Trust member X" items for the same
 *  target never show up twice. Public — `useCart().items.some(i => i.id === trustCartId(termId))`
 *  is the idiomatic "is queued?" check. */
export function trustCartId(memberTermId: string): string {
  return `trust-${memberTermId}`
}

/**
 * Build the cart item for a "trust this member" intent. Returns `null`
 * when any required input is missing so the caller can short-circuit
 * without throwing.
 */
export function buildTrustCartItem(input: TrustMemberInput): CartItem | null {
  const { memberTermId, memberLabel, memberImage, userAccountAtomId, color } =
    input
  if (!memberTermId || !userAccountAtomId) return null

  return {
    id: trustCartId(memberTermId),
    kind: 'create-triple',
    side: 'support',
    // Placeholder triple term_id for cart dedupe — the real one is
    // computed by SofiaFeeProxy.calculateTripleId at submit time.
    termId: `triple-trust-${memberTermId}`,
    subjectId: userAccountAtomId,
    predicateId: PREDICATE_IDS.TRUSTS,
    objectId: memberTermId,
    intention: 'Trust member',
    title: memberLabel,
    favicon: memberImage ?? '',
    intentionColor: color ?? 'var(--trusted, #6dd4a0)',
  }
}
