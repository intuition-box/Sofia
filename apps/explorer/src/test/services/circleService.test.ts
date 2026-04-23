import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@0xsofia/graphql', () => ({
  useGetTrustCircleAccountsQuery: { fetcher: vi.fn() },
  useGetSofiaTrustedActivityQuery: { fetcher: vi.fn() },
  useGetFollowingCountQuery: { fetcher: vi.fn() },
}))

vi.mock('@/services/feedProcessing', () => ({
  processEvents: vi.fn(() => []),
  enrichWithTopicContexts: vi.fn(() => Promise.resolve()),
}))

// eslint-disable-next-line import/first
import {
  useGetTrustCircleAccountsQuery,
  useGetSofiaTrustedActivityQuery,
  useGetFollowingCountQuery,
} from '@0xsofia/graphql'
// eslint-disable-next-line import/first
import { processEvents } from '@/services/feedProcessing'
// eslint-disable-next-line import/first
import {
  fetchCircleFeed,
  fetchFollowingCount,
  __clearTrustedWalletsCacheForTests,
} from '@/services/circleService'
// eslint-disable-next-line import/first
import { PREDICATE_IDS, SUBJECT_IDS } from '@/config'

const mockedTrustFetcher = useGetTrustCircleAccountsQuery.fetcher as unknown as ReturnType<typeof vi.fn>
const mockedActivityFetcher = useGetSofiaTrustedActivityQuery.fetcher as unknown as ReturnType<typeof vi.fn>
const mockedFollowingFetcher = useGetFollowingCountQuery.fetcher as unknown as ReturnType<typeof vi.fn>
const mockedProcess = processEvents as unknown as ReturnType<typeof vi.fn>

describe('circleService.fetchCircleFeed', () => {
  beforeEach(() => {
    mockedTrustFetcher.mockReset()
    mockedActivityFetcher.mockReset()
    mockedProcess.mockReset().mockReturnValue([])
    __clearTrustedWalletsCacheForTests()
  })

  it('returns empty array when no addresses are linked (no queries fired)', async () => {
    const result = await fetchCircleFeed([])
    expect(result).toEqual([])
    expect(mockedTrustFetcher).not.toHaveBeenCalled()
    expect(mockedActivityFetcher).not.toHaveBeenCalled()
  })

  it('passes the addresses array as walletAddresses to the trust circle query', async () => {
    mockedTrustFetcher.mockReturnValue(() => Promise.resolve({ triples: [] }))

    await fetchCircleFeed(['0xAAA', '0xBBB'])

    expect(mockedTrustFetcher).toHaveBeenCalledWith({
      subjectId: SUBJECT_IDS.I,
      predicateId: PREDICATE_IDS.TRUSTS,
      walletAddresses: ['0xAAA', '0xBBB'],
    })
  })

  it('returns empty array when the user trusts no one', async () => {
    mockedTrustFetcher.mockReturnValue(() => Promise.resolve({ triples: [] }))
    const result = await fetchCircleFeed(['0xAAA'])
    expect(result).toEqual([])
    expect(mockedActivityFetcher).not.toHaveBeenCalled()
  })

  it('unions all trusted-account ids across the returned triples', async () => {
    mockedTrustFetcher.mockReturnValue(() =>
      Promise.resolve({
        triples: [
          { object: { accounts: [{ id: '0xc6344b9D5d6F3c4B9d5d6f3C4b9d5D6F3c4B9D5D' }] } },
          { object: { accounts: [{ id: '0x8ba1f109551bD432803012645Ac136ddd64DBA72' }] } },
        ],
      }),
    )
    mockedActivityFetcher.mockReturnValue(() => Promise.resolve({ events: [] }))

    await fetchCircleFeed(['0xAAA'])

    const activityCall = mockedActivityFetcher.mock.calls[0][0]
    expect(activityCall.trustedWallets).toHaveLength(2)
    // Checksummed format check (mixed case)
    for (const w of activityCall.trustedWallets) {
      expect(w).toMatch(/^0x[0-9a-fA-F]{40}$/)
    }
  })

  it('caches trusted wallets per address set and skips the first fetcher on reuse', async () => {
    mockedTrustFetcher.mockReturnValue(() =>
      Promise.resolve({
        triples: [{ object: { accounts: [{ id: '0xc6344b9D5d6F3c4B9d5d6f3C4b9d5D6F3c4B9D5D' }] } }],
      }),
    )
    mockedActivityFetcher.mockReturnValue(() => Promise.resolve({ events: [] }))

    await fetchCircleFeed(['0xAAA'])
    await fetchCircleFeed(['0xAAA'])

    expect(mockedTrustFetcher).toHaveBeenCalledTimes(1)
    expect(mockedActivityFetcher).toHaveBeenCalledTimes(2)
  })

  it('re-fetches trust circle when the address set changes', async () => {
    mockedTrustFetcher.mockReturnValue(() =>
      Promise.resolve({
        triples: [{ object: { accounts: [{ id: '0xc6344b9D5d6F3c4B9d5d6f3C4b9d5D6F3c4B9D5D' }] } }],
      }),
    )
    mockedActivityFetcher.mockReturnValue(() => Promise.resolve({ events: [] }))

    await fetchCircleFeed(['0xAAA'])
    await fetchCircleFeed(['0xAAA', '0xBBB'])

    expect(mockedTrustFetcher).toHaveBeenCalledTimes(2)
  })
})

describe('circleService.fetchFollowingCount', () => {
  beforeEach(() => {
    mockedFollowingFetcher.mockReset()
  })

  it('reads the aggregate count from the Hasura function response', async () => {
    mockedFollowingFetcher.mockReturnValue(() =>
      Promise.resolve({ following_aggregate: { aggregate: { count: 17 } } }),
    )

    const count = await fetchFollowingCount('0xAaAaAAaA')

    expect(mockedFollowingFetcher).toHaveBeenCalledWith({ address: '0xaaaaaaaa' })
    expect(count).toBe(17)
  })

  it('returns 0 on fetcher rejection', async () => {
    mockedFollowingFetcher.mockReturnValue(() => Promise.reject(new Error('boom')))
    const count = await fetchFollowingCount('0xAAA')
    expect(count).toBe(0)
  })
})
