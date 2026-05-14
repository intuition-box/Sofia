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
