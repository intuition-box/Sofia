import { useState, useEffect } from 'react'
import { useStorage } from "@plasmohq/storage/hook"
import { elizaDataService } from '../../../lib/database/indexedDB-methods'
import '../../styles/CorePage.css'

interface PulseTabProps {
  expandedTriplet: { msgIndex: number; tripletIndex: number } | null
  setExpandedTriplet: (value: { msgIndex: number; tripletIndex: number } | null) => void
}

interface PulseTheme {
  name: string
  category: string
  confidence: number
  predicate: string
  object: string
  keywords: string[]
  urls: string[]
}

interface PulseAnalysis {
  msgIndex: number
  timestamp: number
  themes: PulseTheme[]
}

const PulseTab = ({ expandedTriplet, setExpandedTriplet }: PulseTabProps) => {
  const [address] = useStorage<string>("metamask-account")
  const [pulseAnalyses, setPulseAnalyses] = useState<PulseAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(new Set())

  // Fetch pulse analyses from IndexedDB
  useEffect(() => {
    const fetchPulseAnalyses = async () => {
      try {
        console.log("🫀 [PulseTab] Fetching pulse analyses from IndexedDB...")
        const messages = await elizaDataService.getAllMessages()
        
        console.log("🫀 [PulseTab] Total messages in IndexedDB:", messages.length)
        console.log("🫀 [PulseTab] All messages:", messages.map(m => ({ 
          id: m.id, 
          type: m.type, 
          hasThemes: typeof m.content === 'object' && m.content && 'text' in m.content 
            ? (typeof m.content.text === 'string' ? m.content.text.includes('themes') : false)
            : false,
          content: typeof m.content === 'object' && m.content && 'text' in m.content 
            ? (typeof m.content.text === 'string' ? m.content.text.substring(0, 100) : 'N/A')
            : 'N/A'
        })))
        
        // Filter messages that are pulse analyses (now stored with correct type)
        const pulseMessages = messages.filter(msg => 
          msg.type === 'pulse_analysis'
        )
        
        console.log("🫀 [PulseTab] Found pulse messages:", pulseMessages.length)
        console.log("🫀 [PulseTab] Pulse messages details:", pulseMessages)
        
        // Parse and group themes by message (analysis session)
        const analysisGroups: PulseAnalysis[] = []
        pulseMessages.forEach((msg, msgIndex) => {
          try {
            let themes: PulseTheme[] = []
            const text = (typeof msg.content === 'object' && msg.content && 'text' in msg.content && typeof msg.content.text === 'string') 
              ? msg.content.text 
              : ''
            
            // Try to parse JSON from the text
            if (text && text.includes('{') && text.includes('themes')) {
              const jsonMatch = text.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0])
                themes = parsed.themes || []
              }
            }
            
            if (themes.length > 0) {
              analysisGroups.push({
                msgIndex,
                timestamp: msg.timestamp, // Use timestamp from ElizaRecord
                themes
              })
            }
          } catch (error) {
            console.warn("🫀 [PulseTab] Failed to parse message:", error)
          }
        })
        
        // Sort by timestamp (most recent first)
        analysisGroups.sort((a, b) => b.timestamp - a.timestamp)
        
        console.log("🫀 [PulseTab] Created analysis groups:", analysisGroups.length)
        setPulseAnalyses(analysisGroups)
      } catch (error) {
        console.error("🫀 [PulseTab] Error fetching pulse analyses:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPulseAnalyses()
  }, [])

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const toggleSessionExpansion = (sessionIndex: number) => {
    setExpandedSessions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sessionIndex)) {
        newSet.delete(sessionIndex)
      } else {
        newSet.add(sessionIndex)
      }
      return newSet
    })
  }

  // Initialize sessions as expanded by default when data loads
  useEffect(() => {
    if (pulseAnalyses.length > 0 && expandedSessions.size === 0) {
      setExpandedSessions(new Set(pulseAnalyses.map((_, index) => index)))
    }
  }, [pulseAnalyses])


  if (loading) {
    return (
      <div className="triples-container">
        <div className="empty-state">
          <p>Loading pulse analysis...</p>
        </div>
      </div>
    )
  }

  if (pulseAnalyses.length === 0) {
    return (
      <div className="triples-container">
        <div className="empty-state">
          <p>No Pulse Analysis Yet</p>
          <p className="empty-subtext">
            Use the Pulse Analysis button in Settings to analyze your browsing patterns
          </p>
        </div>
      </div>
    )
  }

  const totalThemes = pulseAnalyses.reduce((sum, analysis) => sum + analysis.themes.length, 0)

  return (
    <div className="triples-container">
      <div className="triples-header">
        <h3>Behavioral Pulse Analysis</h3>
        <p className="triples-count">{pulseAnalyses.length} research sessions • {totalThemes} behavioral patterns</p>
      </div>
      
      <div className="triples-list">
        {pulseAnalyses.map((analysis, analysisIndex) => {
          const isSessionExpanded = expandedSessions.has(analysisIndex)
          
          return (
            <div key={analysis.msgIndex} className="pulse-analysis-group">
              <div 
                className="analysis-header clickable"
                onClick={() => toggleSessionExpansion(analysisIndex)}
                style={{ cursor: 'pointer' }}
              >
                <h4>
                  <span style={{ marginRight: '8px' }}>
                    {isSessionExpanded ? '▼' : '▶'}
                  </span>
                  Research Session #{analysisIndex + 1}
                </h4>
                <div className="analysis-meta">
                  <span className="analysis-time">{formatTimestamp(analysis.timestamp)}</span>
                  <span className="themes-count">{analysis.themes.length} patterns</span>
                </div>
              </div>
              
              {isSessionExpanded && (
                <div className="analysis-themes">
              {analysis.themes.map((theme, themeIndex) => {
                const isExpanded = expandedTriplet?.msgIndex === analysis.msgIndex && expandedTriplet?.tripletIndex === themeIndex
                
                return (
                  <div 
                    key={`${analysis.msgIndex}-${themeIndex}`}
                    className="echo-card border-green"
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={`triplet-item ${isExpanded ? 'expanded' : ''}`}>
                      <div className="echo-header">
                        <p
                          className="triplet-text clickable"
                          onClick={() => {
                            if (isExpanded) {
                              setExpandedTriplet(null)
                            } else {
                              setExpandedTriplet({ msgIndex: analysis.msgIndex, tripletIndex: themeIndex })
                            }
                          }}
                        >
                          <span className="subject">You</span>{' '}
                          <span className="action">{theme.predicate}</span>{' '}
                          <span className="object">{theme.object}</span>
                        </p>
                      </div>

                      {isExpanded && (
                        <div className="triplet-details">
                          <div className="triplet-detail-section">
                            <h4 className="triplet-detail-title">Pattern Name</h4>
                            <p className="triplet-detail-name">{theme.name}</p>
                          </div>
                          
                          <div className="triplet-detail-section">
                            <h4 className="triplet-detail-title">Keywords</h4>
                            <div className="triplet-detail-description">
                              {theme.keywords?.join(', ') || 'No keywords'}
                            </div>
                          </div>
                          
                          {theme.urls && theme.urls.length > 0 && (
                            <div className="triplet-detail-section">
                              <h4 className="triplet-detail-title">Evidence URLs</h4>
                              {theme.urls.map((url: string, i: number) => (
                                <a 
                                  key={i} 
                                  href={url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="triplet-detail-url"
                                >
                                  {new URL(url).hostname}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
                })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PulseTab