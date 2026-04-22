import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@0xsofia/graphql', () => ({
  useGetTrendingByPredicateQuery: {
    fetcher: vi.fn(),
  },
}))

// Utilities reach the network / filesystem in their real implementations;
// stub them so the service under test stays isolated.
vi.mock('@/utils/favicon', () => ({
  getFaviconUrl: vi.fn((domain: string) => `https://fav/${domain}`),
}))
vi.mock('@/utils/formatting', () => ({
  extractDomain: vi.fn((url: string) => {
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  }),
  cleanLabel: vi.fn((x: string) => x),
}))

// eslint-disable-next-line import/first
import { useGetTrendingByPredicateQuery } from '@0xsofia/graphql'
// eslint-disable-next-line import/first
import {
  isValidTriple,
  tripleToItem,
  fetchTrendingItems,
} from '@/services/trendingService'

const mockedFetcher = useGetTrendingByPredicateQuery.fetcher as unknown as ReturnType<typeof vi.fn>

const sampleValidTriple = {
  term_id: 't-1',
  counter_term_id: 'ct-1',
  object: {
    label: 'example.com',
    value: { thing: { url: 'https://example.com' } },
  },
  all_positions: [{ account: { id: '0xabc' } }],
}

describe('trendingService — pure helpers', () => {
  it('isValidTriple: filters ENS-suffixed labels', () => {
    expect(
      isValidTriple({
        ...sampleValidTriple,
        object: { label: 'alice.eth', value: { thing: { url: 'https://alice.eth' } } },
      } as never),
    ).toBe(false)
  })

  it('isValidTriple: filters wallet-shaped labels', () => {
    expect(
      isValidTriple({
        ...sampleValidTriple,
        object: { label: '0xabcdef', value: null },
      } as never),
    ).toBe(false)
  })

  it('isValidTriple: rejects triples with zero certifiers', () => {
    expect(isValidTriple({ ...sampleValidTriple, all_positions: [] } as never)).toBe(false)
  })

  it('isValidTriple: accepts a legitimate URL triple', () => {
    expect(isValidTriple(sampleValidTriple as never)).toBe(true)
  })

  it('tripleToItem: builds a TrendingItemLive with domain + favicon', () => {
    const item = tripleToItem(sampleValidTriple as never, 'work')
    expect(item.category).toBe('work')
    expect(item.domain).toBe('example.com')
    expect(item.favicon).toBe('https://fav/example.com')
    expect(item.certifiers).toBe(1)
    expect(item.termId).toBe('t-1')
    expect(item.counterTermId).toBe('ct-1')
  })
})

describe('trendingService.fetchTrendingItems', () => {
  beforeEach(() => {
    mockedFetcher.mockReset()
  })

  it('calls the fetcher once per category (6 categories)', async () => {
    mockedFetcher.mockReturnValue(() => Promise.resolve({ triples: [] }))

    await fetchTrendingItems()

    expect(mockedFetcher).toHaveBeenCalledTimes(6)
    // Each call must pass a predicateId + limit. Offset is optional ($offset: Int = 0).
    for (const call of mockedFetcher.mock.calls) {
      expect(call[0]).toHaveProperty('predicateId')
      expect(call[0]).toHaveProperty('limit', 5)
    }
  })

  it('returns one item per category for which a valid triple is found', async () => {
    mockedFetcher.mockReturnValue(() =>
      Promise.resolve({ triples: [sampleValidTriple] }),
    )

    const items = await fetchTrendingItems()
    expect(items).toHaveLength(6)
    // All 6 categories should be represented.
    const categories = items.map((i) => i.category)
    expect(new Set(categories).size).toBe(6)
  })

  it('drops categories whose only triple is invalid', async () => {
    mockedFetcher.mockReturnValue(() =>
      Promise.resolve({
        triples: [
          { ...sampleValidTriple, object: { label: 'alice.eth', value: null } },
        ],
      }),
    )

    const items = await fetchTrendingItems()
    expect(items).toHaveLength(0)
  })

  it('gracefully handles rejected category fetches via Promise.allSettled', async () => {
    // First 3 categories succeed with a valid triple, last 3 reject.
    let call = 0
    mockedFetcher.mockImplementation(() => () => {
      call++
      if (call <= 3) return Promise.resolve({ triples: [sampleValidTriple] })
      return Promise.reject(new Error('indexer flake'))
    })

    const items = await fetchTrendingItems()
    expect(items).toHaveLength(3)
  })
})
