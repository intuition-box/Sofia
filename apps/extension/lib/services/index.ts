/**
 * Services barrel file
 * Re-exports all service singleton instances and key utilities
 */

// Blockchain
export { BlockchainService } from './blockchainService'
export { AtomServiceClass, atomService } from './AtomService'
export type { PinnedAtomData, PinThingFn } from './AtomService'
export { TripleServiceClass, tripleService } from './TripleService'
export type { ResolvedTriple } from './TripleService'

// Wallet
export { getWalletProvider, cleanupProvider, listWalletProviders, selectProviderByName, selectProviderByAddress, clearProviderSelection, createBoundProvider } from './walletProvider'

// Currency & Economy
export { GoldServiceClass, goldService, getLevelUpCost, GOLD_PER_CERTIFICATION, LEVEL_UP_COSTS, MAX_LEVEL_UP_COST } from './GoldService'
export { XPServiceClass, xpService } from './XPService'
export { LevelUpServiceClass, levelUpService } from './LevelUpService'
export { CurrencyMigrationServiceClass, currencyMigrationService } from './CurrencyMigrationService'

// Groups & Intentions
export { GroupManagerService, groupManager } from './GroupManager'
export type { CertificationType, CertifyResult, GroupStats } from './GroupManager'

// Quest System
export { QuestBadgeService } from './QuestBadgeService'
export { QuestProgressService } from './QuestProgressService'
export type { LocalProgressData } from './QuestProgressService'
export { QuestTrackingService, questTrackingService } from './QuestTrackingService'

// Badges
export { BadgeService, badgeService } from './BadgeService'

// Messaging
export { MessageBus, messageBus } from './MessageBus'
export { txEventBus } from './TxEventBus'
export type { TxEventType, TxEvent } from './TxEventBus'

// Page & Session
export { PageDataService, pageDataService } from './PageDataService'
export { SessionTrackerService, sessionTracker } from './SessionTracker'
export type { TrackedUrl, DomainCluster } from './SessionTracker'

// User
export { generateDeterministicUUID, getWalletAddress, isWalletConnected, getUserId, getUserAgentIds, getUserMapping, resetUserSession, debugUserSession } from './UserSessionManager'
export type { AgentIds } from './UserSessionManager'

// Storage
export { TripletStorageService, tripletStorageService } from './TripletStorageService'


// Discovery & Certifications
export { DiscoveryScoreServiceClass, discoveryScoreService } from './DiscoveryScoreService'
export type { DiscoveryState } from './DiscoveryScoreService'
export { UserCertificationsServiceClass, userCertificationsService } from './UserCertificationsService'
export type { TripleDetail, CertificationEntry, CertificationsStoreState } from './UserCertificationsService'

// Global Stake
export { GlobalStakeServiceClass, globalStakeService } from './GlobalStakeService'
export type { GlobalStakeState, GlobalStakePosition, GlobalStakeConfig, GlobalVaultStats, SeasonPosition } from '~/types/globalStake'

// Cart
export { CartServiceClass, cartService } from './CartService'
export type { CartState } from './CartService'

// Topic Interests (from Sofia Explorer)
export { topicPositionsService } from './TopicPositionsService'
export type { UserTopicPosition, TopicPositionsState } from './TopicPositionsService'

// Platform Pool
export { platformPoolService } from './PlatformPoolService'

// Browsing Nudge
export { BrowsingNudgeServiceClass, browsingNudgeService, NUDGE_URL_THRESHOLD } from './BrowsingNudgeService'

// AI
export { RecommendationService } from './ai/RecommendationService'
