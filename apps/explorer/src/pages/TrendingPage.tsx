/**
 * TrendingPage (`/trending`) — pages (URLs) gaining positions recently.
 *
 * Ranked by the positions opened on each page's claims inside the selected
 * window (useTrendingPages). Each card shows the page, its supporters, total
 * staked, positions in the window and the first wallets to signal it. "Take
 * position" queues a support deposit on the page's main claim in the cart;
 * the card body opens the claim's position board (support / oppose).
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePrivy, useLogin } from '@privy-io/react-auth'
import { PageHero, FaviconWrapper } from '@0xsofia/design-system'
import { TrendingUp, Users } from 'lucide-react'
import { useTrendingPages } from '@/hooks/useTrendingPages'
import { useCart } from '@/hooks/useCart'
import PositionBoardDialog from '@/components/profile/PositionBoardDialog'
import SofiaLoader from '@/components/ui/SofiaLoader'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PAGE_COLORS } from '@/config/pageColors'
import {
  INTENTION_CONFIG,
  predicateLabelToIntentionType,
} from '@/config/intentions'
import { formatTrust, timeAgo } from '@/utils/formatting'
import { avatarColor } from '@/utils/avatarColor'
import { getAvatarUrl } from '@/services/ensService'
import {
  TRENDING_WINDOWS,
  type TrendingPage as TrendingPageItem,
  type TrendingWindow,
} from '@/services/trendingPagesService'
import '@/components/styles/pages.css'
import '@/components/styles/platform-market.css'
import '@/components/styles/market-pages.css'

const WINDOW_TEXT: Record<TrendingWindow, string> = {
  '24h': 'in the last 24h',
  '7d': 'in the last 7 days',
  '30d': 'in the last 30 days',
}

/** Display label + colour of a claim's predicate (falls back to the raw
 *  label for predicates outside the 8 Sofia intentions). */
function claimMeta(predicateLabel: string): { label: string; color: string } {
  const type = predicateLabelToIntentionType(predicateLabel)
  if (!type) return { label: predicateLabel, color: 'var(--ds-accent)' }
  const cfg = INTENTION_CONFIG[type]
  return { label: cfg.label, color: cfg.color }
}

interface TrendingRowProps {
  page: TrendingPageItem
  rank: number
  timeWindow: TrendingWindow
  onTakePosition: (page: TrendingPageItem) => void
  onOpenBoard: (page: TrendingPageItem) => void
}

function TrendingRow({
  page,
  rank,
  timeWindow,
  onTakePosition,
  onOpenBoard,
}: TrendingRowProps) {
  const meta = page.mainClaim ? claimMeta(page.mainClaim.predicateLabel) : null
  return (
    <article
      className="mk-card"
      style={{ ['--topic-color' as string]: meta?.color ?? 'var(--ds-accent)' }}
    >
      <button
        type="button"
        className="mk-card-main"
        onClick={() => onOpenBoard(page)}
        disabled={!page.mainClaim}
        aria-label={`Open the position board for ${page.title}`}
      >
        <span className="mk-rank">{rank}</span>
        <FaviconWrapper size={36} src={page.favicon} alt={page.domain} />
        <span className="mk-name">
          <span className="mk-title">{page.title}</span>
          <span className="mk-host">{page.domain}</span>
        </span>
      </button>

      <div className="mk-stats">
        <span className="mk-stat mk-stat--accent">
          <span className="mk-stat-value">+{page.windowPositions}</span>
          <span className="mk-stat-label">
            Position{page.windowPositions === 1 ? '' : 's'} · {timeWindow}
          </span>
        </span>
        <span className="mk-stat">
          <span className="mk-stat-value">
            <Users className="h-3 w-3" aria-hidden /> {page.supporters}
          </span>
          <span className="mk-stat-label">Supporters</span>
        </span>
        <span className="mk-stat">
          <span className="mk-stat-value">
            {formatTrust(BigInt(page.totalStaked))}
          </span>
          <span className="mk-stat-label">Total staked</span>
        </span>
      </div>

      <div className="mk-first">
        <span className="mk-first-label">First to signal</span>
        {page.firstSupporters.length === 0 ? (
          <span className="mk-first-empty">—</span>
        ) : (
          <ul className="mk-first-list">
            {page.firstSupporters.map((s) => {
              const bg = avatarColor(s.address)
              const img = s.image || getAvatarUrl(s.address)
              return (
                <li key={s.address}>
                  <Link
                    to={`/profile/${s.address}`}
                    className="mk-first-item"
                    title={`${s.label} · ${new Date(s.createdAt).toLocaleDateString()}`}
                  >
                    <Avatar
                      className="mk-first-avatar"
                      style={{ background: bg }}
                    >
                      <AvatarImage src={img} alt={s.label} />
                      <AvatarFallback
                        className="text-[9px]"
                        style={{ background: bg, color: '#02000e' }}
                      >
                        {s.label.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="mk-first-name">{s.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="mk-action">
        {meta && (
          <span
            className="mk-claim-pill"
            title={`Claim: ${page.mainClaim?.predicateLabel}`}
          >
            {meta.label}
          </span>
        )}
        <button
          type="button"
          className="pm-dex-invest"
          style={{ background: meta?.color ?? 'var(--ds-accent)' }}
          onClick={() => onTakePosition(page)}
          disabled={!page.mainClaim}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          Take position
        </button>
        <span className="mk-last">{timeAgo(page.lastPositionAt)}</span>
      </div>
    </article>
  )
}

export default function TrendingPage() {
  const pc = PAGE_COLORS['/trending']
  const [timeWindow, setTimeWindow] = useState<TrendingWindow>('24h')
  const {
    items,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    refresh,
    error,
    truncated,
  } = useTrendingPages(timeWindow)
  const { authenticated, user } = usePrivy()
  const { login } = useLogin()
  const cart = useCart()
  const [boardPage, setBoardPage] = useState<TrendingPageItem | null>(null)

  const handleTakePosition = (page: TrendingPageItem) => {
    if (!page.mainClaim) return
    if (!authenticated) {
      login()
      return
    }
    const meta = claimMeta(page.mainClaim.predicateLabel)
    const termId = page.mainClaim.termId
    cart.addItem({
      id: `${termId}-support`,
      side: 'support',
      termId,
      intention: meta.label,
      title: page.title,
      favicon: page.favicon,
      intentionColor: meta.color,
    })
    cart.open()
  }

  const widerWindow: TrendingWindow | null =
    timeWindow === '24h' ? '7d' : timeWindow === '7d' ? '30d' : null

  return (
    <div className="page-content page-enter">
      <PageHero
        background={pc.color}
        title={pc.title}
        description={pc.subtitle}
      />

      <div className="pm-filters">
        <div className="pm-filter-group">
          <span className="pm-filter-label">Window</span>
          <div className="pm-chips">
            {TRENDING_WINDOWS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`pm-chip${timeWindow === key ? ' active' : ''}`}
                onClick={() => setTimeWindow(key)}
                aria-pressed={timeWindow === key}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="pm-loader">
          <SofiaLoader size={48} />
        </div>
      ) : error && items.length === 0 ? (
        <div className="pm-empty">
          Couldn't load trending pages.{' '}
          <button type="button" className="mk-link-btn" onClick={refresh}>
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="pm-empty">
          No new positions on pages {WINDOW_TEXT[timeWindow]}.
          {widerWindow && (
            <>
              {' '}
              <button
                type="button"
                className="mk-link-btn"
                onClick={() => setTimeWindow(widerWindow)}
              >
                Try {WINDOW_TEXT[widerWindow].replace('in the ', '')}
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="mk-list">
            {items.map((page, i) => (
              <TrendingRow
                key={page.id}
                page={page}
                rank={i + 1}
                timeWindow={timeWindow}
                onTakePosition={handleTakePosition}
                onOpenBoard={setBoardPage}
              />
            ))}
          </div>
          {hasMore && (
            <div className="mk-more">
              <button
                type="button"
                className="pm-chip"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
          {error && <p className="mk-note">{error}</p>}
          {truncated && (
            <p className="mk-note">
              Showing the most recent 2,000 positions of this window.
            </p>
          )}
        </>
      )}

      <p className="mk-disclaimer">
        Position value can go down. Rewards are not guaranteed.
      </p>

      {boardPage?.mainClaim && (
        <PositionBoardDialog
          open={!!boardPage}
          onOpenChange={(open) => {
            if (!open) setBoardPage(null)
          }}
          termId={boardPage.mainClaim.termId}
          counterTermId={boardPage.mainClaim.counterTermId}
          title={boardPage.title}
          favicon={boardPage.favicon}
          intention={claimMeta(boardPage.mainClaim.predicateLabel).label}
          intentionColor={claimMeta(boardPage.mainClaim.predicateLabel).color}
          walletAddress={user?.wallet?.address}
        />
      )}
    </div>
  )
}
