/**
 * Services barrel file
 * Re-exports all service singleton instances and key utilities
 */

// Blockchain
export { BlockchainService } from './blockchainService'
export { atomService } from './AtomService'
export { tripleService } from './TripleService'
export { certificationService } from './CertificationService'
export type { ContextTripleItem, ObjectAtomData, QuickPublishResult, QuickPublishTarget, SubmitCartResult } from './CertificationService'
export { delegationService } from './DelegationService'
export type { DelegationGrant, DelegationState, DelegationStatus } from './DelegationService'

// Wallet
export { createBoundProvider } from './walletProvider'

// Currency & Economy

// Groups & Intentions
export { groupManager } from './GroupManager'
export type { CertificationType } from './GroupManager'

// Quest System

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
export { UserCertificationsServiceClass, userCertificationsService } from './UserCertificationsService'
export type { TripleDetail, CertificationEntry } from './UserCertificationsService'

// Cart
export { cartService } from './CartService'

// Topic Interests (from Sofia Explorer)

// Platform Pool
export { platformPoolService, MAX_PLATFORM_PERCENTAGE } from './PlatformPoolService'

// Browsing Nudge
export { browsingNudgeService } from './BrowsingNudgeService'

