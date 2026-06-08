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
    // 24h to match the persister's maxAge (providers.tsx) — the MCP eigentrust
    // pass is the slow link in the reputation chain, so its result must survive
    // reloads/navigation for the full persist window, not get GC'd after 1h.
    gcTime: 24 * 60 * 60 * 1000,
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
    /** Map<address, credibility>. */
    byAddress,
    /** Convenience accessor — 0 when unknown. */
    score: (address: string) => byAddress.get(address) ?? 0,
    loading: query.isLoading,
    error: query.error ? String(query.error) : null,
  }
}
