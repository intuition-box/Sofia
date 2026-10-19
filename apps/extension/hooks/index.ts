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
export { useTrustAccount } from './useTrustAccount'

// Blockchain Read Operations
export { useIntuitionTriplets } from './useIntuitionTriplets'
export { usePageBlockchainData } from './usePageBlockchainData'
export { useBondingCurveData } from './useBondingCurveData'
export { useGetAtomAccount } from './useGetAtomAccount'
export type { AccountAtom } from './useGetAtomAccount'
export { useAccountStats } from './useAccountStats'

// Social & Follow
export { useDiscordProfile } from './useDiscordProfile'
export { useFollowAccount } from './useFollowAccount'
export { useCreateFollowTriples } from './useCreateFollowTriples'
export { useCheckFollowStatus } from './useCheckFollowStatus'
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
export { default as useIntentionCategories } from './useIntentionCategories'

// Certifications & Discovery
export { useUserCertifications, getCertificationForUrl } from './useUserCertifications'
export { useTrendingCertifications } from './useTrendingCertifications'
export type { TrendingItem, TrendingCategory, TrendingCertifier } from './useTrendingCertifications'
export { usePagePositions } from './usePagePositions'

// Onboarding
export { useOnboardingClaim } from './useOnboardingClaim'
export type { UseOnboardingClaimResult } from './useOnboardingClaim'

// UI Hooks
export { useFavicon } from './useFavicon'
export { useCredibilityAnalysis, getTotalShares, type CredibilityAnalysis } from './useCredibilityAnalysis'
export type { ModalTriplet } from '../types/blockchain'

// Quest & XP

// Global Stake
export { useFeeEstimate } from './useFeeEstimate'

// UI Utilities

// Bookmarks & Lists
export { useBookmarks } from './useBookmarks'

// Recommendations & Interest

// Topic Interests (from Sofia Explorer)

// Cart
export { useCart } from './useCart'
export { useCartSubmit } from './useCartSubmit'
export { useBatchRewards } from './useBatchRewards'
export type { BatchRewardItem } from './useBatchRewards'

// Platform Pool
export { usePlatformPool, PP_FEE_DENOMINATOR } from './usePlatformPool'

// Tracking
export { useTracking } from './useTracking'
export { useDelegatedPublishing } from './useDelegatedPublishing'
