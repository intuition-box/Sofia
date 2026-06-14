/**
 * useTopicLeaderboard — global ranking of accounts by how many of a topic's
 * certifications they hold a position on. Derived from
 * `fetchTopicCertifications` (no dedicated query): we tally each certifier
 * across every cert tied to the topic and rank by that count.
 *
 * This is a contribution/activity ranking, not a per-topic trust score —
 * the latter would need a new aggregated GraphQL query.
 */
import { useEffect, useState } from 'react'
import { fetchTopicCertifications } from '@/services/topicCertificationsService'

export interface TopicLeaderboardEntry {
  address: string
  /** Distinct certs of this topic the account holds a position on. */
  certCount: number
}

export function useTopicLeaderboard(topicId: string | null): {
  entries: TopicLeaderboardEntry[]
  loading: boolean
  error: string | null
} {
  const [entries, setEntries] = useState<TopicLeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!topicId) {
      setEntries([])
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchTopicCertifications(topicId)
      .then((certs) => {
        if (cancelled) return
        const counts = new Map<string, number>()
        for (const cert of certs) {
          for (const certifier of cert.certifiers) {
            const key = certifier.toLowerCase()
            counts.set(key, (counts.get(key) ?? 0) + 1)
          }
        }
        const ranked = [...counts.entries()]
          .map(([address, certCount]) => ({ address, certCount }))
          .sort((a, b) => b.certCount - a.certCount)
        setEntries(ranked)
      })
      .catch((err) => {
        if (cancelled) return
        setError(
          err instanceof Error ? err.message : 'Failed to load topic ranking',
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [topicId])

  return { entries, loading, error }
}
