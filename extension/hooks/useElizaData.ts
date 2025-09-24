/**
 * useElizaData Hook
 * Replaces Eliza message storage with IndexedDB
 * Manages Sofia messages, parsed messages, and triplets from Eliza
 */

import { useState, useEffect, useCallback } from 'react'
import { elizaDataService } from '~lib/database/indexedDB-methods'
import { MessageBus } from '~lib/services/MessageBus'
import type { ElizaRecord } from '~lib/database/indexedDB'
import type { ParsedSofiaMessage, SofiaMessage } from '~types/messages'

interface UseElizaDataResult {
  allMessages: ElizaRecord[]
  storeMessage: (message: SofiaMessage, messageId?: string) => Promise<void>
  storeParsedMessage: (parsedMessage: ParsedSofiaMessage, messageId?: string) => Promise<void>
  loadMessages: () => Promise<void>
  clearAllMessages: () => Promise<void>
  deleteOldMessages: (daysToKeep?: number) => Promise<number>
  getMessagesByType: (type: 'message' | 'parsed_message' | 'triplet') => ElizaRecord[]
  getRecentMessages: (limit?: number) => ElizaRecord[]
}


/**
 * Hook for managing Eliza data with IndexedDB
 */
export const useElizaData = (): UseElizaDataResult => {

  // State
  const [allMessages, setAllMessages] = useState<ElizaRecord[]>([])

  /**
   * Load all messages from IndexedDB
   */
  const loadMessages = useCallback(async () => {
    try {
      const allElizaMessages = await elizaDataService.getAllMessages()
      setAllMessages(allElizaMessages)
    } catch (err) {
      console.error('❌ Error loading Eliza messages:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to load messages')
    }
  }, [])

  /**
   * Store a regular message from Eliza (auto-parsing handled by elizaDataService)
   */
  const storeMessage = useCallback(async (message: SofiaMessage, messageId?: string) => {
    try {
      // Store the raw message (elizaDataService handles auto-parsing)
      await elizaDataService.storeMessage(message, messageId)
      
      // Refresh data after storing
      await loadMessages()
      
      console.log('✅ Message stored successfully')

    } catch (err) {
      console.error('❌ Error storing message:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to store message')
    }
  }, [loadMessages])

  /**
   * Store a parsed message with triplets
   */
  const storeParsedMessage = useCallback(async (parsedMessage: ParsedSofiaMessage, messageId?: string) => {
    try {
      await elizaDataService.storeParsedMessage(parsedMessage, messageId)
      
      // Notify background to update badge count
      try {
        MessageBus.getInstance().sendMessageFireAndForget({ type: 'UPDATE_ECHO_BADGE' })
      } catch (badgeError) {
        console.error('❌ Failed to notify background of new triplets:', badgeError)
      }
      
      // Refresh data after storing
      await loadMessages()
      
      console.log('✅ Parsed message stored successfully')

    } catch (err) {
      console.error('❌ Error storing parsed message:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to store parsed message')
    }
  }, [loadMessages])


  /**
   * Clear all messages (with confirmation)
   */
  const clearAllMessages = useCallback(async () => {
    try {
      await elizaDataService.clearAll()
      setAllMessages([])
      console.log('🗑️ All Eliza messages cleared')
    } catch (err) {
      console.error('❌ Error clearing messages:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to clear messages')
    }
  }, [])

  /**
   * Delete old messages (older than X days)
   */
  const deleteOldMessages = useCallback(async (daysToKeep: number = 30): Promise<number> => {
    try {
      const deletedCount = await elizaDataService.deleteOldMessages(daysToKeep)
      
      // Refresh data after cleanup
      await loadMessages()
      
      console.log(`🧹 Deleted ${deletedCount} old messages`)
      return deletedCount

    } catch (err) {
      console.error('❌ Error deleting old messages:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to delete old messages')
    }
  }, [loadMessages])

  const getMessagesByType = useCallback((type: 'message' | 'parsed_message' | 'triplet') => {
    return allMessages.filter(msg => msg.type === type)
  }, [allMessages])

  const getRecentMessages = useCallback((limit: number = 50) => {
    return allMessages
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }, [allMessages])



  /**
   * Load messages on mount
   */
  useEffect(() => {
    loadMessages()
  }, [loadMessages])


  return {
    allMessages,
    storeMessage,
    storeParsedMessage,
    loadMessages,
    clearAllMessages,
    deleteOldMessages,
    getMessagesByType,
    getRecentMessages
  }
}

export const useElizaMessageStore = () => {
  const storeMessage = useCallback(async (message: SofiaMessage, messageId?: string) => {
    await elizaDataService.storeMessage(message, messageId)
  }, [])

  const storeParsedMessage = useCallback(async (parsedMessage: ParsedSofiaMessage, messageId?: string) => {
    await elizaDataService.storeParsedMessage(parsedMessage, messageId)
    
    try {
      MessageBus.getInstance().sendMessageFireAndForget({ type: 'UPDATE_ECHO_BADGE' })
    } catch (badgeError) {
      console.error('❌ Failed to notify background of new triplets:', badgeError)
    }
  }, [])

  return { storeMessage, storeParsedMessage }
}

export default useElizaData