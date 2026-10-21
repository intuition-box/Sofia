import { beforeEach, describe, expect, it, vi } from 'vitest'

const supporters: Record<string, { support: unknown[]; oppose: unknown[] }> = {}
vi.mock('@/services/claimSupportersService', () => ({
  fetchClaimSupporters: vi.fn(async () => supporters),
}))

// eslint-disable-next-line import/first
import { fetchDiscoveries } from '@/services/discoveriesService'
// eslint-disable-next-line import/first
import type { MarketPosition } from '@/services/userPositionsService'

const ME = '0xMe'
const staker = (account: string, createdAt: string) => ({
  account,
  createdAt,
  shares: '1',
})
const position = (
  claimTermId: string,
  over: Partial<MarketPosition> = {},
): MarketPosition => ({
  termId: claimTermId,
  legs: [{ curveId: '2', shares: '1' }],
  markValue: '150',
  kind: 'claim',
  side: 'support',
  claimTermId,
  objectTermId: `obj-${claimTermId}`,
  title: claimTermId,
  predicateLabel: 'recommends',
  subjectLabel: null,
  url: `https://${claimTermId}.com`,
  domain: `${claimTermId}.com`,
  image: null,
  shares: '1',
  deposited: '100',
  value: '150',
  change: '50',
  changePct: 50,
  totalStaked: '0',
  supporters: 1,
  openedAt: '2026-10-01T00:00:00Z',
  ...over,
})

describe('fetchDiscoveries', () => {
  beforeEach(() => {
    for (const k of Object.keys(supporters)) delete supporters[k]
  })

  it('keeps the Recommends the wallet was first on, with distinct followers', async () => {
    supporters.first = {
      support: [
        staker('0xbob', '2026-10-04T00:00:00Z'),
        staker('0xme', '2026-10-01T00:00:00Z'), // casing differs — still me
        staker('0xbob', '2026-10-05T00:00:00Z'), // same follower, 2nd leg
        staker('0xcarol', '2026-10-06T00:00:00Z'),
      ],
      oppose: [],
    }
    supporters.late = {
      support: [
        staker('0xbob', '2026-10-01T00:00:00Z'),
        staker('0xme', '2026-10-02T00:00:00Z'),
      ],
      oppose: [],
    }
    const result = await fetchDiscoveries(ME, [
      position('first'),
      position('late'),
    ])
    expect(result.discoveries.map((d) => d.claimTermId)).toEqual(['first'])
    expect(result.discoveries[0].followers).toBe(2)
    expect(result.discoveries[0].leadDays).toBe(3)
    expect(result.followers).toBe(2)
    expect(result.change).toBe('50')
  })

  it('ignores legacy claims, oppose sides and other subjects', async () => {
    supporters.a = {
      support: [staker('0xme', '2026-10-01T00:00:00Z')],
      oppose: [],
    }
    const result = await fetchDiscoveries(ME, [
      position('a', { predicateLabel: 'visits for work' }),
      position('a', { side: 'oppose' }),
      position('a', { subjectLabel: 'Alice' }),
    ])
    expect(result.discoveries).toEqual([])
  })

  it('reports no lead time when nobody followed yet', async () => {
    supporters.solo = {
      support: [staker('0xme', '2026-10-01T00:00:00Z')],
      oppose: [],
    }
    const result = await fetchDiscoveries(ME, [position('solo')])
    expect(result.discoveries[0]).toMatchObject({
      followers: 0,
      leadDays: null,
    })
  })
})
