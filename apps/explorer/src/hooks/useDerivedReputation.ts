/**
 * useDerivedReputation — orchestrates the reputation calc end to end.
 *
 * Chains: the user's on-chain certs → ordered stakers per claim
 * (useClaimSupporters) → credibility of the followers (useEigentrustMap) →
 * `computeDerivedReputation`. Returns topic → score for both the support side
 * (positive reputation) and the oppose mirror. See docs/reputation-curation.md.
 */
import { useMemo } from 'react'
import { useUserOnChainProfile } from '@/hooks/useUserOnChainProfile'
import { useClaimSupporters } from '@/hooks/useClaimSupporters'
import { useEigentrustMap } from '@/hooks/useEigentrustMap'
import {
  computeDerivedReputation,
  collectFollowerAddresses,
  type ReputationCert,
} from '@/services/derivedReputationService'

export function useDerivedReputation(addresses: readonly string[]) {
  const accounts = useMemo(
    () => new Set(addresses.map((a) => a.toLowerCase())),
    [addresses],
  )

  const { profile, isLoading: profileLoading } = useUserOnChainProfile(
    addresses.length > 0 ? [...addresses] : undefined,
  )

  const certs = useMemo<ReputationCert[]>(
    () =>
      profile.certs.map((c) => ({
        termId: c.termId,
        certifiedAt: c.certifiedAt,
        topicSlugs: c.topicSlugs,
      })),
    [profile.certs],
  )

  const claimIds = useMemo(() => certs.map((c) => c.termId), [certs])
  const { byClaim, loading: supportersLoading } = useClaimSupporters(claimIds)

  // Credibility is only needed for the accounts that followed the user.
  const followerAddresses = useMemo(
    () =>
      collectFollowerAddresses({ accounts, certs, supportersByClaim: byClaim }),
    [accounts, certs, byClaim],
  )
  const { byAddress, loading: trustLoading } = useEigentrustMap(followerAddresses)

  const scoreByTopic = useMemo(
    () =>
      computeDerivedReputation({
        accounts,
        certs,
        supportersByClaim: byClaim,
        credibility: byAddress,
        side: 'support',
      }),
    [accounts, certs, byClaim, byAddress],
  )

  const opposeByTopic = useMemo(
    () =>
      computeDerivedReputation({
        accounts,
        certs,
        supportersByClaim: byClaim,
        credibility: byAddress,
        side: 'oppose',
      }),
    [accounts, certs, byClaim, byAddress],
  )

  return {
    /** topic → positive reputation (support side). */
    scoreByTopic,
    /** topic → oppose-side reputation (mirror). */
    opposeByTopic,
    loading: profileLoading || supportersLoading || trustLoading,
  }
}
