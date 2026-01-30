/**
 * Main service for recommendations
 * Centralizes all business logic
 */

import { StorageRecommendation } from '../../database/StorageRecommendation'
import { StorageOgImage } from '../../database/StorageOgImage'
import type { Recommendation, BentoSuggestion, WalletData } from './types'
import { intuitionGraphqlClient } from '../../clients/graphql-client'
import { SUBJECT_IDS } from '../../config/constants'
import { getAddress } from 'viem'

export class RecommendationService {
  private static readonly OG_IMAGES_CACHE_HOURS = 24 * 30         // 30 jours

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

  /**
   * Get og:image from URL with persistent cache (NO FALLBACK - if no og:image, site is considered dead)
   */
  static async getOgImage(url: string): Promise<string | null> {
    try {
      // Check persistent cache first
      const isValid = await StorageOgImage.isValid(url, this.OG_IMAGES_CACHE_HOURS)
      if (isValid) {
        const cached = await StorageOgImage.load(url)
        if (cached !== null) {
          console.log('💾 [RecommendationService] Using cached og:image for:', url)
          return cached
        }
      }

      console.log('🖼️ [RecommendationService] Fetching og:image for:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Sofia-Bot/1.0)',
        },
        signal: AbortSignal.timeout(10000) // 10s timeout
      })
      
      if (!response.ok) {
        await StorageOgImage.save(url, null)
        return null
      }
      
      const html = await response.text()
      
      // Look ONLY for og:image meta tag - no fallback
      const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*?)["'][^>]*>/i)
      if (ogImageMatch && ogImageMatch[1]) {
        const ogImage = ogImageMatch[1]
        await StorageOgImage.save(url, ogImage)
        return ogImage
      }
      
      // No og:image = dead site = cache null and return null
      await StorageOgImage.save(url, null)
      return null
      
    } catch (error) {
      console.log(`❌ [RecommendationService] Failed to get og:image for ${url}:`, error)
      await StorageOgImage.save(url, null)
      return null
    }
  }

  /**
   * Get suggestions with og:images (filtered - only sites with og:image)
   * Optimized to reuse existing validItems when possible
   */
  static async getSuggestionsWithPreviews(
    suggestions: { name: string, url: string, category: string, size: 'small' | 'tall' | 'mega' }[], 
    existingValidItems: Array<{ name: string, url: string, category: string, size: 'small' | 'tall' | 'mega', ogImage: string }> = []
  ): Promise<Array<{ name: string, url: string, category: string, size: 'small' | 'tall' | 'mega', ogImage: string }>> {
    const validSuggestions = []
    
    // Create a map of existing valid items for fast lookup
    const existingMap = new Map(existingValidItems.map(item => [item.url, item.ogImage]))
    
    for (const suggestion of suggestions) {
      // Check if we already have this URL with og:image
      const existingOgImage = existingMap.get(suggestion.url)
      
      if (existingOgImage) {
        // Reuse existing og:image
        validSuggestions.push({
          ...suggestion,
          ogImage: existingOgImage
        })
        console.log(`♻️ [RecommendationService] Reusing cached og:image for ${suggestion.url}`)
      } else {
        // Fetch new og:image
        const ogImage = await this.getOgImage(suggestion.url)
        if (ogImage) { // Only add if og:image exists
          validSuggestions.push({
            ...suggestion,
            ogImage
          })
        }
      }
    }
    
    console.log(`✅ [RecommendationService] Filtered ${validSuggestions.length}/${suggestions.length} valid suggestions with og:image (${existingValidItems.length} reused)`)
    return validSuggestions
  }
}