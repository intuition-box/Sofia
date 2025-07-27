import { useState } from 'react'
import { useOnChainTriplets, type OnChainTriplet } from '../../../hooks/useOnChainTriplets'
import { useCreateTripleOnChain } from '../../../hooks/useCreateTripleOnChain'
import QuickActionButton from '../../ui/QuickActionButton'
import '../../ui/AtomCreationModal.css'
import '../../styles/MyGraphPage.css'

interface SignalsTabProps {
  expandedTriplet: { tripletId: string } | null
  setExpandedTriplet: (value: { tripletId: string } | null) => void
}

const SignalsTab = ({ expandedTriplet, setExpandedTriplet }: SignalsTabProps) => {
  const { triplets, isLoading, getTripletsCount, updateTripletToOnChain } = useOnChainTriplets()
  const { createTripleOnChain, isCreating, currentStep } = useCreateTripleOnChain()
  const [processingTripletId, setProcessingTripletId] = useState<string | null>(null)

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

  const handleCreateTripleOnChain = async (triplet: OnChainTriplet) => {
    if (isCreating || processingTripletId) {
      console.warn('Triple creation already in progress')
      return
    }

    setProcessingTripletId(triplet.id)
    
    try {
      console.log('🔗 Creating triple on-chain for:', triplet.triplet)
      
      const result = await createTripleOnChain(
        triplet.triplet.predicate,
        {
          name: triplet.triplet.object,
          description: triplet.originalMessage?.rawObjectDescription || "Contenu visité par l'utilisateur.",
          url: triplet.url
        }
      )

      // Mettre à jour le triplet dans le storage
      await updateTripletToOnChain(
        triplet.id,
        result.tripleVaultId,
        result.subjectVaultId,
        result.predicateVaultId,
        result.txHash
      )

      console.log('✅ Triple successfully created on-chain!', result)
    } catch (error) {
      console.error('❌ Failed to create triple on-chain:', error)
      alert(`Erreur lors de la création du triplet: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setProcessingTripletId(null)
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
          <div className="stat-item">
            <span className="stat-number stat-atom-only">{counts.atomOnly}</span>
            <span className="stat-label">Atom Only</span>
          </div>
          <div className="stat-item">
            <span className="stat-number stat-on-chain">{counts.onChain}</span>
            <span className="stat-label">On-Chain</span>
          </div>
        </div>
      )}

      {triplets.length > 0 ? (
        triplets.map((tripletItem) => {
          const isExpanded = expandedTriplet?.tripletId === tripletItem.id
          console.log('🔍 Render triplet:', tripletItem.id, 'expandedTriplet:', expandedTriplet, 'isExpanded:', isExpanded)

          return (
            <div key={tripletItem.id} className={`echo-card ${getBorderStyle(tripletItem.source)}`}>
              <div className={`triplet-item ${isExpanded ? 'expanded' : ''}`}>
                
                {/* Header avec badges et actions */}
                <div className="triplet-header">
                  {/* Badge source et status à gauche */}
                  <div className="badges-container">
                    <div className={`source-badge ${getBadgeStyle(tripletItem.source)}`}>
                      {tripletItem.source === 'created' ? '🆕 NEW' : '🔗 FOUND'}
                    </div>
                    <div className={`status-badge ${tripletItem.tripleStatus === 'on-chain' ? 'badge-on-chain' : 'badge-atom-only'}`}>
                      {tripletItem.tripleStatus === 'on-chain' ? '⛓️ TRIPLET' : '🔗 ATOM'}
                    </div>
                  </div>

                  {/* Actions à droite */}
                  <div className="signal-actions">
                    {tripletItem.tripleStatus === 'atom-only' ? (
                      <QuickActionButton
                        action="add"
                        onClick={() => handleCreateTripleOnChain(tripletItem)}
                        disabled={processingTripletId === tripletItem.id || isCreating}
                      />
                    ) : (
                      <QuickActionButton
                        action="scan"
                        onClick={() => handleViewOnExplorer(tripletItem.txHash, tripletItem.tripleVaultId)}
                      />
                    )}
                  </div>
                </div>

                {/* Texte du triplet */}
                <p
                  className="triplet-text clickable"
                  onClick={() => {
                    console.log('🔍 Click on triplet:', tripletItem.id, 'Current expanded:', expandedTriplet?.tripletId, 'Will expand:', !isExpanded)
                    setExpandedTriplet(isExpanded ? null : { tripletId: tripletItem.id })
                  }}
                >
                  <span className="subject">{tripletItem.triplet.subject}</span>{' '}
                  <span className="action">{tripletItem.triplet.predicate}</span>{' '}
                  <span className="object">{tripletItem.triplet.object}</span>
                </p>

                {/* Message de progression */}
                {processingTripletId === tripletItem.id && (
                  <div className="processing-message">
                    {currentStep || '⚙️ Création du triplet...'}
                  </div>
                )}

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