import { describe, it, expect, vi } from 'vitest'

vi.mock('@0xsofia/graphql', () => ({
  useGetPositionsQuery: { fetcher: vi.fn() },
}))

// eslint-disable-next-line import/first
import { aggregatePlatformVaults } from '@/services/platformMarketService'

const WAD = 10n ** 18n

describe('aggregatePlatformVaults', () => {
  it('values each curve at its own share price', () => {
    const m = aggregatePlatformVaults(
      {
        term_id: '0xabc',
        label: 'YouTube',
        term: {
          vaults: [
            {
              market_cap: String(10n * WAD),
              total_shares: String(10n * WAD),
              position_count: 3,
              current_share_price: String(WAD), // 1 T / share
              positions: [
                {
                  shares: String(2n * WAD),
                  total_deposit_assets_after_total_fees: String(2n * WAD),
                },
              ],
            },
            {
              market_cap: String(6n * WAD),
              total_shares: String(2n * WAD),
              position_count: 2,
              current_share_price: String(3n * WAD), // 3 T / share
              positions: [
                {
                  shares: String(1n * WAD),
                  total_deposit_assets_after_total_fees: String(2n * WAD),
                },
              ],
            },
          ],
        },
      },
      new Map([['0xabc', 4]]),
    )
    // 2×1 + 1×3 = 5 T (the old "all shares × best price" gave 9 T).
    expect(m.userValue).toBe(String(5n * WAD))
    expect(m.userDeposited).toBe(String(4n * WAD))
    expect(m.userChange).toBe(String(1n * WAD))
    expect(m.userPnlPct).toBe(25)
    expect(m.supporterCount).toBe(4)
    expect(m.marketCap).toBe(String(16n * WAD))
  })

  it('falls back to the busiest vault when supporters are unknown', () => {
    const m = aggregatePlatformVaults(
      {
        term_id: '0xabc',
        label: 'GitHub',
        term: {
          vaults: [
            { position_count: 3, positions: [] },
            { position_count: 5, positions: [] },
          ],
        },
      },
      null,
    )
    expect(m.supporterCount).toBe(5)
    expect(m.userPnlPct).toBeNull()
    expect(m.userValue).toBe('0')
  })

  it('ignores fully exited positions', () => {
    const m = aggregatePlatformVaults(
      {
        term_id: '0xabc',
        label: 'X',
        term: {
          vaults: [
            {
              current_share_price: String(WAD),
              positions: [
                {
                  shares: '0',
                  total_deposit_assets_after_total_fees: String(9n * WAD),
                },
                {
                  shares: String(WAD),
                  total_deposit_assets_after_total_fees: String(WAD),
                },
              ],
            },
          ],
        },
      },
      new Map(),
    )
    expect(m.userDeposited).toBe(String(WAD))
    expect(m.userChange).toBe('0')
    expect(m.supporterCount).toBe(0)
  })
})
