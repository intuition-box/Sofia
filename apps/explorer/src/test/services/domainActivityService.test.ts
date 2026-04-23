import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@0xsofia/graphql', () => ({
  useGetUserActivityQuery: {
    fetcher: vi.fn(),
  },
}))

vi.mock('@/services/feedProcessing', () => ({
  processEvents: vi.fn(() => []),
}))

// eslint-disable-next-line import/first
import { useGetUserActivityQuery } from '@0xsofia/graphql'
// eslint-disable-next-line import/first
import { processEvents } from '@/services/feedProcessing'
// eslint-disable-next-line import/first
import { fetchUserActivity } from '@/services/domainActivityService'
// eslint-disable-next-line import/first
import { SOFIA_PROXY_ADDRESS } from '@/config'

const mockedFetcher = useGetUserActivityQuery.fetcher as unknown as ReturnType<typeof vi.fn>
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

  it('passes the addresses array to the receivers variable + lowercased proxy', async () => {
    mockedFetcher.mockReturnValue(() => Promise.resolve({ events: [] }))

    await fetchUserActivity(['0xAAA', '0xBBB'])

    expect(mockedFetcher).toHaveBeenCalledWith({
      proxy: SOFIA_PROXY_ADDRESS.toLowerCase(),
      receivers: ['0xAAA', '0xBBB'],
      limit: 200,
      offset: 0,
    })
  })

  it('forwards custom limit and offset', async () => {
    mockedFetcher.mockReturnValue(() => Promise.resolve({ events: [] }))

    await fetchUserActivity(['0xAAA'], 25, 50)

    expect(mockedFetcher).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 25, offset: 50 }),
    )
  })

  it('delegates event processing and returns its output', async () => {
    const fakeEvents = [{ id: 'evt-1' }]
    const processed = [{ termId: 't1' }] as unknown as ReturnType<typeof processEvents>
    mockedFetcher.mockReturnValue(() => Promise.resolve({ events: fakeEvents }))
    mockedProcess.mockReturnValue(processed)

    const result = await fetchUserActivity(['0xAAA'])

    expect(mockedProcess).toHaveBeenCalledWith(fakeEvents, expect.any(Function))
    expect(result).toBe(processed)
  })
})
