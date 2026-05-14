/**
 * Sort utilities for the circles feed.
 *
 * Two modes:
 *   - `engagement`: raw position count across both sides of every intention
 *     vault (support + oppose), plus a recency bonus on a 7-day half-life.
 *     Surfaces what the circle is actively staking on, while still letting
 *     a fresh post overtake a cold top-scorer.
 *   - `recent`: pure timestamp DESC. Keeps the legacy chronological view.
 */
import type { CircleItem } from './circleService'

export type FeedSortId = 'engagement' | 'recent'

const RECENCY_HALF_LIFE_MS = 7 * 24 * 60 * 60 * 1000

export function engagementScore(item: CircleItem): number {
  const raw = Object.values(item.intentionVaults).reduce(
    (acc, v) => acc + v.supportCount + v.opposeCount,
    0,
  )
  const ts = new Date(item.timestamp).getTime()
  const ageMs = Math.max(0, Date.now() - ts)
  const decay = Math.pow(0.5, ageMs / RECENCY_HALF_LIFE_MS)
  return raw + decay
}

export function sortFeed(
  items: CircleItem[],
  sort: FeedSortId,
): CircleItem[] {
  if (sort === 'recent') {
    return [...items].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
  }
  return [...items].sort((a, b) => engagementScore(b) - engagementScore(a))
}

/** Bucket a raw support count into the 1..5 star scale used by feed
 *  cards, the top-engaged strip, and any other star renderer that
 *  wants to read off the same thresholds. */
export function computeStars(supports: number): number {
  if (supports >= 20) return 5
  if (supports >= 14) return 4
  if (supports >= 9) return 3
  if (supports >= 5) return 2
  return 1
}

/** Bucket a personalized-trust score (MCP `compute_personalized_trust`)
 *  into the same 1..5 star scale. Thresholds are tuned to the score
 *  distribution we typically see — adjust once we have a wider sample
 *  from the live feed. Score 0 means "no trust paths" → 1 star.
 *  Useful when the circle's anchors actively trust the certifier:
 *  even a few supports get amplified by reputation. */
export function computeStarsFromTrust(score: number): number {
  if (score >= 0.8) return 5
  if (score >= 0.5) return 4
  if (score >= 0.2) return 3
  if (score > 0) return 2
  return 1
}

/** Tier color for slot `n` of a star bar at level `stars`.
 *  gold for 1..3, orange for 4, red for 5; muted for unreached slots. */
export function starTier(
  slot: number,
  stars: number,
): 'gold' | 'orange' | 'red' | 'muted' {
  if (slot > stars) return 'muted'
  if (slot <= 3) return 'gold'
  if (slot === 4) return 'orange'
  return 'red'
}
