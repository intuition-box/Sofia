import { useState } from 'react'
import { useIntuitionTriplets } from '../../../hooks/useIntuitionTriplets'
import QuickActionButton from '../../ui/QuickActionButton'
import BookmarkButton from '../../ui/BookmarkButton'
import UpvoteModal from '../../modals/UpvoteModal'
import { useStorage } from "@plasmohq/storage/hook"
import '../../styles/AtomCreationModal.css'
import '../../styles/CorePage.css'
import '../../styles/BookmarkStyles.css'

interface SignalsTabProps {
  expandedTriplet: { tripletId: string } | null
  setExpandedTriplet: (value: { tripletId: string } | null) => void
}

const SignalsTab = ({ expandedTriplet, setExpandedTriplet }: SignalsTabProps) => {
  const { triplets, refreshFromAPI } = useIntuitionTriplets()
  const [address] = useStorage<string>("metamask-account")
  
  // Upvote modal state
  const [selectedTriplet, setSelectedTriplet] = useState<typeof triplets[0] | null>(null)
  const [isUpvoteModalOpen, setIsUpvoteModalOpen] = useState(false)
  const [isProcessingUpvote, setIsProcessingUpvote] = useState(false)

  console.log('🎯 SignalsTab render - address:', address)
  console.log('🎯 SignalsTab render - triplets:', triplets)
  console.log('🎯 SignalsTab render - triplets.length:', triplets.length)

  // Display triplets from Intuition indexer (already sorted by timestamp)
  const publishedTriplets = triplets

  // Format wallet address
  const formatWalletAddress = (address: string) => {
    if (!address || address.length < 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // getTripletMetrics removed - was generating fake metrics that weren't used in UI

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

  const handleViewOnExplorer = (txHash?: string, vaultId?: string) => {
    if (txHash) {
      // Intuition Testnet explorer
      window.open(`https://testnet.explorer.intuition.systems/tx/${txHash}`, '_blank')
    } else if (vaultId) {
      // Link to triple vault explorer
      window.open(`https://testnet.explorer.intuition.systems/triple/${vaultId}`, '_blank')
    }
  }

  const handleViewOnPortal = (tripletId: string) => {
    // Redirect to Intuition Portal for this specific triplet
    window.open(`https://portal.intuition.systems/explore/triple/${tripletId}?tab=positions`, '_blank')
  }

  const handleUpvoteClick = (triplet: typeof triplets[0]) => {
    setSelectedTriplet(triplet)
    setIsUpvoteModalOpen(true)
  }

  const handleCloseUpvoteModal = () => {
    setIsUpvoteModalOpen(false)
    setSelectedTriplet(null)
    setIsProcessingUpvote(false)
  }

  const handleUpvoteSubmit = async (newUpvotes: number) => {
    if (!selectedTriplet || !address) return

    try {
      setIsProcessingUpvote(true)
      
      // TODO: Implement the actual blockchain transaction
      // This will require integration with useCreateTripleOnChain or similar hook
      console.log('Adjusting upvotes from', selectedTriplet.position?.upvotes || 0, 'to', newUpvotes)
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Refresh the data after successful transaction
      await refreshFromAPI()
      
      handleCloseUpvoteModal()
    } catch (error) {
      console.error('Failed to adjust upvotes:', error)
      setIsProcessingUpvote(false)
    }
  }


  if (!address) {
    return (
      <div className="triples-container">
        <div className="empty-state">
          <p>🔌 Connect your wallet</p>
          <p className="empty-subtext">
            Connect your MetaMask wallet to view your on-chain triplets
          </p>
        </div>
      </div>
    )
  }


  return (
    <div className="triples-container">


      {publishedTriplets.length > 0 ? (
        publishedTriplets.map((tripletItem) => {
          const isExpanded = expandedTriplet?.tripletId === tripletItem.id

          return (
            <div key={tripletItem.id} className={`echo-card border-green`} style={{ position: 'relative' }}>
              <div className={`triplet-item ${isExpanded ? 'expanded' : ''}`}>

                {/* Header avec badges et actions */}
                <div className="triplet-header">


                  {/* Texte du triplet avec favicon à droite */}
                  <div style={{ position: 'relative', width: '100%' }}>
                    <p className="triplet-text clickable" onClick={() => {
                      setExpandedTriplet(isExpanded ? null : { tripletId: tripletItem.id })
                    }}>
                      <span className="subject">I</span><br />
                      <span className="action">{tripletItem.triplet.predicate}</span><br />
                      <span className="object">{tripletItem.triplet.object}</span>
                    </p>
                    {tripletItem.url && (
                      <img 
                        src={getFaviconUrl(tripletItem.url)} 
                        alt="favicon"
                        className="triplet-favicon"
                        style={{
                          position: 'absolute',
                          right: '0',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '16px',
                          height: '16px',
                          borderRadius: '2px'
                        }}
                        onError={(e) => {
                          // Fallback if Google's service fails
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    )}
                  </div>


                </div>
                {/* Right actions - view on portal and bookmark */}
                <div
                  className="signal-actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleViewOnPortal(tripletItem.id)}
                    className="portal-button"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '4px',
                      color: 'white',
                      padding: '4px 8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      marginRight: '8px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                    }}
                    title="View on Intuition Portal"
                  >
                    🌐 Portal
                  </button>
                </div>
                {isExpanded && (() => {
                  console.log('tripletItem.url:', tripletItem.url, 'tripletItem:', tripletItem)
                  return (
                    <div className="triplet-detail-section">
                      <h4 className="triplet-detail-title">Source</h4>
                      <p className="triplet-detail-name">
                        {tripletItem.url ? (
                          <a href={tripletItem.url} target="_blank" rel="noopener noreferrer" style={{ color: 'white' }}>
                            {tripletItem.url}
                          </a>
                        ) : (
                          <a 
                            href={`https://portal.intuition.systems/explore/atom/${tripletItem.objectTermId}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ color: '#888', fontStyle: 'italic' }}
                          >
                            View "{tripletItem.triplet.object}" on Portal
                          </a>
                        )}
                      </p>
                      <p className="triplet-detail-timestamp">
                        {new Date(tripletItem.timestamp).toLocaleString()}
                      </p>
                      <BookmarkButton
                        triplet={tripletItem.triplet}
                        sourceInfo={{
                          sourceType: 'published',
                          sourceId: tripletItem.id,
                          url: tripletItem.url,
                          description: tripletItem.description,
                          sourceMessageId: tripletItem.id
                        }}
                        size="small"
                      />
                    </div>
                  )
                })()}
              </div>
              
              {/* Upvotes en bas à droite - fixe sur la card principale */}
              {tripletItem.position && tripletItem.position.upvotes > 0 && (
                <div 
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    background: 'rgba(76, 175, 80, 0.1)',
                    border: '1px solid rgba(0, 0, 0, 0.3)',
                    borderRadius: '12px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    color: '#ffffffff',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    zIndex: 10,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleUpvoteClick(tripletItem)
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(76, 175, 80, 0.2)'
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(76, 175, 80, 0.1)'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                  title="Adjust upvotes"
                >
                  👍 {tripletItem.position.upvotes}
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div className="empty-state">
          <p>No Published Triplets Found</p>
          <p className="empty-subtext">
            Triplets you publish to Intuition blockchain will appear here.<br />
            Create some triplets from Echoes tab to see them displayed with full on-chain data!
          </p>
          <button onClick={refreshFromAPI} className="refresh-button">
            Refresh from Blockchain
          </button>
        </div>
      )}

      {/* Upvote Modal */}
      {selectedTriplet && (
        <UpvoteModal
          isOpen={isUpvoteModalOpen}
          objectName={selectedTriplet.triplet.object}
          objectType="Identity"
          currentUpvotes={selectedTriplet.position?.upvotes || 0}
          onClose={handleCloseUpvoteModal}
          onSubmit={handleUpvoteSubmit}
          isProcessing={isProcessingUpvote}
        />
      )}
    </div>
  )
}

export default SignalsTab