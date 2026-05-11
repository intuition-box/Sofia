/**
 * useCircle — single source of truth that resolves a routing id into
 * the unified `CircleData` view-model.
 *
 * Both `'trust'` and any on-chain group term_id flow through the same
 * surface. The orchestration stays declarative: we always call every
 * underlying hook (rules-of-hooks safe) but flip their `enabled` flag
 * so only the relevant query runs. Group resolution piggybacks on the
 * shared `useGroups()` cache — clicking through from /circles never
 * re-fetches, and a direct landing pays the same paginated cost the
 * list page would have paid anyway.
 */
import { useMemo } from 'react'
import { useLinkedWallets } from './useLinkedWallets'
import { useTrustCircle } from './useTrustCircle'
import { useGroups } from './useGroups'
import { useGroupTopics } from './useGroupTopics'
import { buildTrustCircle, buildGroupCircle } from '@/lib/circleBuilders'
import type { CircleData } from '@/types/circle'

const TRUST_CIRCLE_ID = 'trust'

export interface UseCircleResult {
  circle: CircleData | null
  /** True while the underlying data needed to build `circle` is still
   *  loading. Topics are intentionally excluded — they swap colours
   *  in-place once they arrive, never blocking the hero. */
  isLoading: boolean
  /** True when the id refers to a group that does not exist in the
   *  current `useGroups()` snapshot. Distinct from `isLoading` so the
   *  page can render a real "not found" instead of a stuck spinner. */
  notFound: boolean
  error: string | null
}

export function useCircle(id: string | undefined): UseCircleResult {
  const isTrust = id === TRUST_CIRCLE_ID
  const groupTermId = !isTrust && id ? id : undefined

  const { addresses } = useLinkedWallets()

  // Trust path — only enabled when the id matches. `useTrustCircle`
  // already returns an empty array + `loading: false` when its input
  // is undefined, so the hook is safe to call unconditionally.
  const { accounts: trustMembers, loading: trustLoading } = useTrustCircle(
    isTrust ? addresses : undefined,
  )

  // Group path — shares its cache with the /circles list page. Calling
  // it here costs 0 fetches when the cache is warm. We never call the
  // detail-only fetcher: the list query already brings memberships.
  const { groups, isLoading: groupsLoading, error: groupsError } = useGroups()

  // Topic colour — non-blocking. `enabled` is false on the trust path
  // and on any id that doesn't look like a group yet (no `groupTermId`).
  const { topics: groupTopics } = useGroupTopics(groupTermId)

  const circle = useMemo<CircleData | null>(() => {
    if (!id) return null
    if (isTrust) {
      return buildTrustCircle(addresses, trustMembers)
    }
    const group = groups.find((g) => g.termId === groupTermId)
    if (!group) return null
    return buildGroupCircle(group, addresses, groupTopics)
  }, [
    id,
    isTrust,
    addresses,
    trustMembers,
    groups,
    groupTermId,
    groupTopics,
  ])

  // Pure resolution states — derived, never set.
  const isLoading = isTrust ? trustLoading : groupsLoading
  const notFound =
    !isTrust &&
    !groupsLoading &&
    Boolean(groupTermId) &&
    circle === null

  return {
    circle,
    isLoading,
    notFound,
    error: groupsError ?? null,
  }
}
