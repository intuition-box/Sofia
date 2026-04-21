import { useMemo, useState } from 'react'
import { formatEther } from 'viem'
import { usePrivy } from '@privy-io/react-auth'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { ThumbsUp, ThumbsDown, ChevronRight, ChevronLeft } from 'lucide-react'
import SofiaLoader from '../components/ui/SofiaLoader'
import { useDebateClaims } from '../hooks/useDebateClaims'
import { usePrefetchClaimDialogs } from '../hooks/useClaimPositions'
import { useCart } from '../hooks/useCart'
import { CLAIM_CATEGORIES, type ClaimCategory } from '../config/debateConfig'
import PositionBoardDialog from '../components/profile/PositionBoardDialog'
import PageHeader from '../components/PageHeader'
import { PAGE_COLORS } from '../config/pageColors'
import '@/components/styles/pages.css'

function formatMarketCap(value: bigint): string {
  const num = parseFloat(formatEther(value))
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k T'
  if (num >= 1) return num.toFixed(2) + ' T'
  if (num >= 0.001) return num.toFixed(4) + ' T'
  return '0 T'
}

export default function VotePage() {
  const { claims, loading, error } = useDebateClaims()
  const { user } = usePrivy()
  const walletAddress = user?.wallet?.address
  const cart = useCart()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<ClaimCategory | 'all'>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const pc = PAGE_COLORS['/vote']

  // Prefetch all claim dialog data so modals open instantly
  usePrefetchClaimDialogs(claims, walletAddress)

  const filtered = useMemo(() => {
    if (activeTab === 'all') return claims
    return claims.filter((c) => c.category === activeTab)
  }, [claims, activeTab])

  // Reset carousel index when tab changes
  const handleTabChange = (tab: ClaimCategory | 'all') => {
    setActiveTab(tab)
    setCurrentIndex(0)
  }

  if (loading) {
    return (
      <div>
        <PageHeader color={pc.color} glow={pc.glow} title={pc.title} subtitle={pc.subtitle} />
        <div className="flex items-center justify-center page-loader-sm">
          <SofiaLoader size={96} />
        </div>
      </div>
    )
  }

  if (error || claims.length === 0) {
    return (
      <div>
        <PageHeader color={pc.color} glow={pc.glow} title={pc.title} subtitle={pc.subtitle} />
        <div className="page-content page-enter">
          <p className="text-sm text-muted-foreground">
            {error || 'No claims available.'}
          </p>
        </div>
      </div>
    )
  }

  const claim = filtered[currentIndex]
  const totalPositions = claim ? claim.supportCount + claim.opposeCount : 0
  const totalMarketCap = claim ? claim.supportMarketCap + claim.opposeMarketCap : 0n
  const supportPercent =
    claim && totalMarketCap > 0n
      ? Math.round(Number((claim.supportMarketCap * 100n) / totalMarketCap))
      : 50
  const title = claim ? `${claim.subject} ${claim.predicate} ${claim.object}` : ''
  const categoryInfo = claim?.category ? CLAIM_CATEGORIES.find((c) => c.id === claim.category) : undefined
  const userVote = claim
    ? (cart.items.find((i) => i.termId === claim.termId)?.side
      ?? cart.items.find((i) => i.termId === claim.counterTermId)?.side)
    : undefined

  const handleVote = (type: 'support' | 'oppose') => {
    if (!claim) return
    const termId = type === 'support' ? claim.termId : claim.counterTermId
    cart.addItem({
      id: `${termId}-${type}`,
      side: type,
      termId,
      intention: type === 'support' ? 'Support' : 'Oppose',
      title,
      favicon: '',
      intentionColor: type === 'support' ? '#86EFAC' : '#FCA5A5',
    })
  }

  const next = () => setCurrentIndex((i) => Math.min(i + 1, filtered.length - 1))
  const prev = () => setCurrentIndex((i) => Math.max(i - 1, 0))

  return (
    <div>
      <PageHeader color={pc.color} glow={pc.glow} title={pc.title} subtitle={pc.subtitle} />
      <div className="space-y-6 page-content page-enter">

      {/* Category tabs */}
      <div className="vp-tabs">
        <button
          className={`vp-tab ${activeTab === 'all' ? 'vp-tab--active' : ''}`}
          onClick={() => handleTabChange('all')}
        >
          All
          <span className="vp-tab-count">{claims.length}</span>
        </button>
        {CLAIM_CATEGORIES.map((cat) => {
          const count = claims.filter((c) => c.category === cat.id).length
          if (count === 0) return null
          return (
            <button
              key={cat.id}
              className={`vp-tab ${activeTab === cat.id ? 'vp-tab--active' : ''}`}
              style={activeTab === cat.id ? { borderColor: cat.color, color: cat.color } : undefined}
              onClick={() => handleTabChange(cat.id)}
            >
              {cat.label}
              <span className="vp-tab-count">{count}</span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center">No claims in this category.</p>
      ) : (
        <>
          {/* Card navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={prev} disabled={currentIndex === 0}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {filtered.length}
            </span>
            <Button variant="ghost" size="icon" onClick={next} disabled={currentIndex === filtered.length - 1}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Claim card */}
          {claim && (
            <Card className="vp-claim-card vp-claim-card--hover" onClick={() => setDialogOpen(true)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{totalPositions} positions</Badge>
                  {categoryInfo && (
                    <span
                      className="vp-category-badge"
                      style={{ color: categoryInfo.color, borderColor: `${categoryInfo.color}40`, backgroundColor: `${categoryInfo.color}12` }}
                    >
                      {categoryInfo.label}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{formatMarketCap(totalMarketCap)}</span>
              </div>

              <h2 className="text-lg font-bold">{title}</h2>

              {/* Vote bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#86EFAC' }}>Support {supportPercent}%</span>
                  <span style={{ color: '#FCA5A5' }}>Oppose {100 - supportPercent}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                  <div className="transition-all" style={{ width: `${supportPercent}%`, backgroundColor: '#86EFAC' }} />
                  <div style={{ backgroundColor: '#FCA5A5', flex: 1 }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatMarketCap(claim.supportMarketCap)} · {claim.supportCount}</span>
                  <span>{claim.opposeCount} · {formatMarketCap(claim.opposeMarketCap)}</span>
                </div>
              </div>

              {/* Vote buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 btn-hover-support"
                  variant="outline"
                  disabled={!!userVote && userVote !== 'support'}
                  style={userVote === 'support' ? { borderColor: '#86EFAC', color: '#86EFAC', background: 'rgba(134,239,172,0.12)' } : undefined}
                  onClick={(e) => { e.stopPropagation(); handleVote('support') }}
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  {userVote === 'support' ? 'Supported' : 'Support'}
                </Button>
                <Button
                  className="flex-1 btn-hover-oppose"
                  variant="outline"
                  disabled={!!userVote && userVote !== 'oppose'}
                  style={userVote === 'oppose' ? { borderColor: '#FCA5A5', color: '#FCA5A5', background: 'rgba(252,165,165,0.12)' } : undefined}
                  onClick={(e) => { e.stopPropagation(); handleVote('oppose') }}
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  {userVote === 'oppose' ? 'Opposed' : 'Oppose'}
                </Button>
              </div>

              {userVote && (
                <p className="text-xs text-center text-muted-foreground">
                  Added to cart as {userVote}.
                </p>
              )}
            </Card>
          )}

          {/* Claim detail dialog */}
          {claim && (
            <PositionBoardDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              termId={claim.termId}
              counterTermId={claim.counterTermId}
              title={title}
              favicon=""
              intention={categoryInfo?.label || 'Claim'}
              intentionColor={categoryInfo?.color || '#8B5CF6'}
              walletAddress={walletAddress}
            />
          )}
        </>
      )}

      {/* All claims list */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">All Claims ({filtered.length})</h3>
        {filtered.map((c, i) => {
          const cTotal = c.supportMarketCap + c.opposeMarketCap
          const pct = cTotal > 0n
            ? Math.round(Number((c.supportMarketCap * 100n) / cTotal))
            : 50
          const voted = cart.items.find((ci) => ci.termId === c.termId)?.side
          const catInfo = c.category ? CLAIM_CATEGORIES.find((cat) => cat.id === c.category) : undefined
          return (
            <Card
              key={c.id}
              className={`cursor-pointer hover:shadow-sm transition-shadow vp-claim-list-card ${i === currentIndex ? 'ring-1 ring-primary' : ''}`}
              onClick={() => setCurrentIndex(i)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {c.subject} {c.predicate} {c.object}
                    </p>
                    {catInfo && (
                      <span
                        className="vp-category-badge"
                        style={{ color: catInfo.color, borderColor: `${catInfo.color}40`, backgroundColor: `${catInfo.color}12` }}
                      >
                        {catInfo.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {c.supportCount + c.opposeCount} positions · {formatMarketCap(cTotal)}
                    </span>
                    {voted && (
                      <Badge variant="outline" className="text-[10px]">
                        {voted === 'support' ? '👍' : '👎'} Voted
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right ml-3">
                  <span className="text-sm font-bold" style={{ color: '#86EFAC' }}>{pct}%</span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
      </div>
    </div>
  )
}
