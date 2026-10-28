/**
 * pageMarketCartService — a page's one market, `I | recommends | page`
 * (progressive curve), as cart rows.
 *
 * A 👍 on any card that points to a page Recommends it (creates the claim or
 * deposits on it); a 👎 deposits on the claim's counter vault, which only
 * exists once the claim does. Same rows as Trending's "Take position", so the
 * free (sponsored) path picks them up too.
 */
import { CANONICAL_PREDICATE_IDS, SOFIA_I_ATOM_ID } from '@/config/atomIds'
import type { CartItem } from '@/hooks/useCart'
import { calculateCounterId, calculateTripleId } from '@/lib/contracts/termIds'

export const RECOMMEND_LABEL = 'Recommend'
export const RECOMMEND_COLOR = '#22C55E'
const OPPOSE_COLOR = '#EF4444'

/** The page's Recommend claim id, lowercase */
export function recommendClaimId(objectId: string): string {
  return calculateTripleId(
    SOFIA_I_ATOM_ID,
    CANONICAL_PREDICATE_IDS.recommends,
    objectId,
  ).toLowerCase()
}

export interface PageRef {
  /** The page atom term_id */
  objectId: string
  title: string
  favicon: string
}

/** Cart row for a 👍 / 👎 on a page, or null when the side isn't possible */
export function pageVoteCartItem(
  side: 'support' | 'oppose',
  page: PageRef,
  /** The Recommend claim is on-chain — required to oppose it */
  claimExists: boolean,
): CartItem | null {
  if (!page.objectId) return null
  const claimId = recommendClaimId(page.objectId)
  const shared = {
    title: page.title,
    favicon: page.favicon,
    objectId: page.objectId,
    curveId: 2 as const,
  }
  if (side === 'support')
    // create-triple deposits on the claim when it already exists
    return {
      ...shared,
      id: `recommend:${page.objectId}`,
      side,
      kind: 'create-triple',
      termId: claimId,
      subjectId: SOFIA_I_ATOM_ID,
      predicateId: CANONICAL_PREDICATE_IDS.recommends,
      intention: RECOMMEND_LABEL,
      intentionColor: RECOMMEND_COLOR,
    }
  if (!claimExists) return null
  const counterId = calculateCounterId(claimId).toLowerCase()
  return {
    ...shared,
    id: `${counterId}-oppose`,
    side,
    termId: counterId,
    intention: 'Oppose',
    intentionColor: OPPOSE_COLOR,
  }
}
