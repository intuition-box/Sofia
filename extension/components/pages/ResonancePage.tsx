import { useState } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { useIntuitionSearch } from '../../hooks/useIntuitionSearch'
import { useRecommendations } from '../../hooks/useRecommendations'
import { parseRecommendations } from '../../lib/utils/recommendationParser'
import logoIcon from '../../components/ui/icons/chatIcon.png'
import '../styles/Global.css'
import '../styles/CommonPage.css'
import '../styles/CoreComponents.css'

const ResonancePage = () => {
  const { navigateTo } = useRouter()
  const { isReady, searchAtoms } = useIntuitionSearch()
  const { rawResponse } = useRecommendations()
  const [searchQuery, setSearchQuery] = useState('')
  
  console.log('🏠 ResonancePage rendered')
  console.log('📱 rawResponse from hook:', rawResponse?.length ? `${rawResponse.length} chars` : 'null/empty')
  
  // Parse les recommandations depuis la réponse brute
  const recommendations = rawResponse ? parseRecommendations(rawResponse) : []
  console.log('📋 Parsed recommendations:', recommendations.length, 'items')


  const handleSearch = async () => {
    if (searchQuery.trim() && isReady) {
      try {
        const results = await searchAtoms(searchQuery.trim())
        localStorage.setItem('searchQuery', searchQuery.trim())
        localStorage.setItem('searchResults', JSON.stringify(results))
        navigateTo('search-result')
      } catch (error) {
        console.error('Search failed:', error)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="triples-container">
      <div className="search-content">
        <div className="search-input-container">
          <img src={logoIcon} alt="Sofia" className="search-logo" />
          <input
            type="text"
            placeholder="Search atoms in Intuition blockchain..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        
        {/* Grille de recommandations par thème */}
        {recommendations.length > 0 && (
          <div className="recommendations-section">
            <h2 className="recommendations-title">🎯 Recommandations Personnalisées</h2>
            <div className="recommendations-grid">
              {recommendations.map((rec, index) => (
                <div key={index} className="recommendation-card">
                  <h3 className="recommendation-category">{rec.category}</h3>
                  <p className="recommendation-reason">{rec.reason}</p>
                  <div className="suggestions-list">
                    {rec.suggestions.map((suggestion, sugIndex) => (
                      <a 
                        key={sugIndex}
                        href={suggestion.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="suggestion-link"
                      >
                        🔗 {suggestion.name}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="empty-state">
          <p> Search Intuition Network</p>
          <p className="empty-subtext">
            Enter a search term above to find atoms and triplets on the Intuition blockchain
          </p>
        </div>
        
      </div>
    </div>
  )
}


export default ResonancePage