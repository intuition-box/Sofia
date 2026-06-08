import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useSearchParams } from 'react-router-dom'
import { useAllActivity } from '../hooks/useAllActivity'
import type { CircleItem } from '../services/circleService'
import { PLATFORM_CATALOG } from '../config/platformCatalog' // kept for getPlatformIdsForTopic helper
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Search, X, Globe } from 'lucide-react'
import SofiaLoader from '../components/ui/SofiaLoader'
import { useEnsNames } from '../hooks/useEnsNames'
import type { Address } from 'viem'
import { PageHero } from '@0xsofia/design-system'
import FeedCard from '../components/home/FeedCard'
import { EmptyFeedState } from '../components/EmptyFeedState'
import { FeedCardSkeleton } from '../components/FeedCardSkeleton'
import InterestTilesGrid from '../components/home/InterestTilesGrid'
import ScrollToTopButton from '../components/ScrollToTopButton'
import type { InterestPreset } from '../components/home/useInterestTiles'
import { useTaxonomy } from '../hooks/useTaxonomy'
import { INTENTION_PASTEL } from '@0xsofia/design-system'
import { useCart } from '../hooks/useCart'
import type { CartItem } from '../hooks/useCart'
import { PAGE_COLORS } from '../config/pageColors'
import { SOFIA_TOPICS } from '../config/taxonomy'
import { displayLabelToIntentionType } from '../config/intentions'
import CircleVerbFilter, {
  type VerbFilterId,
} from '../components/circles/CircleVerbFilter'
import '@/components/styles/pages.css'
import '@/components/styles/home.css'
import '@/components/styles/circles.css'

/** Rotating phrases shown while the Explore feed loads. */
const EXPLORE_LOADER_MESSAGES = [
  'Gathering signals from your trust circle…',
  'Reading the latest certifications on-chain…',
  'Mapping what people actually trust…',
  'Curating discoveries worth your time…',
  'Connecting atoms across the graph…',
  'Almost there — sorting the freshest activity…'
]

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

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  // Drill preset lives in the URL (?topic=<id> / ?verb=<id>) so it earns a
  // history entry — browser Back returns to the Explore tiles instead of
  // leaving the page — and the drill is shareable. `null` = tiles view.
  const drillTopic = searchParams.get('topic')
  const drillVerb = searchParams.get('verb')
  const drill = useMemo<InterestPreset | null>(
    () =>
      drillTopic
        ? { kind: 'topic', id: drillTopic }
        : drillVerb
          ? { kind: 'verb', id: drillVerb }
          : null,
    [drillTopic, drillVerb],
  )
  const setDrill = useCallback(
    (preset: InterestPreset | null) => {
      const next = new URLSearchParams(searchParams)
      next.delete('topic')
      next.delete('verb')
      if (preset) next.set(preset.kind, preset.id)
      setSearchParams(next)
    },
    [searchParams, setSearchParams],
  )
  // Search query applied to the tiles view (filters topic + verb labels).
  const [tileQuery, setTileQuery] = useState('')
  // Verb sub-filter shown inside a TOPIC drill — narrows the drilled feed to
  // one intention. Resets whenever the drill target changes.
  const [verbFilter, setVerbFilter] = useState<VerbFilterId>('all')
  const { authenticated, user } = usePrivy()
  const walletAddress = user?.wallet?.address
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Cart system
  const cart = useCart()
  /**
   * Like / dislike — stakes the cert's "in context of <topic>" nested
   * triples, NOT the per-verb vaults. One click adds a position on every
   * topic context (support → `termId`, oppose → `counterTermId`), so there's
   * no verb picker / modal. A cert with no topic context has nothing to
   * stake here — the card renders its thumbs disabled, so this is a no-op.
   */
  const handleDeposit = useCallback(
    (side: 'support' | 'oppose', item: CircleItem) => {
      if (!authenticated || !walletAddress) return
      const contexts = item.contextTriples.filter((c) =>
        side === 'support' ? !!c.termId : !!c.counterTermId,
      )
      if (contexts.length === 0) return
      const newItems: CartItem[] = contexts.map((c) => {
        const meta = SOFIA_TOPICS.find((t) => t.id === c.topicSlug)
        const termId = side === 'support' ? c.termId : c.counterTermId
        return {
          id: `${termId}-${side}`,
          side,
          termId,
          intention: meta?.label ?? c.topicSlug,
          title: item.title,
          favicon: item.favicon,
          intentionColor: meta?.color ?? '#888',
        }
      })
      cart.addItems(newItems)
    },
    [authenticated, walletAddress, cart],
  )

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

  // Apply space filter then drill preset (from tile click). Drill narrows
  // the items by topic slug or verb.
  const spaceFiltered = spacePlatformIds
    ? sourceItems.filter((item) => itemMatchesTopic(item, spacePlatformIds))
    : sourceItems

  const drillFiltered = !drill
    ? spaceFiltered
    : drill.kind === 'topic'
      ? spaceFiltered.filter((item) => item.topicContexts.includes(drill.id))
      : spaceFiltered.filter((item) =>
          item.intentions.some(
            (i) => i.toLowerCase() === drill.id.toLowerCase(),
          ),
        )

  // Reset the verb sub-filter when the drill target changes.
  useEffect(() => {
    setVerbFilter('all')
  }, [drillTopic, drillVerb])

  // Verb sub-filter only applies inside a topic drill.
  const filteredItems = useMemo(() => {
    if (drill?.kind !== 'topic' || verbFilter === 'all') return drillFiltered
    return drillFiltered.filter((item) =>
      item.intentions.some(
        (l) => displayLabelToIntentionType(l) === verbFilter,
      ),
    )
  }, [drillFiltered, drill, verbFilter])

  const { topics } = useTaxonomy()
  const drillLabel = useMemo(() => {
    if (!drill) return ''
    if (drill.kind === 'verb')
      return drill.id[0].toUpperCase() + drill.id.slice(1)
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
      ([entry]) => {
        if (entry.isIntersecting) loadMore()
      },
      { rootMargin: '1500px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore, filteredItems.length])

  // Drill filters are client-side — if very few items match the current
  // drill preset but `hasMore` is true, aggressively pull more pages
  // until either we have a decent sample or we exhaust the backend.
  useEffect(() => {
    if (!drill) return
    if (!hasMore || loadingMore) return
    if (filteredItems.length >= 20) return
    loadMore()
  }, [drill, hasMore, loadingMore, filteredItems.length, loadMore])

  const spaceLabel = spaceParam
    ? spaceParam.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : ''

  const pc = PAGE_COLORS['/explore']

  return (
    <div>
      {/* Breadcrumb — sits above the banner (matching the rest of the app).
        The drill is a URL param, so the Explore crumb and the browser Back
        button both return to the Explore tiles. */}
      {drill && (
        <nav className="dp-crumbs dp-crumbs--top" aria-label="Breadcrumb">
          <button
            type="button"
            className="dp-crumb dp-crumb--link"
            onClick={() => setDrill(null)}
          >
            Explore
          </button>
          <span className="dp-crumb-sep" aria-hidden="true">
            /
          </span>
          <span className="dp-crumb dp-crumb--current">{drillLabel}</span>
        </nav>
      )}
      <PageHero
        background={drill ? (drillColor ?? pc.color) : pc.color}
        title={drill ? drillLabel : pc.title}
        description={drill ? '' : pc.subtitle}
        icon={<Globe />}
      />
      <div className="space-y-4 page-content page-enter">
        {/* Initial load — the feed fetch is slow, so keep users patient with
          the Sofia loader and rotating phrases. Shown regardless of drill
          state since both views below are gated on `!loading`. */}
        {loading && (
          <div className="flex items-start justify-center page-loader">
            <SofiaLoader size={96} messages={EXPLORE_LOADER_MESSAGES} />
          </div>
        )}

        {/* Tiles view — default. Shows the interest masonry built from the
          current source items (All or Circle). Click a tile to drill. */}
        {drill == null && !loading && (
          <>
            <div className="hm-search">
              <Search
                className="hm-search-icon h-3.5 w-3.5"
                aria-hidden="true"
              />
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
            <InterestTilesGrid
              items={spaceFiltered}
              onPick={setDrill}
              query={tileQuery}
            />
          </>
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

            {/* URL count + verb filter on one row. The count sits left, the
                intention pills to its right. Shown for every drill: a topic
                drill uses the bar as a client-side sub-filter; a verb drill
                uses it to re-drill to another verb (All → back to tiles). */}
            <div className="dp-filter-row">
              <span className="dp-url-count">
                {filteredItems.length} url
                {filteredItems.length === 1 ? '' : 's'}
              </span>
              <CircleVerbFilter
                active={
                  drill.kind === 'verb'
                    ? (drill.id as VerbFilterId)
                    : verbFilter
                }
                onChange={(id) => {
                  if (drill.kind === 'verb') {
                    setDrill(id === 'all' ? null : { kind: 'verb', id })
                  } else {
                    setVerbFilter(id)
                  }
                }}
              />
            </div>

            {/* Error */}
            {!loading && feedError && (
              <Card className="p-6 text-center">
                <p className="text-sm text-destructive-foreground">
                  {feedError}
                </p>
              </Card>
            )}

            {/* Feed */}
            {!loading && (
              <>
                {filteredItems.length === 0 ? (
                  <EmptyFeedState
                    gridClassName="hm-drill-grid"
                    skeletonCount={6}
                    renderSkeleton={() => <FeedCardSkeleton />}
                    message="No activity yet"
                    hint="Recent certifications from your trust circle will land here."
                  />
                ) : (
                  <>
                    <div className="hm-drill-grid">
                      {filteredItems.map((item) => {
                        const addr = item.certifierAddress as Address
                        const name = addr ? getDisplay(addr) : item.certifier
                        const av = addr ? getAvatar(addr) : ''
                        return (
                          <FeedCard
                            key={item.id}
                            item={item}
                            displayName={name}
                            avatar={av}
                            onDeposit={handleDeposit}
                          />
                        )
                      })}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* Infinite scroll sentinel — rendered once regardless of tiles /
          drill mode so pagination keeps fetching in the background as
          the user explores. Observer wired in a useEffect above. */}
        {hasMore && (
          <div ref={sentinelRef} className="flex justify-center py-6">
            {loadingMore && <SofiaLoader size={40} />}
          </div>
        )}
      </div>

      {/* Floating back-to-top — appears once the feed is scrolled. */}
      <ScrollToTopButton />
    </div>
  )
}
