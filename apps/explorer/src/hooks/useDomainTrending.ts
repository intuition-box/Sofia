import { useQuery } from '@tanstack/react-query'
import { fetchTrendingByDomain } from '../services/domainTrendingService'
import type { TrendingPlatform } from '@/types'

export function useDomainTrending(topicId: string | undefined) {
  const { data, isLoading, error } = useQuery<TrendingPlatform[]>({
    queryKey: ['domainTrending', topicId],
    queryFn: () => fetchTrendingByDomain(topicId!),
    enabled: !!topicId,
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return {
    items: data ?? [],
    loading: isLoading && !data,
    error: error ? (error as Error).message : null,
  }
}
