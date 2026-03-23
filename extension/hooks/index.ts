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
export { useRedeemGlobalStake } from './useRedeemGlobalStake'
export { useDepositGlobalStake } from './useDepositGlobalStake'
export { useIntentionCertify } from './useIntentionCertify'
export { useEchoPublishing } from './useEchoPublishing'
export { useTrustPage } from './useTrustPage'
export { useTrustAccount } from './useTrustAccount'

// Blockchain Read Operations
export { useIntuitionTriplets } from './useIntuitionTriplets'
export { usePageBlockchainData } from './usePageBlockchainData'
export { useBondingCurveData } from './useBondingCurveData'
export { useUserAtomStats } from './useUserAtomStats'
export { useGetAtomAccount } from './useGetAtomAccount'
export type { AccountAtom } from './useGetAtomAccount'
export { useAccountStats } from './useAccountStats'

// Social & Follow
export { useDiscordProfile } from './useDiscordProfile'
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
export { default as useIntentionGroups, type IntentionGroupWithStats, type SortOption } from './useIntentionGroups'
export { default as useGroupManager, type ManagerFilter, type ManagerSort } from './useGroupManager'
export { useOnChainIntentionGroups } from './useOnChainIntentionGroups'
export { default as useGroupOnChainCertifications, type UrlCertificationStatus } from './useGroupOnChainCertifications'
export { default as useGroupAmplify } from './useGroupAmplify'
export { usePageIntentionStats } from './usePageIntentionStats'
export { default as useIntentionCategories } from './useIntentionCategories'

// Certifications & Discovery
export { useUserCertifications, getCertificationForUrl } from './useUserCertifications'
export { useDiscoveryScore } from './useDiscoveryScore'
export { useUserDiscoveryScore } from './useUserDiscoveryScore'
export { useTrendingCertifications } from './useTrendingCertifications'
export type { TrendingItem, TrendingCategory, TrendingCertifier } from './useTrendingCertifications'
export { usePageDiscovery } from './usePageDiscovery'
export { useDiscoveryReward } from './useDiscoveryReward'
export { usePagePositions } from './usePagePositions'

// Onboarding
export { useOnboardingClaim } from './useOnboardingClaim'
export type { UseOnboardingClaimResult } from './useOnboardingClaim'

// UI Hooks
export { useFavicon } from './useFavicon'
export { useCredibilityAnalysis, getTotalShares, type CredibilityAnalysis } from './useCredibilityAnalysis'
export { useCertificationModal } from './useCertificationModal'
export type { ModalTriplet } from './useCertificationModal'

// Quest & XP
export { useQuestSystem } from './useQuestSystem'
export { useUserQuests } from './useUserQuests'
export { useGoldSystem } from './useGoldSystem'
export { default as useLevelUp, type LevelUpPreview } from './useLevelUp'
export { useDailyStreakProfit } from './useDailyStreakProfit'
export type { DailyStreakProfitData } from './useDailyStreakProfit'
export { useStreakLeaderboard } from './useStreakLeaderboard'
export type { LeaderboardEntry } from './useStreakLeaderboard'
export { useOnChainStreak } from './useOnChainStreak'
export type { OnChainStreakResult } from './useOnChainStreak'

// Global Stake
export { useGlobalStake, GS_FEE_DENOMINATOR } from './useGlobalStake'
export { useFeeEstimate } from './useFeeEstimate'

// UI Utilities
export { useCardStack } from './useCardStack'

// Bookmarks & Lists
export { useBookmarks } from './useBookmarks'
export { useUserLists } from './useUserLists'
export { useUserSignals } from './useUserSignals'

// Recommendations & Interest
export { useRecommendations } from './useRecommendations'
export { default as useInterestAnalysis } from './useInterestAnalysis'
export { useInterestAttention } from './useInterestAttention'

// Debate
export { useDebateClaims } from './useDebateClaims'
export type { DebateClaim, FeaturedList, UseDebateClaimsResult } from './useDebateClaims'


// Cart
export { useCart } from './useCart'
export { useCartSubmit } from './useCartSubmit'
export { useBatchRewards } from './useBatchRewards'
export type { BatchRewardItem } from './useBatchRewards'

// Notifications
export { useBrowsingNudge } from './useBrowsingNudge'
export { useCartReminder } from './useCartReminder'

// Tracking
export { useTracking } from './useTracking'
