import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAddress } from 'viem'

vi.mock('@0xsofia/graphql', () => ({
  useGetUserActivityQuery: {
    fetcher: vi.fn(),
  },
}))

vi.mock('@/services/feedProcessing', () => ({
  processEvents: vi.fn(() => []),
  enrichWithTopicContexts: vi.fn(() => Promise.resolve()),
}))

// eslint-disable-next-line import/first
import { useGetUserActivityQuery } from '@0xsofia/graphql'
// eslint-disable-next-line import/first
import { processEvents } from '@/services/feedProcessing'
// eslint-disable-next-line import/first
import { fetchUserActivity } from '@/services/domainActivityService'

const mockedFetcher = useGetUserActivityQuery.fetcher as unknown as ReturnType<
  typeof vi.fn
>
const mockedProcess = processEvents as unknown as ReturnType<typeof vi.fn>

describe('domainActivityService.fetchUserActivity', () => {
  beforeEach(() => {
    mockedFetcher.mockReset()
    mockedProcess.mockReset().mockReturnValue([])
  })

  it('returns an empty array immediately when no addresses are provided (no query fired)', async () => {
    const result = await fetchUserActivity([])
    expect(result).toEqual([])
    expect(mockedFetcher).not.toHaveBeenCalled()
  })

  it('passes both checksummed and lowercase receivers, no proxy filter', async () => {
    mockedFetcher.mockReturnValue(() => Promise.resolve({ events: [] }))

    const a = '0xc6344b9d5d6f3c4b9d5d6f3c4b9d5d6f3c4b9d5d'
    const b = '0x8ba1f109551bd432803012645ac136ddd64dba72'
    await fetchUserActivity([a, b])

    expect(mockedFetcher).toHaveBeenCalledWith({
      receivers: [getAddress(a), getAddress(b), a, b],
      limit: 200,
      offset: 0,
    })
  })

  it('forwards custom limit and offset', async () => {
    mockedFetcher.mockReturnValue(() => Promise.resolve({ events: [] }))

    await fetchUserActivity(
      ['0xc6344b9d5d6f3c4b9d5d6f3c4b9d5d6f3c4b9d5d'],
      25,
      50,
    )

    expect(mockedFetcher).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 25, offset: 50 }),
    )
  })

  it('delegates event processing and returns its output', async () => {
    const fakeEvents = [{ id: 'evt-1' }]
    const processed = [{ termId: 't1' }] as unknown as ReturnType<
      typeof processEvents
    >
    mockedFetcher.mockReturnValue(() => Promise.resolve({ events: fakeEvents }))
    mockedProcess.mockReturnValue(processed)

    const result = await fetchUserActivity([
      '0xc6344b9d5d6f3c4b9d5d6f3c4b9d5d6f3c4b9d5d',
    ])

    expect(mockedProcess).toHaveBeenCalledWith(fakeEvents, expect.any(Function))
    expect(result).toBe(processed)
  })
})
