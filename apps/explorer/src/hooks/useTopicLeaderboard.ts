/**
 * useTopicLeaderboard — global ranking of accounts active in a topic, scored
 * by their EigenTrust credibility (the same global trust score the profile and
 * feed use, via `useEigentrustMap`).
 *
 * Pipeline: `fetchTopicCertifications(topic)` gives the topic's certs and their
 * certifiers; we tally each certifier's cert count, then weight the roster by
 * EigenTrust. Ranked by trust score, cert count breaks ties.
 *
 * NOTE: EigenTrust is a GLOBAL score — it ranks the topic's contributors by
 * overall credibility, not by a topic-scoped reputation. A per-topic reputation
 * (à la `useDerivedReputation`, but computed per-account) would need a dedicated
 * aggregation service; this reuses the existing trust graph as-is.
 */
import { useEffect, useMemo, useState } from 'react'
import { fetchTopicCertifications } from '@/services/topicCertificationsService'
import { useEigentrustMap } from '@/hooks/useEigentrustMap'

export interface TopicLeaderboardEntry {
  address: string
  /** Distinct certs of this topic the account holds a position on. */
  certCount: number
  /** Global EigenTrust credibility (0 when unknown). */
  trustScore: number
}

export function useTopicLeaderboard(topicId: string | null): {
  entries: TopicLeaderboardEntry[]
  loading: boolean
  error: string | null
} {
  const [counts, setCounts] = useState<ReadonlyMap<string, number>>(new Map())
  const [loadingCerts, setLoadingCerts] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!topicId) {
      setCounts(new Map())
      return
    }
    let cancelled = false
    setLoadingCerts(true)
    setError(null)
    fetchTopicCertifications(topicId)
      .then((certs) => {
        if (cancelled) return
        const tally = new Map<string, number>()
        for (const cert of certs) {
          for (const certifier of cert.certifiers) {
            const key = certifier.toLowerCase()
            tally.set(key, (tally.get(key) ?? 0) + 1)
          }
        }
        setCounts(tally)
      })
      .catch((err) => {
        if (cancelled) return
        setError(
          err instanceof Error ? err.message : 'Failed to load topic ranking',
        )
      })
      .finally(() => {
        if (!cancelled) setLoadingCerts(false)
      })
    return () => {
      cancelled = true
    }
  }, [topicId])

  const addresses = useMemo(() => [...counts.keys()], [counts])
  const { byAddress, loading: trustLoading } = useEigentrustMap(addresses)

  const entries = useMemo<TopicLeaderboardEntry[]>(() => {
    return [...counts.entries()]
      .map(([address, certCount]) => ({
        address,
        certCount,
        trustScore: byAddress.get(address) ?? 0,
      }))
      .sort(
        (a, b) => b.trustScore - a.trustScore || b.certCount - a.certCount,
      )
  }, [counts, byAddress])

  return { entries, loading: loadingCerts || trustLoading, error }
}
