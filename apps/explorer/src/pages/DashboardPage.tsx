import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useSearchParams } from 'react-router-dom'
import { useCircleFeed } from '../hooks/useCircleFeed'
import { useAllActivity } from '../hooks/useAllActivity'
import type { CircleItem } from '../services/circleService'
import { PLATFORM_CATALOG } from '../config/platformCatalog' // kept for getPlatformIdsForTopic helper
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { ScrollArea } from '../components/ui/scroll-area'
import { Button } from '../components/ui/button'
import { Users, Globe, X } from 'lucide-react'
import SofiaLoader from '../components/ui/SofiaLoader'
import { useEnsNames } from '../hooks/useEnsNames'
import type { Address } from 'viem'
import PageHeader from '../components/PageHeader'
import PredicatePicker from '../components/PredicatePicker'
import QuestCard from '../components/QuestCard'
import CircleCard from '../components/CircleCard'
import { useCart } from '../hooks/useCart'
import type { CartItem } from '../hooks/useCart'
import { PAGE_COLORS } from '../config/pageColors'
import { INTENTION_COLORS } from '../config/intentions'
import '@/components/styles/pages.css'

/** Build a Set of platform IDs that belong to a given Sofia topic */
function getPlatformIdsForTopic(topicId: string): Set<string> {
  const ids = new Set<string>()
  for (const p of PLATFORM_CATALOG) {
    if (p.targetTopics.includes(topicId)) {
      ids.add(p.id)
    }
  }
  return ids
}

/** Check if a feed item's hostname matches any platform in a set */
function itemMatchesTopic(item: CircleItem, platformIds: Set<string>): boolean {
  const host = item.domain.toLowerCase()
  for (const pid of platformIds) {
    if (host.includes(pid)) return true
  }
  return false
}

const INTENT_FILTERS = ['All', 'Trusted', 'Distrusted', 'Work', 'Learning', 'Fun', 'Inspiration']

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filter, setFilter] = useState<'all' | 'circle'>('all')
  const [intentFilter, setIntentFilter] = useState('All')
  const { authenticated, user } = usePrivy()
  const walletAddress = user?.wallet?.address
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Cart system
  const cart = useCart()
  const [predicatePicker, setPredicatePicker] = useState<{ side: 'support' | 'oppose'; item: CircleItem } | null>(null)

  /** Called when user clicks Support/Oppose on a card */
  const handleDeposit = useCallback((side: 'support' | 'oppose', item: CircleItem) => {
    if (!authenticated || !walletAddress) return
    // Filter intentions that have vault IDs for this side
    const available = item.intentions.filter((intent) => {
      const vault = item.intentionVaults[intent]
      if (!vault) return false
      return side === 'support' ? !!vault.termId : !!vault.counterTermId
    })

    if (available.length === 0) return

    if (available.length === 1) {
      // Single intention → add directly to cart
      const intent = available[0]
      const vault = item.intentionVaults[intent]
      const color = INTENTION_COLORS[intent] ?? '#888'
      cart.addItem({
        id: `${vault.termId}-${side}`,
        side,
        termId: side === 'support' ? vault.termId : vault.counterTermId,
        intention: intent,
        title: item.title,
        favicon: item.favicon,
        intentionColor: color,
      })
    } else {
      // Multiple intentions → show predicate picker
      setPredicatePicker({ side, item })
    }
  }, [authenticated, cart])

  /** Called from PredicatePicker when user confirms selection */
  const handlePredicateConfirm = useCallback((selectedIntentions: string[]) => {
    if (!predicatePicker) return
    const { side, item } = predicatePicker
    const newItems: CartItem[] = selectedIntentions.map((intent) => {
      const vault = item.intentionVaults[intent]
      const color = INTENTION_COLORS[intent] ?? '#888'
      return {
        id: `${vault.termId}-${side}`,
        side,
        termId: side === 'support' ? vault.termId : vault.counterTermId,
        intention: intent,
        title: item.title,
        favicon: item.favicon,
        intentionColor: color,
      }
    })
    cart.addItems(newItems)
    setPredicatePicker(null)
  }, [predicatePicker, cart])

  const spaceParam = searchParams.get('space') || ''

  const spacePlatformIds = useMemo(
    () => (spaceParam ? getPlatformIdsForTopic(spaceParam) : null),
    [spaceParam],
  )

  const clearSpace = () => {
    searchParams.delete('space')
    setSearchParams(searchParams)
  }

  const { items: allItems, loading: allLoading, loadingMore: allLoadingMore, error: allError, hasMore: allHasMore, loadMore: allLoadMore } = useAllActivity()
  const { items: circleItems, loading: circleLoading, loadingMore: circleLoadingMore, error: circleError, hasMore: circleHasMore, loadMore: circleLoadMore } = useCircleFeed(
    filter === 'circle' ? walletAddress : undefined,
  )

  const sourceItems = filter === 'all' ? allItems : circleItems
  const loadingMore = filter === 'all' ? allLoadingMore : circleLoadingMore
  const hasMore = filter === 'all' ? allHasMore : circleHasMore
  const loadMore = filter === 'all' ? allLoadMore : circleLoadMore

  const allCertifiers = useMemo(() => {
    const addrs = new Set<Address>()
    for (const item of sourceItems) {
      if (item.certifierAddress) addrs.add(item.certifierAddress as Address)
    }
    return [...addrs]
  }, [sourceItems])

  const { getDisplay, getAvatar } = useEnsNames(allCertifiers)
  const loading = filter === 'all' ? allLoading : circleLoading
  const feedError = filter === 'all' ? allError : circleError

  // Apply space filter then intention filter
  const spaceFiltered = spacePlatformIds
    ? sourceItems.filter((item) => itemMatchesTopic(item, spacePlatformIds))
    : sourceItems

  const filteredItems = intentFilter === 'All'
    ? spaceFiltered
    : spaceFiltered.filter((item) => item.intentions.includes(intentFilter))

  // Infinite scroll observer — large rootMargin triggers loading well before bottom
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore() },
      { rootMargin: '1500px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [filter, loadMore, filteredItems.length])

  const spaceLabel = spaceParam
    ? spaceParam.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : ''

  const pc = PAGE_COLORS['/feed']

  return (
    <div>
      <PageHeader color={pc.color} glow={pc.glow} title={pc.title} subtitle={pc.subtitle} />
      <div className="space-y-4 page-content page-enter">
      {/* Feed mode toggle */}
      <div className="flex items-center gap-3 mb-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setFilter('all'); setIntentFilter('All') }}
        >
          <Globe className="h-3 w-3 mr-1" />
          All Activity
        </Button>
        <Button
          variant={filter === 'circle' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setFilter('circle'); setIntentFilter('All') }}
          disabled={!authenticated}
        >
          <Users className="h-3 w-3 mr-1" />
          My Circle
        </Button>
      </div>

      {/* Space filter badge */}
      {spaceParam && (
        <div className="dp-space-filter">
          <Badge variant="secondary" className="dp-space-badge">
            {spaceLabel}
            <button onClick={clearSpace} className="dp-space-close">
              <X className="dp-space-close-icon" />
            </button>
          </Badge>
        </div>
      )}

      {/* Intention filters */}
      <ScrollArea className="w-full mb-2">
        <div className="flex gap-2 pb-2">
          {INTENT_FILTERS.map((intent) => {
            const isActive = intentFilter === intent
            const color = INTENTION_COLORS[intent]
            return (
              <button
                key={intent}
                className="feed-intent-pill"
                data-active={isActive || undefined}
                style={color ? { '--pill-color': color } as React.CSSProperties : undefined}
                onClick={() => setIntentFilter(intent)}
              >
                {intent}
              </button>
            )
          })}
        </div>
      </ScrollArea>

      {/* Loading */}
      {loading && (
        <div className="flex items-start justify-center page-loader">
          <SofiaLoader size={96} />
        </div>
      )}

      {/* Error */}
      {!loading && feedError && (
        <Card className="p-6 text-center">
          <p className="text-sm text-destructive-foreground">{feedError}</p>
        </Card>
      )}

      {/* Feed */}
      {!loading && (
        <>
          {filteredItems.length === 0 ? (
            <Card className="p-10 text-center">
              {filter === 'circle' ? (
                <>
                  <Users className="h-10 w-10 mx-auto text-muted-foreground/40" />
                  <h3 className="mt-4 font-medium">Your Circle</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {circleItems.length === 0
                      ? 'Certify pages and trust users to build your circle.'
                      : `No ${intentFilter.toLowerCase()} items in your circle.`}
                  </p>
                </>
              ) : (
                <>
                  <Globe className="h-10 w-10 mx-auto text-muted-foreground/40" />
                  <h3 className="mt-4 font-medium">No activity yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Recent certifications will appear here.
                  </p>
                </>
              )}
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                {filteredItems.map((item) => {
                  const addr = item.certifierAddress as Address
                  const name = addr ? getDisplay(addr) : item.certifier
                  const av = addr ? getAvatar(addr) : ''
                  const isQuest = item.intentions[0]?.startsWith('quest:')
                  const priv = filter === 'all'
                  return isQuest
                    ? <QuestCard key={item.id} item={item} displayName={name} avatar={av} isPrivate={priv} />
                    : <CircleCard key={item.id} item={item} displayName={name} avatar={av} isPrivate={priv} onDeposit={handleDeposit} />
                })}
              </div>

              {/* Infinite scroll sentinel */}
              {hasMore && (
                <div ref={sentinelRef} className="flex justify-center py-6">
                  {loadingMore && <SofiaLoader size={40} />}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Predicate picker (multi-intention cards) */}
      {predicatePicker && (
        <PredicatePicker
          isOpen
          side={predicatePicker.side}
          item={predicatePicker.item}
          onConfirm={handlePredicateConfirm}
          onClose={() => setPredicatePicker(null)}
        />
      )}
    </div>
    </div>
  )
}
