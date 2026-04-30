/**
 * useUserPositionTermIds — live set of term_ids the user has shares > 0 on,
 * derived from the realtime positions cache populated by the
 * SubscriptionManager.
 *
 * Reads from the same cache key the WS writes into
 * (`realtimeKeys.positions(walletsKey)`); callers passing the same
 * `addresses` array as the SubscriptionManager get instant updates when a
 * deposit is observed on-chain. Initial mount returns an empty set —
 * consumers should union with their query payload to cover the gap before
 * the first WS push.
 *
 * Limitation: the WatchUserPositions subscription is capped at the user's
 * top 500 positions by shares. A position on a low-share triple may not
 * appear here even if it exists. Always treat this as a "live override"
 * over the authoritative payload, not a replacement.
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { WatchUserPositionsSubscription } from '@0xsofia/graphql'
import { realtimeKeys } from '@/lib/realtime/derivations'

type Position = NonNullable<WatchUserPositionsSubscription['positions']>[number]

const EMPTY_SET = new Set<string>()

function walletsKeyFor(addresses: readonly string[]): string {
  return [...addresses]
    .map((a) => a.toLowerCase())
    .sort()
    .join(',')
}

export function useUserPositionTermIds(
  addresses: readonly string[] | undefined,
): Set<string> {
  const walletsKey = addresses?.length ? walletsKeyFor(addresses) : undefined

  const { data } = useQuery<Position[]>({
    queryKey: walletsKey
      ? realtimeKeys.positions(walletsKey)
      : ['positions', undefined],
    // No real fetcher — the SubscriptionManager writes into this key. The
    // empty seed lets the hook return [] before the first WS push instead
    // of throwing on a missing queryFn.
    queryFn: () => Promise.resolve<Position[]>([]),
    enabled: !!walletsKey,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
  })

  return useMemo(() => {
    if (!data || data.length === 0) return EMPTY_SET
    const set = new Set<string>()
    for (const p of data) {
      if (!p.term_id) continue
      try {
        if (BigInt(p.shares ?? '0') > 0n) set.add(p.term_id)
      } catch {
        // shares isn't a parseable bigint — skip
      }
    }
    return set
  }, [data])
}
