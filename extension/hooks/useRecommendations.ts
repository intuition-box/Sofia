/**
 * useRecommendations Hook - Simplified
 * Uses new RecommendationService for clean separation of concerns
 */

import { useState, useEffect, useCallback } from 'react'
import { useWalletFromStorage } from './useWalletFromStorage'
import { RecommendationService } from '../lib/services'
import { createHookLogger } from '../lib/utils/logger'
import type { Recommendation } from '../lib/services/ai/types'

const logger = createHookLogger('useRecommendations')

export interface UseRecommendationsResult {
  recommendations: Recommendation[]
  isLoading: boolean
  generateRecommendations: (forceRefresh?: boolean, additive?: boolean) => Promise<void>
  clearCache: () => Promise<void>
}

export const useRecommendations = (): UseRecommendationsResult => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { walletAddress: account } = useWalletFromStorage()

  logger.debug('Hook initialized', { account })

  const generateRecommendations = useCallback(async (forceRefresh: boolean = false, additive: boolean = false): Promise<void> => {
    if (!account) {
      logger.debug('No account found, skipping recommendations')
      setRecommendations([])
      return
    }

    setIsLoading(true)

    try {
      logger.info('Generating recommendations', { account, additive })
      const result = await RecommendationService.generateRecommendations(account, forceRefresh, additive)
      setRecommendations(result)
      logger.info('Recommendations updated', { count: result.length })
    } catch (error) {
      logger.error('Error generating recommendations', error)
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
      logger.info('Cache cleared', { account })
    } catch (error) {
      logger.error('Error clearing cache', error)
    }
  }, [account])

  // Load recommendations on account change
  useEffect(() => {
    logger.debug('useEffect triggered', { account })
    if (account) {
      generateRecommendations(false) // Load cached first, then generate if needed
    } else {
      logger.debug('No account, clearing recommendations')
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