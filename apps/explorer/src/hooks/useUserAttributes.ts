/**
 * useUserAttributes — React Query wrapper over userAttributesService.
 * Returns the user's on-chain endorsed skills and tools for an address.
 */
import { useQuery } from '@tanstack/react-query'
import {
  fetchUserAttributes,
  type UserAttribute,
} from '@/services/userAttributesService'

export function useUserAttributes(address: string | undefined): {
  skills: UserAttribute[]
  tools: UserAttribute[]
  loading: boolean
  error: string | null
} {
  const query = useQuery({
    queryKey: ['userAttributes', address?.toLowerCase()],
    queryFn: () => fetchUserAttributes(address as string),
    enabled: !!address,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return {
    skills: query.data?.skills ?? [],
    tools: query.data?.tools ?? [],
    loading: query.isLoading && !!address,
    error: query.error ? String(query.error) : null,
  }
}
