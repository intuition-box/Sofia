/**
 * Storage for recommendations persistence in IndexedDB
 * Simplified compared to the old version
 */

import type { Recommendation, RecommendationCache } from '../services/ai/types'

const DB_NAME = 'sofia-recommendations'
const DB_VERSION = 1
const STORE_NAME = 'recommendations'

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
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'walletAddress' })
          store.createIndex('createdAt', 'createdAt', { unique: false })
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
   * Vérifie si le cache est valide
   */
  static async isValid(walletAddress: string, maxAgeHours: number = 24): Promise<boolean> {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)

      const cache = await new Promise<RecommendationCache | null>((resolve, reject) => {
        const request = store.get(walletAddress)
        request.onsuccess = () => resolve(request.result || null)
        request.onerror = () => reject(request.error)
      })

      if (!cache) return false

      const maxAge = maxAgeHours * 60 * 60 * 1000 // en millisecondes
      const isValid = (Date.now() - cache.createdAt) < maxAge

      console.log(`🕐 [StorageRecommendation] Cache for ${walletAddress} is ${isValid ? 'valid' : 'expired'}`)
      return isValid

    } catch (error) {
      console.error('❌ [StorageRecommendation] Validation failed:', error)
      return false
    }
  }

  /**
   * Supprime le cache d'un wallet
   */
  static async clear(walletAddress: string): Promise<void> {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(walletAddress)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      console.log('🗑️ [StorageRecommendation] Cleared cache for', walletAddress)
    } catch (error) {
      console.error('❌ [StorageRecommendation] Clear failed:', error)
      throw error
    }
  }
}