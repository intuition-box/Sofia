/**
 * useRecommendations Hook - Simplified
 * Uses new RecommendationService for clean separation of concerns
 */

import { useState, useEffect, useCallback } from 'react'
import { useStorage } from "@plasmohq/storage/hook"
import { RecommendationService } from '../lib/services/ai/RecommendationService'
import type { Recommendation } from '../lib/services/ai/types'

export interface UseRecommendationsResult {
  recommendations: Recommendation[]
  isLoading: boolean
  generateRecommendations: (forceRefresh?: boolean, additive?: boolean) => Promise<void>
  clearCache: () => Promise<void>
}

export const useRecommendations = (): UseRecommendationsResult => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [account] = useStorage<string>("metamask-account")

  console.log('🔄 useRecommendations hook - account:', account)

  const generateRecommendations = useCallback(async (forceRefresh: boolean = false, additive: boolean = false): Promise<void> => {
    if (!account) {
      console.log('❌ No account found, skipping recommendations')
      setRecommendations([])
      return
    }

    setIsLoading(true)

    try {
      console.log('🚀 Generating recommendations for account:', account, additive ? '(adding more)' : '')
      const result = await RecommendationService.generateRecommendations(account, forceRefresh, additive)
      setRecommendations(result)
      console.log('✅ Recommendations updated:', result.length, 'categories')
    } catch (error) {
      console.error('❌ Error generating recommendations:', error)
      if (!additive) {
        setRecommendations([])
      }
    } finally {
      setIsLoading(false)
    }
  }, [account])

  const clearCache = useCallback(async (): Promise<void> => {
    if (!account) return
    
    try {
      await RecommendationService.clearCache(account)
      setRecommendations([])
      console.log('🗑️ Cache cleared for account:', account)
    } catch (error) {
      console.error('❌ Error clearing cache:', error)
    }
  }, [account])

  // Load recommendations on account change
  useEffect(() => {
    console.log('🔄 useRecommendations useEffect triggered - account:', account)
    if (account) {
      generateRecommendations(false) // Load cached first, then generate if needed
    } else {
      console.log('❌ No account, clearing recommendations')
      setRecommendations([])
    }
  }, [account, generateRecommendations])

  return {
    recommendations,
    isLoading,
    generateRecommendations: (forceRefresh?: boolean, additive?: boolean) => generateRecommendations(forceRefresh || false, additive || false),
    clearCache
  }
}