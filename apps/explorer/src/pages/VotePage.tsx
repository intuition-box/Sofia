/**
 * VotePage — `/vote`. Browse debate claims, vote support/oppose (adds
 * to cart on-chain later). Native proto-aligned markup on `--ds-*`
 * tokens — no shadcn primitives.
 */
import { useMemo, useState } from 'react'
import { formatEther } from 'viem'
import { usePrivy } from '@privy-io/react-auth'
import {
  ChevronLeft,
  ChevronRight,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react'
import SofiaLoader from '@/components/ui/SofiaLoader'
import { useDebateClaims } from '@/hooks/useDebateClaims'
import { usePrefetchClaimDialogs } from '@/hooks/useClaimPositions'
import { useCart } from '@/hooks/useCart'
import { CLAIM_CATEGORIES, type ClaimCategory } from '@/config/debateConfig'
import PositionBoardDialog from '@/components/profile/PositionBoardDialog'
import { PageHero } from '@0xsofia/design-system'
import { PAGE_COLORS } from '@/config/pageColors'
import '@/components/styles/pages.css'
import '@/components/styles/vote-page.css'

const SUPPORT_COLOR = '#6dd4a0'
const OPPOSE_COLOR = '#e87c7c'

function formatMarketCap(value: bigint): string {
  const num = parseFloat(formatEther(value))
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  if (num >= 1) return num.toFixed(2)
  if (num >= 0.001) return num.toFixed(4)
  return '0'
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

  usePrefetchClaimDialogs(claims, walletAddress)

  const filtered = useMemo(() => {
    if (activeTab === 'all') return claims
    return claims.filter((c) => c.category === activeTab)
  }, [claims, activeTab])

  const handleTabChange = (tab: ClaimCategory | 'all') => {
    setActiveTab(tab)
    setCurrentIndex(0)
  }

  if (loading) {
    return (
      <div className="page-content page-enter">
        <PageHero background={pc.color} title={pc.title} description={pc.subtitle} />
        <div className="vp-loader">
          <SofiaLoader size={96} />
        </div>
      </div>
    )
  }

  if (error || claims.length === 0) {
    return (
      <div className="page-content page-enter">
        <PageHero background={pc.color} title={pc.title} description={pc.subtitle} />
        <div className="vp-empty">{error || 'No claims available.'}</div>
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
  const categoryInfo = claim?.category
    ? CLAIM_CATEGORIES.find((c) => c.id === claim.category)
    : undefined
  const userVote = claim
    ? cart.items.find((i) => i.termId === claim.termId)?.side
      ?? cart.items.find((i) => i.termId === claim.counterTermId)?.side
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
      intentionColor: type === 'support' ? SUPPORT_COLOR : OPPOSE_COLOR,
    })
  }

  const next = () => setCurrentIndex((i) => Math.min(i + 1, filtered.length - 1))
  const prev = () => setCurrentIndex((i) => Math.max(i - 1, 0))

  return (
    <div className="page-content page-enter vp-page">
      <PageHero background={pc.color} title={pc.title} description={pc.subtitle} />

      <div className="vp-tabs" role="tablist" aria-label="Claim category">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'all'}
          className={`vp-tab${activeTab === 'all' ? ' vp-tab--active' : ''}`}
          onClick={() => handleTabChange('all')}
        >
          All
          <span className="vp-tab-count">{claims.length}</span>
        </button>
        {CLAIM_CATEGORIES.map((cat) => {
          const count = claims.filter((c) => c.category === cat.id).length
          if (count === 0) return null
          const active = activeTab === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`vp-tab${active ? ' vp-tab--active' : ''}`}
              style={active ? { ['--tab-color' as string]: cat.color } : undefined}
              onClick={() => handleTabChange(cat.id)}
            >
              {cat.label}
              <span className="vp-tab-count">{count}</span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="vp-empty">No claims in this category.</div>
      ) : (
        <>
          <div className="vp-nav">
            <button
              type="button"
              className="vp-nav-btn"
              onClick={prev}
              disabled={currentIndex === 0}
              aria-label="Previous claim"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="vp-nav-count">
              {currentIndex + 1} / {filtered.length}
            </span>
            <button
              type="button"
              className="vp-nav-btn"
              onClick={next}
              disabled={currentIndex === filtered.length - 1}
              aria-label="Next claim"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {claim ? (
            <article
              className="vp-claim-card"
              onClick={() => setDialogOpen(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setDialogOpen(true)
                }
              }}
            >
              <header className="vp-claim-head">
                <div className="vp-claim-head-left">
                  <span className="vp-pill">{totalPositions} positions</span>
                  {categoryInfo ? (
                    <span
                      className="vp-category-badge"
                      style={{ ['--cat-color' as string]: categoryInfo.color }}
                    >
                      {categoryInfo.label}
                    </span>
                  ) : null}
                </div>
                <span className="vp-mcap">{formatMarketCap(totalMarketCap)} T</span>
              </header>

              <h2 className="vp-claim-title">{title}</h2>

              <div className="vp-bar-block">
                <div className="vp-bar-labels">
                  <span className="vp-bar-label vp-bar-label--support">
                    Support {supportPercent}%
                  </span>
                  <span className="vp-bar-label vp-bar-label--oppose">
                    Oppose {100 - supportPercent}%
                  </span>
                </div>
                <div className="vp-bar">
                  <div className="vp-bar-fill vp-bar-fill--support" style={{ width: `${supportPercent}%` }} />
                  <div className="vp-bar-fill vp-bar-fill--oppose" />
                </div>
                <div className="vp-bar-foot">
                  <span>
                    {formatMarketCap(claim.supportMarketCap)} T · {claim.supportCount} votes
                  </span>
                  <span>
                    {claim.opposeCount} votes · {formatMarketCap(claim.opposeMarketCap)} T
                  </span>
                </div>
              </div>

              <div className="vp-actions">
                <button
                  type="button"
                  className={`vp-vote-btn vp-vote-btn--support${
                    userVote === 'support' ? ' is-active' : ''
                  }`}
                  disabled={!!userVote && userVote !== 'support'}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleVote('support')
                  }}
                >
                  <ThumbsUp className="h-4 w-4" />
                  {userVote === 'support' ? 'Supported' : 'Support'}
                </button>
                <button
                  type="button"
                  className={`vp-vote-btn vp-vote-btn--oppose${
                    userVote === 'oppose' ? ' is-active' : ''
                  }`}
                  disabled={!!userVote && userVote !== 'oppose'}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleVote('oppose')
                  }}
                >
                  <ThumbsDown className="h-4 w-4" />
                  {userVote === 'oppose' ? 'Opposed' : 'Oppose'}
                </button>
              </div>

              {userVote ? (
                <p className="vp-cart-hint">Added to your cart as {userVote}.</p>
              ) : null}
            </article>
          ) : null}

          {claim ? (
            <PositionBoardDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              termId={claim.termId}
              counterTermId={claim.counterTermId}
              title={title}
              favicon=""
              intention={categoryInfo?.label || 'Claim'}
              intentionColor={categoryInfo?.color || 'var(--ds-accent)'}
              walletAddress={walletAddress}
            />
          ) : null}
        </>
      )}

      <section className="vp-list">
        <header className="vp-list-head">
          <span className="vp-list-title">All claims</span>
          <span className="vp-list-count">{filtered.length}</span>
        </header>
        <div className="vp-list-grid">
          {filtered.map((c, i) => {
            const cTotal = c.supportMarketCap + c.opposeMarketCap
            const supPct =
              cTotal > 0n
                ? Math.round(Number((c.supportMarketCap * 100n) / cTotal))
                : 50
            const voted = cart.items.find((ci) => ci.termId === c.termId)?.side
            const catInfo = c.category
              ? CLAIM_CATEGORIES.find((cat) => cat.id === c.category)
              : undefined
            const isCurrent = i === currentIndex
            const totalVotes = c.supportCount + c.opposeCount

            return (
              <article
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => setCurrentIndex(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setCurrentIndex(i)
                  }
                }}
                className={`vp-mini${isCurrent ? ' vp-mini--current' : ''}`}
                style={catInfo ? { ['--cat-color' as string]: catInfo.color } : undefined}
              >
                <header className="vp-mini-head">
                  {catInfo ? (
                    <span className="vp-category-badge">{catInfo.label}</span>
                  ) : (
                    <span className="vp-mini-kicker">Claim</span>
                  )}
                  {voted ? (
                    <span className={`vp-row-voted vp-row-voted--${voted}`}>
                      {voted === 'support' ? '▲ voted' : '▼ voted'}
                    </span>
                  ) : null}
                </header>

                <p className="vp-mini-title">
                  {c.subject} {c.predicate} {c.object}
                </p>

                <div className="vp-mini-bar">
                  <div
                    className="vp-mini-bar-fill vp-mini-bar-fill--support"
                    style={{ width: `${supPct}%` }}
                  />
                  <div className="vp-mini-bar-fill vp-mini-bar-fill--oppose" />
                </div>
                <div className="vp-mini-meta">
                  <span className="vp-mini-meta-support">
                    {supPct}% · {c.supportCount}
                  </span>
                  <span className="vp-mini-meta-mcap">{formatMarketCap(cTotal)} T</span>
                  <span className="vp-mini-meta-oppose">
                    {c.opposeCount} · {100 - supPct}%
                  </span>
                </div>

                <footer className="vp-mini-foot">
                  <span className="vp-mini-foot-votes">
                    {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                  </span>
                  {isCurrent ? (
                    <span className="vp-mini-foot-current">Now viewing</span>
                  ) : null}
                </footer>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
