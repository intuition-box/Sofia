/**
 * useMemberActivity — derives per-member activity from the circle feed,
 * the same way `CircleMostActiveCard` does via `computeMostActive`.
 *
 * The member roster (`TrustCircleAccount`) carries NO score / signals /
 * streak field, so the Free-tier Members module + side panel can't read
 * those off the member directly. Instead we count `feedItems` per
 * certifier wallet — the single source of truth already used for the
 * "Most active" leaderboard — and expose:
 *
 *  - `signalsByTermId`     map termId → signal count (0 when none)
 *  - `signalsForMember`    helper lookup
 *  - `isActive`            true when the member has any signal inside the
 *                          last 30 days (a degraded "Active / Quiet" hint —
 *                          the proto's real streak/availability data does
 *                          not exist on-chain, so we never fabricate a
 *                          streak number; we only surface Active vs Quiet).
 *  - `ranked`              roster sorted by signal count desc, then label,
 *                          so the top-3 cards + panel roster share one order.
 */
import { useMemo } from 'react'
import type { CircleItem } from '@/services/circleService'
import type { TrustCircleAccount } from '@/services/trustCircleService'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export interface MemberActivityResult {
  /** termId → total signal count across the loaded feed. */
  signalsByTermId: ReadonlyMap<string, number>
  /** termId → had ≥1 signal in the last 30 days. */
  activeByTermId: ReadonlyMap<string, boolean>
  /** Roster sorted by signal count desc, then label asc — stable. */
  ranked: TrustCircleAccount[]
  /** Convenience lookups keyed by member. */
  signalsForMember: (m: TrustCircleAccount) => number
  isActive: (m: TrustCircleAccount) => boolean
}

export function useMemberActivity(
  items: CircleItem[],
  members: TrustCircleAccount[],
): MemberActivityResult {
  return useMemo(() => {
    const now = Date.now()
    const cutoff = now - THIRTY_DAYS_MS

    // wallet → { total, recent } counts. Lowercased keys to match the feed.
    const totals = new Map<string, number>()
    const recent = new Map<string, boolean>()
    for (const item of items) {
      if (!item.certifierAddress) continue
      const key = item.certifierAddress.toLowerCase()
      totals.set(key, (totals.get(key) ?? 0) + 1)
      if (new Date(item.timestamp).getTime() >= cutoff) recent.set(key, true)
    }

    const signalsByTermId = new Map<string, number>()
    const activeByTermId = new Map<string, boolean>()
    for (const m of members) {
      const wallet = m.walletAddress?.toLowerCase()
      const count = wallet ? (totals.get(wallet) ?? 0) : 0
      signalsByTermId.set(m.termId, count)
      activeByTermId.set(m.termId, wallet ? recent.get(wallet) === true : false)
    }

    const ranked = [...members].sort((a, b) => {
      const diff =
        (signalsByTermId.get(b.termId) ?? 0) -
        (signalsByTermId.get(a.termId) ?? 0)
      if (diff !== 0) return diff
      return a.label.localeCompare(b.label)
    })

    return {
      signalsByTermId,
      activeByTermId,
      ranked,
      signalsForMember: (m: TrustCircleAccount) =>
        signalsByTermId.get(m.termId) ?? 0,
      isActive: (m: TrustCircleAccount) => activeByTermId.get(m.termId) === true,
    }
  }, [items, members])
}
