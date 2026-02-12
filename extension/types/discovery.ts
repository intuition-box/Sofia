/**
 * Discovery System Types
 * Types for the intention-based page certification system
 */

// Intention purposes for page certification
export type IntentionPurpose =
  | 'for_work'
  | 'for_learning'
  | 'for_fun'
  | 'for_inspiration'
  | 'for_buying'

// Discovery status based on certification order
export type DiscoveryStatus = 'Pioneer' | 'Explorer' | 'Contributor' | null

// Predicate names for intention triples
// All predicates use clean labels WITHOUT trailing spaces
export const INTENTION_PREDICATES: Record<IntentionPurpose, string> = {
  for_work: 'visits for work',
  for_learning: 'visits for learning',
  for_fun: 'visits for fun',
  for_inspiration: 'visits for inspiration',
  for_buying: 'visits for buying'
} as const

// Display labels for UI
export const INTENTION_LABELS: Record<IntentionPurpose, string> = {
  for_work: 'work',
  for_learning: 'learning',
  for_fun: 'fun',
  for_inspiration: 'inspiration',
  for_buying: 'buying'
} as const

// Discovery record for a specific page
export interface PageDiscoveryRecord {
  pageUrl: string
  domain: string
  certificationCount: number
  userStatus: DiscoveryStatus
  userCertificationRank: number | null
  intentionPurposes: Record<IntentionPurpose, number>
}

// User's global discovery statistics
export interface UserDiscoveryStats {
  pioneerCount: number
  explorerCount: number
  contributorCount: number
  totalCertifications: number
  intentionBreakdown: Record<IntentionPurpose, number>
  discoveryGold: {
    fromPioneer: number
    fromExplorer: number
    fromContributor: number
    total: number
  }
}

// Interest Attention state
export interface InterestAttention {
  isEligible: boolean
  timeSpent: number        // seconds spent on page
  hasScrolled: boolean
  hasInteracted: boolean
  scrollPercentage: number // 0-1
}

// Constants for Interest Attention
export const ATTENTION_REQUIREMENTS = {
  MINIMUM_TIME_SECONDS: 30,
  MINIMUM_SCROLL_PERCENTAGE: 0.3
} as const

// Gold rewards for discovery
export const DISCOVERY_GOLD_REWARDS = {
  PIONEER: 50,    // First to certify
  EXPLORER: 20,   // 2nd to 10th
  CONTRIBUTOR: 10  // 11th+
} as const

/** @deprecated Use DISCOVERY_GOLD_REWARDS instead */
export const DISCOVERY_XP_REWARDS = DISCOVERY_GOLD_REWARDS

// Thresholds for discovery status
export const DISCOVERY_THRESHOLDS = {
  PIONEER: 1,     // First certification
  EXPLORER_MAX: 10 // 2-10 are Explorers, 11+ are Contributors
} as const

// Discovery triple structure
export interface DiscoveryTriple {
  subject: string      // "I" atom
  predicate: string    // intention predicate
  object: string       // page URL/label
  intentionPurpose: IntentionPurpose
}

// Recent discovery entry for history
export interface RecentDiscovery {
  pageUrl: string
  pageLabel: string
  domain: string
  status: DiscoveryStatus
  intention: IntentionPurpose
  certifiedAt: number
  tripleId?: string
}
