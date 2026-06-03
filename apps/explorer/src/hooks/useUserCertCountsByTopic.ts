/**
 * useUserCertCountsByTopic — `Map<topicSlug, count>` of every cert the
 * user owns, bucketed by its `in context of <topic>` nested triples,
 * plus separate counts for:
 *   - `general`    — taggable certs with NO topic context yet
 *   - `trusted`    — `trusts` certs (never topic-scoped)
 *   - `distrusted` — `distrust` certs (never topic-scoped)
 *
 * Trust / distrust are NOT taggable, so they can never carry an
 * `in context of` triple. Counting them inside `general` would inflate a
 * "No context" bucket that never drains; instead they get their own
 * circle slices. `general` therefore mirrors the `useUntaggedCerts`
 * scope (taggable labels only).
 *
 * Pure deriver over `useUserOnChainProfile` so these numbers stay in
 * sync with the calendar / radar / discovery counts.
 */
import { useMemo } from 'react'
import { useUserOnChainProfile } from '@/hooks/useUserOnChainProfile'

const EMPTY: ReadonlyMap<string, number> = new Map()

/** Predicate labels that can carry an `in context of <topic>` triple —
 *  same scope as `useUntaggedCerts`. Trust/distrust are excluded. */
const TAGGABLE_LABELS: ReadonlySet<string> = new Set([
  'visits for work',
  'visits for learning',
  'visits for fun',
  'visits for inspiration',
  'visits for buying',
  'visits for music',
])

export interface UserCertCounts {
  /** topicSlug → number of certs the user holds in that topic context. */
  byTopic: ReadonlyMap<string, number>
  /** Taggable certs the user holds with no `in context of` triple yet. */
  general: number
  /** `trusts` certs the user holds. */
  trusted: number
  /** `distrust` certs the user holds. */
  distrusted: number
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
      return { byTopic: EMPTY, general: 0, trusted: 0, distrusted: 0, total: 0 }
    }
    const byTopic = new Map<string, number>()
    let general = 0
    let trusted = 0
    let distrusted = 0
    for (const cert of profile.certs) {
      const label = cert.intention.trim().toLowerCase()
      // Trust/distrust are their own circle slices — never topic-scoped,
      // so handle them before the topic/no-context split.
      if (label === 'trusts') {
        trusted += 1
        continue
      }
      if (label === 'distrust') {
        distrusted += 1
        continue
      }
      if (cert.topicSlugs.length === 0) {
        if (TAGGABLE_LABELS.has(label)) general += 1
        continue
      }
      for (const slug of cert.topicSlugs) {
        byTopic.set(slug, (byTopic.get(slug) ?? 0) + 1)
      }
    }
    return {
      byTopic: byTopic.size > 0 ? byTopic : EMPTY,
      general,
      trusted,
      distrusted,
      total: profile.certs.length,
    }
  }, [profile])
}
