/**
 * Main service for recommendations
 * Centralizes all business logic
 */

import { StorageRecommendation } from '../../database/StorageRecommendation'
import type { Recommendation, WalletData } from './types'
import { intuitionGraphqlClient } from '../../clients/graphql-client'
import { SUBJECT_IDS } from '../../config/constants'
import { getAddress } from 'viem'
import { createServiceLogger } from '../../utils/logger'

const logger = createServiceLogger('RecommendationService')

export class RecommendationService {
  /**
   * Generate recommendations for a wallet
   */
  static async generateRecommendations(
    walletAddress: string, 
    forceRefresh: boolean = false,
    additive: boolean = false
  ): Promise<Recommendation[]> {
    try {
      logger.info('Generating recommendations', { walletAddress, mode: additive ? 'additive' : 'replace' })

      // Check cache first (unless force refresh)
      if (!forceRefresh && !additive) {
        const cached = await StorageRecommendation.load(walletAddress)
        if (cached && cached.length > 0) {
          logger.debug('Using cached recommendations')
          return cached
        }
      }

      // Get wallet data
      const walletData = await this.getWalletData(walletAddress)
      if (!walletData.triples.length) {
        logger.info('No wallet data found')
        return []
      }

      // Generate with RecommendationAgent
      const newRecommendations = await this.generateWithAgent(walletData)
      
      // Handle additive mode: merge for storage but return only new ones
      if (additive) {
        const existingRecommendations = await StorageRecommendation.load(walletAddress) || []
        const mergedRecommendations = this.mergeRecommendations(existingRecommendations, newRecommendations)
        logger.debug('Merged recommendations', { existing: existingRecommendations.length, new: newRecommendations.length, merged: mergedRecommendations.length })
        
        // Save merged recommendations to cache
        await StorageRecommendation.save(walletAddress, mergedRecommendations)
        
        // Return ONLY the new recommendations for UI processing
        logger.info('Generated new recommendations', { newCount: newRecommendations.length, totalInCache: mergedRecommendations.length })
        return newRecommendations
      } else {
        // Non-additive mode: save and return all recommendations
        await StorageRecommendation.save(walletAddress, newRecommendations)
        logger.info('Generated recommendations', { count: newRecommendations.length })
        return newRecommendations
      }

    } catch (error) {
      logger.error('Generation failed', error)
      throw error
    }
  }

  /**
   * Merge existing and new recommendations, avoiding duplicates
   */
  private static mergeRecommendations(existing: Recommendation[], newOnes: Recommendation[]): Recommendation[] {
    const merged = [...existing]
    
    for (const newRec of newOnes) {
      const existingCategory = merged.find(r => r.category.toLowerCase() === newRec.category.toLowerCase())
      
      if (existingCategory) {
        // Add new suggestions to existing category, avoiding duplicates
        for (const newSugg of newRec.suggestions) {
          const isDuplicate = existingCategory.suggestions.some(s => 
            s.url === newSugg.url || s.name.toLowerCase() === newSugg.name.toLowerCase()
          )
          if (!isDuplicate) {
            existingCategory.suggestions.push(newSugg)
          }
        }
      } else {
        // Add new category
        merged.push(newRec)
      }
    }
    
    return merged
  }


  /**
   * Clear wallet cache
   */
  static async clearCache(walletAddress: string): Promise<void> {
    await StorageRecommendation.clear(walletAddress)
  }

  /**
   * Get wallet GraphQL data
   */
  private static async getWalletData(walletAddress: string): Promise<WalletData> {
    try {
      logger.debug('Fetching wallet data', { walletAddress })
      
      const checksumAddress = getAddress(walletAddress)
      
      const triplesQuery = `
        query Query_root($where: triples_bool_exp) {
          triples(where: $where) {
            subject { label }
            predicate { label }
            object { label }
            term_id
            created_at
            positions {
              shares
              created_at
            }
          }
        }
      `
      
      const where = {
        "_and": [
          {
            "positions": {
              "account": {
                "id": {
                  "_eq": checksumAddress
                }
              }
            }
          },
          {
            "subject": {
              "term_id": {
                "_eq": SUBJECT_IDS.I
              }
            }
          }
        ]
      }
      
      const response = await intuitionGraphqlClient.request(triplesQuery, { where })
      
      logger.debug('Found triples', { count: response?.triples?.length || 0 })
      
      return {
        address: walletAddress,
        triples: response?.triples || []
      }
    } catch (error) {
      logger.error('GraphQL failed', error)
      throw error
    }
  }

  /**
   * Generate recommendations with RecommendationAgent (Mastra)
   */
  private static async generateWithAgent(walletData: WalletData): Promise<Recommendation[]> {
    try {
      logger.info('Calling RecommendationAgent for recommendations')

      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            type: 'GENERATE_RECOMMENDATIONS',
            data: walletData
          },
          (response) => {
            if (chrome.runtime.lastError) {
              logger.error('Chrome runtime error', chrome.runtime.lastError)
              reject(new Error(chrome.runtime.lastError.message))
              return
            }

            if (!response) {
              logger.error('No response from background')
              reject(new Error('No response from background script'))
              return
            }

            if (response.success && response.recommendations) {
              logger.info('Received recommendations from agent', { count: response.recommendations.length })
              // Validate and filter recommendations
              const validRecommendations = this.validateRecommendations(response.recommendations)
              resolve(validRecommendations)
            } else {
              logger.error('Agent error', response.error)
              reject(new Error(response.error || 'Failed to generate recommendations'))
            }
          }
        )
      })

    } catch (error) {
      logger.error('Agent generation failed', error)
      throw error
    }
  }

  /**
   * Validate and filter recommendations
   */
  private static validateRecommendations(recommendations: any[]): Recommendation[] {
    return recommendations
      .filter((rec: any) => {
        const isValid = rec.category && rec.suggestions?.length > 0
        if (!isValid) {
          logger.warn('Invalid recommendation', rec)
        }
        return isValid
      })
      .map((rec: any) => {
        const validSuggestions = rec.suggestions
          .filter((s: any) => {
            const isValid = s.name && s.url && s.url.startsWith('http')
            if (!isValid) {
              logger.warn('Invalid suggestion', s)
            }
            return isValid
          })

        logger.debug(`Category "${rec.category}": ${rec.suggestions.length} -> ${validSuggestions.length} valid suggestions`)

        return {
          category: rec.category,
          title: rec.title || 'Similar new projects',
          reason: rec.reason || 'Based on your activity',
          suggestions: validSuggestions
        }
      })
      .filter((rec: Recommendation) => rec.suggestions.length > 0)
  }
}