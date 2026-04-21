import { useQuery } from '@tanstack/react-query'
import { fetchEigentrustRanking } from '@/services/mcpTrustService'
import type { EigentrustEntry } from '@/services/mcpTrustService'

export function useTrustLeaderboard() {
  const { data, isLoading, error } = useQuery<EigentrustEntry[]>({
    queryKey: ['trustLeaderboard'],
    queryFn: () => fetchEigentrustRanking(50),
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  return {
    rankings: data ?? [],
    loading: isLoading && !data,
    error: error ? String(error) : null,
  }
}
