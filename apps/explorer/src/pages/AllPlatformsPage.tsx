import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTopicSelection } from '@/hooks/useDomainSelection'
import { usePlatformConnections } from '@/hooks/usePlatformConnections'
import { usePlatformMarket } from '@/hooks/usePlatformMarket'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import PlatformGrid from '@/components/profile/PlatformGrid'
import PlatformMarketCard from '@/components/PlatformMarketCard'
import AtomDetailDialog from '@/components/AtomDetailDialog'
import PageHeader from '@/components/PageHeader'
import SofiaLoader from '@/components/ui/SofiaLoader'
import { PAGE_COLORS } from '@/config/pageColors'
import { ATOM_ID_TO_PLATFORM, PLATFORM_ATOM_IDS } from '@/config/atomIds'
import { usePrivy } from '@privy-io/react-auth'
import { formatEther } from 'viem'
import { LayoutGrid, List, Users, TrendingUp, DollarSign } from 'lucide-react'
import { usePlatformCatalog } from '@/hooks/usePlatformCatalog'
import type { PlatformVaultData } from '@/services/platformMarketService'
import '@/components/styles/pages.css'

/** Display order for topics — most relevant first */
const TOPIC_ORDER = [
  'web3-crypto',
  'tech-dev',
  'gaming',
  'design-creative',
  'music-audio',
  'video-cinema',
  'entrepreneurship',
  'science',
  'sport-health',
  'food-lifestyle',
  'literature',
  'personal-dev',
  'performing-arts',
  'nature-environment',
]

function formatMCap(raw: string): string {
  const num = parseFloat(formatEther(BigInt(raw || '0')))
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  if (num >= 1) return num.toFixed(2)
  if (num >= 0.001) return num.toFixed(4)
  return '0'
}

export default function AllPlatformsPage() {
  const { selectedCategories } = useTopicSelection()
  const { getStatus, getConnection, connect, disconnect, startChallenge, verifyChallengeCode } = usePlatformConnections()
  const { ranked, getMarketBySlug, isLoading: marketsLoading } = usePlatformMarket()
  const { topics } = useTaxonomy()
  const { getPlatformsByTopic } = usePlatformCatalog()
  const { user } = usePrivy()
  const walletAddress = user?.wallet?.address
  const navigate = useNavigate()
  const pc = PAGE_COLORS['/profile/platforms']
  const [tab, setTab] = useState<'grid' | 'list' | 'connect'>('grid')
  const [sortBy, setSortBy] = useState<'mcap' | 'price' | 'holders' | 'name'>('mcap')
  const [selectedMarket, setSelectedMarket] = useState<PlatformVaultData | null>(null)

  const sortPlatforms = (a: PlatformVaultData, b: PlatformVaultData) => {
    switch (sortBy) {
      case 'mcap': return Number(BigInt(b.marketCap) - BigInt(a.marketCap))
      case 'price': return Number(BigInt(b.sharePrice) - BigInt(a.sharePrice))
      case 'holders': return b.positionCount - a.positionCount
      case 'name': return a.label.localeCompare(b.label)
    }
  }

  return (
    <div>
      <PageHeader color={pc.color} glow={pc.glow} title={pc.title} subtitle={pc.subtitle} />
      <div className="page-content page-enter">

        <div className="pm-toolbar">
          <div className="pm-view-switcher">
            <button className={`pm-view-btn ${tab === 'grid' ? 'pm-view-btn--active' : ''}`} onClick={() => setTab('grid')}>
              <LayoutGrid className="h-3 w-3" /> Grid
            </button>
            <button className={`pm-view-btn ${tab === 'list' ? 'pm-view-btn--active' : ''}`} onClick={() => setTab('list')}>
              <List className="h-3 w-3" /> List
            </button>
            <button className={`pm-view-btn ${tab === 'connect' ? 'pm-view-btn--active' : ''}`} onClick={() => setTab('connect')}>
            Connect
          </button>
          </div>
        </div>

        {tab === 'grid' ? (
          /* ── Grid view: grouped by topic ── */
          marketsLoading ? (
            <div className="ip-loader"><SofiaLoader size={48} /></div>
          ) : (
            <div className="pm-topics">
              {[...topics].sort((a, b) => {
                const ai = TOPIC_ORDER.indexOf(a.id)
                const bi = TOPIC_ORDER.indexOf(b.id)
                return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
              }).map((topic) => {
                const topicPlatforms = getPlatformsByTopic(topic.id)
                const cards = topicPlatforms
                  .map((p) => ({ slug: p.id, market: getMarketBySlug(p.id) }))
                  .filter((c): c is { slug: string; market: PlatformVaultData } => !!c.market)
                  .sort((a, b) => sortPlatforms(a.market, b.market))

                if (cards.length === 0) return null

                return (
                  <div key={topic.id} className="pm-topic-group">
                    <h3 className="pm-topic-title" style={{ color: topic.color }}>
                      {topic.label}
                      <span className="pm-topic-count">{cards.length}</span>
                    </h3>
                    <div className="pm-grid">
                      {cards.map(({ slug, market }) => (
                        <PlatformMarketCard
                          key={market.termId}
                          market={market}
                          platformSlug={slug}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        ) : tab === 'list' ? (
          /* ── List view: table ranked by market cap ── */
          marketsLoading ? (
            <div className="ip-loader"><SofiaLoader size={48} /></div>
          ) : (
            <div className="pm-table">
              <div className="pm-table-header">
                <span className="pm-table-col-rank">#</span>
                <span className="pm-table-col-name">Platform</span>
                <span className={`pm-table-col-mcap pm-table-sortable ${sortBy === 'mcap' ? 'pm-table-sorted' : ''}`} onClick={() => setSortBy('mcap')}>MCap</span>
                <span className={`pm-table-col-price pm-table-sortable ${sortBy === 'price' ? 'pm-table-sorted' : ''}`} onClick={() => setSortBy('price')}>Price</span>
                <span className={`pm-table-col-holders pm-table-sortable ${sortBy === 'holders' ? 'pm-table-sorted' : ''}`} onClick={() => setSortBy('holders')}>Holders</span>
                <span className={`pm-table-col-pnl pm-table-sortable ${sortBy === 'name' ? 'pm-table-sorted' : ''}`} onClick={() => setSortBy('name')}>P&L</span>
              </div>
              {[...ranked].sort(sortPlatforms).map((market, i) => {
                const slug = ATOM_ID_TO_PLATFORM.get(market.termId) || ''
                return (
                  <div
                    key={market.termId}
                    className="pm-table-row"
                    onClick={() => setSelectedMarket(market)}
                  >
                    <span className="pm-table-col-rank">{i + 1}</span>
                    <span className="pm-table-col-name">
                      <img
                        src={`/favicons/${slug}.png`}
                        alt=""
                        className="pm-table-icon"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                      {market.label}
                    </span>
                    <span className="pm-table-col-mcap">{formatMCap(market.marketCap)} T</span>
                    <span className="pm-table-col-price">{parseFloat(formatEther(BigInt(market.sharePrice || '0'))).toFixed(4)}</span>
                    <span className="pm-table-col-holders">{market.positionCount}</span>
                    <span className="pm-table-col-pnl" style={{
                      color: market.userPnlPct == null ? 'var(--muted-foreground)'
                        : market.userPnlPct >= 0 ? '#10B981' : '#EF4444'
                    }}>
                      {market.userPnlPct != null
                        ? `${market.userPnlPct >= 0 ? '+' : ''}${market.userPnlPct}%`
                        : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          )
        ) : (
          /* ── Connect tab ── */
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
        )}

        {/* Detail dialog */}
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
    </div>
  )
}
