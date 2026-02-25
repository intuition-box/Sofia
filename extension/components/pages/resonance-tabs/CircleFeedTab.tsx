import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'

import {
  useGetTrustCirclePositionsQuery,
  useGetSofiaTrustedActivityQuery
} from '@0xsofia/graphql'
import { getAddress } from 'viem'

import { useRouter } from '../../layout/RouterProvider'
import { useWalletFromStorage, useIntentionCategories, useVoteOnTriple, useTripleVotes } from '~/hooks'
import { SUBJECT_IDS, PREDICATE_IDS } from '~/lib/config/constants'
import { SOFIA_PROXY_ADDRESS } from '~/lib/config/chainConfig'
import { getFaviconUrl, batchResolveEns } from '~/lib/utils'
import type { IntentionType } from '~/types/intentionCategories'
import { INTENTION_CONFIG, predicateLabelToIntentionType } from '~/types/intentionCategories'
import type { VoteType } from '~/hooks'

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
  intentionType: IntentionType
  pageLabel: string
  pageUrl: string
  domain: string
  memberAddress: string
  memberLabel: string
  memberImage: string
  createdAt: string
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
  const [walletToLabel, setWalletToLabel] = useState<Map<string, string>>(new Map())
  const [walletToImage, setWalletToImage] = useState<Map<string, string>>(new Map())

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
        intentionType,
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

  // Filter items by active category
  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return feedItems
    return feedItems.filter(item => item.intentionType === activeFilter)
  }, [feedItems, activeFilter])

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

  // Vote system
  const tripleTermIds = useMemo(
    () => feedItems.map(item => item.tripleTermId).filter(Boolean),
    [feedItems]
  )
  const { votesMap, refetch: refetchVotes } = useTripleVotes(tripleTermIds, address || null)
  const { vote, loading: voteLoading, error: voteError, success: voteSuccess, reset: resetVote, votingTripleId } = useVoteOnTriple()

  // Vote confirmation modal state
  const [pendingVote, setPendingVote] = useState<{
    tripleTermId: string
    voteType: VoteType
    objectLabel: string
    intentionType: IntentionType
  } | null>(null)
  const [voteTransactionSuccess, setVoteTransactionSuccess] = useState(false)
  const [voteTransactionError, setVoteTransactionError] = useState<string | null>(null)

  // Sync vote hook states to modal states
  useEffect(() => {
    if (!voteLoading && pendingVote) {
      if (voteSuccess) {
        setVoteTransactionSuccess(true)
        setVoteTransactionError(null)
        refetchVotes()
      } else if (voteError) {
        setVoteTransactionError(voteError)
        setVoteTransactionSuccess(false)
      }
    }
  }, [voteLoading, voteSuccess, voteError, pendingVote])

  const handleVote = (e: React.MouseEvent, tripleTermId: string, voteType: VoteType, objectLabel: string, intentionType: IntentionType) => {
    e.stopPropagation()
    if (!address || !tripleTermId) return
    setVoteTransactionSuccess(false)
    setVoteTransactionError(null)
    resetVote()
    setPendingVote({ tripleTermId, voteType, objectLabel, intentionType })
  }

  const handleVoteSubmit = async (customWeights?: (bigint | null)[]) => {
    if (!pendingVote) return
    const stakeAmount = customWeights?.[0] ?? undefined
    await vote(pendingVote.tripleTermId, pendingVote.voteType, stakeAmount)
  }

  const handleVoteModalClose = () => {
    setPendingVote(null)
    setVoteTransactionSuccess(false)
    setVoteTransactionError(null)
    resetVote()
  }

  const loading = trustCircleLoading || eventsLoading
  const refreshing = trustCircleFetching || eventsFetching

  // Refresh feed data
  const handleRefresh = () => {
    refetchTrustCircle()
    refetchEvents()
    refetchVotes()
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
          <div className="circle-loading">Loading certifications...</div>
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
        <div className="circle-loading">Loading Trust Circle activity...</div>
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
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="circle-card"
              onClick={() => window.open(item.pageUrl, '_blank', 'noopener,noreferrer')}
            >
              {/* Header: favicon + badge */}
              <div className="circle-card-header">
                <img
                  src={getFaviconUrl(item.domain, 64)}
                  alt=""
                  className="circle-card-favicon"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
                <span
                  className="circle-intention-badge"
                  style={{
                    backgroundColor: `${INTENTION_CONFIG[item.intentionType].color}20`,
                    color: INTENTION_CONFIG[item.intentionType].color
                  }}
                >
                  {INTENTION_CONFIG[item.intentionType].label}
                </span>
              </div>

              {/* Page title */}
              <div className="circle-card-title">{item.pageLabel}</div>

              {/* Footer: member + votes + time */}
              <div className="circle-card-footer">
                <span
                  className="circle-card-member-name"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMemberClick(item.memberAddress, item.memberLabel, item.memberImage)
                  }}
                >
                  {item.memberLabel}
                </span>
                {item.tripleTermId && (
                  <div className="circle-card-votes">
                    <button
                      className={`circle-vote-btn circle-vote-up ${votesMap.get(item.tripleTermId)?.userVote === 'like' ? 'active' : ''}`}
                      onClick={(e) => handleVote(e, item.tripleTermId, 'like', item.pageLabel, item.intentionType)}
                      disabled={voteLoading && votingTripleId === item.tripleTermId}
                      title="Like this certification"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 4l-8 8h5v8h6v-8h5z" />
                      </svg>
                    </button>
                    <span className="circle-vote-count">
                      {(votesMap.get(item.tripleTermId)?.likeCount || 0) - (votesMap.get(item.tripleTermId)?.dislikeCount || 0)}
                    </span>
                    <button
                      className={`circle-vote-btn circle-vote-down ${votesMap.get(item.tripleTermId)?.userVote === 'dislike' ? 'active' : ''}`}
                      onClick={(e) => handleVote(e, item.tripleTermId, 'dislike', item.pageLabel, item.intentionType)}
                      disabled={voteLoading && votingTripleId === item.tripleTermId}
                      title="Dislike this certification"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 20l8-8h-5V4H9v8H4z" />
                      </svg>
                    </button>
                  </div>
                )}
                <span className="circle-card-time">{formatTimestamp(item.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vote confirmation modal */}
      {pendingVote && createPortal(
        <WeightModal
          isOpen={!!pendingVote}
          triplets={[{
            id: `vote-${pendingVote.tripleTermId}`,
            triplet: {
              subject: 'I',
              predicate: pendingVote.voteType,
              object: pendingVote.objectLabel
            },
            description: '',
            url: '',
            intention: pendingVote.intentionType
          }]}
          isProcessing={voteLoading}
          transactionSuccess={voteTransactionSuccess}
          transactionError={voteTransactionError || undefined}
          estimateOptions={{ isNewTriple: true, newAtomCount: 0 }}
          submitLabel="Vote"
          onClose={handleVoteModalClose}
          onSubmit={handleVoteSubmit}
        />,
        document.body
      )}
    </div>
  )
}

export default CircleFeedTab
