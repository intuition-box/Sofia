import { describe, expect, it } from 'bun:test'
import {
  CANONICAL_PREDICATE_IDS,
  INTENTION_TAG_ATOM_IDS,
  SOFIA_I_ATOM_ID,
} from '@0xsofia/taxonomy'
import {
  buildPlan,
  calculateTripleId,
  MAX_PAGES_PER_REQUEST,
  parseRequest,
  quotaLeft,
  refusal,
  trustToWei,
  windowStarts,
} from './policy'

const PAGE: `0x${string}` = `0x${'ab'.repeat(32)}`
const limits = {
  quotaMonthly: 20,
  quotaDaily: 5,
  budgetMonthlyWei: trustToWei(500),
}

describe('calculateTripleId', () => {
  it('matches an indexed mainnet triple', () => {
    expect(
      calculateTripleId(
        '0x6a211e8c68a75350e478285334200c1208fc3cf5361881daeb088cbb466ba7eb',
        '0x3e2718cc4288b5b32fb65fed9e439c35419026f5b24f02e87264dbd48f0f52bf',
        '0x17a168c6ca7d9fc54c150642326497778d140d58a621a2a23f5a22b71b7f3375',
      ),
    ).toBe('0x01028f2cbc0922dd57bbc0a236d4c79a4b6a9f89a731043f3aebfa192bed84a4')
  })
})

describe('parseRequest', () => {
  it('dedupes pages, lowercases ids and caps tags', () => {
    const r = parseRequest({
      pages: [
        { objectId: `0x${'AB'.repeat(32)}`, tags: ['a'] },
        { objectId: PAGE, tags: ['intent:work', 'intent:fun', 'intent:music'] },
      ],
    })
    expect('pages' in r && r.pages).toEqual([
      { objectId: PAGE, tags: ['intent:work', 'intent:fun'] },
    ])
  })

  it('refuses bad input', () => {
    expect(parseRequest({})).toEqual({ error: 'No pages' })
    expect(parseRequest({ pages: [{ objectId: '0x12' }] })).toEqual({
      error: 'Invalid page id',
    })
    const many = Array.from({ length: MAX_PAGES_PER_REQUEST + 1 }, (_, i) => ({
      objectId: `0x${String(i).padStart(64, '0')}`,
    }))
    expect('error' in parseRequest({ pages: many })).toBe(true)
  })
})

describe('buildPlan', () => {
  it('builds the Recommend on curve 2 and known tags under it', () => {
    const { claims, tags } = buildPlan([
      { objectId: PAGE as `0x${string}`, tags: ['intent:work', 'no-such-tag'] },
    ])
    expect(claims).toHaveLength(1)
    expect(claims[0].curveId).toBe(2n)
    expect(claims[0].tripleId).toBe(
      calculateTripleId(
        SOFIA_I_ATOM_ID,
        CANONICAL_PREDICATE_IDS.recommends,
        PAGE,
      ),
    )
    expect(tags).toHaveLength(1)
    expect(tags[0].subjectId).toBe(claims[0].tripleId)
    expect(String(tags[0].objectId)).toBe(
      String(INTENTION_TAG_ATOM_IDS['intent:work']),
    )
    expect(tags[0].curveId).toBe(1n)
  })
})

describe('quota and budget', () => {
  it('takes the tighter of the day and the month', () => {
    expect(quotaLeft({ month: 0, day: 0 }, limits)).toBe(5)
    expect(quotaLeft({ month: 18, day: 0 }, limits)).toBe(2)
    expect(quotaLeft({ month: 3, day: 5 }, limits)).toBe(0)
  })

  it('refuses past the quota or the budget', () => {
    expect(refusal(2, { month: 0, day: 0 }, limits, 0n, 0n)).toBeNull()
    expect(refusal(1, { month: 0, day: 5 }, limits, 0n, 0n)).toMatch(/tomorrow/)
    expect(refusal(3, { month: 18, day: 0 }, limits, 0n, 0n)).toMatch(
      /2 free Recommends left this month/,
    )
    expect(
      refusal(
        1,
        { month: 0, day: 0 },
        limits,
        trustToWei(499.9),
        trustToWei(0.25),
      ),
    ).toMatch(/paused/)
  })

  it('opens windows at UTC midnight and the 1st', () => {
    const w = windowStarts(new Date('2026-10-28T15:00:00Z'))
    expect(w.month.toISOString()).toBe('2026-10-01T00:00:00.000Z')
    expect(w.day.toISOString()).toBe('2026-10-28T00:00:00.000Z')
  })
})
