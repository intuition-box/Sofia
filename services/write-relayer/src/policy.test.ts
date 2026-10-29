import { describe, expect, it } from 'bun:test'
import {
  CANONICAL_PREDICATE_IDS,
  INTENTION_TAG_ATOM_IDS,
  SOFIA_I_ATOM_ID,
} from '@0xsofia/taxonomy'
import {
  buildOpposePlan,
  buildPlan,
  calculateCounterId,
  calculateTripleId,
  parseThing,
  MAX_PAGES_PER_REQUEST,
  parseRequest,
  quotaLeft,
  refusal,
  trustToWei,
  recommendClaimId,
  splitOpinions,
  windowStarts,
  withCredits,
} from './policy'

const PAGE: `0x${string}` = `0x${'ab'.repeat(32)}`
const limits = {
  quotaMonthly: 20,
  quotaDaily: 5,
  budgetMonthlyWei: trustToWei(500),
  budgetDailyWei: trustToWei(17),
}
const none = { month: 0n, day: 0n }

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
    expect(refusal(2, { month: 0, day: 0 }, limits, none, 0n)).toBeNull()
    expect(refusal(1, { month: 0, day: 5 }, limits, none, 0n)).toMatch(
      /tomorrow/,
    )
    expect(refusal(3, { month: 18, day: 0 }, limits, none, 0n)).toMatch(
      /2 free Recommends left this month/,
    )
    expect(
      refusal(
        1,
        { month: 0, day: 0 },
        limits,
        { month: trustToWei(499.9), day: 0n },
        trustToWei(0.25),
      ),
    ).toMatch(/paused for this month/)
    expect(
      refusal(
        1,
        { month: 0, day: 0 },
        limits,
        { month: trustToWei(20), day: trustToWei(16.9) },
        trustToWei(0.25),
      ),
    ).toMatch(/until tomorrow/)
  })

  it('opens windows at UTC midnight and the 1st', () => {
    const w = windowStarts(new Date('2026-10-28T15:00:00Z'))
    expect(w.month.toISOString()).toBe('2026-10-01T00:00:00.000Z')
    expect(w.day.toISOString()).toBe('2026-10-28T00:00:00.000Z')
  })
})

describe('withCredits', () => {
  it('a Trend Hunter call raises the month and the day alike', () => {
    const mine = withCredits(limits, 6)
    expect(mine.quotaMonthly).toBe(26)
    expect(mine.quotaDaily).toBe(11)
    expect(mine.budgetDailyWei).toBe(limits.budgetDailyWei)
    // Daily quota used up: credits still let them through
    expect(refusal(3, { month: 5, day: 5 }, mine, none, 0n)).toBeNull()
    expect(quotaLeft({ month: 20, day: 0 }, mine)).toBe(6)
  })

  it('the relayer budget still caps an account with credits', () => {
    const spent = { month: 0n, day: trustToWei(17) }
    expect(
      refusal(1, { month: 0, day: 0 }, withCredits(limits, 30), spent, 1n),
    ).toBe('Free Recommends are paused until tomorrow')
  })

  it('ignores negative or fractional credits', () => {
    expect(withCredits(limits, -3).quotaMonthly).toBe(20)
    expect(withCredits(limits, 2.9).quotaDaily).toBe(7)
  })
})

describe('second opinions', () => {
  it('the counter vault id matches an indexed mainnet triple', () => {
    expect(
      calculateCounterId(
        '0x01028f2cbc0922dd57bbc0a236d4c79a4b6a9f89a731043f3aebfa192bed84a4',
      ),
    ).toBe('0xf3be996f9f1ad5a8c98a1168fd3e3d148326abc0a2a512530c63f9f02a6d4758')
  })

  it('an oppose deposits on the page claim counter vault, curve 2', () => {
    const [oppose] = buildOpposePlan([PAGE])
    expect(oppose.tripleId).toBe(calculateCounterId(recommendClaimId(PAGE)))
    expect(oppose.curveId).toBe(2n)
  })

  it('opinions go first within their allowance, the rest to the quota', () => {
    const split = splitOpinions(['a', 'b', 'c'], (x) => x !== 'b', 1)
    expect(split).toEqual({ opinions: ['a'], quota: ['b', 'c'] })
  })

  it('opinions have their own daily cap, outside the quota', () => {
    const mine = { ...limits, opinionsDaily: 5 }
    // Quota used up for the day: an opinion still goes through
    expect(refusal(0, { month: 5, day: 5 }, mine, none, 0n, 2)).toBeNull()
    expect(
      refusal(0, { month: 0, day: 0, opinionsDay: 4 }, mine, none, 0n, 2),
    ).toBe('Daily free opinions used — come back tomorrow')
  })
})

describe('new pages (extension)', () => {
  const thing = {
    name: 'A page',
    description: 'Page: example.com/a',
    url: 'https://example.com/a',
    image: 'https://www.google.com/s2/favicons?domain=example.com&sz=128',
  }

  it('takes a page with no atom yet, deduped by url', () => {
    const r = parseRequest({ pages: [{ thing }, { thing, tags: ['x'] }] })
    expect('pages' in r && r.pages).toEqual([{ thing, tags: ['x'] }])
  })

  it('refuses a page that is not a web page', () => {
    expect(parseThing({ ...thing, url: 'javascript:alert(1)' })).toBeNull()
    expect(parseThing({ ...thing, name: '' })).toBeNull()
    expect(
      parseThing({ ...thing, image: 'data:image/png;base64,x' }),
    ).toBeNull()
    expect(parseThing({ ...thing, image: undefined })).toEqual({
      name: thing.name,
      description: thing.description,
      url: thing.url,
    })
  })
})
