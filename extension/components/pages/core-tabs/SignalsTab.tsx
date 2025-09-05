import { useState } from 'react'
import { useExplorerTriplets, type ExplorerTriplet } from '../../../hooks/useExplorerTriplets'
import QuickActionButton from '../../ui/QuickActionButton'
import { useStorage } from "@plasmohq/storage/hook"
import '../../styles/AtomCreationModal.css'
import '../../styles/CorePage.css'

interface SignalsTabProps {
  expandedTriplet: { tripletId: string } | null
  setExpandedTriplet: (value: { tripletId: string } | null) => void
}

const SignalsTab = ({ expandedTriplet, setExpandedTriplet }: SignalsTabProps) => {
  const { triplets, isLoading, error, refreshFromExplorer } = useExplorerTriplets()
  const [address] = useStorage<string>("metamask-account")
  
  // Afficher tous les triplets depuis l'Explorer API
  const publishedTriplets = triplets.sort((a, b) => b.timestamp - a.timestamp)
  
  const publishedCounts = {
    total: publishedTriplets.length,
    explorer: publishedTriplets.filter(t => t.source === 'explorer_api').length,
  }

  const handleViewOnExplorer = (txHash?: string, vaultId?: string) => {
    if (txHash) {
      // Intuition Testnet explorer
      window.open(`https://testnet.explorer.intuition.systems/tx/${txHash}`, '_blank')
    } else if (vaultId) {
      console.log('🔍 View vault:', vaultId)
      // TODO: Link to vault explorer
    }
  }

  const getBadgeStyle = (source: 'created' | 'existing') => {
    return source === 'created' 
      ? 'badge-created' 
      : 'badge-existing'
  }

  const getBorderStyle = (source: 'created' | 'existing') => {
    return source === 'created' 
      ? 'border-green' 
      : 'border-blue'
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
          <p>🔄 Loading triplets from Explorer API...</p>
          <p className="empty-subtext">
            Wallet: {address.slice(0, 6)}...{address.slice(-4)}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="triples-container">
        <div className="empty-state">
          <p>❌ Error connecting to Explorer API</p>
          <p className="empty-subtext">{error}</p>
          <button onClick={refreshFromExplorer} className="retry-button">
            🔄 Retry Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="triples-container">
      {/* Dashboard header */}
      <div className="dashboard-header">
        <p>Your Signals published on Intuition Testnet</p>
        <p className="empty-subtext">
          Wallet: {address.slice(0, 6)}...{address.slice(-4)} • Real-time from Explorer API
        </p>
        <button onClick={refreshFromExplorer} className="refresh-button">
          🔄 Refresh from Explorer
        </button>
      </div>

      {/* Stats header */}
      {publishedCounts.total > 0 && (
        <div className="signals-stats">
          <div className="stat-item">
            <span className="stat-number stat-on-chain">{publishedCounts.total}</span>
            <span className="stat-label">Total Published</span>
          </div>
          <div className="stat-item">
            <span className="stat-number stat-created">{publishedCounts.explorer}</span>
            <span className="stat-label">From Explorer</span>
          </div>
        </div>
      )}

      {publishedTriplets.length > 0 ? (
        publishedTriplets.map((tripletItem) => {
          const isExpanded = expandedTriplet?.tripletId === tripletItem.id

          return (
            <div key={tripletItem.id} className={`echo-card border-green`}>
              <div className={`triplet-item ${isExpanded ? 'expanded' : ''}`}>
                
                {/* Header avec badges et actions */}
                <div className="triplet-header">
                  

                {/* Texte du triplet */}
                <p
                  className="triplet-text clickable"
                  onClick={() => {
                    setExpandedTriplet(isExpanded ? null : { tripletId: tripletItem.id })
                  }}
                >
                  <span className="subject">{tripletItem.triplet.subject}</span>{' '}
                  <span className="action">{tripletItem.triplet.predicate}</span>{' '}
                  <span className="object">{tripletItem.triplet.object}</span>
                </p>

                </div>
                  {/* Actions à droite - uniquement scan/view */}
                  <div className="signal-actions">
                    <QuickActionButton
                      action="scan"
                      onClick={() => handleViewOnExplorer(tripletItem.txHash, tripletItem.tripleVaultId)}
                    />
                  </div>
                {isExpanded && (
                  <div className="triplet-details">
                    <div className="triplet-detail-section">
                      <h4 className="triplet-detail-title">🧍 Subject</h4>
                      <p className="triplet-detail-name">{tripletItem.triplet.subject}</p>
                    </div>

                    <div className="triplet-detail-section">
                      <h4 className="triplet-detail-title">🔗 Predicate</h4>
                      <p className="triplet-detail-name">{tripletItem.triplet.predicate}</p>
                    </div>

                    <div className="triplet-detail-section">
                      <h4 className="triplet-detail-title">📄 Object</h4>
                      <p className="triplet-detail-name">{tripletItem.triplet.object}</p>
                    </div>

                    <div className="triplet-detail-section">
                      <h4 className="triplet-detail-title">⛓️ Blockchain</h4>
                      {tripletItem.atomVaultId && (
                        <p className="triplet-detail-name">Object VaultID: {tripletItem.atomVaultId.slice(0, 10)}...{tripletItem.atomVaultId.slice(-8)}</p>
                      )}
                      {tripletItem.tripleVaultId && (
                        <p className="triplet-detail-name">Triple VaultID: {tripletItem.tripleVaultId}</p>
                      )}
                      {tripletItem.subjectVaultId && (
                        <p className="triplet-detail-name">Subject VaultID: {tripletItem.subjectVaultId.slice(0, 10)}...{tripletItem.subjectVaultId.slice(-8)}</p>
                      )}
                      {tripletItem.predicateVaultId && (
                        <p className="triplet-detail-name">Predicate VaultID: {tripletItem.predicateVaultId.slice(0, 10)}...{tripletItem.predicateVaultId.slice(-8)}</p>
                      )}
                      <p className="triplet-detail-name">
                        TX: {tripletItem.txHash.slice(0, 10)}...{tripletItem.txHash.slice(-8)}
                      </p>
                      <p className="triplet-detail-name">Block: {tripletItem.blockNumber}</p>
                      <p className="triplet-detail-name">Status: ⛓️ On-Chain (Explorer API)</p>
                    </div>

                    <div className="triplet-detail-section">
                      <h4 className="triplet-detail-title">🌐 Source</h4>
                      <p className="triplet-detail-name">
                        Intuition Explorer API (Real-time)
                      </p>
                      <p className="triplet-detail-timestamp">
                        {new Date(tripletItem.timestamp).toLocaleString()}
                      </p>
                      <p className="triplet-detail-name">
                        Creator: {address.slice(0, 8)}...{address.slice(-6)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <div className="empty-state">
          <p>📡 Connected to Intuition Explorer API</p>
          <p className="empty-subtext">
            No triplets found for wallet {address.slice(0, 6)}...{address.slice(-4)}<br/>
            Create some triplets in Echoes tab to see them appear here immediately!
          </p>
          <button onClick={refreshFromExplorer} className="refresh-button">
            🔄 Refresh from Explorer
          </button>
        </div>
      )}
    </div>
  )
}

export default SignalsTab