/**
 * usePerspective — orchestrates the Compose → Perspective pipeline.
 *
 * Resolves `(circleIds, topicIds, mode)` into:
 *   1. A per-circle wallet roster (Trust Circle + on-chain groups).
 *   2. A per-circle list of `PerspectiveCert` (one network call per circle,
 *      paralleled by React Query, optionally narrowed by the topics filter).
 *   3. A single `AggregatedCert[]` produced by the chosen mode combinator.
 *
 * The hook stays declarative: it never fetches on render and React Query
 * dedupes across consumers via the cache key.
 */

import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { useLinkedWallets } from './useLinkedWallets'
import { useTrustCircle } from './useTrustCircle'
import { useGroups } from './useGroups'
import {
  fetchPerspectiveCertifications,
  type PerspectiveCert,
} from '@/services/perspectiveService'
import {
  aggregatePerspective,
  type AggregatedCert,
  type AggregationMode,
  type CertsByPick,
} from '@/lib/perspectiveAggregation'
import { TOPIC_ATOM_IDS } from '@/config/atomIds'

const TRUST_CIRCLE_ID = 'trust'

const STALE_TIME_MS = 5 * 60 * 1000
const GC_TIME_MS = 60 * 60 * 1000

export interface UsePerspectiveResult {
  /** Ranked, deduped result of the chosen mode. Empty when the selection
   *  doesn't yield any compilable picks. */
  items: AggregatedCert[]
  /** Resolved wallets per circle id — exposed so the UI can display the
   *  "compiled from X members" metadata without re-doing the join. */
  walletsByCircle: Map<string, string[]>
  /** True while at least one underlying circle query is still loading
   *  with no cached data to show. */
  loading: boolean
  /** First error surfaced by the underlying queries, if any. */
  error: string | null
  /** Convenience flag — `true` when the inputs are valid for a compile
   *  (at least one circle resolved and the mode is satisfiable). Useful
   *  for empty-state copy. */
  hasPicks: boolean
}

/**
 * Run the pipeline. Pass `enabled = false` when the URL hasn't been
 * parsed yet — prevents a flicker of an "empty perspective" message
 * while the route params are still being read.
 */
export function usePerspective(
  circleIds: string[],
  topicIds: string[],
  mode: AggregationMode,
  enabled: boolean = true,
): UsePerspectiveResult {
  const { addresses } = useLinkedWallets()
  const { accounts: trustMembers } = useTrustCircle(addresses)
  const { groups } = useGroups()

  // ── Step 1 — resolve each circle id to its member wallet roster.
  const walletsByCircle = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const id of circleIds) {
      if (id === TRUST_CIRCLE_ID) {
        const wallets = new Set<string>()
        // Linked wallets count as members of their own Trust Circle —
        // certs they authored are part of the compilation.
        for (const a of addresses) wallets.add(a.toLowerCase())
        for (const m of trustMembers) {
          if (m.walletAddress) wallets.add(m.walletAddress.toLowerCase())
        }
        map.set(id, Array.from(wallets))
        continue
      }
      const group = groups.find((g) => g.termId === id)
      if (!group) {
        // Unknown circle id — keep an empty pick so it still shows up
        // as a column in `walletsByCircle` (UI can show "0 members").
        map.set(id, [])
        continue
      }
      const wallets = new Set<string>()
      for (const membership of group.memberships) {
        const w = membership.member.walletAddress
        if (w) wallets.add(w.toLowerCase())
      }
      map.set(id, Array.from(wallets))
    }
    return map
  }, [circleIds, addresses, trustMembers, groups])

  // ── Step 2 — resolve topic ids → on-chain atom ids.
  const topicAtomIds = useMemo(() => {
    return topicIds.map((id) => TOPIC_ATOM_IDS[id]).filter(Boolean) as string[]
  }, [topicIds])

  // ── Step 3 — one query per circle (parallel, individually cached).
  const queries = useQueries({
    queries: circleIds.map((id) => {
      const wallets = walletsByCircle.get(id) ?? []
      return {
        queryKey: [
          'perspective',
          id,
          [...wallets].sort().join(','),
          [...topicAtomIds].sort().join(','),
        ],
        queryFn: () => fetchPerspectiveCertifications(wallets, topicAtomIds),
        enabled: enabled && wallets.length > 0,
        staleTime: STALE_TIME_MS,
        gcTime: GC_TIME_MS,
        refetchOnWindowFocus: false,
      }
    }),
  })

  // ── Step 4 — gather queries into a CertsByPick map, in selection order.
  const certsByPick: CertsByPick = useMemo(() => {
    const map = new Map<string, PerspectiveCert[]>()
    circleIds.forEach((id, i) => {
      const data = queries[i]?.data
      if (data && data.length > 0) {
        map.set(id, data)
      }
    })
    return map
  }, [circleIds, queries])

  // ── Step 5 — aggregate.
  const items = useMemo(() => {
    if (certsByPick.size === 0) return []
    return aggregatePerspective(certsByPick, mode)
  }, [certsByPick, mode])

  const loading = queries.some((q) => q.isLoading && !q.data)
  const firstError = queries.find((q) => q.error)?.error
  const error = firstError
    ? firstError instanceof Error
      ? firstError.message
      : String(firstError)
    : null

  return {
    items,
    walletsByCircle,
    loading,
    error,
    hasPicks: certsByPick.size > 0,
  }
}
