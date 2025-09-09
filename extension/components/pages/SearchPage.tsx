import { useState } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { useIntuitionSearch } from '../../hooks/useIntuitionSearch'
import { useHighValueTriplets } from '../../hooks/useHighValueTriplets'
import QuickActionButton from '../ui/QuickActionButton'
import homeIcon from '../../assets/Icon=home.svg'
import '../styles/Global.css'
import '../styles/CommonPage.css'

const SearchPage = () => {
  const { navigateTo } = useRouter()
  const { isReady, isLoading, error } = useIntuitionSearch()
  const { triplets: highValueTriplets, isLoading: tripletsLoading, error: tripletsError } = useHighValueTriplets()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedTriplet, setExpandedTriplet] = useState<{ tripletId: string } | null>(null)

  // Format wallet address
  const formatWalletAddress = (address: string) => {
    if (!address || address.length < 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Format numbers for display
  const formatNumber = (num: number) => {
    if (num === 0) return '0'
    if (num >= 1000000000) {
      const formatted = (num / 1000000000).toFixed(1)
      return formatted.endsWith('.0') ? formatted.slice(0, -2) + 'B' : formatted + 'B'
    }
    if (num >= 1000000) {
      const formatted = (num / 1000000).toFixed(1)
      return formatted.endsWith('.0') ? formatted.slice(0, -2) + 'M' : formatted + 'M'
    }
    if (num >= 1000) {
      const formatted = (num / 1000).toFixed(1)
      return formatted.endsWith('.0') ? formatted.slice(0, -2) + 'K' : formatted + 'K'
    }
    return num.toLocaleString()
  }

  // Handle viewing on explorer
  const handleViewOnExplorer = (txHash: string) => {
    window.open(`https://testnet.explorer.intuition.systems/tx/${txHash}`, '_blank')
  }

  const handleSearch = () => {
    if (searchQuery.trim() && isReady) {
      localStorage.setItem('searchQuery', searchQuery.trim())
      navigateTo('search-result')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="triples-container">
      <div className="search-header">
        <button 
          onClick={() => navigateTo('home-connected')}
          className="back-button"
        >
          <img src={homeIcon} alt="Home" className="home-icon" />
        </button>
        <h2>Search Intuition Network</h2>
      </div>

      <div className="search-content">
        <div className="search-input-container">
          <input
            type="text"
            placeholder="Search atoms in Intuition blockchain..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="search-hint">
            Press Enter to search • {isReady ? 'Ready' : 'Initializing...'}
          </div>
        </div>
        
        {error && (
          <div className="empty-state">
            <p>❌ Connection Error</p>
            <p className="empty-subtext">
              {error}
            </p>
            <button onClick={() => window.location.reload()} className="retry-button">
              Retry Connection
            </button>
          </div>
        )}

        {isLoading && (
          <div className="empty-state">
            <p> Initializing search...</p>
            <p className="empty-subtext">
              Connecting to Intuition blockchain API
            </p>
          </div>
        )}

        {/* High-value triplets section */}
        <div className="trending-section">
          <h3 className="section-title">Trending Claims</h3>
          
          {tripletsLoading && (
            <div className="empty-state">
              <p>Loading trending triplets...</p>
              <p className="empty-subtext">
                Fetching high-value triplets from Intuition blockchain
              </p>
            </div>
          )}

          {tripletsError && (
            <div className="empty-state">
              <p>❌ Error loading trending triplets</p>
              <p className="empty-subtext">
                {tripletsError}
              </p>
            </div>
          )}

          {!tripletsLoading && !tripletsError && highValueTriplets.length > 0 && (
            highValueTriplets.map((tripletItem) => {
              const isExpanded = expandedTriplet?.tripletId === tripletItem.id

              return (
                <div key={tripletItem.id} className="echo-card border-blue">
                  <div className={`triplet-item ${isExpanded ? 'expanded' : ''}`}>
                    
                    <div className="triplet-header">
                      {/* Triplet text */}
                      <p className="triplet-text clickable" onClick={() => {
                        setExpandedTriplet(isExpanded ? null : { tripletId: tripletItem.id })
                      }}>
                        <span className="subject">
                          {tripletItem.subjectData.label.startsWith('0x') 
                            ? formatWalletAddress(tripletItem.subjectData.label) 
                            : tripletItem.subjectData.label}
                        </span>
                        <span className="action">{tripletItem.triplet.predicate}</span>
                        <span className="object">
                          {tripletItem.objectData.label.startsWith('0x')
                            ? formatWalletAddress(tripletItem.objectData.label)
                            : tripletItem.objectData.label}
                        </span>
                      </p>

                      {/* Support Market Cap metrics */}
                    </div>
                      <div className="sentiment-metrics" style={{marginTop: '8px', marginBottom: '4px'}}>
                        {tripletItem.totalSupportMarketCap > 0 && (
                          <span className="sentiment-metric market-cap" style={{
                            backgroundColor: '#434343ff',
                            color: '#ffffffff',
                            padding: '2px 6px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '500',
                            marginRight: '4px'
                          }}>
                            {formatNumber(tripletItem.totalSupportMarketCap)} TTRUST Mkt Cap
                          </span>
                        )}
                        {tripletItem.totalUsers > 0 && (
                          <span className="sentiment-metric users" style={{
                            backgroundColor: '#ffffffff',
                            color: '#000000ff',
                            padding: '2px 6px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '500'
                          }}>
                            {tripletItem.totalUsers} users
                          </span>
                        )}
                        {tripletItem.supportRatio > 0 && (
                          <span className="sentiment-metric ratio" style={{
                            backgroundColor: '#ffffffff',
                            color: '#000000ff',
                            padding: '2px 6px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '500'
                          }}>
                            {Math.round(tripletItem.supportRatio * 100)}% support
                          </span>
                        )}
                      </div>

                    {/* Actions */}
                    <div className="signal-actions">
                      <QuickActionButton
                        action="scan"
                        onClick={() => handleViewOnExplorer(tripletItem.txHash)}
                      />
                    </div>

                    {isExpanded && (
                      <div className="triplet-details">
                        {/* Market Cap and Support details */}
                        <div className="triplet-detail-section">
                          <h4 className="triplet-detail-title">Market Metrics</h4>
                          <p className="triplet-detail-name">
                            Total Support Mkt Cap: {formatNumber(tripletItem.totalSupportMarketCap)} TTRUST
                          </p>
                          <p className="triplet-detail-name">
                            Total Users: {tripletItem.totalUsers}
                          </p>
                          <p className="triplet-detail-name">
                            Support Ratio: {Math.round(tripletItem.supportRatio * 100)}%
                          </p>
                          {tripletItem.vault && (
                            <>
                              <p className="triplet-detail-name">
                                Support Positions: {formatNumber(tripletItem.vault.positionCount)}
                              </p>
                              {tripletItem.vault.sharePrice > 0 && (
                                <p className="triplet-detail-name">
                                  Share Price: {tripletItem.vault.sharePrice.toFixed(4)} TTRUST
                                </p>
                              )}
                            </>
                          )}
                          {tripletItem.counterVault && (
                            <p className="triplet-detail-name">
                              Oppose Positions: {formatNumber(tripletItem.counterVault.positionCount)}
                            </p>
                          )}
                        </div>

                        <div className="triplet-detail-section">
                          <h4 className="triplet-detail-title">Subject</h4>
                          <p className="triplet-detail-name">
                            {tripletItem.subjectData.label.startsWith('0x')
                              ? formatWalletAddress(tripletItem.subjectData.label)
                              : tripletItem.subjectData.label}
                          </p>
                        </div>

                        <div className="triplet-detail-section">
                          <h4 className="triplet-detail-title">Predicate</h4>
                          <p className="triplet-detail-name">{tripletItem.triplet.predicate}</p>
                        </div>

                        <div className="triplet-detail-section">
                          <h4 className="triplet-detail-title">Object</h4>
                          <p className="triplet-detail-name">
                            {tripletItem.objectData.label.startsWith('0x')
                              ? formatWalletAddress(tripletItem.objectData.label)
                              : tripletItem.objectData.label}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}

          {!tripletsLoading && !tripletsError && highValueTriplets.length === 0 && (
            <div className="empty-state">
              <p>📊 No trending triplets available</p>
              <p className="empty-subtext">
                High-value triplets will appear here when available from the Intuition indexer
              </p>
            </div>
          )}
        </div>
        
      </div>
    </div>
  )
}


export default SearchPage