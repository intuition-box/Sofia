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

