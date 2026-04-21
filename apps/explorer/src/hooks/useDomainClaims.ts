import { useQuery } from '@tanstack/react-query'
import { fetchDomainClaims } from '../services/domainDebateService'
import type { DebateClaim } from '../services/debateService'

export function useDomainClaims(topicId: string | undefined) {
  const { data, isLoading, error } = useQuery<DebateClaim[]>({
    queryKey: ['domainClaims', topicId],
    queryFn: () => fetchDomainClaims(topicId!),
    enabled: !!topicId,
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return {
    claims: data ?? [],
    loading: isLoading && !data,
    error: error ? (error as Error).message : null,
  }
}
