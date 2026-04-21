/**
 * Behavioral Reputation System types
 * Types for Sofia's behavioral scoring across 103 platforms,
 * 14 domains, 88 categories, and 300+ niches
 */

// === TAXONOMIE ===

export interface Niche {
  id: string
  label: string
  disambiguationSignal?: string
  disambiguationResult?: string
}

export interface Category {
  id: string
  label: string
  termId?: string
  niches: Niche[]
}

export interface Topic {
  id: string
  label: string
  icon: string
  color: string
  categories: Category[]
  primaryPlatforms: string[]
}

// === PLATEFORMES ===

export type AuthType =
  | "oauth2"
  | "oauth1"
  | "api_key"
  | "public"
  | "siwe"
  | "siwf"
  | "none"

export type SignalConfidence =
  | "very_high"
  | "high"
  | "medium"
  | "low"

export type IntegrationPhase = 0 | 1 | 2 | 3 | 4 | 5

export interface PlatformConfig {
  id: string
  name: string
  icon: string
  color: string
  authType: AuthType
  authUrl?: string
  tokenUrl?: string
  scopes?: string[]
  apiBaseUrl?: string
  website?: string
  dataPoints: string[]
  targetTopics: string[]
  targetCategories: string[]
  signalConfidence: SignalConfidence
  integrationPhase: IntegrationPhase
  rateLimitInfo?: string
  notes?: string
  isPublicApi: boolean
  isFreeAccess: boolean
}

// === SIGNAUX ===

export type SignalType =
  | "creation"
  | "regularity"
  | "community"
  | "monetization"
  | "consumption"

export interface BehavioralSignal {
  platformId: string
  signalType: SignalType
  rawValue: number
  normalizedValue: number
  metadata: Record<string, unknown>
  fetchedAt: number
  ttl: number
}

export interface SignalFormula {
  platformId: string
  formula: string
  weights: {
    creation: number
    regularity: number
    community: number
    monetization: number
    anciennete: number
  }
  burstPenalty: number
}

// === SCORES ===

export interface ScoreBreakdown {
  creation: number
  regularity: number
  community: number
  monetization: number
  anciennete: number
}

export interface NicheScore {
  nicheId: string
  topicId: string
  score: number
  confidence: number
  breakdown: ScoreBreakdown
  sources: string[]
  lastCalculated: number
}

export interface PlatformContribution {
  platformId: string
  platformName: string
  /** Points this platform contributed to the topic (pre multi-source, pre cap) */
  rawContribution: number
  breakdown: ScoreBreakdown
  /** Top metrics feeding the contribution (e.g. "commits_moy_quotidien: 12") */
  topMetrics: Array<{ key: string; value: number; component: keyof ScoreBreakdown }>
}

export interface TopicScoreExplanation {
  topicId: string
  finalScore: number
  maxScore: number
  /** Sum of platform rawContributions before trust & multi-source adjustments */
  platformSubtotal: number
  platformContributions: PlatformContribution[]
  /** compositeScore * 0.2 (capped by anti-fraud rules below) */
  trustBonus: number
  /** Number of platforms that actually produced signals */
  platformCount: number
  /** Multiplier applied based on platform count (0.5 / 1.2 / 1.5, or "trust-only cap 15") */
  multiSourceMultiplier: number
  multiSourceReason: string
  /** Score before the final min(maxScore, ...) clamp */
  preCapScore: number
  /** True if the cap actually bit */
  capped: boolean
}

export interface TopicScore {
  topicId: string
  score: number
  confidence: number
  topNiches: NicheScore[]
  platformCount: number
  lastCalculated: number
  explanation?: TopicScoreExplanation
}

export interface UserReputationProfile {
  walletAddress: string
  topics: TopicScore[]
  globalConfidence: number
  totalPlatforms: number
  ensName?: string
  lastUpdated: number
}

// === TOPIC SCORING MODEL ===

export interface TopicScoringModel {
  maxScore: number
  regularityMultiplier: number
  qualityMultiplier: number
  monetizationMultiplier: number
}

// === ONBOARDING ===

export interface UserInterestSelection {
  selectedTopics: string[]
  selectedCategories: string[]
  suggestedPlatforms: string[]
  connectedPlatforms: string[]
  completedAt?: number
}

// === PLATFORM CONNECTION ===

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "pending_verification"
  | "connected"
  | "error"
  | "expired"

export interface PlatformConnection {
  platformId: string
  status: ConnectionStatus
  connectedAt?: number
  lastSyncAt?: number
  userId?: string
  username?: string
  challengeCode?: string
  error?: string
}
