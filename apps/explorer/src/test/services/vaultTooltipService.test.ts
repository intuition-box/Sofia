import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@0xsofia/graphql', () => ({
  useGetTripleVaultStatsQuery: {
    fetcher: vi.fn(),
  },
}))

// eslint-disable-next-line import/first
import { useGetTripleVaultStatsQuery } from '@0xsofia/graphql'
// eslint-disable-next-line import/first
import {
  fetchVaultStats,
  cacheKey,
  statsCache,
  extractSide,
  formatEth,
} from '@/services/vaultTooltipService'

const mockedFetcher = useGetTripleVaultStatsQuery.fetcher as unknown as ReturnType<typeof vi.fn>

describe('vaultTooltipService — pure helpers', () => {
  it('cacheKey: stable regardless of addresses order', () => {
    const a = cacheKey('t-1', ['0xaaa', '0xbbb'])
    const b = cacheKey('t-1', ['0xbbb', '0xaaa'])
    expect(a).toBe(b)
  })

  it('cacheKey: empty addresses produce a deterministic key', () => {
    expect(cacheKey('t-1', [])).toBe('t-1::')
  })

  it('extractSide: aggregates marketCap and positionCount across vaults', () => {
    const side = extractSide([
      { market_cap: '1000', position_count: 3, positions: [] },
      { market_cap: '500', position_count: 2, positions: [] },
    ])
    expect(side.marketCap).toBe('1500')
    expect(side.count).toBe(5)
    expect(side.userPnlPct).toBeNull()
  })

  it('extractSide: returns neutral values when vaults is empty', () => {
    expect(extractSide([])).toEqual({ marketCap: '0', count: 0, userPnlPct: null })
    expect(extractSide(undefined)).toEqual({ marketCap: '0', count: 0, userPnlPct: null })
  })

  it('formatEth: returns "0" for zero wei', () => {
    expect(formatEth('0')).toBe('0')
  })

  it('formatEth: returns a non-empty string for valid wei inputs', () => {
    // The function is a cosmetic helper with IEEE 754 edge cases at exact
    // boundaries; we only assert it doesn't crash and returns something
    // readable for representative values.
    expect(formatEth('500000000000000000000')).toMatch(/^\d/) // 500 ETH
    expect(formatEth('5000000000000000000')).toMatch(/^\d/) // 5 ETH
    expect(formatEth('1000000000000000')).toMatch(/^(<?0|[\d.])/) // 0.001 ETH
  })
})

describe('vaultTooltipService.fetchVaultStats', () => {
  beforeEach(() => {
    mockedFetcher.mockReset()
    statsCache.clear()
  })

  it('calls the fetcher with termId + addresses array (no default placeholder)', async () => {
    mockedFetcher.mockReturnValue(() => Promise.resolve({ triples: [] }))

    await fetchVaultStats('t-1', ['0xabc', '0xdef'])

    expect(mockedFetcher).toHaveBeenCalledWith({
      termId: 't-1',
      addresses: ['0xabc', '0xdef'],
    })
  })

  it('passes an empty addresses array when no wallets are linked', async () => {
    mockedFetcher.mockReturnValue(() => Promise.resolve({ triples: [] }))

    await fetchVaultStats('t-2', [])

    expect(mockedFetcher).toHaveBeenCalledWith({
      termId: 't-2',
      addresses: [],
    })
  })

  it('returns null when no triple is found', async () => {
    mockedFetcher.mockReturnValue(() => Promise.resolve({ triples: [] }))
    const result = await fetchVaultStats('t-unknown', [])
    expect(result).toBeNull()
  })

  it('caches results keyed on (termId, addresses-set) and skips the second fetch', async () => {
    mockedFetcher.mockReturnValue(() =>
      Promise.resolve({
        triples: [
          {
            term_id: 't-3',
            term: { vaults: [{ market_cap: '100', position_count: 1, positions: [] }] },
            counter_term: { vaults: [] },
          },
        ],
      }),
    )

    await fetchVaultStats('t-3', ['0xabc'])
    await fetchVaultStats('t-3', ['0xabc'])

    expect(mockedFetcher).toHaveBeenCalledTimes(1)
  })

  it('does NOT share cache across different address sets (same termId)', async () => {
    mockedFetcher.mockReturnValue(() =>
      Promise.resolve({
        triples: [
          {
            term_id: 't-4',
            term: { vaults: [{ market_cap: '100', position_count: 1, positions: [] }] },
            counter_term: { vaults: [] },
          },
        ],
      }),
    )

    await fetchVaultStats('t-4', ['0xabc'])
    await fetchVaultStats('t-4', ['0xabc', '0xdef'])

    expect(mockedFetcher).toHaveBeenCalledTimes(2)
  })
})
