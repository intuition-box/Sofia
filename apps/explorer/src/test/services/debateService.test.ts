import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@0xsofia/graphql', () => ({
  useGetClaimsByTermIdsQuery: {
    fetcher: vi.fn(),
  },
}))

// Keep the claim catalogue deterministic regardless of the real config.
vi.mock('@/config/debateConfig', () => ({
  INTUITION_FEATURED_CLAIMS: [
    {
      tripleTermId: 'term-1',
      subject: 'default-subject-1',
      predicate: 'default-predicate-1',
      object: 'default-object-1',
      category: 'intuition',
    },
  ],
  SOFIA_CLAIMS: [
    {
      tripleTermId: 'term-2',
      subject: 'default-subject-2',
      predicate: 'default-predicate-2',
      object: 'default-object-2',
      category: 'sofia',
    },
  ],
}))

// eslint-disable-next-line import/first
import { useGetClaimsByTermIdsQuery } from '@0xsofia/graphql'
// eslint-disable-next-line import/first
import { fetchDebateClaims } from '@/services/debateService'

const mockedFetcher = useGetClaimsByTermIdsQuery.fetcher as unknown as ReturnType<typeof vi.fn>

describe('debateService.fetchDebateClaims', () => {
  beforeEach(() => {
    mockedFetcher.mockReset()
  })

  it('calls the fetcher with termIds from both claim lists and empty addresses', async () => {
    mockedFetcher.mockReturnValue(() => Promise.resolve({ triples: [] }))

    await fetchDebateClaims()

    expect(mockedFetcher).toHaveBeenCalledTimes(1)
    expect(mockedFetcher).toHaveBeenCalledWith({
      termIds: ['term-2', 'term-1'], // SOFIA_CLAIMS first, then INTUITION_FEATURED_CLAIMS
      addresses: [],
    })
  })

  it('maps returned triples to DebateClaim with aggregated vault data', async () => {
    mockedFetcher.mockReturnValue(() =>
      Promise.resolve({
        triples: [
          {
            term_id: 'term-1',
            counter_term_id: 'counter-1',
            subject: { label: 'Earth' },
            predicate: { label: 'is' },
            object: { label: 'flat' },
            term: {
              vaults: [
                { market_cap: '1000', position_count: 3 },
                { market_cap: '500', position_count: 2 },
              ],
            },
            counter_term: {
              vaults: [{ market_cap: '250', position_count: 10 }],
            },
          },
        ],
      }),
    )

    const claims = await fetchDebateClaims()

    expect(claims).toHaveLength(1)
    const claim = claims[0]
    expect(claim.termId).toBe('term-1')
    expect(claim.counterTermId).toBe('counter-1')
    expect(claim.subject).toBe('Earth')
    expect(claim.predicate).toBe('is')
    expect(claim.object).toBe('flat')
    expect(claim.supportMarketCap).toBe(1500n)
    expect(claim.opposeMarketCap).toBe(250n)
    expect(claim.supportCount).toBe(5)
    expect(claim.opposeCount).toBe(10)
    expect(claim.category).toBe('intuition') // from config fallback
  })

  it('falls back to the config defaults when the triple fields are missing', async () => {
    mockedFetcher.mockReturnValue(() =>
      Promise.resolve({
        triples: [
          {
            term_id: 'term-2',
            counter_term_id: null,
            subject: null,
            predicate: null,
            object: null,
            term: null,
            counter_term: null,
          },
        ],
      }),
    )

    const claims = await fetchDebateClaims()
    expect(claims[0].subject).toBe('default-subject-2')
    expect(claims[0].predicate).toBe('default-predicate-2')
    expect(claims[0].object).toBe('default-object-2')
    expect(claims[0].counterTermId).toBe('')
    expect(claims[0].supportMarketCap).toBe(0n)
    expect(claims[0].opposeMarketCap).toBe(0n)
  })

  it('returns empty array when no termIds are configured', async () => {
    // Reset the mocked config to empty for this test.
    vi.doMock('@/config/debateConfig', () => ({
      INTUITION_FEATURED_CLAIMS: [],
      SOFIA_CLAIMS: [],
    }))
    vi.resetModules()

    const { fetchDebateClaims: freshFetch } = await import('@/services/debateService')
    const claims = await freshFetch()
    expect(claims).toEqual([])
    expect(mockedFetcher).not.toHaveBeenCalled()

    vi.doUnmock('@/config/debateConfig')
    vi.resetModules()
  })
})
