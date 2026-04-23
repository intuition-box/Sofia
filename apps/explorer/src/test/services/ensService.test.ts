import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the workspace GraphQL package. Each test overrides the fetcher's
// resolved value before calling the service.
vi.mock('@0xsofia/graphql', () => ({
  useGetAccountLabelsQuery: {
    fetcher: vi.fn(),
  },
}))

// eslint-disable-next-line import/first
import { useGetAccountLabelsQuery } from '@0xsofia/graphql'
// eslint-disable-next-line import/first
import {
  resolveViaGraphQL,
  getDisplayName,
  isRealLabel,
  isEnsName,
  formatEth,
} from '@/services/ensService'

const mockedFetcher = useGetAccountLabelsQuery.fetcher as unknown as ReturnType<typeof vi.fn>

describe('ensService — pure helpers', () => {
  it('isRealLabel: rejects addresses and truncated placeholders', () => {
    expect(isRealLabel('alice.eth')).toBe(true)
    expect(isRealLabel('0xabc')).toBe(false)
    expect(isRealLabel('0xabc...d551')).toBe(false)
    expect(isRealLabel(null)).toBe(false)
    expect(isRealLabel(undefined)).toBe(false)
  })

  it('isEnsName: accepts .eth and .box only', () => {
    expect(isEnsName('alice.eth')).toBe(true)
    expect(isEnsName('alice.box')).toBe(true)
    expect(isEnsName('alice')).toBe(false)
    expect(isEnsName(null)).toBe(false)
  })

  it('formatEth: truncates to 0xXXXX...YYYY shape', () => {
    expect(formatEth('0x8ba1f109551bd432803012645ac136ddd64dba72'))
      .toBe('0x8ba1...ba72')
  })
})

describe('ensService.resolveViaGraphQL', () => {
  beforeEach(() => {
    mockedFetcher.mockReset()
  })

  it('calls the GraphQL fetcher with checksummed ids built from the inputs', async () => {
    mockedFetcher.mockReturnValue(() => Promise.resolve({ accounts: [] }))

    // Lowercased inputs — the service must checksum them via viem before querying.
    await resolveViaGraphQL([
      '0x8ba1f109551bd432803012645ac136ddd64dba72',
      '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
    ])

    expect(mockedFetcher).toHaveBeenCalledTimes(1)
    const [calledWith] = mockedFetcher.mock.calls[0]
    expect(calledWith.ids).toHaveLength(2)
    // Both must be EIP-55 checksummed (contains at least one uppercase hex char).
    for (const id of calledWith.ids) {
      expect(id).toMatch(/^0x[0-9a-fA-F]{40}$/)
      expect(id).toMatch(/[A-F]/)
    }
  })

  it('populates labelCache for accounts with a real label', async () => {
    // Use an address unique to this test to avoid cache pollution from other tests.
    const addr = '0x1111111111111111111111111111111111111111'
    mockedFetcher.mockReturnValue(() =>
      Promise.resolve({
        accounts: [
          { id: addr, label: 'alice.eth', image: null, atom: null },
        ],
      }),
    )

    await resolveViaGraphQL([addr])

    expect(getDisplayName(addr)).toBe('alice.eth')
  })

  it('falls back to atom.label when account.label is missing', async () => {
    const addr = '0x2222222222222222222222222222222222222222'
    mockedFetcher.mockReturnValue(() =>
      Promise.resolve({
        accounts: [
          {
            id: addr,
            label: null,
            image: null,
            atom: { label: 'bob.eth', image: null },
          },
        ],
      }),
    )

    await resolveViaGraphQL([addr])
    expect(getDisplayName(addr)).toBe('bob.eth')
  })

  it('does not cache a label that looks like an address', async () => {
    const addr = '0x3333333333333333333333333333333333333333'
    mockedFetcher.mockReturnValue(() =>
      Promise.resolve({
        accounts: [{ id: addr, label: '0xabc...d551', image: null, atom: null }],
      }),
    )

    await resolveViaGraphQL([addr])
    // getDisplayName falls back to the short-form when no real label is cached.
    expect(getDisplayName(addr)).toBe(formatEth(addr))
  })

  it('swallows fetcher errors and does not throw', async () => {
    mockedFetcher.mockReturnValue(() => Promise.reject(new Error('boom')))
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await expect(
      resolveViaGraphQL(['0x4444444444444444444444444444444444444444']),
    ).resolves.toBeUndefined()

    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})
