import { describe, it, expect, vi } from 'vitest'

vi.mock('@0xsofia/graphql', () => ({
  useGetPositionsQuery: { fetcher: vi.fn() },
  useGetPlatformEcosystemAtomsQuery: { fetcher: vi.fn() },
  useGetSofiaFeedCertPositionsQuery: { fetcher: vi.fn() },
  useGetSofiaFeedContextPositionsQuery: { fetcher: vi.fn() },
  useGetSofiaFeedTriplesByIdsQuery: { fetcher: vi.fn() },
}))

// eslint-disable-next-line import/first
import {
  aggregatePlatformEcosystem,
  platformEcosystemLookups,
} from '@/services/platformMarketService'
// eslint-disable-next-line import/first
import { PLATFORM_ATOM_IDS } from '@/config/atomIds'

const YT = PLATFORM_ATOM_IDS.youtube
const NOTION = PLATFORM_ATOM_IDS.notion

function atom(
  term_id: string,
  label: string,
  url: string | null,
  cap: string,
  wallets: string[] = [],
  claims: { id: string; cap: string; wallets: string[] }[] = [],
) {
  return {
    term_id,
    label,
    value: { thing: { url } },
    term: { vaults: [{ market_cap: cap }] },
    positions: wallets.map((account_id) => ({ account_id })),
    as_object_triples: claims.map((c) => ({
      term_id: c.id,
      term: { vaults: [{ market_cap: c.cap }] },
      positions: c.wallets.map((account_id) => ({ account_id })),
    })),
  }
}

describe('aggregatePlatformEcosystem', () => {
  it('sums every atom of a platform: distinct wallets, stake, atoms, claims', () => {
    const stats = aggregatePlatformEcosystem([
      atom(YT, 'YouTube', 'https://youtube.com', '100', ['0xA']),
      atom(
        'other-1',
        'YouTube',
        'https://www.youtube.com/',
        '50',
        ['0xa'],
        [{ id: 'rec-1', cap: '20', wallets: ['0xB', '0xc'] }],
      ),
      atom(
        'other-2',
        'youtube.com',
        null,
        '0',
        [],
        [{ id: 'rec-2', cap: '5', wallets: ['0xb'] }],
      ),
      // same label, URL elsewhere → not YouTube
      atom('wiki', 'YouTube', 'https://en.wikipedia.org/wiki/YouTube', '999', [
        '0xz',
      ]),
      // returned twice by two pages
      atom('other-1', 'YouTube', 'https://www.youtube.com/', '50', ['0xa']),
    ])
    expect(stats[YT]).toEqual({
      termId: YT,
      atomCount: 3,
      supporters: 3,
      totalStaked: '175',
      claimCount: 2,
    })
    expect(Object.keys(stats)).toEqual([YT])
  })

  it('aliases the URL the Sofia atom stores to its platform', () => {
    const stats = aggregatePlatformEcosystem([
      atom(NOTION, 'Notion', 'https://www.notion.com', '10', ['0x1']),
      atom('n2', 'Notion', 'https://notion.com/', '5', ['0x2']),
      atom('n3', 'Notion', 'https://notion.so', '1', []),
    ])
    expect(stats[NOTION].atomCount).toBe(3)
    expect(stats[NOTION].supporters).toBe(2)
    expect(stats[NOTION].totalStaked).toBe('16')
  })

  it('returns a plain record (safe for the persisted cache)', () => {
    const stats = aggregatePlatformEcosystem([
      atom(YT, 'YouTube', 'https://youtube.com', '1'),
    ])
    expect(JSON.parse(JSON.stringify(stats))).toEqual(stats)
  })
})

describe('platformEcosystemLookups', () => {
  it('covers Sofia atoms, website variants and label variants', () => {
    const l = platformEcosystemLookups()
    expect(l.termIds).toContain(YT)
    expect(l.urls).toContain('https://www.youtube.com/')
    expect(l.labels).toContain('YouTube')
    expect(l.labels).toContain('youtube')
  })
})
