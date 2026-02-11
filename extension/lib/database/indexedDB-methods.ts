/**
 * Specialized methods for SofIA IndexedDB operations
 */

import sofiaDB, { STORES, type TripletsRecord, type NavigationRecord, type ProfileRecord, type SettingsRecord, type SearchRecord, type RecommendationRecord, type IntentionGroupRecord, type UserXPRecord } from './indexedDB'
import { createServiceLogger } from '../utils/logger'
import { MessageBus } from '../services/MessageBus'
import type { ParsedSofiaMessage, Message, Triplet } from '~types/messages'
import { parseSofiaMessage } from '../utils/parseSofiaMessage'
import type { VisitData } from '~types/history'
import type { ExtensionSettings } from '~types/storage'
import type { BookmarkList, BookmarkedTriplet } from '~types/bookmarks'

const logger = createServiceLogger('IndexedDB')

/**
 * Triplets Data Methods
 */
export class TripletsDataService {
  /**
   * Store a message - only store if parsing succeeds
   */
  static async storeMessage(message: Message, messageId?: string): Promise<number> {
    // Try to parse the message first
    const parsed = parseSofiaMessage(message.content.text, message.created_at)
    if (parsed && parsed.triplets.length > 0) {
      logger.debug(`Parsed message with ${parsed.triplets.length} triplets - storing only parsed version`)
      return await this.storeParsedMessage(parsed, messageId)
    } else {
      logger.warn('Message could not be parsed or has no triplets - skipping storage')
      return 0
    }
  }



  /**
   * Store a parsed Sofia message with triplets
   */
  static async storeParsedMessage(parsedMessage: ParsedSofiaMessage, messageId?: string): Promise<number> {
    const record: TripletsRecord = {
      messageId: messageId || `parsed_${Date.now()}_${Math.random()}`,
      content: parsedMessage,
      timestamp: Date.now(),
      type: 'parsed_message'
    }

    const result = await sofiaDB.add(STORES.TRIPLETS_DATA, record)
    logger.info('Parsed Sofia message stored', { messageId })

    // Note: Badge update is handled differently based on context:
    // - OAuth: Direct call to updateEchoBadge in TripletExtractor
    // - Other sources: Use chrome.runtime.sendMessage({ type: 'UPDATE_ECHO_BADGE' })

    return result as number
  }

  /**
   * Get all triplet records
   */
  static async getAllMessages(): Promise<TripletsRecord[]> {
    return await sofiaDB.getAll<TripletsRecord>(STORES.TRIPLETS_DATA)
  }

  /**
   * Get messages by type
   */
  static async getMessagesByType(type: 'message' | 'parsed_message' | 'triplet'): Promise<TripletsRecord[]> {
    return await sofiaDB.getAllByIndex<TripletsRecord>(STORES.TRIPLETS_DATA, 'type', type)
  }

  /**
   * Get recent messages (last N messages)
   */
  static async getRecentMessages(limit: number = 50): Promise<TripletsRecord[]> {
    const allMessages = await sofiaDB.getAll<TripletsRecord>(STORES.TRIPLETS_DATA)
    return allMessages
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  /**
   * Delete old messages (older than X days)
   */
  static async deleteOldMessages(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000)
    const allMessages = await sofiaDB.getAll<TripletsRecord>(STORES.TRIPLETS_DATA)
    
    let deletedCount = 0
    for (const message of allMessages) {
      if (message.timestamp < cutoffDate && message.id) {
        await sofiaDB.delete(STORES.TRIPLETS_DATA, message.id)
        deletedCount++
      }
    }
    
    logger.info(`Deleted ${deletedCount} old triplet records`)
    return deletedCount
  }

  /**
   * Store triplet states for EchoesTab persistence
   */
  static async storeTripletStates(tripletStates: any[]): Promise<number> {
    // Remove existing triplet states first
    const existing = await sofiaDB.getAllByIndex<TripletsRecord>(STORES.TRIPLETS_DATA, 'messageId', 'echoesTab_triplet_states')
    for (const record of existing) {
      if (record.id) {
        await sofiaDB.delete(STORES.TRIPLETS_DATA, record.id)
      }
    }
    
    // Store new triplet states
    const record: TripletsRecord = {
      messageId: 'echoesTab_triplet_states',
      content: tripletStates,
      timestamp: Date.now(),
      type: 'triplet'
    }
    
    const result = await sofiaDB.put(STORES.TRIPLETS_DATA, record)
    logger.info('EchoesTab triplet states persisted', { count: tripletStates.length })
    return result as number
  }

  /**
   * Load triplet states for EchoesTab
   */
  static async loadTripletStates(): Promise<any[]> {
    const records = await sofiaDB.getAllByIndex<TripletsRecord>(STORES.TRIPLETS_DATA, 'messageId', 'echoesTab_triplet_states')
    if (records.length > 0 && records[0].content) {
      return records[0].content as unknown[]
    }
    return []
  }

  /**
   * Store published triplet IDs to prevent recreation
   */
  static async storePublishedTripletIds(publishedIds: string[]): Promise<number> {
    // Remove existing published triplet IDs first
    const existing = await sofiaDB.getAllByIndex<TripletsRecord>(STORES.TRIPLETS_DATA, 'messageId', 'echoesTab_published_triplets')
    for (const record of existing) {
      if (record.id) {
        await sofiaDB.delete(STORES.TRIPLETS_DATA, record.id)
      }
    }
    
    // Store new published triplet IDs
    const record: TripletsRecord = {
      messageId: 'echoesTab_published_triplets',
      content: publishedIds,
      timestamp: Date.now(),
      type: 'published_triplets'
    }
    
    const result = await sofiaDB.put(STORES.TRIPLETS_DATA, record)
    logger.info('Published triplet IDs stored', { count: publishedIds.length })
    return result as number
  }

  /**
   * Load published triplet IDs
   */
  static async loadPublishedTripletIds(): Promise<string[]> {
    const records = await sofiaDB.getAllByIndex<TripletsRecord>(STORES.TRIPLETS_DATA, 'messageId', 'echoesTab_published_triplets')
    if (records.length > 0 && records[0].content) {
      const ids = records[0].content as string[]
      return ids
    }
    return []
  }

  /**
   * Add a triplet ID to the published list
   */
  static async addPublishedTripletId(tripletId: string): Promise<void> {
    const existingIds = await this.loadPublishedTripletIds()
    if (!existingIds.includes(tripletId)) {
      existingIds.push(tripletId)
      await this.storePublishedTripletIds(existingIds)
      logger.debug('Added triplet to published list', { tripletId })
      
      // Notify background to update badge count
      try {
        MessageBus.getInstance().sendMessageFireAndForget({ type: 'TRIPLET_PUBLISHED' })
      } catch (error) {
        logger.error('Failed to notify background of published triplet', error)
      }
    }
  }

  /**
   * Store published triplet details for SignalsTab
   */
  static async storePublishedTriplet(tripletDetails: any): Promise<number> {
    // Clean up any conflicting old records first
    await this.cleanupOldTripletRecords()
    
    // Check if this triplet already exists by looking for existing record
    const existingRecord = await sofiaDB.getByIndex<TripletsRecord>(
      STORES.TRIPLETS_DATA, 
      'messageId', 
      `published_triplet_${tripletDetails.originalId || tripletDetails.tripleVaultId}`
    )
    
    // Create or update individual triplet record with unique messageId
    const record: TripletsRecord = {
      messageId: `published_triplet_${tripletDetails.originalId || tripletDetails.tripleVaultId}`,
      content: tripletDetails,
      timestamp: Date.now(),
      type: 'published_triplets_details'
    }
    
    // If record exists, preserve the id for update
    if (existingRecord?.id) {
      record.id = existingRecord.id
    }
    
    try {
      const result = await sofiaDB.put(STORES.TRIPLETS_DATA, record)
      logger.info('Published triplet details stored', { id: tripletDetails.tripleVaultId || tripletDetails.originalId })
      return result as number
    } catch (error) {
      if (error instanceof Error && error.name === 'ConstraintError') {
        logger.warn('Constraint error detected, attempting to resolve...', { message: error.message })
        // Try to clean up conflicts and retry once
        await this.cleanupOldTripletRecords()
        const retryResult = await sofiaDB.put(STORES.TRIPLETS_DATA, record)
        logger.info('Published triplet details stored (retry)', { id: tripletDetails.tripleVaultId || tripletDetails.originalId })
        return retryResult as number
      }
      throw error
    }
  }

  /**
   * Load all published triplet details for SignalsTab
   */
  static async loadPublishedTriplets(): Promise<any[]> {
    // Clean up old format records that might cause conflicts
    try {
      await this.cleanupOldTripletRecords()
    } catch (error) {
      logger.warn('Could not clean up old triplet records during load', error)
      // Continue without cleanup if it fails
    }
    
    const records = await sofiaDB.getAllByIndex<TripletsRecord>(STORES.TRIPLETS_DATA, 'type', 'published_triplets_details')
    // Filter to only get individual triplet records (not the old format)
    const tripletRecords = records.filter(record => 
      record.messageId.startsWith('published_triplet_') && record.content
    )
    return tripletRecords.map(record => record.content)
  }

  /**
   * Clean up old format triplet records to prevent uniqueness conflicts
   */
  static async cleanupOldTripletRecords(): Promise<void> {
    try {
      // Remove old format records that use 'published_triplets_details' as messageId
      const oldRecords = await sofiaDB.getAllByIndex<TripletsRecord>(
        STORES.TRIPLETS_DATA, 
        'messageId', 
        'published_triplets_details'
      )
      
      for (const record of oldRecords) {
        if (record.id && record.messageId === 'published_triplets_details') {
          await sofiaDB.delete(STORES.TRIPLETS_DATA, record.id)
          logger.debug('Cleaned up old triplet record format')
        }
      }
    } catch (error) {
      logger.warn('Could not clean up old triplet records', error)
    }
  }

  /**
   * Delete a message by messageId (searches by messageId field)
   */
  static async deleteMessage(messageId: string): Promise<void> {
    const allMessages = await this.getAllMessages()
    const messageToDelete = allMessages.find(msg => msg.messageId === messageId)
    
    if (messageToDelete && messageToDelete.id) {
      await sofiaDB.delete(STORES.TRIPLETS_DATA, messageToDelete.id)
      logger.debug('Triplet record deleted', { messageId })
    } else {
      logger.warn('Message not found for deletion', { messageId })
    }
  }

  /**
   * Delete a message by ID (direct IndexedDB ID)
   */
  static async deleteMessageById(id: number): Promise<void> {
    try {
      await sofiaDB.delete(STORES.TRIPLETS_DATA, id)
      logger.debug('Triplet record deleted by ID', { id })
    } catch (error) {
      logger.warn('Failed to delete message by ID', { id, error })
    }
  }

  /**
   * Clear all triplets data
   */
  static async clearAll(): Promise<void> {
    await sofiaDB.clear(STORES.TRIPLETS_DATA)
    logger.info('All triplets data cleared')
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
    
    logger.debug('Visit data stored', { url })
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
    logger.info('All navigation data cleared')
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
    logger.info('User profile saved')
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
    logger.info('Profile photo updated')
  }

  /**
   * Update bio
   */
  static async updateBio(bio: string): Promise<void> {
    await this.saveProfile(undefined, bio)
    logger.info('Bio updated')
  }

  /**
   * Update profile URL
   */
  static async updateProfileUrl(url: string): Promise<void> {
    await this.saveProfile(undefined, undefined, url)
    logger.info('Profile URL updated')
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
    logger.info('User settings saved', settings)
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
    logger.info(`Setting updated: ${key} = ${value}`)
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
      logger.debug('Search query added to history', { query })
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
    logger.info('Search history cleared')
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
    
    logger.info(`Deleted ${deletedCount} old search queries`)
    return deletedCount
  }
}

/**
 * Bookmark Service Methods
 * All bookmarks are stored per-wallet to isolate user identities
 */
export class BookmarkService {
  /**
   * Create a new bookmark list (per-wallet)
   */
  static async createList(walletAddress: string, name: string, description?: string): Promise<string> {
    const listId = `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const list: BookmarkList = {
      id: listId,
      walletAddress,
      name,
      description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tripletIds: []
    }

    await sofiaDB.put(STORES.BOOKMARK_LISTS, list)
    logger.info('Bookmark list created', { name, wallet: walletAddress.slice(0, 8) })
    return listId
  }

  /**
   * Get all bookmark lists for a specific wallet
   */
  static async getAllLists(walletAddress: string): Promise<BookmarkList[]> {
    const lists = await sofiaDB.getAll<BookmarkList>(STORES.BOOKMARK_LISTS)
    // Filter by wallet address
    return lists
      .filter(list => list.walletAddress === walletAddress)
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }

  /**
   * Get a specific bookmark list
   */
  static async getList(listId: string): Promise<BookmarkList | null> {
    return await sofiaDB.get<BookmarkList>(STORES.BOOKMARK_LISTS, listId) || null
  }

  /**
   * Update a bookmark list
   */
  static async updateList(listId: string, updates: Partial<Pick<BookmarkList, 'name' | 'description'>>): Promise<void> {
    const existingList = await this.getList(listId)
    if (!existingList) {
      throw new Error(`List with ID ${listId} not found`)
    }

    const updatedList: BookmarkList = {
      ...existingList,
      ...updates,
      updatedAt: Date.now()
    }

    await sofiaDB.put(STORES.BOOKMARK_LISTS, updatedList)
    logger.debug('Bookmark list updated', { listId })
  }

  /**
   * Delete a bookmark list
   */
  static async deleteList(listId: string): Promise<void> {
    // Remove all triplets from this list first
    const triplets = await this.getTripletsByList(listId)
    for (const triplet of triplets) {
      await sofiaDB.delete(STORES.BOOKMARKED_TRIPLETS, triplet.id)
    }

    // Delete the list itself
    await sofiaDB.delete(STORES.BOOKMARK_LISTS, listId)
    logger.info('Bookmark list deleted', { listId })
  }

  /**
   * Add a triplet to a bookmark list
   */
  static async addTripletToList(
    listId: string, 
    triplet: Triplet, 
    sourceInfo: Pick<BookmarkedTriplet, 'sourceType' | 'sourceId' | 'url' | 'description' | 'sourceMessageId'>
  ): Promise<void> {
    const list = await this.getList(listId)
    if (!list) {
      throw new Error(`List with ID ${listId} not found`)
    }

    const tripletId = `triplet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const bookmarkedTriplet: BookmarkedTriplet = {
      id: tripletId,
      triplet,
      ...sourceInfo,
      addedAt: Date.now()
    }

    // Add triplet to database
    await sofiaDB.put(STORES.BOOKMARKED_TRIPLETS, bookmarkedTriplet)

    // Update list with new triplet ID
    const updatedList: BookmarkList = {
      ...list,
      tripletIds: [...list.tripletIds, tripletId],
      updatedAt: Date.now()
    }

    await sofiaDB.put(STORES.BOOKMARK_LISTS, updatedList)
    logger.debug('Triplet added to list', { listId, subject: triplet.subject })
  }

  /**
   * Remove a triplet from a bookmark list
   */
  static async removeTripletFromList(listId: string, tripletId: string): Promise<void> {
    const list = await this.getList(listId)
    if (!list) {
      throw new Error(`List with ID ${listId} not found`)
    }

    // Remove triplet from database
    await sofiaDB.delete(STORES.BOOKMARKED_TRIPLETS, tripletId)

    // Update list by removing triplet ID
    const updatedList: BookmarkList = {
      ...list,
      tripletIds: list.tripletIds.filter(id => id !== tripletId),
      updatedAt: Date.now()
    }

    await sofiaDB.put(STORES.BOOKMARK_LISTS, updatedList)
    logger.debug('Triplet removed from list', { listId, tripletId })
  }

  /**
   * Get all triplets in a specific list
   */
  static async getTripletsByList(listId: string): Promise<BookmarkedTriplet[]> {
    const list = await this.getList(listId)
    if (!list) return []

    const triplets: BookmarkedTriplet[] = []
    for (const tripletId of list.tripletIds) {
      const triplet = await sofiaDB.get<BookmarkedTriplet>(STORES.BOOKMARKED_TRIPLETS, tripletId)
      if (triplet) {
        triplets.push(triplet)
      }
    }

    return triplets.sort((a, b) => b.addedAt - a.addedAt)
  }

  /**
   * Get all bookmarked triplets for a specific wallet
   * (Only returns triplets that belong to lists owned by this wallet)
   */
  static async getAllTriplets(walletAddress: string): Promise<BookmarkedTriplet[]> {
    // Get all lists for this wallet
    const lists = await this.getAllLists(walletAddress)
    const tripletIds = new Set(lists.flatMap(list => list.tripletIds))

    // Get all triplets and filter by those belonging to this wallet's lists
    const allTriplets = await sofiaDB.getAll<BookmarkedTriplet>(STORES.BOOKMARKED_TRIPLETS)
    return allTriplets
      .filter(triplet => tripletIds.has(triplet.id))
      .sort((a, b) => b.addedAt - a.addedAt)
  }

  /**
   * Search triplets across all lists for a specific wallet
   */
  static async searchTriplets(walletAddress: string, query: string): Promise<BookmarkedTriplet[]> {
    if (!query.trim()) return []

    const allTriplets = await this.getAllTriplets(walletAddress)
    const lowercaseQuery = query.toLowerCase()

    return allTriplets.filter(triplet =>
      triplet.triplet.subject.toLowerCase().includes(lowercaseQuery) ||
      triplet.triplet.predicate.toLowerCase().includes(lowercaseQuery) ||
      triplet.triplet.object.toLowerCase().includes(lowercaseQuery) ||
      (triplet.description && triplet.description.toLowerCase().includes(lowercaseQuery)) ||
      (triplet.url && triplet.url.toLowerCase().includes(lowercaseQuery))
    )
  }

  /**
   * Clear all bookmarks
   */
  static async clearAll(): Promise<void> {
    await sofiaDB.clear(STORES.BOOKMARK_LISTS)
    await sofiaDB.clear(STORES.BOOKMARKED_TRIPLETS)
    logger.info('All bookmarks cleared')
  }
}

/**
 * Recommendations Service Methods
 */
export class RecommendationsService {
  /**
   * Save recommendations for a wallet address
   */
  static async saveRecommendations(
    walletAddress: string, 
    rawResponse: string, 
    parsedRecommendations: any[]
  ): Promise<void> {
    const record: RecommendationRecord = {
      walletAddress: walletAddress.toLowerCase(),
      rawResponse,
      parsedRecommendations,
      timestamp: Date.now(),
      lastUpdated: Date.now()
    }
    
    await sofiaDB.put(STORES.RECOMMENDATIONS, record)
    logger.info('Recommendations saved', { wallet: walletAddress })
  }

  /**
   * Get recommendations for a wallet address
   */
  static async getRecommendations(walletAddress: string): Promise<RecommendationRecord | null> {
    const record = await sofiaDB.get<RecommendationRecord>(
      STORES.RECOMMENDATIONS, 
      walletAddress.toLowerCase()
    )
    return record || null
  }

  /**
   * Check if cached recommendations are still valid (not expired)
   */
  static async areRecommendationsValid(walletAddress: string, maxAgeHours: number = 24): Promise<boolean> {
    const record = await this.getRecommendations(walletAddress)
    if (!record) return false
    
    const maxAge = maxAgeHours * 60 * 60 * 1000 // Convert hours to milliseconds
    const isValid = Date.now() - record.lastUpdated < maxAge
    
    logger.debug('Recommendations cache check', {
      wallet: walletAddress,
      age: `${Math.round((Date.now() - record.lastUpdated) / (60 * 60 * 1000))}h`,
      valid: isValid
    })
    
    return isValid
  }

  /**
   * Update existing recommendations with new ones (merge and deduplicate)
   */
  static async updateRecommendations(
    walletAddress: string,
    newRawResponse: string,
    newParsedRecommendations: any[]
  ): Promise<void> {
    const existingRecord = await this.getRecommendations(walletAddress)
    
    if (!existingRecord) {
      // No existing data, just save new ones
      await this.saveRecommendations(walletAddress, newRawResponse, newParsedRecommendations)
      return
    }

    // Merge and deduplicate recommendations
    const mergedRecommendations = this.mergeRecommendations(
      existingRecord.parsedRecommendations,
      newParsedRecommendations
    )

    // Update record
    const updatedRecord: RecommendationRecord = {
      ...existingRecord,
      rawResponse: newRawResponse, // Keep the latest raw response
      parsedRecommendations: mergedRecommendations,
      lastUpdated: Date.now()
    }

    await sofiaDB.put(STORES.RECOMMENDATIONS, updatedRecord)
    logger.info('Recommendations updated', { wallet: walletAddress })
  }

  /**
   * Merge two arrays of recommendations, removing duplicates by URL
   */
  private static mergeRecommendations(oldRecs: any[], newRecs: any[]): any[] {
    // Create a Map to track suggestions by URL for deduplication
    const suggestionMap = new Map<string, any>()
    
    // Add old suggestions first
    oldRecs.forEach(rec => {
      if (rec.suggestions && Array.isArray(rec.suggestions)) {
        rec.suggestions.forEach((sug: any) => {
          if (sug.url) {
            suggestionMap.set(sug.url, {
              ...sug,
              category: rec.category,
              reason: rec.reason
            })
          }
        })
      }
    })
    
    // Add new suggestions (will overwrite duplicates with newer data)
    newRecs.forEach(rec => {
      if (rec.suggestions && Array.isArray(rec.suggestions)) {
        rec.suggestions.forEach((sug: any) => {
          if (sug.url) {
            suggestionMap.set(sug.url, {
              ...sug,
              category: rec.category,
              reason: rec.reason
            })
          }
        })
      }
    })

    // Group back by category
    const categoryMap = new Map<string, any>()
    
    suggestionMap.forEach(suggestion => {
      const category = suggestion.category || 'Unknown'
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category,
          title: 'Nouveaux projets similaires',
          reason: suggestion.reason || `Basé sur votre activité dans ${category}`,
          suggestions: []
        })
      }
      categoryMap.get(category)!.suggestions.push({
        name: suggestion.name,
        url: suggestion.url
      })
    })

    const result = Array.from(categoryMap.values())
    logger.debug('Merged recommendations', {
      old: oldRecs.length,
      new: newRecs.length,
      final: result.length,
      totalSuggestions: result.reduce((sum, rec) => sum + rec.suggestions.length, 0)
    })
    
    return result
  }

  /**
   * Delete recommendations for a wallet address
   */
  static async deleteRecommendations(walletAddress: string): Promise<void> {
    await sofiaDB.delete(STORES.RECOMMENDATIONS, walletAddress.toLowerCase())
    logger.info('Recommendations deleted', { wallet: walletAddress })
  }

  /**
   * Get all stored recommendations
   */
  static async getAllRecommendations(): Promise<RecommendationRecord[]> {
    const records = await sofiaDB.getAll<RecommendationRecord>(STORES.RECOMMENDATIONS)
    return records.sort((a, b) => b.lastUpdated - a.lastUpdated)
  }

  /**
   * Clear all recommendations
   */
  static async clearAll(): Promise<void> {
    await sofiaDB.clear(STORES.RECOMMENDATIONS)
    logger.info('All recommendations cleared')
  }

  /**
   * Clean up old recommendations (older than X days)
   */
  static async cleanupOldRecommendations(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000)
    const allRecords = await this.getAllRecommendations()
    
    let deletedCount = 0
    for (const record of allRecords) {
      if (record.lastUpdated < cutoffDate) {
        await this.deleteRecommendations(record.walletAddress)
        deletedCount++
      }
    }
    
    logger.info(`Deleted ${deletedCount} old recommendation records`)
    return deletedCount
  }
}

/**
 * 🆕 Intention Groups Service
 * Manages persistent storage of domain-based intention groups
 */
export class IntentionGroupsService {
  /**
   * Get all intention groups
   */
  static async getAllGroups(): Promise<IntentionGroupRecord[]> {
    const groups = await sofiaDB.getAll<IntentionGroupRecord>(STORES.INTENTION_GROUPS)
    return groups.sort((a, b) => b.updatedAt - a.updatedAt)
  }

  /**
   * Get a specific group by ID (domain)
   */
  static async getGroup(groupId: string): Promise<IntentionGroupRecord | null> {
    return await sofiaDB.get<IntentionGroupRecord>(STORES.INTENTION_GROUPS, groupId) || null
  }

  /**
   * Save or update an intention group
   */
  static async saveGroup(group: IntentionGroupRecord): Promise<void> {
    group.updatedAt = Date.now()
    await sofiaDB.put(STORES.INTENTION_GROUPS, group)
    logger.info(`[IntentionGroups] Saved group: ${group.id}`)
  }

  /**
   * Delete a group
   */
  static async deleteGroup(groupId: string): Promise<void> {
    await sofiaDB.delete(STORES.INTENTION_GROUPS, groupId)
    logger.info(`[IntentionGroups] Deleted group: ${groupId}`)
  }

  /**
   * Clear all groups
   */
  static async clearAll(): Promise<void> {
    await sofiaDB.clear(STORES.INTENTION_GROUPS)
    logger.info('[IntentionGroups] Cleared all groups')
  }
}

/**
 * 🆕 User XP Service
 * Manages user XP storage
 */
export class UserXPService {
  /**
   * Get current user XP
   */
  static async getUserXP(): Promise<UserXPRecord | null> {
    return await sofiaDB.get<UserXPRecord>(STORES.USER_XP, 'user') || null
  }

  /**
   * Save user XP
   */
  static async saveUserXP(xp: UserXPRecord): Promise<void> {
    xp.lastUpdated = Date.now()
    await sofiaDB.put(STORES.USER_XP, xp)
    logger.info(`[UserXP] Saved XP: ${xp.totalXP}`)
  }

  /**
   * Initialize user XP if not exists
   */
  static async initializeIfNeeded(): Promise<UserXPRecord> {
    let xp = await this.getUserXP()
    if (!xp) {
      xp = {
        id: 'user',
        totalXP: 0,
        totalEarned: 0,
        totalSpent: 0,
        lastUpdated: Date.now()
      }
      await this.saveUserXP(xp)
    }
    return xp
  }

  /**
   * Clear user XP
   */
  static async clearAll(): Promise<void> {
    await sofiaDB.clear(STORES.USER_XP)
    logger.info('[UserXP] Cleared user XP')
  }
}

// Export all services
export const tripletsDataService = TripletsDataService
export const navigationDataService = NavigationDataService
export const userProfileService = UserProfileService
export const userSettingsService = UserSettingsService
export const searchHistoryService = SearchHistoryService
export const bookmarkService = BookmarkService
export const recommendationsService = RecommendationsService
export const intentionGroupsService = IntentionGroupsService  // 🆕 Export intention groups service
export const userXPService = UserXPService  // 🆕 Export user XP service