/**
 * useCircleTopicCounts — alltime per-topic cert counts for the given trust
 * circle, scoped to a fixed list of topics. Uses
 * `circleTopicCountsService.fetchCircleTopicCounts` and caches the result
 * for 5 minutes; counts move slowly relative to UI interactions.
 */

import { useQuery } from '@tanstack/react-query'
import {
  fetchCircleTopicCounts,
  type CircleTopicCounts,
} from '@/services/circleTopicCountsService'
import { TOPIC_ATOM_IDS } from '@/config/atomIds'

const STALE_TIME_MS = 5 * 60 * 1000
const GC_TIME_MS = 60 * 60 * 1000

const EMPTY: CircleTopicCounts = new Map()

interface Result {
  counts: CircleTopicCounts
  isLoading: boolean
  error: string | null
}

export function useCircleTopicCounts(
  trustedWallets: readonly string[] | undefined,
  topicSlugs: readonly string[] | undefined,
): Result {
  const wallets = trustedWallets ? [...trustedWallets].sort() : []
  const slugs = topicSlugs ? [...topicSlugs].sort() : []
  const enabled = wallets.length > 0 && slugs.length > 0

  // Resolve topic slugs → atom term_ids; drop unknown slugs upfront.
  const atomIds = slugs
    .map((s) => TOPIC_ATOM_IDS[s])
    .filter((x): x is string => !!x)

  const cacheKey = `${wallets.join(',')}|${slugs.join(',')}`

  const { data, isLoading, error } = useQuery<CircleTopicCounts>({
    queryKey: ['circle-topic-counts', cacheKey],
    queryFn: () => fetchCircleTopicCounts(wallets, atomIds),
    enabled: enabled && atomIds.length > 0,
    staleTime: STALE_TIME_MS,
    gcTime: GC_TIME_MS,
    refetchOnWindowFocus: false,
  })

  return {
    counts: data ?? EMPTY,
    isLoading: enabled && isLoading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
  }
}
