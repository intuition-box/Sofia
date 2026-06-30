/**
 * useVerifiedSocials — bot-verified social links for one or many wallets,
 * read from the Intuition graph. Batches every address into a single query
 * so a members list costs one request, not N.
 *
 * Returns a plain Record (NOT a Map) so the React Query cache stays
 * JSON-serialisable across the persisted client. Look up a wallet with
 * `socials[address.toLowerCase()]`.
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  fetchVerifiedSocials,
  type SocialsByWallet,
} from '@/services/socialsService'

const EMPTY: SocialsByWallet = {}

export function useVerifiedSocials(wallets: string[] | string | undefined) {
  const list = useMemo(() => {
    const arr =
      wallets == null ? [] : Array.isArray(wallets) ? wallets : [wallets]
    // De-dupe + stable order so the cache key is deterministic.
    return [...new Set(arr.filter(Boolean))].sort()
  }, [wallets])

  const cacheKey = list.join(',')

  const { data, isLoading, error } = useQuery<SocialsByWallet>({
    queryKey: ['verifiedSocials', cacheKey],
    queryFn: () => fetchVerifiedSocials(list),
    enabled: list.length > 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return {
    socials: data ?? EMPTY,
    loading: isLoading,
    error: error ? (error as Error).message : null,
  }
}
