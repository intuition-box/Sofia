/**
 * useElizaData Hook
 * Replaces Eliza message storage with IndexedDB
 * Manages Sofia messages, parsed messages, and triples from Eliza
 */

import { useState, useEffect, useCallback } from 'react'
import { elizaDataService } from '~lib/database/indexedDB-methods'
import { MessageBus } from '~lib/services/MessageBus'
import type { ElizaRecord } from '~lib/database/indexedDB'
import type { ParsedSofiaMessage, SofiaMessage } from '~types/messages'

interface UseElizaDataResult {
  allMessages: ElizaRecord[]
  storeMessage: (message: SofiaMessage, messageId?: string) => Promise<ElizaRecord | null>
  storeParsedMessage: (parsedMessage: ParsedSofiaMessage, messageId?: string) => Promise<ElizaRecord>
  loadMessages: () => Promise<ElizaRecord[]>
  clearAllMessages: () => Promise<boolean>
  deleteOldMessages: (daysToKeep?: number) => Promise<number>
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
  const loadMessages = useCallback(async (): Promise<ElizaRecord[]> => {
    try {
      const allElizaMessages = await elizaDataService.getAllMessages()
      console.log('🔍 [useElizaData] loadMessages - count:', allElizaMessages.length)
      console.log('🔍 [useElizaData] loadMessages - sample:', allElizaMessages.slice(0, 3))
      setAllMessages(allElizaMessages)
      return allElizaMessages
    } catch (err) {
      console.error('❌ Error loading Eliza messages:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to load messages')
    }
  }, [])

  /**
   * Store a regular message from Eliza (auto-parsing handled by elizaDataService)
   */
  const storeMessage = useCallback(async (message: SofiaMessage, messageId?: string): Promise<ElizaRecord | null> => {
    try {
      const recordId = await elizaDataService.storeMessage(message, messageId)
      
      // If recordId is 0, message couldn't be parsed - that's normal
      if (recordId === 0) {
        console.log('ℹ️ Message not stored - no triples found')
        return null
      }
      
      const updatedMessages = await loadMessages()
      const storedRecord = updatedMessages.find(record => record.id === recordId)
      console.log('✅ Message stored successfully')
      
      if (!storedRecord) {
        throw new Error('Failed to retrieve stored message')
      }
      return storedRecord
    } catch (err) {
      console.error('❌ Error storing message:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to store message')
    }
  }, [loadMessages])

  /**
   * Store a parsed message with triples
   */
  const storeParsedMessage = useCallback(async (parsedMessage: ParsedSofiaMessage, messageId?: string): Promise<ElizaRecord> => {
    try {
      const recordId = await elizaDataService.storeParsedMessage(parsedMessage, messageId)
      
      try {
        MessageBus.getInstance().sendMessageFireAndForget({ type: 'UPDATE_ECHO_BADGE' })
      } catch (badgeError) {
        console.error('❌ Failed to notify background of new triples:', badgeError)
      }
      
      const updatedMessages = await loadMessages()
      const storedRecord = updatedMessages.find(record => record.id === recordId)
      console.log('✅ Parsed message stored successfully')
      if (!storedRecord) {
        throw new Error('Failed to retrieve stored parsed message')
      }
      return storedRecord
    } catch (err) {
      console.error('❌ Error storing parsed message:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to store parsed message')
    }
  }, [loadMessages])


  /**
   * Clear all messages (with confirmation)
   */
  const clearAllMessages = useCallback(async (): Promise<boolean> => {
    try {
      await elizaDataService.clearAll()
      setAllMessages([])
      console.log('🗑️ All Eliza messages cleared')
      return true
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
      console.error('❌ Failed to notify background of new triples:', badgeError)
    }
  }, [])

  return { storeMessage, storeParsedMessage }
}

export default useElizaData