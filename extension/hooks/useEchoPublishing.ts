/**
 * useEchoPublishing Hook
 * Manages publication orchestration for EchoTriplets (individual + batch)
 */

import { useState, useCallback } from 'react'
import { useCreateTripleOnChain, type BatchTripleInput } from './useCreateTripleOnChain'
import { elizaDataService } from '../lib/indexedDB-methods'
import type { PublishedTripletDetails } from '../types/published-triplets'

// EchoTriplet type (should be exported from EchoesTab later)
interface EchoTriplet {
  id: string
  triplet: {
    subject: string
    predicate: string
    object: string
  }
  url: string
  description: string
  timestamp: number
  sourceMessageId: string
  status: 'available' | 'published'
}

interface UseEchoPublishingParams {
  echoTriplets: EchoTriplet[]
  selectedEchoes: Set<string>
  address: string
  onTripletsUpdate: (updatedTriplets: EchoTriplet[]) => void
  clearSelection: () => void
}

interface UseEchoPublishingResult {
  // State
  isProcessing: boolean
  processingTripletId: string | null
  
  // Actions
  publishTriplet: (tripletId: string) => Promise<void>
  publishSelected: () => Promise<void>
}

export const useEchoPublishing = ({
  echoTriplets,
  selectedEchoes,
  address,
  onTripletsUpdate,
  clearSelection
}: UseEchoPublishingParams): UseEchoPublishingResult => {
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingTripletId, setProcessingTripletId] = useState<string | null>(null)
  
  const { createTripleOnChain, createTriplesBatch, isCreating } = useCreateTripleOnChain()

  // Publish individual triplet
  const publishTriplet = useCallback(async (tripletId: string) => {
    const triplet = echoTriplets.find(t => t.id === tripletId)
    if (!triplet) return

    if (isCreating || processingTripletId) {
      console.warn('Triple creation already in progress')
      return
    }

    setProcessingTripletId(tripletId)
    
    try {
      const result = await createTripleOnChain(
        triplet.triplet.predicate,
        {
          name: triplet.triplet.object,
          description: triplet.description,
          url: triplet.url
        }
      )

      // Save to database first (both blacklist and details)
      await Promise.all([
        elizaDataService.addPublishedTripletId(tripletId),
        elizaDataService.storePublishedTriplet({
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
          id: result.tripleVaultId
        })
      ])
      
      console.log(`✅ Published triplet ${result.source === 'existing' ? '(already existed)' : '(new)'}: ${result.tripleVaultId}`)
      
      // Update local display only after database operations succeed
      const updatedTriplets = echoTriplets.filter(t => t.id !== tripletId)
      onTripletsUpdate(updatedTriplets)
      
    } catch (error) {
      console.error(`❌ Failed to publish triplet ${tripletId}:`, error)
      
      // For TRIPLE_ALREADY_EXISTS error, treat as successful (just mark as published)
      if (error instanceof Error && error.message === 'TRIPLE_ALREADY_EXISTS') {
        console.log('✅ Triple already exists on chain, marking as published')
        
        try {
          await Promise.all([
            elizaDataService.addPublishedTripletId(tripletId),
            elizaDataService.storePublishedTriplet({
              originalId: tripletId,
              triplet: {
                subject: address,
                predicate: triplet.triplet.predicate,
                object: triplet.triplet.object
              },
              url: triplet.url,
              description: triplet.description,
              sourceMessageId: triplet.sourceMessageId,
              tripleVaultId: 'existing_' + tripletId,
              txHash: '',
              subjectVaultId: '', 
              predicateVaultId: '',
              objectVaultId: '',
              timestamp: Date.now(),
              source: 'existing',
              id: 'existing_' + tripletId
            })
          ])
          
          // Remove from local display only if database operations succeed
          const updatedTriplets = echoTriplets.filter(t => t.id !== tripletId)
          onTripletsUpdate(updatedTriplets)
          
        } catch (dbError) {
          console.error(`❌ Failed to save existing triplet ${tripletId}:`, dbError)
        }
      }
    } finally {
      setProcessingTripletId(null)
    }
  }, [echoTriplets, address, isCreating, processingTripletId, createTripleOnChain, onTripletsUpdate])

  // Publish selected triplets (single or batch)
  const publishSelected = useCallback(async () => {
    if (selectedEchoes.size === 0) return
    
    const selectedTriplets = echoTriplets.filter(t => selectedEchoes.has(t.id))
    
    if (selectedTriplets.length === 1) {
      // Single triplet - use existing individual method
      try {
        await publishTriplet(selectedTriplets[0].id)
      } catch (error) {
        console.error(`Failed to publish triplet ${selectedTriplets[0].id}:`, error)
      }
    } else if (selectedTriplets.length > 1) {
      // Multiple triplets - use batch method
      setIsProcessing(true)
      
      try {
        console.log(`🔗 Starting batch publication of ${selectedTriplets.length} triplets`)
        
        // Prepare batch input
        const batchInput = selectedTriplets.map(triplet => ({
          predicateName: triplet.triplet.predicate,
          objectData: {
            name: triplet.triplet.object,
            description: triplet.description,
            url: triplet.url
          }
        }))
        
        const result = await createTriplesBatch(batchInput)
        
        if (result.success) {
          const createdResults = result.results.filter(r => r.source === 'created')
          const existingResults = result.results.filter(r => r.source === 'existing')
          
          console.log('✅ Batch publication successful!', {
            created: createdResults.length,
            existing: existingResults.length,
            failed: result.failedTriples.length,
            txHash: result.txHash
          })
          
          // Process successful triplets - parallel database operations
          const processedTriplets = selectedTriplets.filter(triplet => 
            !result.failedTriples.some(failed => 
              failed.input.predicateName === triplet.triplet.predicate &&
              failed.input.objectData.name === triplet.triplet.object
            )
          )
          
          // Prepare all database operations in parallel
          const dbOperations = []
          
          for (let i = 0; i < selectedTriplets.length; i++) {
            const triplet = selectedTriplets[i]
            const correspondingResult = result.results[i]
            
            // Only process if not failed and has result
            if (correspondingResult && processedTriplets.includes(triplet)) {
              // Add blacklist operation
              dbOperations.push(elizaDataService.addPublishedTripletId(triplet.id))
              
              // Add storage operation
              dbOperations.push(elizaDataService.storePublishedTriplet({
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
                id: correspondingResult.tripleVaultId || `temp_${Date.now()}_${i}`
              }))
            }
          }
          
          // Execute all database operations in parallel
          try {
            await Promise.all(dbOperations)
            console.log(`✅ Saved ${processedTriplets.length} triplets to database`)
          } catch (error) {
            console.error('❌ Some database operations failed:', error)
          }
          
          // Log completion summary
          console.log(`✅ Batch complete! Created: ${createdResults.length} new, ${existingResults.length} already existed`)
          
          // Update local display only after database operations succeed
          const processedTripletIds = new Set(processedTriplets.map(t => t.id))
          const updatedTriplets = echoTriplets.filter(t => !processedTripletIds.has(t.id))
          onTripletsUpdate(updatedTriplets)
          
        } else {
          console.error('❌ Batch publication had failures:', result.failedTriples)
          console.log(`❌ Batch completed with ${result.failedTriples.length} failed triplets`)
        }
        
      } catch (error) {
        console.error('❌ Batch publication failed:', error)
      } finally {
        setIsProcessing(false)
      }
    }
    
    clearSelection()
  }, [selectedEchoes, echoTriplets, address, publishTriplet, createTriplesBatch, onTripletsUpdate, clearSelection])

  return {
    isProcessing,
    processingTripletId,
    publishTriplet,
    publishSelected
  }
}

// Export types for use in components
export type { EchoTriplet }