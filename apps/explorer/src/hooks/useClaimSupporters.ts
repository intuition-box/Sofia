/**
 * useClaimSupporters — React Query wrapper over claimSupportersService.
 *
 * Returns the time-ordered support/oppose stakers for a set of claims, keyed
 * by claim term_id. Consumed by the reputation derivation and the feed's
 * "credibility" lens. See docs/reputation-curation.md.
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  fetchClaimSupporters,
  type ClaimSupporters,
} from '@/services/claimSupportersService'

export function useClaimSupporters(claimTermIds: readonly string[]) {
  // Stable, deduped, sorted key so the cache hits regardless of input order.
  const key = useMemo(
    () => [...new Set(claimTermIds)].filter(Boolean).sort(),
    [claimTermIds],
  )

  const query = useQuery({
    queryKey: ['claimSupporters', key],
    queryFn: () => fetchClaimSupporters(key),
    enabled: key.length > 0,
    staleTime: 5 * 60 * 1000,
    // 24h to match the persister's maxAge (providers.tsx) so this link of the
    // reputation chain survives reloads/navigation instead of being GC'd at 30m.
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  // The query caches a plain object (survives localStorage persistence); the
  // consumers want a Map. Rebuild it here — cheap and persistence-safe. The
  // `instanceof Map` branch tolerates a stale in-memory Map (e.g. across HMR).
  const byClaim = useMemo(() => {
    const data = query.data
    if (data instanceof Map) return data as Map<string, ClaimSupporters>
    return new Map<string, ClaimSupporters>(Object.entries(data ?? {}))
  }, [query.data])

  return {
    /** Map<claimTermId, { support, oppose }> — ordered, Pioneer first. */
    byClaim,
    loading: query.isLoading,
    error: query.error ? String(query.error) : null,
    refresh: query.refetch,
  }
}
