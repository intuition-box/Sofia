/**
 * useUserCertCountsByTopic — `Map<topicSlug, count>` of every cert the
 * user owns, bucketed by its `in context of <topic>` nested triples,
 * plus a separate count of certs the user owns that have NO topic
 * context (the "general" bucket).
 *
 * Pure deriver over `useUserOnChainProfile` so these numbers stay in
 * sync with the calendar / radar / discovery counts.
 */
import { useMemo } from 'react'
import { useUserOnChainProfile } from '@/hooks/useUserOnChainProfile'

const EMPTY: ReadonlyMap<string, number> = new Map()

export interface UserCertCounts {
  /** topicSlug → number of certs the user holds in that topic context. */
  byTopic: ReadonlyMap<string, number>
  /** Certs the user holds that have no `in context of` nested triple. */
  general: number
  /** Total certs the user holds (with or without topic context). */
  total: number
}

export function useUserCertCountsByTopic(
  addresses: readonly string[] | undefined,
): ReadonlyMap<string, number> {
  return useUserCertCounts(addresses).byTopic
}

export function useUserCertCounts(
  addresses: readonly string[] | undefined,
): UserCertCounts {
  const { profile } = useUserOnChainProfile(addresses)

  return useMemo(() => {
    if (profile.certs.length === 0) {
      return { byTopic: EMPTY, general: 0, total: 0 }
    }
    const byTopic = new Map<string, number>()
    let general = 0
    for (const cert of profile.certs) {
      if (cert.topicSlugs.length === 0) {
        general += 1
        continue
      }
      for (const slug of cert.topicSlugs) {
        byTopic.set(slug, (byTopic.get(slug) ?? 0) + 1)
      }
    }
    return {
      byTopic: byTopic.size > 0 ? byTopic : EMPTY,
      general,
      total: profile.certs.length,
    }
  }, [profile])
}
