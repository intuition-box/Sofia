/**
 * useUserCertCountsByTopic — `Map<topicId, count>` of the user's certs
 * tallied by their `in context of <topic>` nested triples.
 *
 * Sources from `useUserActivity`. Lets `useReputationScores` add a real
 * cert-driven contribution to each topic score so users without OAuth
 * platforms still get a non-zero score from their on-chain activity.
 */
import { useMemo } from 'react'
import { useUserActivity } from '@/hooks/useUserActivity'
import { countCertsByTopic } from '@/services/reputationScoreService'

const EMPTY: ReadonlyMap<string, number> = new Map()

export function useUserCertCountsByTopic(
  addresses: readonly string[] | undefined,
): ReadonlyMap<string, number> {
  const { items } = useUserActivity(
    addresses && addresses.length > 0 ? [...addresses] : undefined,
  )
  return useMemo(() => {
    if (items.length === 0) return EMPTY
    return countCertsByTopic(items)
  }, [items])
}
