/**
 * useEchoPublishing Hook
 * Simplified publishing orchestration using existing blockchain hooks
 */

import { useCallback } from 'react'
import { useCreateTripleOnChain } from './useCreateTripleOnChain'
import { elizaDataService } from '../lib/database/indexedDB-methods'
import type { EchoTriplet, TripleOnChainResult, BatchTripleResult } from '../types/blockchain'

interface UseEchoPublishingParams {
  echoTriplets: EchoTriplet[]
  selectedEchoes: Set<string>
  address: string
  onTripletsUpdate: (updatedTriplets: EchoTriplet[]) => void
  clearSelection: () => void
}

interface UseEchoPublishingResult {
  publishTriplet: (tripletId: string, customWeight?: bigint) => Promise<TripleOnChainResult>
  publishSelected: (customWeights?: (bigint | null)[]) => Promise<BatchTripleResult>
}

export const useEchoPublishing = ({
  echoTriplets,
  selectedEchoes,
  address,
  onTripletsUpdate,
  clearSelection
}: UseEchoPublishingParams): UseEchoPublishingResult => {
  
  const { createTripleOnChain, createTriplesBatch } = useCreateTripleOnChain()

  const publishTriplet = useCallback(async (tripletId: string, customWeight?: bigint): Promise<TripleOnChainResult> => {
    const triplet = echoTriplets.find(t => t.id === tripletId)
    if (!triplet) {
      throw new Error(`Triplet with ID ${tripletId} not found`)
    }
    
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

      // Mark as published in local storage (to hide from EchoesTab)
      await elizaDataService.addPublishedTripletId(tripletId)
      
      onTripletsUpdate(echoTriplets.filter(t => t.id !== tripletId))
      
      return result
    } catch (error) {
      throw error
    }
  }, [echoTriplets, createTripleOnChain, onTripletsUpdate])

  const publishSelected = useCallback(async (customWeights?: (bigint | null)[]): Promise<BatchTripleResult> => {
    if (selectedEchoes.size === 0) {
      throw new Error('No triplets selected for publication')
    }
    
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
        // Mark all published triplets in local storage (to hide from EchoesTab)
        for (let i = 0; i < selectedTriplets.length; i++) {
          const triplet = selectedTriplets[i]
          const correspondingResult = result.results[i]
          
          if (correspondingResult) {
            await elizaDataService.addPublishedTripletId(triplet.id)
          }
        }
        
        const publishedIds = new Set(selectedTriplets.map(t => t.id))
        onTripletsUpdate(echoTriplets.filter(t => !publishedIds.has(t.id)))
      }
      
      clearSelection()
      return result
    } catch (error) {
      clearSelection()
      throw error
    }
  }, [selectedEchoes, echoTriplets, createTriplesBatch, onTripletsUpdate, clearSelection])

  return {
    publishTriplet,
    publishSelected
  }
}