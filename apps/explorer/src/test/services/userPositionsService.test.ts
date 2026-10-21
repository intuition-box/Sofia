import { describe, it, expect, vi } from 'vitest'

vi.mock('@0xsofia/graphql', () => ({
  useGetUserMarketPositionsQuery: { fetcher: vi.fn() },
}))

// eslint-disable-next-line import/first
import {
  aggregateUserPositions,
  summarizePositions,
} from '@/services/userPositionsService'

const WAD = 10n ** 18n
const PLATFORMS = new Set(['0xplatform'])

function leg(
  termId: string,
  curve: '1' | '2',
  shares: bigint,
  price: bigint,
  deposited: bigint,
  term: unknown,
  createdAt = '2026-10-01T00:00:00Z',
) {
  return {
    term_id: termId,
    curve_id: curve,
    shares: String(shares),
    total_deposit_assets_after_total_fees: String(deposited),
    created_at: createdAt,
    vault: {
      current_share_price: String(price),
      market_cap: String(10n * WAD),
      position_count: 4,
    },
    term,
  } as Parameters<typeof aggregateUserPositions>[0][number]
}

const platformTerm = {
  type: 'Atom',
  atom: {
    term_id: '0xplatform',
    label: 'YouTube',
    image: null,
    value: { thing: { url: 'https://youtube.com', name: 'YouTube' } },
  },
  triple: null,
}

const claim = {
  term_id: '0xclaim',
  counter_term_id: '0xcounter',
  subject: { term_id: '0xi', label: 'I' },
  predicate: { term_id: '0xp', label: 'visits for learning' },
  object: {
    term_id: '0xpage',
    label: 'Article',
    image: null,
    value: { thing: { url: 'https://example.com/a', name: 'Article' } },
  },
}

describe('aggregateUserPositions', () => {
  it('values each curve leg at its own share price', () => {
    const [p] = aggregateUserPositions(
      [
        leg('0xplatform', '1', 2n * WAD, WAD, 2n * WAD, platformTerm),
        leg('0xplatform', '2', 1n * WAD, 3n * WAD, 2n * WAD, platformTerm),
      ],
      PLATFORMS,
    )
    expect(p.kind).toBe('platform')
    expect(p.value).toBe(String(5n * WAD)) // 2×1 + 1×3
    expect(p.deposited).toBe(String(4n * WAD))
    expect(p.change).toBe(String(1n * WAD))
    expect(p.changePct).toBe(25)
    expect(p.totalStaked).toBe(String(20n * WAD))
  })

  it('tells support and oppose apart and skips empty / repeated legs', () => {
    const tripleTerm = { type: 'Triple', atom: null, triple: claim }
    const counterTerm = { type: 'CounterTriple', atom: null, triple: claim }
    const positions = aggregateUserPositions(
      [
        leg('0xclaim', '1', WAD, WAD, WAD, tripleTerm),
        leg('0xclaim', '1', WAD, WAD, WAD, tripleTerm), // repeated page row
        leg('0xcounter', '1', WAD, WAD / 2n, WAD, counterTerm),
        leg('0xzero', '1', 0n, WAD, WAD, tripleTerm),
      ],
      PLATFORMS,
    )
    expect(positions).toHaveLength(2)
    const support = positions.find((p) => p.termId === '0xclaim')
    const oppose = positions.find((p) => p.termId === '0xcounter')
    expect(support?.side).toBe('support')
    expect(support?.value).toBe(String(WAD))
    expect(support?.subjectLabel).toBeNull()
    expect(support?.domain).toBe('example.com')
    expect(oppose?.side).toBe('oppose')
    expect(oppose?.claimTermId).toBe('0xclaim')
    expect(oppose?.changePct).toBe(-50)
  })
})

describe('summarizePositions', () => {
  it('totals value, change and what was brought to platforms', () => {
    const tripleTerm = { type: 'Triple', atom: null, triple: claim }
    const summary = summarizePositions(
      aggregateUserPositions(
        [
          leg('0xplatform', '1', 2n * WAD, WAD, 3n * WAD, platformTerm),
          leg('0xclaim', '1', WAD, 2n * WAD, WAD, tripleTerm),
        ],
        PLATFORMS,
      ),
    )
    expect(summary.count).toBe(2)
    expect(summary.totalValue).toBe(String(4n * WAD))
    expect(summary.totalDeposited).toBe(String(4n * WAD))
    expect(summary.totalChange).toBe('0')
    expect(summary.changePct).toBe(0)
    expect(summary.broughtToPlatforms).toBe(String(3n * WAD))
    expect(summary.platformCount).toBe(1)
  })

  it('returns a null change % with nothing deposited', () => {
    expect(summarizePositions([]).changePct).toBeNull()
  })
})

describe('position value', () => {
  const withTotals = (
    shares: bigint,
    price: bigint,
    totalShares: bigint,
    totalAssets: bigint,
  ) => {
    const row = leg('0xpage', '2', shares, price, totalAssets, {
      type: 'Triple',
      atom: null,
      triple: claim,
    })
    return {
      ...row,
      vault: {
        ...row.vault,
        total_shares: String(totalShares),
        total_assets: String(totalAssets),
      },
    } as Parameters<typeof aggregateUserPositions>[0][number]
  }

  it('a sole holder is worth the vault, not shares × spot (no phantom gain)', () => {
    // Own deposit lifted the progressive spot price: shares × spot = 12 T,
    // but the vault only holds the 10 T that went in.
    const [p] = aggregateUserPositions(
      [withTotals(10n * WAD, (12n * WAD) / 10n, 10n * WAD, 10n * WAD)],
      PLATFORMS,
    )
    expect(p.value).toBe(String(10n * WAD))
    expect(p.change).toBe('0')
  })

  it('uses the exact exit value (previewRedeem) when known', () => {
    const [p] = aggregateUserPositions(
      [withTotals(10n * WAD, WAD, 10n * WAD, 10n * WAD)],
      PLATFORMS,
      { '0xpage:2': String(9n * WAD) },
    )
    expect(p.value).toBe(String(9n * WAD))
  })
})
