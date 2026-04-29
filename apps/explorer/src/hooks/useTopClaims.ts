/**
 * useTopClaims — top-N claims the user supports, ranked by combined
 * market cap. Sources its term_ids from `useUserOnChainProfile` so
 * there's no 200-event window: the user's full alltime claim set is
 * eligible. Vault stats are batch-fetched in a single round trip.
 */
import { useQuery } from '@tanstack/react-query'
import { useGetBatchTripleVaultStatsQuery } from '@0xsofia/graphql'
import { useUserOnChainProfile } from '@/hooks/useUserOnChainProfile'
import {
  extractSide,
  type VaultStats,
  statsCache,
} from '@/services/vaultTooltipService'
import { INTUITION_FEATURED_CLAIMS, SOFIA_CLAIMS } from '@/config/debateConfig'

/** term_ids of debate claims — exclude from Top Claims. */
const DEBATE_TERM_IDS = new Set(
  [...INTUITION_FEATURED_CLAIMS, ...SOFIA_CLAIMS].map((c) => c.tripleTermId),
)

const TOP_N = 4
const STATS_CANDIDATE_CAP = 200 // safety cap on the batch stats request

export interface TopClaim {
  termId: string
  objectLabel: string
  objectUrl?: string
  predicateLabel: string
  stats: VaultStats
  totalMarketCap: bigint
}

async function resolveTopClaims(
  addresses: string[],
  termIds: string[],
  predicateByTerm: Map<string, string>,
  objectByTerm: Map<string, { label: string; url?: string }>,
): Promise<TopClaim[]> {
  if (addresses.length === 0 || termIds.length === 0) return []

  const statsData = await useGetBatchTripleVaultStatsQuery.fetcher({
    termIds,
    addresses,
  })()

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

    statsCache.set(
      `${triple.term_id}::${[...addresses].sort().join(',')}`,
      stats,
    )

    const fallbackObj = objectByTerm.get(triple.term_id ?? '')
    claims.push({
      termId: triple.term_id,
      objectLabel: triple.object?.label ?? fallbackObj?.label ?? '',
      objectUrl:
        triple.object?.value?.thing?.url ?? fallbackObj?.url ?? undefined,
      predicateLabel:
        triple.predicate?.label ?? predicateByTerm.get(triple.term_id ?? '') ?? '',
      stats,
      totalMarketCap,
    })
  }

  return claims
    .sort((a, b) => (b.totalMarketCap > a.totalMarketCap ? 1 : -1))
    .slice(0, TOP_N)
}

export function useTopClaims(addresses: string[] | undefined) {
  const { profile } = useUserOnChainProfile(addresses)

  // Use the master profile's certs as the universe of candidate claims.
  // We keep a small derived map per term_id so the batch stats result
  // can fall back to it if the secondary query strips object/predicate
  // labels. Excluded predicates ("has tag") and debate claims are
  // dropped here too.
  const candidates: {
    termIds: string[]
    predicateByTerm: Map<string, string>
    objectByTerm: Map<string, { label: string; url?: string }>
  } = (() => {
    const termIds: string[] = []
    const predicateByTerm = new Map<string, string>()
    const objectByTerm = new Map<string, { label: string; url?: string }>()
    for (const cert of profile.certs) {
      if (!cert.termId) continue
      if (DEBATE_TERM_IDS.has(cert.termId)) continue
      if (cert.intention === 'has tag') continue
      if (predicateByTerm.has(cert.termId)) continue // already seen
      predicateByTerm.set(cert.termId, cert.intention)
      objectByTerm.set(cert.termId, {
        label: cert.objectLabel,
        url: cert.objectUrl || undefined,
      })
      termIds.push(cert.termId)
      if (termIds.length >= STATS_CANDIDATE_CAP) break
    }
    return { termIds, predicateByTerm, objectByTerm }
  })()

  const normalized = addresses ? [...addresses].sort() : []
  const cacheKey =
    normalized.join(',') + '::' + candidates.termIds.slice(0, 64).join(',')
  const enabled = !!addresses && addresses.length > 0 && candidates.termIds.length > 0

  const { data, isLoading } = useQuery<TopClaim[]>({
    queryKey: ['topClaims', cacheKey],
    queryFn: () =>
      resolveTopClaims(
        addresses!,
        candidates.termIds,
        candidates.predicateByTerm,
        candidates.objectByTerm,
      ),
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return { claims: data ?? [], loading: isLoading && !data }
}
