import { useState, useEffect, useMemo } from 'react'
import { useStorage } from "@plasmohq/storage/hook"
import { elizaDataService } from '../../../lib/database/indexedDB-methods'
import { useEchoPublishing } from '../../../hooks/useEchoPublishing'
import WeightModal from '../../modals/WeightModal'
import type { EchoTriplet } from '../../../types/blockchain'
import '../../styles/CoreComponents.css'
import '../../styles/CorePage.css'


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
  messageId: number // ID réel du message (number)
  timestamp: number
  themes: PulseTheme[]
}

const PulseTab = () => {
  const [address] = useStorage<string>("metamask-account")
  const [pulseAnalyses, setPulseAnalyses] = useState<PulseAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(new Set())
  const [expandedTriplets, setExpandedTriplets] = useState<Set<string>>(new Set())
  const [selectedSessions, setSelectedSessions] = useState<Set<number>>(new Set())
  const [selectedTriplets, setSelectedTriplets] = useState<Set<string>>(new Set()) // Format: "sessionIndex-tripletIndex"
  
  // Modal state for custom weighting
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [selectedTripletsForWeighting, setSelectedTripletsForWeighting] = useState<EchoTriplet[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [transactionSuccess, setTransactionSuccess] = useState(false)
  const [transactionError, setTransactionError] = useState<string | null>(null)

  // Create EchoTriplets from selected pulse triplets for publishing
  const createEchoTripletsFromSelection = (): EchoTriplet[] => {
    if (selectedTriplets.size === 0 || pulseAnalyses.length === 0) {
      return []
    }
    
    const echoTriplets: EchoTriplet[] = []
    
    selectedTriplets.forEach(tripletId => {
      const [sessionIndexStr, tripletIndexStr] = tripletId.split('-')
      const sessionIndex = parseInt(sessionIndexStr)
      const tripletIndex = parseInt(tripletIndexStr)
      
      const analysis = pulseAnalyses[sessionIndex]
      if (!analysis || !analysis.themes) return
      
      const theme = analysis.themes[tripletIndex]
      if (!theme) return
      
      const echoTriplet: EchoTriplet = {
        id: `pulse_${tripletId}`,
        triplet: {
          subject: 'I',
          predicate: theme.predicate,
          object: theme.object
        },
        url: theme.urls?.[0] || '',
        description: theme.name,
        timestamp: analysis.timestamp,
        sourceMessageId: analysis.messageId.toString(),
        status: 'available'
      }
      echoTriplets.push(echoTriplet)
    })
    
    return echoTriplets
  }

  // Dynamic EchoTriplets and selection for the hook
  const pulseEchoTriplets = createEchoTripletsFromSelection()
  const pulseSelectedEchoes = new Set(pulseEchoTriplets.map(t => t.id))

  // Publishing hook with real EchoTriplets - same as EchoesTab
  const {
    publishSelected
  } = useEchoPublishing({
    echoTriplets: pulseEchoTriplets,
    selectedEchoes: pulseSelectedEchoes,
    address: address || '',
    onTripletsUpdate: () => {},
    clearSelection: () => setSelectedTriplets(new Set())
  })

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


  // Handle Amplify button click - opens modal for weight selection
  const handleAmplifyClick = () => {
    if (selectedTriplets.size > 0) {
      setSelectedTripletsForWeighting(pulseEchoTriplets)
      setShowWeightModal(true)
    }
  }

  // Handle modal weight submission - exact same logic as EchoesTab
  const handleWeightSubmit = async (customWeights?: (bigint | null)[]) => {
    if (selectedTripletsForWeighting.length === 0) return
    
    try {
      setIsCreating(true)
      setTransactionError(null)
      setTransactionSuccess(false)
      
      // Use publishSelected with custom weights - same as EchoesTab
      await publishSelected(customWeights)
      
      setTransactionSuccess(true)
    } catch (error) {
      console.error('Failed to publish triplets with custom weights:', error)
      setTransactionError(error instanceof Error ? error.message : 'Failed to publish')
    } finally {
      setIsCreating(false)
    }
  }

  // Handle modal close - exact same logic as EchoesTab
  const handleWeightModalClose = () => {
    setShowWeightModal(false)
    setSelectedTripletsForWeighting([])
    setTransactionError(null)
    setTransactionSuccess(false)
    // Clear selection using the hook's clearSelection (same as EchoesTab)
    setSelectedTriplets(new Set())
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
              <span onClick={toggleSelectAllTriplets} className="cursor-pointer">
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
              <span className="cursor-default">
                {selectedTriplets.size} triplets selected for publishing
              </span>
            </label>
          </div>
          
          <div className="batch-actions">
            <button 
              className="batch-btn add-to-signals"
              onClick={handleAmplifyClick}
              disabled={isCreating}
            >
              Amplify ({selectedTriplets.size})
            </button>
            <button 
              className="batch-btn bg-gray-600"
              onClick={() => setSelectedTriplets(new Set())}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Button to select all sessions when none selected */}
      {selectedSessions.size === 0 && pulseAnalyses.length > 0 && (
        <div className={`selection-panel ${selectedTriplets.size > 0 ? 'margin-top-conditional' : 'margin-top-none'}`}>
          <div className="selection-info">
            <label className="select-all-label">
              <span onClick={toggleSelectAllSessions} className="cursor-pointer">
                Select All Sessions for Deletion
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Panel for session selection and deletion */}
      {selectedSessions.size > 0 && (
        <div className={`selection-panel ${selectedTriplets.size > 0 ? 'margin-top-conditional' : 'margin-top-none'}`}>
          <div className="selection-info">
            <label className="select-all-label">
              <span className="cursor-default">
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
              className="batch-btn bg-gray-600"
              onClick={() => setSelectedSessions(new Set())}
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
              className={`echo-card ${isSelected ? 'border-blue' : 'border-default'}`}
            >
              <div className={`triplet-item ${isSessionExpanded ? 'expanded' : ''} ${isSelected ? 'selected' : ''}`}>
                <div className="analysis-header flex-space-between">
                  <div className="analysis-session-content">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSessionSelection(analysisIndex)}
                      className="session-checkbox"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div
                      className="clickable"
                      onClick={() => toggleSessionExpansion(analysisIndex)}
                      className="session-expand-content"
                    >
                      <h4>
                        <span className="session-arrow">
                          {isSessionExpanded ? '▼' : '▶'}
                        </span>
                        Research Session #{analysisIndex + 1}
                      </h4>
                      <div className="analysis-meta">
                        <span className="analysis-time">{formatTimestamp(analysis.timestamp)}</span>
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
                    className={`echo-card triplet-card-pointer ${isSelected ? 'border-blue' : 'border-default'}`}
                    onClick={() => toggleTripletSelection(analysisIndex, themeIndex)}
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
                          <span className="subject">I</span>{' '}
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

      {/* Weight Selection Modal */}
      <WeightModal
        isOpen={showWeightModal}
        triplets={selectedTripletsForWeighting}
        isProcessing={isCreating}
        transactionSuccess={transactionSuccess}
        transactionError={transactionError}
        onClose={handleWeightModalClose}
        onSubmit={handleWeightSubmit}
      />
    </div>
  )
}

export default PulseTab