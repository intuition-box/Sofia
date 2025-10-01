import { useState, useEffect } from 'react'
import { useElizaData } from '../../../hooks/useElizaData'
import { elizaDataService } from '../../../lib/database/indexedDB-methods'
import sofiaDB, { STORES } from '../../../lib/database/indexedDB'
import { useEchoPublishing } from '../../../hooks/useEchoPublishing'
import { useEchoSelection } from '../../../hooks/useEchoSelection'
import { useStorage } from "@plasmohq/storage/hook"
import WeightModal from '../../modals/WeightModal'
import type { EchoTriplet } from '../../../types/blockchain'
import '../../styles/AtomCreationModal.css'
import '../../styles/CorePage.css'

interface EchoesTabProps {
  expandedTriplet: { msgIndex: number; tripletIndex: number } | null
  setExpandedTriplet: (value: { msgIndex: number; tripletIndex: number } | null) => void
}


const EchoesTab = ({ expandedTriplet, setExpandedTriplet }: EchoesTabProps) => {
  // Local state for EchoesTab
  const [echoTriplets, setEchoTriplets] = useState<EchoTriplet[]>([])
  const [address] = useStorage<string>("metamask-account")
  const [hasInitialLoad, setHasInitialLoad] = useState(false)
  
  // Modal state for custom weighting
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [selectedTripletsForWeighting, setSelectedTripletsForWeighting] = useState<EchoTriplet[]>([])

  // Hook IndexedDB pour les messages Eliza parsés uniquement
  const { 
    allMessages,
    loadMessages
  } = useElizaData()
  
  // Tous les messages sont déjà des parsed_message (pas de raw stockage)
  const parsedMessages = allMessages
  const refreshMessages = loadMessages

  // Available echoes for selection hook
  const availableEchoes = echoTriplets.filter(t => t.status === 'available')
  
  // Selection management hook
  const {
    selectedEchoes,
    isSelectAll,
    toggleEchoSelection,
    toggleSelectAll,
    clearSelection,
    deleteSelected
  } = useEchoSelection({
    availableEchoes,
    echoTriplets,
    setEchoTriplets,
    refreshMessages,
    elizaDataService,
    sofiaDB,
    STORES
  })

  // Publishing management hook
  const {
    publishTriplet,
    publishSelected
  } = useEchoPublishing({
    echoTriplets,
    selectedEchoes,
    address: address || '',
    onTripletsUpdate: setEchoTriplets,
    clearSelection
  })
  
  // Local state for UI feedback
  const [isCreating, setIsCreating] = useState(false)
  const [transactionSuccess, setTransactionSuccess] = useState(false)
  const [transactionError, setTransactionError] = useState<string | null>(null)


  // Handle Amplify button click - always opens modal for weight selection
  const handleAmplifyClick = () => {
    const selectedTriplets = echoTriplets.filter(t => selectedEchoes.has(t.id))
    if (selectedTriplets.length > 0) {
      setSelectedTripletsForWeighting(selectedTriplets)
      setShowWeightModal(true)
    }
  }

  // Handle modal weight submission
  const handleWeightSubmit = async (customWeights?: (bigint | null)[]) => {
    if (selectedTripletsForWeighting.length === 0) return
    
    try {
      setIsCreating(true)
      setTransactionError(null)
      setTransactionSuccess(false)
      
      await publishSelected(customWeights)
      
      setTransactionSuccess(true)
    } catch (error) {
      console.error('Failed to publish triplets with custom weights:', error)
      setTransactionError(error instanceof Error ? error.message : 'Failed to publish')
    } finally {
      setIsCreating(false)
    }
  }

  // Handle modal close
  const handleWeightModalClose = () => {
    setShowWeightModal(false)
    setSelectedTripletsForWeighting([])
    setTransactionError(null)
    setTransactionSuccess(false)
    clearSelection()
  }

  // Transform rawMessages to echoTriplets
  useEffect(() => {
    const transformMessages = async () => {
      try {
        // Load blacklist of published triplets
        const publishedTripletIds = await elizaDataService.loadPublishedTripletIds()
        
        const newEchoTriplets: EchoTriplet[] = []
        
        for (const record of parsedMessages) {
          if (record.type === 'parsed_message' && record.content) {
            const parsed = record.content as any // Already parsed by useElizaData
            
            if (parsed && parsed.triplets && parsed.triplets.length > 0) {
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
                  url: triplet.object?.url || parsed.rawObjectUrl || '',
                  description: parsed.rawObjectDescription || parsed.intention,
                  timestamp: record.timestamp,
                  sourceMessageId: record.messageId,
                  status: 'available'
                }
                newEchoTriplets.push(echoTriplet)
              })
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
  }, [parsedMessages])

  // Unused functions removed
  const availableCount = echoTriplets.filter(t => t.status === 'available').length

  // Afficher le loading seulement au premier chargement
  if (!hasInitialLoad && parsedMessages.length === 0) {
    return (
      <div className="triples-container">
        <div className="empty-state">
          <p>Loading your echoes...</p>
          <p className="empty-subtext">
            Scanning your browsing activity for insights
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="triples-container">
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
                  onClick={handleAmplifyClick}
                  disabled={isCreating}
                >
                  Amplify ({selectedEchoes.size})
                </button>
                <button 
                  className="batch-btn delete-selected"
                  onClick={deleteSelected}
                >
                  Remove ({selectedEchoes.size})
                </button>
              </div>
              {isCreating && selectedEchoes.size > 1 && (
                <div className="processing-message">
                  <div>Processing batch amplification...</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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


                    {isCreating && (
                      <div className="processing-message">
                        <div>Amplifying echo...</div>
                      </div>
                    )}

                    {isExpanded && (
                        <div className="triplet-detail-section">
                          <h4 className="triplet-detail-title">Source</h4>
                          <p className="triplet-detail-name">
                            <a href={tripletItem.url} target="_blank" rel="noopener noreferrer" style={{ color: 'white' }}>
                              {tripletItem.url}
                            </a>
                          </p>
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

      {/* Weight Selection Modal */}
      <WeightModal
        isOpen={showWeightModal}
        triplets={selectedTripletsForWeighting}
        isProcessing={isCreating}
        transactionSuccess={transactionSuccess}
        transactionError={transactionError}
        onClose={handleWeightModalClose}
        onSubmit={handleWeightSubmit}
      />
    </div>
  )
}

export default EchoesTab