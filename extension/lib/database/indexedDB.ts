/**
 * IndexedDB service for SofIA extension
 * Manages local storage of triplets, navigation data, user profile, and settings
 */

import { createServiceLogger } from '../utils/logger'

// Re-export all record types from centralized types
export type {
  TripletsRecord,
  NavigationRecord,
  ProfileRecord,
  SettingsRecord,
  SearchRecord,
  BookmarkListRecord,
  BookmarkedTripletRecord,
  RecommendationRecord,
  IntentionGroupRecord,
  GroupUrlRecord,
  PredicateChangeRecord,
  UserXPRecord
} from '../../types/database'

const logger = createServiceLogger('IndexedDB')

// Database configuration
const DB_NAME = 'sofia-extension-db'
const DB_VERSION = 8  // Incremented to rename ELIZA_DATA to TRIPLETS_DATA

// Object store names
export const STORES = {
  TRIPLETS_DATA: 'triplets_data',
  NAVIGATION_DATA: 'navigation_data',
  USER_PROFILE: 'user_profile',
  USER_SETTINGS: 'user_settings',
  SEARCH_HISTORY: 'search_history',
  BOOKMARK_LISTS: 'bookmark_lists',
  BOOKMARKED_TRIPLETS: 'bookmarked_triplets',
  RECOMMENDATIONS: 'recommendations',
  INTENTION_GROUPS: 'intention_groups',
  USER_XP: 'user_xp'
} as const

/**
 * IndexedDB Database Service
 */
export class SofiaIndexedDB {
  private db: IDBDatabase | null = null
  private dbPromise: Promise<IDBDatabase> | null = null

  /**
   * Initialize the database
   */
  async init(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db
    }

    if (this.dbPromise) {
      return this.dbPromise
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        logger.error('Error opening IndexedDB', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        logger.info('IndexedDB initialized successfully')
        resolve(request.result)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        this.createObjectStores(db)
      }
    })

    return this.dbPromise
  }

  /**
   * Create object stores and indexes
   */
  private createObjectStores(db: IDBDatabase): void {
    logger.debug('Creating IndexedDB object stores')

    // Triplets data store
    if (!db.objectStoreNames.contains(STORES.TRIPLETS_DATA)) {
      const tripletsStore = db.createObjectStore(STORES.TRIPLETS_DATA, {
        keyPath: 'id',
        autoIncrement: true
      })
      tripletsStore.createIndex('messageId', 'messageId', { unique: true })
      tripletsStore.createIndex('timestamp', 'timestamp', { unique: false })
      tripletsStore.createIndex('type', 'type', { unique: false })
    }

    // Navigation data store
    if (!db.objectStoreNames.contains(STORES.NAVIGATION_DATA)) {
      const navStore = db.createObjectStore(STORES.NAVIGATION_DATA, {
        keyPath: 'id',
        autoIncrement: true
      })
      navStore.createIndex('url', 'url', { unique: false })
      navStore.createIndex('lastUpdated', 'lastUpdated', { unique: false })
      navStore.createIndex('visitCount', 'visitData.visitCount', { unique: false })
    }

    // User profile store
    if (!db.objectStoreNames.contains(STORES.USER_PROFILE)) {
      const profileStore = db.createObjectStore(STORES.USER_PROFILE, {
        keyPath: 'id'
      })
      profileStore.createIndex('lastUpdated', 'lastUpdated', { unique: false })
    }

    // User settings store
    if (!db.objectStoreNames.contains(STORES.USER_SETTINGS)) {
      const settingsStore = db.createObjectStore(STORES.USER_SETTINGS, {
        keyPath: 'id'
      })
      settingsStore.createIndex('lastUpdated', 'lastUpdated', { unique: false })
    }

    // Search history store
    if (!db.objectStoreNames.contains(STORES.SEARCH_HISTORY)) {
      const searchStore = db.createObjectStore(STORES.SEARCH_HISTORY, {
        keyPath: 'id',
        autoIncrement: true
      })
      searchStore.createIndex('timestamp', 'timestamp', { unique: false })
      searchStore.createIndex('query', 'query', { unique: false })
    }

    // Bookmark lists store
    if (!db.objectStoreNames.contains(STORES.BOOKMARK_LISTS)) {
      const bookmarkListsStore = db.createObjectStore(STORES.BOOKMARK_LISTS, {
        keyPath: 'id'
      })
      bookmarkListsStore.createIndex('name', 'name', { unique: false })
      bookmarkListsStore.createIndex('createdAt', 'createdAt', { unique: false })
      bookmarkListsStore.createIndex('updatedAt', 'updatedAt', { unique: false })
    }

    // Bookmarked triplets store
    if (!db.objectStoreNames.contains(STORES.BOOKMARKED_TRIPLETS)) {
      const bookmarkedTripletsStore = db.createObjectStore(STORES.BOOKMARKED_TRIPLETS, {
        keyPath: 'id'
      })
      bookmarkedTripletsStore.createIndex('sourceType', 'sourceType', { unique: false })
      bookmarkedTripletsStore.createIndex('sourceId', 'sourceId', { unique: false })
      bookmarkedTripletsStore.createIndex('addedAt', 'addedAt', { unique: false })
    }

    // Recommendations store
    if (!db.objectStoreNames.contains(STORES.RECOMMENDATIONS)) {
      const recommendationsStore = db.createObjectStore(STORES.RECOMMENDATIONS, {
        keyPath: 'walletAddress'
      })
      recommendationsStore.createIndex('timestamp', 'timestamp', { unique: false })
      recommendationsStore.createIndex('lastUpdated', 'lastUpdated', { unique: false })
    }

    // 🆕 Intention Groups store (groupes de domaines persistants)
    if (!db.objectStoreNames.contains(STORES.INTENTION_GROUPS)) {
      const intentionGroupsStore = db.createObjectStore(STORES.INTENTION_GROUPS, {
        keyPath: 'id'  // = domain
      })
      intentionGroupsStore.createIndex('domain', 'domain', { unique: true })
      intentionGroupsStore.createIndex('level', 'level', { unique: false })
      intentionGroupsStore.createIndex('createdAt', 'createdAt', { unique: false })
      intentionGroupsStore.createIndex('updatedAt', 'updatedAt', { unique: false })
    }

    // 🆕 User XP store (XP global utilisateur)
    if (!db.objectStoreNames.contains(STORES.USER_XP)) {
      db.createObjectStore(STORES.USER_XP, { keyPath: 'id' })
    }

    logger.info('Object stores created successfully')
  }

  /**
   * Generic method to add data to a store
   */
  async add<T>(storeName: string, data: T): Promise<IDBValidKey> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.add(data)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Generic method to put (update or insert) data to a store
   */
  async put<T>(storeName: string, data: T): Promise<IDBValidKey> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(data)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Generic method to get data from a store
   */
  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Generic method to get all data from a store
   */
  async getAll<T>(storeName: string, query?: IDBValidKey | IDBKeyRange): Promise<T[]> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll(query)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Generic method to delete data from a store
   */
  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Clear all data from a store
   */
  async clear(storeName: string): Promise<void> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get data using an index
   */
  async getByIndex<T>(
    storeName: string, 
    indexName: string, 
    key: IDBValidKey
  ): Promise<T | undefined> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const index = store.index(indexName)
      const request = index.get(key)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get all data using an index
   */
  async getAllByIndex<T>(
    storeName: string, 
    indexName: string, 
    query?: IDBValidKey | IDBKeyRange
  ): Promise<T[]> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const index = store.index(indexName)
      const request = index.getAll(query)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Count records in a store
   */
  async count(storeName: string, query?: IDBValidKey | IDBKeyRange): Promise<number> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.count(query)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
      this.dbPromise = null
      logger.info('IndexedDB connection closed')
    }
  }

  /**
   * Delete the entire database
   */
  static async deleteDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME)
      
      request.onsuccess = () => {
        logger.info('Database deleted successfully')
        resolve()
      }
      
      request.onerror = () => {
        logger.error('Error deleting database', request.error)
        reject(request.error)
      }
    })
  }
}

// Singleton instance
export const sofiaDB = new SofiaIndexedDB()

// Export default instance
export default sofiaDB