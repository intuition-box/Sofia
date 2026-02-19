import { useState, useMemo, useEffect } from 'react'
import { useIntuitionTriplets, useWeightOnChain, useWalletFromStorage } from '../../../hooks'
import QuickActionButton from '../../ui/QuickActionButton'
import BookmarkButton from '../../ui/BookmarkButton'
import StakeModal from '../../modals/StakeModal'
import SofiaLoader from '../../ui/SofiaLoader'
import { BondingCurveChart } from '../../charts/BondingCurveChart'
import { getAddress } from 'viem'
import logoIcon from '../../ui/icons/chatIcon.png'
import ArrowTopRightIcon from '../../ui/icons/arrow-top-right-thick.svg'
import LinkVariantIcon from '../../ui/icons/link-variant.svg'
import '../../styles/CoreComponents.css'
import '../../styles/CorePage.css'
import '../../styles/BookmarkStyles.css'
import { createHookLogger } from '../../../lib/utils/logger'
import { getFaviconUrl } from '~/lib/utils'

const logger = createHookLogger('HistoryTab')

interface HistoryTabProps {
  expandedTriplet: { tripletId: string } | null
  setExpandedTriplet: (value: { tripletId: string } | null) => void
}

type SortOption = 'highest-shares' | 'lowest-shares' | 'highest-support' | 'lowest-support' | 'newest' | 'oldest' | 'a-z' | 'z-a' | 'platform'

const HistoryTab = ({ expandedTriplet, setExpandedTriplet }: HistoryTabProps) => {
  const { triplets, isLoading, refreshFromAPI } = useIntuitionTriplets()
  const { addWeight, addShares} = useWeightOnChain()
  const { walletAddress: address } = useWalletFromStorage()

  // Stake modal state (unified)
  const [selectedStakeTriplet, setSelectedStakeTriplet] = useState<typeof triplets[0] | null>(null)
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false)
  const [isProcessingStake, setIsProcessingStake] = useState(false)
  const [defaultCurve, setDefaultCurve] = useState<1 | 2>(2) // Offset Progressive par défaut

  // Chart curve selection state (per triplet)
  const [selectedChartCurve, setSelectedChartCurve] = useState<{ [tripletId: string]: 1 | 2 }>({})

  // Sorting state
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  logger.debug('Render', { address, tripletsCount: triplets.length, triplets })

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
        return filtered.sort((a, b) => (b.position?.offsetProgressive || 0) - (a.position?.offsetProgressive || 0))
      case 'lowest-shares':
        return filtered.sort((a, b) => (a.position?.offsetProgressive || 0) - (b.position?.offsetProgressive || 0))
      case 'highest-support':
        return filtered.sort((a, b) => (b.position?.linear || 0) - (a.position?.linear || 0))
      case 'lowest-support':
        return filtered.sort((a, b) => (a.position?.linear || 0) - (b.position?.linear || 0))
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

  const handleStakeSubmit = async (amount: bigint, curveId: 1 | 2): Promise<{ success: boolean, txHash?: string, error?: string }> => {
    if (!selectedStakeTriplet || !address) {
      return { success: false, error: 'No wallet connected' }
    }

    try {
      setIsProcessingStake(true)

      logger.info('Staking', { amount: amount.toString(), tripleId: selectedStakeTriplet.id, curveId })

      let result
      if (curveId === 1) {
        // Linear curve (Support)
        result = await addWeight(selectedStakeTriplet.id, amount)
      } else {
        // Offset Progressive curve (Shares)
        result = await addShares(selectedStakeTriplet.id, amount)
      }

      if (result.success) {
        logger.info('Stake successful', { txHash: result.txHash })

        // Refresh the data after successful transaction
        await refreshFromAPI()

        // Return success result - modal will auto-close after showing success message
        setIsProcessingStake(false)
        return { success: true, txHash: result.txHash }
      } else {
        setIsProcessingStake(false)
        return { success: false, error: result.error || 'Transaction failed' }
      }
    } catch (error) {
      logger.error('Failed to stake', error)
      setIsProcessingStake(false)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed'
      }
    }
  }


  if (!address) {
    return (
      <div className="triples-container">
        <div className="empty-state">
          <p>🔌 Connect your wallet</p>
          <p className="empty-subtext">
            Connect your wallet to view your on-chain triplets
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
          placeholder="Search your History..."
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
                <div className="triplet-header">
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
                        src={getFaviconUrl(tripletItem.url, 16)}
                        alt="favicon"
                        className="triplet-favicon-small"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    )}
                  </div>
                </div>
                {isExpanded && (() => {
                  logger.debug('Expanded triplet detail', { url: tripletItem.url, tripletItem })
                  const currentCurve = selectedChartCurve[tripletItem.id] || 2
                  const checksumAddress = address ? getAddress(address) : undefined

                  return (
                    <div className="triplet-detail-section">
                      {/* Bonding Curve Chart Section */}
                      <div className="chart-section-expanded">
                        <div className="chart-curve-selector">
                          <button
                            className={`curve-selector-btn ${currentCurve === 1 ? 'active' : ''}`}
                            onClick={() => setSelectedChartCurve(prev => ({ ...prev, [tripletItem.id]: 1 }))}
                          >
                            Linear (Support)
                          </button>
                          <button
                            className={`curve-selector-btn ${currentCurve === 2 ? 'active' : ''}`}
                            onClick={() => setSelectedChartCurve(prev => ({ ...prev, [tripletItem.id]: 2 }))}
                          >
                            Offset (Shares)
                          </button>
                        </div>

                        <BondingCurveChart
                          tripleId={tripletItem.id}
                          curveId={currentCurve}
                          walletAddress={checksumAddress}
                        />
                      </div>

                      {/* Actions dans la section expanded */}
                      <div className="triplet-detail-actions">
                      {/* Bouton Stake */}
                        <button
                          className="portal-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Always open with Offset Progressive (curve 2)
                            handleStakeClick(tripletItem, 2)
                          }}
                        >
                          <img src={ArrowTopRightIcon} alt="stake" className="portal-button-icon" />
                          Stake
                        </button>
                        <button
                          onClick={() => handleViewOnPortal(tripletItem.id)}
                          className="portal-button"
                          title="View on Intuition Portal"
                        >
                          <img src={LinkVariantIcon} alt="portal" className="portal-button-icon" />
                          Portal
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
      ) : isLoading ? (
        <div className="loading-indicator">
          <SofiaLoader size={150} />
        </div>
      ) : (
        <div className="empty-state">
          <p>No signals found</p>
        </div>
      )}

      {/* Stake Modal (Unified) */}
      {selectedStakeTriplet && (
        <StakeModal
          isOpen={isStakeModalOpen}
          subjectName={selectedStakeTriplet.triplet.subject}
          predicateName={selectedStakeTriplet.triplet.predicate}
          objectName={selectedStakeTriplet.triplet.object}
          tripleId={selectedStakeTriplet.id}
          defaultCurve={defaultCurve}
          onClose={handleCloseStakeModal}
          onSubmit={handleStakeSubmit}
          isProcessing={isProcessingStake}
        />
      )}
    </div>
  )
}

export default HistoryTab
