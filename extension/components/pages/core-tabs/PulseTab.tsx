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
  messageId: string // Ajout de l'ID réel du message
  timestamp: number
  themes: PulseTheme[]
}

const PulseTab = ({ expandedTriplet, setExpandedTriplet }: PulseTabProps) => {
  const [address] = useStorage<string>("metamask-account")
  const [pulseAnalyses, setPulseAnalyses] = useState<PulseAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(new Set())
  const [expandedTriplets, setExpandedTriplets] = useState<Set<string>>(new Set())
  const [selectedSessions, setSelectedSessions] = useState<Set<number>>(new Set())
  const [selectedTriplets, setSelectedTriplets] = useState<Set<string>>(new Set()) // Format: "sessionIndex-tripletIndex"

  // Fetch pulse analyses from IndexedDB
  useEffect(() => {
    const fetchPulseAnalyses = async () => {
      try {
        console.log("🫀 [PulseTab] Fetching pulse analyses from IndexedDB...")
        const messages = await elizaDataService.getAllMessages()
        
        console.log("🫀 [PulseTab] Total messages in IndexedDB:", messages.length)
        console.log("🫀 [PulseTab] Message types distribution:", messages.reduce((acc, m) => {
          acc[m.type] = (acc[m.type] || 0) + 1
          return acc
        }, {} as Record<string, number>))
        
        // Check all message types that contain themes
        const messagesWithThemes = messages.filter(m => {
          const text = typeof m.content === 'object' && m.content && 'text' in m.content 
            ? (typeof m.content.text === 'string' ? m.content.text : '')
            : ''
          return text.includes('themes') && text.includes('{')
        })
        
        console.log("🫀 [PulseTab] Messages with themes by type:", messagesWithThemes.map(m => ({
          id: m.id,
          messageId: m.messageId,
          type: m.type,
          hasThemes: true,
          contentPreview: typeof m.content === 'object' && m.content && 'text' in m.content 
            ? (typeof m.content.text === 'string' ? m.content.text.substring(0, 200) : 'N/A')
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
                messageId: msg.id, // Utilisation de l'ID réel du message
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
        // Close all triplets in this session when session closes
        setExpandedTriplets(expandedTripletsSet => {
          const newTripletSet = new Set(expandedTripletsSet)
          for (const tripletId of newTripletSet) {
            if (tripletId.startsWith(`${sessionIndex}-`)) {
              newTripletSet.delete(tripletId)
            }
          }
          return newTripletSet
        })
      } else {
        newSet.add(sessionIndex)
      }
      return newSet
    })
  }

  const toggleTripletExpansion = (sessionIndex: number, tripletIndex: number) => {
    const tripletId = `${sessionIndex}-${tripletIndex}`
    setExpandedTriplets(prev => {
      const newSet = new Set(prev)
      if (newSet.has(tripletId)) {
        newSet.delete(tripletId)
      } else {
        newSet.add(tripletId)
      }
      return newSet
    })
  }


  const toggleSessionSelection = (sessionIndex: number) => {
    setSelectedSessions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sessionIndex)) {
        newSet.delete(sessionIndex)
      } else {
        newSet.add(sessionIndex)
      }
      return newSet
    })
  }

  const toggleTripletSelection = (sessionIndex: number, tripletIndex: number) => {
    const tripletId = `${sessionIndex}-${tripletIndex}`
    setSelectedTriplets(prev => {
      const newSet = new Set(prev)
      if (newSet.has(tripletId)) {
        newSet.delete(tripletId)
      } else {
        newSet.add(tripletId)
      }
      return newSet
    })
  }

  const toggleSelectAllTriplets = () => {
    if (selectedTriplets.size > 0) {
      // Clear all triplet selections
      setSelectedTriplets(new Set())
    } else {
      // Select all triplets from all sessions
      const allTripletIds: string[] = []
      pulseAnalyses.forEach((analysis, sessionIndex) => {
        analysis.themes.forEach((_, tripletIndex) => {
          allTripletIds.push(`${sessionIndex}-${tripletIndex}`)
        })
      })
      setSelectedTriplets(new Set(allTripletIds))
    }
  }

  const toggleSelectAllSessions = () => {
    if (selectedSessions.size > 0) {
      setSelectedSessions(new Set())
    } else {
      setSelectedSessions(new Set(pulseAnalyses.map((_, index) => index)))
    }
  }

  const deleteSelectedSessions = async () => {
    if (selectedSessions.size === 0) return
    
    const sessionCount = selectedSessions.size
    if (!confirm(`Are you sure you want to delete ${sessionCount} research session${sessionCount > 1 ? 's' : ''}? This action cannot be undone.`)) {
      return
    }

    try {
      // Sort indices in descending order to avoid index shifting issues
      const sortedIndices = Array.from(selectedSessions).sort((a, b) => b - a)
      
      for (const sessionIndex of sortedIndices) {
        const analysisToDelete = pulseAnalyses[sessionIndex]
        await elizaDataService.deleteMessageById(analysisToDelete.messageId)
      }
      
      // Remove from local state
      setPulseAnalyses(prev => prev.filter((_, index) => !selectedSessions.has(index)))
      
      // Clear selections and expanded states
      setSelectedSessions(new Set())
      setSelectedTriplets(new Set())
      setExpandedSessions(new Set())
      setExpandedTriplets(new Set())
      
      console.log(`🫀 [PulseTab] Deleted ${sessionCount} research sessions`)
    } catch (error) {
      console.error('🫀 [PulseTab] Error deleting selected sessions:', error)
      alert('Failed to delete selected sessions. Please try again.')
    }
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
      {/* Button to select all triplets when none selected */}
      {selectedTriplets.size === 0 && pulseAnalyses.length > 0 && (
        <div className="selection-panel">
          <div className="selection-info">
            <label className="select-all-label">
              <span onClick={toggleSelectAllTriplets} style={{cursor: 'pointer'}}>
                Select All Triplets for Publishing
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Panel for triplet selection and publishing */}
      {selectedTriplets.size > 0 && (
        <div className="selection-panel">
          <div className="selection-info">
            <label className="select-all-label">
              <span style={{cursor: 'default'}}>
                {selectedTriplets.size} triplets selected for publishing
              </span>
            </label>
          </div>
          
          <div className="batch-actions">
            <button 
              className="batch-btn add-to-signals"
              onClick={() => console.log('Amplify selected triplets:', selectedTriplets)}
            >
              Amplify ({selectedTriplets.size})
            </button>
            <button 
              className="batch-btn"
              onClick={() => setSelectedTriplets(new Set())}
              style={{ backgroundColor: '#666' }}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Button to select all sessions when none selected */}
      {selectedSessions.size === 0 && pulseAnalyses.length > 0 && (
        <div className="selection-panel" style={{ marginTop: selectedTriplets.size > 0 ? '10px' : '0' }}>
          <div className="selection-info">
            <label className="select-all-label">
              <span onClick={toggleSelectAllSessions} style={{cursor: 'pointer'}}>
                Select All Sessions for Deletion
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Panel for session selection and deletion */}
      {selectedSessions.size > 0 && (
        <div className="selection-panel" style={{ marginTop: selectedTriplets.size > 0 ? '10px' : '0' }}>
          <div className="selection-info">
            <label className="select-all-label">
              <span style={{cursor: 'default'}}>
                {selectedSessions.size} sessions selected for deletion
              </span>
            </label>
          </div>
          
          <div className="batch-actions">
            <button 
              className="batch-btn delete-selected"
              onClick={deleteSelectedSessions}
            >
              Remove Sessions ({selectedSessions.size})
            </button>
            <button 
              className="batch-btn"
              onClick={() => setSelectedSessions(new Set())}
              style={{ backgroundColor: '#666' }}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      <div className="triples-list">
        {pulseAnalyses.map((analysis, analysisIndex) => {
          const isSessionExpanded = expandedSessions.has(analysisIndex)
          const isSelected = selectedSessions.has(analysisIndex)
          
          return (
            <div 
              key={analysis.msgIndex} 
              className={`echo-card ${isSelected ? 'border-blue' : 'border-green'}`}
            >
              <div className={`triplet-item ${isSessionExpanded ? 'expanded' : ''} ${isSelected ? 'selected' : ''}`}>
                <div 
                  className="analysis-header"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSessionSelection(analysisIndex)}
                      style={{ marginRight: '12px', cursor: 'pointer' }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div
                      className="clickable"
                      onClick={() => toggleSessionExpansion(analysisIndex)}
                      style={{ cursor: 'pointer', flex: 1 }}
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
                  </div>
              </div>
              
              {isSessionExpanded && (
                <div className="analysis-themes">
              {analysis.themes.map((theme, themeIndex) => {
                const tripletId = `${analysisIndex}-${themeIndex}`
                const isExpanded = expandedTriplets.has(tripletId)
                const isSelected = selectedTriplets.has(tripletId)
                
                return (
                  <div 
                    key={`${analysis.msgIndex}-${themeIndex}`}
                    className={`echo-card ${isSelected ? 'border-blue' : 'border-green'}`}
                    onClick={() => toggleTripletSelection(analysisIndex, themeIndex)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={`triplet-item ${isExpanded ? 'expanded' : ''} ${isSelected ? 'selected' : ''}`}>
                      <div className="echo-header">
                        <p
                          className="triplet-text clickable"
                          onClick={(e) => {
                            e.stopPropagation() // Prevent triplet selection
                            toggleTripletExpansion(analysisIndex, themeIndex)
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
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PulseTab