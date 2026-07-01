import { useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchTrustCircle } from '../services/trustCircleService'
import type { TrustCircleAccount } from '../services/trustCircleService'
import {
  OPTIMISTIC_TRUST_KEY,
  pruneOptimisticTrust,
} from '../lib/realtime/optimisticTrust'

export function useTrustCircle(addresses: string[] | undefined) {
  const qc = useQueryClient()
  const normalized = addresses ? [...addresses].sort() : []
  const cacheKey = normalized.join(',') || undefined
  const enabled = !!addresses && addresses.length > 0

  const { data, isLoading, error } = useQuery<TrustCircleAccount[]>({
    queryKey: cacheKey ? ['trustCircle', cacheKey] : ['trustCircle', undefined],
    queryFn: () => fetchTrustCircle(addresses!),
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  // Optimistic overlay — just-signed trusts the indexer hasn't returned yet.
  // Written by WeightModal on tx success (see optimisticTrust.ts); never
  // fetched, only ever set via setQueryData, so subscribing here just makes
  // this component re-render when a new trust is queued.
  const { data: optimistic } = useQuery<TrustCircleAccount[]>({
    queryKey: OPTIMISTIC_TRUST_KEY,
    queryFn: () => [],
    enabled: false,
    initialData: [],
    staleTime: Infinity,
    gcTime: Infinity,
  })

  const real = data ?? []
  const pending = optimistic ?? []

  // Reconcile: once an optimistic entry shows up in the authoritative list
  // (indexer caught up), drop the placeholder from the overlay.
  useEffect(() => {
    if (!pending.length) return
    const indexed = new Set(real.map((a) => a.termId))
    if (pending.some((a) => indexed.has(a.termId))) {
      pruneOptimisticTrust(qc, indexed)
    }
  }, [real, pending, qc])

  // Merge: authoritative list + optimistic entries not yet indexed.
  const accounts = useMemo(() => {
    if (!pending.length) return real
    const realTermIds = new Set(real.map((a) => a.termId))
    const extra = pending.filter((a) => !realTermIds.has(a.termId))
    if (!extra.length) return real
    return [...real, ...extra].sort((a, b) => b.trustAmount - a.trustAmount)
  }, [real, pending])

  return {
    accounts,
    loading: isLoading,
    error: error ? (error as Error).message : null,
  }
}
