/**
 * useReputationBackers — the backers behind your boost, per topic.
 *
 * Same chain as `useDerivedReputation` (certs → ordered stakers → credibility)
 * but surfaces the actual backer list, not just the summed score. Reuses the
 * exact same React Query keys (`useClaimSupporters`, `useEigentrustMap`,
 * `useUserOnChainProfile`) so it shares their cache — no extra network.
 */
import { useMemo } from 'react'
import { useUserOnChainProfile } from '@/hooks/useUserOnChainProfile'
import { useClaimSupporters } from '@/hooks/useClaimSupporters'
import { useEigentrustMap } from '@/hooks/useEigentrustMap'
import { collectFollowerAddresses } from '@/services/derivedReputationService'
import type { ReputationCert } from '@/services/derivedReputationService'
import {
  computeBackersByTopic,
  type BackersResult,
} from '@/services/reputationBackersService'

export function useReputationBackers(addresses: readonly string[]): {
  backers: BackersResult
  loading: boolean
} {
  const accounts = useMemo(
    () => new Set(addresses.map((a) => a.toLowerCase())),
    [addresses],
  )

  const { profile, isLoading: profileLoading } = useUserOnChainProfile(
    addresses.length > 0 ? [...addresses] : undefined,
  )

  // Claims = the user's `in context of` triples (one per topic), so backers
  // are the accounts that LIKED a topic of your Mark after you — not
  // co-certifiers of the cert triple. Mirrors useDerivedReputation.
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

  const followerAddresses = useMemo(
    () =>
      collectFollowerAddresses({ accounts, certs, supportersByClaim: byClaim }),
    [accounts, certs, byClaim],
  )
  const { byAddress, loading: trustLoading } =
    useEigentrustMap(followerAddresses)

  const backers = useMemo(
    () =>
      computeBackersByTopic({
        accounts,
        certs,
        supportersByClaim: byClaim,
        credibility: byAddress,
        side: 'support',
      }),
    [accounts, certs, byClaim, byAddress],
  )

  return {
    backers,
    loading: profileLoading || supportersLoading || trustLoading,
  }
}
