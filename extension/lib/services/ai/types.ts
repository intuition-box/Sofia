/**
 * Types pour le système AI/Recommandations
 */

export interface Recommendation {
  category: string
  title: string
  reason: string
  suggestions: {
    name: string
    url: string
  }[]
}

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface WalletData {
  address: string
  triples: any[]
}

export interface RecommendationCache {
  walletAddress: string
  recommendations: Recommendation[]
  createdAt: number
}

// History Analysis Types
export interface HistoryData {
  urls: string[]
  timeRange: {
    start: number
    end: number
  }
  totalVisits: number
}

export interface NavigationPattern {
  category: string
  frequency: number
  timeSpent: number
  urls: string[]
  confidence: number
}

export interface Interest {
  name: string
  category: string
  strength: number
  evidence: string[]
  keywords: string[]
}

export interface BehavioralInsight {
  type: 'pattern' | 'preference' | 'skill' | 'interest'
  title: string
  description: string
  confidence: number
  evidence: string[]
}

export interface HistoryAnalysis {
  patterns: NavigationPattern[]
  interests: Interest[]
  insights: BehavioralInsight[]
  summary: string
  analyzedAt: number
}