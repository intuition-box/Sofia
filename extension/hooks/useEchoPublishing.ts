/**
 * useEchoPublishing Hook
 * Manages publication orchestration for EchoTriplets (individual + batch)
 */

import { useState, useCallback } from 'react'
import { useCreateTripleOnChain, type BatchTripleInput } from './useCreateTripleOnChain'
import { elizaDataService } from '../lib/database/indexedDB-methods'
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
  transactionStatus?: 'success' | 'failed'
  transactionError?: string
  
  // Actions
  publishTriplet: (tripletId: string, customWeight?: bigint) => Promise<void>
  publishSelected: (customWeights?: (bigint | null)[]) => Promise<void>
  clearTransactionStatus: () => void
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
  const [transactionStatus, setTransactionStatus] = useState<'success' | 'failed' | undefined>(undefined)
  const [transactionError, setTransactionError] = useState<string | undefined>(undefined)
  
  const { createTripleOnChain, createTriplesBatch, isCreating } = useCreateTripleOnChain()

  // Clear transaction status
  const clearTransactionStatus = useCallback(() => {
    setTransactionStatus(undefined)
    setTransactionError(undefined)
  }, [])

  // Publish individual triplet
  const publishTriplet = useCallback(async (tripletId: string, customWeight?: bigint) => {
    const triplet = echoTriplets.find(t => t.id === tripletId)
    if (!triplet) return

    if (isCreating || processingTripletId) {
      console.warn('Triple creation already in progress')
      return
    }

    setProcessingTripletId(tripletId)
    setIsProcessing(true)
    
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
      setIsProcessing(false)
    }
  }, [echoTriplets, address, isCreating, processingTripletId, createTripleOnChain, onTripletsUpdate])

  // Publish selected triplets (single or batch) with optional custom weights
  const publishSelected = useCallback(async (customWeights?: (bigint | null)[]) => {
    if (selectedEchoes.size === 0) return
    
    const selectedTriplets = echoTriplets.filter(t => selectedEchoes.has(t.id))
    
    setIsProcessing(true)
    clearTransactionStatus() // Clear previous status
    
    try {
      console.log(`🔗 Starting ${customWeights ? 'weighted ' : ''}batch publication of ${selectedTriplets.length} triplets`)
      
      // Always use batch method (works for single triplet too)
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
        const createdResults = result.results.filter(r => r.source === 'created')
        const existingResults = result.results.filter(r => r.source === 'existing')
        
        console.log(`✅ ${customWeights ? 'Weighted ' : ''}batch publication successful!`, {
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
        
        // Execute database operations sequentially to avoid uniqueness conflicts
        try {
          for (let i = 0; i < selectedTriplets.length; i++) {
            const triplet = selectedTriplets[i]
            const correspondingResult = result.results[i]
            
            // Only process if not failed and has result
            if (correspondingResult && processedTriplets.includes(triplet)) {
              // Execute operations sequentially
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
                id: correspondingResult.tripleVaultId || `temp_${Date.now()}_${i}`
              })
            }
          }
          console.log(`✅ Saved ${processedTriplets.length} triplets to database sequentially`)
        } catch (error) {
          console.error('❌ Database operations failed:', error)
        }
        
        // Update local display only after database operations succeed
        const processedTripletIds = new Set(processedTriplets.map(t => t.id))
        const updatedTriplets = echoTriplets.filter(t => !processedTripletIds.has(t.id))
        onTripletsUpdate(updatedTriplets)
        
        // Set success status
        setTransactionStatus('success')
        
      } else {
        console.error(`❌ ${customWeights ? 'Weighted ' : ''}batch publication had failures:`, result.failedTriples)
        setTransactionStatus('failed')
        setTransactionError(`Batch publication had ${result.failedTriples.length} failures`)
      }
      
    } catch (error) {
      console.error(`❌ ${customWeights ? 'Weighted ' : ''}batch publication failed:`, error)
      setTransactionStatus('failed')
      setTransactionError(error instanceof Error ? error.message : 'Unknown error occurred')
    } finally {
      setIsProcessing(false)
    }
    
    clearSelection()
  }, [selectedEchoes, echoTriplets, address, createTriplesBatch, onTripletsUpdate, clearSelection])

  return {
    isProcessing,
    processingTripletId,
    transactionStatus,
    transactionError,
    publishTriplet,
    publishSelected,
    clearTransactionStatus
  }
}

// Export types for use in components
export type { EchoTriplet }