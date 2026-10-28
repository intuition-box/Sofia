import { describe, expect, it } from 'vitest'
import {
  CANONICAL_PREDICATE_IDS,
  contextAtomRefForSlug,
  IN_CONTEXT_OF_PREDICATE_ID,
  SOFIA_I_ATOM_ID,
} from '@/config/atomIds'
import type { CartItem } from '@/hooks/useCart'
import { calculateTripleId } from '@/lib/contracts/termIds'
import { buildContextCartItem } from '@/services/contextCartService'
import {
  buildSponsoredRequest,
  MAX_SPONSORED_PAGES,
  recommendedPage,
} from '@/services/sponsoredWriteService'

const page = (n: number) => `0x${n.toString(16).padStart(64, '0')}`
const claimOf = (objectId: string) =>
  calculateTripleId(
    SOFIA_I_ATOM_ID,
    CANONICAL_PREDICATE_IDS.recommends,
    objectId,
  )

const base = {
  side: 'support' as const,
  intention: 'Recommend',
  title: 'Page',
  favicon: '',
  intentionColor: '#000',
  curveId: 2 as const,
}

const createRecommend = (objectId: string): CartItem => ({
  ...base,
  id: `recommend:${objectId}`,
  kind: 'create-triple',
  termId: `recommend:${objectId}`,
  subjectId: SOFIA_I_ATOM_ID,
  predicateId: CANONICAL_PREDICATE_IDS.recommends,
  objectId,
})

const depositRecommend = (objectId: string): CartItem => ({
  ...base,
  id: `${claimOf(objectId)}-support`,
  termId: claimOf(objectId),
  objectId,
})

// A context slug whose atom is already on-chain (a tag the relayer can pay)
const KNOWN_SLUG = ['intent:work', 'intent:learning', 'intent:fun'].find(
  (s) => contextAtomRefForSlug(s)?.kind === 'known',
)!

const tagOn = (objectId: string, slug = KNOWN_SLUG) =>
  buildContextCartItem({
    certTermId: claimOf(objectId),
    topicSlug: slug,
    topicLabel: slug,
    topicColor: '#000',
    certTitle: 'Page',
  })!

describe('recommendedPage', () => {
  it('reads both a new claim and a deposit on the existing one', () => {
    expect(recommendedPage(createRecommend(page(1)))).toBe(page(1))
    expect(recommendedPage(depositRecommend(page(2)))).toBe(page(2))
  })

  it('rejects a deposit whose termId is not the page claim', () => {
    expect(
      recommendedPage({ ...depositRecommend(page(2)), termId: page(9) }),
    ).toBeNull()
  })

  it('rejects oppose and other curves', () => {
    expect(
      recommendedPage({ ...createRecommend(page(1)), side: 'oppose' }),
    ).toBeNull()
    expect(
      recommendedPage({ ...createRecommend(page(1)), curveId: 1 }),
    ).toBeNull()
  })
})

describe('buildSponsoredRequest', () => {
  it('groups tags under the page they hang off', () => {
    expect(KNOWN_SLUG).toBeTruthy()
    const req = buildSponsoredRequest([
      createRecommend(page(1)),
      tagOn(page(1)),
      depositRecommend(page(2)),
    ])
    expect(req?.pages).toEqual([
      { objectId: page(1), tags: [KNOWN_SLUG] },
      { objectId: page(2), tags: [] },
    ])
    expect(req?.recommendRows).toHaveLength(2)
  })

  it('is null when a row is not a Recommend or one of its tags', () => {
    expect(
      buildSponsoredRequest([
        createRecommend(page(1)),
        { ...base, id: 'x', termId: page(7), curveId: 1 },
      ]),
    ).toBeNull()
    // A tag on a page that isn't in the cart
    expect(
      buildSponsoredRequest([createRecommend(page(1)), tagOn(page(3))]),
    ).toBeNull()
  })

  it('is null past the per-request page cap', () => {
    const items = Array.from({ length: MAX_SPONSORED_PAGES + 1 }, (_, i) =>
      createRecommend(page(i + 1)),
    )
    expect(buildSponsoredRequest(items)).toBeNull()
    expect(buildSponsoredRequest(items.slice(1))?.pages).toHaveLength(
      MAX_SPONSORED_PAGES,
    )
  })

  it('tags keep the in_context_of predicate', () => {
    expect(tagOn(page(1)).predicateId).toBe(IN_CONTEXT_OF_PREDICATE_ID)
  })
})
