/**
 * useUserProfile — reads the user's profile, unioned across linked wallets.
 *
 * Two parallel React Query entries compose the final shape:
 *   1. ['user-profile-derived', walletsKey] — positions-derived fields, fed
 *      by the WS subscription. Seeded once via fetchUserProfile so reloads
 *      are instant even before the first WS delta.
 *   2. ['user-signals-count', walletsKey] — signalsCount aggregate, pulled
 *      separately because Hasura aggregates aren't streamed over WS.
 *
 * Callers pass an array of addresses. For viewing someone else's profile,
 * pass `[otherUser.address]`. For viewing the current user, pass
 * `useLinkedWallets().addresses`.
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

async function seedProfileDerived(addresses: string[]) {
  const full = await fetchUserProfile(addresses)
  // Drop totalCertifications — that's owned by the signalsCount query so
  // the two caches stay independent. The WS-fed derivation doesn't populate
  // it either.
  const { totalCertifications, ...derived } = full
  void totalCertifications
  return derived
}

export function useUserProfile(addresses: string[] | undefined): UseUserProfileResult {
  const normalized = addresses ? [...addresses].sort() : []
  const walletsKey = normalized.join(',') || undefined
  const enabled = !!addresses && addresses.length > 0

  const derivedQ = useQuery({
    queryKey: walletsKey
      ? realtimeKeys.userProfileDerived(walletsKey)
      : ['user-profile-derived', undefined],
    queryFn: () => seedProfileDerived(addresses!),
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })

  const signalsQ = useQuery({
    queryKey: walletsKey ? ['user-signals-count', walletsKey] : ['user-signals-count', undefined],
    queryFn: () => fetchSignalsCount(addresses!),
    enabled,
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
