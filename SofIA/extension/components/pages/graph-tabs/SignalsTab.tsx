import { useState } from 'react'
import { useOnChainTriplets, type OnChainTriplet } from '../../../hooks/useOnChainTriplets'
import QuickActionButton from '../../ui/QuickActionButton'
import '../../ui/AtomCreationModal.css'

interface SignalsTabProps {
  expandedTriplet: { tripletId: string } | null
  setExpandedTriplet: (value: { tripletId: string } | null) => void
}

const SignalsTab = ({ expandedTriplet, setExpandedTriplet }: SignalsTabProps) => {
  const { triplets, isLoading, getTripletsCount } = useOnChainTriplets()

  const counts = getTripletsCount()

  const handleViewOnExplorer = (txHash?: string, vaultId?: string) => {
    if (txHash) {
      // Base Sepolia explorer
      window.open(`https://sepolia.basescan.org/tx/${txHash}`, '_blank')
    } else if (vaultId) {
      console.log('🔍 View vault:', vaultId)
      // TODO: Lien vers explorateur de vaults
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

  if (isLoading) {
    return (
      <div className="triples-container">
        <div className="empty-state">
          <p>Loading on-chain triplets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="triples-container">
      {/* Stats header */}
      {counts.total > 0 && (
        <div className="signals-stats">
          <div className="stat-item">
            <span className="stat-number">{counts.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-number stat-created">{counts.created}</span>
            <span className="stat-label">Created</span>
          </div>
          <div className="stat-item">
            <span className="stat-number stat-existing">{counts.existing}</span>
            <span className="stat-label">Found</span>
          </div>
        </div>
      )}

      {triplets.length > 0 ? (
        triplets.map((tripletItem) => {
          const isExpanded = expandedTriplet?.tripletId === tripletItem.id

          return (
            <div key={tripletItem.id} className={`signal-card ${getBorderStyle(tripletItem.source)}`}>
              <div className={`triplet-item ${isExpanded ? 'expanded' : ''}`}>
                
                {/* Badge source */}
                <div className={`source-badge ${getBadgeStyle(tripletItem.source)}`}>
                  {tripletItem.source === 'created' ? '🆕 NEW' : '🔗 FOUND'}
                </div>

                <p
                  className="triplet-text clickable"
                  onClick={() =>
                    setExpandedTriplet(isExpanded ? null : { tripletId: tripletItem.id })
                  }
                >
                  <span className="subject">{tripletItem.triplet.subject}</span>{' '}
                  <span className="action">{tripletItem.triplet.predicate}</span>{' '}
                  <span className="object">{tripletItem.triplet.object}</span>
                </p>

                {/* Actions */}
                <div className="signal-actions">
                  <QuickActionButton
                    action="view"
                    onClick={() => handleViewOnExplorer(tripletItem.txHash, tripletItem.atomVaultId)}
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
                      <p className="triplet-detail-name">VaultID: {tripletItem.atomVaultId}</p>
                      {tripletItem.txHash && (
                        <p className="triplet-detail-name">
                          TX: {tripletItem.txHash.slice(0, 10)}...{tripletItem.txHash.slice(-8)}
                        </p>
                      )}
                      <p className="triplet-detail-name">
                        📦 IPFS: {tripletItem.ipfsUri.slice(0, 20)}...
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
      ) : (
        <div className="empty-state">
          <p>No on-chain triplets yet</p>
          <p className="empty-subtext">
            Your atoms will appear here once created or found on-chain
          </p>
        </div>
      )}
    </div>
  )
}

export default SignalsTab