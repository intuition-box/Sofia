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

  // Reputation = likes only. A claim is one `in context of` triple (per
  // topic) the user staked — the vault a "like" deposits on — NOT the cert
  // triple. So someone who likes your Mark's topic AFTER you lifts your
  // reputation in that topic; a plain co-certification of the cert triple
  // does not. See docs/reputation-likes-gap.md.
  const certs = useMemo<ReputationCert[]>(
    () =>
      profile.contextAdditions
        .filter((ca) => ca.contextTermId && ca.topicSlug)
        .map((ca) => ({
          termId: ca.contextTermId,
          certifiedAt: ca.addedAt,
          topicSlugs: [ca.topicSlug],
        })),
    [profile.contextAdditions],
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
