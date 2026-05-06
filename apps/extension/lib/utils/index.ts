/**
 * Utils barrel file
 * Re-exports all utility functions
 */

// Logging
export { logger, createHookLogger, createServiceLogger } from './logger'

// URL & Content
export { normalizeUrl } from './normalizeUrl'
export { cleanTitle, getDisplayTitle } from './cleanTitle'
export { isRestrictedUrl } from './pageRestriction'
export type { RestrictionInfo } from './pageRestriction'
export { parseSofiaMessage } from './parseSofiaMessage'

// Web3 & Identity
export { getEnsAvatar, batchResolveEns } from './ensUtils'
export { isValidImageUrl, shouldShowDiceBearAvatar, generateDiceBearAvatar, convertIpfsToHttp, normalizeAvatarUrl, getInitials } from './avatar'

// IPFS
export { batchFetchIPFS } from './ipfsCache'

// Quest & Storage Helpers
export { calculateLevelFromXP, calculateXPForNextLevel, getClaimId, computeQuestStatuses } from './questStatusHelpers'
export { getWalletKey } from './storageKeyUtils'

// Cache & Async
export { refetchWithBackoff, debounce } from './refetchUtils'

// Level System (Groups/Echoes)
export { calculateLevel, calculateLevelProgress } from './levelCalculation'

// Domain Utilities
export { normalizeDomain, extractDomain, shouldExcludeDomain } from './domainUtils'

// Formatters
export { getFaviconUrl, formatDuration, formatShortDate, formatBalance } from './formatters'

// Certification Helpers
export { intentionToCertification, trustToCertification, getEffectiveCertStatus, calculateDominantCertification, sumCertifications } from './certificationHelpers'

// Discovery Calculations
export { buildPagePositionMap, calculateDiscoveryRanking, calculateDiscoveryGold, buildDiscoveryStats } from './discoveryUtils'

// Streak Calculations
export { calculateStreaks, extractUserActivityDates } from './streakUtils'

// Fee Calculation
export { estimateCertificationCost } from './feeCalculation'

// Page Certification Compute (pure functions)
export { computeDiscoveryData, computeIntentionStats, computeTrustCounts, computePagePositions } from './pageCertificationCompute'
export type { CertTriple, DiscoveryResult, IntentionStatsResult, TrustCountsResult, RankedPosition, PagePositionsResult } from './pageCertificationCompute'

// Page Blockchain Reducer (pure function)
export { pageBlockchainReducer, PAGE_BLOCKCHAIN_INITIAL_STATE } from './pageBlockchainReducer'

// Debate / Claim Helpers
export { formatTrust } from './formatTrust'
export { calcPercentage } from './calcPercentage'
