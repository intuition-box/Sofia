/**
 * Storage pour les og:images avec cache persistant
 */

export interface OgImageCache {
  url: string
  ogImage: string | null
  timestamp: number
}

export class StorageOgImage {
  private static readonly DB_NAME = 'sofia-extension'
  private static readonly STORE_NAME = 'og-images'
  private static readonly VERSION = 1

  /**
   * Initialize IndexedDB
   */
  private static async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.VERSION)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'url' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  /**
   * Save og:image to cache
   */
  static async save(url: string, ogImage: string | null): Promise<void> {
    try {
      const db = await this.getDB()
      const transaction = db.transaction([this.STORE_NAME], 'readwrite')
      const store = transaction.objectStore(this.STORE_NAME)
      
      const data: OgImageCache = {
        url,
        ogImage,
        timestamp: Date.now()
      }
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put(data)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
      
      console.log(`💾 [StorageOgImage] Saved og:image for ${url}`)
    } catch (error) {
      console.error('❌ [StorageOgImage] Save failed:', error)
    }
  }

  /**
   * Load og:image from cache
   */
  static async load(url: string): Promise<string | null> {
    try {
      const db = await this.getDB()
      const transaction = db.transaction([this.STORE_NAME], 'readonly')
      const store = transaction.objectStore(this.STORE_NAME)
      
      return new Promise<string | null>((resolve, reject) => {
        const request = store.get(url)
        request.onsuccess = () => {
          const result = request.result as OgImageCache | undefined
          resolve(result?.ogImage || null)
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('❌ [StorageOgImage] Load failed:', error)
      return null
    }
  }

  /**
   * Check if og:image cache is valid
   */
  static async isValid(url: string, expiryHours: number): Promise<boolean> {
    try {
      const db = await this.getDB()
      const transaction = db.transaction([this.STORE_NAME], 'readonly')
      const store = transaction.objectStore(this.STORE_NAME)
      
      return new Promise<boolean>((resolve, reject) => {
        const request = store.get(url)
        request.onsuccess = () => {
          const result = request.result as OgImageCache | undefined
          if (!result) {
            resolve(false)
            return
          }
          
          const now = Date.now()
          const expiryTime = result.timestamp + (expiryHours * 60 * 60 * 1000)
          const isValid = now < expiryTime
          
          console.log(`🕒 [StorageOgImage] Cache for ${url} is ${isValid ? 'valid' : 'expired'}`)
          resolve(isValid)
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('❌ [StorageOgImage] Validation failed:', error)
      return false
    }
  }

  /**
   * Clear cache for specific URL
   */
  static async clear(url: string): Promise<void> {
    try {
      const db = await this.getDB()
      const transaction = db.transaction([this.STORE_NAME], 'readwrite')
      const store = transaction.objectStore(this.STORE_NAME)
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(url)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
      
      console.log(`🗑️ [StorageOgImage] Cleared cache for ${url}`)
    } catch (error) {
      console.error('❌ [StorageOgImage] Clear failed:', error)
    }
  }

  /**
   * Clear all expired cache entries
   */
  static async clearExpired(expiryHours: number): Promise<void> {
    try {
      const db = await this.getDB()
      const transaction = db.transaction([this.STORE_NAME], 'readwrite')
      const store = transaction.objectStore(this.STORE_NAME)
      
      const now = Date.now()
      const expiryTime = now - (expiryHours * 60 * 60 * 1000)
      
      const cursorRequest = store.openCursor()
      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          const data = cursor.value as OgImageCache
          if (data.timestamp < expiryTime) {
            cursor.delete()
          }
          cursor.continue()
        }
      }
      
      console.log(`🧹 [StorageOgImage] Cleared expired cache entries`)
    } catch (error) {
      console.error('❌ [StorageOgImage] Clear expired failed:', error)
    }
  }
}