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
  const { triplets, isLoading, error, refreshFromAPI } = useIntuitionTriplets()
  const [address] = useStorage<string>("metamask-account")
  
  // Display triplets from Intuition indexer (already sorted by timestamp)
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
      // Link to triple vault explorer
      window.open(`https://testnet.explorer.intuition.systems/triple/${vaultId}`, '_blank')
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
          <p>Loading your published triplets from Intuition blockchain...</p>
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
          <p>Error loading triplets from Intuition indexer</p>
          <p className="empty-subtext">{error}</p>
          <button onClick={refreshFromAPI} className="retry-button">
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
                        sourceId: tripletItem.id,
                        url: tripletItem.url,
                        description: tripletItem.description,
                        sourceMessageId: tripletItem.id
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
                      <h4 className="triplet-detail-title">Blockchain Info</h4>
                      <p className="triplet-detail-name">
                        Source: Intuition Blockchain ({tripletItem.source})
                      </p>
                      <p className="triplet-detail-timestamp">
                        Created: {new Date(tripletItem.timestamp).toLocaleString()}
                      </p>
                      <p className="triplet-detail-name">
                        Subject Vault: {tripletItem.subjectVaultId?.slice(0, 12)}...
                      </p>
                      <p className="triplet-detail-name">
                        Triple Vault: {tripletItem.tripleVaultId?.slice(0, 12)}...
                      </p>
                      {tripletItem.url && (
                        <p className="triplet-detail-name">
                          <a href={tripletItem.url} target="_blank" rel="noopener noreferrer" className="triplet-link">
                            View on Explorer
                          </a>
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
            Triplets you publish to Intuition blockchain will appear here.<br/>
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