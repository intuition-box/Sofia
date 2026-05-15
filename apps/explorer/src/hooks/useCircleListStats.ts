/**
 * useCircleListStats — derives the small stats block shown on each
 * circle card in /circles (Posts / Votes / Live · 7d).
 *
 * Uses a dedicated `GetSofiaCircleListStats` aggregate query instead
 * of piggy-backing on `useCircleFeed`. The feed only loads page 0
 * by default (the user has to scroll inside a detail page to grow
 * `items`), so deriving totals from `items.length` was undercounting
 * Trust Circles with many certs. The aggregate query gives all-time
 * totals in one cheap call.
 *
 * Cached for 10 min via React Query. One query per visible card on
 * first paint; subsequent paints + clicks through to the detail
 * page reuse the cached payload.
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAddress } from 'viem'
import { useGetSofiaCircleListStatsQuery } from '@0xsofia/graphql'
import type { CircleStats } from '@/services/circleStats'

export interface CircleListStats {
  stats: CircleStats
  isLoading: boolean
}

// Same canonical predicate set as `circleService` + `userOnChain
// ProfileService` — keep in sync.
const CERT_PREDICATE_LABELS = [
  'visits for work',
  'visits for learning',
  'visits for learning ', // legacy trailing-space variant
  'visits for fun',
  'visits for inspiration',
  'visits for buying',
  'visits for music',
  'trusts',
  'distrust',
] as const

const EMPTY_STATS: CircleStats = {
  postCount: 0,
  voteCount: 0,
  activeMemberCount: 0,
}

export function useCircleListStats(
  addresses: readonly string[] | undefined,
): CircleListStats {
  const enabled = !!addresses && addresses.length > 0

  // Stable cache key — checksummed + sorted so React Query dedupes
  // across components rendering the same circle card.
  const checksummed = useMemo(() => {
    if (!addresses) return [] as string[]
    return [...addresses.map((a) => getAddress(a))].sort()
  }, [addresses])

  const sevenDaysAgo = useMemo(
    () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    [],
  )

  const { data, isLoading } = useQuery({
    queryKey: ['circle-list-stats', checksummed.join(','), sevenDaysAgo],
    queryFn: () =>
      useGetSofiaCircleListStatsQuery.fetcher({
        trustedWallets: checksummed,
        predicateLabels: [...CERT_PREDICATE_LABELS],
        sevenDaysAgo,
      })(),
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const stats = useMemo<CircleStats>(() => {
    if (!data) return EMPTY_STATS
    const postCount = data.posts?.aggregate?.count ?? 0
    const voteCount = data.votes?.aggregate?.count ?? 0
    const recentRows = data.recent ?? []
    const recentSet = new Set<string>()
    for (const r of recentRows) {
      if (r.account_id) recentSet.add(r.account_id.toLowerCase())
    }
    return {
      postCount,
      voteCount,
      activeMemberCount: recentSet.size,
    }
  }, [data])

  return { stats, isLoading: enabled && isLoading }
}
