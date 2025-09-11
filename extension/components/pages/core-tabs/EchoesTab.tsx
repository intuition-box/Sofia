import { useState, useEffect } from 'react'
import { useElizaData } from '../../../hooks/useElizaData'
import { elizaDataService } from '../../../lib/indexedDB-methods'
import sofiaDB, { STORES } from '../../../lib/indexedDB'
import { useCreateTripleOnChain, type BatchTripleInput } from '../../../hooks/useCreateTripleOnChain'
import QuickActionButton from '../../ui/QuickActionButton'
import type { Message, ParsedSofiaMessage, Triplet } from './types'
import { parseSofiaMessage } from './types'
import type { PublishedTripletDetails } from '../../../types/published-triplets'
import { useStorage } from "@plasmohq/storage/hook"
import '../../styles/AtomCreationModal.css'
import '../../styles/CorePage.css'

interface EchoesTabProps {
  expandedTriplet: { msgIndex: number; tripletIndex: number } | null
  setExpandedTriplet: (value: { msgIndex: number; tripletIndex: number } | null) => void
}

// Interface for local triplets in EchoesTab
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
  // Blockchain data (filled after checks)
  subjectVaultId?: string
  predicateVaultId?: string
  objectVaultId?: string
  tripleVaultId?: string
  txHash?: string
  onChainStatus?: 'created' | 'existing'
}

const EchoesTab = ({ expandedTriplet, setExpandedTriplet }: EchoesTabProps) => {
  // Local state for EchoesTab
  const [echoTriplets, setEchoTriplets] = useState<EchoTriplet[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingTripletId, setProcessingTripletId] = useState<string | null>(null)
  const [address] = useStorage<string>("metamask-account")
  const [hasInitialLoad, setHasInitialLoad] = useState(false)
  
  // Selection state management
  const [selectedEchoes, setSelectedEchoes] = useState<Set<string>>(new Set())
  const [isSelectAll, setIsSelectAll] = useState(false)

  // Hook IndexedDB pour les messages Eliza (lecture seule)
  const { 
    messages: rawMessages, 
    isLoading: isLoadingEliza, 
    refreshMessages 
  } = useElizaData({ autoRefresh: true, refreshInterval: 5000 })

  // Blockchain hook for creation (uses other hooks internally)
  const { createTripleOnChain, createTriplesBatch, isCreating, currentStep, batchProgress } = useCreateTripleOnChain()

  // Transform rawMessages directly to echoTriplets
  useEffect(() => {
    const transformMessages = async () => {
      try {
        // Load blacklist of published triplets
        const publishedTripletIds = await elizaDataService.loadPublishedTripletIds()
        
        const newEchoTriplets: EchoTriplet[] = []
        
        for (const record of rawMessages) {
          if (record.type === 'message' && record.content) {
            const message = record.content as Message
            
            try {
              const parsed = parseSofiaMessage(message.content.text, message.created_at)
              
              if (parsed && parsed.triplets.length > 0) {
                parsed.triplets.forEach((triplet, index) => {
                  const tripletId = `${record.messageId}_${index}`
                  
                  // Skip if already published
                  if (publishedTripletIds.includes(tripletId)) {
                    return
                  }
                  
                  const echoTriplet: EchoTriplet = {
                    id: tripletId,
                    triplet: {
                      subject: triplet.subject,
                      predicate: triplet.predicate,
                      object: triplet.object
                    },
                    url: parsed.rawObjectUrl || '',
                    description: parsed.rawObjectDescription || parsed.intention,
                    timestamp: record.timestamp,
                    sourceMessageId: record.messageId,
                    status: 'available'
                  }
                  newEchoTriplets.push(echoTriplet)
                })
              }
            } catch (parseError) {
              // Silent parse errors
            }
          }
        }
        
        setEchoTriplets(newEchoTriplets)
        setHasInitialLoad(true)
        
      } catch (error) {
        console.error('❌ EchoesTab: Failed to transform messages:', error)
        setHasInitialLoad(true)
      }
    }

    transformMessages()
  }, [rawMessages])


  // Publish specific triplet on-chain
  const publishTriplet = async (tripletId: string) => {
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
          subject: address!,
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
      
      // Supprimer de l'affichage local (que ce soit nouveau ou existant)
      const updatedTriplets = echoTriplets.filter(t => t.id !== tripletId)
      setEchoTriplets(updatedTriplets)
      
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
            subject: address!,
            predicate: triplet.triplet.predicate,
            object: triplet.triplet.object
          },
          url: triplet.url,
          description: triplet.description,
          sourceMessageId: triplet.sourceMessageId,
          tripleVaultId: 'existing_' + tripletId, // Placeholder since we don't have the real vaultId
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
        setEchoTriplets(updatedTriplets)
        }
    } finally {
      setProcessingTripletId(null)
    }
  }

  // Nettoyer les anciens messages
  const clearOldMessages = async () => {
    try {
      await elizaDataService.deleteOldMessages(7)
      await refreshMessages()
    } catch (error) {
      console.error('❌ EchoesTab: Cleanup failed:', error)
    }
  }

  const handleViewOnExplorer = (txHash?: string, vaultId?: string) => {
    if (txHash) {
      window.open(`https://testnet.explorer.intuition.systems/tx/${txHash}`, '_blank')
    }
  }

  // Selection functions
  const toggleEchoSelection = (echoId: string) => {
    setSelectedEchoes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(echoId)) {
        newSet.delete(echoId)
        setIsSelectAll(false)
      } else {
        newSet.add(echoId)
        // Check if all available echoes are now selected
        const availableEchoes = echoTriplets.filter(t => t.status === 'available')
        if (newSet.size === availableEchoes.length) {
          setIsSelectAll(true)
        }
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    const availableEchoes = echoTriplets.filter(t => t.status === 'available')
    if (isSelectAll) {
      setSelectedEchoes(new Set())
      setIsSelectAll(false)
    } else {
      setSelectedEchoes(new Set(availableEchoes.map(t => t.id)))
      setIsSelectAll(true)
    }
  }

  const deleteSelectedEchoes = async () => {
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
  }

  const addSelectedToSignals = async () => {
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
          
          // Find which triplets correspond to existing results  
          const existingTripletIds = new Set<string>()
          
          // Match existing results back to original triplet IDs
          existingResults.forEach(existingResult => {
            // Find the original triplet that matches this result
            const matchingTriplet = selectedTriplets.find(triplet => 
              triplet.triplet.predicate === batchInput.find(input => 
                input.predicateName === triplet.triplet.predicate &&
                input.objectData.name === triplet.triplet.object
              )?.predicateName
            )
            if (matchingTriplet) {
              existingTripletIds.add(matchingTriplet.id)
            }
          })
          
          // Add only successfully created or existing triplets to blacklist
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
          console.log('🔍 Starting to store triplet details for', selectedTriplets.length, 'triplets')
          console.log('🔍 Batch results:', result.results)
          console.log('🔍 First batch result structure:', result.results[0])
          console.log('🔍 All result keys:', result.results.map(r => Object.keys(r)))
          console.log('🔍 Batch input structure:', batchInput)
          console.log('🔍 Selected triplets structure:', selectedTriplets.map(t => t.triplet))
          
          for (let i = 0; i < selectedTriplets.length; i++) {
            const triplet = selectedTriplets[i]
            console.log(`🔍 Processing triplet ${i + 1}/${selectedTriplets.length}:`, triplet.triplet)
            
            // Use simple index-based matching for batch results
            // The results should be in the same order as the input
            const correspondingResult = result.results[i]
            
            console.log('🔍 Using index-based matching for result:', i)
            console.log('🔍 Result structure:', correspondingResult)
            console.log('🔍 Result properties:', correspondingResult ? Object.keys(correspondingResult) : 'null')
            
            if (correspondingResult) {
              const publishedDetails: PublishedTripletDetails = {
                originalId: triplet.id,
                triplet: {
                  subject: address!,
                  predicate: triplet.triplet.predicate,
                  object: triplet.triplet.object
                },
                url: triplet.url,
                description: triplet.description,
                sourceMessageId: triplet.sourceMessageId || '',
                // Try different property names based on actual structure
                tripleVaultId: correspondingResult.tripleVaultId  || `temp_${Date.now()}_${i}`,
                txHash: result.txHash || '',
                subjectVaultId: correspondingResult.subjectVaultId || '',
                predicateVaultId: correspondingResult.predicateVaultId ||  '',
                objectVaultId: correspondingResult.objectVaultId ||  '',
                timestamp: Date.now(),
                source: correspondingResult.source || 'created',
                id: correspondingResult.tripleVaultId || `temp_${Date.now()}_${i}`
              }
              
              try {
                console.log(`💾 About to store triplet details for ${triplet.id}:`, publishedDetails)
                await elizaDataService.storePublishedTriplet(publishedDetails)
                console.log(`✅ Successfully stored triplet details for ${triplet.id}`)
              } catch (error) {
                console.error(`❌ Failed to store triplet details for ${triplet.id}:`, error)
              }
            }
          }
          
          // Log summary instead of showing popup
          if (existingResults.length > 0) {
            console.log(`✅ Batch complete! Created: ${createdResults.length} new, ${existingResults.length} already existed`)
          } else if (createdResults.length > 0) {
            console.log(`✅ Batch successful! Created: ${createdResults.length} triplets`, result.txHash)
          }
          
          // Remove only successfully processed triplets (created + existing)
          const processedTripletIds = new Set(processedTriplets.map(t => t.id))
          const updatedTriplets = echoTriplets.filter(t => !processedTripletIds.has(t.id))
          setEchoTriplets(updatedTriplets)
              
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
    
    setSelectedEchoes(new Set())
    setIsSelectAll(false)
  }

  // Statistiques des triplets (seulement disponibles)
  const availableCount = echoTriplets.filter(t => t.status === 'available').length

  // Afficher le loading seulement au premier chargement
  if (isLoadingEliza && !hasInitialLoad) {
    return (
      <div className="triples-container">
        <div className="empty-state">
          <p>Loading...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="triples-container">
      {/* {echoTriplets.length > 0 && (
        <div className="signals-stats">
          <div className="stat-item">
            <span className="stat-number stat-atom-only">{availableCount}</span>
            <span className="stat-label">Available Echoes</span>
          </div>
        </div>
      )} */}
      {/* Selection Panel */}
      {(selectedEchoes.size > 0 || availableCount > 0) && (
        <div className="selection-panel">
          <div className="selection-info">
            <label className="select-all-label">
              <span onClick={toggleSelectAll} style={{cursor: 'pointer'}}>{selectedEchoes.size > 0 ? `${selectedEchoes.size} selected` : 'Select All'}</span>
            </label>
          </div>
          
          {selectedEchoes.size > 0 && (
            <div>
              <div className="batch-actions">
                <button 
                  className="batch-btn add-to-signals"
                  onClick={addSelectedToSignals}
                  disabled={isProcessing}
                >
                  Amplify ({selectedEchoes.size})
                </button>
                <button 
                  className="batch-btn delete-selected"
                  onClick={deleteSelectedEchoes}
                >
                  Remove ({selectedEchoes.size})
                </button>
              </div>
              {isProcessing && selectedEchoes.size > 1 && (
                <div className="processing-message">
                  {currentStep || 'Starting batch...'}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Section d'actions principales */}
      {/* {availableCount > 0 && (
        <div className="import-section">
          <div className="import-header">
            <h3>📡 Echoes ({availableCount})</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn-secondary"
                onClick={clearOldMessages}
                title="Clean old messages"
                style={{ fontSize: '12px', padding: '8px 12px' }}
              >
                Ignore
              </button>
            </div>
          </div>
        </div>
      )} */}


      {/* Liste des triplets disponibles pour publication */}
      {availableCount > 0 && (
        <div style={{ marginBottom: '20px' }}>
          {/* <h4>🔗 Available for Publication ({availableCount})</h4> */}
          {echoTriplets
            .filter(t => t.status === 'available')
            .sort((a, b) => b.timestamp - a.timestamp)
            .map((tripletItem, index) => {
              const isExpanded = expandedTriplet?.msgIndex === 1 && expandedTriplet?.tripletIndex === index

              return (
                <div 
                  key={tripletItem.id} 
                  className={`echo-card ${selectedEchoes.has(tripletItem.id) ? 'border-blue' : 'border-green'}`}
                  onClick={() => toggleEchoSelection(tripletItem.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={`triplet-item ${isExpanded ? 'expanded' : ''} ${selectedEchoes.has(tripletItem.id) ? 'selected' : ''}`}>
                    <div className="echo-header">
                      <p
                        className="triplet-text clickable"
                        onClick={(e) => {
                          e.stopPropagation() // Prevent card selection
                          setExpandedTriplet(isExpanded ? null : { msgIndex: 1, tripletIndex: index })
                        }}
                      >
                        <span className="subject">{(tripletItem.triplet.subject === 'User' || tripletItem.triplet.subject === address) ? 'You' : tripletItem.triplet.subject}</span>{' '}
                        <span className="action">{tripletItem.triplet.predicate}</span>{' '}
                        <span className="object">{tripletItem.triplet.object}</span>
                      </p>
                    </div>


                    {processingTripletId === tripletItem.id && (
                      <div className="processing-message">
                        {currentStep || 'Publishing triplet...'}
                      </div>
                    )}

                    {isExpanded && (
                      <div className="triplet-details">
                        <div className="triplet-detail-section">
                          <h4 className="triplet-detail-title"> Status</h4>
                          <p className="triplet-detail-name">
                            Status: Available for publication
                          </p>
                        </div>

                        <div className="triplet-detail-section">
                          <h4 className="triplet-detail-title">Source</h4>
                          <p className="triplet-detail-name">{tripletItem.url}</p>
                          <p className="triplet-detail-timestamp">
                            {new Date(tripletItem.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          }
        </div>
      )}
      {/* Empty states */}
      {echoTriplets.length === 0 ? (
        <div className="empty-state">
          <p>Continue to navigate</p>
          <p className="empty-subtext">
            Your triplets will appear automatically 
          </p>
        </div>
      ) : availableCount === 0 ? (
        <div className="empty-state">
          <p>All echoes have been amplified!</p>
          <p className="empty-subtext">
            Check the Signals tab to view your published triplets
          </p>
        </div>
      ) : null}
    </div>
  )
}

export default EchoesTab