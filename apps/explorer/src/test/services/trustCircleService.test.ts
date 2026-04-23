import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@0xsofia/graphql', () => ({
  useGetMyTrustCircleQuery: {
    fetcher: vi.fn(),
  },
}))

// eslint-disable-next-line import/first
import { useGetMyTrustCircleQuery } from '@0xsofia/graphql'
// eslint-disable-next-line import/first
import { fetchTrustCircle } from '@/services/trustCircleService'
// eslint-disable-next-line import/first
import { SUBJECT_IDS, PREDICATE_IDS } from '@/config'

const mockedFetcher = useGetMyTrustCircleQuery.fetcher as unknown as ReturnType<typeof vi.fn>

// Minimal triple fixture with one vault holding a >0 position.
function tripleFixture(opts: {
  termId: string
  objectLabel?: string
  shares?: string
  createdAt?: string
  image?: string | null
}) {
  return {
    term_id: opts.termId,
    created_at: opts.createdAt ?? '2026-01-01T00:00:00Z',
    object: {
      term_id: `${opts.termId}-obj`,
      label: opts.objectLabel ?? 'someone',
      image: opts.image ?? null,
      data: null,
    },
    term: {
      vaults: [
        {
          positions: [{ shares: opts.shares ?? '1000000000000000000' }],
        },
      ],
    },
  }
}

describe('trustCircleService.fetchTrustCircle', () => {
  beforeEach(() => {
    mockedFetcher.mockReset()
  })

  it('returns empty array when no addresses are linked (no query fired)', async () => {
    const result = await fetchTrustCircle([])
    expect(result).toEqual([])
    expect(mockedFetcher).not.toHaveBeenCalled()
  })

  it('passes checksummed addresses as walletAddresses', async () => {
    mockedFetcher.mockReturnValue(() => Promise.resolve({ triples: [] }))

    await fetchTrustCircle([
      '0x8ba1f109551bd432803012645ac136ddd64dba72',
      '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
    ])

    expect(mockedFetcher).toHaveBeenCalledTimes(1)
    const [args] = mockedFetcher.mock.calls[0]
    expect(args.subjectId).toBe(SUBJECT_IDS.I)
    expect(args.predicateId).toBe(PREDICATE_IDS.TRUSTS)
    expect(args.walletAddresses).toHaveLength(2)
    // EIP-55 format check
    for (const addr of args.walletAddresses) {
      expect(addr).toMatch(/^0x[0-9a-fA-F]{40}$/)
      expect(addr).toMatch(/[A-F]/)
    }
  })

  it('filters out triples where the user has no active position', async () => {
    mockedFetcher.mockReturnValue(() =>
      Promise.resolve({
        triples: [
          tripleFixture({ termId: 't-with-shares', shares: '500' }),
          {
            term_id: 't-without-shares',
            created_at: '2026-01-01T00:00:00Z',
            object: { term_id: 'obj', label: 'nope', image: null, data: null },
            term: { vaults: [{ positions: [{ shares: '0' }] }] },
          },
        ],
      }),
    )

    const accounts = await fetchTrustCircle(['0x1111111111111111111111111111111111111111'])
    expect(accounts).toHaveLength(1)
    expect(accounts[0].id).toBe('t-with-shares')
  })

  it('sorts results by trustAmount descending', async () => {
    mockedFetcher.mockReturnValue(() =>
      Promise.resolve({
        triples: [
          tripleFixture({ termId: 't-low', shares: '1000000000000000000' }), // 1
          tripleFixture({ termId: 't-high', shares: '5000000000000000000' }), // 5
        ],
      }),
    )

    const accounts = await fetchTrustCircle(['0x2222222222222222222222222222222222222222'])
    expect(accounts[0].id).toBe('t-high')
    expect(accounts[1].id).toBe('t-low')
    expect(accounts[0].trustAmount).toBeGreaterThan(accounts[1].trustAmount)
  })

  it('extracts walletAddress when the object atom label is a hex address', async () => {
    mockedFetcher.mockReturnValue(() =>
      Promise.resolve({
        triples: [
          {
            ...tripleFixture({ termId: 't-wallet' }),
            object: {
              term_id: 'obj',
              label: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
              image: null,
              data: null,
            },
          },
        ],
      }),
    )

    const accounts = await fetchTrustCircle(['0x3333333333333333333333333333333333333333'])
    expect(accounts[0].walletAddress).toBe('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
  })
})
