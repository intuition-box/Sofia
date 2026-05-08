/**
 * Services barrel file
 * Re-exports all service singleton instances and key utilities
 */

// Blockchain
export { BlockchainService } from './blockchainService'
export { atomService } from './AtomService'
export { tripleService } from './TripleService'

// Wallet
export { cleanupProvider, selectProviderByName, clearProviderSelection, createBoundProvider } from './walletProvider'

// Currency & Economy
export { goldService, getLevelUpCost } from './GoldService'
export { XPServiceClass, xpService } from './XPService'
export { levelUpService } from './LevelUpService'

// Groups & Intentions
export { groupManager } from './GroupManager'
export type { CertificationType } from './GroupManager'

// Quest System
export { QuestBadgeService } from './QuestBadgeService'
export { QuestProgressService } from './QuestProgressService'
export { QuestTrackingService, questTrackingService } from './QuestTrackingService'

// Badges
export { BadgeService, badgeService } from './BadgeService'

// Messaging
export { MessageBus, messageBus } from './MessageBus'
export { txEventBus } from './TxEventBus'

// Page & Session
export { pageDataService } from './PageDataService'
export { sessionTracker } from './SessionTracker'
export type { TrackedUrl, DomainCluster } from './SessionTracker'


// Discovery & Certifications
export { discoveryScoreService } from './DiscoveryScoreService'
export { UserCertificationsServiceClass, userCertificationsService } from './UserCertificationsService'
export type { TripleDetail, CertificationEntry } from './UserCertificationsService'

// Global Stake
export { globalStakeService } from './GlobalStakeService'

// Cart
export { cartService } from './CartService'

// Topic Interests (from Sofia Explorer)
export { topicPositionsService } from './TopicPositionsService'

// Platform Pool
export { platformPoolService } from './PlatformPoolService'

// Browsing Nudge
export { browsingNudgeService } from './BrowsingNudgeService'

