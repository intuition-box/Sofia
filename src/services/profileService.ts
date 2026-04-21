/**
 * Profile Service — Dashboard
 * Fetches user profile data from on-chain positions via GraphQL.
 * Users interact with the MultiVault by depositing into triple vaults.
 * Their positions (shares in vaults) represent their certifications.
 */

import {
  useGetUserPositionsQuery,
  useGetUserSignalsCountQuery,
  type GetUserPositionsQuery,
} from '@0xsofia/dashboard-graphql'
import { SUBJECT_IDS } from '../config'

// ── Types ──

export interface UserPosition {
  termId: string
  shares: string
  currentSharePrice: string
  isTriple: boolean
  predicateLabel?: string
  objectLabel?: string
  objectUrl?: string
  tripleSubjectId?: string
  tripleObjectId?: string
  atomLabel?: string
  atomUrl?: string
}

export interface UserProfileData {
  positions: UserPosition[]
  totalPositions: number
  totalCertifications: number
  totalAtomPositions: number
  totalStaked: number
  verifiedPlatforms: string[]
}

// ── Fetcher ──

type PositionRaw = GetUserPositionsQuery['positions'][number]

/**
 * Fetch only the signalsCount aggregate. Used as a separate pull query by
 * useUserProfile / useDiscoveryScore — the WS subscription doesn't stream
 * server-side aggregates, so this stays HTTP.
 */
export async function fetchSignalsCount(walletAddress: string): Promise<number> {
  const data = await useGetUserSignalsCountQuery.fetcher({
    accountId: walletAddress,
    subjectId: SUBJECT_IDS.I,
  })()
  return data.signalsCount.aggregate?.count ?? 0
}

/**
 * Fetch user's on-chain positions (vault shares).
 * Each position = user has deposited into an atom or triple vault.
 * Triple positions with "visits for *" predicates = certifications.
 */
export async function fetchUserProfile(
  walletAddress: string,
): Promise<UserProfileData> {
  const data = await useGetUserPositionsQuery.fetcher({
    accountId: walletAddress,
  })()

  const positions: UserPosition[] = data.positions.map((p: PositionRaw) => ({
    termId: p.vault?.term?.atom?.term_id ?? p.vault?.term?.triple?.term_id ?? '',
    shares: p.shares,
    currentSharePrice: p.vault?.current_share_price,
    isTriple: !!p.vault?.term?.triple,
    predicateLabel: p.vault?.term?.triple?.predicate?.label,
    objectLabel: p.vault?.term?.triple?.object?.label ?? p.vault?.term?.atom?.label,
    objectUrl: p.vault?.term?.triple?.object?.value?.thing?.url ?? p.vault?.term?.atom?.value?.thing?.url,
    tripleSubjectId: p.vault?.term?.triple?.subject?.term_id,
    tripleObjectId: p.vault?.term?.triple?.object?.term_id,
    atomLabel: p.vault?.term?.atom?.label,
    atomUrl: p.vault?.term?.atom?.value?.thing?.url,
  }))

  const triplePositions = data.positions.filter((p: PositionRaw) => p.vault?.term?.triple)
  const atomPositions = data.positions.filter((p: PositionRaw) => p.vault?.term?.atom && !p.vault?.term?.triple)

  // Certifications = triple positions with "visits for" predicates
  const certifications = triplePositions.filter((p: PositionRaw) =>
    p.vault?.term?.triple?.predicate?.label?.startsWith('visits for'),
  )

  // Verified platforms from social link triples
  const socialPredRegex = /has verified (\w+) id/i
  const verifiedPlatforms = triplePositions
    .map((p: PositionRaw) => {
      const match = p.vault?.term?.triple?.predicate?.label?.match(socialPredRegex)
      return match?.[1]?.toLowerCase()
    })
    .filter((v: string | undefined): v is string => !!v)

  // Signals count — same logic as the extension (terms_aggregate with subject "I")
  const signalsData = await useGetUserSignalsCountQuery.fetcher({
    accountId: walletAddress,
    subjectId: SUBJECT_IDS.I,
  })()
  const signalsCount = signalsData.signalsCount.aggregate?.count ?? 0

  // Total staked value
  const totalStaked = data.positions.reduce((sum: number, p: PositionRaw) => {
    const shares = parseFloat(p.shares) || 0
    const price = parseFloat(p.vault?.current_share_price) || 0
    return sum + (shares * price) / 1e18
  }, 0)
  const roundedStaked = Math.round(totalStaked * 100) / 100

  return {
    positions,
    totalPositions: data.total.aggregate?.count ?? 0,
    totalCertifications: signalsCount,
    totalAtomPositions: atomPositions.length,
    totalStaked: roundedStaked,
    verifiedPlatforms: [...new Set(verifiedPlatforms)] as string[],
  }
}
