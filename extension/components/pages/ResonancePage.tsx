import { useState } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { useIntuitionSearch } from '../../hooks/useIntuitionSearch'
import { useRecommendations } from '../../hooks/useRecommendations'
import { usePreviewImages } from '../../hooks/usePreviewImages'
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

  // Flatten recommendations into bento grid items with smart size distribution
  const bentoItems = recommendations.flatMap((rec, recIndex) => 
    rec.suggestions.map((suggestion, sugIndex) => {
      const totalIndex = recIndex * 10 + sugIndex
      
      // Smart size distribution: 50% small, 30% medium, 20% large
      let size: 'small' | 'medium' | 'large'
      const rand = totalIndex % 10
      if (rand < 5) size = 'small'
      else if (rand < 8) size = 'medium'
      else size = 'large'
      
      return {
        ...suggestion,
        category: rec.category,
        size
      }
    })
  )

  // Use hook to get filtered items with og:images
  const { validItems, isLoading: isLoadingPreviews, error: previewError } = usePreviewImages(bentoItems)

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
        
        {!isLoading && recommendations.length > 0 && (
          <div className="recommendations-section">
            <button
              onClick={() => generateRecommendations(true, true)}
              disabled={isLoading || isLoadingPreviews}
              className="btn"
              style={{ marginBottom: '16px' }}
            >
              {isLoading ? '⏳ Generating...' : isLoadingPreviews ? '🖼️ Loading images...' : 'Get More'}
            </button>
            
            {isLoadingPreviews && (
              <div className="loading-indicator">Loading preview images...</div>
            )}
            
            {previewError && (
              <div className="error-state">{previewError}</div>
            )}
            
            {!isLoadingPreviews && validItems.length > 0 && (
              <div className="bento-grid">
                {validItems.map((item, index) => (
                  <div 
                    key={index} 
                    className={`bento-card bento-${item.size}`}
                    onClick={() => handleBentoClick(item.url)}
                  >
                    <div className="bento-image-container">
                      <img 
                        src={item.ogImage} 
                        alt={item.name}
                        className="bento-image"
                        loading="lazy"
                      />
                    </div>
                    <div className="bento-content">
                      <h3 className="bento-title">{item.name}</h3>
                      <p className="bento-category">{item.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {!isLoadingPreviews && validItems.length === 0 && bentoItems.length > 0 && (
              <div className="error-state">No valid sites found with preview images</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


export default ResonancePage