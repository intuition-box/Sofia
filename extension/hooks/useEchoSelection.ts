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
    
    // Delete source messages from database
    const selectedTriplets = echoTriplets.filter(t => selectedEchoes.has(t.id))
    const messageIdsToDelete = new Set<string>()
    
    selectedTriplets.forEach(triplet => {
      // Extract messageId from tripletId (format: messageId_index)
      const messageId = triplet.sourceMessageId
      messageIdsToDelete.add(messageId)
    })
    
    // Delete source messages from IndexedDB
    for (const messageId of messageIdsToDelete) {
      try {
        // Find and delete message by messageId
        const messages = await elizaDataService.getAllMessages()
        const messageToDelete = messages.find(m => m.messageId === messageId)
        if (messageToDelete && messageToDelete.id) {
          await sofiaDB.delete(STORES.ELIZA_DATA, messageToDelete.id)
          console.log('🗑️ Deleted message from IndexedDB:', messageId)
        }
      } catch (error) {
        console.error('Failed to delete message:', messageId, error)
      }
    }
    
    // Update local display
    const updatedTriplets = echoTriplets.filter(t => !selectedEchoes.has(t.id))
    setEchoTriplets(updatedTriplets)
    
    // Refresh messages to reflect changes
    await refreshMessages()
    
    setSelectedEchoes(new Set())
    setIsSelectAll(false)
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