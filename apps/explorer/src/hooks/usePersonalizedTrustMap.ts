/**
 * usePersonalizedTrustMap — credibility of a set of addresses *from the
 * perspective of a seed* (pretrust anchor).
 *
 * Wraps `eigentrustService.fetchGroupTrustMap`, which calls the remote trust
 * engine's `compute_personalized_trust(fromAddress = seed, toAddress = target)`
 * per target. Unlike global EigenTrust (which collapses to ~0 without a
 * pretrust seed), personalized trust is anchored on the seed, so the score
 * reflects real trust propagation from the seed to each target.
 *
 * Used by the reputation derivation: the seed is the viewing wallet, so a
 * profile's reputation is weighted by how much *you* trust the accounts that
 * backed its claims. See docs/reputation-curation.md.
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchGroupTrustMap } from '@/services/eigentrustService'

export function usePersonalizedTrustMap(
  seed: readonly string[],
  targets: readonly string[],
) {
  // Stable, deduped, sorted keys so the cache hits regardless of input order.
  const seedKey = useMemo(
    () => [...new Set(seed)].filter(Boolean).sort(),
    [seed],
  )
  const targetKey = useMemo(
    () => [...new Set(targets)].filter(Boolean).sort(),
    [targets],
  )

  const query = useQuery({
    queryKey: ['personalizedTrustMap', seedKey, targetKey],
    queryFn: () => fetchGroupTrustMap(seedKey, targetKey),
    enabled: seedKey.length > 0 && targetKey.length > 0,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  // The query caches a plain object (survives localStorage persistence); the
  // consumers want a Map. Rebuild it here — cheap and persistence-safe. The
  // `instanceof Map` branch tolerates a stale in-memory Map (e.g. across HMR).
  const byAddress = useMemo(() => {
    const data = query.data
    if (data instanceof Map) return data as Map<string, number>
    return new Map<string, number>(Object.entries(data ?? {}))
  }, [query.data])

  return {
    /** Map<address, personalized-trust score from the seed>. */
    byAddress,
    /** Convenience accessor — 0 when unknown. */
    score: (address: string) => byAddress.get(address) ?? 0,
    loading: query.isLoading,
    error: query.error ? String(query.error) : null,
  }
}
