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

const EMPTY = new Map<string, ClaimSupporters>()

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
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return {
    /** Map<claimTermId, { support, oppose }> — ordered, Pioneer first. */
    byClaim: query.data ?? EMPTY,
    loading: query.isLoading,
    error: query.error ? String(query.error) : null,
    refresh: query.refetch,
  }
}
