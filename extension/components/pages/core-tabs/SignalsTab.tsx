import { useState } from 'react'
import { useIntuitionTriplets } from '../../../hooks/useIntuitionTriplets'
import { useWeightOnChain } from '../../../hooks/useWeightOnChain'
import QuickActionButton from '../../ui/QuickActionButton'
import BookmarkButton from '../../ui/BookmarkButton'
import UpvoteModal from '../../modals/UpvoteModal'
import { useStorage } from "@plasmohq/storage/hook"
import '../../styles/CoreComponents.css'
import '../../styles/CorePage.css'
import '../../styles/BookmarkStyles.css'

interface SignalsTabProps {
  expandedTriplet: { tripletId: string } | null
  setExpandedTriplet: (value: { tripletId: string } | null) => void
}

const SignalsTab = ({ expandedTriplet, setExpandedTriplet }: SignalsTabProps) => {
  const { triplets, refreshFromAPI } = useIntuitionTriplets()
  const { addWeight, removeWeight } = useWeightOnChain()
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
      
      const currentUpvotes = selectedTriplet.position?.upvotes || 0
      const difference = newUpvotes - currentUpvotes
      
      console.log('Adjusting upvotes from', currentUpvotes, 'to', newUpvotes, 'difference:', difference)
      
      if (difference === 0) {
        handleCloseUpvoteModal()
        return
      }

      // Convert upvotes to Wei (1 upvote = 0.001 TRUST = 10^15 Wei)
      const weightChange = BigInt(Math.abs(difference)) * BigInt(1e15)
      
      let result
      if (difference > 0) {
        // Adding upvotes
        result = await addWeight(selectedTriplet.id, weightChange)
      } else {
        // Removing upvotes  
        result = await removeWeight(selectedTriplet.id, weightChange)
      }

      if (result.success) {
        console.log('✅ Weight adjustment successful:', result.txHash)
        
        // Refresh the data after successful transaction
        await refreshFromAPI()
        
        handleCloseUpvoteModal()
      } else {
        throw new Error(result.error || 'Transaction failed')
      }
    } catch (error) {
      console.error('Failed to adjust upvotes:', error)
      setIsProcessingUpvote(false)
      // Keep modal open to show error or allow retry
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
            <div key={tripletItem.id} className="echo-card border-default position-relative">
              <div className={`triplet-item ${isExpanded ? 'expanded' : ''}`}>
                {/* Header avec favicon et upvotes alignés au texte */}
                <div className="triplet-header position-relative">
                  {/* Texte du triplet */}
                  <div className="triplet-text-container">
                    <p className="triplet-text clickable" onClick={() => {
                      setExpandedTriplet(isExpanded ? null : { tripletId: tripletItem.id })
                    }}>
                      <span className="subject">I</span><br />
                      <span className="action">{tripletItem.triplet.predicate}</span><br />
                      <span className="object">{tripletItem.triplet.object}</span>
                    </p>
                  </div>
                  
                  {/* Favicon et Upvotes alignés avec le texte */}
                  <div className="triplet-actions-container">
                    {tripletItem.url && (
                      <img 
                        src={getFaviconUrl(tripletItem.url)} 
                        alt="favicon"
                        className="triplet-favicon-small"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    )}
                    {tripletItem.position && tripletItem.position.upvotes > 0 && (
                      <div 
                        className="upvote-badge"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUpvoteClick(tripletItem)
                        }}
                        title="Adjust upvotes"
                        className="upvote-badge-relative"
                      >
                        👍 {tripletItem.position.upvotes}
                      </div>
                    )}
                  </div>
                </div>
                {isExpanded && (() => {
                  console.log('tripletItem.url:', tripletItem.url, 'tripletItem:', tripletItem)
                  return (
                    <div className="triplet-detail-section">
                      <h4 className="triplet-detail-title">Source</h4>
                      <p className="triplet-detail-name">
                        {tripletItem.url ? (
                          <a href={tripletItem.url} target="_blank" rel="noopener noreferrer" className="triplet-url-link">
                            {tripletItem.url}
                          </a>
                        ) : (
                          <a 
                            href={`https://portal.intuition.systems/explore/atom/${tripletItem.objectTermId}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="portal-fallback-link"
                          >
                            View "{tripletItem.triplet.object}" on Portal
                          </a>
                        )}
                      </p>
                      <p className="triplet-detail-timestamp">
                        {new Date(tripletItem.timestamp).toLocaleString()}
                      </p>
                      
                      {/* Actions dans la section expanded */}
                      <div className="triplet-detail-actions">
                        <button
                          onClick={() => handleViewOnPortal(tripletItem.id)}
                          className="portal-button"
                          title="View on Intuition Portal"
                        >
                          🌐 Portal
                        </button>
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
                    </div>
                  )
                })()}
              </div>
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