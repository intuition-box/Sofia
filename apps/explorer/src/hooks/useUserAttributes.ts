/**
 * useUserAttributes — React Query wrapper over userAttributesService.
 * Returns the user's on-chain endorsed skills and tools for an address.
 */
import { useQuery } from '@tanstack/react-query'
import {
  fetchUserAttributes,
  type UserAttribute,
} from '@/services/userAttributesService'

export function useUserAttributes(
  address: string | string[] | undefined,
  viewerAddresses: string[] = [],
): {
  skills: UserAttribute[]
  tools: UserAttribute[]
  loading: boolean
  error: string | null
} {
  const addresses =
    address == null ? [] : Array.isArray(address) ? address : [address]
  // Stable, order-independent cache key across the linked wallet set.
  const key = addresses
    .map((a) => a.toLowerCase())
    .sort()
    .join(',')
  // The viewer set affects the `viewerEndorsed` flag, so it's part of the key.
  const viewerKey = viewerAddresses
    .map((a) => a.toLowerCase())
    .sort()
    .join(',')

  const query = useQuery({
    queryKey: ['userAttributes', key, viewerKey],
    queryFn: () => fetchUserAttributes(addresses, viewerAddresses),
    enabled: addresses.length > 0,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return {
    skills: query.data?.skills ?? [],
    tools: query.data?.tools ?? [],
    loading: query.isLoading && addresses.length > 0,
    error: query.error ? String(query.error) : null,
  }
}
