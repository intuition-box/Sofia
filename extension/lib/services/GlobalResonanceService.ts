/**
 * Global service for managing bento grid data
 * Persists across component mount/unmount cycles to prevent unnecessary reloading
 * Handles complete pipeline: recommendations → bento items → og:images → final display
 */

import { RecommendationService } from './ai/RecommendationService'
import { StorageRecommendation } from '../database/StorageRecommendation'
import type { BentoItem, BentoItemWithImage, BentoState, BentoStateListener } from '../../types/bento'
import type { Recommendation } from './ai/types'

export class GlobalResonanceService {
  private static instance: GlobalResonanceService | null = null
  private state: BentoState = {
    validItems: [],
    isLoading: false,
    error: null,
    lastProcessedHash: null
  }
  private listeners: Set<BentoStateListener> = new Set()
  private currentWallet: string | null = null

  private constructor() {}

  static getInstance(): GlobalResonanceService {
    if (!this.instance) {
      this.instance = new GlobalResonanceService()
    }
    return this.instance
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: BentoStateListener): () => void {
    this.listeners.add(listener)
    // Immediately call with current state
    listener(this.state)
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Update state and notify listeners
   */
  private setState(newState: Partial<BentoState>): void {
    this.state = { ...this.state, ...newState }
    this.listeners.forEach(listener => listener(this.state))
  }

  /**
   * Get current state
   */
  getState(): BentoState {
    return this.state
  }

  /**
   * Transform raw recommendations into bento grid items with size distribution
   */
  private transformRecommendationsToBentoItems(recommendations: Recommendation[]): BentoItem[] {
    return recommendations.flatMap((rec, recIndex) => 
      rec.suggestions.map((suggestion, sugIndex) => {
        const totalIndex = recIndex * 10 + sugIndex
        
        // Bento distribution pour 2 colonnes: 60% tall, 30% mega, 10% small
        let size: 'small' | 'tall' | 'mega'
        const rand = totalIndex % 10
        if (rand < 1) size = 'small'          // 10%
        else if (rand < 7) size = 'tall'      // 60%
        else size = 'mega'                    // 30%
        
        return {
          name: suggestion.name,
          url: suggestion.url,
          category: rec.category,
          size
        }
      })
    )
  }

  /**
   * Initialize service for a specific wallet - loads cached validItems first
   */
  async initializeForWallet(walletAddress: string): Promise<void> {
    if (this.currentWallet === walletAddress && this.state.validItems.length > 0) {
      console.log('🎯 [GlobalResonanceService] Already initialized for wallet:', walletAddress)
      return
    }

    this.currentWallet = walletAddress
    
    // Load existing valid items from IndexedDB
    const cachedValidItems = await StorageRecommendation.loadValidItems(walletAddress)
    
    if (cachedValidItems.length > 0) {
      console.log('💾 [GlobalResonanceService] Loaded', cachedValidItems.length, 'cached items for wallet:', walletAddress)
      this.setState({ 
        validItems: cachedValidItems,
        isLoading: false,
        error: null
      })
    } else {
      console.log('📭 [GlobalResonanceService] No cached items for wallet:', walletAddress)
      this.setState({ 
        validItems: [],
        isLoading: false,
        error: null
      })
    }
  }

  /**
   * Update recommendations data - simplified, persistent approach
   * Call this when new recommendations are generated
   */
  async updateRecommendations(recommendations: Recommendation[], additive: boolean = false): Promise<void> {
    if (!this.currentWallet) {
      console.warn('❌ [GlobalResonanceService] No wallet set, call initializeForWallet first')
      return
    }

    if (recommendations.length === 0) {
      return
    }

    this.setState({ isLoading: true, error: null })

    try {
      // Transform recommendations to bento items
      const bentoItems = this.transformRecommendationsToBentoItems(recommendations)

      // Deduplicate within new items by URL
      const uniqueItems = bentoItems.filter((item, index, self) => 
        index === self.findIndex(t => t.url === item.url)
      )

      console.log('🖼️ [GlobalResonanceService] Processing', recommendations.length, 'recommendations →', uniqueItems.length, 'unique bento items')
      
      // Get existing valid items for reuse
      const existingValidItems = await StorageRecommendation.loadValidItems(this.currentWallet)
      
      // Get og:images for the new items (reusing existing when possible)
      const validSuggestions = await RecommendationService.getSuggestionsWithPreviews(uniqueItems, existingValidItems)
      
      if (additive) {
        // Deduplicate against existing items BEFORE storage
        const uniqueNewItems = await StorageRecommendation.deduplicateAgainstExisting(this.currentWallet, validSuggestions)
        
        // Store only unique new items
        const allValidItems = await StorageRecommendation.appendValidItems(this.currentWallet, uniqueNewItems)
        
        this.setState({ 
          validItems: allValidItems,
          isLoading: false
        })
        
        console.log('✅ [GlobalResonanceService] Added', uniqueNewItems.length, 'new unique items. Total:', allValidItems.length)
      } else {
        // Replace all items
        await StorageRecommendation.saveValidItems(this.currentWallet, validSuggestions)
        
        this.setState({ 
          validItems: validSuggestions,
          isLoading: false
        })
        
        console.log('✅ [GlobalResonanceService] Saved', validSuggestions.length, 'valid items')
      }
      
    } catch (err) {
      console.error('❌ [GlobalResonanceService] Error processing recommendations:', err)
      this.setState({ 
        error: 'Failed to load preview images',
        isLoading: false
      })
    }
  }

  /**
   * Clear cached data (useful for force refresh)
   */
  async clearCache(): Promise<void> {
    if (this.currentWallet) {
      await StorageRecommendation.clear(this.currentWallet)
    }
    this.setState({
      validItems: [],
      error: null,
      lastProcessedHash: null
    })
    this.currentWallet = null
  }

  /**
   * Reset loading state
   */
  resetLoading(): void {
    this.setState({ isLoading: false })
  }
}