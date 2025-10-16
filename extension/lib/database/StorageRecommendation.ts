/**
 * Storage for recommendations and validated bento items persistence in IndexedDB
 * Stores both raw recommendations and final validated items with og:images
 */

import type { Recommendation, RecommendationCache } from '../services/ai/types'
import type { BentoItemWithImage } from '../../types/bento'

const DB_NAME = 'sofia-recommendations'
const DB_VERSION = 2  // Incremented for new schema
const STORE_NAME = 'recommendations'
const VALID_ITEMS_STORE = 'validItems'

interface ValidItemsCache {
  walletAddress: string
  validItems: BentoItemWithImage[]
  createdAt: number
}

export class StorageRecommendation {
  private static db: IDBDatabase | null = null

  /**
   * Initialise la base de données
   */
  private static async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create recommendations store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'walletAddress' })
          store.createIndex('createdAt', 'createdAt', { unique: false })
        }
        
        // Create validItems store
        if (!db.objectStoreNames.contains(VALID_ITEMS_STORE)) {
          const validStore = db.createObjectStore(VALID_ITEMS_STORE, { keyPath: 'walletAddress' })
          validStore.createIndex('createdAt', 'createdAt', { unique: false })
        }
      }
    })
  }

  /**
   * Sauvegarde les recommandations
   */
  static async save(walletAddress: string, recommendations: Recommendation[]): Promise<void> {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      const cache: RecommendationCache = {
        walletAddress,
        recommendations,
        createdAt: Date.now()
      }

      await new Promise<void>((resolve, reject) => {
        const request = store.put(cache)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      console.log('✅ [StorageRecommendation] Saved recommendations for', walletAddress)
    } catch (error) {
      console.error('❌ [StorageRecommendation] Save failed:', error)
      throw error
    }
  }

  /**
   * Charge les recommandations
   */
  static async load(walletAddress: string): Promise<Recommendation[] | null> {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)

      const cache = await new Promise<RecommendationCache | null>((resolve, reject) => {
        const request = store.get(walletAddress)
        request.onsuccess = () => resolve(request.result || null)
        request.onerror = () => reject(request.error)
      })

      if (!cache) {
        console.log('📭 [StorageRecommendation] No cache found for', walletAddress)
        return null
      }

      console.log('✅ [StorageRecommendation] Loaded recommendations for', walletAddress)
      return cache.recommendations

    } catch (error) {
      console.error('❌ [StorageRecommendation] Load failed:', error)
      return null
    }
  }


  /**
   * Supprime le cache d'un wallet
   */
  static async clear(walletAddress: string): Promise<void> {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([STORE_NAME, VALID_ITEMS_STORE], 'readwrite')
      const recommendationsStore = transaction.objectStore(STORE_NAME)
      const validItemsStore = transaction.objectStore(VALID_ITEMS_STORE)

      await Promise.all([
        new Promise<void>((resolve, reject) => {
          const request = recommendationsStore.delete(walletAddress)
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        }),
        new Promise<void>((resolve, reject) => {
          const request = validItemsStore.delete(walletAddress)
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        })
      ])

      console.log('🗑️ [StorageRecommendation] Cleared cache for', walletAddress)
    } catch (error) {
      console.error('❌ [StorageRecommendation] Clear failed:', error)
      throw error
    }
  }

  // ===== VALID ITEMS METHODS =====

  /**
   * Sauvegarde les items validés avec og:images
   */
  static async saveValidItems(walletAddress: string, validItems: BentoItemWithImage[]): Promise<void> {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([VALID_ITEMS_STORE], 'readwrite')
      const store = transaction.objectStore(VALID_ITEMS_STORE)

      const cache: ValidItemsCache = {
        walletAddress,
        validItems,
        createdAt: Date.now()
      }

      await new Promise<void>((resolve, reject) => {
        const request = store.put(cache)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      console.log('✅ [StorageRecommendation] Saved', validItems.length, 'valid items for', walletAddress)
    } catch (error) {
      console.error('❌ [StorageRecommendation] Save valid items failed:', error)
      throw error
    }
  }

  /**
   * Charge les items validés
   */
  static async loadValidItems(walletAddress: string): Promise<BentoItemWithImage[]> {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([VALID_ITEMS_STORE], 'readonly')
      const store = transaction.objectStore(VALID_ITEMS_STORE)

      const cache = await new Promise<ValidItemsCache | null>((resolve, reject) => {
        const request = store.get(walletAddress)
        request.onsuccess = () => resolve(request.result || null)
        request.onerror = () => reject(request.error)
      })

      if (!cache) {
        console.log('📭 [StorageRecommendation] No valid items found for', walletAddress)
        return []
      }

      console.log('✅ [StorageRecommendation] Loaded', cache.validItems.length, 'valid items for', walletAddress)
      return cache.validItems

    } catch (error) {
      console.error('❌ [StorageRecommendation] Load valid items failed:', error)
      return []
    }
  }

  /**
   * Ajoute de nouveaux items validés aux existants (assume que la déduplication a déjà été faite)
   */
  static async appendValidItems(walletAddress: string, uniqueNewItems: BentoItemWithImage[]): Promise<BentoItemWithImage[]> {
    try {
      if (uniqueNewItems.length === 0) {
        console.log('🔄 [StorageRecommendation] No new items to add')
        const existing = await this.loadValidItems(walletAddress)
        return existing
      }

      const existingItems = await this.loadValidItems(walletAddress)
      const mergedItems = [...uniqueNewItems, ...existingItems] // Nouveaux items en premier
      await this.saveValidItems(walletAddress, mergedItems)
      
      console.log('✅ [StorageRecommendation] Added', uniqueNewItems.length, 'new items. Total:', mergedItems.length)
      return mergedItems
    } catch (error) {
      console.error('❌ [StorageRecommendation] Append valid items failed:', error)
      throw error
    }
  }

  /**
   * Déduplique les nouveaux items contre les existants (par URL)
   */
  static async deduplicateAgainstExisting(walletAddress: string, newItems: BentoItemWithImage[]): Promise<BentoItemWithImage[]> {
    try {
      const existingItems = await this.loadValidItems(walletAddress)
      const existingUrls = new Set(existingItems.map(item => item.url))
      
      const uniqueNewItems = newItems.filter(item => !existingUrls.has(item.url))
      
      console.log('🔄 [StorageRecommendation] Deduplication:', newItems.length, 'new items →', uniqueNewItems.length, 'unique items')
      return uniqueNewItems
    } catch (error) {
      console.error('❌ [StorageRecommendation] Deduplication failed:', error)
      return newItems // Fallback to all items if deduplication fails
    }
  }
}