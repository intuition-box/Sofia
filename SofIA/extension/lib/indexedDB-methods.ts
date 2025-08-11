/**
 * Specialized methods for SofIA IndexedDB operations
 * High-level API for managing different data types
 */

import sofiaDB, { STORES, type ElizaRecord, type NavigationRecord, type ProfileRecord, type SettingsRecord, type SearchRecord } from './indexedDB'
import type { ParsedSofiaMessage, Message } from '~components/pages/graph-tabs/types'
import type { VisitData } from '~types/history'
import type { ExtensionSettings } from '~types/storage'

/**
 * Eliza Data Methods
 */
export class ElizaDataService {
  /**
   * Store a message from Eliza
   */
  static async storeMessage(message: Message, messageId?: string): Promise<number> {
    const record: ElizaRecord = {
      messageId: messageId || `msg_${Date.now()}_${Math.random()}`,
      content: message,
      timestamp: Date.now(),
      type: 'message'
    }
    
    const result = await sofiaDB.add(STORES.ELIZA_DATA, record)
    console.log('💬 Eliza message stored:', messageId)
    return result as number
  }

  /**
   * Store a parsed Sofia message with triplets
   */
  static async storeParsedMessage(parsedMessage: ParsedSofiaMessage, messageId?: string): Promise<number> {
    const record: ElizaRecord = {
      messageId: messageId || `parsed_${Date.now()}_${Math.random()}`,
      content: parsedMessage,
      timestamp: Date.now(),
      type: 'parsed_message'
    }
    
    const result = await sofiaDB.add(STORES.ELIZA_DATA, record)
    console.log('🧠 Parsed Sofia message stored:', messageId)
    return result as number
  }

  /**
   * Get all Eliza messages
   */
  static async getAllMessages(): Promise<ElizaRecord[]> {
    return await sofiaDB.getAll<ElizaRecord>(STORES.ELIZA_DATA)
  }

  /**
   * Get messages by type
   */
  static async getMessagesByType(type: 'message' | 'parsed_message' | 'triplet'): Promise<ElizaRecord[]> {
    return await sofiaDB.getAllByIndex<ElizaRecord>(STORES.ELIZA_DATA, 'type', type)
  }

  /**
   * Get recent messages (last N messages)
   */
  static async getRecentMessages(limit: number = 50): Promise<ElizaRecord[]> {
    const allMessages = await sofiaDB.getAll<ElizaRecord>(STORES.ELIZA_DATA)
    return allMessages
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  /**
   * Delete old messages (older than X days)
   */
  static async deleteOldMessages(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000)
    const allMessages = await sofiaDB.getAll<ElizaRecord>(STORES.ELIZA_DATA)
    
    let deletedCount = 0
    for (const message of allMessages) {
      if (message.timestamp < cutoffDate && message.id) {
        await sofiaDB.delete(STORES.ELIZA_DATA, message.id)
        deletedCount++
      }
    }
    
    console.log(`🧹 Deleted ${deletedCount} old Eliza messages`)
    return deletedCount
  }

  /**
   * Clear all Eliza data
   */
  static async clearAll(): Promise<void> {
    await sofiaDB.clear(STORES.ELIZA_DATA)
    console.log('🗑️ All Eliza data cleared')
  }
}

/**
 * Navigation Data Methods
 */
export class NavigationDataService {
  /**
   * Store or update visit data for a URL
   */
  static async storeVisitData(url: string, visitData: VisitData): Promise<number> {
    // Check if URL already exists
    const existing = await sofiaDB.getAllByIndex<NavigationRecord>(STORES.NAVIGATION_DATA, 'url', url)
    
    const record: NavigationRecord = {
      url,
      visitData,
      lastUpdated: Date.now()
    }

    let result: IDBValidKey
    if (existing.length > 0) {
      // Update existing record
      record.id = existing[0].id
      result = await sofiaDB.put(STORES.NAVIGATION_DATA, record)
    } else {
      // Create new record
      result = await sofiaDB.add(STORES.NAVIGATION_DATA, record)
    }
    
    console.log('📊 Visit data stored for:', url)
    return result as number
  }

  /**
   * Get visit data for a specific URL
   */
  static async getVisitData(url: string): Promise<NavigationRecord | null> {
    const records = await sofiaDB.getAllByIndex<NavigationRecord>(STORES.NAVIGATION_DATA, 'url', url)
    return records.length > 0 ? records[0] : null
  }

  /**
   * Get all navigation data
   */
  static async getAllVisitData(): Promise<NavigationRecord[]> {
    return await sofiaDB.getAll<NavigationRecord>(STORES.NAVIGATION_DATA)
  }

  /**
   * Get most visited pages
   */
  static async getMostVisited(limit: number = 10): Promise<NavigationRecord[]> {
    const allData = await sofiaDB.getAll<NavigationRecord>(STORES.NAVIGATION_DATA)
    return allData
      .sort((a, b) => b.visitData.visitCount - a.visitData.visitCount)
      .slice(0, limit)
  }

  /**
   * Get recent visits
   */
  static async getRecentVisits(limit: number = 20): Promise<NavigationRecord[]> {
    const allData = await sofiaDB.getAll<NavigationRecord>(STORES.NAVIGATION_DATA)
    return allData
      .sort((a, b) => b.visitData.lastVisitTime - a.visitData.lastVisitTime)
      .slice(0, limit)
  }

  /**
   * Clear navigation data
   */
  static async clearAll(): Promise<void> {
    await sofiaDB.clear(STORES.NAVIGATION_DATA)
    console.log('🗑️ All navigation data cleared')
  }
}

/**
 * User Profile Methods
 */
export class UserProfileService {
  /**
   * Save user profile data
   */
  static async saveProfile(profilePhoto?: string, bio?: string, profileUrl?: string): Promise<void> {
    // Get existing profile or create new one
    let profile = await sofiaDB.get<ProfileRecord>(STORES.USER_PROFILE, 'profile')
    
    if (!profile) {
      profile = {
        id: 'profile',
        bio: bio || '',
        profileUrl: profileUrl || 'https://sofia.network/profile/username',
        lastUpdated: Date.now()
      }
    }

    // Update provided fields
    if (profilePhoto !== undefined) profile.profilePhoto = profilePhoto
    if (bio !== undefined) profile.bio = bio
    if (profileUrl !== undefined) profile.profileUrl = profileUrl
    profile.lastUpdated = Date.now()

    await sofiaDB.put(STORES.USER_PROFILE, profile)
    console.log('👤 User profile saved')
  }

  /**
   * Get user profile data
   */
  static async getProfile(): Promise<ProfileRecord | null> {
    const profile = await sofiaDB.get<ProfileRecord>(STORES.USER_PROFILE, 'profile')
    return profile || null
  }

  /**
   * Update profile photo
   */
  static async updateProfilePhoto(photoData: string): Promise<void> {
    await this.saveProfile(photoData)
    console.log('📷 Profile photo updated')
  }

  /**
   * Update bio
   */
  static async updateBio(bio: string): Promise<void> {
    await this.saveProfile(undefined, bio)
    console.log('📝 Bio updated')
  }

  /**
   * Update profile URL
   */
  static async updateProfileUrl(url: string): Promise<void> {
    await this.saveProfile(undefined, undefined, url)
    console.log('🔗 Profile URL updated')
  }
}

/**
 * User Settings Methods
 */
export class UserSettingsService {
  /**
   * Save user settings
   */
  static async saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
    // Get existing settings or create default
    let currentSettings = await sofiaDB.get<SettingsRecord>(STORES.USER_SETTINGS, 'settings')
    
    if (!currentSettings) {
      currentSettings = {
        id: 'settings',
        settings: {
          theme: 'auto',
          language: 'en',
          notifications: true,
          autoBackup: true,
          debugMode: false,
          isTrackingEnabled: true
        },
        lastUpdated: Date.now()
      }
    }

    // Update provided settings
    currentSettings.settings = { ...currentSettings.settings, ...settings }
    currentSettings.lastUpdated = Date.now()

    await sofiaDB.put(STORES.USER_SETTINGS, currentSettings)
    console.log('⚙️ User settings saved:', settings)
  }

  /**
   * Get user settings
   */
  static async getSettings(): Promise<ExtensionSettings> {
    const record = await sofiaDB.get<SettingsRecord>(STORES.USER_SETTINGS, 'settings')
    
    if (!record) {
      // Return default settings
      const defaultSettings: ExtensionSettings = {
        theme: 'auto',
        language: 'en',
        notifications: true,
        autoBackup: true,
        debugMode: false,
        isTrackingEnabled: true
      }
      
      // Save default settings
      await this.saveSettings(defaultSettings)
      return defaultSettings
    }
    
    return record.settings
  }

  /**
   * Update specific setting
   */
  static async updateSetting<K extends keyof ExtensionSettings>(
    key: K, 
    value: ExtensionSettings[K]
  ): Promise<void> {
    await this.saveSettings({ [key]: value } as Partial<ExtensionSettings>)
    console.log(`⚙️ Setting updated: ${key} = ${value}`)
  }
}

/**
 * Search History Methods
 */
export class SearchHistoryService {
  /**
   * Add search query to history
   */
  static async addSearch(query: string, results?: any[]): Promise<number> {
    // Don't store empty queries
    if (!query.trim()) return 0

    // Check if query already exists recently
    const recentSearches = await this.getRecentSearches(10)
    const exists = recentSearches.find(s => s.query.toLowerCase() === query.toLowerCase())
    
    if (exists && exists.id) {
      // Update existing search timestamp
      const updatedRecord: SearchRecord = {
        ...exists,
        timestamp: Date.now(),
        results: results || exists.results
      }
      await sofiaDB.put(STORES.SEARCH_HISTORY, updatedRecord)
      return exists.id
    } else {
      // Add new search
      const record: SearchRecord = {
        query: query.trim(),
        timestamp: Date.now(),
        results
      }
      
      const result = await sofiaDB.add(STORES.SEARCH_HISTORY, record)
      console.log('🔍 Search query added to history:', query)
      return result as number
    }
  }

  /**
   * Get recent search queries
   */
  static async getRecentSearches(limit: number = 20): Promise<SearchRecord[]> {
    const allSearches = await sofiaDB.getAll<SearchRecord>(STORES.SEARCH_HISTORY)
    return allSearches
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  /**
   * Get last search query
   */
  static async getLastSearch(): Promise<string | null> {
    const recent = await this.getRecentSearches(1)
    return recent.length > 0 ? recent[0].query : null
  }

  /**
   * Search in history
   */
  static async searchInHistory(searchTerm: string): Promise<SearchRecord[]> {
    const allSearches = await sofiaDB.getAll<SearchRecord>(STORES.SEARCH_HISTORY)
    return allSearches.filter(record => 
      record.query.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  /**
   * Clear search history
   */
  static async clearHistory(): Promise<void> {
    await sofiaDB.clear(STORES.SEARCH_HISTORY)
    console.log('🗑️ Search history cleared')
  }

  /**
   * Delete old searches (older than X days)
   */
  static async deleteOldSearches(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000)
    const allSearches = await sofiaDB.getAll<SearchRecord>(STORES.SEARCH_HISTORY)
    
    let deletedCount = 0
    for (const search of allSearches) {
      if (search.timestamp < cutoffDate && search.id) {
        await sofiaDB.delete(STORES.SEARCH_HISTORY, search.id)
        deletedCount++
      }
    }
    
    console.log(`🧹 Deleted ${deletedCount} old search queries`)
    return deletedCount
  }
}

// Export all services
export const elizaDataService = ElizaDataService
export const navigationDataService = NavigationDataService  
export const userProfileService = UserProfileService
export const userSettingsService = UserSettingsService
export const searchHistoryService = SearchHistoryService