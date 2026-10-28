import { describe, expect, it } from 'vitest'
import { CANONICAL_PREDICATE_IDS, SOFIA_I_ATOM_ID } from '@/config/atomIds'
import { calculateCounterId } from '@/lib/contracts/termIds'
import {
  pageVoteCartItem,
  recommendClaimId,
} from '@/services/pageMarketCartService'
import { buildSponsoredRequest } from '@/services/sponsoredWriteService'

const objectId = `0x${'ab'.repeat(32)}`
const page = { objectId, title: 'Page', favicon: '' }

describe('pageVoteCartItem', () => {
  it('a 👍 Recommends the page, whether or not the claim exists', () => {
    for (const exists of [true, false]) {
      const row = pageVoteCartItem('support', page, exists)
      expect(row).toMatchObject({
        kind: 'create-triple',
        termId: recommendClaimId(objectId),
        subjectId: SOFIA_I_ATOM_ID,
        predicateId: CANONICAL_PREDICATE_IDS.recommends,
        objectId,
        curveId: 2,
      })
    }
  })

  it('a 👎 deposits on the claim counter vault, only once the claim exists', () => {
    expect(pageVoteCartItem('oppose', page, false)).toBeNull()
    expect(pageVoteCartItem('oppose', page, true)).toMatchObject({
      side: 'oppose',
      termId: calculateCounterId(recommendClaimId(objectId)).toLowerCase(),
      curveId: 2,
    })
  })

  it('no page, no row', () => {
    expect(pageVoteCartItem('support', { ...page, objectId: '' }, true)).toBe(
      null,
    )
  })

  it('a 👍 is free for sponsored accounts, a 👎 is not', () => {
    const up = pageVoteCartItem('support', page, true)!
    const down = pageVoteCartItem('oppose', page, true)!
    expect(buildSponsoredRequest([up])?.pages).toEqual([{ objectId, tags: [] }])
    expect(buildSponsoredRequest([down])).toBeNull()
  })
})
