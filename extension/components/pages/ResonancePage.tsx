import { useState, useEffect, Suspense, lazy } from 'react'
import { useRecommendations } from '../../hooks/useRecommendations'
import { useResonanceService } from '../../hooks/useResonanceService'
import { GlobalResonanceService } from '../../lib/services/GlobalResonanceService'
import { useWalletFromStorage } from '../../hooks/useWalletFromStorage'
import logoIcon from '../../components/ui/icons/chatIcon.png'
import SofiaLoader from '../ui/SofiaLoader'
import '../styles/Global.css'
import '../styles/CommonPage.css'
import '../styles/CoreComponents.css'

// Lazy load CircleFeedTab (required by Parcel bundler)
const CircleFeedTab = lazy(() => import('./resonance-tabs/CircleFeedTab'))

type ResonanceTab = 'For You' | 'Circle'

const ResonancePage = () => {
  const [activeTab, setActiveTab] = useState<ResonanceTab>('For You')
  const { recommendations, isLoading, generateRecommendations } = useRecommendations()
  const [searchQuery, setSearchQuery] = useState('')
  const { walletAddress: account } = useWalletFromStorage()
  const [isAdditive, setIsAdditive] = useState(false)

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
      const service = GlobalResonanceService.getInstance()
      service.updateRecommendations(recommendations, isAdditive)

      if (isAdditive) {
        setIsAdditive(false)
      }
    }
  }, [recommendations, account, validItems.length, isAdditive])

  const handleBentoClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="page">
      <div className="tabs">
        {(['For You', 'Circle'] as ResonanceTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="page-content">
        <Suspense fallback={<div className="loading-state">Loading...</div>}>
          {/* For You tab */}
          {activeTab === 'For You' && (
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

              {isLoading && validItems.length === 0 && (
                <div className="recommendations-section">
                  <div className="loading-indicator">
                    <SofiaLoader size={150} />
                  </div>
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
                    <div className="loading-indicator">
                      <SofiaLoader size={60} />
                    </div>
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
          )}

          {/* Circle tab */}
          {activeTab === 'Circle' && <CircleFeedTab />}
        </Suspense>
      </div>
    </div>
  )
}

export default ResonancePage
