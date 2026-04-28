/**
 * AllPlatformsPage (`/platforms`) — Platform Market browser.
 *
 * Two views share one filter bar:
 *   - List    : DEX-style rows (favicon, ticker, mcap, price, holders,
 *               P&L, Invest CTA). Topic colour accents the rank pill and
 *               the Invest button.
 *   - Connect : topic-grouped connector (reuses PlatformGrid).
 */
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth'
import { PageHero } from '@0xsofia/design-system'
import { List, PlugZap, Search, TrendingUp, X } from 'lucide-react'
import { formatEther } from 'viem'
import { useTopicSelection } from '@/hooks/useDomainSelection'
import { usePlatformMarket } from '@/hooks/usePlatformMarket'
import { usePlatformCatalog } from '@/hooks/usePlatformCatalog'
import { usePlatformConnections } from '@/hooks/usePlatformConnections'
import AtomDetailDialog from '@/components/AtomDetailDialog'
import PlatformGrid from '@/components/profile/PlatformGrid'
import PlatformsRightRail from '@/components/platforms/PlatformsRightRail'
import SofiaLoader from '@/components/ui/SofiaLoader'
import { useProvideRightRail } from '@/contexts/RightRailContext'
import { PAGE_COLORS } from '@/config/pageColors'
import { ATOM_ID_TO_PLATFORM } from '@/config/atomIds'
import type { PlatformVaultData } from '@/services/platformMarketService'
import '@/components/styles/pages.css'
import '@/components/styles/platform-market.css'

type SortKey = 'mcap' | 'holders' | 'price' | 'name'
type TabKey = 'list' | 'connect'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'mcap', label: 'Market Cap' },
  { key: 'holders', label: 'Holders' },
  { key: 'price', label: 'Price' },
  { key: 'name', label: 'A–Z' },
]

function compareMarkets(a: PlatformVaultData, b: PlatformVaultData, sort: SortKey): number {
  switch (sort) {
    case 'mcap':
      return Number(BigInt(b.marketCap) - BigInt(a.marketCap))
    case 'price':
      return Number(BigInt(b.sharePrice) - BigInt(a.sharePrice))
    case 'holders':
      return b.positionCount - a.positionCount
    case 'name':
      return a.label.localeCompare(b.label)
  }
}

function formatMCap(raw: string): string {
  const num = parseFloat(formatEther(BigInt(raw || '0')))
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  if (num >= 1) return num.toFixed(2)
  if (num >= 0.001) return num.toFixed(4)
  return '0'
}

function formatShare(raw: string): string {
  const num = parseFloat(formatEther(BigInt(raw || '0')))
  return num >= 1 ? num.toFixed(2) : num.toFixed(4)
}

export default function AllPlatformsPage() {
  const navigate = useNavigate()
  const { ranked, isLoading: marketsLoading } = usePlatformMarket()
  const { platformById } = usePlatformCatalog()
  const {
    getStatus,
    getConnection,
    connect,
    disconnect,
    startChallenge,
    verifyChallengeCode,
  } = usePlatformConnections()
  const { selectedCategories } = useTopicSelection()
  const { user } = usePrivy()
  const walletAddress = user?.wallet?.address
  const pc = PAGE_COLORS['/profile/platforms']
  const [tab, setTab] = useState<TabKey>('list')
  const [sortBy, setSortBy] = useState<SortKey>('mcap')
  const [selectedMarket, setSelectedMarket] = useState<PlatformVaultData | null>(null)
  const [query, setQuery] = useState('')

  // Stable element — avoids re-registering the slot on every page render.
  const rightRail = useMemo(() => <PlatformsRightRail />, [])
  useProvideRightRail(rightRail)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? ranked.filter((m) => m.label.toLowerCase().includes(q))
      : ranked
    return [...filtered].sort((a, b) => compareMarkets(a, b, sortBy))
  }, [ranked, sortBy, query])

  return (
    <div className="page-content page-enter">
      <PageHero background={pc.color} title={pc.title} description={pc.subtitle} />

      <div className="pm-filters">
        <div className="pm-filter-group">
          <span className="pm-filter-label">View</span>
          <div className="pm-view-switcher" role="tablist" aria-label="View mode">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'list'}
              className={`pm-view-btn${tab === 'list' ? ' active' : ''}`}
              onClick={() => setTab('list')}
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'connect'}
              className={`pm-view-btn${tab === 'connect' ? ' active' : ''}`}
              onClick={() => setTab('connect')}
            >
              <PlugZap className="h-3.5 w-3.5" />
              Connect
            </button>
          </div>
        </div>

        {tab === 'list' ? (
          <>
            <div className="pm-filter-group pm-filter-search">
              <Search className="pm-search-icon h-3.5 w-3.5" aria-hidden="true" />
              <input
                type="search"
                className="pm-search-input"
                placeholder="Search platforms…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search platforms"
              />
              {query ? (
                <button
                  type="button"
                  className="pm-search-clear"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
            <div className="pm-filter-group">
              <span className="pm-filter-label">Sort by</span>
              <div className="pm-chips">
                {SORT_OPTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    className={`pm-chip${sortBy === key ? ' active' : ''}`}
                    onClick={() => setSortBy(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {tab === 'list' ? (
        marketsLoading ? (
          <div className="pm-loader"><SofiaLoader size={48} /></div>
        ) : rows.length === 0 ? (
          <div className="pm-empty">No platforms match your search.</div>
        ) : (
          <div className="pm-dex" role="table" aria-label="Platforms market">
            <div className="pm-dex-head" role="row">
              <span role="columnheader">#</span>
              <span role="columnheader">Platform</span>
              <span
                role="columnheader"
                className={`pm-dex-sortable${sortBy === 'mcap' ? ' sorted' : ''}`}
                onClick={() => setSortBy('mcap')}
              >
                Market cap
              </span>
              <span
                role="columnheader"
                className={`pm-dex-sortable${sortBy === 'price' ? ' sorted' : ''}`}
                onClick={() => setSortBy('price')}
              >
                Price
              </span>
              <span
                role="columnheader"
                className={`pm-dex-sortable${sortBy === 'holders' ? ' sorted' : ''}`}
                onClick={() => setSortBy('holders')}
              >
                Holders
              </span>
              <span role="columnheader">P&amp;L</span>
              <span role="columnheader" aria-label="Action" />
            </div>

            {rows.map((market, i) => {
              const slug = ATOM_ID_TO_PLATFORM.get(market.termId) ?? ''
              const entry = slug ? platformById(slug) : undefined
              const topicColor = entry?.color ?? 'var(--ds-accent)'
              const host = entry?.website
                ? entry.website.replace(/^https?:\/\//, '').replace(/\/$/, '')
                : slug
              const pnl = market.userPnlPct
              const pnlClass = pnl == null ? '' : pnl >= 0 ? 'up' : 'down'

              return (
                <div
                  key={market.termId}
                  className="pm-dex-row"
                  role="row"
                  onClick={() => setSelectedMarket(market)}
                  style={{ ['--topic-color' as string]: topicColor }}
                >
                  <span className="pm-dex-rank" role="cell">{i + 1}</span>

                  <span className="pm-dex-name" role="cell">
                    <span className="pm-dex-favicon">
                      {slug ? (
                        <img
                          src={`/favicons/${slug}.png`}
                          alt=""
                          onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                        />
                      ) : null}
                    </span>
                    <span className="pm-dex-name-text">
                      <span className="pm-dex-label">{market.label}</span>
                      <span className="pm-dex-host">{host}</span>
                    </span>
                  </span>

                  <span className="pm-dex-mcap" role="cell">
                    <span className="pm-dex-num-big">{formatMCap(market.marketCap)}</span>
                    <span className="pm-dex-num-unit">T</span>
                  </span>

                  <span className="pm-dex-price" role="cell">{formatShare(market.sharePrice)}</span>

                  <span className="pm-dex-holders" role="cell">{market.positionCount}</span>

                  <span className={`pm-dex-pnl ${pnlClass}`} role="cell">
                    {pnl == null ? '—' : `${pnl >= 0 ? '+' : ''}${pnl}%`}
                  </span>

                  <span className="pm-dex-action" role="cell">
                    <button
                      type="button"
                      className="pm-dex-invest"
                      style={{ background: topicColor }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedMarket(market)
                      }}
                    >
                      <TrendingUp className="h-3.5 w-3.5" />
                      Invest
                    </button>
                  </span>
                </div>
              )
            })}
          </div>
        )
      ) : (
        /* Connect tab: topic-grouped PlatformGrid with connect hooks. */
        <div className="pm-topics">
          <PlatformGrid
            selectedCategories={selectedCategories}
            getStatus={getStatus}
            getConnection={getConnection}
            onConnect={connect}
            onDisconnect={disconnect}
            onStartChallenge={startChallenge}
            onVerifyChallenge={verifyChallengeCode}
            onBack={() => navigate(-1)}
          />
        </div>
      )}

      {selectedMarket && (
        <AtomDetailDialog
          open={!!selectedMarket}
          onOpenChange={(open) => { if (!open) setSelectedMarket(null) }}
          market={selectedMarket}
          platformName={selectedMarket.label}
          favicon={`/favicons/${ATOM_ID_TO_PLATFORM.get(selectedMarket.termId) || ''}.png`}
          walletAddress={walletAddress}
        />
      )}
    </div>
  )
}
