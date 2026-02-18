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
export { getEnsAvatar, batchGetEnsAvatars, clearEnsAvatarCache } from './ensUtils'
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
