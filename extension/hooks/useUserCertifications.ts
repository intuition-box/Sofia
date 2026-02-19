/**
 * useUserCertifications Hook
 * Singleton store pattern - accesses ALL on-chain certifications for the current user
 *
 * Business logic delegated to UserCertificationsService.
 * No Provider needed - uses useSyncExternalStore with service singleton.
 */

import { useEffect, useCallback, useRef, useSyncExternalStore } from "react"
import {
  userCertificationsService,
  UserCertificationsServiceClass
} from "../lib/services/UserCertificationsService"
import type {
  TripleDetail,
  CertificationEntry
} from "../lib/services/UserCertificationsService"
import type { IntentionPurpose } from "../types/discovery"

// Re-export types so existing consumers don't break
export type { TripleDetail, CertificationEntry, IntentionPurpose }

export interface UserCertificationsState {
  certifications: Map<string, CertificationEntry>
  loading: boolean
  error: string | null
  lastFetchedAt: number | null
  refetch: () => Promise<void>
}

/**
 * Hook to access the global certifications cache.
 * Automatically fetches when wallet address changes.
 */
export function useUserCertifications(
  walletAddress: string | null
): UserCertificationsState {
  const state = useSyncExternalStore(
    userCertificationsService.subscribe,
    userCertificationsService.getSnapshot
  )

  // Fetch when wallet prop changes (don't depend on store state to avoid feedback loop)
  const storeWalletRef = useRef(state.walletAddress)
  storeWalletRef.current = state.walletAddress

  useEffect(() => {
    if (walletAddress && walletAddress !== storeWalletRef.current) {
      userCertificationsService.fetchCertifications(walletAddress)
    } else if (!walletAddress && storeWalletRef.current) {
      userCertificationsService.clearCache()
    }
  }, [walletAddress])

  const refetch = useCallback(async () => {
    if (walletAddress) {
      await userCertificationsService.fetchCertifications(walletAddress)
    }
  }, [walletAddress])

  return {
    certifications: state.certifications,
    loading: state.loading,
    error: state.error,
    lastFetchedAt: state.lastFetchedAt,
    refetch
  }
}

/**
 * Helper to check if a URL is certified.
 * Returns the certification entry if certified, null otherwise.
 */
export const getCertificationForUrl =
  UserCertificationsServiceClass.getCertificationForUrl

export default useUserCertifications
