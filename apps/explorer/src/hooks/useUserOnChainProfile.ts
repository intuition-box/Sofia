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

import { useQuery, type QueryClient } from '@tanstack/react-query'
import {
  fetchUserOnChainProfile,
  type UserOnChainProfile,
} from '@/services/userOnChainProfileService'

const STALE_TIME_MS = 5 * 60 * 1000
// 24h to match the persister's maxAge (providers.tsx) — the profile is the
// head of the reputation chain, so it must survive the full persist window
// (not GC at 1h) for backers to rehydrate instantly on reload/navigation.
const GC_TIME_MS = 24 * 60 * 60 * 1000

const EMPTY: UserOnChainProfile = {
  certs: [],
  topicContextsByTerm: new Map(),
  contextAdditions: [],
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
  contextAdditions: UserOnChainProfile['contextAdditions']
}

async function fetchPersisted(addresses: string[]): Promise<PersistedProfile> {
  const { certs, topicContextsByTerm, contextAdditions } =
    await fetchUserOnChainProfile(addresses)
  const topicContextsRecord: Record<string, string[]> = {}
  for (const [k, v] of topicContextsByTerm) topicContextsRecord[k] = v
  return { certs, topicContextsRecord, contextAdditions }
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
    profile: {
      certs,
      topicContextsByTerm,
      contextAdditions: data.contextAdditions ?? [],
    },
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

/**
 * Optimistically drop redeemed certs from the profile cache. A redeem
 * empties the user's vault, so the cert should vanish from the Context
 * Manager the instant the tx confirms — waiting on an `invalidateQueries`
 * refetch races the indexer (which still reports the position for a few
 * seconds post-tx) and re-persists the stale row, so it reappears on
 * reload. Removing the row locally is the race-free source of truth; the
 * next natural refetch (staleTime) reconciles once the indexer catches up.
 *
 * Writes into every wallet-set variant of the key so linked-wallet
 * profiles stay consistent.
 */
export function removeCertsFromProfileCache(
  qc: QueryClient,
  termIds: readonly string[],
): void {
  if (termIds.length === 0) return
  const drop = new Set(termIds.map((t) => t.toLowerCase()))
  qc.setQueriesData<PersistedProfile>(
    { queryKey: ['user-onchain-profile'] },
    (old) =>
      old
        ? {
            ...old,
            certs: old.certs.filter((c) => !drop.has(c.termId.toLowerCase())),
          }
        : old,
  )
}
