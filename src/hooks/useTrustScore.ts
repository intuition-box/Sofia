import { useQuery } from '@tanstack/react-query'
import { fetchCompositeScore } from '@/services/mcpTrustService'
import type { CompositeScore } from '@/services/mcpTrustService'

export function useTrustScore(walletAddress: string | undefined) {
  const { data, isLoading, error } = useQuery<CompositeScore | null>({
    queryKey: ['trustScore', walletAddress],
    queryFn: () => fetchCompositeScore(walletAddress!),
    enabled: !!walletAddress,
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  return {
    score: data?.compositeScore ?? null,
    breakdown: data?.breakdown ?? null,
    confidence: data?.confidence ?? 0,
    loading: isLoading,
    error,
  }
}
