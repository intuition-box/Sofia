import { useState, useEffect } from 'react'
import { useRecommendations } from '../../hooks/useRecommendations'
import { useResonanceService } from '../../hooks/useResonanceService'
import { GlobalResonanceService } from '../../lib/services/GlobalResonanceService'
import { useStorage } from "@plasmohq/storage/hook"
import logoIcon from '../../components/ui/icons/chatIcon.png'
import '../styles/Global.css'
import '../styles/CommonPage.css'
import '../styles/CoreComponents.css'

const ResonancePage = () => {
  const { recommendations, isLoading, generateRecommendations } = useRecommendations()
  const [searchQuery, setSearchQuery] = useState('')
  const [account] = useStorage<string>("metamask-account")
  const [isAdditive, setIsAdditive] = useState(false)
  
  console.log('🏠 ResonancePage rendered')
  console.log('📋 Recommendations from hook:', recommendations.length, 'items')
  console.log('⏳ Loading state:', isLoading)

  // Passive observer of service state
  const { validItems, isLoading: isLoadingPreviews, error: previewError } = useResonanceService()
  
  // Filter validItems based on search query
  const filteredValidItems = validItems.filter(item => 
    searchQuery.trim() === '' || 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Initialize service for current wallet
  useEffect(() => {
    if (account) {
      const service = GlobalResonanceService.getInstance()
      service.initializeForWallet(account)
    }
  }, [account])

  // Update service when we have recommendations (first time OR additive mode)
  useEffect(() => {
    if (recommendations.length > 0 && account && (validItems.length === 0 || isAdditive)) {
      const mode = validItems.length === 0 ? 'initial load' : 'additive mode'
      console.log('🔄 [ResonancePage] Processing recommendations -', mode)
      const service = GlobalResonanceService.getInstance()
      service.updateRecommendations(recommendations, isAdditive)
      
      // Reset additive flag after processing
      if (isAdditive) {
        setIsAdditive(false)
      }
    }
  }, [recommendations, account, validItems.length, isAdditive])

  const handleBentoClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }



  return (
    <div className="triples-container">
      <div className="search-content">
        <div className="search-input-container">
          <img src={logoIcon} alt="Sofia" className="search-logo" />
          <input
            type="text"
            placeholder="Search ..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
              onClick={() => {
                setIsAdditive(true)
                generateRecommendations(true, true)
              }}
              disabled={isLoading || isLoadingPreviews}
              className="btn"
              style={{ marginBottom: '16px' }}
            >
              {isLoading ? 'Generating...' : isLoadingPreviews ? 'Loading ...' : 'Get More'}
            </button>
            
            {isLoading && validItems.length > 0 && (
              <div className="loading-indicator">Analyzing your wallet activity...</div>
            )}
            {previewError && (
              <div className="error-state">{previewError}</div>
            )}
            
            {filteredValidItems.length > 0 && (
              <div className="bento-grid">
                {filteredValidItems.map((item, index) => (
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
            
            {!isLoadingPreviews && filteredValidItems.length === 0 && validItems.length > 0 && (
              <div className="error-state">No recommendations match your search</div>
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