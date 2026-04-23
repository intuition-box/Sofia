import { describe, it, expect, vi } from 'vitest'

// Mock the workspace graphql package at module level. Each test can override a
// specific fetcher by reassigning it. This pattern is what every service test
// will use — no MSW layer, no real network, no runtime polyfills required.
vi.mock('@0xsofia/graphql', () => ({
  configureClient: vi.fn(),
  fetcher: vi.fn(),
  useGetAccountLabelsQuery: {
    fetcher: vi.fn(),
  },
}))

// eslint-disable-next-line import/first
import { useGetAccountLabelsQuery } from '@0xsofia/graphql'

describe('vi.mock sanity (pattern validator)', () => {
  it('exposes a mocked fetcher that resolves with fixture data', async () => {
    ;(useGetAccountLabelsQuery.fetcher as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      () => Promise.resolve({ accounts: [{ id: '0xabc', label: 'alice.eth' }] }),
    )

    const run = useGetAccountLabelsQuery.fetcher({ ids: ['0xabc'] })
    const result = await run()

    expect(result).toEqual({
      accounts: [{ id: '0xabc', label: 'alice.eth' }],
    })
    expect(useGetAccountLabelsQuery.fetcher).toHaveBeenCalledWith({ ids: ['0xabc'] })
  })

  it('can be overridden per test via mockReturnValueOnce', async () => {
    ;(useGetAccountLabelsQuery.fetcher as unknown as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(() => Promise.resolve({ accounts: [{ id: '0xone' }] }))
      .mockReturnValueOnce(() => Promise.resolve({ accounts: [{ id: '0xtwo' }] }))

    const first = await useGetAccountLabelsQuery.fetcher({ ids: [] })()
    const second = await useGetAccountLabelsQuery.fetcher({ ids: [] })()

    expect(first.accounts[0].id).toBe('0xone')
    expect(second.accounts[0].id).toBe('0xtwo')
  })
})
