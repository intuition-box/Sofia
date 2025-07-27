import { useState, useEffect } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { useMCPClient, type SearchResult } from '../../hooks/useMCPClient'
import SendIcon from '../ui/icons/quick_action/Selected=send.svg'
import SendHoverIcon from '../ui/icons/quick_action/Selected=send hover.svg'
import VoteIcon from '../ui/icons/quick_action/Selected=vote.svg'
import VoteHoverIcon from '../ui/icons/quick_action/Selected=vote hover.svg'
import PersonIcon from '../../assets/Icon=person.svg'
import VoteIconSvg from '../../assets/Icon=vote.svg'
import '../styles/Global.css'
import '../styles/CommonPage.css'
import '../styles/SearchResultPage.css'

interface SearchResultPageProps {
  searchQuery?: string
}

const SearchResultPage = ({ searchQuery: propQuery }: SearchResultPageProps) => {
  const { navigateTo } = useRouter()
  const { searchAtoms, isLoading, error } = useMCPClient()
  const [activeTab, setActiveTab] = useState<'overview' | 'related' | 'about' | 'more'>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [sendHovered, setSendHovered] = useState(false)
  const [voteHovered, setVoteHovered] = useState(false)
  const [isEditingSearch, setIsEditingSearch] = useState(false)
  const [editedQuery, setEditedQuery] = useState('')

  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B'
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toLocaleString()
  }

  const getTripleMetrics = (result: SearchResult) => {
    // Utiliser les triples disponibles et leurs positions
    let totalPositions = 0
    let againstCount = 0
    let forCount = 0
    let opinionCount = 0

    // Compter les positions de tous les triples
    result.relatedTriples.forEach(triple => {
      const positions = triple.vault?.position_count || triple.counter_vault?.position_count || 0
      totalPositions += positions

      const label = triple.predicate?.label?.toLowerCase() || ''
      
      // Catégoriser selon le prédicat
      if (label.includes('against') || label.includes('disagree') || label.includes('oppose') || label.includes('dislike')) {
        againstCount += positions
      } else if (label.includes('support') || label.includes('agree') || label.includes('like') || label.includes('endorse')) {
        forCount += positions
      } else {
        opinionCount += positions
      }
    })

    // Si pas de données spécifiques, utiliser des estimations basées sur les attestations
    if (totalPositions === 0) {
      const baseCount = Math.max(result.attestations, 100)
      return {
        against: Math.floor(baseCount * 0.15),
        opinion: Math.floor(baseCount * 0.70), 
        forCount: Math.floor(baseCount * 0.15)
      }
    }

    return {
      against: againstCount,
      opinion: opinionCount,
      forCount: forCount
    }
  }

  const sortedResults = results.sort((a, b) => b.attestations - a.attestations)
  const topResults = activeTab === 'more' ? sortedResults : sortedResults.slice(0, 3)

  const performSearch = async (query: string) => {
    try {
      const searchResults = await searchAtoms(query)
      setResults(searchResults)
    } catch (err) {
      console.error('Search failed:', err)
      setResults([])
    }
  }

  const handleSearchEdit = () => {
    setEditedQuery(searchQuery)
    setIsEditingSearch(true)
  }

  const handleSearchSave = () => {
    if (editedQuery.trim() && editedQuery.trim() !== searchQuery) {
      setSearchQuery(editedQuery.trim())
      localStorage.setItem('searchQuery', editedQuery.trim())
      performSearch(editedQuery.trim())
    }
    setIsEditingSearch(false)
  }

  const handleSearchCancel = () => {
    setEditedQuery(searchQuery)
    setIsEditingSearch(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSave()
    } else if (e.key === 'Escape') {
      handleSearchCancel()
    }
  }

  useEffect(() => {
    const query = propQuery || localStorage.getItem('searchQuery') || 'Intuition Systems'
    setSearchQuery(query)
    performSearch(query)
  }, [propQuery, searchAtoms])

  return (
    <div className="page search-result-page">
      {/* Header avec recherche et close */}
      <div className="search-result-header">
        <div className="search-header-bar">
          {isEditingSearch ? (
            <div className="search-edit-container">
              <input
                type="text"
                value={editedQuery}
                onChange={(e) => setEditedQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="search-edit-input"
                placeholder="Search in Intuition blockchain..."
                autoFocus
              />
              <div className="search-edit-actions">
                <button onClick={handleSearchSave} className="save-search-btn">✓</button>
                <button onClick={handleSearchCancel} className="cancel-search-btn">✕</button>
              </div>
            </div>
          ) : (
            <div className="search-display-container">
              <span className="search-query" onClick={handleSearchEdit}>{searchQuery}</span>
              <button onClick={handleSearchEdit} className="edit-search-btn">✏️</button>
            </div>
          )}
          <button 
            onClick={() => navigateTo('search')}
            className="close-button"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="search-result-content">
        {/* Titre principal */}
        <div className="main-title-section">
          <h1 className="main-title">{results[0]?.label || searchQuery}</h1>
          <div className="action-buttons">
            <button 
              onMouseEnter={() => setSendHovered(true)}
              onMouseLeave={() => setSendHovered(false)}
              style={{background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '100px', height: 'auto'}}
            >
              <img src={sendHovered ? SendHoverIcon : SendIcon} alt="Send" style={{width: '100%', height: 'auto'}} />
            </button>
            <button 
              onMouseEnter={() => setVoteHovered(true)}
              onMouseLeave={() => setVoteHovered(false)}
              style={{background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '100px', height: 'auto'}}
            >
              <img src={voteHovered ? VoteHoverIcon : VoteIcon} alt="Vote" style={{width: '100%', height: 'auto'}} />
            </button>
          </div>
        </div>

        {/* État de chargement */}
        {isLoading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Searching blockchain...</p>
          </div>
        )}

        {/* État d'erreur */}
        {error && (
          <div className="error-state">
            <p>Search failed: {error}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}

        {/* Liste des résultats */}
        {!isLoading && !error && activeTab !== 'more' && (
          <div className="results-list">
            {topResults.map((result, index) => (
              <div key={result.id || index} className="result-card">
                <div className="result-header">
                  <span className="attestations-count">{formatNumber(result.attestations)} attestations</span>
                  <span className="stake-amount">💎 {formatNumber(result.stake)}</span>
                  <span className="status-badge true">True</span>
                </div>
                
                <div className="result-body">
                  {result.description && (
                    <div className="result-description">
                      <p>{result.description}</p>
                    </div>
                  )}
                  
                  {result.url && (
                    <div className="result-url">
                      <span className="url-icon">🔗</span>
                      <a href={result.url} target="_blank" rel="noopener noreferrer" className="url-link">
                        {result.url}
                      </a>
                    </div>
                  )}
                  
                  {result.email && (
                    <div className="result-email">
                      <span className="email-icon">📧</span>
                      <span>{result.email}</span>
                    </div>
                  )}
                  
                  <div className="auditor-section">
                    <div className="auditor-info">
                    <div className="audit-details">
                      <span>audited by</span>
                      <img src={PersonIcon} alt="Person" className="auditor-icon" />
                      <span className="auditor-name">{result.auditedBy || 'Expert_Luvr'}</span>
                    </div>
                    </div>
                  </div>
                  {result.consensys && (
                    <div className="consensys-badge">
                      <span className="consensys-icon">C</span>
                      <span>{result.consensys}</span>
                    </div>
                  )}
                </div>

                <div className="result-footer">
                  <div className="metrics">
                    {(() => {
                      const metrics = getTripleMetrics(result)
                      return (
                        <>
                          <span className="metric red">●Against: {formatNumber(metrics.against)}</span>
                          <span className="metric">OPINION: {formatNumber(metrics.opinion)}</span>
                          <span className="metric green">●For: {formatNumber(metrics.forCount)}</span>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation tabs */}
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'related' ? 'active' : ''}`}
            onClick={() => setActiveTab('related')}
          >
            Related to
          </button>
          <button 
            className={`tab-button ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
          <button 
            className={`tab-button ${activeTab === 'more' ? 'active' : ''}`}
            onClick={() => setActiveTab('more')}
          >
            More
          </button>
        </div>

        {/* Contenu des tabs */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-content">
              {topResults.length > 0 && (
                <>
                  {topResults[0].url && (
                    <div className="info-item">
                      <span className="info-icon">📍</span>
                      <a href={topResults[0].url} target="_blank" rel="noopener noreferrer" className="info-text">
                        {topResults[0].url}
                      </a>
                    </div>
                  )}
                  
                  {topResults[0].description && (
                    <div className="info-item">
                      <span className="info-icon">📝</span>
                      <span className="info-text">{topResults[0].description}</span>
                    </div>
                  )}
                  
                  {topResults[0].email && (
                    <div className="info-item">
                      <span className="info-icon">📧</span>
                      <span className="info-text">{topResults[0].email}</span>
                    </div>
                  )}
                  
                  <div className="info-item">
                    <img src={VoteIconSvg} alt="Vote" className="info-icon" />
                    <span className="info-text">Vote on this signal</span>
                    <span className="info-subtext">
                      {formatNumber(topResults[0].attestations)} attestations
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
          {activeTab === 'related' && (
            <div className="related-content">
              {topResults.length > 0 && topResults[0].relatedTriples.length > 0 ? (
                <div className="related-triples">
                  <h3>Related connections:</h3>
                  {topResults[0].relatedTriples.map((triple, index) => (
                    <div key={index} className="triple-item">
                      <div className="triple-predicate">
                        {triple.predicate?.emoji && <span className="predicate-emoji">{triple.predicate.emoji}</span>}
                        <span className="predicate-label">{triple.predicate?.label}</span>
                      </div>
                      <div className="triple-object">
                        {triple.object?.emoji && <span className="object-emoji">{triple.object.emoji}</span>}
                        <span className="object-label">{triple.object?.label}</span>
                        {triple.vault?.position_count && (
                          <span className="triple-positions">
                            ({formatNumber(triple.vault.position_count)} positions)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No related connections found</p>
              )}
            </div>
          )}
          {activeTab === 'about' && (
            <div className="about-content">
              {topResults.length > 0 && (
                <div className="about-details">
                  <h3>About {topResults[0].name || topResults[0].label}</h3>
                  
                  <div className="about-info">
                    <div className="info-row">
                      <span className="info-label">Type:</span>
                      <span className="info-value">{topResults[0].type}</span>
                    </div>
                    
                    <div className="info-row">
                      <span className="info-label">ID:</span>
                      <span className="info-value">{topResults[0].id}</span>
                    </div>
                    
                    {topResults[0].identifier && (
                      <div className="info-row">
                        <span className="info-label">Identifier:</span>
                        <span className="info-value">{topResults[0].identifier}</span>
                      </div>
                    )}
                    
                    <div className="info-row">
                      <span className="info-label">Attestations:</span>
                      <span className="info-value">{formatNumber(topResults[0].attestations)}</span>
                    </div>
                    
                    <div className="info-row">
                      <span className="info-label">Stake:</span>
                      <span className="info-value">{formatNumber(topResults[0].stake)}</span>
                    </div>
                    
                    {topResults[0].auditedBy && (
                      <div className="info-row">
                        <span className="info-label">Audited by:</span>
                        <span className="info-value">{topResults[0].auditedBy}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'more' && (
            <div className="more-content">
              <div className="results-list">
                {sortedResults.map((result, index) => (
                  <div key={result.id || index} className="result-card">
                    <div className="result-header">
                      <span className="attestations-count">{formatNumber(result.attestations)} attestations</span>
                      <span className="stake-amount">💎 {formatNumber(result.stake)}</span>
                      <span className="status-badge true">True</span>
                    </div>
                    
                    <div className="result-body">
                      {result.description && (
                        <div className="result-description">
                          <p>{result.description}</p>
                        </div>
                      )}
                      
                      {result.url && (
                        <div className="result-url">
                          <span className="url-icon">🔗</span>
                          <a href={result.url} target="_blank" rel="noopener noreferrer" className="url-link">
                            {result.url}
                          </a>
                        </div>
                      )}
                      
                      {result.email && (
                        <div className="result-email">
                          <span className="email-icon">📧</span>
                          <span>{result.email}</span>
                        </div>
                      )}
                      
                      <div className="auditor-section">
                        <div className="auditor-info">
                          <img src={PersonIcon} alt="Person" className="auditor-icon" />
                          <span className="auditor-name">{result.auditedBy || 'Expert_Luvr'}</span>
                        </div>
                        <div className="audit-details">
                          <span>audited by</span>
                        </div>
                      </div>
                      {result.consensys && (
                        <div className="consensys-badge">
                          <span className="consensys-icon">C</span>
                          <span>{result.consensys}</span>
                        </div>
                      )}
                    </div>

                    <div className="result-footer">
                      <div className="metrics">
                        {(() => {
                          const metrics = getTripleMetrics(result)
                          return (
                            <>
                              <span className="metric red">●Against: {formatNumber(metrics.against)}</span>
                              <span className="metric">OPINION: {formatNumber(metrics.opinion)}</span>
                              <span className="metric green">●For: {formatNumber(metrics.forCount)}</span>
                            </>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchResultPage