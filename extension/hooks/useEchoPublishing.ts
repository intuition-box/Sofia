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

      // Add to blacklist to prevent recreation
      await elizaDataService.addPublishedTripletId(tripletId)
      
      // Save complete details for SignalsTab
      const publishedTripletDetails: PublishedTripletDetails = {
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
      }
      
      await elizaDataService.storePublishedTriplet(publishedTripletDetails)
      console.log('💾 Triplet details saved for SignalsTab')
      
      // Check if triplet already existed on chain
      if (result.source === 'existing') {
        console.log(`✅ Triplet already exists on chain! Vault ID: ${result.tripleVaultId}`)
      }
      
      // Update local display
      const updatedTriplets = echoTriplets.filter(t => t.id !== tripletId)
      onTripletsUpdate(updatedTriplets)
      
    } catch (error) {
      console.error(`❌ Failed to publish triplet ${tripletId}:`, error)
      
      // Check if error is due to triple already existing
      if (error instanceof Error && error.message === 'TRIPLE_ALREADY_EXISTS') {
        console.log('✅ Triple already exists on chain, removing from list')
        
        // Add to blacklist to prevent recreation
        await elizaDataService.addPublishedTripletId(tripletId)
        
        // Save details for SignalsTab even if existing
        const publishedTripletDetails: PublishedTripletDetails = {
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
        }
        
        await elizaDataService.storePublishedTriplet(publishedTripletDetails)
        
        console.log(`✅ Triplet already exists on chain! Removing from pending list.`)
        
        // Remove from local display
        const updatedTriplets = echoTriplets.filter(t => t.id !== tripletId)
        onTripletsUpdate(updatedTriplets)
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
          
          // Add successfully processed triplets to blacklist
          const processedTriplets = selectedTriplets.filter(triplet => 
            !result.failedTriples.some(failed => 
              failed.input.predicateName === triplet.triplet.predicate &&
              failed.input.objectData.name === triplet.triplet.object
            )
          )
          
          for (const triplet of processedTriplets) {
            await elizaDataService.addPublishedTripletId(triplet.id)
          }
          
          // Store detailed triplet information for successful publications
          for (let i = 0; i < selectedTriplets.length; i++) {
            const triplet = selectedTriplets[i]
            const correspondingResult = result.results[i]
            
            if (correspondingResult) {
              const publishedDetails: PublishedTripletDetails = {
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
              }
              
              try {
                await elizaDataService.storePublishedTriplet(publishedDetails)
                console.log(`✅ Successfully stored triplet details for ${triplet.id}`)
              } catch (error) {
                console.error(`❌ Failed to store triplet details for ${triplet.id}:`, error)
              }
            }
          }
          
          // Log completion summary
          if (existingResults.length > 0) {
            console.log(`✅ Batch complete! Created: ${createdResults.length} new, ${existingResults.length} already existed`)
          } else if (createdResults.length > 0) {
            console.log(`✅ Batch successful! Created: ${createdResults.length} triplets`, result.txHash)
          }
          
          // Remove successfully processed triplets
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