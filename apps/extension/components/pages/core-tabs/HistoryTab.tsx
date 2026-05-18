import { useState, useMemo } from 'react'
import {
  getCertificationForUrl,
  useIntuitionTriplets,
  useRedeemTriple,
  useUserCertifications,
  useWalletFromStorage,
  useWeightOnChain
} from '~/hooks'
import BookmarkButton from '../../ui/BookmarkButton'
import FilterDropdown from '../../ui/FilterDropdown'
import WeightModal from '../../modals/WeightModal'
import SofiaLoader from '../../ui/SofiaLoader'
import { BondingCurveChart } from '../../charts/BondingCurveChart'
import { getAddress } from 'viem'
import { getTripleUrl, getAtomUrl } from '~/lib/utils'
import {
  TOPIC_FILTER_OPTIONS,
  VERB_FILTER_OPTIONS
} from '~/lib/config/filterOptions'
import { TOPIC_COLORS, TOPIC_LABELS } from '~/lib/config/topicConfig'
import ArrowTopRightIcon from '../../ui/icons/arrow-top-right-thick.svg'
import LinkVariantIcon from '../../ui/icons/link-variant.svg'
import '../../styles/CoreComponents.css'
import '../../styles/CorePage.css'
import '../../styles/CommonPage.css'
import '../../styles/CategoryStyles.css'
import { createHookLogger, getFaviconUrl } from '~/lib/utils'
import { predicateLabelToIntentionType } from '~/types/intentionCategories'
import type { IntentionType } from '~/types/intentionCategories'
import { VerbTag } from '@0xsofia/design-system'

const logger = createHookLogger('HistoryTab')

interface HistoryTabProps {
  expandedTriplet: { tripletId: string } | null
  setExpandedTriplet: (value: { tripletId: string } | null) => void
}

type SortOption = 'newest' | 'oldest' | 'highest-shares' | 'highest-support' | 'a-z'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'highest-shares', label: 'Shares' },
  { value: 'highest-support', label: 'Support' },
  { value: 'a-z', label: 'A-Z' }
]

const HistoryTab = ({ expandedTriplet, setExpandedTriplet }: HistoryTabProps) => {
  const { triplets, isLoading, refreshFromAPI } = useIntuitionTriplets()
  const { depositWithPool } = useWeightOnChain()
  const { walletAddress: address } = useWalletFromStorage()
  const { redeemPosition } = useRedeemTriple()

  // Stake modal state
  const [selectedStakeTriplet, setSelectedStakeTriplet] = useState<typeof triplets[0] | null>(null)
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false)
  const [isProcessingStake, setIsProcessingStake] = useState(false)
  const [transactionSuccess, setTransactionSuccess] = useState(false)
  const [transactionError, setTransactionError] = useState<string | undefined>()
  const [transactionHash, setTransactionHash] = useState<string | undefined>()
  const [defaultCurve, setDefaultCurve] = useState<1 | 2>(2)

  // Chart curve selection state (per triplet)
  const [selectedChartCurve, setSelectedChartCurve] = useState<{ [tripletId: string]: 1 | 2 }>({})

  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [verbFilter, setVerbFilter] = useState<IntentionType | 'all'>('all')
  const [topicFilter, setTopicFilter] = useState<string>('all')

  // On-chain "in context of" topics — same source EchoesTab / Bookmark /
  // the explorer feed use, so the Verb + Topic filters stay coherent.
  const { certifications } = useUserCertifications(address)

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

  const filteredAndSortedTriplets = useMemo(() => {
    let filtered = redeemedIds.size > 0
      ? triplets.filter(t => !redeemedIds.has(t.id))
      : [...triplets]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(triplet =>
        triplet.triplet.object.toLowerCase().includes(query) ||
        triplet.triplet.predicate.toLowerCase().includes(query) ||
        (triplet.url && triplet.url.toLowerCase().includes(query))
      )
    }

    if (verbFilter !== 'all') {
      filtered = filtered.filter(
        triplet =>
          predicateLabelToIntentionType(triplet.triplet.predicate) === verbFilter
      )
    }

    if (topicFilter !== 'all') {
      filtered = filtered.filter(triplet => {
        if (!triplet.url) return false
        const entry = getCertificationForUrl(certifications, triplet.url)
        return entry?.interestContexts?.includes(topicFilter) ?? false
      })
    }

    switch (sortBy) {
      case 'highest-shares':
        return filtered.sort((a, b) => (b.position?.offsetProgressive || 0) - (a.position?.offsetProgressive || 0))
      case 'highest-support':
        return filtered.sort((a, b) => (b.position?.linear || 0) - (a.position?.linear || 0))
      case 'newest':
        return filtered.sort((a, b) => b.timestamp - a.timestamp)
      case 'oldest':
        return filtered.sort((a, b) => a.timestamp - b.timestamp)
      case 'a-z':
        return filtered.sort((a, b) => a.triplet.object.localeCompare(b.triplet.object))
      default:
        return filtered
    }
  }, [triplets, sortBy, searchQuery, redeemedIds, verbFilter, topicFilter, certifications])

  const handleViewOnPortal = (tripletId: string) => {
    window.open(getTripleUrl(tripletId), '_blank')
  }

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

      const result = await depositWithPool(selectedStakeTriplet.id, weight, BigInt(defaultCurve))

      if (result.success) {
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
      {/* Search bar — own row, full width (same layout as EchoesTab,
          consistent across the whole extension). */}
      <div className="echoes-search-row">
        <div className="category-search-container">
          <input
            type="text"
            placeholder="Search your history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="category-search-input"
          />
          {searchQuery && (
            <button
              className="category-search-clear"
              onClick={() => setSearchQuery('')}
            >
              x
            </button>
          )}
        </div>
      </div>

      {/* Sort pills — directly under the search bar; same shared
          segmented control as EchoesTab. */}
      <div
        className="scope-toggle echoes-sort-toggle"
        role="group"
        aria-label="Sort history by"
      >
        {SORT_OPTIONS.map(option => (
          <button
            key={option.value}
            type="button"
            className={`scope-btn ${sortBy === option.value ? 'active' : ''}`}
            aria-pressed={sortBy === option.value}
            onClick={() => setSortBy(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Verb + Topic filter dropdowns — same coherent system as
          EchoesTab / BookmarkTab / My Trust Circles and the explorer.
          Topic uses the on-chain "in context of" data from
          useUserCertifications. */}
      <div className="echoes-filter-row">
        <FilterDropdown
          label="Verbs"
          value={verbFilter}
          onChange={(id) => setVerbFilter(id as IntentionType | 'all')}
          options={VERB_FILTER_OPTIONS}
        />
        <FilterDropdown
          label="Topics"
          value={topicFilter}
          onChange={setTopicFilter}
          options={TOPIC_FILTER_OPTIONS}
          wide
        />
      </div>

      {filteredAndSortedTriplets.length > 0 ? (
        <div className="history-list">
          {filteredAndSortedTriplets.map((tripletItem) => {
            const isExpanded = expandedTriplet?.tripletId === tripletItem.id
            const intent = predicateLabelToIntentionType(tripletItem.triplet.predicate)
            const titleLabel = tripletItem.triplet.object || tripletItem.url || ''
            const contexts = tripletItem.url
              ? getCertificationForUrl(certifications, tripletItem.url)
                  ?.interestContexts ?? []
              : []

            return (
              <div
                key={tripletItem.id}
                className={`url-row on-chain${isExpanded ? ' expanded' : ''}`}
              >
                <button
                  type="button"
                  className="url-row-main"
                  onClick={() =>
                    setExpandedTriplet(isExpanded ? null : { tripletId: tripletItem.id })
                  }
                >
                  {tripletItem.url && (
                    <img
                      src={getFaviconUrl(tripletItem.url, 16)}
                      alt=""
                      className="url-favicon"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  )}
                  <div className="url-info">
                    <span className="url-title">{titleLabel}</span>
                    <div className="url-meta">
                      {intent && (
                        <VerbTag intent={intent} label={intent} />
                      )}
                      {contexts.map((slug) => {
                        const label = TOPIC_LABELS[slug] || slug
                        const color = TOPIC_COLORS[slug] || 'var(--ds-accent)'
                        return (
                          <span
                            key={`ctx-${slug}`}
                            className="cert-badge cert-badge--context"
                            style={{ color, borderColor: color }}
                            title={`Marked in context of ${label}`}
                          >
                            {label}
                          </span>
                        )
                      })}
                      {tripletItem.timestamp ? (
                        <span className="url-date">
                          {new Date(tripletItem.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <span className={`url-chevron${isExpanded ? ' expanded' : ''}`}>▾</span>
                </button>

                {isExpanded && (() => {
                  const currentCurve = selectedChartCurve[tripletItem.id] || 2
                  const checksumAddress = address ? getAddress(address) : undefined

                  return (
                    <div className="history-row-detail">
                      <div className="history-curve-selector">
                        <button
                          type="button"
                          className={`sort-btn ${currentCurve === 1 ? 'active' : ''}`}
                          onClick={() => setSelectedChartCurve(prev => ({ ...prev, [tripletItem.id]: 1 }))}
                        >
                          Linear (Support)
                        </button>
                        <button
                          type="button"
                          className={`sort-btn ${currentCurve === 2 ? 'active' : ''}`}
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

                      <div className="history-actions">
                        <button
                          type="button"
                          className="portal-button"
                          onClick={() => handleStakeClick(tripletItem, 2)}
                        >
                          <img src={ArrowTopRightIcon} alt="" className="portal-button-icon" />
                          Stake
                        </button>
                        <button
                          type="button"
                          className="portal-button"
                          onClick={() => handleViewOnPortal(tripletItem.id)}
                          title="View on Intuition Portal"
                        >
                          <img src={LinkVariantIcon} alt="" className="portal-button-icon" />
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
                          className="portal-button"
                        />
                        <button
                          type="button"
                          className="portal-button portal-button--danger"
                          onClick={() => handleRedeem(tripletItem.id)}
                          disabled={redeemingIds.has(tripletItem.id)}
                          title="Redeem position"
                        >
                          {redeemingIds.has(tripletItem.id) ? '...' : 'Redeem'}
                        </button>
                      </div>

                      {tripletItem.url ? (
                        <a
                          href={tripletItem.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="history-detail-link"
                        >
                          {tripletItem.url}
                        </a>
                      ) : (
                        <a
                          href={getAtomUrl(tripletItem.objectTermId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="history-detail-link"
                        >
                          View "{tripletItem.triplet.object}" on Portal
                        </a>
                      )}
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>
      ) : triplets.length > 0 ? (
        <div className="empty-state">
          <p>No triplets match your search</p>
          <p className="empty-subtext">
            Try adjusting your search or clear it to see all triplets.
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
