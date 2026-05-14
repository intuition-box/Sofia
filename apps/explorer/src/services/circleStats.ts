/**
 * Aggregate metrics for a circle's feed — feeds the stats strip under
 * the hero and the top-engaged strip above the activity feed. Pure
 * functions over `CircleItem[]`, no side effects.
 */
import type { CircleItem } from './circleService'
import { engagementScore } from './circleFeedSort'

const ACTIVE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

export interface CircleStats {
  postCount: number
  voteCount: number
  activeMemberCount: number
}

export function computeCircleStats(items: CircleItem[]): CircleStats {
  const cutoff = Date.now() - ACTIVE_WINDOW_MS
  const activeCertifiers = new Set<string>()
  let voteCount = 0

  for (const item of items) {
    for (const v of Object.values(item.intentionVaults)) {
      voteCount += v.supportCount + v.opposeCount
    }
    if (
      new Date(item.timestamp).getTime() >= cutoff &&
      item.certifierAddress
    ) {
      activeCertifiers.add(item.certifierAddress.toLowerCase())
    }
  }

  return {
    postCount: items.length,
    voteCount,
    activeMemberCount: activeCertifiers.size,
  }
}

export function computeTopEngaged(
  items: CircleItem[],
  n: number = 4,
): CircleItem[] {
  return [...items]
    .sort((a, b) => engagementScore(b) - engagementScore(a))
    .slice(0, n)
}
