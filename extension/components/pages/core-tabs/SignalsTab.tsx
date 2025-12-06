import { useState, useMemo, useEffect } from 'react'
import { useIntuitionTriplets } from '../../../hooks/useIntuitionTriplets'
import { useWeightOnChain } from '../../../hooks/useWeightOnChain'
import QuickActionButton from '../../ui/QuickActionButton'
import BookmarkButton from '../../ui/BookmarkButton'
import StakeModal from '../../modals/StakeModal'
import { useStorage } from "@plasmohq/storage/hook"
import logoIcon from '../../ui/icons/chatIcon.png'
import '../../styles/CoreComponents.css'
import '../../styles/CorePage.css'
import '../../styles/BookmarkStyles.css'

interface SignalsTabProps {
  expandedTriplet: { tripletId: string } | null
  setExpandedTriplet: (value: { tripletId: string } | null) => void
}

type SortOption = 'highest-shares' | 'lowest-shares' | 'highest-support' | 'lowest-support' | 'newest' | 'oldest' | 'a-z' | 'z-a' | 'platform'

const SignalsTab = ({ expandedTriplet, setExpandedTriplet }: SignalsTabProps) => {
  const { triplets, refreshFromAPI } = useIntuitionTriplets()
  const { addWeight, addShares, removeWeight } = useWeightOnChain()
  const [address] = useStorage<string>("metamask-account")

  // Stake modal state (unified)
  const [selectedStakeTriplet, setSelectedStakeTriplet] = useState<typeof triplets[0] | null>(null)
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false)
  const [isProcessingStake, setIsProcessingStake] = useState(false)
  const [defaultCurve, setDefaultCurve] = useState<1 | 2>(2) // Offset Progressive par défaut
  
  // Sorting state
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  console.log('🎯 SignalsTab render - address:', address)
  console.log('🎯 SignalsTab render - triplets:', triplets)
  console.log('🎯 SignalsTab render - triplets.length:', triplets.length)

  // Display triplets from Intuition indexer (already sorted by timestamp)
  const publishedTriplets = triplets

  // Extract platform from URL
  const getPlatformFromUrl = (url: string): string => {
    if (!url) return 'Unknown'
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return 'Unknown'
    }
  }

  // Filter and sort triplets based on search query and sort option
  const filteredAndSortedTriplets = useMemo(() => {
    let filtered = [...publishedTriplets]
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(triplet =>
        triplet.triplet.object.toLowerCase().includes(query) ||
        triplet.triplet.predicate.toLowerCase().includes(query) ||
        (triplet.url && triplet.url.toLowerCase().includes(query))
      )
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'highest-shares':
        return filtered.sort((a, b) => (b.position?.shares || 0) - (a.position?.shares || 0))
      case 'lowest-shares':
        return filtered.sort((a, b) => (a.position?.shares || 0) - (b.position?.shares || 0))
      case 'highest-support':
        return filtered.sort((a, b) => (b.position?.upvotes || 0) - (a.position?.upvotes || 0))
      case 'lowest-support':
        return filtered.sort((a, b) => (a.position?.upvotes || 0) - (b.position?.upvotes || 0))
      case 'newest':
        return filtered.sort((a, b) => b.timestamp - a.timestamp)
      case 'oldest':
        return filtered.sort((a, b) => a.timestamp - b.timestamp)
      case 'a-z':
        return filtered.sort((a, b) => a.triplet.object.localeCompare(b.triplet.object))
      case 'z-a':
        return filtered.sort((a, b) => b.triplet.object.localeCompare(a.triplet.object))
      case 'platform':
        return filtered.sort((a, b) => {
          const platformA = getPlatformFromUrl(a.url)
          const platformB = getPlatformFromUrl(b.url)
          return platformA.localeCompare(platformB)
        })
      default:
        return filtered
    }
  }, [publishedTriplets, sortBy, getPlatformFromUrl, searchQuery])

  // Sort options configuration
  const sortOptions = [
    { value: 'highest-shares', label: 'Highest Shares' },
    { value: 'lowest-shares', label: 'Lowest Shares' },
    { value: 'highest-support', label: 'Highest Support' },
    { value: 'lowest-support', label: 'Lowest Support' },
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'a-z', label: 'A-Z' },
    { value: 'z-a', label: 'Z-A' },
    { value: 'platform', label: 'Platform' }
  ] as const

  // Handle sort selection
  const handleSortSelection = (option: SortOption) => {
    setSortBy(option)
    setIsDropdownOpen(false)
  }

  // Close dropdown when clicking outside
  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDropdownOpen(!isDropdownOpen)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsDropdownOpen(false)
    }

    if (isDropdownOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isDropdownOpen])

  // Format wallet address
  const formatWalletAddress = (address: string) => {
    if (!address || address.length < 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // getTripletMetrics removed - was generating fake metrics that weren't used in UI

  // Function to get favicon URL from a website URL
  const getFaviconUrl = (url: string): string => {
    if (!url) return ''
    
    try {
      const urlObj = new URL(url)
      // Use Google's favicon service as fallback, it's very reliable
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=16`
    } catch {
      return ''
    }
  }

  const handleViewOnExplorer = (txHash?: string, vaultId?: string) => {
    if (txHash) {
      // Intuition Testnet explorer
      window.open(`https://testnet.explorer.intuition.systems/tx/${txHash}`, '_blank')
    } else if (vaultId) {
      // Link to triple vault explorer
      window.open(`https://testnet.explorer.intuition.systems/triple/${vaultId}`, '_blank')
    }
  }

  const handleViewOnPortal = (tripletId: string) => {
    // Redirect to Intuition Portal for this specific triplet
    window.open(`https://portal.intuition.systems/explore/triple/${tripletId}?tab=positions`, '_blank')
  }

  // Stake modal handlers (unified)
  const handleStakeClick = (triplet: typeof triplets[0], curve: 1 | 2 = 2) => {
    setSelectedStakeTriplet(triplet)
    setDefaultCurve(curve)
    setIsStakeModalOpen(true)
  }

  const handleCloseStakeModal = () => {
    setIsStakeModalOpen(false)
    setSelectedStakeTriplet(null)
    setIsProcessingStake(false)
  }

  const handleStakeSubmit = async (amount: bigint, curveId: 1 | 2) => {
    if (!selectedStakeTriplet || !address) return

    try {
      setIsProcessingStake(true)

      console.log('Staking:', amount.toString(), 'wei on triple:', selectedStakeTriplet.id, 'curve:', curveId)

      let result
      if (curveId === 1) {
        // Linear curve (Support)
        result = await addWeight(selectedStakeTriplet.id, amount)
      } else {
        // Offset Progressive curve (Shares)
        result = await addShares(selectedStakeTriplet.id, amount)
      }

      if (result.success) {
        console.log('✅ Stake successful:', result.txHash)

        // Refresh the data after successful transaction
        await refreshFromAPI()

        handleCloseStakeModal()
      } else {
        throw new Error(result.error || 'Transaction failed')
      }
    } catch (error) {
      console.error('Failed to stake:', error)
      setIsProcessingStake(false)
      // Keep modal open to show error or allow retry
    }
  }


  if (!address) {
    return (
      <div className="triples-container">
        <div className="empty-state">
          <p>🔌 Connect your wallet</p>
          <p className="empty-subtext">
            Connect your MetaMask wallet to view your on-chain triplets
          </p>
        </div>
      </div>
    )
  }


  return (
    <div className="triples-container">
      {/* Search Bar */}
      <div className="signals-search-input-container">
        <input
          type="text"
          placeholder="Search your triplets..."
          className="input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {publishedTriplets.length > 0 && (
        <div className="sort-controls">
          <div className={`sort-dropdown ${isDropdownOpen ? 'open' : ''}`}>
            <div 
              className="sort-dropdown-trigger" 
              onClick={handleDropdownClick}
            >
              <span>{sortOptions.find(opt => opt.value === sortBy)?.label}</span>
              <span className="sort-dropdown-arrow">▼</span>
            </div>
            <div className={`sort-dropdown-menu ${isDropdownOpen ? 'open' : ''}`}>
              {sortOptions.map((option) => (
                <div
                  key={option.value}
                  className={`sort-dropdown-option ${sortBy === option.value ? 'selected' : ''}`}
                  onClick={() => handleSortSelection(option.value)}
                >
                  <span>{option.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {filteredAndSortedTriplets.length > 0 ? (
        filteredAndSortedTriplets.map((tripletItem) => {
          const isExpanded = expandedTriplet?.tripletId === tripletItem.id

          return (
            <div key={tripletItem.id} className="echo-card border-default position-relative">
              <div className={`triplet-item ${isExpanded ? 'expanded' : ''}`}>
                {/* Header avec favicon et upvotes alignés au texte */}
                <div className="triplet-header position-relative">
                  {/* Texte du triplet */}
                  <div className="triplet-text-container">
                    <p className="triplet-text clickable" onClick={() => {
                      setExpandedTriplet(isExpanded ? null : { tripletId: tripletItem.id })
                    }}>
                      <span className="subject">I</span>{' '}
                      <span className="action">{tripletItem.triplet.predicate}</span>{' '}
                      <span className="object">{tripletItem.triplet.object}</span>
                    </p>
                  </div>
                  
                  {/* Favicon et Badges alignés avec le texte */}
                  <div className="triplet-actions-container">
                    {tripletItem.url && (
                      <img
                        src={getFaviconUrl(tripletItem.url)}
                        alt="favicon"
                        className="triplet-favicon-small"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    )}
                    {/* Curve 1 - Linear (Support) */}
                    <div
                      className="upvote-badge upvote-badge-relative"
                      title="Linear (Curve 1 - Support)"
                    >
                      👍 {(tripletItem.position?.linear || 0).toFixed(4)}
                    </div>
                    {/* Curve 2 - Offset Progressive (Shares) */}
                    <div
                      className="shares-badge shares-badge-relative"
                      title="Offset Progressive (Curve 2 - Shares)"
                    >
                      {(tripletItem.position?.offsetProgressive || 0).toFixed(2)}
                    </div>
                    {/* Bouton Stake */}
                    <button
                      className="stake-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStakeClick(tripletItem, 2) // Default to Offset Progressive
                      }}
                    >
                      Stake
                    </button>
                  </div>
                </div>
                {isExpanded && (() => {
                  console.log('tripletItem.url:', tripletItem.url, 'tripletItem:', tripletItem)
                  return (
                    <div className="triplet-detail-section">
                      <h4 className="triplet-detail-title">Source</h4>
                      <p className="triplet-detail-name">
                        {tripletItem.url ? (
                          <a href={tripletItem.url} target="_blank" rel="noopener noreferrer" className="triplet-url-link">
                            {tripletItem.url}
                          </a>
                        ) : (
                          <a 
                            href={`https://portal.intuition.systems/explore/atom/${tripletItem.objectTermId}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="portal-fallback-link"
                          >
                            View "{tripletItem.triplet.object}" on Portal
                          </a>
                        )}
                      </p>
                      <p className="triplet-detail-timestamp">
                        {new Date(tripletItem.timestamp).toLocaleString()}
                      </p>
                      
                      {/* Actions dans la section expanded */}
                      <div className="triplet-detail-actions">
                        <button
                          onClick={() => handleViewOnPortal(tripletItem.id)}
                          className="portal-button"
                          title="View on Intuition Portal"
                        >
                          🌐 Portal
                        </button>
                        <BookmarkButton
                          triplet={tripletItem.triplet}
                          sourceInfo={{
                            sourceType: 'published',
                            sourceId: tripletItem.id,
                            url: tripletItem.url,
                            description: tripletItem.description,
                            sourceMessageId: tripletItem.id
                          }}
                          size="small"
                          className="portal-button"
                        />
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          );
        })
      ) : publishedTriplets.length > 0 ? (
        <div className="empty-state">
          <p>No triplets match your search</p>
          <p className="empty-subtext">
            Try adjusting your search terms or clear the search to see all triplets.
          </p>
        </div>
      ) : (
        <div className="empty-state">
          <p>No Published Triplets Found</p>
          <p className="empty-subtext">
            Triplets you publish to Intuition blockchain will appear here.<br />
            Create some triplets from Echoes tab to see them displayed with full on-chain data!
          </p>
          <button onClick={refreshFromAPI} className="refresh-button">
            Refresh from Blockchain
          </button>
        </div>
      )}

      {/* Stake Modal (Unified) */}
      {selectedStakeTriplet && (
        <StakeModal
          isOpen={isStakeModalOpen}
          objectName={selectedStakeTriplet.triplet.object}
          tripleId={selectedStakeTriplet.id}
          currentLinear={selectedStakeTriplet.position?.linear || 0}
          currentOffsetProgressive={selectedStakeTriplet.position?.offsetProgressive || 0}
          totalMarketCap={selectedStakeTriplet.totalMarketCap || '0'}
          defaultCurve={defaultCurve}
          onClose={handleCloseStakeModal}
          onSubmit={handleStakeSubmit}
          isProcessing={isProcessingStake}
        />
      )}
    </div>
  )
}

export default SignalsTab