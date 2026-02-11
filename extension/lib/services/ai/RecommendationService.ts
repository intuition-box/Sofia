/**
 * Main service for recommendations
 * Centralizes all business logic
 */

import { StorageRecommendation } from '../../database/StorageRecommendation'
import type { Recommendation, WalletData } from './types'
import { intuitionGraphqlClient } from '../../clients/graphql-client'
import { SUBJECT_IDS } from '../../config/constants'
import { getAddress } from 'viem'

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
      console.log('🚀 [RecommendationService] Generating recommendations for', walletAddress, additive ? '(additive)' : '(replace)')

      // Check cache first (unless force refresh)
      if (!forceRefresh && !additive) {
        const cached = await StorageRecommendation.load(walletAddress)
        if (cached && cached.length > 0) {
          console.log('📋 [RecommendationService] Using cached recommendations')
          return cached
        }
      }

      // Get wallet data
      const walletData = await this.getWalletData(walletAddress)
      if (!walletData.triples.length) {
        console.log('📭 [RecommendationService] No wallet data found')
        return []
      }

      // Generate with RecommendationAgent
      const newRecommendations = await this.generateWithAgent(walletData)
      
      // Handle additive mode: merge for storage but return only new ones
      if (additive) {
        const existingRecommendations = await StorageRecommendation.load(walletAddress) || []
        const mergedRecommendations = this.mergeRecommendations(existingRecommendations, newRecommendations)
        console.log('🔄 [RecommendationService] Merged', existingRecommendations.length, '+', newRecommendations.length, '=', mergedRecommendations.length, 'recommendations')
        
        // Save merged recommendations to cache
        await StorageRecommendation.save(walletAddress, mergedRecommendations)
        
        // Return ONLY the new recommendations for UI processing
        console.log('✅ [RecommendationService] Generated', newRecommendations.length, 'NEW recommendations (', mergedRecommendations.length, 'total in cache)')
        return newRecommendations
      } else {
        // Non-additive mode: save and return all recommendations
        await StorageRecommendation.save(walletAddress, newRecommendations)
        console.log('✅ [RecommendationService] Generated', newRecommendations.length, 'recommendations')
        return newRecommendations
      }

    } catch (error) {
      console.error('❌ [RecommendationService] Generation failed:', error)
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
      console.log('🔍 [RecommendationService] Fetching wallet data for:', walletAddress)
      
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
      
      console.log('✅ [RecommendationService] Found', response?.triples?.length || 0, 'triples')
      
      return {
        address: walletAddress,
        triples: response?.triples || []
      }
    } catch (error) {
      console.error('❌ [RecommendationService] GraphQL failed:', error)
      throw error
    }
  }

  /**
   * Generate recommendations with RecommendationAgent (Mastra)
   */
  private static async generateWithAgent(walletData: WalletData): Promise<Recommendation[]> {
    try {
      console.log('💎 [RecommendationService] Calling RecommendationAgent for recommendations')

      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            type: 'GENERATE_RECOMMENDATIONS',
            data: walletData
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error('❌ [RecommendationService] Chrome runtime error:', chrome.runtime.lastError)
              reject(new Error(chrome.runtime.lastError.message))
              return
            }

            if (!response) {
              console.error('❌ [RecommendationService] No response from background')
              reject(new Error('No response from background script'))
              return
            }

            if (response.success && response.recommendations) {
              console.log('✅ [RecommendationService] Received', response.recommendations.length, 'recommendations from agent')
              // Validate and filter recommendations
              const validRecommendations = this.validateRecommendations(response.recommendations)
              resolve(validRecommendations)
            } else {
              console.error('❌ [RecommendationService] Agent error:', response.error)
              reject(new Error(response.error || 'Failed to generate recommendations'))
            }
          }
        )
      })

    } catch (error) {
      console.error('❌ [RecommendationService] Agent generation failed:', error)
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
          console.log('❌ [RecommendationService] Invalid recommendation:', rec)
        }
        return isValid
      })
      .map((rec: any) => {
        const validSuggestions = rec.suggestions
          .filter((s: any) => {
            const isValid = s.name && s.url && s.url.startsWith('http')
            if (!isValid) {
              console.log('❌ [RecommendationService] Invalid suggestion:', s)
            }
            return isValid
          })

        console.log(`✅ [RecommendationService] Category "${rec.category}": ${rec.suggestions.length} → ${validSuggestions.length} valid suggestions`)

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