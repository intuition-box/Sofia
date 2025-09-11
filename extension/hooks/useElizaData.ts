/**
 * useElizaData Hook
 * Replaces Eliza message storage with IndexedDB
 * Manages Sofia messages, parsed messages, and triplets from Eliza
 */

import { useState, useEffect, useCallback } from 'react'
import { elizaDataService } from '~lib/database/indexedDB-methods'
import type { ElizaRecord } from '~lib/database/indexedDB'
import type { ParsedSofiaMessage, Message } from '~types/messages'

interface UseElizaDataResult {
  // Data state
  messages: ElizaRecord[]
  parsedMessages: ElizaRecord[]
  allMessages: ElizaRecord[]
  recentMessages: ElizaRecord[]
  
  // Loading states
  isLoading: boolean
  isStoring: boolean
  error: string | null
  
  // Actions
  storeMessage: (message: Message, messageId?: string) => Promise<void>
  storeParsedMessage: (parsedMessage: ParsedSofiaMessage, messageId?: string) => Promise<void>
  refreshMessages: () => Promise<void>
  clearAllMessages: () => Promise<void>
  deleteOldMessages: (daysToKeep?: number) => Promise<number>
  
  // Filters and queries
  getMessagesByType: (type: 'message' | 'parsed_message' | 'triplet') => ElizaRecord[]
  searchMessages: (searchTerm: string) => ElizaRecord[]
  getMessagesInRange: (startDate: number, endDate: number) => ElizaRecord[]
}

interface UseElizaDataOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  maxRecentMessages?: number
  enableSearch?: boolean
}

/**
 * Hook for managing Eliza data with IndexedDB
 */
export const useElizaData = (options: UseElizaDataOptions = {}): UseElizaDataResult => {
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    maxRecentMessages = 50,
    enableSearch = true
  } = options

  // State
  const [messages, setMessages] = useState<ElizaRecord[]>([])
  const [parsedMessages, setParsedMessages] = useState<ElizaRecord[]>([])
  const [allMessages, setAllMessages] = useState<ElizaRecord[]>([])
  const [recentMessages, setRecentMessages] = useState<ElizaRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isStoring, setIsStoring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Load all messages from IndexedDB
   */
  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Load all messages
      const allElizaMessages = await elizaDataService.getAllMessages()
      setAllMessages(allElizaMessages)

      // Separate by type
      const regularMessages = allElizaMessages.filter(msg => msg.type === 'message')
      const parsedMsgs = allElizaMessages.filter(msg => msg.type === 'parsed_message')
      
      setMessages(regularMessages)
      setParsedMessages(parsedMsgs)

      // Get recent messages
      const recent = await elizaDataService.getRecentMessages(maxRecentMessages)
      setRecentMessages(recent)


    } catch (err) {
      console.error('❌ Error loading Eliza messages:', err)
      setError(err instanceof Error ? err.message : 'Failed to load messages')
    } finally {
      setIsLoading(false)
    }
  }, [maxRecentMessages])

  /**
   * Store a regular message from Eliza (auto-parsing handled by elizaDataService)
   */
  const storeMessage = useCallback(async (message: Message, messageId?: string) => {
    try {
      setIsStoring(true)
      setError(null)

      // Store the raw message (elizaDataService handles auto-parsing)
      await elizaDataService.storeMessage(message, messageId)
      
      // Refresh data after storing
      await loadMessages()
      
      console.log('✅ Message stored successfully')

    } catch (err) {
      console.error('❌ Error storing message:', err)
      setError(err instanceof Error ? err.message : 'Failed to store message')
    } finally {
      setIsStoring(false)
    }
  }, [loadMessages])

  /**
   * Store a parsed message with triplets
   */
  const storeParsedMessage = useCallback(async (parsedMessage: ParsedSofiaMessage, messageId?: string) => {
    try {
      setIsStoring(true)
      setError(null)

      await elizaDataService.storeParsedMessage(parsedMessage, messageId)
      
      // Refresh data after storing
      await loadMessages()
      
      console.log('✅ Parsed message stored successfully')

    } catch (err) {
      console.error('❌ Error storing parsed message:', err)
      setError(err instanceof Error ? err.message : 'Failed to store parsed message')
    } finally {
      setIsStoring(false)
    }
  }, [loadMessages])

  /**
   * Refresh messages from IndexedDB
   */
  const refreshMessages = useCallback(async () => {
    await loadMessages()
  }, [loadMessages])

  /**
   * Clear all messages (with confirmation)
   */
  const clearAllMessages = useCallback(async () => {
    try {
      setIsStoring(true)
      setError(null)

      await elizaDataService.clearAll()
      
      // Clear local state
      setMessages([])
      setParsedMessages([])
      setAllMessages([])
      setRecentMessages([])
      
      console.log('🗑️ All Eliza messages cleared')

    } catch (err) {
      console.error('❌ Error clearing messages:', err)
      setError(err instanceof Error ? err.message : 'Failed to clear messages')
    } finally {
      setIsStoring(false)
    }
  }, [])

  /**
   * Delete old messages (older than X days)
   */
  const deleteOldMessages = useCallback(async (daysToKeep: number = 30): Promise<number> => {
    try {
      setIsStoring(true)
      setError(null)

      const deletedCount = await elizaDataService.deleteOldMessages(daysToKeep)
      
      // Refresh data after cleanup
      await loadMessages()
      
      console.log(`🧹 Deleted ${deletedCount} old messages`)
      return deletedCount

    } catch (err) {
      console.error('❌ Error deleting old messages:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete old messages')
      return 0
    } finally {
      setIsStoring(false)
    }
  }, [loadMessages])

  /**
   * Get messages by type (filtered from current state)
   */
  const getMessagesByType = useCallback((type: 'message' | 'parsed_message' | 'triplet') => {
    return allMessages.filter(msg => msg.type === type)
  }, [allMessages])

  /**
   * Search messages by content (if search enabled)
   */
  const searchMessages = useCallback((searchTerm: string): ElizaRecord[] => {
    if (!enableSearch || !searchTerm.trim()) {
      return []
    }

    const term = searchTerm.toLowerCase()
    return allMessages.filter(msg => {
      // Search in message content
      if (msg.type === 'message' && 'content' in msg.content) {
        const content = (msg.content as Message).content
        if (typeof content.text === 'string' && content.text.toLowerCase().includes(term)) {
          return true
        }
      }

      // Search in parsed message intention and triplets
      if (msg.type === 'parsed_message' && 'intention' in msg.content) {
        const parsed = msg.content as ParsedSofiaMessage
        
        // Search intention
        if (parsed.intention.toLowerCase().includes(term)) {
          return true
        }
        
        // Search triplets
        const tripletMatch = parsed.triplets.some(triplet => 
          triplet.subject.toLowerCase().includes(term) ||
          triplet.predicate.toLowerCase().includes(term) ||
          triplet.object.toLowerCase().includes(term)
        )
        if (tripletMatch) {
          return true
        }
      }

      return false
    })
  }, [allMessages, enableSearch])

  /**
   * Get messages in date range
   */
  const getMessagesInRange = useCallback((startDate: number, endDate: number): ElizaRecord[] => {
    return allMessages.filter(msg => 
      msg.timestamp >= startDate && msg.timestamp <= endDate
    )
  }, [allMessages])

  /**
   * Load messages on mount
   */
  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  /**
   * Auto-refresh messages if enabled
   */
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) {
      return
    }

    const interval = setInterval(() => {
      loadMessages()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, loadMessages])

  return {
    // Data state
    messages,
    parsedMessages,
    allMessages,
    recentMessages,
    
    // Loading states
    isLoading,
    isStoring,
    error,
    
    // Actions
    storeMessage,
    storeParsedMessage,
    refreshMessages,
    clearAllMessages,
    deleteOldMessages,
    
    // Filters and queries
    getMessagesByType,
    searchMessages,
    getMessagesInRange
  }
}

/**
 * Simple hook for just storing messages (write-only)
 */
export const useElizaMessageStore = () => {
  const [isStoring, setIsStoring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const storeMessage = useCallback(async (message: Message, messageId?: string) => {
    try {
      setIsStoring(true)
      setError(null)
      await elizaDataService.storeMessage(message, messageId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to store message')
      throw err
    } finally {
      setIsStoring(false)
    }
  }, [])

  const storeParsedMessage = useCallback(async (parsedMessage: ParsedSofiaMessage, messageId?: string) => {
    try {
      setIsStoring(true)
      setError(null)
      await elizaDataService.storeParsedMessage(parsedMessage, messageId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to store parsed message')
      throw err
    } finally {
      setIsStoring(false)
    }
  }, [])

  return {
    storeMessage,
    storeParsedMessage,
    isStoring,
    error
  }
}

/**
 * Hook for reading messages only (read-only, optimized)
 */
export const useElizaMessages = (options: { 
  type?: 'message' | 'parsed_message' | 'all'
  limit?: number 
  autoRefresh?: boolean 
} = {}) => {
  const { type = 'all', limit = 50, autoRefresh = false } = options
  
  const {
    messages,
    parsedMessages,
    allMessages,
    recentMessages,
    isLoading,
    error,
    refreshMessages
  } = useElizaData({ 
    autoRefresh, 
    maxRecentMessages: limit 
  })

  const filteredMessages = type === 'message' ? messages :
                          type === 'parsed_message' ? parsedMessages :
                          allMessages

  return {
    messages: filteredMessages.slice(0, limit),
    recentMessages,
    isLoading,
    error,
    refreshMessages
  }
}

export default useElizaData