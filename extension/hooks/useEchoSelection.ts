/**
 * useEchoSelection Hook
 * Manages multiple selection logic for echo triplets
 */

import { useState, useCallback } from 'react'
import { MessageBus } from '~lib/services/MessageBus'
import type { EchoTriplet, UseEchoSelectionProps } from '../types/hooks'

interface UseEchoSelectionResult {
  // Selection state
  selectedEchoes: Set<string>
  isSelectAll: boolean
  
  // Selection actions
  toggleEchoSelection: (echoId: string) => void
  toggleSelectAll: () => void
  clearSelection: () => void
  selectMultiple: (echoIds: string[]) => void
  deleteSelected: () => Promise<{ deletedCount: number, remainingTriplets: EchoTriplet[] }>
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

  const deleteSelected = useCallback(async (): Promise<{ deletedCount: number, remainingTriplets: EchoTriplet[] }> => {
    if (selectedEchoes.size === 0) {
      return { deletedCount: 0, remainingTriplets: echoTriplets }
    }
    
    const selectedTriplets = echoTriplets.filter(t => selectedEchoes.has(t.id))
    const messageIdsToDelete = new Set<string>()
    
    selectedTriplets.forEach(triplet => {
      const messageId = triplet.sourceMessageId
      messageIdsToDelete.add(messageId)
    })
    
    try {
      const messages = await elizaDataService.getAllMessages()
      const deleteOperations = []
      const messagesToDelete = []
      
      for (const messageId of messageIdsToDelete) {
        const messageToDelete = messages.find(m => m.messageId === messageId)
        if (messageToDelete && messageToDelete.id) {
          deleteOperations.push(sofiaDB.delete(STORES.ELIZA_DATA, messageToDelete.id))
          messagesToDelete.push(messageId)
        }
      }
      
      await Promise.all(deleteOperations)
      
      const updatedTriplets = echoTriplets.filter(t => !selectedEchoes.has(t.id))
      setEchoTriplets(updatedTriplets)
      
      setSelectedEchoes(new Set())
      setIsSelectAll(false)
      
      await refreshMessages()
      
      try {
        MessageBus.getInstance().sendMessageFireAndForget({ type: 'TRIPLETS_DELETED' })
      } catch (error) {
        console.error('❌ Failed to notify background of triplet deletion:', error)
      }
      
      return { deletedCount: messagesToDelete.length, remainingTriplets: updatedTriplets }
      
    } catch (error) {
      console.error('❌ Failed to delete selected messages:', error)
      throw new Error('Failed to delete selected triplets')
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