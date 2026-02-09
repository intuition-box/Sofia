import { useState, useEffect, useMemo } from 'react'
import { useRouter } from '../../layout/RouterProvider'
import { useWalletFromStorage } from '../../../hooks/useWalletFromStorage'
import { useIntentionCategories } from '../../../hooks/useIntentionCategories'
import {
  useGetTrustCirclePositionsQuery,
  useGetSofiaTrustedActivityQuery
} from '@0xsofia/graphql'
import { SUBJECT_IDS, PREDICATE_IDS } from '../../../lib/config/constants'
import { SOFIA_PROXY_ADDRESS } from '../../../lib/config/chainConfig'
import { getAddress } from 'viem'
import type { IntentionType } from '../../../types/intentionCategories'
import { INTENTION_CONFIG } from '../../../types/intentionCategories'
import CategoryCard from '../../ui/CategoryCard'
import CategoryDetailView from '../../ui/CategoryDetailView'
import Avatar from '../../ui/Avatar'
import '../../styles/CircleFeedTab.css'
import '../../styles/CategoryStyles.css'

// Intention predicate labels from on-chain
const INTENTION_PREDICATE_LABELS = [
  'visits for work',
  'visits for learning',
  'visits for learning ', // legacy trailing space
  'visits for fun',
  'visits for inspiration',
  'visits for buying'
]

// Map predicate label to IntentionType
const predicateLabelToType = (label: string): IntentionType | null => {
  const trimmed = label.trim().toLowerCase()
  if (trimmed === 'visits for work') return 'work'
  if (trimmed === 'visits for learning') return 'learning'
  if (trimmed === 'visits for fun') return 'fun'
  if (trimmed === 'visits for inspiration') return 'inspiration'
  if (trimmed === 'visits for buying') return 'buying'
  return null
}

// Get favicon URL from domain
const getFaviconUrl = (domain: string): string => {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
}

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

  // Step 1: Get Trust Circle members
  const { data: trustCircleData, isLoading: trustCircleLoading } = useGetTrustCirclePositionsQuery(
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
  }, [trustCircleData])

  // Step 2: Get events from trusted wallets
  const { data: eventsData, isLoading: eventsLoading } = useGetSofiaTrustedActivityQuery(
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

      const intentionType = predicateLabelToType(predicateLabel)
      if (!intentionType) continue

      // Get member info
      let memberAddress = ''
      let memberLabel = ''
      let memberImage = ''

      if (event.type === 'Deposited' && event.deposit) {
        const receiver = event.deposit.receiver
        memberAddress = receiver?.id || ''
        memberLabel = receiver?.label || walletToLabel.get(receiver?.id?.toLowerCase() || '') || 'User'
        memberImage = receiver?.image || walletToImage.get(receiver?.id?.toLowerCase() || '') || ''
      } else if (event.type === 'Redeemed' && event.redemption) {
        const sender = event.redemption.sender
        memberAddress = sender?.id || ''
        memberLabel = sender?.label || walletToLabel.get(sender?.id?.toLowerCase() || '') || 'User'
        memberImage = sender?.image || walletToImage.get(sender?.id?.toLowerCase() || '') || ''
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

  const loading = trustCircleLoading || eventsLoading

  // Handle member click
  const handleMemberClick = (memberAddress: string, memberLabel: string, memberImage?: string) => {
    setViewState({ type: 'member-profile', address: memberAddress, label: memberLabel, image: memberImage })
    memberSelectCategory(null)
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
        address: (viewState as any).address,
        label: (viewState as any).label,
        image: (viewState as any).image
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
          onClick={() => {
            setActiveProfileTab('community')
            navigateTo('profile')
          }}
        >
          Go to your Circle
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
              {/* Domain header */}
              <div className="circle-card-domain">
                <img
                  src={getFaviconUrl(item.domain)}
                  alt=""
                  className="circle-card-favicon"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
                <span className="circle-card-domain-text">{item.domain}</span>
              </div>

              {/* Page title */}
              <div className="circle-card-title">{item.pageLabel}</div>

              {/* Footer: intention badge + member + time */}
              <div className="circle-card-footer">
                <span
                  className="circle-intention-badge"
                  style={{
                    backgroundColor: `${INTENTION_CONFIG[item.intentionType].color}20`,
                    color: INTENTION_CONFIG[item.intentionType].color
                  }}
                >
                  {INTENTION_CONFIG[item.intentionType].label}
                </span>
                <div className="circle-card-member">
                  <span
                    className="circle-card-member-name"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMemberClick(item.memberAddress, item.memberLabel, item.memberImage)
                    }}
                  >
                    {item.memberLabel}
                  </span>
                  <span className="circle-card-time">{formatTimestamp(item.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CircleFeedTab
