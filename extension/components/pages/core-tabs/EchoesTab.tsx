import { useState, useEffect } from 'react'
import { useElizaData } from '../../../hooks/useElizaData'
import { elizaDataService } from '../../../lib/indexedDB-methods'
import { useCreateTripleOnChain } from '../../../hooks/useCreateTripleOnChain'
import { useContractTest } from '../../../hooks/useContractTest'
import QuickActionButton from '../../ui/QuickActionButton'
import type { Message, ParsedSofiaMessage, Triplet } from './types'
import { parseSofiaMessage } from './types'
import { useAccount } from 'wagmi'
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
  const { address } = useAccount() // Get connected wallet address
  
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
  const { createTripleOnChain, isCreating, currentStep } = useCreateTripleOnChain()
  
  // Hook de test pour debug
  const { testContract, isLoading: isTestLoading, results: testResults } = useContractTest()

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
                  return
                }
                
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
              })
            }
          } catch (parseError) {
            // Silent parse errors
          }
        }
      }
      
      setEchoTriplets(newEchoTriplets)
      
    } catch (error) {
      console.error('❌ EchoesTab: Failed to process messages:', error)
    }
  }

  // Charger les états sauvegardés et traiter les messages  
  const loadSavedStatesAndProcess = async () => {
    try {
      const savedStates = await elizaDataService.loadTripletStates()
      
      if (savedStates.length > 0) {
        setEchoTriplets(savedStates)
        await new Promise(resolve => setTimeout(resolve, 0))
      }
      
      // Utiliser la fonction unifiée avec ou sans états sauvegardés
      await processRawMessages(savedStates.length > 0 ? savedStates : undefined)
      
    } catch (error) {
      console.error('❌ EchoesTab: Failed to load saved states:', error)
      await processRawMessages()
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
      
      // Supprimer de l'affichage local
      const updatedTriplets = echoTriplets.filter(t => t.id !== tripletId)
      setEchoTriplets(updatedTriplets)
      await elizaDataService.storeTripletStates(updatedTriplets)

      // Triplet published successfully
      
    } catch (error) {
      console.error(`❌ Failed to publish triplet ${tripletId}:`, error)
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
      window.open(`https://sepolia.basescan.org/tx/${txHash}`, '_blank')
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
    
    for (const triplet of selectedTriplets) {
      try {
        await publishTriplet(triplet.id)
      } catch (error) {
        console.error(`Failed to publish triplet ${triplet.id}:`, error)
      }
    }
    
    setSelectedEchoes(new Set())
    setIsSelectAll(false)
  }

  // Statistiques des triplets (seulement disponibles)
  const availableCount = echoTriplets.filter(t => t.status === 'available').length

  if (isLoadingEliza) {
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
      {/* Contract Debug - TEMPORARY */}
      <div style={{padding: '10px', border: '1px solid orange', margin: '10px 0', borderRadius: '5px'}}>
        <button 
          onClick={testContract}
          disabled={isTestLoading}
          style={{padding: '5px 10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '3px'}}
        >
          {isTestLoading ? 'Testing...' : '🧪 Test Contract'}
        </button>
        {testResults.length > 0 && (
          <div style={{marginTop: '10px', fontSize: '12px'}}>
            {testResults.map((result, i) => (
              <div key={i} style={{color: result.includes('✅') ? 'green' : 'red'}}>
                {result}
              </div>
            ))}
          </div>
        )}
      </div>

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