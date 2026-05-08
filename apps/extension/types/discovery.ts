/**
 * Discovery System Types
 * Types for the intention-based page certification system
 */

import { INTENTION_CONFIG, type IntentionConfigEntry, type IntentionType } from "./intentionCategories"

// Re-export IntentionPurpose from the single source of truth
export type { IntentionPurpose } from "./intentionCategories"
import type { IntentionPurpose } from "./intentionCategories"

// Discovery status based on certification order
export type DiscoveryStatus = 'Pioneer' | 'Explorer' | 'Contributor' | null

// Predicate names for intention triples (derived from INTENTION_CONFIG)
export const INTENTION_PREDICATES: Record<IntentionPurpose, string> =
  Object.fromEntries(
    (Object.entries(INTENTION_CONFIG) as [IntentionType, IntentionConfigEntry][])
      .filter(([, v]) => v.intentionPurpose !== null)
      .map(([, v]) => [v.intentionPurpose!, v.predicateLabel!])
  ) as Record<IntentionPurpose, string>

// User's global discovery statistics
export interface UserDiscoveryStats {
  pioneerCount: number
  explorerCount: number
  contributorCount: number
  totalCertifications: number
  intentionBreakdown: Record<IntentionPurpose, number>
  trustBreakdown: { trusted: number; distrusted: number }
  discoveryGold: {
    fromPioneer: number
    fromExplorer: number
    fromContributor: number
    total: number
  }
}

// Gold rewards for discovery
export const DISCOVERY_GOLD_REWARDS = {
  PIONEER: 50,    // First to certify
  EXPLORER: 20,   // 2nd to 10th
  CONTRIBUTOR: 10  // 11th+
} as const

// Thresholds for discovery status
export const DISCOVERY_THRESHOLDS = {
  PIONEER: 1,     // First certification
  EXPLORER_MAX: 10 // 2-10 are Explorers, 11+ are Contributors
} as const
