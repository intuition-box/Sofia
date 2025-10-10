/**
 * Types pour le système de recommandations
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

export interface UseRecommendationsResult {
  recommendations: Recommendation[]
  rawResponse: string | null
  generateRecommendations: (forceRefresh?: boolean) => Promise<void>
  isLoading: boolean
}