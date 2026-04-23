import { useQuery } from '@tanstack/react-query'
import { fetchTrustCircle } from '../services/trustCircleService'
import type { TrustCircleAccount } from '../services/trustCircleService'

export function useTrustCircle(addresses: string[] | undefined) {
  const normalized = addresses ? [...addresses].sort() : []
  const cacheKey = normalized.join(',') || undefined
  const enabled = !!addresses && addresses.length > 0

  const { data, isLoading, error } = useQuery<TrustCircleAccount[]>({
    queryKey: cacheKey ? ['trustCircle', cacheKey] : ['trustCircle', undefined],
    queryFn: () => fetchTrustCircle(addresses!),
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return {
    accounts: data ?? [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
  }
}
