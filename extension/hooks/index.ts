/**
 * Hooks barrel file
 * Re-exports all custom hooks
 */

// Wallet & Auth
export { useWalletFromStorage, openAuthTab, disconnectWallet } from './useWalletFromStorage'

// Blockchain Write Operations
export { useCreateAtom } from './useCreateAtom'
export { useCreateTripleOnChain } from './useCreateTripleOnChain'
export { useWeightOnChain } from './useWeightOnChain'
export { useRedeemTriple } from './useRedeemTriple'
export { useIntentionCertify } from './useIntentionCertify'
export { useEchoPublishing } from './useEchoPublishing'
export { useTrustPage } from './useTrustPage'
export { useTrustAccount } from './useTrustAccount'

// Blockchain Read Operations
export { useIntuitionTriplets } from './useIntuitionTriplets'
export { usePageBlockchainData } from './usePageBlockchainData'
export { useBondingCurveData } from './useBondingCurveData'
export { useDepositPreview } from './useDepositPreview'
export { useUserAtomStats } from './useUserAtomStats'
export { useGetAtomAccount } from './useGetAtomAccount'
export { useAccountStats } from './useAccountStats'

// Social & Follow
export { useFollowAccount } from './useFollowAccount'
export { useCreateFollowTriples } from './useCreateFollowTriples'
export { useCheckFollowStatus } from './useCheckFollowStatus'
export { useFollowing } from './useFollowing'
export { useFollowers } from './useFollowers'
export { useTrustCircle } from './useTrustCircle'
export { useTrustedByCount } from './useTrustedByCount'
export { useSocialVerifier } from './useSocialVerifier'
export { useIdentityResolution } from './useIdentityResolution'

// Groups & Intentions
export { default as useIntentionGroups } from './useIntentionGroups'
export { useOnChainIntentionGroups } from './useOnChainIntentionGroups'
export { default as useGroupOnChainCertifications } from './useGroupOnChainCertifications'
export { default as useGroupAmplify } from './useGroupAmplify'
export { usePageIntentionStats } from './usePageIntentionStats'
export { default as useIntentionCategories } from './useIntentionCategories'

// Certifications & Discovery
export { useUserCertifications, getCertificationForUrl } from './useUserCertifications'
export { useDiscoveryScore } from './useDiscoveryScore'
export { usePageDiscovery } from './usePageDiscovery'

// Quest & XP
export { useQuestSystem } from './useQuestSystem'
export { useUserQuests } from './useUserQuests'
export { useGoldSystem } from './useGoldSystem'
export { default as useLevelUp } from './useLevelUp'

// Bookmarks & Lists
export { useBookmarks } from './useBookmarks'
export { useUserLists } from './useUserLists'
export { useUserSignals } from './useUserSignals'

// Recommendations & Interest
export { useRecommendations } from './useRecommendations'
export { default as useInterestAnalysis } from './useInterestAnalysis'
export { useInterestAttention } from './useInterestAttention'
export { default as useCircleInterestRecommendations } from './useCircleInterestRecommendations'

// Tracking
export { useTracking } from './useTracking'
