import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@0xsofia/graphql', () => ({
  useGetSofiaTrustedActivityQuery: { fetcher: vi.fn() },
  useGetFollowingCountQuery: { fetcher: vi.fn() },
}))

vi.mock('@/services/feedProcessing', () => ({
  processEvents: vi.fn(() => []),
  enrichWithTopicContexts: vi.fn(() => Promise.resolve()),
}))

// eslint-disable-next-line import/first
import {
  useGetSofiaTrustedActivityQuery,
  useGetFollowingCountQuery,
} from '@0xsofia/graphql'
// eslint-disable-next-line import/first
import { processEvents } from '@/services/feedProcessing'
// eslint-disable-next-line import/first
import { fetchCircleFeed, fetchFollowingCount } from '@/services/circleService'

const mockedActivityFetcher =
  useGetSofiaTrustedActivityQuery.fetcher as unknown as ReturnType<typeof vi.fn>
const mockedFollowingFetcher =
  useGetFollowingCountQuery.fetcher as unknown as ReturnType<typeof vi.fn>
const mockedProcess = processEvents as unknown as ReturnType<typeof vi.fn>

describe('circleService.fetchCircleFeed', () => {
  beforeEach(() => {
    mockedActivityFetcher.mockReset()
    mockedProcess.mockReset().mockReturnValue([])
  })

  it('returns empty array when no certifier wallets are provided (no queries fired)', async () => {
    const result = await fetchCircleFeed([], [])
    expect(result).toEqual([])
    expect(mockedActivityFetcher).not.toHaveBeenCalled()
  })

  it('passes the certifier wallets as trustedWallets and the viewer wallets as userAddresses', async () => {
    mockedActivityFetcher.mockReturnValue(() => Promise.resolve({ events: [] }))

    await fetchCircleFeed(
      [
        '0xc6344b9D5d6F3c4B9d5d6f3C4b9d5D6F3c4B9D5D',
        '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
      ],
      ['0xAaAaaAaAAaAaAaAaAaaAaaAaAAaAaAaaAAaaaAaA'],
    )

    const call = mockedActivityFetcher.mock.calls[0][0]
    expect(call.trustedWallets).toHaveLength(2)
    expect(call.userAddresses).toHaveLength(1)
    // Checksummed format check (mixed case)
    for (const w of [...call.trustedWallets, ...call.userAddresses]) {
      expect(w).toMatch(/^0x[0-9a-fA-F]{40}$/)
    }
  })

  it('passes through the limit/offset to the activity fetcher', async () => {
    mockedActivityFetcher.mockReturnValue(() => Promise.resolve({ events: [] }))

    await fetchCircleFeed(
      ['0xc6344b9D5d6F3c4B9d5d6f3C4b9d5D6F3c4B9D5D'],
      [],
      50,
      100,
    )

    const call = mockedActivityFetcher.mock.calls[0][0]
    expect(call.limit).toBe(50)
    expect(call.offset).toBe(100)
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

    expect(mockedFollowingFetcher).toHaveBeenCalledWith({
      address: '0xaaaaaaaa',
    })
    expect(count).toBe(17)
  })

  it('returns 0 on fetcher rejection', async () => {
    mockedFollowingFetcher.mockReturnValue(() =>
      Promise.reject(new Error('boom')),
    )
    const count = await fetchFollowingCount('0xAAA')
    expect(count).toBe(0)
  })
})
