import { describe, it, expect, vi } from 'vitest'

vi.mock('@0xsofia/graphql', () => ({
  useGetTrendingPagePositionsQuery: { fetcher: vi.fn() },
  useGetEcosystemPagePositionsQuery: { fetcher: vi.fn() },
  useGetTrendingPageDetailsQuery: { fetcher: vi.fn() },
  useGetSofiaFeedCertPositionsQuery: { fetcher: vi.fn() },
  useGetSofiaFeedContextPositionsQuery: { fetcher: vi.fn() },
  useGetSofiaFeedTriplesByIdsQuery: { fetcher: vi.fn() },
}))

// eslint-disable-next-line import/first
import {
  rankTrendingPages,
  buildTrendingPages,
  claimSource,
  detailLookups,
  TRENDING_PREDICATE_LABELS,
  ECOSYSTEM_PREDICATE_IDS,
  CANONICAL_SUPPORT_PREDICATE_IDS,
  type TrendingPageRank,
} from '@/services/trendingPagesService'
// eslint-disable-next-line import/first
import {
  CANONICAL_I_ATOM_ID,
  CANONICAL_PREDICATE_IDS,
  PLATFORM_ATOM_IDS,
  SOFIA_I_ATOM_ID,
} from '@/config/atomIds'

const NOW = Date.parse('2026-10-16T12:00:00Z')
const DAY = 24 * 60 * 60 * 1000
const iso = (msAgo: number) => new Date(NOW - msAgo).toISOString()

type Obj = {
  term_id: string
  label: string
  value: { thing: { url: string | null; name?: string | null } | null } | null
}
const thing = (term_id: string, url: string | null, label = term_id): Obj => ({
  term_id,
  label,
  value: { thing: { url, name: label } },
})

function pos(
  object: Obj,
  account: string,
  msAgo: number,
  side: 'support' | 'oppose' = 'support',
  claim = `t-${object.term_id}`,
) {
  return {
    term_id: side === 'support' ? claim : `c-${claim}`,
    account_id: account,
    created_at: iso(msAgo),
    term: {
      triple: { term_id: claim, object_id: object.term_id, object },
    },
  }
}

describe('rankTrendingPages', () => {
  const a = thing('a', 'https://a.example/post')
  const b = thing('b', 'https://b.example/post')
  const c = thing('c', 'https://c.example/post')

  it('counts window support positions and distinct wallets per page', () => {
    const ranks = rankTrendingPages(
      [
        pos(a, '0xAA', 1000),
        pos(a, '0xaa', 2000), // same wallet, other casing
        pos(a, '0xbb', 3000),
        pos(b, '0xcc', 4000),
        pos(b, '0xdd', 5000, 'oppose'), // counter vault — ignored
        pos(c, '0xee', 2 * DAY), // outside a 24h window
      ],
      NOW - DAY,
    )
    expect(ranks).toEqual([
      {
        key: 'a.example/post',
        objectIds: ['a'],
        windowPositions: 3,
        windowSupporters: 2,
        lastPositionAt: iso(1000),
      },
      {
        key: 'b.example/post',
        objectIds: ['b'],
        windowPositions: 1,
        windowSupporters: 1,
        lastPositionAt: iso(4000),
      },
    ])
  })

  it('breaks ties on distinct wallets, then recency', () => {
    const x = thing('x', 'https://x.example')
    const y = thing('y', 'https://y.example')
    const z = thing('z', 'https://z.example')
    const ranks = rankTrendingPages(
      [
        pos(x, '0x1', 10_000),
        pos(x, '0x1', 20_000),
        pos(y, '0x2', 30_000),
        pos(y, '0x3', 40_000),
        pos(z, '0x4', 5_000),
        pos(z, '0x5', 6_000),
      ],
      NOW - DAY,
    )
    expect(ranks.map((r) => r.key)).toEqual([
      'z.example',
      'y.example',
      'x.example',
    ])
  })

  it('merges atoms of the same URL across apps (www, slash, tracking)', () => {
    const sofia = thing('s1', 'https://example.com/post?utm_source=x')
    const other = thing('o1', 'https://www.example.com/post/')
    const old = {
      term_id: 'old',
      label: 'http://example.com/post',
      value: null,
    }
    const ranks = rankTrendingPages(
      [
        pos(sofia, '0x1', 1000),
        pos(other, '0x1', 2000, 'support', 'recommends-o1'),
        pos(old, '0x2', 3000),
      ],
      NOW - DAY,
    )
    expect(ranks).toHaveLength(1)
    expect(ranks[0].key).toBe('example.com/post')
    expect(ranks[0].objectIds.sort()).toEqual(['o1', 'old', 's1'])
    expect(ranks[0].windowPositions).toBe(3)
    expect(ranks[0].windowSupporters).toBe(2)
  })

  it('maps a URL-less platform label to the platform, drops non-web atoms', () => {
    const notion = { term_id: 'n1', label: 'notion', value: { thing: null } }
    const account = { term_id: 'acc', label: '0x1234…abcd', value: null }
    const topic = { term_id: 'golf', label: 'Golf', value: { thing: null } }
    const ranks = rankTrendingPages(
      [
        pos(notion, '0x1', 1000),
        pos(account, '0x2', 1000),
        pos(topic, '0x3', 1),
      ],
      NOW - DAY,
    )
    expect(ranks).toHaveLength(1)
    expect(ranks[0].objectIds).toEqual(['n1'])
    expect(ranks[0].key).not.toMatch(/^platform:/)
  })
})

describe('claimSource', () => {
  it('marks Sofia predicates as Sofia and canonical ones as ecosystem', () => {
    expect(
      claimSource({
        subject_id: SOFIA_I_ATOM_ID,
        predicate: { label: 'visits for work' },
      }),
    ).toBe('sofia')
    expect(
      claimSource({
        subject_id: CANONICAL_I_ATOM_ID,
        predicate: { label: 'recommends' },
      }),
    ).toBe('ecosystem')
  })

  it('only counts trusts from Sofia’s I as Sofia', () => {
    expect(
      claimSource({
        subject_id: SOFIA_I_ATOM_ID,
        predicate: { label: 'trusts' },
      }),
    ).toBe('sofia')
    expect(
      claimSource({
        subject_id: CANONICAL_I_ATOM_ID,
        predicate: { label: 'trusts' },
      }),
    ).toBe('ecosystem')
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
  const rank = (
    key: string,
    objectIds: string[] = [],
    windowPositions = 1,
  ): TrendingPageRank => ({
    key,
    objectIds,
    windowPositions,
    windowSupporters: 1,
    lastPositionAt: iso(0),
  })

  it('merges the claims of a page and picks the main claim', () => {
    const pages = buildTrendingPages(
      [rank('example.com/post', ['p1'], 4)],
      [
        {
          term_id: 'learn',
          counter_term_id: 'learn-c',
          object_id: 'p1',
          subject_id: SOFIA_I_ATOM_ID,
          subject: { term_id: SOFIA_I_ATOM_ID, label: 'I' },
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
          subject_id: SOFIA_I_ATOM_ID,
          subject: { term_id: SOFIA_I_ATOM_ID, label: 'I' },
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
    expect(page.id).toBe('example.com/post')
    expect(page.title).toBe('An article')
    expect(page.domain).toBe('example.com')
    expect(page.totalStaked).toBe('175')
    expect(page.supporters).toBe(2)
    expect(page.claimCount).toBe(2)
    expect(page.atomCount).toBe(1)
    expect(page.sources).toEqual(['sofia'])
    expect(page.mainClaim).toEqual({
      termId: 'learn',
      counterTermId: 'learn-c',
      predicateLabel: 'visits for learning',
    })
    expect(page.firstSupporters.map((s) => s.label)).toEqual(['alice', 'bob'])
    expect(page.firstSupporters[0].createdAt).toBe(iso(9 * DAY))
  })

  it('merges duplicate atoms across apps: distinct wallets, summed stake, earliest signal, busiest claim', () => {
    const otherAtom = {
      ...object,
      term_id: 'p2',
      label: 'Article',
      value: { thing: { url: 'https://www.example.com/post/', name: null } },
    }
    const claim = (
      term_id: string,
      obj: typeof object,
      subject_id: string,
      predicate: string,
      cap: string,
      wallets: string[],
      first: { w: string; ago: number }[],
    ) => ({
      term_id,
      counter_term_id: `${term_id}-c`,
      object_id: obj.term_id,
      subject_id,
      subject: { term_id: subject_id, label: 'I' },
      predicate: { term_id: `pred-${predicate}`, label: predicate },
      object: obj,
      term: { vaults: [{ curve_id: '1', market_cap: cap, position_count: 1 }] },
      supporters: wallets.map((account_id) => ({ account_id })),
      firstPositions: first.map(({ w, ago }) => ({
        account_id: w,
        created_at: iso(ago),
        account: { id: w, label: w, image: null },
      })),
    })
    const pages = buildTrendingPages(
      [rank('example.com/post', ['p1', 'p2'], 3)],
      [
        claim(
          'sofia',
          object,
          SOFIA_I_ATOM_ID,
          'visits for work',
          '10',
          ['0xa'],
          [{ w: '0xa', ago: 2 * DAY }],
        ),
        claim(
          'eco',
          otherAtom,
          CANONICAL_I_ATOM_ID,
          'recommends',
          '30',
          ['0xA', '0xb', '0xc'],
          [
            { w: '0xc', ago: 7 * DAY },
            { w: '0xA', ago: 1 * DAY },
          ],
        ),
        // same claim returned twice by two pages of the details query
        claim(
          'eco',
          otherAtom,
          CANONICAL_I_ATOM_ID,
          'recommends',
          '30',
          [],
          [],
        ),
      ],
    )
    expect(pages).toHaveLength(1)
    const [page] = pages
    expect(page.supporters).toBe(3)
    expect(page.totalStaked).toBe('40')
    expect(page.claimCount).toBe(2)
    expect(page.atomCount).toBe(2)
    expect(page.sources).toEqual(['sofia', 'ecosystem'])
    expect(page.mainClaim?.termId).toBe('eco')
    expect(page.claims.map((c) => [c.termId, c.source, c.supporters])).toEqual([
      ['eco', 'ecosystem', 3],
      ['sofia', 'sofia', 1],
    ])
    expect(page.firstSupporters.map((s) => [s.label, s.createdAt])).toEqual([
      ['0xc', iso(7 * DAY)],
      ['0xa', iso(2 * DAY)],
    ])
  })

  it('drops pages without claims and keeps the ranking order', () => {
    const claim = (objectId: string, obj: typeof object) => ({
      term_id: `t-${objectId}`,
      counter_term_id: `c-${objectId}`,
      object_id: objectId,
      subject_id: SOFIA_I_ATOM_ID,
      subject: { term_id: SOFIA_I_ATOM_ID, label: 'I' },
      predicate: { term_id: 'pt', label: 'trusts' },
      object: obj,
      term: { vaults: [] },
      supporters: [],
      firstPositions: [],
    })
    const pages = buildTrendingPages(
      [
        rank('missing.example'),
        rank('old.example.org/page', ['p2']),
        rank('example.com/post', ['p1']),
      ],
      [
        claim('p1', object),
        claim('p2', {
          ...object,
          term_id: 'p2',
          label: 'https://old.example.org/page',
          value: null,
        }),
      ],
    )
    expect(pages.map((p) => p.id)).toEqual([
      'old.example.org/page',
      'example.com/post',
    ])
    expect(pages[0].domain).toBe('old.example.org')
  })

  it('never ranks distrust claims', () => {
    expect(TRENDING_PREDICATE_LABELS).not.toContain('distrust')
    expect(TRENDING_PREDICATE_LABELS).toContain('trusts')
  })
})

describe('predicate sets', () => {
  it('keeps the two ranking walks disjoint', () => {
    // trusts is covered by the Sofia walk (by label) — not walked twice.
    expect(ECOSYSTEM_PREDICATE_IDS).not.toContain(
      CANONICAL_PREDICATE_IDS.trusts,
    )
    expect(ECOSYSTEM_PREDICATE_IDS).toContain(
      CANONICAL_PREDICATE_IDS.recommends,
    )
    expect(ECOSYSTEM_PREDICATE_IDS).toContain(CANONICAL_PREDICATE_IDS.follow)
    expect(CANONICAL_SUPPORT_PREDICATE_IDS).toContain(
      CANONICAL_PREDICATE_IDS.trusts,
    )
  })
})

describe('detailLookups', () => {
  it('looks up ranked atoms plus URL and platform label variants', () => {
    const lookups = detailLookups([
      {
        key: 'example.com/post',
        objectIds: ['p1', 'p2'],
        windowPositions: 1,
        windowSupporters: 1,
        lastPositionAt: iso(0),
      },
    ])
    expect(lookups.objectIds).toEqual(['p1', 'p2'])
    expect(lookups.objectUrls).toContain('https://example.com/post')
    expect(lookups.objectUrls).toContain('https://www.example.com/post/')
    expect(lookups.objectLabels).toContain('http://example.com/post')
  })

  it('adds platform labels for a platform key', () => {
    const ranks = rankTrendingPages(
      [
        pos(
          { term_id: PLATFORM_ATOM_IDS.youtube, label: 'YouTube', value: null },
          '0x1',
          1,
        ),
      ],
      NOW - DAY,
    )
    const lookups = detailLookups(ranks)
    expect(lookups.objectIds).toEqual([PLATFORM_ATOM_IDS.youtube])
    expect(lookups.objectLabels).toContain('YouTube')
    expect(lookups.objectUrls).toContain('https://www.youtube.com/')
  })
})
