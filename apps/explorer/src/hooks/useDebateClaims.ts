import { useQuery } from '@tanstack/react-query'
import { fetchDebateClaims, type DebateClaim } from '../services/debateService'

export function useDebateClaims() {
  const { data, isLoading, error, refetch } = useQuery<DebateClaim[]>({
    queryKey: ['debateClaims'],
    queryFn: fetchDebateClaims,
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return {
    claims: data ?? [],
    loading: isLoading && !data,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    refresh: () => { refetch() },
  }
}
