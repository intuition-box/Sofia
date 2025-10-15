/**
 * Main service for recommendations
 * Centralizes all business logic
 */

import { OllamaClient } from './OllamaClient'
import { StorageRecommendation } from '../../database/StorageRecommendation'
import type { Recommendation, BentoSuggestion, OllamaMessage, WalletData } from './types'
import { intuitionGraphqlClient } from '../../clients/graphql-client'
import { SUBJECT_IDS } from '../../config/constants'
import { getAddress } from 'viem'

export class RecommendationService {
  private static readonly CACHE_EXPIRY_HOURS = 24

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
        const cached = await this.getCachedRecommendations(walletAddress)
        if (cached.length > 0) {
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

      // Generate with Ollama
      const newRecommendations = await this.generateWithOllama(walletData)
      
      // Merge with existing recommendations if additive
      let finalRecommendations = newRecommendations
      if (additive) {
        const existingRecommendations = await this.getCachedRecommendations(walletAddress)
        finalRecommendations = this.mergeRecommendations(existingRecommendations, newRecommendations)
        console.log('🔄 [RecommendationService] Merged', existingRecommendations.length, '+', newRecommendations.length, '=', finalRecommendations.length, 'recommendations')
      }
      
      // Save to cache
      await StorageRecommendation.save(walletAddress, finalRecommendations)

      console.log('✅ [RecommendationService] Generated', finalRecommendations.length, 'recommendations')
      return finalRecommendations

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
   * Get cached recommendations
   */
  static async getCachedRecommendations(walletAddress: string): Promise<Recommendation[]> {
    try {
      const isValid = await StorageRecommendation.isValid(walletAddress, this.CACHE_EXPIRY_HOURS)
      if (!isValid) return []

      const cached = await StorageRecommendation.load(walletAddress)
      return cached || []
    } catch (error) {
      console.error('❌ [RecommendationService] Cache load failed:', error)
      return []
    }
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
   * Generate recommendations with Ollama (SINGLE CALL)
   */
  private static async generateWithOllama(walletData: WalletData): Promise<Recommendation[]> {
    try {
      console.log('🤖 [RecommendationService] Calling Ollama for recommendations')

      const messages: OllamaMessage[] = [
        {
          role: 'system',
          content: `You are a Web3 recommendation expert. Analyze wallet data and respond ONLY with valid JSON in this exact format:

{
  "recommendations": [
    {
      "category": "Category name",
      "title": "Similar new projects", 
      "reason": "Reason based on data",
      "suggestions": [
        {"name": "Project name", "url": "https://..."},
        {"name": "Project name", "url": "https://..."}
      ]
    }
  ]
}

IMPORTANT: Respond ONLY with JSON, nothing else.`
        },
        {
          role: 'user',
          content: `Analyze wallet ${walletData.address} and generate recommendations for NEW similar projects:

Data: ${walletData.triples.length} blockchain activities
Projects followed: ${JSON.stringify(walletData.triples.slice(0, 5), null, 2)}

Instructions:
1. Identify interest categories
2. Do NOT suggest same projects already followed
3. Give 3-5 new similar projects per category
4. Provide real and accessible URLs`
        }
      ]

      const response = await OllamaClient.chat(messages)
      return this.parseOllamaResponse(response)

    } catch (error) {
      console.error('❌ [RecommendationService] Ollama generation failed:', error)
      throw error
    }
  }

  /**
   * Parse Ollama response (simplified logic)
   */
  private static parseOllamaResponse(response: string): Recommendation[] {
    try {
      console.log('🔧 [RecommendationService] Parsing Ollama response')
      
      // Clean response
      let cleanResponse = response.trim()
      
      // Extract JSON
      const jsonStart = cleanResponse.indexOf('{')
      const jsonEnd = cleanResponse.lastIndexOf('}') + 1
      
      if (jsonStart === -1 || jsonEnd === 0) {
        console.warn('❌ No JSON found in response')
        return []
      }
      
      const jsonString = cleanResponse.substring(jsonStart, jsonEnd)
      const parsed = JSON.parse(jsonString)
      
      // Check structure
      const recommendations = parsed.recommendations || []
      
      // Filter and validate
      const validRecommendations = recommendations
        .filter((rec: any) => rec.category && rec.suggestions?.length > 0)
        .map((rec: any) => ({
          category: rec.category,
          title: rec.title || 'Similar new projects',
          reason: rec.reason || 'Based on your activity',
          suggestions: rec.suggestions
            .filter((s: any) => s.name && s.url && s.url.startsWith('http'))
            .slice(0, 5) // Max 5 suggestions per category
        }))
        .filter((rec: Recommendation) => rec.suggestions.length > 0)
      
      console.log('✅ [RecommendationService] Parsed', validRecommendations.length, 'valid recommendations')
      return validRecommendations
      
    } catch (error) {
      console.error('❌ [RecommendationService] Parse failed:', error)
      return []
    }
  }
}