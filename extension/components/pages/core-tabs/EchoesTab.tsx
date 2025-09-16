import { useState, useEffect } from 'react'
import { useElizaData } from '../../../hooks/useElizaData'
import { elizaDataService } from '../../../lib/database/indexedDB-methods'
import sofiaDB, { STORES } from '../../../lib/database/indexedDB'
import { useCreateTripleOnChain } from '../../../hooks/useCreateTripleOnChain'
import { useEchoPublishing } from '../../../hooks/useEchoPublishing'
import { useEchoSelection } from '../../../hooks/useEchoSelection'
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
  const [address] = useStorage<string>("metamask-account")
  const [hasInitialLoad, setHasInitialLoad] = useState(false)

  // Hook IndexedDB pour les messages Eliza 
  const { 
    messages: rawMessages, 
    parsedMessages,
    isLoading: isLoadingEliza, 
    refreshMessages 
  } = useElizaData({ autoRefresh: true, refreshInterval: 5000 })

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
    setEchoTriplets: (updatedTriplets) => {
      setEchoTriplets(updatedTriplets)
      
      // Update badge after deletion
      const availableCount = updatedTriplets.filter(t => t.status === 'available').length
      chrome.runtime.sendMessage({
        type: "UPDATE_ECHO_BADGE",
        data: { count: availableCount }
      }).catch(error => {
        console.error('❌ Failed to update echo badge after deletion:', error)
      })
    },
    refreshMessages,
    elizaDataService,
    sofiaDB,
    STORES
  })

  // Publishing management hook
  const {
    isProcessing,
    processingTripletId,
    publishSelected
  } = useEchoPublishing({
    echoTriplets,
    selectedEchoes,
    address: address || '',
    onTripletsUpdate: (updatedTriplets) => {
      setEchoTriplets(updatedTriplets)
      
      // Update badge after publishing
      const availableCount = updatedTriplets.filter(t => t.status === 'available').length
      chrome.runtime.sendMessage({
        type: "UPDATE_ECHO_BADGE",
        data: { count: availableCount }
      }).catch(error => {
        console.error('❌ Failed to update echo badge after publishing:', error)
      })
    },
    clearSelection
  })

  // Blockchain hook for current step display
  const { currentStep, batchProgress } = useCreateTripleOnChain()

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
                  url: parsed.rawObjectUrl || '',
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
        
        // Update badge with count of available echoes
        const availableCount = newEchoTriplets.filter(t => t.status === 'available').length
        chrome.runtime.sendMessage({
          type: "UPDATE_ECHO_BADGE",
          data: { count: availableCount }
        }).catch(error => {
          console.error('❌ Failed to update echo badge:', error)
        })
        
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
  if (isLoadingEliza && !hasInitialLoad) {
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
                  onClick={publishSelected}
                  disabled={isProcessing}
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
              {isProcessing && selectedEchoes.size > 1 && (
                <div className="processing-message">
                  <div>{currentStep || 'Starting batch amplification...'}</div>
                  {batchProgress.total > 0 && (
                    <div className="empty-subtext">
                      {batchProgress.phase} ({batchProgress.current}/{batchProgress.total})
                    </div>
                  )}
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


                    {processingTripletId === tripletItem.id && (
                      <div className="processing-message">
                        <div>{currentStep || 'Amplifying echo...'}</div>
                        {batchProgress.total > 0 && (
                          <div className="empty-subtext">
                            {batchProgress.phase}
                          </div>
                        )}
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