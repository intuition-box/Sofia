/**
 * useDerivedReputation — orchestrates the reputation calc end to end.
 *
 * Chains: the user's on-chain certs → ordered stakers per claim
 * (useClaimSupporters) → global credibility of the followers (useEigentrustMap)
 * → `computeDerivedReputation`. Returns topic → score for both the support side
 * (positive reputation) and the oppose mirror. See docs/reputation-curation.md.
 */
import { useMemo } from 'react'
import { useUserOnChainProfile } from '@/hooks/useUserOnChainProfile'
import { useClaimSupporters } from '@/hooks/useClaimSupporters'
import { useEigentrustMap } from '@/hooks/useEigentrustMap'
import {
  computeDerivedReputation,
  collectFollowerAddresses,
  buildReputationClaims,
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

  // Reputation = HYBRID backing. A claim is either the cert triple (any
  // co-certifier of your Mark after you) OR the `in context of` topic triple
  // (anyone who "liked" your per-topic tag after you). Both lift your
  // reputation in that topic. See docs/reputation-curation.md.
  const certs = useMemo<ReputationCert[]>(
    () => buildReputationClaims(profile),
    [profile.certs, profile.contextAdditions],
  )

  const claimIds = useMemo(() => certs.map((c) => c.termId), [certs])
  const { byClaim, loading: supportersLoading } = useClaimSupporters(claimIds)

  // Credibility is only needed for the accounts that followed the user.
  const followerAddresses = useMemo(
    () =>
      collectFollowerAddresses({ accounts, certs, supportersByClaim: byClaim }),
    [accounts, certs, byClaim],
  )
  // Credibility = the GLOBAL objective score per follower (compute_composite_score),
  // not seeded by the viewer — one ranking across the whole graph. Personalized/
  // group trust (usePersonalizedTrustMap) is reserved for per-circle reputation.
  const { byAddress, loading: trustLoading } =
    useEigentrustMap(followerAddresses)

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
