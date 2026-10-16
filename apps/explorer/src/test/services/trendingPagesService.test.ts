import { describe, it, expect, vi } from 'vitest'

vi.mock('@0xsofia/graphql', () => ({
  useGetTrendingPagePositionsQuery: { fetcher: vi.fn() },
  useGetTrendingPageDetailsQuery: { fetcher: vi.fn() },
  useGetSofiaFeedCertPositionsQuery: { fetcher: vi.fn() },
  useGetSofiaFeedContextPositionsQuery: { fetcher: vi.fn() },
  useGetSofiaFeedTriplesByIdsQuery: { fetcher: vi.fn() },
}))

// eslint-disable-next-line import/first
import {
  rankTrendingPages,
  buildTrendingPages,
  TRENDING_PREDICATE_LABELS,
} from '@/services/trendingPagesService'

const NOW = Date.parse('2026-10-16T12:00:00Z')
const DAY = 24 * 60 * 60 * 1000
const iso = (msAgo: number) => new Date(NOW - msAgo).toISOString()

function pos(
  objectId: string,
  account: string,
  msAgo: number,
  side: 'support' | 'oppose' = 'support',
) {
  const tripleId = `t-${objectId}`
  return {
    term_id: side === 'support' ? tripleId : `c-${objectId}`,
    account_id: account,
    created_at: iso(msAgo),
    term: { triple: { term_id: tripleId, object_id: objectId } },
  }
}

describe('rankTrendingPages', () => {
  it('counts window support positions and distinct wallets per page', () => {
    const ranks = rankTrendingPages(
      [
        pos('a', '0xAA', 1000),
        pos('a', '0xaa', 2000), // same wallet, other casing
        pos('a', '0xbb', 3000),
        pos('b', '0xcc', 4000),
        pos('b', '0xdd', 5000, 'oppose'), // counter vault — ignored
        pos('c', '0xee', 2 * DAY), // outside a 24h window
      ],
      NOW - DAY,
    )
    expect(ranks).toEqual([
      {
        objectId: 'a',
        windowPositions: 3,
        windowSupporters: 2,
        lastPositionAt: iso(1000),
      },
      {
        objectId: 'b',
        windowPositions: 1,
        windowSupporters: 1,
        lastPositionAt: iso(4000),
      },
    ])
  })

  it('breaks ties on distinct wallets, then recency', () => {
    const ranks = rankTrendingPages(
      [
        pos('x', '0x1', 10_000),
        pos('x', '0x1', 20_000),
        pos('y', '0x2', 30_000),
        pos('y', '0x3', 40_000),
        pos('z', '0x4', 5_000),
        pos('z', '0x5', 6_000),
      ],
      NOW - DAY,
    )
    expect(ranks.map((r) => r.objectId)).toEqual(['z', 'y', 'x'])
  })
})

describe('buildTrendingPages', () => {
  const object = {
    term_id: 'p1',
    label: 'Some article',
    image: null,
    type: 'Thing',
    wallet_id: '0x0',
    value: { thing: { url: 'https://example.com/post', name: 'An article' } },
  }

  it('merges the claims of a page and picks the main claim', () => {
    const pages = buildTrendingPages(
      [
        {
          objectId: 'p1',
          windowPositions: 4,
          windowSupporters: 3,
          lastPositionAt: iso(0),
        },
      ],
      [
        {
          term_id: 'learn',
          counter_term_id: 'learn-c',
          object_id: 'p1',
          predicate: { term_id: 'pl', label: 'visits for learning' },
          object,
          term: {
            vaults: [
              { curve_id: '1', market_cap: '100', position_count: 2 },
              { curve_id: '2', market_cap: '50', position_count: 1 },
            ],
          },
          supporters: [{ account_id: '0xA' }, { account_id: '0xB' }],
          firstPositions: [
            {
              account_id: '0xB',
              created_at: iso(5 * DAY),
              account: { id: '0xB', label: 'bob', image: null },
            },
            {
              account_id: '0xA',
              created_at: iso(3 * DAY),
              account: { id: '0xA', label: 'alice', image: null },
            },
          ],
        },
        {
          term_id: 'trust',
          counter_term_id: 'trust-c',
          object_id: 'p1',
          predicate: { term_id: 'pt', label: 'trusts' },
          object,
          term: {
            vaults: [{ curve_id: '1', market_cap: '25', position_count: 1 }],
          },
          supporters: [{ account_id: '0xa' }],
          firstPositions: [
            {
              account_id: '0xa',
              created_at: iso(9 * DAY), // alice's earliest position
              account: { id: '0xa', label: 'alice', image: null },
            },
          ],
        },
      ],
    )
    expect(pages).toHaveLength(1)
    const [page] = pages
    expect(page.title).toBe('An article')
    expect(page.domain).toBe('example.com')
    expect(page.totalStaked).toBe('175')
    expect(page.supporters).toBe(2)
    expect(page.claimCount).toBe(2)
    expect(page.mainClaim).toEqual({
      termId: 'learn',
      counterTermId: 'learn-c',
      predicateLabel: 'visits for learning',
    })
    expect(page.firstSupporters.map((s) => s.label)).toEqual(['alice', 'bob'])
    expect(page.firstSupporters[0].createdAt).toBe(iso(9 * DAY))
  })

  it('drops pages without a URL and keeps the ranking order', () => {
    const account = {
      ...object,
      term_id: 'acc',
      label: '0x1234…abcd',
      value: { thing: null },
    }
    const claim = (objectId: string, obj: typeof object) => ({
      term_id: `t-${objectId}`,
      counter_term_id: `c-${objectId}`,
      object_id: objectId,
      predicate: { term_id: 'pt', label: 'trusts' },
      object: obj,
      term: { vaults: [] },
      supporters: [],
      firstPositions: [],
    })
    const rank = (objectId: string) => ({
      objectId,
      windowPositions: 1,
      windowSupporters: 1,
      lastPositionAt: iso(0),
    })
    const pages = buildTrendingPages(
      [rank('acc'), rank('p2'), rank('p1')],
      [
        claim('acc', account),
        claim('p1', object),
        claim('p2', {
          ...object,
          term_id: 'p2',
          label: 'https://old.example.org/page',
          value: null,
        }),
      ],
    )
    expect(pages.map((p) => p.id)).toEqual(['p2', 'p1'])
    expect(pages[0].domain).toBe('old.example.org')
  })

  it('never ranks distrust claims', () => {
    expect(TRENDING_PREDICATE_LABELS).not.toContain('distrust')
    expect(TRENDING_PREDICATE_LABELS).toContain('trusts')
  })
})
