import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'

import {
  useGetTrustCirclePositionsQuery,
  useGetSofiaTrustedActivityQuery,
  useFindUserPositionsOnTriplesQuery
} from '@0xsofia/graphql'
import { getAddress } from 'viem'

import { useRouter } from '../../layout/RouterProvider'
import SofiaLoader from '../../ui/SofiaLoader'
import { useWalletFromStorage, useIntentionCategories, useWeightOnChain } from '~/hooks'
import { SUBJECT_IDS, PREDICATE_IDS } from '~/lib/config/constants'
import { SOFIA_PROXY_ADDRESS } from '~/lib/config/chainConfig'
import { getFaviconUrl, batchResolveEns } from '~/lib/utils'
import { questTrackingService, goldService } from '~/lib/services'
import type { IntentionType } from '~/types/intentionCategories'
import { INTENTION_CONFIG, predicateLabelToIntentionType } from '~/types/intentionCategories'

import CategoryCard from '../../ui/CategoryCard'
import CategoryDetailView from '../../ui/CategoryDetailView'
import Avatar from '../../ui/Avatar'
import WeightModal from '../../modals/WeightModal'
import '../../styles/CircleFeedTab.css'
import '../../styles/CategoryStyles.css'

// Extract domain from URL
const getDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

// Format relative time
const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

interface CircleFeedItem {
  id: string
  tripleTermId: string
  counterTermId: string
  intentionType: IntentionType
  tripleSubject: string
  triplePredicate: string
  tripleObject: string
  pageLabel: string
  pageUrl: string
  domain: string
  memberAddress: string
  memberLabel: string
  memberImage: string
  createdAt: string
}

interface GroupedFeedItem {
  groupKey: string
  pageLabel: string
  pageUrl: string
  domain: string
  memberAddress: string
  memberLabel: string
  memberImage: string
  createdAt: string
  intentions: CircleFeedItem[]
}

type ViewState =
  | { type: 'feed' }
  | { type: 'member-profile'; address: string; label: string; image?: string }
  | { type: 'member-category'; address: string; label: string; image?: string }

const CircleFeedTab = () => {
  const { navigateTo, setActiveProfileTab } = useRouter()
  const { walletAddress: address } = useWalletFromStorage()
  const [activeFilter, setActiveFilter] = useState<'all' | IntentionType>('all')
  const [viewState, setViewState] = useState<ViewState>({ type: 'feed' })
  const [feedItems, setFeedItems] = useState<CircleFeedItem[]>([])
  const [trustedWallets, setTrustedWallets] = useState<string[]>([])
  const [walletToLabel, setWalletToLabel] = useState(() => new Map<string, string>())
  const [walletToImage, setWalletToImage] = useState(() => new Map<string, string>())

  const checksumAddress = address ? getAddress(address) : ''

  // Step 1: Get followed accounts
  const { data: trustCircleData, isLoading: trustCircleLoading, isFetching: trustCircleFetching, refetch: refetchTrustCircle } = useGetTrustCirclePositionsQuery(
    {
      subjectId: SUBJECT_IDS.I,
      predicateId: PREDICATE_IDS.TRUSTS,
      address: checksumAddress,
      offset: 0,
      positionsOrderBy: [{ shares: 'desc' }]
    },
    {
      enabled: !!checksumAddress,
      refetchOnWindowFocus: false
    }
  )

  // Extract trusted wallets from Trust Circle data
  useEffect(() => {
    if (!trustCircleData?.triples) return

    const wallets: string[] = []
    const labelMap = new Map<string, string>()
    const imageMap = new Map<string, string>()

    for (const triple of trustCircleData.triples) {
      // Only include if user has positive shares (not untrusted)
      const hasPositiveShares = triple.term?.vaults?.some(v =>
        v.positions?.some(p => p.shares && BigInt(p.shares) > 0n)
      )
      if (!hasPositiveShares) continue

      const accounts = triple.object?.accounts || []
      const label = triple.object?.label || ''

      for (const account of accounts) {
        if (account?.id) {
          try {
            const checksumWallet = getAddress(account.id)
            wallets.push(checksumWallet)
            wallets.push(checksumWallet.toLowerCase())
            labelMap.set(checksumWallet.toLowerCase(), account.label || label || checksumWallet)
            if (account.image) {
              imageMap.set(checksumWallet.toLowerCase(), account.image)
            }
          } catch {
            continue
          }
        }
      }
    }

    setTrustedWallets([...new Set(wallets)])
    setWalletToLabel(labelMap)
    setWalletToImage(imageMap)

    // Batch-resolve ENS names + avatars for wallets with raw address labels
    const addressesToResolve = [...labelMap.entries()]
      .filter(([, label]) => !label || label.startsWith("0x") || label.includes("..."))
      .map(([wallet]) => wallet)

    if (addressesToResolve.length > 0) {
      batchResolveEns(addressesToResolve).then((ensResults) => {
        for (const [addr, ens] of ensResults) {
          if (ens.name) labelMap.set(addr, ens.name)
          if (ens.avatar) imageMap.set(addr, ens.avatar)
        }
        setWalletToLabel(new Map(labelMap))
        setWalletToImage(new Map(imageMap))
      })
    }
  }, [trustCircleData])

  // Step 2: Get events from trusted wallets
  const { data: eventsData, isLoading: eventsLoading, isFetching: eventsFetching, refetch: refetchEvents } = useGetSofiaTrustedActivityQuery(
    {
      trustedWallets: trustedWallets,
      proxy: SOFIA_PROXY_ADDRESS,
      limit: 500,
      offset: 0
    },
    {
      enabled: trustedWallets.length > 0,
      refetchOnWindowFocus: false
    }
  )

  // Step 3: Process events into feed items (filter intention certifications only)
  useEffect(() => {
    if (!eventsData?.events) return

    const items: CircleFeedItem[] = []

    for (const event of eventsData.events) {
      // Only process events with triples that have intention predicates
      const predicateLabel = event.triple?.predicate?.label
      if (!predicateLabel) continue

      const intentionType = predicateLabelToIntentionType(predicateLabel)
      if (!intentionType) continue

      // Get member info
      let memberAddress = ''
      let memberLabel = ''
      let memberImage = ''

      if (event.type === 'Deposited' && event.deposit) {
        const receiver = event.deposit.receiver
        memberAddress = receiver?.id || ''
        const addrKey = receiver?.id?.toLowerCase() || ''
        memberLabel = walletToLabel.get(addrKey) || receiver?.label || 'User'
        memberImage = walletToImage.get(addrKey) || receiver?.image || ''
      } else if (event.type === 'Redeemed' && event.redemption) {
        const sender = event.redemption.sender
        memberAddress = sender?.id || ''
        const addrKey = sender?.id?.toLowerCase() || ''
        memberLabel = walletToLabel.get(addrKey) || sender?.label || 'User'
        memberImage = walletToImage.get(addrKey) || sender?.image || ''
      }

      if (!memberAddress) continue

      // Get page info from triple object
      const pageLabel = event.triple?.object?.label || ''
      const objectWithValue = event.triple?.object as {
        label?: string | null
        term_id: string
        value?: { thing?: { url?: string | null } | null } | null
      }
      const pageUrl = objectWithValue?.value?.thing?.url || (pageLabel.startsWith('http') ? pageLabel : `https://${pageLabel}`)
      const domain = getDomain(pageUrl)

      items.push({
        id: event.id,
        tripleTermId: event.triple?.term_id || '',
        counterTermId: event.triple?.counter_term_id || '',
        intentionType,
        tripleSubject: event.triple?.subject?.label || 'I',
        triplePredicate: event.triple?.predicate?.label || '',
        tripleObject: event.triple?.object?.label || '',
        pageLabel: pageLabel || domain,
        pageUrl,
        domain,
        memberAddress,
        memberLabel,
        memberImage,
        createdAt: event.created_at
      })
    }

    setFeedItems(items)
  }, [eventsData, walletToLabel, walletToImage])

  // Group feed items by pageUrl + memberAddress to avoid duplicate cards
  const groupedItems = useMemo(() => {
    const groups = new Map<string, GroupedFeedItem>()

    for (const item of feedItems) {
      const key = `${item.pageUrl}::${item.memberAddress.toLowerCase()}`
      const existing = groups.get(key)

      if (existing) {
        // Only add if this intention type isn't already present
        if (!existing.intentions.some(i => i.intentionType === item.intentionType)) {
          existing.intentions.push(item)
        }
        // Keep the most recent createdAt
        if (item.createdAt > existing.createdAt) {
          existing.createdAt = item.createdAt
        }
      } else {
        groups.set(key, {
          groupKey: key,
          pageLabel: item.pageLabel,
          pageUrl: item.pageUrl,
          domain: item.domain,
          memberAddress: item.memberAddress,
          memberLabel: item.memberLabel,
          memberImage: item.memberImage,
          createdAt: item.createdAt,
          intentions: [item]
        })
      }
    }

    return [...groups.values()]
  }, [feedItems])

  // Filter grouped items by active category
  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return groupedItems
    return groupedItems.filter(group =>
      group.intentions.some(i => i.intentionType === activeFilter)
    )
  }, [groupedItems, activeFilter])

  // Step 4: Check user's existing positions on feed triples (support/oppose state)
  const allTripleIds = useMemo(() => {
    const ids = feedItems.map(item => item.tripleTermId).filter(Boolean)
    return [...new Set(ids)]
  }, [feedItems])

  const { data: userPositionsData } = useFindUserPositionsOnTriplesQuery(
    {
      termIds: allTripleIds,
      address: checksumAddress,
      limit: 500
    },
    {
      enabled: allTripleIds.length > 0 && !!checksumAddress,
      refetchOnWindowFocus: false
    }
  )

  // Build map: itemId → 'support' | 'oppose' (from on-chain + local votes)
  const [localVotes, setLocalVotes] = useState(() => new Map<string, 'support' | 'oppose'>())

  const votedItems = useMemo(() => {
    const map = new Map<string, 'support' | 'oppose'>()

    // On-chain positions (support on term vault, oppose on counter_term vault)
    if (userPositionsData?.triples) {
      for (const triple of userPositionsData.triples) {
        const hasSupport = triple.positions?.some(
          (p) => p.shares && BigInt(p.shares) > 0n
        )
        const hasOppose = triple.counter_term?.vaults?.some((v) =>
          v.positions?.some((p) => p.shares && BigInt(p.shares) > 0n)
        )

        const feedItem = feedItems.find(
          (item) => item.tripleTermId === triple.term_id
        )
        if (feedItem) {
          if (hasSupport) map.set(feedItem.id, "support")
          else if (hasOppose) map.set(feedItem.id, "oppose")
        }
      }
    }

    // Merge local votes (override on-chain if just voted)
    for (const [id, vote] of localVotes) {
      map.set(id, vote)
    }

    return map
  }, [userPositionsData, feedItems, localVotes])

  // Member profile: use useIntentionCategories with member's wallet
  const memberWallet = viewState.type === 'member-profile' || viewState.type === 'member-category'
    ? viewState.address
    : undefined
  const {
    categories: memberCategories,
    selectedCategory: memberSelectedCategory,
    loading: memberCategoriesLoading,
    selectCategory: memberSelectCategory
  } = useIntentionCategories(memberWallet)

  // Support/Oppose deposit system
  const { depositWithPool } = useWeightOnChain()
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transactionSuccess, setTransactionSuccess] = useState(false)
  const [transactionError, setTransactionError] = useState<string | undefined>()
  const [transactionHash, setTransactionHash] = useState<string | undefined>()
  const [selectedItem, setSelectedItem] = useState<CircleFeedItem | null>(null)
  const [selectedVaultId, setSelectedVaultId] = useState<string>('')
  const [selectedAction, setSelectedAction] = useState<'Support' | 'Oppose'>('Support')

  // Intention picker state (shown when a grouped card has multiple intentions)
  const [intentionPickerGroup, setIntentionPickerGroup] = useState<GroupedFeedItem | null>(null)
  const [intentionPickerAction, setIntentionPickerAction] = useState<'Support' | 'Oppose'>('Support')

  const openVoteFlow = (item: CircleFeedItem, action: 'Support' | 'Oppose') => {
    const vaultId = action === 'Support' ? item.tripleTermId : item.counterTermId
    if (!vaultId) return
    setSelectedItem(item)
    setSelectedVaultId(vaultId)
    setSelectedAction(action)
    setIsStakeModalOpen(true)
  }

  const handleSupport = (e: React.MouseEvent, group: GroupedFeedItem) => {
    e.stopPropagation()
    if (!address) return
    if (group.intentions.length === 1) {
      openVoteFlow(group.intentions[0], 'Support')
    } else {
      setIntentionPickerGroup(group)
      setIntentionPickerAction('Support')
    }
  }

  const handleOppose = (e: React.MouseEvent, group: GroupedFeedItem) => {
    e.stopPropagation()
    if (!address) return
    if (group.intentions.length === 1) {
      openVoteFlow(group.intentions[0], 'Oppose')
    } else {
      setIntentionPickerGroup(group)
      setIntentionPickerAction('Oppose')
    }
  }

  const handleIntentionPick = (item: CircleFeedItem) => {
    openVoteFlow(item, intentionPickerAction)
    setIntentionPickerGroup(null)
  }

  const handleStakeModalClose = () => {
    setIsStakeModalOpen(false)
    setSelectedItem(null)
    setSelectedVaultId('')
    setIsProcessing(false)
    setTransactionSuccess(false)
    setTransactionError(undefined)
    setTransactionHash(undefined)
  }

  const handleStakeSubmit = async (customWeights?: (bigint | null)[]): Promise<void> => {
    if (!selectedItem || !selectedVaultId) return
    const weight = customWeights?.[0] || BigInt(Math.floor(0.5 * 1e18))

    try {
      setIsProcessing(true)
      setTransactionError(undefined)
      const result = await depositWithPool(selectedVaultId, weight, 1n)

      if (result.success) {
        setTransactionHash(result.txHash)
        setTransactionSuccess(true)
        // Track local vote state
        const voteType = selectedVaultId === selectedItem.tripleTermId ? 'support' : 'oppose'
        setLocalVotes(prev => new Map(prev).set(selectedItem.id, voteType as 'support' | 'oppose'))
        try {
          await questTrackingService.recordVoteActivity()
          const dailyCount = await questTrackingService.getDailyVoteCount()
          if (address) {
            await goldService.addVoteGold(address, dailyCount)
          }
        } catch {
          // Non-critical, swallow error
        }
      } else {
        setTransactionError(result.error || 'Transaction failed')
      }
    } catch (error) {
      setTransactionError(error instanceof Error ? error.message : 'Transaction failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const loading = trustCircleLoading || eventsLoading
  const refreshing = trustCircleFetching || eventsFetching

  // Refresh feed data
  const handleRefresh = () => {
    refetchTrustCircle()
    refetchEvents()
  }

  // Handle member click
  const handleMemberClick = (memberAddress: string, memberLabel: string, memberImage?: string) => {
    navigateTo("user-profile", {
      termId: "",
      label: memberLabel,
      image: memberImage,
      walletAddress: memberAddress,
      initialTab: "bookmarks"
    })
  }

  // Handle category click in member profile
  const handleMemberCategoryClick = (categoryId: IntentionType) => {
    if (viewState.type === 'member-profile') {
      memberSelectCategory(categoryId)
      setViewState({ ...viewState, type: 'member-category' })
    }
  }

  // Handle back
  const handleBack = () => {
    if (viewState.type === 'member-category') {
      memberSelectCategory(null)
      setViewState({
        type: 'member-profile',
        address: viewState.address,
        label: viewState.label,
        image: viewState.image
      })
    } else {
      setViewState({ type: 'feed' })
    }
  }

  // No wallet
  if (!address) {
    return (
      <div className="circle-feed-tab">
        <div className="circle-empty">
          <h3>Connect Your Wallet</h3>
          <p>Connect your wallet to see your Trust Circle's activity.</p>
        </div>
      </div>
    )
  }

  // Member category detail view
  if (viewState.type === 'member-category' && memberSelectedCategory) {
    return (
      <div className="circle-feed-tab">
        <CategoryDetailView
          category={memberSelectedCategory}
          onBack={handleBack}
        />
      </div>
    )
  }

  // Member profile view
  if (viewState.type === 'member-profile') {
    return (
      <div className="circle-feed-tab">
        <div className="circle-member-header">
          <button className="circle-back-btn" onClick={handleBack}>Back</button>
          <Avatar
            imgSrc={viewState.image}
            name={viewState.address}
            avatarClassName="circle-member-avatar"
            size="medium"
          />
          <h3 className="circle-member-name">{viewState.label}</h3>
        </div>

        {memberCategoriesLoading ? (
          <div className="circle-loading"><SofiaLoader size={150} /></div>
        ) : (
          <div className="circle-categories-grid">
            {memberCategories.map(category => (
              <CategoryCard
                key={category.id}
                category={category}
                onClick={() => handleMemberCategoryClick(category.id)}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Main feed view
  return (
    <div className="circle-feed-tab">
      {/* Category filter chips + Go to Circle link */}
      <div className="circle-top-bar">
        <div className="circle-category-chips">
          <button
            className={`circle-chip ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All
          </button>
          {(Object.entries(INTENTION_CONFIG) as [IntentionType, { label: string; color: string }][]).map(
            ([type, config]) => (
              <button
                key={type}
                className={`circle-chip ${activeFilter === type ? 'active' : ''}`}
                style={{
                  '--chip-color': config.color
                } as React.CSSProperties}
                onClick={() => setActiveFilter(type)}
              >
                {config.label}
              </button>
            )
          )}
        </div>
        <button
          className="circle-go-btn"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? '...' : '↻'}
        </button>
        <button
          className="circle-go-btn"
          onClick={() => {
            setActiveProfileTab('community')
            navigateTo('profile')
          }}
        >
          My Circle
        </button>
      </div>

      {/* Loading */}
      {loading && feedItems.length === 0 && (
        <div className="circle-loading"><SofiaLoader size={150} /></div>
      )}

      {/* Empty: no trust circle */}
      {!loading && trustedWallets.length === 0 && (
        <div className="circle-empty">
          <h3>No Trust Circle</h3>
          <p>Add people to your Trust Circle to see their discoveries.</p>
        </div>
      )}

      {/* Empty: no intention certifications */}
      {!loading && trustedWallets.length > 0 && feedItems.length === 0 && (
        <div className="circle-empty">
          <h3>No Certifications Yet</h3>
          <p>Your circle hasn't certified any pages yet.</p>
        </div>
      )}

      {/* Empty: no results for filter */}
      {!loading && feedItems.length > 0 && filteredItems.length === 0 && (
        <div className="circle-empty">
          <p>No {INTENTION_CONFIG[activeFilter as IntentionType]?.label || ''} certifications from your circle.</p>
        </div>
      )}

      {/* Feed grid */}
      {filteredItems.length > 0 && (
        <div className="circle-grid">
          {filteredItems.map(group => {
            const primaryItem = group.intentions[0]
            return (
              <div
                key={group.groupKey}
                className="circle-card"
                onClick={() => window.open(group.pageUrl, '_blank', 'noopener,noreferrer')}
              >
                {/* Header: favicon + badges */}
                <div className="circle-card-header">
                  <img
                    src={getFaviconUrl(group.domain, 64)}
                    alt=""
                    className="circle-card-favicon"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  <div className="circle-intention-badges">
                    {group.intentions.map(intention => (
                      <span
                        key={intention.intentionType}
                        className="circle-intention-badge"
                        style={{
                          backgroundColor: `${INTENTION_CONFIG[intention.intentionType].color}20`,
                          color: INTENTION_CONFIG[intention.intentionType].color
                        }}
                      >
                        {INTENTION_CONFIG[intention.intentionType].label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Page title */}
                <div className="circle-card-title">{group.pageLabel}</div>

                {/* Footer: member + votes + time */}
                <div className="circle-card-footer">
                  <span
                    className="circle-card-member-name"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMemberClick(group.memberAddress, group.memberLabel, group.memberImage)
                    }}
                  >
                    {group.memberLabel}
                  </span>
                  {group.intentions.some(i => i.tripleTermId) && (
                    <div className="circle-card-actions">
                      <button
                        className={`circle-action-btn circle-support-btn ${group.intentions.some(i => votedItems.get(i.id) === 'support') ? 'voted' : ''}`}
                        onClick={(e) => handleSupport(e, group)}
                        title="Support this certification"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 4l-8 8h5v8h6v-8h5z" />
                        </svg>
                      </button>
                      <button
                        className={`circle-action-btn circle-oppose-btn ${group.intentions.some(i => votedItems.get(i.id) === 'oppose') ? 'voted' : ''}`}
                        onClick={(e) => handleOppose(e, group)}
                        disabled={!group.intentions.some(i => i.counterTermId)}
                        title="Oppose this certification"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 20l8-8h-5V4H9v8H4z" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <span className="circle-card-time">{formatTimestamp(group.createdAt)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Intention picker overlay (when card has multiple intentions) — portaled to body */}
      {intentionPickerGroup && createPortal(
        <div className="circle-picker-overlay" onClick={() => setIntentionPickerGroup(null)}>
          <div className="circle-picker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="circle-picker-title">
              {intentionPickerAction} which intention?
            </div>
            <div className="circle-picker-options">
              {intentionPickerGroup.intentions.map(intention => {
                const config = INTENTION_CONFIG[intention.intentionType]
                const isDisabled = intentionPickerAction === 'Oppose' && !intention.counterTermId
                return (
                  <button
                    key={intention.intentionType}
                    className="circle-picker-option"
                    style={{
                      '--picker-color': config.color
                    } as React.CSSProperties}
                    disabled={isDisabled}
                    onClick={() => handleIntentionPick(intention)}
                  >
                    <span
                      className="circle-intention-badge"
                      style={{
                        backgroundColor: `${config.color}20`,
                        color: config.color
                      }}
                    >
                      {config.label}
                    </span>
                    <span className="circle-picker-label">{intentionPickerGroup.pageLabel}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Support/Oppose weight modal with fee breakdown + GS slider */}
      <WeightModal
        isOpen={isStakeModalOpen}
        triplets={selectedItem ? [{
          id: selectedVaultId,
          triplet: {
            subject: selectedItem.tripleSubject,
            predicate: selectedItem.triplePredicate,
            object: selectedItem.tripleObject
          },
          description: '',
          url: selectedItem.pageUrl,
          intention: predicateLabelToIntentionType(selectedItem.triplePredicate) || undefined
        }] : []}
        isProcessing={isProcessing}
        transactionSuccess={transactionSuccess}
        transactionError={transactionError}
        transactionHash={transactionHash}
        estimateOptions={{ isNewTriple: false, newAtomCount: 0 }}
        submitLabel={selectedAction}
        showXpAnimation={true}
        onClose={handleStakeModalClose}
        onSubmit={handleStakeSubmit}
      />
    </div>
  )
}

export default CircleFeedTab
