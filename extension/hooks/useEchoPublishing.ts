/**
 * useEchoPublishing Hook
 * Simplified publishing orchestration using existing blockchain hooks
 */

import { useState, useCallback } from 'react'
import { useCreateTripleOnChain } from './useCreateTripleOnChain'
import { elizaDataService } from '../lib/database/indexedDB-methods'
import type { EchoTriplet } from '../types/blockchain'

interface UseEchoPublishingParams {
  echoTriplets: EchoTriplet[]
  selectedEchoes: Set<string>
  address: string
  onTripletsUpdate: (updatedTriplets: EchoTriplet[]) => void
  clearSelection: () => void
}

interface UseEchoPublishingResult {
  publishTriplet: (tripletId: string, customWeight?: bigint) => Promise<void>
  publishSelected: (customWeights?: (bigint | null)[]) => Promise<void>
  isCreating: boolean
  error: Error | null
  transactionStatus?: 'success' | 'failed'
  transactionError?: string
  clearTransactionStatus: () => void
}

export const useEchoPublishing = ({
  echoTriplets,
  selectedEchoes,
  address,
  onTripletsUpdate,
  clearSelection
}: UseEchoPublishingParams): UseEchoPublishingResult => {
  
  const { createTripleOnChain, createTriplesBatch, isCreating, error } = useCreateTripleOnChain()
  
  // Local state for modal feedback
  const [transactionStatus, setTransactionStatus] = useState<'success' | 'failed' | undefined>(undefined)
  const [transactionError, setTransactionError] = useState<string | undefined>(undefined)

  const publishTriplet = useCallback(async (tripletId: string, customWeight?: bigint) => {
    const triplet = echoTriplets.find(t => t.id === tripletId)
    if (!triplet || isCreating) return
    
    try {
      const result = await createTripleOnChain(
        triplet.triplet.predicate,
        {
          name: triplet.triplet.object,
          description: triplet.description,
          url: triplet.url
        },
        customWeight
      )

      await elizaDataService.addPublishedTripletId(tripletId)
      await elizaDataService.storePublishedTriplet({
        originalId: tripletId,
        triplet: {
          subject: address,
          predicate: triplet.triplet.predicate,
          object: triplet.triplet.object
        },
        url: triplet.url,
        description: triplet.description,
        sourceMessageId: triplet.sourceMessageId,
        tripleVaultId: result.tripleVaultId,
        txHash: result.txHash || '',
        subjectVaultId: result.subjectVaultId,
        predicateVaultId: result.predicateVaultId,
        objectVaultId: result.objectVaultId,
        timestamp: Date.now(),
        source: result.source,
        id: result.tripleVaultId,
        customWeight: customWeight?.toString()
      })
      
      onTripletsUpdate(echoTriplets.filter(t => t.id !== tripletId))
      setTransactionStatus('success')
    } catch (error) {
      setTransactionStatus('failed')
      setTransactionError(error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }, [echoTriplets, address, isCreating, createTripleOnChain, onTripletsUpdate])

  const publishSelected = useCallback(async (customWeights?: (bigint | null)[]) => {
    if (selectedEchoes.size === 0 || isCreating) return
    
    const selectedTriplets = echoTriplets.filter(t => selectedEchoes.has(t.id))
    
    try {
      const batchInput = selectedTriplets.map((triplet, index) => ({
        predicateName: triplet.triplet.predicate,
        objectData: {
          name: triplet.triplet.object,
          description: triplet.description,
          url: triplet.url
        },
        customWeight: customWeights?.[index] || undefined
      }))
      
      const result = await createTriplesBatch(batchInput)
      
      if (result.success) {
        for (let i = 0; i < selectedTriplets.length; i++) {
          const triplet = selectedTriplets[i]
          const correspondingResult = result.results[i]
          
          if (correspondingResult) {
            await elizaDataService.addPublishedTripletId(triplet.id)
            await elizaDataService.storePublishedTriplet({
              originalId: triplet.id,
              triplet: {
                subject: address,
                predicate: triplet.triplet.predicate,
                object: triplet.triplet.object
              },
              url: triplet.url,
              description: triplet.description,
              sourceMessageId: triplet.sourceMessageId,
              tripleVaultId: correspondingResult.tripleVaultId || `temp_${Date.now()}_${i}`,
              txHash: result.txHash || '',
              subjectVaultId: correspondingResult.subjectVaultId || '',
              predicateVaultId: correspondingResult.predicateVaultId || '',
              objectVaultId: correspondingResult.objectVaultId || '',
              timestamp: Date.now(),
              source: correspondingResult.source || 'created',
              id: correspondingResult.tripleVaultId || `temp_${Date.now()}_${i}`,
              customWeight: customWeights?.[i]?.toString()
            })
          }
        }
        
        const publishedIds = new Set(selectedTriplets.map(t => t.id))
        onTripletsUpdate(echoTriplets.filter(t => !publishedIds.has(t.id)))
        setTransactionStatus('success')
      } else {
        setTransactionStatus('failed')
        setTransactionError('Some triplets failed to publish')
      }
    } catch (error) {
      setTransactionStatus('failed')
      setTransactionError(error instanceof Error ? error.message : 'Unknown error')
      throw error
    } finally {
      clearSelection()
    }
  }, [selectedEchoes, echoTriplets, address, createTriplesBatch, onTripletsUpdate, clearSelection, isCreating])

  const clearTransactionStatus = useCallback(() => {
    setTransactionStatus(undefined)
    setTransactionError(undefined)
  }, [])

  return {
    publishTriplet,
    publishSelected,
    isCreating,
    error,
    transactionStatus,
    transactionError,
    clearTransactionStatus
  }
}