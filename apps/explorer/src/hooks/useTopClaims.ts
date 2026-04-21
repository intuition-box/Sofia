import { useQuery } from '@tanstack/react-query'
import {
  useGetUserActivityQuery,
  useGetBatchTripleVaultStatsQuery,
} from '@0xsofia/dashboard-graphql'
import { SOFIA_PROXY_ADDRESS } from '@/config'
import { extractSide, type VaultStats, statsCache } from '@/services/vaultTooltipService'
import { INTUITION_FEATURED_CLAIMS, SOFIA_CLAIMS } from '@/config/debateConfig'

/** term_ids of debate claims — exclude from Top Claims */
const DEBATE_TERM_IDS = new Set(
  [...INTUITION_FEATURED_CLAIMS, ...SOFIA_CLAIMS].map((c) => c.tripleTermId),
)

export interface TopClaim {
  termId: string
  objectLabel: string
  objectUrl?: string
  predicateLabel: string
  stats: VaultStats
  totalMarketCap: bigint
}

async function resolveTopClaims(walletAddress: string): Promise<TopClaim[]> {
  // 1. Fetch user's activity filtered by Sofia proxy (server-side)
  const activityData = await useGetUserActivityQuery.fetcher({
    proxy: SOFIA_PROXY_ADDRESS.toLowerCase(),
    receiver: walletAddress.toLowerCase(),
    limit: 200,
    offset: 0,
  })()

  // 2. Extract unique triple term_ids from events
  const seen = new Set<string>()
  const tripleTermIds: string[] = []

  // Predicates to exclude (has tag = quests/badges, not real claims)
  const EXCLUDED_PREDICATES = new Set(['has tag'])

  for (const event of activityData.events ?? []) {
    const termId = event.triple?.term_id
    if (!termId) continue
    if (DEBATE_TERM_IDS.has(termId)) continue
    if (EXCLUDED_PREDICATES.has(event.triple?.predicate?.label ?? '')) continue
    if (seen.has(termId)) continue
    seen.add(termId)
    tripleTermIds.push(termId)
    if (tripleTermIds.length >= 10) break
  }

  if (tripleTermIds.length === 0) return []

  // 3. Batch fetch vault stats — ONE query
  const statsData = await useGetBatchTripleVaultStatsQuery.fetcher({
    termIds: tripleTermIds,
    address: walletAddress,
  })()

  // 4. Process results
  const claims: TopClaim[] = []
  for (const triple of statsData.triples ?? []) {
    const support = extractSide(triple.term?.vaults)
    const oppose = extractSide(triple.counter_term?.vaults)
    const totalMarketCap = BigInt(support.marketCap) + BigInt(oppose.marketCap)
    if (totalMarketCap <= 0n) continue

    const stats: VaultStats = {
      supportMarketCap: support.marketCap,
      opposeMarketCap: oppose.marketCap,
      supportCount: support.count,
      opposeCount: oppose.count,
      userPnlPct: support.userPnlPct ?? oppose.userPnlPct,
    }

    // Cache for tooltip reuse
    statsCache.set(triple.term_id, stats)

    claims.push({
      termId: triple.term_id,
      objectLabel: triple.object?.label ?? '',
      objectUrl: triple.object?.value?.thing?.url ?? undefined,
      predicateLabel: triple.predicate?.label ?? '',
      stats,
      totalMarketCap,
    })
  }

  return claims
    .sort((a, b) => (b.totalMarketCap > a.totalMarketCap ? 1 : -1))
    .slice(0, 4)
}

export function useTopClaims(walletAddress: string | undefined) {
  const { data, isLoading } = useQuery<TopClaim[]>({
    queryKey: ['topClaims', walletAddress],
    queryFn: () => resolveTopClaims(walletAddress!),
    enabled: !!walletAddress,
    // Trust the persister between sessions; the data moves on the
    // order of minutes and our custom serializer handles the bigint
    // totalMarketCap. Background refresh happens on explicit refresh
    // calls from the UI.
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return { claims: data ?? [], loading: isLoading && !data }
}
