import type { StorageData, StorageKey, StorageOptions, StorageChangeEvent } from '../types'

/**
 * Gestionnaire Chrome Storage API pour données JSON
 * Support sync/local storage avec compression optionnelle
 */
export class ChromeStorageManager {
  private static instance: ChromeStorageManager
  
  static getInstance(): ChromeStorageManager {
    if (!ChromeStorageManager.instance) {
      ChromeStorageManager.instance = new ChromeStorageManager()
    }
    return ChromeStorageManager.instance
  }

  /**
   * Sauvegarder des données dans Chrome Storage
   */
  async set<K extends StorageKey>(
    key: K, 
    value: StorageData[K], 
    options: StorageOptions = {}
  ): Promise<void> {
    // TODO: Implémenter sauvegarde avec compression optionnelle
    const { area = 'local', compress = false } = options
    
    try {
      const data = compress ? this.compress(value) : value
      const storage = area === 'sync' ? chrome.storage.sync : chrome.storage.local
      await storage.set({ [key]: data })
    } catch (error) {
      console.error(`Error saving to storage:`, error)
      throw error
    }
  }

  /**
   * Récupérer des données depuis Chrome Storage
   */
  async get<K extends StorageKey>(
    key: K, 
    options: StorageOptions = {}
  ): Promise<StorageData[K] | null> {
    // TODO: Implémenter récupération avec décompression
    const { area = 'local', compress = false } = options
    
    try {
      const storage = area === 'sync' ? chrome.storage.sync : chrome.storage.local
      const result = await storage.get(key)
      const data = result[key]
      
      if (!data) return null
      
      return compress ? this.decompress(data) : data
    } catch (error) {
      console.error(`Error reading from storage:`, error)
      return null
    }
  }

  /**
   * Supprimer des données
   */
  async remove(key: StorageKey, area: 'sync' | 'local' = 'local'): Promise<void> {
    // TODO: Implémenter suppression
    try {
      await chrome.storage[area].remove(key)
    } catch (error) {
      console.error(`Error removing from storage:`, error)
      throw error
    }
  }

  /**
   * Nettoyer tout le storage
   */
  async clear(area: 'sync' | 'local' = 'local'): Promise<void> {
    // TODO: Implémenter nettoyage
    try {
      await chrome.storage[area].clear()
    } catch (error) {
      console.error(`Error clearing storage:`, error)
      throw error
    }
  }

  /**
   * Écouter les changements de storage
   */
  onChanged(callback: (changes: StorageChangeEvent[]) => void): void {
    // TODO: Implémenter écoute des changements
    chrome.storage.onChanged.addListener((changes, areaName) => {
      const changeEvents: StorageChangeEvent[] = Object.entries(changes).map(
        ([key, change]) => ({
          key: key as StorageKey,
          oldValue: change.oldValue,
          newValue: change.newValue,
          area: areaName as 'sync' | 'local'
        })
      )
      callback(changeEvents)
    })
  }

  /**
   * Compression des données (placeholder)
   */
  private compress(data: any): string {
    // TODO: Implémenter compression JSON
    return JSON.stringify(data)
  }

  /**
   * Décompression des données (placeholder)
   */
  private decompress(data: string): any {
    // TODO: Implémenter décompression
    return JSON.parse(data)
  }
} 