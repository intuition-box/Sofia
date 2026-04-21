/**
 * Storage for recommendations persistence in IndexedDB
 */

import type { Recommendation, RecommendationCache } from '../services/ai/types'
import { createServiceLogger } from '../utils/logger'

const logger = createServiceLogger('StorageRecommendation')

const DB_NAME = 'sofia-recommendations'
const DB_VERSION = 2
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

        // Create recommendations store
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

      logger.info('Saved recommendations', { walletAddress })
    } catch (error) {
      logger.error('Save failed', error)
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
        logger.debug('No cache found', { walletAddress })
        return null
      }

      logger.info('Loaded recommendations', { walletAddress })
      return cache.recommendations

    } catch (error) {
      logger.error('Load failed', error)
      return null
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

      logger.info('Cleared cache', { walletAddress })
    } catch (error) {
      logger.error('Clear failed', error)
      throw error
    }
  }
}
