import { useState } from 'react'
import { useLocalPublishedTriplets } from '../../../hooks/useLocalPublishedTriplets'
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
  const { triplets, isLoading, error, refreshFromLocal } = useLocalPublishedTriplets()
  const [address] = useStorage<string>("metamask-account")
  
  // Display locally published triplets (already sorted by timestamp)
  const publishedTriplets = triplets

  // Format wallet address
  const formatWalletAddress = (address: string) => {
    if (!address || address.length < 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // getTripletMetrics removed - was generating fake metrics that weren't used in UI

  const handleViewOnExplorer = (txHash?: string, vaultId?: string) => {
    if (txHash) {
      // Intuition Testnet explorer
      window.open(`https://testnet.explorer.intuition.systems/tx/${txHash}`, '_blank')
    } else if (vaultId) {
      console.log('View vault:', vaultId)
      // TODO: Link to vault explorer
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

  if (isLoading) {
    return (
      <div className="triples-container">
        <div className="empty-state">
          <p>Loading your published triplets...</p>
          <p className="empty-subtext">
            Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="triples-container">
        <div className="empty-state">
          <p>Error loading local triplets</p>
          <p className="empty-subtext">{error}</p>
          <button onClick={refreshFromLocal} className="retry-button">
            Retry Loading
          </button>
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
                  

                {/* Texte du triplet */}
                <p className="triplet-text clickable" onClick={() => {
                  setExpandedTriplet(isExpanded ? null : { tripletId: tripletItem.id })
                }}>
                  <span className="subject">{formatWalletAddress(tripletItem.triplet.subject)}</span><br />
                  <span className="action">{tripletItem.triplet.predicate}</span><br />
                  <span className="object">{tripletItem.triplet.object}</span>
                </p>


                </div>
                  {/* Right actions - scan/view and bookmark */}
                  <div 
                    className="signal-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <BookmarkButton
                      triplet={tripletItem.triplet}
                      sourceInfo={{
                        sourceType: 'published',
                        sourceId: tripletItem.originalId,
                        url: tripletItem.url,
                        description: tripletItem.description,
                        sourceMessageId: tripletItem.sourceMessageId
                      }}
                      size="small"
                    />
                    <QuickActionButton
                      action="scan"
                      onClick={() => handleViewOnExplorer(tripletItem.txHash, tripletItem.tripleVaultId)}
                    />
                  </div>
                {isExpanded && (
                  <div className="triplet-details">
                    <div className="triplet-detail-section">
                      <h4 className="triplet-detail-title">Subject</h4>
                      <p className="triplet-detail-name">{formatWalletAddress(tripletItem.triplet.subject)}</p>
                    </div>

                    <div className="triplet-detail-section">
                      <h4 className="triplet-detail-title">Predicate</h4>
                      <p className="triplet-detail-name">{tripletItem.triplet.predicate}</p>
                    </div>

                    <div className="triplet-detail-section">
                      <h4 className="triplet-detail-title">Object</h4>
                      <p className="triplet-detail-name">{tripletItem.triplet.object}</p>
                    </div>

                    <div className="triplet-detail-section">
                      <h4 className="triplet-detail-title"> Source</h4>
                      <p className="triplet-detail-name">
                        Published from Echoes Tab ({tripletItem.source === 'created' ? 'New Triple' : 'Existing Triple'})
                      </p>
                      <p className="triplet-detail-timestamp">
                        {new Date(tripletItem.timestamp).toLocaleString()}
                      </p>
                      <p className="triplet-detail-name">
                        Creator: {address?.slice(0, 8)}...{address?.slice(-6)}
                      </p>
                      <p className="triplet-detail-name">
                        Original URL: <a href={tripletItem.url} target="_blank" rel="noopener noreferrer" className="triplet-link">{tripletItem.url.slice(0, 50)}...</a>
                      </p>
                      {tripletItem.customWeight && (
                        <p className="triplet-detail-name">
                          Weight: {tripletItem.customWeight} Wei
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <div className="empty-state">
          <p>No Published Triplets Found</p>
          <p className="empty-subtext">
            Triplets you publish from Echoes tab will appear here automatically.<br/>
            Create some triplets to see them displayed with full blockchain details!
          </p>
          <button onClick={refreshFromLocal} className="refresh-button">
            Refresh Local Storage
          </button>
        </div>
      )}
    </div>
  )
}

export default SignalsTab