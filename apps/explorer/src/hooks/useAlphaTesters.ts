import { useQuery } from '@tanstack/react-query'
import { EventFetcher } from '@/services/eventFetcher'
import { REFRESH_INTERVAL } from '@/config'
import { aggregateEvents } from '@/services/alphaTestersService'
import type { AlphaTestersData } from '@/types'

const INITIAL_DATA: AlphaTestersData = {
  leaderboard: [],
  totals: { wallets: 0, tx: 0, intentions: 0, pioneers: 0, trustVolume: 0n },
}

// Module-level fetcher so repeated refetches reuse its internal pagination
// state rather than restarting from block zero every time.
let fetcherSingleton: EventFetcher | null = null
function getFetcher(): EventFetcher {
  if (!fetcherSingleton) fetcherSingleton = new EventFetcher()
  return fetcherSingleton
}

async function loadAlphaTesters(): Promise<AlphaTestersData> {
  const events = await getFetcher().fetch()
  return aggregateEvents(events)
}

export function useAlphaTesters() {
  const { data, isLoading, error, refetch } = useQuery<AlphaTestersData>({
    queryKey: ['alphaTesters'],
    queryFn: loadAlphaTesters,
    // Placeholder (not initialData): the first scan reads as loading, so the
    // table shows its skeleton instead of "No activity yet"
    placeholderData: INITIAL_DATA,
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: REFRESH_INTERVAL,
    // The fetcher resumes from its cached block cursor, so a failed scan is
    // cheap to retry — but cap RQ's automatic retries so a hard RPC outage
    // doesn't spin endlessly. The user can also retry manually from the UI.
    retry: 1,
    retryDelay: 3_000,
  })

  return {
    ...(data ?? INITIAL_DATA),
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : String(error)
      : null,
    refetch,
  }
}
