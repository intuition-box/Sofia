/**
 * useTopicPositions — reads the canonical per-topic share map maintained by
 * the realtime SubscriptionManager. The cache stores shares as decimal
 * strings (bigints aren't JSON-serializable, which would break the
 * persister); we convert to bigint lazily on read.
 *
 * The queryFn seeds the cache with a one-shot RPC batch read so the UI has
 * data before the first WS delta arrives; once the WS starts pushing, its
 * derivations overwrite this same key.
 */

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { TOPIC_ATOM_IDS } from '@/config/atomIds'
import { getSharesBatch } from '@/services/redeemService'
import { realtimeKeys, sharesToBigInt } from '@/lib/realtime/derivations'

export interface TopicPositionMap {
  /** topicSlug → shares (0n means no position) */
  [topicId: string]: bigint
}

const ALL_TOPIC_TERM_IDS = Object.values(TOPIC_ATOM_IDS)

async function seedTopicPositions(address: string): Promise<Record<string, string>> {
  const shares = await getSharesBatch(address, ALL_TOPIC_TERM_IDS)
  const result: Record<string, string> = {}
  for (const [slug, termId] of Object.entries(TOPIC_ATOM_IDS)) {
    const v = shares.get(termId) ?? 0n
    if (v > 0n) result[slug] = v.toString()
  }
  return result
}

export function useTopicPositions(selectedTopics: string[]) {
  const { authenticated } = usePrivy()
  const { wallets } = useWallets()
  const wallet = wallets[0]
  const address = wallet?.address?.toLowerCase()
  const qc = useQueryClient()

  const { data, isLoading, isSuccess, refetch } = useQuery<Record<string, string>>({
    queryKey: address ? realtimeKeys.topicPositionsMap(address) : ['topic-positions-map', undefined],
    queryFn: () => seedTopicPositions(wallet!.address),
    enabled: authenticated && !!address,
    // 10min is long enough to dedupe reloads in the same session; the WS
    // pushes reset the timestamp via setQueryData so the effective
    // freshness window is as-of the last delta. Not Infinity — otherwise
    // a stale-empty cache from a first mount with RPC lag would lock
    // the UI into "pending" forever.
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const raw = data ?? {}

  const hasPosition = useCallback(
    (topicId: string) => sharesToBigInt(raw[topicId]) > 0n,
    [raw],
  )
  const isPending = useCallback(
    (topicId: string) =>
      isSuccess && selectedTopics.includes(topicId) && sharesToBigInt(raw[topicId]) === 0n,
    [isSuccess, selectedTopics, raw],
  )

  // Expose the bigint view for legacy consumers that iterate shares.
  const positions: TopicPositionMap = {}
  for (const [slug, s] of Object.entries(raw)) {
    positions[slug] = sharesToBigInt(s)
  }

  const wrappedRefetch = useCallback(() => {
    if (address) qc.invalidateQueries({ queryKey: realtimeKeys.topicPositionsMap(address) })
    return refetch()
  }, [address, qc, refetch])

  return {
    positions,
    hasPosition,
    isPending,
    isLoading,
    refetch: wrappedRefetch,
  }
}
