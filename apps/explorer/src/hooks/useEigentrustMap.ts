/**
 * useEigentrustMap — React Query wrapper over eigentrustService.
 *
 * Returns global credibility (composite trust score) per address, used to
 * weight followers in the reputation derivation and the feed's credibility
 * lens. Cached long (the trust graph syncs on a cron, not real-time).
 * See docs/reputation-curation.md.
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchEigentrustMap } from '@/services/eigentrustService'

const EMPTY = new Map<string, number>()

export function useEigentrustMap(addresses: readonly string[]) {
  const key = useMemo(
    () => [...new Set(addresses)].filter(Boolean).sort(),
    [addresses],
  )

  const query = useQuery({
    queryKey: ['eigentrustMap', key],
    queryFn: () => fetchEigentrustMap(key),
    enabled: key.length > 0,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const byAddress = query.data ?? EMPTY

  return {
    /** Map<address, credibility>. */
    byAddress,
    /** Convenience accessor — 0 when unknown. */
    score: (address: string) => byAddress.get(address) ?? 0,
    loading: query.isLoading,
    error: query.error ? String(query.error) : null,
  }
}
