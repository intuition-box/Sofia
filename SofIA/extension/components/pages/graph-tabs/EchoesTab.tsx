import { useState, useEffect } from 'react'
import { Storage } from '@plasmohq/storage'
import QuickActionButton from '../../ui/QuickActionButton'
import AtomCreationModal from '../../ui/AtomCreationModal'
import type { Message, ParsedSofiaMessage, Triplet } from './types'
import { parseSofiaMessage } from './types'
import '../../ui/AtomCreationModal.css'

const storage = new Storage()

interface EchoesTabProps {
  expandedTriplet: { msgIndex: number; tripletIndex: number } | null
  setExpandedTriplet: (value: { msgIndex: number; tripletIndex: number } | null) => void
}

const EchoesTab = ({ expandedTriplet, setExpandedTriplet }: EchoesTabProps) => {
  const [parsedMessages, setParsedMessages] = useState<ParsedSofiaMessage[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedObjectData, setSelectedObjectData] = useState<{name: string; description?: string; url: string} | null>(null)
  const [selectedTripletData, setSelectedTripletData] = useState<{subject: string; predicate: string; object: string} | null>(null)
  const [selectedOriginalMessage, setSelectedOriginalMessage] = useState<{rawObjectDescription?: string; rawObjectUrl?: string} | null>(null)

  useEffect(() => {
    async function loadMessages() {
      try {
        const raw = await storage.get("sofiaMessages")
        console.log("🔍 Raw data from storage:", raw)

        if (!raw) {
          console.log("📭 No sofiaMessages found in storage")
          return
        }

        let messages: Message[]
        if (typeof raw === 'string') {
          messages = JSON.parse(raw)
        } else if (Array.isArray(raw)) {
          messages = raw
        } else {
          console.error("❌ Unexpected data format:", typeof raw, raw)
          return
        }

        console.log("📝 Parsed messages:", messages)

        
        // Log chaque message individuellement pour diagnostiquer
        messages.forEach((m, index) => {
          console.log(`📄 Message ${index}:`, {
            text: m.content.text,
            textType: typeof m.content.text,
            textLength: m.content.text?.length || 0,
            created_at: m.created_at
          })
        })

        const parsed = messages
          .map((m, index) => {
            console.log(`🔄 Processing message ${index}`)
            return parseSofiaMessage(m.content.text, m.created_at)
          })
          .filter(msg => msg !== null) as ParsedSofiaMessage[]

        console.log("✅ Final parsed messages:", parsed)
        setParsedMessages(parsed)
      } catch (e) {
        console.error('❌ Failed to load sofiaMessages from storage:', e)
      }
    }

    loadMessages()
  }, [])

  const handleCreateAtom = (triplet: Triplet, message: ParsedSofiaMessage) => {
    setSelectedObjectData({
      name: triplet.object,
      description: message.rawObjectDescription || undefined,
      url: message.rawObjectUrl || ''
    })
    setSelectedTripletData({
      subject: triplet.subject,
      predicate: triplet.predicate,
      object: triplet.object
    })
    setSelectedOriginalMessage({
      rawObjectDescription: message.rawObjectDescription,
      rawObjectUrl: message.rawObjectUrl
    })
    setIsModalOpen(true)
  }

  const handleCreateAtomFromIntention = (intention: string) => {
    // Pour les intentions, on crée un object avec le texte de l'intention
    setSelectedObjectData({
      name: intention,
      description: undefined,
      url: ''
    })
    setSelectedTripletData(null) // Pas de triplet pour les intentions
    setSelectedOriginalMessage(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedObjectData(null)
    setSelectedTripletData(null)
    setSelectedOriginalMessage(null)
  }

  return (
    <div className="triples-container">
      {parsedMessages.length > 0 ? (
        parsedMessages.map((entry, msgIndex) => (
          <div key={msgIndex} className="echo-card">
            {entry.triplets.length > 0 ? (
              entry.triplets.map((triplet, tripletIndex) => {
                const isExpanded =
                  expandedTriplet?.msgIndex === msgIndex &&
                  expandedTriplet?.tripletIndex === tripletIndex

                return (
                  <div key={tripletIndex} className={`triplet-item ${isExpanded ? 'expanded' : ''}`}>
                    <p
                      className="triplet-text clickable"
                      onClick={() =>
                        setExpandedTriplet(isExpanded ? null : { msgIndex, tripletIndex })
                      }
                    >
                      <span className="subject">{triplet.subject}</span>{' '}
                      <span className="action">{triplet.predicate}</span>{' '}
                      <span className="object">{triplet.object}</span>
                    </p>

                    <QuickActionButton
                      action="add"
                      onClick={() => handleCreateAtom(triplet, entry)}
                    />

                    {isExpanded && (
                      <div className="triplet-details">
                        <div className="triplet-detail-section">
                          <h4 className="triplet-detail-title">🧍 Subject</h4>
                          <p className="triplet-detail-name">{triplet.subject}</p>
                        </div>

                        <div className="triplet-detail-section">
                          <h4 className="triplet-detail-title">🔗 Predicate</h4>
                          <p className="triplet-detail-name">{triplet.predicate}</p>
                        </div>

                        <div className="triplet-detail-section">
                          <h4 className="triplet-detail-title">📄 Object</h4>
                          <p className="triplet-detail-name">{triplet.object}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="triplet-item">
                <p className="triplet-text">{entry.intention}</p>
                <QuickActionButton
                  action="add"
                  onClick={() => handleCreateAtomFromIntention(entry.intention)}
                />
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="empty-state">
          <p>No SofIA messages received yet</p>
          <p className="empty-subtext">They will appear automatically when received</p>
        </div>
      )}

      {/* Modal de création d'atom */}
      {selectedObjectData && (
        <AtomCreationModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          objectData={selectedObjectData}
          tripletData={selectedTripletData}
          originalMessage={selectedOriginalMessage}
        />
      )}
    </div>
  )
}

export default EchoesTab