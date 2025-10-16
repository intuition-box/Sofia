import { useState, useEffect } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { useIntuitionSearch } from '../../hooks/useIntuitionSearch'
import { useRecommendations } from '../../hooks/useRecommendations'
import { useResonanceService } from '../../hooks/useResonanceService'
import { GlobalResonanceService } from '../../lib/services/GlobalResonanceService'
import { useStorage } from "@plasmohq/storage/hook"
import logoIcon from '../../components/ui/icons/chatIcon.png'
import '../styles/Global.css'
import '../styles/CommonPage.css'
import '../styles/CoreComponents.css'

const ResonancePage = () => {
  const { navigateTo } = useRouter()
  const { isReady, searchAtoms } = useIntuitionSearch()
  const { recommendations, isLoading, generateRecommendations } = useRecommendations()
  const [searchQuery, setSearchQuery] = useState('')
  const [account] = useStorage<string>("metamask-account")
  
  console.log('🏠 ResonancePage rendered')
  console.log('📋 Recommendations from hook:', recommendations.length, 'items')
  console.log('⏳ Loading state:', isLoading)

  // Passive observer of service state
  const { validItems, isLoading: isLoadingPreviews, error: previewError } = useResonanceService()

  // Initialize service for current wallet
  useEffect(() => {
    if (account) {
      const service = GlobalResonanceService.getInstance()
      service.initializeForWallet(account)
    }
  }, [account])

  // Update service only when we have recommendations but no validItems yet
  useEffect(() => {
    if (recommendations.length > 0 && account && validItems.length === 0) {
      console.log('🔄 [ResonancePage] Processing recommendations - no validItems cached yet')
      const service = GlobalResonanceService.getInstance()
      service.updateRecommendations(recommendations)
    }
  }, [recommendations, account, validItems.length])

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
        {isLoading && validItems.length === 0 && (
          <div className="recommendations-section">
            <div className="loading-indicator">Analyzing your wallet activity...</div>
          </div>
        )}
        
        {(recommendations.length > 0 || validItems.length > 0) && (
          <div className="recommendations-section">
            <button
              onClick={() => generateRecommendations(true, true)}
              disabled={isLoading || isLoadingPreviews}
              className="btn"
              style={{ marginBottom: '16px' }}
            >
              {isLoading ? 'Generating...' : isLoadingPreviews ? 'Loading ...' : 'Get More'}
            </button>
            
            {isLoading && validItems.length > 0 && (
              <div className="loading-indicator">Analyzing your wallet activity...</div>
            )}
            
            {isLoadingPreviews && (
              <div className="loading-indicator">Loading preview images...</div>
            )}
            
            {previewError && (
              <div className="error-state">{previewError}</div>
            )}
            
            {validItems.length > 0 && (
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
            
            {!isLoadingPreviews && validItems.length === 0 && recommendations.length > 0 && (
              <div className="error-state">No valid sites found with preview images</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


export default ResonancePage