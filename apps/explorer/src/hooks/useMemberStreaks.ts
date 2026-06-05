/**
 * useMemberStreaks — joins the global daily-certification streak
 * leaderboard onto circle members by wallet address.
 *
 * The streak system is real (`streakService.fetchStreakLeaderboard`):
 * it derives a per-address "current consecutive days" count from daily
 * certification deposits. That leaderboard is a single global query —
 * NOT per circle — so we fetch it ONCE here (via `useStreakLeaderboard`,
 * which the page-level caller mounts a single time) and expose a cheap
 * `Map<lowercasedAddress, streakDays>` plus a member lookup.
 *
 * Members with no leaderboard entry simply aren't in the map; callers
 * read `streakForMember` which returns `undefined` for them so the UI
 * can drop the streak token rather than fabricate a number.
 */
import { useMemo } from 'react'
import type { TrustCircleAccount } from '@/services/trustCircleService'
import { useStreakLeaderboard } from '@/hooks/useStreakLeaderboard'

export interface MemberStreaksResult {
  /** lowercased wallet address → current streak in days (>0 only). */
  streaksByAddress: ReadonlyMap<string, number>
  /** Streak days for a member, or `undefined` when none / no wallet. */
  streakForMember: (m: TrustCircleAccount) => number | undefined
  loading: boolean
}

export function useMemberStreaks(): MemberStreaksResult {
  const { entries, loading } = useStreakLeaderboard()

  const streaksByAddress = useMemo(() => {
    const map = new Map<string, number>()
    for (const entry of entries) {
      if (entry.streakDays <= 0) continue
      map.set(entry.address.toLowerCase(), entry.streakDays)
    }
    return map
  }, [entries])

  return useMemo(
    () => ({
      streaksByAddress,
      streakForMember: (m: TrustCircleAccount) => {
        const wallet = m.walletAddress?.toLowerCase()
        return wallet ? streaksByAddress.get(wallet) : undefined
      },
      loading,
    }),
    [streaksByAddress, loading],
  )
}
