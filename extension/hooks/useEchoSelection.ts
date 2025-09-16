/**
 * useEchoSelection Hook
 * Manages multiple selection logic for echo triplets
 */

import { useState, useCallback } from 'react'

interface EchoTriplet {
  id: string
  status: 'available' | 'published'
}

interface UseEchoSelectionResult {
  // Selection state
  selectedEchoes: Set<string>
  isSelectAll: boolean
  
  // Selection actions
  toggleEchoSelection: (echoId: string) => void
  toggleSelectAll: () => void
  clearSelection: () => void
  selectMultiple: (echoIds: string[]) => void
  deleteSelected: () => Promise<void>
}

interface UseEchoSelectionProps {
  availableEchoes: EchoTriplet[]
  echoTriplets: any[]
  setEchoTriplets: (triplets: any[]) => void
  refreshMessages: () => Promise<void>
  elizaDataService: any
  sofiaDB: any
  STORES: any
}

export const useEchoSelection = ({
  availableEchoes,
  echoTriplets,
  setEchoTriplets,
  refreshMessages,
  elizaDataService,
  sofiaDB,
  STORES
}: UseEchoSelectionProps): UseEchoSelectionResult => {
  const [selectedEchoes, setSelectedEchoes] = useState<Set<string>>(new Set())
  const [isSelectAll, setIsSelectAll] = useState(false)

  const toggleEchoSelection = useCallback((echoId: string) => {
    setSelectedEchoes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(echoId)) {
        newSet.delete(echoId)
        setIsSelectAll(false)
      } else {
        newSet.add(echoId)
        // Check if all available echoes are now selected
        if (newSet.size === availableEchoes.length) {
          setIsSelectAll(true)
        }
      }
      return newSet
    })
  }, [availableEchoes.length])

  const toggleSelectAll = useCallback(() => {
    if (isSelectAll) {
      setSelectedEchoes(new Set())
      setIsSelectAll(false)
    } else {
      setSelectedEchoes(new Set(availableEchoes.map(t => t.id)))
      setIsSelectAll(true)
    }
  }, [isSelectAll, availableEchoes])

  const clearSelection = useCallback(() => {
    setSelectedEchoes(new Set())
    setIsSelectAll(false)
  }, [])

  const selectMultiple = useCallback((echoIds: string[]) => {
    setSelectedEchoes(new Set(echoIds))
    setIsSelectAll(echoIds.length === availableEchoes.length)
  }, [availableEchoes.length])

  const deleteSelected = useCallback(async () => {
    if (selectedEchoes.size === 0) return
    
    const selectedTriplets = echoTriplets.filter(t => selectedEchoes.has(t.id))
    const messageIdsToDelete = new Set<string>()
    
    // Collect unique message IDs to delete
    selectedTriplets.forEach(triplet => {
      const messageId = triplet.sourceMessageId
      messageIdsToDelete.add(messageId)
    })
    
    try {
      // Get all messages first 
      const messages = await elizaDataService.getAllMessages()
      
      // Prepare all delete operations in parallel
      const deleteOperations = []
      const messagesToDelete = []
      
      for (const messageId of messageIdsToDelete) {
        const messageToDelete = messages.find(m => m.messageId === messageId)
        if (messageToDelete && messageToDelete.id) {
          deleteOperations.push(sofiaDB.delete(STORES.ELIZA_DATA, messageToDelete.id))
          messagesToDelete.push(messageId)
        }
      }
      
      // Execute all database deletions in parallel
      await Promise.all(deleteOperations)
      console.log(`🗑️ Deleted ${messagesToDelete.length} messages from IndexedDB`)
      
      // Update local display only after database operations succeed
      const updatedTriplets = echoTriplets.filter(t => !selectedEchoes.has(t.id))
      setEchoTriplets(updatedTriplets)
      
      // Clear selection
      setSelectedEchoes(new Set())
      setIsSelectAll(false)
      
      // Refresh messages to ensure consistency (after local updates)
      await refreshMessages()
      
      // Notify background to update badge count after deletion
      try {
        chrome.runtime.sendMessage({ type: 'TRIPLETS_DELETED' })
        console.log('📤 Notified background of triplet deletion')
      } catch (error) {
        console.error('❌ Failed to notify background of triplet deletion:', error)
      }
      
    } catch (error) {
      console.error('❌ Failed to delete selected messages:', error)
      // Don't update local state if database operations failed
    }
  }, [selectedEchoes, echoTriplets, setEchoTriplets, refreshMessages, elizaDataService, sofiaDB, STORES])

  return {
    selectedEchoes,
    isSelectAll,
    toggleEchoSelection,
    toggleSelectAll,
    clearSelection,
    selectMultiple,
    deleteSelected
  }
}