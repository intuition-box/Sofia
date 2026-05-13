/**
 * useGroups — React Query consumer of the groups catalogue.
 *
 * Fetches every `is_member_of` triple (paginated) and aggregates into
 * a `GroupEntry[]` sorted by member count desc. No vouch / shares
 * weighting today — anti-fake gating lands later via an on-chain
 * process.
 */

import { useQuery } from '@tanstack/react-query'
import {
  fetchAllGroups,
  fetchGroupDetail,
  type GroupEntry,
} from '@/services/groupsService'

const STALE_TIME_MS = 5 * 60 * 1000
const GC_TIME_MS = 60 * 60 * 1000

/** All groups discovered on-chain. */
export function useGroups(): {
  groups: GroupEntry[]
  isLoading: boolean
  error: string | null
  refresh: () => void
} {
  const { data, isLoading, error, refetch } = useQuery<GroupEntry[]>({
    queryKey: ['groups-list'],
    queryFn: fetchAllGroups,
    staleTime: STALE_TIME_MS,
    gcTime: GC_TIME_MS,
    refetchOnWindowFocus: false,
  })

  return {
    groups: data ?? [],
    isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : String(error)
      : null,
    refresh: () => {
      refetch()
    },
  }
}

/** Single-group detail with the full membership roster. */
export function useGroupDetail(termId: string | undefined): {
  group: GroupEntry | null
  isLoading: boolean
  error: string | null
} {
  const enabled = Boolean(termId)
  const { data, isLoading, error } = useQuery<GroupEntry | null>({
    queryKey: ['group-detail', termId],
    queryFn: async () => {
      if (!termId) return null
      return fetchGroupDetail(termId)
    },
    enabled,
    staleTime: STALE_TIME_MS,
    gcTime: GC_TIME_MS,
    refetchOnWindowFocus: false,
  })

  return {
    group: data ?? null,
    isLoading: enabled && isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : String(error)
      : null,
  }
}
