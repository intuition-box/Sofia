/**
 * useUserOnChainProfile — React Query consumer of the master profile
 * fetcher. All per-page panels (calendar, radar, topic scores, discovery
 * badges, top platforms, top claims) should derive from this single
 * snapshot so their numbers stay consistent.
 *
 * Cache is keyed by the sorted, joined linked-wallet set. React Query
 * dedupes across the 6+ panels that consume this — only one paginated
 * fetch fires per session/key.
 */

import { useQuery } from '@tanstack/react-query'
import {
  fetchUserOnChainProfile,
  type UserOnChainProfile,
} from '@/services/userOnChainProfileService'

const STALE_TIME_MS = 5 * 60 * 1000
const GC_TIME_MS = 60 * 60 * 1000

const EMPTY: UserOnChainProfile = {
  certs: [],
  topicContextsByTerm: new Map(),
}

interface Result {
  profile: UserOnChainProfile
  isLoading: boolean
  error: string | null
  refresh: () => void
}

/**
 * Persisted React Query serialises Maps to plain objects on reload, so
 * we cache the JSON-safe shape (`certs` + `topicContextsRecord`) and
 * rebuild the Map on read.
 */
interface PersistedProfile {
  certs: UserOnChainProfile['certs']
  topicContextsRecord: Record<string, string[]>
}

async function fetchPersisted(addresses: string[]): Promise<PersistedProfile> {
  const { certs, topicContextsByTerm } =
    await fetchUserOnChainProfile(addresses)
  const topicContextsRecord: Record<string, string[]> = {}
  for (const [k, v] of topicContextsByTerm) topicContextsRecord[k] = v
  return { certs, topicContextsRecord }
}

export function useUserOnChainProfile(
  addresses: readonly string[] | undefined,
): Result {
  const sorted = addresses ? [...addresses].sort() : []
  const enabled = sorted.length > 0
  const cacheKey = sorted.join(',')

  const { data, isLoading, error, refetch } = useQuery<PersistedProfile>({
    queryKey: ['user-onchain-profile', cacheKey],
    queryFn: () => fetchPersisted(sorted),
    enabled,
    staleTime: STALE_TIME_MS,
    gcTime: GC_TIME_MS,
    refetchOnWindowFocus: false,
  })

  if (!data) {
    return {
      profile: EMPTY,
      isLoading: enabled && isLoading,
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

  // BigInt is not JSON-serialisable, so the persister will have stripped
  // userShares back to a string. Defensively coerce when reviving.
  const certs = data.certs.map((c) => ({
    ...c,
    userShares:
      typeof c.userShares === 'bigint'
        ? c.userShares
        : safeBigInt(c.userShares as unknown as string | number),
  }))

  const topicContextsByTerm = new Map<string, string[]>(
    Object.entries(data.topicContextsRecord),
  )

  return {
    profile: { certs, topicContextsByTerm },
    isLoading: false,
    error: null,
    refresh: () => {
      refetch()
    },
  }
}

function safeBigInt(v: string | number | null | undefined): bigint {
  if (v == null) return 0n
  try {
    return BigInt(v)
  } catch {
    return 0n
  }
}
