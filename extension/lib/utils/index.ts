/**
 * Utils barrel file
 * Re-exports all utility functions
 */

// Logging
export { logger, blockchainLogger, apiLogger, storageLogger, createHookLogger, createServiceLogger } from './logger'

// URL & Content
export { normalizeUrl } from './normalizeUrl'
export { cleanTitle, getDisplayTitle } from './cleanTitle'
export { isRestrictedUrl } from './pageRestriction'
export type { RestrictionInfo } from './pageRestriction'
export { parseSofiaMessage } from './parseSofiaMessage'

// Web3 & Identity
export { getEnsAvatar, getEnsName, batchGetEnsAvatars, batchResolveEns, clearEnsAvatarCache } from './ensUtils'
export { isValidImageUrl, isEthereumAddress, shouldShowDiceBearAvatar, generateDiceBearAvatar, escapeSvgForCss, convertIpfsToHttp, normalizeAvatarUrl, getInitials } from './avatar'

// IPFS
export { batchFetchIPFS, fetchIPFSMetadata, clearIPFSCache, getIPFSCacheSize } from './ipfsCache'

// Quest & Storage Helpers
export { calculateLevelFromXP, calculateXPForNextLevel, getClaimId, computeQuestStatuses } from './questStatusHelpers'
export { getWalletKey } from './storageKeyUtils'

// Cache & Async
export { refetchWithBackoff, debounce } from './refetchUtils'

// Circle & Interest
export { fetchMemberDomainActivity } from './circleInterestUtils'

// Level System (Groups/Echoes)
export { LEVEL_THRESHOLDS, calculateLevel, calculateLevelProgress } from './levelCalculation'

// Domain Utilities
export { normalizeDomain, extractDomain, extractHostname, shouldExcludeDomain } from './domainUtils'

// Formatters
export { getFaviconUrl, formatDuration, formatShortDate, formatBalance } from './formatters'

// Certification Helpers
export { intentionToCertification, trustToCertification, getEffectiveCertStatus, calculateDominantCertification, sumCertifications } from './certificationHelpers'

// Discovery Calculations
export { buildPagePositionMap, calculateDiscoveryRanking, calculateDiscoveryGold, buildDiscoveryStats } from './discoveryUtils'

// Streak Calculations
export { calculateStreaks, toDateStr, extractUserActivityDates } from './streakUtils'

// Fee Calculation
export { estimateCertificationCost } from './feeCalculation'

// Page Certification Compute (pure functions)
export { computeDiscoveryData, computeIntentionStats, computeTrustCounts, computePagePositions } from './pageCertificationCompute'
export type { CertTriple, DiscoveryResult, IntentionStatsResult, TrustCountsResult, RankedPosition, PagePositionsResult } from './pageCertificationCompute'

// Page Blockchain Reducer (pure function)
export { pageBlockchainReducer, PAGE_BLOCKCHAIN_INITIAL_STATE, DEFAULT_COUNTS, EMPTY_INTENTIONS } from './pageBlockchainReducer'

// Debate / Claim Helpers
export { formatTrust } from './formatTrust'
export { calcPercentage } from './calcPercentage'
