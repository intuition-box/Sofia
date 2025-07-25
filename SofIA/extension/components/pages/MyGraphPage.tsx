import { useState, useEffect } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { Storage } from '@plasmohq/storage'
import LiquidGlass from '../ui/LiquidGlass'
import QuickActionButton from '../ui/QuickActionButton'
import '../styles/Global.css'
import '../styles/MyGraphPage.css'

const storage = new Storage()

interface Message {
  content: { text: string }
  created_at: number
}

interface Triplet {
  subject: { name: string; description?: string; url?: string }
  predicate: { name: string; description?: string }
  object: { name: string; description?: string; url: string }
}

interface ParsedSofiaMessage {
  triplets: Triplet[]
  intention: string
  created_at: number
}

function parseSofiaMessage(text: string, created_at: number): ParsedSofiaMessage | null {
  console.log("🔍 Parsing message text:", text)

  const sanitizedText = text
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")

  try {
    const jsonData = JSON.parse(sanitizedText)

    const parsedTriplets: Triplet[] = (jsonData.triplets || []).map((t) => ({
      subject: {
        name: t.subject?.name || 'Unknown',
        description: t.subject?.description,
        url: t.subject?.url
      },
      predicate: {
        name: t.predicate?.name || 'did something',
        description: t.predicate?.description
      },
      object: {
        name: t.object?.name || 'Unknown',
        description: t.object?.description,
        url: t.object?.url || '#'
      }
    }))

    return {
      triplets: parsedTriplets,
      intention: jsonData.intention || '',
      created_at
    }
  } catch (error) {
    console.warn("❌ Failed to parse JSON, treating as text message:", error)

    if (text && typeof text === 'string' && text.trim().length > 0) {
      return {
        triplets: [],
        intention: text.trim(),
        created_at
      }
    }

    return null
  }
}

const MyGraphPage = () => {
  const { navigateTo } = useRouter()
  const [activeGraphTab, setActiveGraphTab] = useState<'Echoes' | 'Signals' | 'Resonance'>('Echoes')
  const [parsedMessages, setParsedMessages] = useState<ParsedSofiaMessage[]>([])
  const [expandedTriplet, setExpandedTriplet] = useState<{ msgIndex: number; tripletIndex: number } | null>(null)

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

        const parsed = messages
          .map((m) => parseSofiaMessage(m.content.text, m.created_at))
          .filter(msg => msg !== null) as ParsedSofiaMessage[]

        console.log("✅ Final parsed messages:", parsed)
        setParsedMessages(parsed)
      } catch (e) {
        console.error('❌ Failed to load sofiaMessages from storage:', e)
      }
    }

    loadMessages()
  }, [])

  return (
    <div className="page">
      <button onClick={() => navigateTo('home-connected')} className="back-button">
        ← Back to Home
      </button>

      <h2 className="section-title">My Graph</h2>

      <div className="tabs">
        {['Echoes', 'Signals', 'Resonance'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveGraphTab(tab as any)}
            className={`tab ${activeGraphTab === tab ? 'active' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="page-content">
        {activeGraphTab === 'Echoes' && (
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
                            <span className="subject">{triplet.subject.name}</span>{' '}
                            <span className="action">{triplet.predicate.name}</span>{' '}
                            <span className="object">{triplet.object.name}</span>
                          </p>

                          <QuickActionButton
                            action="add"
                            onClick={() => console.log('Add clicked for triplet:', triplet)}
                          />

                          {isExpanded && (
                            <div className="triplet-details">
                              <div>
                                <strong>🧍 Subject</strong>
                                <p>{triplet.subject.name}</p>
                                <p>{triplet.subject.description}</p>
                                {triplet.subject.url && (
                                  <a href={triplet.subject.url} target="_blank" rel="noopener noreferrer">
                                    {triplet.subject.url}
                                  </a>
                                )}
                              </div>

                              <div>
                                <strong>🔗 Predicate</strong>
                                <p>{triplet.predicate.name}</p>
                                <p>{triplet.predicate.description}</p>
                              </div>

                              <div>
                                <strong>📄 Object</strong>
                                <p>{triplet.object.name}</p>
                                <p>{triplet.object.description}</p>
                                {triplet.object.url && (
                                  <a href={triplet.object.url} target="_blank" rel="noopener noreferrer">
                                    {triplet.object.url}
                                  </a>
                                )}
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
                        onClick={() => console.log('Add clicked for:', entry.intention)}
                      />
                    </div>
                  )}

                  {msgIndex < parsedMessages.length - 1 && (
                    <LiquidGlass height="2px" className="triple-separator" />
                  )}
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No SofIA messages received yet</p>
                <p className="empty-subtext">They will appear automatically when received</p>
              </div>
            )}
          </div>
        )}

        {activeGraphTab === 'Signals' && (
          <div className="triples-container">
            <div className="empty-state">
              <p>No triples registered yet</p>
              <p className="empty-subtext">
                Your validated triplets will appear here once stored on-chain
              </p>
            </div>
          </div>
        )}

        {activeGraphTab === 'Resonance' && (
          <div className="triples-container">
            <div className="empty-state">
              <p>No resonance data available</p>
              <p className="empty-subtext">
                Resonance patterns will appear here when detected
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyGraphPage
