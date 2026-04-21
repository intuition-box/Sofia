/**
 * Hook — fetches real platform metrics via sofia-mastra signalFetcherWorkflow.
 * Returns raw metrics per platform, used by the scoring engine.
 */

import { useQuery } from '@tanstack/react-query'
import { usePlatformConnections } from '@/hooks/usePlatformConnections'
import { fetchAllSignals } from '@/services/signalService'
import type { SignalResult } from '@/types/signals'

interface UseSignalsResult {
  signals: Record<string, SignalResult>
  isLoading: boolean
  isFetching: boolean
  error: string | null
  refetch: () => void
}

export function useSignals(walletAddress: string | undefined): UseSignalsResult {
  const { connections } = usePlatformConnections()

  const connectedPlatforms = [...connections.values()]
    .filter((c) => c.status === 'connected')
    .map((c) => c.platformId)

  const stableKey = connectedPlatforms.slice().sort().join(',')

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['signals', walletAddress, stableKey],
    queryFn: () => fetchAllSignals(connectedPlatforms, walletAddress!),
    enabled: !!walletAddress && connectedPlatforms.length > 0,
    // Signals come from the mastra workflow, not the Hasura WS — they
    // change on the order of hours. Trust the persister between sessions
    // and only refetch on explicit user action.
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return {
    signals: data ?? {},
    isLoading,
    isFetching,
    error: error ? String(error) : null,
    refetch,
  }
}
