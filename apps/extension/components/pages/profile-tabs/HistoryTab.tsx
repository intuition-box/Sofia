import { useState, useMemo, useEffect } from 'react'
import { useIntuitionTriplets, useWeightOnChain, useWalletFromStorage, useRedeemTriple } from '~/hooks'
import QuickActionButton from '../../ui/QuickActionButton'
import BookmarkButton from '../../ui/BookmarkButton'
import WeightModal from '../../modals/WeightModal'
import SofiaLoader from '../../ui/SofiaLoader'
import { BondingCurveChart } from '../../charts/BondingCurveChart'
import { getAddress } from 'viem'
import logoIcon from '../../ui/icons/chatIcon.png'
import ArrowTopRightIcon from '../../ui/icons/arrow-top-right-thick.svg'
import LinkVariantIcon from '../../ui/icons/link-variant.svg'
import '../../styles/CoreComponents.css'
import '../../styles/CorePage.css'
import '../../styles/BookmarkStyles.css'
import { createHookLogger } from '~/lib/utils'
import { getFaviconUrl } from '~/lib/utils'
import { predicateLabelToIntentionType } from '~/types/intentionCategories'

const logger = createHookLogger('HistoryTab')

interface HistoryTabProps {
  expandedTriplet: { tripletId: string } | null
  setExpandedTriplet: (value: { tripletId: string } | null) => void
}

type SortOption = 'highest-shares' | 'lowest-shares' | 'highest-support' | 'lowest-support' | 'newest' | 'oldest' | 'a-z' | 'z-a' | 'platform'

const HistoryTab = ({ expandedTriplet, setExpandedTriplet }: HistoryTabProps) => {
  const { triplets, isLoading, refreshFromAPI } = useIntuitionTriplets()
  const { depositWithPool } = useWeightOnChain()
  const { walletAddress: address } = useWalletFromStorage()
  const { redeemPosition } = useRedeemTriple()

  // Stake modal state (unified)
  const [selectedStakeTriplet, setSelectedStakeTriplet] = useState<typeof triplets[0] | null>(null)
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false)
  const [isProcessingStake, setIsProcessingStake] = useState(false)
  const [transactionSuccess, setTransactionSuccess] = useState(false)
  const [transactionError, setTransactionError] = useState<string | undefined>()
  const [transactionHash, setTransactionHash] = useState<string | undefined>()
  const [defaultCurve, setDefaultCurve] = useState<1 | 2>(2) // Offset Progressive par défaut

  // Chart curve selection state (per triplet)
  const [selectedChartCurve, setSelectedChartCurve] = useState<{ [tripletId: string]: 1 | 2 }>({})

  // Sorting state
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Redeem state
  const [redeemingIds, setRedeemingIds] = useState<Set<string>>(() => new Set())
  const [redeemedIds, setRedeemedIds] = useState<Set<string>>(() => new Set())

  const handleRedeem = async (termId: string) => {
    setRedeemingIds(prev => new Set(prev).add(termId))
    try {
      const result = await redeemPosition(termId)
      if (!result.success) {
        alert(`Redeem failed: ${result.error}`)
        return
      }
      setRedeemedIds(prev => new Set(prev).add(termId))
      refreshFromAPI()
    } finally {
      setRedeemingIds(prev => {
        const next = new Set(prev)
        next.delete(termId)
        return next
      })
    }
  }

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
    // Exclude optimistically removed (redeemed) triples
    let filtered = redeemedIds.size > 0
      ? publishedTriplets.filter(t => !redeemedIds.has(t.id))
      : [...publishedTriplets]

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
  }, [publishedTriplets, sortBy, getPlatformFromUrl, searchQuery, redeemedIds])

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
    setTransactionSuccess(false)
    setTransactionError(undefined)
    setTransactionHash(undefined)
  }

  const handleStakeSubmit = async (customWeights?: (bigint | null)[]): Promise<void> => {
    if (!selectedStakeTriplet || !address) return
    const weight = customWeights?.[0] || BigInt(Math.floor(0.5 * 1e18))

    try {
      setIsProcessingStake(true)
      setTransactionError(undefined)

      logger.info('Staking', { amount: weight.toString(), tripleId: selectedStakeTriplet.id, curveId: defaultCurve })

      const result = await depositWithPool(selectedStakeTriplet.id, weight, BigInt(defaultCurve))

      if (result.success) {
        logger.info('Stake successful', { txHash: result.txHash })
        setTransactionHash(result.txHash)
        setTransactionSuccess(true)
        await refreshFromAPI()
      } else {
        setTransactionError(result.error || 'Transaction failed')
      }
    } catch (error) {
      logger.error('Failed to stake', error)
      setTransactionError(error instanceof Error ? error.message : 'Transaction failed')
    } finally {
      setIsProcessingStake(false)
    }
  }


  if (!address) {
    return (
      <div className="triples-container">
        <div className="empty-state">
          <p>Connect your wallet</p>
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

                  {/* Favicon */}
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
                  {/* Redeem button — pushed to right */}
                  <button
                    className="remove-btn"
                    style={{ marginLeft: 'auto' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRedeem(tripletItem.id)
                    }}
                    disabled={redeemingIds.has(tripletItem.id)}
                    title="Redeem position"
                  >
                    {redeemingIds.has(tripletItem.id) ? '...' : '×'}
                  </button>
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
      <WeightModal
        isOpen={isStakeModalOpen}
        triplets={selectedStakeTriplet ? [{
          id: selectedStakeTriplet.id,
          triplet: {
            subject: selectedStakeTriplet.triplet.subject,
            predicate: selectedStakeTriplet.triplet.predicate,
            object: selectedStakeTriplet.triplet.object
          },
          description: '',
          url: selectedStakeTriplet.url || '',
          intention: predicateLabelToIntentionType(selectedStakeTriplet.triplet.predicate) || undefined
        }] : []}
        isProcessing={isProcessingStake}
        transactionSuccess={transactionSuccess}
        transactionError={transactionError}
        transactionHash={transactionHash}
        estimateOptions={{ isNewTriple: false, newAtomCount: 0 }}
        submitLabel="Stake"
        onClose={handleCloseStakeModal}
        onSubmit={handleStakeSubmit}
      />
    </div>
  )
}

export default HistoryTab
