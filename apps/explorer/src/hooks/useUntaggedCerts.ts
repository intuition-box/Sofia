/**
 * useUntaggedCerts — derives the user's certifications that have no
 * `in context of <topic>` nested triple yet.
 *
 * Reuses the master `useUserOnChainProfile` cache shared with the rest
 * of the profile page, so opening the Context Manager never triggers
 * an extra fetch. The returned list is sorted by recency (most
 * recently certified first) so users see their latest URLs first when
 * they walk through the bulk-tagging UI.
 */

import { useMemo } from 'react'
import { useUserOnChainProfile } from './useUserOnChainProfile'
import type { UserCert } from '@/services/userOnChainProfileService'

/** Predicate labels that count as a "tagable" certification — trust /
 *  distrust signals aren't URL claims, so we exclude them from the
 *  bulk-tag flow. Mirrors the perspective pipeline's scope. */
const TAGGABLE_LABELS: ReadonlySet<string> = new Set([
  'visits for work',
  'visits for learning',
  'visits for fun',
  'visits for inspiration',
  'visits for buying',
  'visits for music',
])

export interface UseUntaggedCertsResult {
  /** Certs the user holds with `topicSlugs.length === 0`, sorted by
   *  recency desc. Anything trust/distrust-flavoured is filtered out. */
  certs: UserCert[]
  /** True while the underlying profile query is still loading. */
  loading: boolean
  /** Total tagable certs the user holds (with or without context).
   *  Useful for the "X of Y tagged" progress copy. */
  totalTagable: number
}

export function useUntaggedCerts(
  addresses: readonly string[] | undefined,
): UseUntaggedCertsResult {
  const { profile, isLoading } = useUserOnChainProfile(addresses)

  return useMemo(() => {
    const tagable = profile.certs.filter((c) =>
      TAGGABLE_LABELS.has(c.intention.trim().toLowerCase()),
    )
    const untagged = tagable
      .filter((c) => c.topicSlugs.length === 0)
      .slice()
      .sort((a, b) => (b.certifiedAt > a.certifiedAt ? 1 : -1))
    return {
      certs: untagged,
      loading: isLoading,
      totalTagable: tagable.length,
    }
  }, [profile.certs, isLoading])
}
