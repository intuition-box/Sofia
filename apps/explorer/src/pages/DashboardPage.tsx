import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useSearchParams } from 'react-router-dom'
import { useAllActivity } from '../hooks/useAllActivity'
import type { CircleItem } from '../services/circleService'
import { PLATFORM_CATALOG } from '../config/platformCatalog' // kept for getPlatformIdsForTopic helper
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { ScrollArea } from '../components/ui/scroll-area'
import { Button } from '../components/ui/button'
import { Globe, Search, X, XCircle } from 'lucide-react'
import SofiaLoader from '../components/ui/SofiaLoader'
import { useEnsNames } from '../hooks/useEnsNames'
import type { Address } from 'viem'
import { PageHero } from '@0xsofia/design-system'
import PredicatePicker from '../components/PredicatePicker'
import QuestCard from '../components/QuestCard'
import CircleCard from '../components/CircleCard'
import FeedCard from '../components/home/FeedCard'
import InterestTilesGrid from '../components/home/InterestTilesGrid'
import type { InterestPreset } from '../components/home/useInterestTiles'
import { useTaxonomy } from '../hooks/useTaxonomy'
import { INTENTION_PASTEL } from '@0xsofia/design-system'
import { useCart } from '../hooks/useCart'
import type { CartItem } from '../hooks/useCart'
import { PAGE_COLORS } from '../config/pageColors'
import { INTENTION_COLORS } from '../config/intentions'
import '@/components/styles/pages.css'
import '@/components/styles/home.css'

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
  const [intentFilter, setIntentFilter] = useState('All')
  // Drill preset — when set, the feed filters to this topic/verb and the
  // tiles grid is hidden. `null` = tiles view.
  const [drill, setDrill] = useState<InterestPreset | null>(null)
  // Search query applied to the tiles view (filters topic + verb labels).
  const [tileQuery, setTileQuery] = useState('')
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

  const {
    items: sourceItems,
    loading,
    loadingMore,
    error: feedError,
    hasMore,
    loadMore,
  } = useAllActivity()

  const allCertifiers = useMemo(() => {
    const addrs = new Set<Address>()
    for (const item of sourceItems) {
      if (item.certifierAddress) addrs.add(item.certifierAddress as Address)
    }
    return [...addrs]
  }, [sourceItems])

  const { getDisplay, getAvatar } = useEnsNames(allCertifiers)

  // Apply space filter then drill preset (from tile click) then intention
  // filter. Drill narrows the items by topic slug or verb.
  const spaceFiltered = spacePlatformIds
    ? sourceItems.filter((item) => itemMatchesTopic(item, spacePlatformIds))
    : sourceItems

  const drillFiltered = !drill
    ? spaceFiltered
    : drill.kind === 'topic'
      ? spaceFiltered.filter((item) => item.topicContexts.includes(drill.id))
      : spaceFiltered.filter((item) =>
          item.intentions.some((i) => i.toLowerCase() === drill.id.toLowerCase()),
        )

  const filteredItems = intentFilter === 'All'
    ? drillFiltered
    : drillFiltered.filter((item) => item.intentions.includes(intentFilter))

  const { topics } = useTaxonomy()
  const drillLabel = useMemo(() => {
    if (!drill) return ''
    if (drill.kind === 'verb') return drill.id[0].toUpperCase() + drill.id.slice(1)
    return topics.find((t) => t.id === drill.id)?.label ?? drill.id
  }, [drill, topics])
  const drillColor = useMemo(() => {
    if (!drill) return undefined
    if (drill.kind === 'verb') {
      return (
        INTENTION_PASTEL[drill.id as keyof typeof INTENTION_PASTEL] ??
        'var(--ds-accent)'
      )
    }
    return topics.find((t) => t.id === drill.id)?.color ?? 'var(--ds-accent)'
  }, [drill, topics])

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
  }, [loadMore, filteredItems.length])

  const spaceLabel = spaceParam
    ? spaceParam.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : ''

  const pc = PAGE_COLORS['/feed']

  return (
    <div>
      <PageHero background={pc.color} title={pc.title} description={pc.subtitle} />
      <div className="space-y-4 page-content page-enter">

      {/* Tiles view — default. Shows the interest masonry built from the
          current source items (All or Circle). Click a tile to drill. */}
      {drill == null && !loading && (
        <>
          <div className="hm-head">
            <h2>What are you <em>into</em> today?</h2>
            <p className="hm-sub">Pick a topic to see URLs endorsed across every circle you follow.</p>
          </div>
          <div className="hm-search">
            <Search className="hm-search-icon h-3.5 w-3.5" aria-hidden="true" />
            <input
              type="search"
              className="hm-search-input"
              placeholder="Search topics or intents…"
              value={tileQuery}
              onChange={(e) => setTileQuery(e.target.value)}
              aria-label="Search topics or intents"
            />
            {tileQuery && (
              <button
                type="button"
                className="hm-search-clear"
                onClick={() => setTileQuery('')}
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <InterestTilesGrid items={spaceFiltered} onPick={setDrill} query={tileQuery} />
        </>
      )}

      {/* Drill-down header — only when a preset is active. Inherits the
          picked tile's colour so the drill visually echoes the tile. */}
      {drill && (
        <div
          className="hm-drill-head"
          style={drillColor ? ({ ['--drill-color' as string]: drillColor }) : undefined}
        >
          <span className="hm-drill-kind">{drill.kind === 'verb' ? 'Verb' : 'Topic'}</span>
          <span className="hm-drill-label">{drillLabel}</span>
          <span className="hm-drill-count">
            {filteredItems.length} {filteredItems.length === 1 ? 'url' : 'urls'}
          </span>
          <button
            type="button"
            className="hm-drill-clear"
            onClick={() => setDrill(null)}
          >
            <XCircle className="h-3.5 w-3.5" />
            Clear filter
          </button>
        </div>
      )}

      {/* Feed — drill view only. The tiles masonry replaces the feed
          by default; clicking a tile sets `drill` and reveals this. */}
      {drill && (
        <>

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

      {/* Intention filters — hidden when drilling on a verb (the drill
          preset is already narrowing by intent, so the pills would
          either duplicate or contradict it). */}
      {drill?.kind !== 'verb' && (
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
      )}

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
              <Globe className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <h3 className="mt-4 font-medium">No activity yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Recent certifications will appear here.
              </p>
            </Card>
          ) : (
            <>
              <div className="hm-drill-grid">
                {filteredItems.map((item) => {
                  const addr = item.certifierAddress as Address
                  const name = addr ? getDisplay(addr) : item.certifier
                  const av = addr ? getAvatar(addr) : ''
                  const isQuest = item.intentions[0]?.startsWith('quest:')
                  return isQuest
                    ? <QuestCard key={item.id} item={item} displayName={name} avatar={av} />
                    : <FeedCard key={item.id} item={item} displayName={name} avatar={av} onDeposit={handleDeposit} />
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
