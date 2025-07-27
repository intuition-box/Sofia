import { useState, useEffect } from 'react'
import { Storage } from '@plasmohq/storage'
import { useOnChainTriplets, type OnChainTriplet } from '../../../hooks/useOnChainTriplets'
import { useCreateTripleOnChain } from '../../../hooks/useCreateTripleOnChain'
import QuickActionButton from '../../ui/QuickActionButton'
import type { Message, ParsedSofiaMessage, Triplet } from './types'
import { parseSofiaMessage } from './types'
import '../../ui/AtomCreationModal.css'
import '../../styles/MyGraphPage.css'

const storage = new Storage()

interface EchoesTabProps {
  expandedTriplet: { msgIndex: number; tripletIndex: number } | null
  setExpandedTriplet: (value: { msgIndex: number; tripletIndex: number } | null) => void
}

const EchoesTab = ({ expandedTriplet, setExpandedTriplet }: EchoesTabProps) => {
  // État pour les messages SofIA parsés
  const [parsedMessages, setParsedMessages] = useState<ParsedSofiaMessage[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  // Hooks pour la gestion des triplets on-chain
  const { triplets, isLoading, getTripletsCount, updateTripletToOnChain, addTriplet } = useOnChainTriplets()
  const { createTripleOnChain, isCreating, currentStep } = useCreateTripleOnChain()
  
  const [processingTripletId, setProcessingTripletId] = useState<string | null>(null)
  const [showImportSection, setShowImportSection] = useState(false)

  // Filtrer uniquement les triplets non publiés (atom-only)
  const unpublishedTriplets = triplets.filter(t => t.tripleStatus === 'atom-only')
  
  const unpublishedCounts = {
    total: unpublishedTriplets.length,
    created: unpublishedTriplets.filter(t => t.source === 'created').length,
    existing: unpublishedTriplets.filter(t => t.source === 'existing').length,
  }

  // Charger les messages SofIA depuis le storage
  useEffect(() => {
    loadSofiaMessages()
  }, [])

  const loadSofiaMessages = async () => {
    setIsLoadingMessages(true)
    try {
      const raw = await storage.get("sofiaMessages")
      console.log("🔍 Raw data from storage:", raw)

      if (!raw) {
        console.log("📭 No sofiaMessages found in storage")
        setParsedMessages([])
        return
      }

      let messages: Message[]
      if (typeof raw === 'string') {
        messages = JSON.parse(raw)
      } else if (Array.isArray(raw)) {
        messages = raw
      } else {
        console.error("❌ Unexpected data format:", typeof raw, raw)
        setParsedMessages([])
        return
      }

      console.log("📝 Processing SofIA messages:", messages.length)

      const parsed = messages
        .map((m, index) => {
          console.log(`🔄 Processing message ${index}`)
          return parseSofiaMessage(m.content.text, m.created_at)
        })
        .filter(msg => msg !== null) as ParsedSofiaMessage[]

      console.log("✅ Final parsed messages:", parsed)
      setParsedMessages(parsed)
    } catch (error) {
      console.error('❌ Failed to load sofiaMessages from storage:', error)
      setParsedMessages([])
    } finally {
      setIsLoadingMessages(false)
    }
  }

  // Fonction pour importer un triplet SofIA vers les triplets on-chain
  const importTripletFromSofia = async (
    triplet: Triplet, 
    message: ParsedSofiaMessage,
    msgIndex: number,
    tripletIndex: number
  ) => {
    try {
      // Vérifier si ce triplet est déjà importé
      const isAlreadyImported = triplets.some(existing => 
        existing.triplet.subject === triplet.subject &&
        existing.triplet.predicate === triplet.predicate &&
        existing.triplet.object === triplet.object
      )

      if (isAlreadyImported) {
        console.log('⚠️ Triplet already imported, skipping')
        return
      }

      console.log("📥 Importing triplet from SofIA:", triplet)

      await addTriplet({
        triplet: triplet,
        atomVaultId: 'pending', // Sera rempli lors de la création complète
        source: 'created', 
        url: message.rawObjectUrl || '',
        ipfsUri: 'pending', // Sera rempli lors de la création complète
        originalMessage: {
          rawObjectDescription: message.rawObjectDescription,
          rawObjectUrl: message.rawObjectUrl
        },
        tripleStatus: 'atom-only' // Commence comme atom-only
      })

      console.log("✅ Triplet imported successfully")
    } catch (error) {
      console.error("❌ Failed to import triplet:", error)
      throw error
    }
  }

  // Fonction pour créer un triplet complet on-chain
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
        result.objectVaultId,
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

  const handleViewOnExplorer = (txHash?: string, vaultId?: string) => {
    if (txHash) {
      window.open(`https://sepolia.basescan.org/tx/${txHash}`, '_blank')
    } else if (vaultId) {
      console.log('🔍 View vault:', vaultId)
    }
  }

  // Fonction pour importer tous les triplets disponibles
  const importAllAvailableTriplets = async () => {
    try {
      let importCount = 0
      
      for (const [msgIndex, message] of parsedMessages.entries()) {
        if (message.triplets.length > 0) {
          for (const [tripletIndex, triplet] of message.triplets.entries()) {
            // Vérifier si déjà importé
            const isAlreadyImported = triplets.some(existing => 
              existing.triplet.subject === triplet.subject &&
              existing.triplet.predicate === triplet.predicate &&
              existing.triplet.object === triplet.object
            )

            if (!isAlreadyImported) {
              await importTripletFromSofia(triplet, message, msgIndex, tripletIndex)
              importCount++
            }
          }
        }
      }

      console.log(`✅ Imported ${importCount} new triplets!`)
      if (importCount === 0) {
        alert("Tous les triplets sont déjà importés !")
      }
    } catch (error) {
      console.error('❌ Failed to import triplets:', error)
      alert(`Erreur lors de l'import: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
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

  // Calculer les triplets disponibles pour import
  const availableTripletsCount = parsedMessages.reduce((count, message) => {
    return count + message.triplets.filter(triplet => {
      return !triplets.some(existing => 
        existing.triplet.subject === triplet.subject &&
        existing.triplet.predicate === triplet.predicate &&
        existing.triplet.object === triplet.object
      )
    }).length
  }, 0)

  if (isLoadingMessages || isLoading) {
    return (
      <div className="triples-container">
        <div className="empty-state">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="triples-container">
      {/* Section d'import des triplets SofIA */}
      {availableTripletsCount > 0 && (
        <div className="import-section">
          <div className="import-header">
            <h3>📥 Nouveaux triplets SofIA ({availableTripletsCount})</h3>
            <button 
              className="btn-secondary"
              onClick={() => setShowImportSection(!showImportSection)}
            >
              {showImportSection ? 'Masquer' : 'Afficher'}
            </button>
          </div>
          
          {showImportSection && (
            <div className="import-content">
              <p>Vous avez {availableTripletsCount} nouveaux triplets depuis vos messages SofIA.</p>
              <button 
                className="btn-primary"
                onClick={importAllAvailableTriplets}
                disabled={isCreating}
              >
                Importer tous les triplets
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stats header */}
      {unpublishedCounts.total > 0 && (
        <div className="signals-stats">
          <div className="stat-item">
            <span className="stat-number stat-atom-only">{unpublishedCounts.total}</span>
            <span className="stat-label">En Attente</span>
          </div>
          <div className="stat-item">
            <span className="stat-number stat-created">{unpublishedCounts.created}</span>
            <span className="stat-label">Créés</span>
          </div>
          <div className="stat-item">
            <span className="stat-number stat-existing">{unpublishedCounts.existing}</span>
            <span className="stat-label">Existants</span>
          </div>
        </div>
      )}

      {/* Liste des triplets en attente de publication */}
      {unpublishedTriplets.length > 0 ? (
        unpublishedTriplets.map((tripletItem, tripletItemIndex) => {
          // Pour le moment, on utilise l'index du triplet comme identifiant
          const isExpanded = expandedTriplet?.msgIndex === 0 && expandedTriplet?.tripletIndex === tripletItemIndex

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
                    <div className="status-badge badge-atom-only">
                      🔗 EN ATTENTE
                    </div>
                  </div>

                  {/* Actions à droite - Uniquement bouton publier */}
                  <div className="signal-actions">
                    <QuickActionButton
                      action="add"
                      onClick={() => handleCreateTripleOnChain(tripletItem)}
                      disabled={processingTripletId === tripletItem.id || isCreating}
                    />
                  </div>
                </div>

                {/* Texte du triplet */}
                <p
                  className="triplet-text clickable"
                  onClick={() => {
                    // Utiliser l'index du triplet pour l'expansion
                    const newExpandedState = isExpanded ? null : { 
                      msgIndex: 0, // Toujours 0 car on gère maintenant depuis le storage unifié
                      tripletIndex: tripletItemIndex
                    }
                    setExpandedTriplet(newExpandedState)
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
                        Status: 🔗 En attente de publication
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
      ) : availableTripletsCount > 0 ? (
        <div className="empty-state">
          <p>Aucun triplet en attente</p>
          <p className="empty-subtext">
            Cliquez sur "Importer tous les triplets" ci-dessus pour commencer
          </p>
        </div>
      ) : parsedMessages.length > 0 ? (
        <div className="empty-state">
          <p>Tous vos triplets sont déjà publiés !</p>
          <p className="empty-subtext">
            Consultez l'onglet Signals pour voir vos triplets publiés
          </p>
        </div>
      ) : (
        <div className="empty-state">
          <p>Aucun message SofIA trouvé</p>
          <p className="empty-subtext">
            Vos triplets apparaîtront automatiquement quand vous recevrez des messages
          </p>
        </div>
      )}
    </div>
  )
}

export default EchoesTab