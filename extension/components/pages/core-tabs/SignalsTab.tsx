import { useState } from 'react'
import { useIntuitionTriplets } from '../../../hooks/useIntuitionTriplets'
import QuickActionButton from '../../ui/QuickActionButton'
import BookmarkButton from '../../ui/BookmarkButton'
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
            <div key={tripletItem.id} className={`echo-card border-green`}>
              <div className={`triplet-item ${isExpanded ? 'expanded' : ''}`}>

                {/* Header avec badges et actions */}
                <div className="triplet-header">


                  {/* Favicon et texte du triplet */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    {tripletItem.url && (
                      <img 
                        src={getFaviconUrl(tripletItem.url)} 
                        alt="favicon"
                        className="triplet-favicon"
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '2px',
                          marginTop: '2px',
                          flexShrink: 0
                        }}
                        onError={(e) => {
                          // Fallback if Google's service fails
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    )}
                    <p className="triplet-text clickable" onClick={() => {
                      setExpandedTriplet(isExpanded ? null : { tripletId: tripletItem.id })
                    }}>
                      <span className="subject">{formatWalletAddress(tripletItem.triplet.subject)}</span><br />
                      <span className="action">{tripletItem.triplet.predicate}</span><br />
                      <span className="object">{tripletItem.triplet.object}</span>
                    </p>
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
                {isExpanded && (() => {
                  console.log('tripletItem.url:', tripletItem.url, 'tripletItem:', tripletItem)
                  return (
                    <div className="triplet-detail-section">
                      <h4 className="triplet-detail-title">Source</h4>
                      <p className="triplet-detail-name">
                        <a href={tripletItem.url} target="_blank" rel="noopener noreferrer" style={{ color: 'white' }}>
                          {tripletItem.url || 'URL non disponible'}
                        </a>
                      </p>
                      <p className="triplet-detail-timestamp">
                        {new Date(tripletItem.timestamp).toLocaleString()}
                      </p>
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
    </div>
  )
}

export default SignalsTab