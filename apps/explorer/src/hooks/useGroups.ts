/**
 * useGroups — React Query consumer of the groups catalogue.
 *
 * Fetches every `is_member_of` triple (paginated) and aggregates into
 * a `GroupEntry[]` sorted by member count desc. Persister-friendly:
 * BigInt fields are coerced back from string on revive.
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  fetchAllGroups,
  fetchGroupDetail,
  type GroupEntry,
  type GroupMembership,
} from '@/services/groupsService'

const STALE_TIME_MS = 5 * 60 * 1000
const GC_TIME_MS = 60 * 60 * 1000

interface PersistedMembership extends Omit<GroupMembership, 'totalShares'> {
  totalShares: string
}
interface PersistedGroup extends Omit<
  GroupEntry,
  'totalShares' | 'memberships'
> {
  totalShares: string
  memberships: PersistedMembership[]
}

function toPersisted(entry: GroupEntry): PersistedGroup {
  return {
    ...entry,
    totalShares: entry.totalShares.toString(),
    memberships: entry.memberships.map((m) => ({
      ...m,
      totalShares: m.totalShares.toString(),
    })),
  }
}

function fromPersisted(entry: PersistedGroup): GroupEntry {
  return {
    ...entry,
    totalShares: safeBigInt(entry.totalShares),
    memberships: entry.memberships.map((m) => ({
      ...m,
      totalShares:
        typeof m.totalShares === 'bigint'
          ? m.totalShares
          : safeBigInt(m.totalShares),
    })),
  }
}

function safeBigInt(v: string | number | bigint | null | undefined): bigint {
  if (v == null) return 0n
  if (typeof v === 'bigint') return v
  try {
    return BigInt(v)
  } catch {
    return 0n
  }
}

/** All groups discovered on-chain. */
export function useGroups(): {
  groups: GroupEntry[]
  isLoading: boolean
  error: string | null
  refresh: () => void
} {
  const { data, isLoading, error, refetch } = useQuery<PersistedGroup[]>({
    queryKey: ['groups-list'],
    queryFn: async () => (await fetchAllGroups()).map(toPersisted),
    staleTime: STALE_TIME_MS,
    gcTime: GC_TIME_MS,
    refetchOnWindowFocus: false,
  })

  const groups = useMemo(() => (data ?? []).map(fromPersisted), [data])

  return {
    groups,
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
  const { data, isLoading, error } = useQuery<PersistedGroup | null>({
    queryKey: ['group-detail', termId],
    queryFn: async () => {
      if (!termId) return null
      const entry = await fetchGroupDetail(termId)
      return entry ? toPersisted(entry) : null
    },
    enabled,
    staleTime: STALE_TIME_MS,
    gcTime: GC_TIME_MS,
    refetchOnWindowFocus: false,
  })

  const group = useMemo(() => (data ? fromPersisted(data) : null), [data])

  return {
    group,
    isLoading: enabled && isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : String(error)
      : null,
  }
}

/** Convenience derivation — groups where any of the user's wallets has
 *  vouched (= holds a position) on at least one membership. */
export function useUserGroups(
  addresses: readonly string[] | undefined,
): GroupEntry[] {
  const { groups } = useGroups()
  return useMemo(() => {
    if (!addresses || addresses.length === 0) return []
    const wallets = new Set(addresses.map((a) => a.toLowerCase()))
    return groups.filter((g) =>
      g.memberships.some((m) => m.voucherWallets.some((w) => wallets.has(w))),
    )
  }, [groups, addresses])
}
