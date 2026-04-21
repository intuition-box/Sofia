/**
 * useUserProfile — reads the user's profile from the push-based cache.
 *
 * Two parallel React Query entries compose the final shape:
 *   1. ['user-profile-derived', wallet] — positions-derived fields, fed by
 *      the WS subscription. Seeded once via fetchUserProfile so reloads are
 *      instant even before the first WS delta.
 *   2. ['user-signals-count', wallet] — signalsCount aggregate, pulled
 *      separately because Hasura aggregates aren't streamed over WS.
 *
 * Both have staleTime:Infinity + refetchOnMount:false — the persister
 * holds last known values across reloads; the WS updates the first key
 * live; the second is invalidated manually after actions that could
 * change it.
 */

import { useQuery } from '@tanstack/react-query'
import { fetchUserProfile, fetchSignalsCount } from '../services/profileService'
import type { UserProfileData } from '../services/profileService'
import { realtimeKeys } from '../lib/realtime/derivations'

interface UseUserProfileResult {
  profile: UserProfileData | null
  isLoading: boolean
  error: string | null
  refresh: () => void
}

async function seedProfileDerived(walletAddress: string) {
  const full = await fetchUserProfile(walletAddress)
  // Drop totalCertifications — that's owned by the signalsCount query so
  // the two caches stay independent. The WS-fed derivation doesn't populate
  // it either.
  const { totalCertifications, ...derived } = full
  void totalCertifications
  return derived
}

export function useUserProfile(walletAddress: string | undefined): UseUserProfileResult {
  const address = walletAddress?.toLowerCase()

  const derivedQ = useQuery({
    queryKey: address ? realtimeKeys.userProfileDerived(address) : ['user-profile-derived', undefined],
    queryFn: () => seedProfileDerived(walletAddress!),
    enabled: !!walletAddress,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })

  const signalsQ = useQuery({
    queryKey: address ? ['user-signals-count', address] : ['user-signals-count', undefined],
    queryFn: () => fetchSignalsCount(walletAddress!),
    enabled: !!walletAddress,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const isLoading = derivedQ.isLoading || signalsQ.isLoading
  const err = derivedQ.error ?? signalsQ.error
  const profile: UserProfileData | null = derivedQ.data
    ? {
        positions: derivedQ.data.positions,
        totalPositions: derivedQ.data.totalPositions,
        totalAtomPositions: derivedQ.data.totalAtomPositions,
        totalStaked: derivedQ.data.totalStaked,
        verifiedPlatforms: derivedQ.data.verifiedPlatforms,
        totalCertifications: signalsQ.data ?? 0,
      }
    : null

  return {
    profile,
    isLoading,
    error: err ? (err instanceof Error ? err.message : String(err)) : null,
    refresh: () => {
      derivedQ.refetch()
      signalsQ.refetch()
    },
  }
}
