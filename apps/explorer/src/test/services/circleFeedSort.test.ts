import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { engagementScore, sortFeed } from '@/services/circleFeedSort'
import type { CircleItem } from '@/services/circleService'

// ── Fixtures ──
// A 7-day half-life drives the recency bonus, so we pin the clock and express
// item ages relative to it.
const NOW = new Date('2026-06-04T00:00:00Z').getTime()
const DAY_MS = 24 * 60 * 60 * 1000
const HALF_LIFE_MS = 7 * DAY_MS

type IntentionVault = CircleItem['intentionVaults'][string]

function vault(supportCount: number, opposeCount: number): IntentionVault {
  return {
    termId: 't',
    counterTermId: 'ct',
    supportCount,
    opposeCount,
    userSupported: false,
    userOpposed: false,
  }
}

/** Minimal CircleItem carrying only the fields the sort reads. */
function item(opts: {
  id: string
  timestamp: string
  vaults?: Record<string, IntentionVault>
}): CircleItem {
  return {
    id: opts.id,
    title: opts.id,
    url: '',
    domain: '',
    favicon: '',
    certifier: '',
    certifierAddress: '',
    intentions: [],
    timestamp: opts.timestamp,
    intentionVaults: opts.vaults ?? {},
    topicContexts: [],
    categorySlugs: [],
    contextTriples: [],
  }
}

/** ISO timestamp `ageMs` in the past relative to the pinned NOW. */
const ago = (ageMs: number): string => new Date(NOW - ageMs).toISOString()

describe('engagementScore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('sums support + oppose counts across every intention vault', () => {
    // A brand-new item: decay ≈ 1, so score ≈ raw + 1.
    const it1 = item({
      id: 'a',
      timestamp: ago(0),
      vaults: { v1: vault(3, 2), v2: vault(1, 4) },
    })
    expect(engagementScore(it1)).toBeCloseTo(10 + 1) // (3+2+1+4) + decay(1)
  })

  it('applies a 7-day half-life recency decay (one half-life → 0.5)', () => {
    const fresh = item({ id: 'fresh', timestamp: ago(0) })
    const old = item({ id: 'old', timestamp: ago(HALF_LIFE_MS) })
    expect(engagementScore(fresh)).toBeCloseTo(1) // raw 0 + decay 1
    expect(engagementScore(old)).toBeCloseTo(0.5) // raw 0 + decay 0.5
  })

  it('clamps future timestamps so decay never exceeds 1', () => {
    const future = item({ id: 'future', timestamp: ago(-DAY_MS) }) // 1 day ahead
    // ageMs is floored at 0 → decay is exactly 1, not >1.
    expect(engagementScore(future)).toBeCloseTo(1)
  })

  it('lets a fresh post overtake an equally-engaged colder post via the bonus', () => {
    // Both posts carry one stake. The recency bonus (≤ 1) breaks the tie.
    const cold = item({
      id: 'cold',
      timestamp: ago(6 * HALF_LIFE_MS), // decay ≈ 0.0156
      vaults: { v: vault(1, 0) },
    })
    const fresh = item({
      id: 'fresh',
      timestamp: ago(0), // decay ≈ 1
      vaults: { v: vault(1, 0) },
    })
    expect(engagementScore(cold)).toBeCloseTo(1 + Math.pow(0.5, 6))
    expect(engagementScore(fresh)).toBeGreaterThan(engagementScore(cold))
  })

  it('keeps a higher raw count ahead once the lead exceeds the recency bonus', () => {
    // The bonus is capped at 1, so a 2-stake lead cannot be overcome by recency.
    const cold = item({
      id: 'cold',
      timestamp: ago(6 * HALF_LIFE_MS),
      vaults: { v: vault(3, 0) },
    })
    const fresh = item({ id: 'fresh', timestamp: ago(0), vaults: { v: vault(1, 0) } })
    expect(engagementScore(cold)).toBeGreaterThan(engagementScore(fresh))
  })
})

describe('sortFeed', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("recent mode sorts purely by timestamp descending", () => {
    const items = [
      item({ id: 'mid', timestamp: ago(2 * DAY_MS) }),
      item({ id: 'newest', timestamp: ago(0) }),
      item({ id: 'oldest', timestamp: ago(5 * DAY_MS) }),
    ]
    const sorted = sortFeed(items, 'recent')
    expect(sorted.map((i) => i.id)).toEqual(['newest', 'mid', 'oldest'])
  })

  it('recent mode ignores engagement entirely', () => {
    const items = [
      item({ id: 'old-but-hot', timestamp: ago(5 * DAY_MS), vaults: { v: vault(99, 99) } }),
      item({ id: 'new-but-cold', timestamp: ago(0) }),
    ]
    const sorted = sortFeed(items, 'recent')
    expect(sorted.map((i) => i.id)).toEqual(['new-but-cold', 'old-but-hot'])
  })

  it('engagement mode ranks by raw count plus recency bonus', () => {
    const items = [
      item({ id: 'low', timestamp: ago(0), vaults: { v: vault(2, 0) } }),
      item({ id: 'high', timestamp: ago(0), vaults: { v: vault(10, 0) } }),
    ]
    const sorted = sortFeed(items, 'engagement')
    expect(sorted.map((i) => i.id)).toEqual(['high', 'low'])
  })

  it('does not mutate the input array', () => {
    const items = [
      item({ id: 'a', timestamp: ago(2 * DAY_MS) }),
      item({ id: 'b', timestamp: ago(0) }),
    ]
    const snapshot = items.map((i) => i.id)
    sortFeed(items, 'recent')
    expect(items.map((i) => i.id)).toEqual(snapshot)
  })

  it('returns an empty array unchanged', () => {
    expect(sortFeed([], 'engagement')).toEqual([])
    expect(sortFeed([], 'recent')).toEqual([])
  })

  it('returns a single-element feed unchanged', () => {
    const single = [item({ id: 'solo', timestamp: ago(0) })]
    expect(sortFeed(single, 'recent').map((i) => i.id)).toEqual(['solo'])
    expect(sortFeed(single, 'engagement').map((i) => i.id)).toEqual(['solo'])
  })
})
