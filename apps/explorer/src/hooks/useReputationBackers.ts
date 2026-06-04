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
