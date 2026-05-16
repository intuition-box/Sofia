/**
 * Specialized methods for SofIA IndexedDB operations
 */

import type { BookmarkedTriplet, BookmarkList } from "~types/bookmarks"
import type { Message, ParsedSofiaMessage, Triplet } from "~types/messages"
import type { ExtensionSettings } from "~types/storage"

import { MessageBus } from "../services/MessageBus"
import { parseSofiaMessage } from "../utils"
import { createServiceLogger } from "../utils/logger"
import sofiaDB, {
  STORES,
  type CartItemRecord,
  type IntentionGroupRecord,
  type SettingsRecord,
  type TripletsRecord
} from "./indexedDB"

const logger = createServiceLogger("IndexedDB")

/**
 * Triplets Data Methods
 */
export class TripletsDataService {
  /**
   * Store a message - only store if parsing succeeds
   */
  static async storeMessage(
    message: Message,
    messageId?: string
  ): Promise<number> {
    // content is a discriminated union: raw `{ text }` envelope OR an already
    // parsed message. In the parsed branch there's nothing to do — store as-is.
    if (!("text" in message.content)) {
      return await this.storeParsedMessage(message.content, messageId)
    }
    // Raw text — parse first, only store if parsing yields triplets.
    const parsed = parseSofiaMessage(message.content.text, message.created_at)
    if (parsed && parsed.triplets.length > 0) {
      logger.debug(
        `Parsed message with ${parsed.triplets.length} triplets - storing only parsed version`
      )
      return await this.storeParsedMessage(parsed, messageId)
    }
    logger.warn(
      "Message could not be parsed or has no triplets - skipping storage"
    )
    return 0
  }

  /**
   * Store a parsed Sofia message with triplets
   */
  static async storeParsedMessage(
    parsedMessage: ParsedSofiaMessage,
    messageId?: string
  ): Promise<number> {
    const record: TripletsRecord = {
      messageId: messageId || `parsed_${Date.now()}_${Math.random()}`,
      content: parsedMessage,
      timestamp: Date.now(),
      type: "parsed_message"
    }

    const result = await sofiaDB.add(STORES.TRIPLETS_DATA, record)
    logger.info("Parsed Sofia message stored", { messageId })

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
  static async getMessagesByType(
    type: "message" | "parsed_message" | "triplet"
  ): Promise<TripletsRecord[]> {
    return await sofiaDB.getAllByIndex<TripletsRecord>(
      STORES.TRIPLETS_DATA,
      "type",
      type
    )
  }

  /**
   * Get recent messages (last N messages)
   */
  static async getRecentMessages(
    limit: number = 50
  ): Promise<TripletsRecord[]> {
    const allMessages = await sofiaDB.getAll<TripletsRecord>(
      STORES.TRIPLETS_DATA
    )
    return allMessages.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit)
  }

  /**
   * Delete old messages (older than X days)
   */
  static async deleteOldMessages(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = Date.now() - daysToKeep * 24 * 60 * 60 * 1000
    const allMessages = await sofiaDB.getAll<TripletsRecord>(
      STORES.TRIPLETS_DATA
    )

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
    const existing = await sofiaDB.getAllByIndex<TripletsRecord>(
      STORES.TRIPLETS_DATA,
      "messageId",
      "echoesTab_triplet_states"
    )
    for (const record of existing) {
      if (record.id) {
        await sofiaDB.delete(STORES.TRIPLETS_DATA, record.id)
      }
    }

    // Store new triplet states
    const record: TripletsRecord = {
      messageId: "echoesTab_triplet_states",
      content: tripletStates,
      timestamp: Date.now(),
      type: "triplet"
    }

    const result = await sofiaDB.put(STORES.TRIPLETS_DATA, record)
    logger.info("EchoesTab triplet states persisted", {
      count: tripletStates.length
    })
    return result as number
  }

  /**
   * Load triplet states for EchoesTab
   */
  static async loadTripletStates(): Promise<any[]> {
    const records = await sofiaDB.getAllByIndex<TripletsRecord>(
      STORES.TRIPLETS_DATA,
      "messageId",
      "echoesTab_triplet_states"
    )
    if (records.length > 0 && records[0].content) {
      return records[0].content as unknown[]
    }
    return []
  }

  /**
   * Store published triplet IDs to prevent recreation
   */
  static async storePublishedTripletIds(
    publishedIds: string[]
  ): Promise<number> {
    // Remove existing published triplet IDs first
    const existing = await sofiaDB.getAllByIndex<TripletsRecord>(
      STORES.TRIPLETS_DATA,
      "messageId",
      "echoesTab_published_triplets"
    )
    for (const record of existing) {
      if (record.id) {
        await sofiaDB.delete(STORES.TRIPLETS_DATA, record.id)
      }
    }

    // Store new published triplet IDs
    const record: TripletsRecord = {
      messageId: "echoesTab_published_triplets",
      content: publishedIds,
      timestamp: Date.now(),
      type: "published_triplets"
    }

    const result = await sofiaDB.put(STORES.TRIPLETS_DATA, record)
    logger.info("Published triplet IDs stored", { count: publishedIds.length })
    return result as number
  }

  /**
   * Load published triplet IDs
   */
  static async loadPublishedTripletIds(): Promise<string[]> {
    const records = await sofiaDB.getAllByIndex<TripletsRecord>(
      STORES.TRIPLETS_DATA,
      "messageId",
      "echoesTab_published_triplets"
    )
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
      logger.debug("Added triplet to published list", { tripletId })

      // Notify background to update badge count
      try {
        MessageBus.getInstance().sendMessageFireAndForget({
          type: "TRIPLET_PUBLISHED"
        })
      } catch (error) {
        logger.error("Failed to notify background of published triplet", error)
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
      "messageId",
      `published_triplet_${tripletDetails.originalId || tripletDetails.tripleVaultId}`
    )

    // Create or update individual triplet record with unique messageId
    const record: TripletsRecord = {
      messageId: `published_triplet_${tripletDetails.originalId || tripletDetails.tripleVaultId}`,
      content: tripletDetails,
      timestamp: Date.now(),
      type: "published_triplets_details"
    }

    // If record exists, preserve the id for update
    if (existingRecord?.id) {
      record.id = existingRecord.id
    }

    try {
      const result = await sofiaDB.put(STORES.TRIPLETS_DATA, record)
      logger.info("Published triplet details stored", {
        id: tripletDetails.tripleVaultId || tripletDetails.originalId
      })
      return result as number
    } catch (error) {
      if (error instanceof Error && error.name === "ConstraintError") {
        logger.warn("Constraint error detected, attempting to resolve...", {
          message: error.message
        })
        // Try to clean up conflicts and retry once
        await this.cleanupOldTripletRecords()
        const retryResult = await sofiaDB.put(STORES.TRIPLETS_DATA, record)
        logger.info("Published triplet details stored (retry)", {
          id: tripletDetails.tripleVaultId || tripletDetails.originalId
        })
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
      logger.warn("Could not clean up old triplet records during load", error)
      // Continue without cleanup if it fails
    }

    const records = await sofiaDB.getAllByIndex<TripletsRecord>(
      STORES.TRIPLETS_DATA,
      "type",
      "published_triplets_details"
    )
    // Filter to only get individual triplet records (not the old format)
    const tripletRecords = records.filter(
      (record) =>
        record.messageId.startsWith("published_triplet_") && record.content
    )
    return tripletRecords.map((record) => record.content)
  }

  /**
   * Clean up old format triplet records to prevent uniqueness conflicts
   */
  static async cleanupOldTripletRecords(): Promise<void> {
    try {
      // Remove old format records that use 'published_triplets_details' as messageId
      const oldRecords = await sofiaDB.getAllByIndex<TripletsRecord>(
        STORES.TRIPLETS_DATA,
        "messageId",
        "published_triplets_details"
      )

      for (const record of oldRecords) {
        if (record.id && record.messageId === "published_triplets_details") {
          await sofiaDB.delete(STORES.TRIPLETS_DATA, record.id)
          logger.debug("Cleaned up old triplet record format")
        }
      }
    } catch (error) {
      logger.warn("Could not clean up old triplet records", error)
    }
  }

  /**
   * Delete a message by messageId (searches by messageId field)
   */
  static async deleteMessage(messageId: string): Promise<void> {
    const allMessages = await this.getAllMessages()
    const messageToDelete = allMessages.find(
      (msg) => msg.messageId === messageId
    )

    if (messageToDelete && messageToDelete.id) {
      await sofiaDB.delete(STORES.TRIPLETS_DATA, messageToDelete.id)
      logger.debug("Triplet record deleted", { messageId })
    } else {
      logger.warn("Message not found for deletion", { messageId })
    }
  }

  /**
   * Delete a message by ID (direct IndexedDB ID)
   */
  static async deleteMessageById(id: number): Promise<void> {
    try {
      await sofiaDB.delete(STORES.TRIPLETS_DATA, id)
      logger.debug("Triplet record deleted by ID", { id })
    } catch (error) {
      logger.warn("Failed to delete message by ID", { id, error })
    }
  }

  /**
   * Clear all triplets data
   */
  static async clearAll(): Promise<void> {
    await sofiaDB.clear(STORES.TRIPLETS_DATA)
    logger.info("All triplets data cleared")
  }
}

/**
 * User Settings Methods
 */
export class UserSettingsService {
  /**
   * Save user settings
   */
  static async saveSettings(
    settings: Partial<ExtensionSettings>
  ): Promise<void> {
    // Get existing settings or create default
    let currentSettings = await sofiaDB.get<SettingsRecord>(
      STORES.USER_SETTINGS,
      "settings"
    )

    if (!currentSettings) {
      currentSettings = {
        id: "settings",
        settings: {
          theme: "auto",
          language: "en",
          notifications: true,
          autoBackup: true,
          debugMode: false,
          isTrackingEnabled: true,
          autoCleanup: true,
          autoCleanupInactiveDays: 30,
          autoCleanupMinLevel: 1
        },
        lastUpdated: Date.now()
      }
    }

    // Update provided settings
    currentSettings.settings = { ...currentSettings.settings, ...settings }
    currentSettings.lastUpdated = Date.now()

    await sofiaDB.put(STORES.USER_SETTINGS, currentSettings)
    logger.info("User settings saved", settings)
  }

  /**
   * Get user settings
   */
  static async getSettings(): Promise<ExtensionSettings> {
    const record = await sofiaDB.get<SettingsRecord>(
      STORES.USER_SETTINGS,
      "settings"
    )

    if (!record) {
      // Return default settings
      const defaultSettings: ExtensionSettings = {
        theme: "auto",
        language: "en",
        notifications: true,
        autoBackup: true,
        debugMode: false,
        isTrackingEnabled: true,
        autoCleanup: true,
        autoCleanupInactiveDays: 30,
        autoCleanupMinLevel: 1
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
 * Bookmark Service Methods
 * All bookmarks are stored per-wallet to isolate user identities
 */
export class BookmarkService {
  /**
   * Create a new bookmark list (per-wallet)
   */
  static async createList(
    walletAddress: string,
    name: string,
    description?: string
  ): Promise<string> {
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
    logger.info("Bookmark list created", {
      name,
      wallet: walletAddress.slice(0, 8)
    })
    return listId
  }

  /**
   * Get all bookmark lists for a specific wallet
   */
  static async getAllLists(walletAddress: string): Promise<BookmarkList[]> {
    const lists = await sofiaDB.getAll<BookmarkList>(STORES.BOOKMARK_LISTS)
    // Filter by wallet address
    return lists
      .filter((list) => list.walletAddress === walletAddress)
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }

  /**
   * Get a specific bookmark list
   */
  static async getList(listId: string): Promise<BookmarkList | null> {
    return (
      (await sofiaDB.get<BookmarkList>(STORES.BOOKMARK_LISTS, listId)) || null
    )
  }

  /**
   * Update a bookmark list
   */
  static async updateList(
    listId: string,
    updates: Partial<Pick<BookmarkList, "name" | "description">>
  ): Promise<void> {
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
    logger.debug("Bookmark list updated", { listId })
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
    logger.info("Bookmark list deleted", { listId })
  }

  /**
   * Add a triplet to a bookmark list
   */
  static async addTripletToList(
    listId: string,
    triplet: Triplet,
    sourceInfo: Pick<
      BookmarkedTriplet,
      "sourceType" | "sourceId" | "url" | "description" | "sourceMessageId"
    >
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
    logger.debug("Triplet added to list", { listId, subject: triplet.subject })
  }

  /**
   * Remove a triplet from a bookmark list
   */
  static async removeTripletFromList(
    listId: string,
    tripletId: string
  ): Promise<void> {
    const list = await this.getList(listId)
    if (!list) {
      throw new Error(`List with ID ${listId} not found`)
    }

    // Remove triplet from database
    await sofiaDB.delete(STORES.BOOKMARKED_TRIPLETS, tripletId)

    // Update list by removing triplet ID
    const updatedList: BookmarkList = {
      ...list,
      tripletIds: list.tripletIds.filter((id) => id !== tripletId),
      updatedAt: Date.now()
    }

    await sofiaDB.put(STORES.BOOKMARK_LISTS, updatedList)
    logger.debug("Triplet removed from list", { listId, tripletId })
  }

  /**
   * Get all triplets in a specific list
   */
  static async getTripletsByList(listId: string): Promise<BookmarkedTriplet[]> {
    const list = await this.getList(listId)
    if (!list) return []

    const triplets: BookmarkedTriplet[] = []
    for (const tripletId of list.tripletIds) {
      const triplet = await sofiaDB.get<BookmarkedTriplet>(
        STORES.BOOKMARKED_TRIPLETS,
        tripletId
      )
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
  static async getAllTriplets(
    walletAddress: string
  ): Promise<BookmarkedTriplet[]> {
    // Get all lists for this wallet
    const lists = await this.getAllLists(walletAddress)
    const tripletIds = new Set(lists.flatMap((list) => list.tripletIds))

    // Get all triplets and filter by those belonging to this wallet's lists
    const allTriplets = await sofiaDB.getAll<BookmarkedTriplet>(
      STORES.BOOKMARKED_TRIPLETS
    )
    return allTriplets
      .filter((triplet) => tripletIds.has(triplet.id))
      .sort((a, b) => b.addedAt - a.addedAt)
  }

  /**
   * Search triplets across all lists for a specific wallet
   */
  static async searchTriplets(
    walletAddress: string,
    query: string
  ): Promise<BookmarkedTriplet[]> {
    if (!query.trim()) return []

    const allTriplets = await this.getAllTriplets(walletAddress)
    const lowercaseQuery = query.toLowerCase()

    return allTriplets.filter(
      (triplet) =>
        triplet.triplet.subject.toLowerCase().includes(lowercaseQuery) ||
        triplet.triplet.predicate.toLowerCase().includes(lowercaseQuery) ||
        triplet.triplet.object.toLowerCase().includes(lowercaseQuery) ||
        (triplet.description &&
          triplet.description.toLowerCase().includes(lowercaseQuery)) ||
        (triplet.url && triplet.url.toLowerCase().includes(lowercaseQuery))
    )
  }

  /**
   * Clear all bookmarks
   */
  static async clearAll(): Promise<void> {
    await sofiaDB.clear(STORES.BOOKMARK_LISTS)
    await sofiaDB.clear(STORES.BOOKMARKED_TRIPLETS)
    logger.info("All bookmarks cleared")
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
    const groups = await sofiaDB.getAll<IntentionGroupRecord>(
      STORES.INTENTION_GROUPS
    )
    return groups.sort((a, b) => b.updatedAt - a.updatedAt)
  }

  /**
   * Get a specific group by ID (domain)
   */
  static async getGroup(groupId: string): Promise<IntentionGroupRecord | null> {
    return (
      (await sofiaDB.get<IntentionGroupRecord>(
        STORES.INTENTION_GROUPS,
        groupId
      )) || null
    )
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
    logger.info("[IntentionGroups] Cleared all groups")
  }
}

// Export all services
export const tripletsDataService = TripletsDataService
export const userSettingsService = UserSettingsService
export const bookmarkService = BookmarkService
export const intentionGroupsService = IntentionGroupsService

/**
 * Cart Data Service
 * Manages certification cart items in IndexedDB
 */
export class CartDataService {
  static async addItem(item: CartItemRecord): Promise<void> {
    await sofiaDB.put(STORES.CART_ITEMS, item)
  }

  static async removeItem(id: string): Promise<void> {
    await sofiaDB.delete(STORES.CART_ITEMS, id)
  }

  static async getByWallet(walletAddress: string): Promise<CartItemRecord[]> {
    const items = await sofiaDB.getAllByIndex<CartItemRecord>(
      STORES.CART_ITEMS,
      "walletAddress",
      walletAddress
    )
    return items.sort((a, b) => a.addedAt - b.addedAt)
  }

  static async clearByWallet(walletAddress: string): Promise<void> {
    // Case-insensitive: legacy rows may have been stored with a checksummed
    // address (pre address-normalization), so an exact index match on the
    // lowercased value would miss them and they'd survive a refresh.
    const target = walletAddress.toLowerCase()
    const all = await sofiaDB.getAll<CartItemRecord>(STORES.CART_ITEMS)
    for (const item of all) {
      if ((item.walletAddress || "").toLowerCase() === target) {
        await sofiaDB.delete(STORES.CART_ITEMS, item.id)
      }
    }
  }
}

export const cartDataService = CartDataService
