/**
 * useUserCertCountsByTopic — `Map<topicSlug, count>` of every cert the
 * user owns, bucketed by its `in context of <topic>` nested triples.
 *
 * Pure deriver over `useUserOnChainProfile` so this number stays in
 * sync with the calendar / radar / discovery counts.
 */
import { useMemo } from 'react'
import { useUserOnChainProfile } from '@/hooks/useUserOnChainProfile'

const EMPTY: ReadonlyMap<string, number> = new Map()

export function useUserCertCountsByTopic(
  addresses: readonly string[] | undefined,
): ReadonlyMap<string, number> {
  const { profile } = useUserOnChainProfile(addresses)

  return useMemo(() => {
    if (profile.certs.length === 0) return EMPTY
    const counts = new Map<string, number>()
    for (const cert of profile.certs) {
      for (const slug of cert.topicSlugs) {
        counts.set(slug, (counts.get(slug) ?? 0) + 1)
      }
    }
    return counts.size > 0 ? counts : EMPTY
  }, [profile])
}
