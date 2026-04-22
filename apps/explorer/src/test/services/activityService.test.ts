import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the GraphQL package before the service imports it.
vi.mock('@0xsofia/graphql', () => ({
  useGetAllActivityQuery: {
    fetcher: vi.fn(),
  },
}))

// feedProcessing does network calls in enrichWithTopicContexts; neutralise it
// so the service test stays on the unit the file owns.
vi.mock('@/services/feedProcessing', () => ({
  processEvents: vi.fn(() => []),
  enrichWithTopicContexts: vi.fn(() => Promise.resolve()),
}))

// eslint-disable-next-line import/first
import { useGetAllActivityQuery } from '@0xsofia/graphql'
// eslint-disable-next-line import/first
import { processEvents, enrichWithTopicContexts } from '@/services/feedProcessing'
// eslint-disable-next-line import/first
import { fetchAllActivity } from '@/services/activityService'
// eslint-disable-next-line import/first
import { SOFIA_PROXY_ADDRESS } from '@/config'

const mockedFetcher = useGetAllActivityQuery.fetcher as unknown as ReturnType<typeof vi.fn>
const mockedProcess = processEvents as unknown as ReturnType<typeof vi.fn>
const mockedEnrich = enrichWithTopicContexts as unknown as ReturnType<typeof vi.fn>

describe('activityService.fetchAllActivity', () => {
  beforeEach(() => {
    mockedFetcher.mockReset()
    mockedProcess.mockReset().mockReturnValue([])
    mockedEnrich.mockReset().mockResolvedValue(undefined)
  })

  it('calls the fetcher with the lowercased proxy address and default pagination', async () => {
    mockedFetcher.mockReturnValue(() => Promise.resolve({ events: [] }))

    await fetchAllActivity()

    expect(mockedFetcher).toHaveBeenCalledTimes(1)
    expect(mockedFetcher).toHaveBeenCalledWith({
      proxy: SOFIA_PROXY_ADDRESS.toLowerCase(),
      limit: 200,
      offset: 0,
    })
  })

  it('forwards custom limit and offset to the fetcher', async () => {
    mockedFetcher.mockReturnValue(() => Promise.resolve({ events: [] }))

    await fetchAllActivity(10, 40)

    expect(mockedFetcher).toHaveBeenCalledWith({
      proxy: SOFIA_PROXY_ADDRESS.toLowerCase(),
      limit: 10,
      offset: 40,
    })
  })

  it('returns the processed items and enriches them before resolving', async () => {
    const fakeEvents = [{ id: 'evt-1' }, { id: 'evt-2' }]
    const processed = [{ termId: 't1' }, { termId: 't2' }] as unknown as ReturnType<typeof processEvents>

    mockedFetcher.mockReturnValue(() => Promise.resolve({ events: fakeEvents }))
    mockedProcess.mockReturnValue(processed)

    const result = await fetchAllActivity(5, 0)

    // processEvents receives the events from the query
    expect(mockedProcess).toHaveBeenCalledWith(fakeEvents, expect.any(Function))
    // enrichment runs on the processed items
    expect(mockedEnrich).toHaveBeenCalledWith(processed)
    expect(result).toBe(processed)
  })

  it('defaults events to empty array when the query returns null', async () => {
    mockedFetcher.mockReturnValue(() => Promise.resolve({ events: null }))
    mockedProcess.mockReturnValue([])

    const result = await fetchAllActivity()

    expect(mockedProcess).toHaveBeenCalledWith([], expect.any(Function))
    expect(result).toEqual([])
  })
})
