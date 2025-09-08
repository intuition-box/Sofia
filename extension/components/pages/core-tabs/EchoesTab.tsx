import { useState, useEffect } from 'react'
import { useElizaData } from '../../../hooks/useElizaData'
import { elizaDataService } from '../../../lib/indexedDB-methods'
import { useCreateTripleOnChain, type BatchTripleInput } from '../../../hooks/useCreateTripleOnChain'
import QuickActionButton from '../../ui/QuickActionButton'
import type { Message, ParsedSofiaMessage, Triplet } from './types'
import { parseSofiaMessage } from './types'
import { useStorage } from "@plasmohq/storage/hook"
import '../../styles/AtomCreationModal.css'
import '../../styles/CorePage.css'

interface EchoesTabProps {
  expandedTriplet: { msgIndex: number; tripletIndex: number } | null
  setExpandedTriplet: (value: { msgIndex: number; tripletIndex: number } | null) => void
}

// Interface pour les triplets locaux à EchoesTab
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
  // État local à EchoesTab
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

  // Hook blockchain pour la création (utilise les autres hooks en interne)
  const { createTripleOnChain, createTriplesBatch, isCreating, currentStep } = useCreateTripleOnChain()

  // Charger les états sauvegardés puis traiter les messages
  useEffect(() => {
    loadSavedStatesAndProcess()
  }, [rawMessages])

  // Sauvegarder les états quand ils changent (éviter boucle infinie)
  useEffect(() => {
    if (echoTriplets.length > 0) {
      // Débounce pour éviter les sauvegardes trop fréquentes
      const timeoutId = setTimeout(() => {
        saveTripletStates()
      }, 500)
      
      return () => clearTimeout(timeoutId)
    }
  }, [echoTriplets])

  const processRawMessages = async (savedStates?: EchoTriplet[]) => {
    try {
      // Charger la liste noire des triplets publiés
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
                
                // Vérifier si le triplet a été publié (liste noire)
                if (publishedTripletIds.includes(tripletId)) {
                  return // Skip ce triplet définitivement
                }
                
                // Vérifier si le triplet existe déjà dans les états sauvegardés
                const existingTriplet = savedStates?.find(t => t.id === tripletId) || 
                                    echoTriplets.find(t => t.id === tripletId)
                
                // Si le triplet existe déjà, le garder tel quel
                if (existingTriplet) {
                  newEchoTriplets.push(existingTriplet)
                } else {
                  // Créer un nouveau triplet en statut 'available'
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
                }
              })
            }
          } catch (parseError) {
            // Silent parse errors
            // Silent parse errors
          }
        }
      }
      
      // Éviter le glitch en ne mettant à jour que si la liste a réellement changé
      setEchoTriplets(prev => {
        // Comparer les IDs pour éviter une mise à jour inutile
        const prevIds = prev.map(t => t.id).sort().join(',')
        const newIds = newEchoTriplets.map(t => t.id).sort().join(',')
        
        if (prevIds === newIds) {
          return prev // Garder l'état précédent si identique
        }
        
        return newEchoTriplets
      })
      
    } catch (error) {
      console.error('❌ EchoesTab: Failed to process messages:', error)
    }
  }

  // Charger les états sauvegardés et traiter les messages  
  const loadSavedStatesAndProcess = async () => {
    try {
      const savedStates = await elizaDataService.loadTripletStates()
      
      // Utiliser la fonction unifiée avec les états sauvegardés
      await processRawMessages(savedStates.length > 0 ? savedStates : undefined)
      
      // Marquer le chargement initial comme terminé
      if (!hasInitialLoad) {
        setHasInitialLoad(true)
      }
      
    } catch (error) {
      console.error('❌ EchoesTab: Failed to load saved states:', error)
      await processRawMessages()
      
      // Marquer le chargement initial comme terminé même en cas d'erreur
      if (!hasInitialLoad) {
        setHasInitialLoad(true)
      }
    }
  }

  // Sauvegarder les états des triplets
  const saveTripletStates = async () => {
    try {
      await elizaDataService.storeTripletStates(echoTriplets)
    } catch (error) {
      console.error('❌ EchoesTab: Failed to save triplet states:', error)
    }
  }


  // Publier un triplet spécifique on-chain
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

      // Ajouter à la liste noire pour empêcher la recréation
      await elizaDataService.addPublishedTripletId(tripletId)
      
      // Check if triplet already existed on chain
      if (result.source === 'existing') {
        // Show popup for existing triplet
        alert(`✅ Triplet already exists on chain!\nVault ID: ${result.tripleVaultId}\nRemoving from your pending list.`)
      }
      
      // Supprimer de l'affichage local (que ce soit nouveau ou existant)
      const updatedTriplets = echoTriplets.filter(t => t.id !== tripletId)
      setEchoTriplets(updatedTriplets)
      await elizaDataService.storeTripletStates(updatedTriplets)
      
    } catch (error) {
      console.error(`❌ Failed to publish triplet ${tripletId}:`, error)
      
      // Check if error is due to triple already existing
      if (error instanceof Error && error.message === 'TRIPLE_ALREADY_EXISTS') {
        console.log('✅ Triple already exists on chain, removing from list')
        
        // Add to blacklist to prevent recreation
        await elizaDataService.addPublishedTripletId(tripletId)
        
        // Show popup for existing triplet
        alert(`✅ Triplet already exists on chain!\nRemoving from your pending list.`)
        
        // Remove from local display
        const updatedTriplets = echoTriplets.filter(t => t.id !== tripletId)
        setEchoTriplets(updatedTriplets)
        await elizaDataService.storeTripletStates(updatedTriplets)
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
    
    setEchoTriplets(prev => prev.filter(t => !selectedEchoes.has(t.id)))
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
          
          // Show summary alert
          if (existingResults.length > 0) {
            alert(`✅ Batch complete!
Created: ${createdResults.length} new triplets
Already existed: ${existingResults.length} triplets (removed from list)
${result.txHash ? `Transaction: ${result.txHash.slice(0, 10)}...${result.txHash.slice(-8)}` : ''}

Successfully processed triplets removed from your pending list.`)
          } else if (createdResults.length > 0) {
            alert(`✅ Batch successful!
Created: ${createdResults.length} triplets in single transaction
${result.txHash ? `Transaction: ${result.txHash.slice(0, 10)}...${result.txHash.slice(-8)}` : ''}`)
          }
          
          // Remove only successfully processed triplets (created + existing)
          const processedTripletIds = new Set(processedTriplets.map(t => t.id))
          const updatedTriplets = echoTriplets.filter(t => !processedTripletIds.has(t.id))
          setEchoTriplets(updatedTriplets)
          await elizaDataService.storeTripletStates(updatedTriplets)
          
        } else {
          console.error('❌ Batch publication had failures:', result.failedTriples)
          alert(`❌ Batch completed with some errors:
${result.failedTriples.length} triplets failed
Check console for details`)
        }
        
      } catch (error) {
        console.error('❌ Batch publication failed:', error)
        alert(`❌ Batch publication failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

      {/* Stats */}
      {echoTriplets.length > 0 && (
        <div className="signals-stats">
          <div className="stat-item">
            <span className="stat-number stat-atom-only">{availableCount}</span>
            <span className="stat-label">Available Echoes</span>
          </div>
        </div>
      )}
      {/* Selection Panel */}
      {(selectedEchoes.size > 0 || availableCount > 0) && (
        <div className="selection-panel">
          <div className="selection-info">
            <label className="select-all-label">
              <input
                type="checkbox"
                checked={isSelectAll}
                onChange={toggleSelectAll}
                className="select-all-checkbox"
              />
              <span>{selectedEchoes.size > 0 ? `${selectedEchoes.size} selected` : 'Select All'}</span>
            </label>
          </div>
          
          {selectedEchoes.size > 0 && (
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
                <div key={tripletItem.id} className="echo-card border-green">
                  <div className={`triplet-item ${isExpanded ? 'expanded' : ''} ${selectedEchoes.has(tripletItem.id) ? 'selected' : ''}`}>
                    <div className="echo-header">
                      <input
                        type="checkbox"
                        checked={selectedEchoes.has(tripletItem.id)}
                        onChange={() => toggleEchoSelection(tripletItem.id)}
                        className="echo-checkbox"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <p
                        className="triplet-text clickable"
                        onClick={() => {
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
                        {currentStep || '⚙️ Publishing triplet...'}
                      </div>
                    )}

                    {isExpanded && (
                      <div className="triplet-details">
                        <div className="triplet-detail-section">
                          <h4 className="triplet-detail-title">⛓️ Status</h4>
                          <p className="triplet-detail-name">
                            Status: 📡 Available for publication
                          </p>
                        </div>

                        <div className="triplet-detail-section">
                          <h4 className="triplet-detail-title">🌐 Source</h4>
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
      {/* États vides */}
      {echoTriplets.length === 0 ? (
        <div className="empty-state">
          <p>No SofIA messages found</p>
          <p className="empty-subtext">
            Your triplets will appear automatically when you receive messages
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