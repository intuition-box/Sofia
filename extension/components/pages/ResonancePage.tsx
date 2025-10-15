import { useState } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { useIntuitionSearch } from '../../hooks/useIntuitionSearch'
import { useRecommendations } from '../../hooks/useRecommendations'
import logoIcon from '../../components/ui/icons/chatIcon.png'
import '../styles/Global.css'
import '../styles/CommonPage.css'
import '../styles/CoreComponents.css'

const ResonancePage = () => {
  const { navigateTo } = useRouter()
  const { isReady, searchAtoms } = useIntuitionSearch()
  const { recommendations, isLoading, generateRecommendations } = useRecommendations()
  const [searchQuery, setSearchQuery] = useState('')
  
  console.log('🏠 ResonancePage rendered')
  console.log('📋 Recommendations from hook:', recommendations.length, 'items')
  console.log('⏳ Loading state:', isLoading)

  // Flatten recommendations into bento grid items with categories
  const bentoItems = recommendations.flatMap((rec, recIndex) => 
    rec.suggestions.map((suggestion, sugIndex) => ({
      ...suggestion,
      category: rec.category,
      size: ['small', 'medium', 'large'][(recIndex + sugIndex) % 3] as 'small' | 'medium' | 'large'
    }))
  )

  const handleBentoClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }


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
        
        {/* Recommendations grid by theme */}
        {isLoading && (
          <div className="recommendations-section">
            <h2 className="recommendations-title">Generating Personalized Recommendations...</h2>
            <div className="loading-indicator">Analyzing your wallet activity...</div>
          </div>
        )}
        
        {!isLoading && bentoItems.length > 0 && (
          <div className="recommendations-section">
            <button
              onClick={() => generateRecommendations(true, true)}
              disabled={isLoading}
              className="btn"
              style={{ marginBottom: '16px' }}
            >
              {isLoading ? '⏳ Generating...' : 'Get More'}
            </button>
            <div className="bento-grid">
              {bentoItems.map((item, index) => (
                <div 
                  key={index} 
                  className={`bento-card bento-${item.size}`}
                  onClick={() => handleBentoClick(item.url)}
                >
                  <h3 className="bento-title">{item.name}</h3>
                  <p className="bento-category">{item.category}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


export default ResonancePage