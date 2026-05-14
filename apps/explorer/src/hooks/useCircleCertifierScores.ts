/**
 * useCircleCertifierScores — batch-fetches personalized-trust scores
 * from the circle's roster (anchors) to each unique certifier in the
 * feed. Returns a flat lookup `Map<lowercase(certifier) → score>` plus
 * a `loading` flag so the consumer can fall back to the local star
 * heuristic until the MCP responds.
 *
 * Each (anchorsKey, certifier) couple is cached independently via
 * `useQueries`, so a new certifier appearing in the feed doesn't
 * invalidate the scores already computed for the rest.
 */
import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import {
  fetchPersonalizedTrust,
  SOFIA_TRUST_PREDICATES,
} from '@/services/mcpTrustService'

const STALE_TIME_MS = 30 * 60 * 1000
const GC_TIME_MS = 24 * 60 * 60 * 1000

export interface CircleCertifierScores {
  scores: Map<string, number>
  isLoading: boolean
}

export function useCircleCertifierScores(
  certifiers: readonly string[] | undefined,
  anchors: readonly string[] | undefined,
): CircleCertifierScores {
  const unique = useMemo(() => {
    if (!certifiers || certifiers.length === 0) return [] as string[]
    return Array.from(
      new Set(
        certifiers
          .map((a) => (a ?? '').toLowerCase())
          .filter((a) => a.length > 0),
      ),
    )
  }, [certifiers])

  const anchorsKey = useMemo(() => {
    if (!anchors || anchors.length === 0) return ''
    return [...anchors]
      .map((a) => a.toLowerCase())
      .sort()
      .join(',')
  }, [anchors])

  const enabled = anchorsKey.length > 0 && unique.length > 0

  const queries = useQueries({
    queries: unique.map((certifier) => ({
      queryKey: ['mcp-personalized-trust', anchorsKey, certifier],
      queryFn: async () => {
        const result = await fetchPersonalizedTrust(
          anchors!,
          certifier,
          SOFIA_TRUST_PREDICATES,
        )
        return result?.score ?? 0
      },
      enabled,
      staleTime: STALE_TIME_MS,
      gcTime: GC_TIME_MS,
      refetchOnWindowFocus: false,
    })),
  })

  return useMemo(() => {
    const scores = new Map<string, number>()
    let isLoading = false
    queries.forEach((q, i) => {
      if (q.isLoading) isLoading = true
      if (q.data !== undefined) scores.set(unique[i], q.data)
    })
    return { scores, isLoading: isLoading && scores.size === 0 }
  }, [queries, unique])
}
