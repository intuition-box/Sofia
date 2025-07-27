import { useState, useEffect } from 'react'
import { Storage } from '@plasmohq/storage'
import { useOnChainTriplets, type OnChainTriplet } from '../../../hooks/useOnChainTriplets'
import { useCreateTripleOnChain } from '../../../hooks/useCreateTripleOnChain'
import QuickActionButton from '../../ui/QuickActionButton'
import type { Message, ParsedSofiaMessage, Triplet } from './types'
import { parseSofiaMessage } from './types'
import '../../styles/AtomCreationModal.css'
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
    // First run migration if needed, then load messages
    migrateLegacyStorage().then(() => {
      loadSofiaMessages()
    })
  }, [])

  // Migration function for users with old storage format
  const migrateLegacyStorage = async () => {
    try {
      const legacyMessages = await storage.get("sofiaMessages")
      if (legacyMessages && Array.isArray(legacyMessages) && legacyMessages.length > 0) {
        console.log("🔄 Migrating legacy sofiaMessages to new system...")
        
        // Process legacy messages and extract triplets
        let extractedTriplets = await storage.get("extractedTriplets") || []
        if (!Array.isArray(extractedTriplets)) extractedTriplets = []
        
        let migratedCount = 0
        for (const message of legacyMessages) {
          try {
            const parsed = parseSofiaMessage(message.content.text, message.created_at)
            if (parsed && parsed.triplets.length > 0) {
              const tripletWithSource = {
                ...parsed,
                sourceMessageId: `legacy_${message.created_at}`,
                extractedAt: Date.now()
              }
              extractedTriplets.push(tripletWithSource)
              migratedCount++
            }
          } catch (parseError) {
            console.error("❌ Failed to migrate legacy message:", parseError)
          }
        }
        
        if (migratedCount > 0) {
          await storage.set("extractedTriplets", extractedTriplets)
          console.log(`✅ Migrated ${migratedCount} legacy triplets`)
        }
        
        // Remove legacy storage after successful migration
        await storage.remove("sofiaMessages")
        console.log("✅ Legacy storage cleaned up")
      }
    } catch (error) {
      console.error("❌ Migration failed:", error)
    }
  }

  const loadSofiaMessages = async () => {
    setIsLoadingMessages(true)
    try {
      // First, try to process any pending messages from buffer
      await processMessageBuffer()
      
      // Then load already parsed triplets from permanent storage
      const extractedTriplets = await storage.get("extractedTriplets") || []
      if (Array.isArray(extractedTriplets)) {
        setParsedMessages(extractedTriplets)
        console.log("✅ Loaded extracted triplets:", extractedTriplets.length)
      } else {
        setParsedMessages([])
      }
    } catch (error) {
      console.error('❌ Failed to load SofIA messages:', error)
      setParsedMessages([])
    } finally {
      setIsLoadingMessages(false)
    }
  }

  // NEW: Process messages from buffer and extract triplets safely
  const processMessageBuffer = async () => {
    try {
      const messageBuffer = await storage.get("sofiaMessagesBuffer") || []
      if (!Array.isArray(messageBuffer) || messageBuffer.length === 0) {
        console.log("📭 No messages in buffer to process")
        return
      }

      console.log(`🔄 Processing ${messageBuffer.length} messages from buffer`)
      
      // Get existing extracted triplets
      let extractedTriplets = await storage.get("extractedTriplets") || []
      if (!Array.isArray(extractedTriplets)) extractedTriplets = []

      const processedMessageIds: string[] = []
      let newTripletsCount = 0

      for (const message of messageBuffer) {
        if (message.processed) continue // Skip already processed messages

        try {
          console.log(`🔄 Processing message ${message.id}`)
          const parsed = parseSofiaMessage(message.content.text, message.created_at)
          
          if (parsed && parsed.triplets.length > 0) {
            // Add to extracted triplets with source tracking
            const tripletWithSource = {
              ...parsed,
              sourceMessageId: message.id,
              extractedAt: Date.now()
            }
            extractedTriplets.push(tripletWithSource)
            newTripletsCount++
            console.log(`✅ Extracted ${parsed.triplets.length} triplets from message ${message.id}`)
          }
          
          // Mark message as processed
          processedMessageIds.push(message.id)
        } catch (parseError) {
          console.error(`❌ Failed to parse message ${message.id}:`, parseError)
          // Don't mark as processed if parsing failed - retry next time
        }
      }

      // Save extracted triplets if we have new ones
      if (newTripletsCount > 0) {
        // Keep only the 100 most recent triplets to prevent storage bloat
        if (extractedTriplets.length > 100) {
          extractedTriplets = extractedTriplets
            .sort((a, b) => b.extractedAt - a.extractedAt)
            .slice(0, 100)
        }
        
        await storage.set("extractedTriplets", extractedTriplets)
        console.log(`✅ Saved ${newTripletsCount} new triplets to permanent storage`)
      }

      // SAFELY remove processed messages from buffer
      if (processedMessageIds.length > 0) {
        const updatedBuffer = messageBuffer.filter(msg => !processedMessageIds.includes(msg.id))
        await storage.set("sofiaMessagesBuffer", updatedBuffer)
        console.log(`🧹 Removed ${processedMessageIds.length} processed messages from buffer`)
      }

    } catch (error) {
      console.error('❌ Failed to process message buffer:', error)
      if (error instanceof Error && error.message.includes('quota')) {
        console.log("🚨 Storage quota exceeded during processing, clearing buffer...")
        try {
          await storage.set("sofiaMessagesBuffer", [])
        } catch (clearError) {
          console.error("❌ Failed to clear buffer:", clearError)
        }
      }
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
          description: triplet.originalMessage?.rawObjectDescription || "Content visited by the user.",
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
      alert(`Error creating triplet: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
        alert("All triplets are already imported!")
      }
    } catch (error) {
      console.error('❌ Failed to import triplets:', error)
      
      // Si erreur de quota, suggérer le nettoyage
      if (error instanceof Error && error.message.includes('quota')) {
        const shouldClean = confirm("Storage quota error! Do you want to clean old messages to free up space?")
        if (shouldClean) {
          await clearOldMessages()
          // Retry l'import après nettoyage
          await importAllAvailableTriplets()
        }
      } else {
        alert(`Import error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  // Fonction pour nettoyer les anciens messages manuellement
  const clearOldMessages = async () => {
    try {
      console.log("🧹 Manual cleanup initiated...")
      
      // Clear buffer completely
      await storage.set("sofiaMessagesBuffer", [])
      console.log("✅ Cleared message buffer")
      
      // Keep only the 20 most recent extracted triplets
      const extractedTriplets = await storage.get("extractedTriplets") || []
      if (Array.isArray(extractedTriplets) && extractedTriplets.length > 0) {
        const recentTriplets = extractedTriplets
          .sort((a, b) => b.extractedAt - a.extractedAt)
          .slice(0, 20)
        
        await storage.set("extractedTriplets", recentTriplets)
        console.log(`✅ Cleaned triplets: kept ${recentTriplets.length} most recent`)
      }
      
      // Clear old sofiaMessages storage if it still exists (migration cleanup)
      try {
        await storage.remove("sofiaMessages")
        console.log("✅ Removed legacy sofiaMessages storage")
      } catch (removeError) {
        // Ignore if already removed
      }
      
      // Reload messages after cleanup
      await loadSofiaMessages()
    } catch (error) {
      console.error('❌ Failed to clean messages:', error)
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
            <h3>📥 New SofIA triplets ({availableTripletsCount})</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn-secondary"
                onClick={() => setShowImportSection(!showImportSection)}
              >
                {showImportSection ? 'Hide' : 'Show'}
              </button>
              <button 
                className="btn-secondary"
                onClick={clearOldMessages}
                title="Clean old messages to free up space"
                style={{ fontSize: '12px', padding: '8px 12px' }}
              >
                🧹 Clean
              </button>
            </div>
          </div>
          
          {showImportSection && (
            <div className="import-content">
              <p>You have {availableTripletsCount} new triplets from your SofIA messages.</p>
              <button 
                className="btn-primary"
                onClick={importAllAvailableTriplets}
                disabled={isCreating}
              >
                Import all triplets
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
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-item">
            <span className="stat-number stat-created">{unpublishedCounts.created}</span>
            <span className="stat-label">Created</span>
          </div>
          <div className="stat-item">
            <span className="stat-number stat-existing">{unpublishedCounts.existing}</span>
            <span className="stat-label">Existing</span>
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
                      🔗 PENDING
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
                    {currentStep || '⚙️ Creating triplet...'}
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
                        Status: 🔗 Pending publication
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
          <p>No pending triplets</p>
          <p className="empty-subtext">
            Click "Import all triplets" above to get started
          </p>
        </div>
      ) : parsedMessages.length > 0 ? (
        <div className="empty-state">
          <p>All your triplets are already published!</p>
          <p className="empty-subtext">
            Check the Signals tab to view your published triplets
          </p>
        </div>
      ) : (
        <div className="empty-state">
          <p>No SofIA messages found</p>
          <p className="empty-subtext">
            Your triplets will appear automatically when you receive messages
          </p>
          <button 
            className="btn-secondary"
            onClick={clearOldMessages}
            style={{ marginTop: '16px' }}
          >
            🧹 Clean storage
          </button>
        </div>
      )}
    </div>
  )
}

export default EchoesTab