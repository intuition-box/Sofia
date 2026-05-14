/**
 * Aggregate metrics for a circle's feed — feeds the stats strip under
 * the hero and the top-engaged strip above the activity feed. Pure
 * functions over `CircleItem[]`, no side effects.
 */
import type { CircleItem } from './circleService'
import type { TrustCircleAccount } from './trustCircleService'
import { engagementScore } from './circleFeedSort'

const ACTIVE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

export type ActivityWindow = '7d' | '30d' | 'all'

export interface MemberActivity {
  member: TrustCircleAccount
  count: number
}

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
    if (new Date(item.timestamp).getTime() >= cutoff && item.certifierAddress) {
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

/** Rank the circle's members by their signal count inside a time window.
 *  Falls back to all-time when `window === 'all'`. Returns the top N
 *  members whose `walletAddress` matches a certifier in the feed. */
export function computeMostActive(
  items: CircleItem[],
  members: TrustCircleAccount[],
  window: ActivityWindow = '7d',
  topN: number = 4,
): MemberActivity[] {
  const cutoff =
    window === '7d'
      ? Date.now() - 7 * 24 * 60 * 60 * 1000
      : window === '30d'
        ? Date.now() - 30 * 24 * 60 * 60 * 1000
        : 0

  const counts = new Map<string, number>()
  for (const item of items) {
    if (new Date(item.timestamp).getTime() < cutoff) continue
    if (!item.certifierAddress) continue
    const key = item.certifierAddress.toLowerCase()
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const byWallet = new Map<string, TrustCircleAccount>()
  for (const m of members) {
    if (m.walletAddress) byWallet.set(m.walletAddress.toLowerCase(), m)
  }

  const result: MemberActivity[] = []
  for (const [addr, count] of counts) {
    const member = byWallet.get(addr)
    if (member) result.push({ member, count })
  }
  return result.sort((a, b) => b.count - a.count).slice(0, topN)
}
