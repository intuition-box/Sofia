import { useState } from 'react'
import { useOnChainTriplets, type OnChainTriplet } from '../../../hooks/useOnChainTriplets'
import QuickActionButton from '../../ui/QuickActionButton'
import '../../styles/AtomCreationModal.css'
import '../../styles/MyGraphPage.css'

interface SignalsTabProps {
  expandedTriplet: { tripletId: string } | null
  setExpandedTriplet: (value: { tripletId: string } | null) => void
}

const SignalsTab = ({ expandedTriplet, setExpandedTriplet }: SignalsTabProps) => {
  const { triplets, isLoading } = useOnChainTriplets()
  
  // Filtrer et trier les triplets publiés on-chain - plus récent en premier
  const publishedTriplets = triplets
    .filter(t => t.tripleStatus === 'on-chain')
    .sort((a, b) => b.timestamp - a.timestamp)
  
  const publishedCounts = {
    total: publishedTriplets.length,
    created: publishedTriplets.filter(t => t.source === 'created').length,
    existing: publishedTriplets.filter(t => t.source === 'existing').length,
  }

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
          <p>Loading published triplets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="triples-container">
      {/* Dashboard header */}
      <div className="dashboard-header">
        <h2>Published On-Chain Signals</h2>
        <p>Dashboard of your Signals already published on blockchain</p>
      </div>

      {/* Stats header */}
      {publishedCounts.total > 0 && (
        <div className="signals-stats">
          <div className="stat-item">
            <span className="stat-number stat-on-chain">{publishedCounts.total}</span>
            <span className="stat-label">Total Published</span>
          </div>
          <div className="stat-item">
            <span className="stat-number stat-created">{publishedCounts.created}</span>
            <span className="stat-label">Created</span>
          </div>
          <div className="stat-item">
            <span className="stat-number stat-existing">{publishedCounts.existing}</span>
            <span className="stat-label">Existing</span>
          </div>
        </div>
      )}

      {publishedTriplets.length > 0 ? (
        publishedTriplets.map((tripletItem) => {
          const isExpanded = expandedTriplet?.tripletId === tripletItem.id

          return (
            <div key={tripletItem.id} className={`echo-card ${getBorderStyle(tripletItem.source)}`}>
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
                      <p className="triplet-detail-name">Object VaultID: {tripletItem.atomVaultId}</p>
                      {tripletItem.tripleVaultId && (
                        <p className="triplet-detail-name">Triple VaultID: {tripletItem.tripleVaultId}</p>
                      )}
                      {tripletItem.subjectVaultId && (
                        <p className="triplet-detail-name">Subject VaultID: {tripletItem.subjectVaultId}</p>
                      )}
                      {tripletItem.predicateVaultId && (
                        <p className="triplet-detail-name">Predicate VaultID: {tripletItem.predicateVaultId}</p>
                      )}
                      {tripletItem.txHash && (
                        <p className="triplet-detail-name">
                          TX: {tripletItem.txHash.slice(0, 10)}...{tripletItem.txHash.slice(-8)}
                        </p>
                      )}
                      <p className="triplet-detail-name">
                        📦 IPFS: {tripletItem.ipfsUri.slice(0, 20)}...
                      </p>
                      <p className="triplet-detail-name">
                        Status: {tripletItem.tripleStatus === 'on-chain' ? '⛓️ On-Chain' : '🔗 Atom Only'}
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
          );
        })
      ) : (
        <div className="empty-state">
          <p>No published triplets yet</p>
          <p className="empty-subtext">
            Go to the Echoes tab to publish your first on-chain triplets
          </p>
        </div>
      )}
    </div>
  )
}

export default SignalsTab