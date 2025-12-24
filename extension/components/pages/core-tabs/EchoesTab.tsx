import { useState, useEffect, useMemo } from 'react'
import { useElizaData } from '../../../hooks/useElizaData'
import { elizaDataService } from '../../../lib/database/indexedDB-methods'
import sofiaDB, { STORES } from '../../../lib/database/indexedDB'
import { useEchoPublishing } from '../../../hooks/useEchoPublishing'
import { useEchoSelection } from '../../../hooks/useEchoSelection'
import { useWalletFromStorage } from '../../../hooks/useWalletFromStorage'
import WeightModal from '../../modals/WeightModal'
// Removed Iridescence import - using CSS salmon gradient now
import SofiaLoader from '../../ui/SofiaLoader'
import type { EchoTriplet } from '../../../types/blockchain'
import '../../styles/CoreComponents.css'
import '../../styles/CorePage.css'

interface EchoesTabProps {
  expandedTriplet: { msgIndex: number; tripletIndex: number } | null
  setExpandedTriplet: (value: { msgIndex: number; tripletIndex: number } | null) => void
}


const EchoesTab = ({ expandedTriplet, setExpandedTriplet }: EchoesTabProps) => {
  // Local state for EchoesTab
  const [echoTriplets, setEchoTriplets] = useState<EchoTriplet[]>([])
  const { walletAddress: address } = useWalletFromStorage()
  const [hasInitialLoad, setHasInitialLoad] = useState(false)
  
  // Modal state for custom weighting
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [selectedTripletsForWeighting, setSelectedTripletsForWeighting] = useState<EchoTriplet[]>([])
  
  // Predicate filtering state
  const [selectedPredicate, setSelectedPredicate] = useState<string>('all')
  const [isPredicateDropdownOpen, setIsPredicateDropdownOpen] = useState(false)

  // Hook IndexedDB pour les messages Eliza parsés uniquement
  const {
    allMessages,
    loadMessages
  } = useElizaData()

  // Tous les messages sont déjà des parsed_message (pas de raw stockage)
  const parsedMessages = allMessages
  const refreshMessages = loadMessages

  // Listen for ECHOES_UPDATED messages from background to auto-refresh
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'ECHOES_UPDATED') {
        console.log('🔄 [EchoesTab] Received ECHOES_UPDATED, refreshing...')
        loadMessages()
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage)
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage)
    }
  }, [loadMessages])

  // Extract unique predicates from triplets
  const uniquePredicates = useMemo(() => {
    const predicates = new Set<string>()
    echoTriplets.forEach(triplet => {
      if (triplet.triplet.predicate) {
        predicates.add(triplet.triplet.predicate)
      }
    })
    return Array.from(predicates).sort()
  }, [echoTriplets])

  // Filter triplets by selected predicate
  const filteredTriplets = useMemo(() => {
    if (selectedPredicate === 'all') {
      return echoTriplets
    }
    return echoTriplets.filter(triplet => triplet.triplet.predicate === selectedPredicate)
  }, [echoTriplets, selectedPredicate])

  // Available echoes for selection hook
  const availableEchoes = filteredTriplets.filter(t => t.status === 'available')
  
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
  
  // Handle predicate filtering
  const handlePredicateSelection = (predicate: string) => {
    setSelectedPredicate(predicate)
    setIsPredicateDropdownOpen(false)
  }

  const handlePredicateDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsPredicateDropdownOpen(!isPredicateDropdownOpen)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsPredicateDropdownOpen(false)
    }

    if (isPredicateDropdownOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isPredicateDropdownOpen])
  
  // Local state for UI feedback
  const [isCreating, setIsCreating] = useState(false)
  const [transactionSuccess, setTransactionSuccess] = useState(false)
  const [transactionError, setTransactionError] = useState<string | null>(null)
  const [transactionHash, setTransactionHash] = useState<string | undefined>(undefined)
  const [createdCount, setCreatedCount] = useState(0)
  const [depositCount, setDepositCount] = useState(0)

  // Function to get favicon URL from a website URL
  const getFaviconUrl = (url: string): string => {
    if (!url) return ''
    
    try {
      const urlObj = new URL(url)
      // Use Google's favicon service as fallback, it's very reliable
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=16`
    } catch {
      return ''
    }
  }


  // Handle Amplify button click - always opens modal for weight selection
  const handleAmplifyClick = () => {
    const selectedTriplets = filteredTriplets.filter(t => selectedEchoes.has(t.id))
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
      setTransactionHash(undefined)
      setCreatedCount(0)
      setDepositCount(0)

      const result = await publishSelected(customWeights)

      setCreatedCount(result.createdCount || 0)
      setDepositCount(result.depositCount || 0)
      setTransactionHash(result.txHash)
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
    setTransactionHash(undefined)
    setCreatedCount(0)
    setDepositCount(0)
    clearSelection()
  }

  // Transform rawMessages to echoTriplets
  useEffect(() => {
    const transformMessages = async () => {
      try {
        console.log('🔍 EchoesTab: parsedMessages count:', parsedMessages.length)
        console.log('🔍 EchoesTab: parsedMessages sample:', parsedMessages.slice(0, 3))

        // Load blacklist of published triplets
        const publishedTripletIds = await elizaDataService.loadPublishedTripletIds()

        const newEchoTriplets: EchoTriplet[] = []
        const seenHashes = new Set<string>() // Track seen triplets to avoid duplicates

        for (const record of parsedMessages) {
          if (record.type === 'parsed_message' && record.content) {
            const parsed = record.content as any // Already parsed by useElizaData

            if (parsed && parsed.triplets && parsed.triplets.length > 0) {
              parsed.triplets.forEach((triplet, index) => {
                // Normalize triplet values - handle both string format (ElizaOS) and object format (Mastra)
                const subjectValue = typeof triplet.subject === 'object' ? triplet.subject?.name : triplet.subject
                const predicateValue = typeof triplet.predicate === 'object' ? triplet.predicate?.name : triplet.predicate
                const objectValue = typeof triplet.object === 'object' ? triplet.object?.name : triplet.object

                // Extract URL from object if it's an object (Mastra format)
                const objectUrl = typeof triplet.object === 'object' ? triplet.object?.url : (triplet.objectUrl || '')

                // Generate hash for deduplication
                const hash = `${subjectValue}|${predicateValue}|${objectValue}`.toLowerCase()
                if (seenHashes.has(hash)) {
                  return // Skip duplicate triplet
                }
                seenHashes.add(hash)

                const tripletId = `${record.messageId}_${index}`

                // Skip if already published
                if (publishedTripletIds.includes(tripletId)) {
                  return
                }

                const echoTriplet: EchoTriplet = {
                  id: tripletId,
                  triplet: {
                    subject: subjectValue || 'User',
                    predicate: predicateValue || 'visited',
                    object: objectValue || ''
                  },
                  url: objectUrl || parsed.rawObjectUrl || '',
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
  const availableCount = filteredTriplets.filter(t => t.status === 'available').length

  // Afficher le loading seulement au premier chargement
  if (!hasInitialLoad && parsedMessages.length === 0) {
    return (
      <div className="triples-container">
        <div className="loading-indicator">
          <SofiaLoader size={150} />
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
              <span onClick={toggleSelectAll} className="cursor-pointer">{selectedEchoes.size > 0 ? `${selectedEchoes.size} selected` : 'Select All'}</span>
            </label>
          </div>
          
          {selectedEchoes.size > 0 && (
            <div>
              <div className="batch-actions">
                <button
                  className="batch-btn add-to-signals iridescence-btn"
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

      {/* Predicate Filter */}
      {echoTriplets.length > 0 && (
        <div className="sort-controls">
          <div className={`sort-dropdown ${isPredicateDropdownOpen ? 'open' : ''}`}>
            <div 
              className="sort-dropdown-trigger" 
              onClick={handlePredicateDropdownClick}
            >
              <span>
                {selectedPredicate === 'all' 
                  ? `All (${availableCount})` 
                  : `${selectedPredicate} (${availableCount})`
                }
              </span>
              <span className="sort-dropdown-arrow">▼</span>
            </div>
            <div className={`sort-dropdown-menu ${isPredicateDropdownOpen ? 'open' : ''}`}>
              <div
                className={`sort-dropdown-option ${selectedPredicate === 'all' ? 'selected' : ''}`}
                onClick={() => handlePredicateSelection('all')}
              >
                <span>All</span>
              </div>
              {uniquePredicates.map((predicate) => (
                <div
                  key={predicate}
                  className={`sort-dropdown-option ${selectedPredicate === predicate ? 'selected' : ''}`}
                  onClick={() => handlePredicateSelection(predicate)}
                >
                  <span>{predicate}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Liste des triplets disponibles pour publication */}
      {availableCount > 0 && (
        <div className="available-triplets-section">
          {/* <h4>🔗 Available for Publication ({availableCount})</h4> */}
          {filteredTriplets
            .filter(t => t.status === 'available')
            .sort((a, b) => b.timestamp - a.timestamp)
            .map((tripletItem, index) => {
              const isExpanded = expandedTriplet?.msgIndex === 1 && expandedTriplet?.tripletIndex === index

              return (
                <div
                  key={tripletItem.id}
                  className={`echo-card cursor-pointer ${selectedEchoes.has(tripletItem.id) ? 'selected' : ''}`}
                  onClick={() => toggleEchoSelection(tripletItem.id)}
                >
                  <div className={`triplet-item ${isExpanded ? 'expanded' : ''}`}>
                    <div className="echo-header position-relative">
                      <p
                        className="triplet-text clickable"
                        onClick={(e) => {
                          e.stopPropagation() // Prevent card selection
                          setExpandedTriplet(isExpanded ? null : { msgIndex: 1, tripletIndex: index })
                        }}
                      >
                        <span className="subject">{(tripletItem.triplet.subject === 'User' || tripletItem.triplet.subject === 'I' || tripletItem.triplet.subject === address) ? 'You' : tripletItem.triplet.subject}</span>{' '}
                        <span className="action">{tripletItem.triplet.predicate}</span>{' '}
                        <span className="object">{tripletItem.triplet.object}</span>
                      </p>
                      {tripletItem.url && (
                        <img 
                          src={getFaviconUrl(tripletItem.url)} 
                          alt="favicon"
                          className="triplet-favicon triplet-favicon-positioned"
                          onError={(e) => {
                            // Fallback if Google's service fails
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      )}
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
                            <a href={tripletItem.url} target="_blank" rel="noopener noreferrer" className="triplet-url-link">
                              {tripletItem.url}
                            </a>
                          </p>
                          <p className="triplet-detail-timestamp">
                            {new Date(tripletItem.timestamp).toLocaleString()}
                          </p>
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
            Your triples will appear automatically 
          </p>
        </div>
      ) : availableEchoes.length === 0 ? (
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
        transactionHash={transactionHash}
        createdCount={createdCount}
        depositCount={depositCount}
        onClose={handleWeightModalClose}
        onSubmit={handleWeightSubmit}
      />
    </div>
  )
}

export default EchoesTab