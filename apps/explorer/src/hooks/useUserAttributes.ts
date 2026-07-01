/**
 * useUserAttributes — React Query wrapper over userAttributesService.
 * Returns the user's on-chain endorsed skills and tools for an address.
 */
import { useQuery, type QueryClient } from '@tanstack/react-query'
import {
  fetchUserAttributes,
  type UserAttribute,
  type UserAttributes,
} from '@/services/userAttributesService'

export function useUserAttributes(
  address: string | string[] | undefined,
  viewerAddresses: string[] = [],
): {
  skills: UserAttribute[]
  tools: UserAttribute[]
  loading: boolean
  error: string | null
} {
  const addresses =
    address == null ? [] : Array.isArray(address) ? address : [address]
  // Stable, order-independent cache key across the linked wallet set.
  const key = addresses
    .map((a) => a.toLowerCase())
    .sort()
    .join(',')
  // The viewer set affects the `viewerEndorsed` flag, so it's part of the key.
  const viewerKey = viewerAddresses
    .map((a) => a.toLowerCase())
    .sort()
    .join(',')

  const query = useQuery({
    queryKey: ['userAttributes', key, viewerKey],
    queryFn: () => fetchUserAttributes(addresses, viewerAddresses),
    enabled: addresses.length > 0,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return {
    skills: query.data?.skills ?? [],
    tools: query.data?.tools ?? [],
    loading: query.isLoading && addresses.length > 0,
    error: query.error ? String(query.error) : null,
  }
}

/**
 * Optimistically drop redeemed skills/tools from the attributes cache. A
 * redeem empties the declaration vault, so the chip should vanish the
 * instant the tx confirms — refetching races the indexer (still reporting
 * the position for a few seconds) and would re-add the chip. staleTime
 * reconciles on the next natural refetch once the indexer catches up.
 * Non-matching termIds are a no-op, so this is safe to call for any redeem.
 */
export function removeAttributesFromCache(
  qc: QueryClient,
  termIds: readonly string[],
): void {
  if (termIds.length === 0) return
  const drop = new Set(termIds.map((t) => t.toLowerCase()))
  qc.setQueriesData<UserAttributes>({ queryKey: ['userAttributes'] }, (old) =>
    old
      ? {
          skills: old.skills.filter((s) => !drop.has(s.termId.toLowerCase())),
          tools: old.tools.filter((t) => !drop.has(t.termId.toLowerCase())),
        }
      : old,
  )
}

/**
 * Optimistically insert just-declared skills/tools into the profile owner's
 * attributes cache so the chip appears the instant the create tx confirms —
 * without waiting on the indexer (which lags a few seconds, and longer to
 * resolve a brand-new atom's Thing metadata). The scheduled refetch reconciles
 * the real termId/endorserCount once indexed; dedupe-by-id prevents doubles.
 *
 * Scoped to cache entries whose address key includes `ownerAddress` so a
 * visited profile's cache is never polluted with the current user's additions.
 */
export function addAttributesToCache(
  qc: QueryClient,
  ownerAddress: string,
  attrs: readonly UserAttribute[],
): void {
  if (!attrs.length || !ownerAddress) return
  const owner = ownerAddress.toLowerCase()
  const skillsAdd = attrs.filter((a) => a.category === 'skill')
  const toolsAdd = attrs.filter((a) => a.category === 'tool')
  const merge = (list: UserAttribute[], add: UserAttribute[]) => {
    const have = new Set(list.map((x) => x.id))
    const fresh = add.filter((a) => !have.has(a.id))
    return fresh.length ? [...fresh, ...list] : list
  }
  for (const q of qc
    .getQueryCache()
    .findAll({ queryKey: ['userAttributes'] })) {
    // key shape: ['userAttributes', addrKey, viewerKey]; addrKey is the sorted,
    // lowercased, comma-joined address set from the hook.
    const addrKey = String(q.queryKey[1] ?? '')
    if (!addrKey.split(',').includes(owner)) continue
    qc.setQueryData<UserAttributes>(q.queryKey, (old) =>
      old
        ? {
            skills: merge(old.skills, skillsAdd),
            tools: merge(old.tools, toolsAdd),
          }
        : old,
    )
  }
}
