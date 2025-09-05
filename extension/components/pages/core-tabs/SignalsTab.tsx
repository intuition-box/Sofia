import { useState } from 'react'
import { useIntuitionTriplets, type IntuitionTriplet } from '../../../hooks/useIntuitionTriplets'
import QuickActionButton from '../../ui/QuickActionButton'
import '../../styles/AtomCreationModal.css'
import '../../styles/CorePage.css'

interface SignalsTabProps {
  expandedTriplet: { tripletId: string } | null
  setExpandedTriplet: (value: { tripletId: string } | null) => void
}

const SignalsTab = ({ expandedTriplet, setExpandedTriplet }: SignalsTabProps) => {
  const { triplets, isLoading, error, refreshFromAPI } = useIntuitionTriplets()
  
  // Afficher tous les triplets depuis l'API Intuition testnet
  const publishedTriplets = triplets.sort((a, b) => b.timestamp - a.timestamp)
  
  const publishedCounts = {
    total: publishedTriplets.length,
    created: publishedTriplets.filter(t => t.source === 'created').length,
    existing: publishedTriplets.filter(t => t.source === 'existing').length,
    intuition: publishedTriplets.filter(t => t.source === 'intuition_api').length,
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

  if (isLoading) {
    return (
      <div className="triples-container">
        <div className="empty-state">
          <p>🔄 Loading triplets from Intuition testnet...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="triples-container">
        <div className="empty-state">
          <p>❌ Error connecting to Intuition testnet</p>
          <p className="empty-subtext">{error}</p>
          <button onClick={refreshFromAPI} className="retry-button">
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
                      {tripletItem.ipfsUri && (
                        <p className="triplet-detail-name">
                          📦 IPFS: {tripletItem.ipfsUri.slice(0, 20)}...
                        </p>
                      )}
                      <p className="triplet-detail-name">
                        Status: {tripletItem.tripleStatus === 'on-chain' ? '⛓️ On-Chain' : '🔗 Atom Only'}
                      </p>
                    </div>

                    <div className="triplet-detail-section">
                      <h4 className="triplet-detail-title">🌐 Source</h4>
                      <p className="triplet-detail-name">
                        {tripletItem.url || 'Intuition Testnet API'}
                      </p>
                      <p className="triplet-detail-timestamp">
                        {new Date(tripletItem.timestamp).toLocaleString()}
                      </p>
                      <p className="triplet-detail-name">
                        Creator: {tripletItem.subjectVaultId?.slice(0, 8)}...{tripletItem.subjectVaultId?.slice(-6)}
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
          <p>📡 Connected to Intuition testnet</p>
          <p className="empty-subtext">
            No triplets found on the Intuition blockchain yet.<br/>
            Create some triplets in Echoes tab to see them appear here after publishing!
          </p>
          <button onClick={refreshFromAPI} className="refresh-button">
            🔄 Refresh from API
          </button>
        </div>
      )}
    </div>
  )
}

export default SignalsTab