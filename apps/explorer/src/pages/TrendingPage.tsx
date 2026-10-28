/**
 * TrendingPage (`/trending`) — pages (URLs) gaining positions recently.
 *
 * Ranked by the positions opened on each page's claims inside the selected
 * window (useTrendingPages). Each card shows the page, its supporters, total
 * staked, positions in the window and the first wallets to signal it. "Take
 * position" queues a support deposit on the page's main claim in the cart;
 * the card body opens the claim's position board (support / oppose).
 *
 * Pages come from Sofia AND from any other Intuition app (canonical support
 * claims): each card says where its claims come from and lists them.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePrivy, useLogin } from '@privy-io/react-auth'
import { PageHero, FaviconWrapper } from '@0xsofia/design-system'
import { TrendingUp, Users } from 'lucide-react'
import { useTrendingPages } from '@/hooks/useTrendingPages'
import { useCart } from '@/hooks/useCart'
import { CANONICAL_PREDICATE_IDS, SOFIA_I_ATOM_ID } from '@/config/atomIds'
import { PAGE_MARKET_PREDICATE_LABEL } from '@0xsofia/taxonomy'
import PositionBoardDialog from '@/components/profile/PositionBoardDialog'
import MissionsPanel from '@/components/trending/MissionsPanel'
import EarlySignalsSection from '@/components/trending/EarlySignalsSection'
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
  type ClaimSource,
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
  if (predicateLabel === PAGE_MARKET_PREDICATE_LABEL)
    return { label: RECOMMEND_LABEL, color: RECOMMEND_COLOR }
  const type = predicateLabelToIntentionType(predicateLabel)
  if (!type) return { label: predicateLabel, color: 'var(--ds-accent)' }
  const cfg = INTENTION_CONFIG[type]
  return { label: cfg.label, color: cfg.color }
}

/** The page market (`I | recommends | page`) in the cart */
const RECOMMEND_LABEL = 'Recommend'

/** Under the board's title: the market is one claim of the page */
function boardContext(page: TrendingPageItem): string {
  const people = `${page.supporters}${page.supportersCapped ? '+' : ''} supporter${page.supporters === 1 && !page.supportersCapped ? '' : 's'}`
  const claims = `${page.claimCount} claim${page.claimCount === 1 ? '' : 's'}`
  const whole = `${people} and ${formatTrust(BigInt(page.totalStaked))} across ${claims}`
  return page.market.claim
    ? `The page's market. The whole page: ${whole}.`
    : `No market yet — this is the busiest claim. The whole page: ${whole}.`
}
const RECOMMEND_COLOR = '#22C55E'

const SOURCE_TEXT: Record<ClaimSource, string> = {
  sofia: 'Sofia',
  ecosystem: 'Intuition ecosystem',
}

function sourcesText(sources: readonly ClaimSource[]): string {
  return sources.map((s) => SOURCE_TEXT[s]).join(' + ')
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
  // Every page trades on one market: taking a position = Recommend
  const meta = { label: RECOMMEND_LABEL, color: RECOMMEND_COLOR }
  return (
    <article
      className="mk-card"
      style={{ ['--topic-color' as string]: meta.color }}
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
          {page.sources.length > 0 && (
            <span
              className="mk-source"
              title={
                page.atomCount > 1
                  ? `${page.claimCount} claims across ${page.atomCount} atoms`
                  : `${page.claimCount} claim${page.claimCount === 1 ? '' : 's'}`
              }
            >
              {sourcesText(page.sources)}
            </span>
          )}
        </span>
      </button>

      <div className="mk-stats">
        <span className="mk-stat mk-stat--accent">
          <span
            className="mk-stat-value"
            title={`${page.windowPositions} position${page.windowPositions === 1 ? '' : 's'} opened`}
          >
            +{page.windowSupporters}
          </span>
          <span className="mk-stat-label">
            {page.windowSupporters === 1 ? 'Person' : 'People'} · {timeWindow}
          </span>
        </span>
        <span className="mk-stat">
          <span className="mk-stat-value">
            <Users className="h-3 w-3" aria-hidden /> {page.supporters}
            {page.supportersCapped ? '+' : ''}
          </span>
          <span className="mk-stat-label">Supporters · all claims</span>
        </span>
        <span className="mk-stat">
          <span className="mk-stat-value">
            {formatTrust(BigInt(page.totalStaked))}
          </span>
          <span className="mk-stat-label">Staked · all claims</span>
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
        <span
          className="mk-claim-pill"
          title="The page market: I | recommends | page"
        >
          {meta.label}
        </span>
        <button
          type="button"
          className="pm-dex-invest"
          style={{ background: meta.color }}
          onClick={() => onTakePosition(page)}
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

  // "Take position" = Recommend the page: deposit on its market claim
  // (`I | recommends | page`, progressive curve), or create it.
  const handleTakePosition = (page: TrendingPageItem) => {
    if (!authenticated) {
      login()
      return
    }
    const claim = page.market.claim
    cart.addItem(
      claim
        ? {
            id: `${claim.termId}-support`,
            side: 'support',
            termId: claim.termId,
            objectId: page.market.objectId,
            intention: RECOMMEND_LABEL,
            title: page.title,
            favicon: page.favicon,
            intentionColor: RECOMMEND_COLOR,
            curveId: 2,
          }
        : {
            id: `recommend:${page.market.objectId}`,
            side: 'support',
            kind: 'create-triple',
            termId: `recommend:${page.market.objectId}`,
            subjectId: SOFIA_I_ATOM_ID,
            predicateId: CANONICAL_PREDICATE_IDS.recommends,
            objectId: page.market.objectId,
            intention: RECOMMEND_LABEL,
            title: page.title,
            favicon: page.favicon,
            intentionColor: RECOMMEND_COLOR,
            curveId: 2,
          },
    )
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

      <MissionsPanel walletAddress={user?.wallet?.address} />
      <EarlySignalsSection />

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
          // The page market when it exists (Support / Oppose on recommends),
          // else the busiest legacy claim, read-only history
          termId={(boardPage.market.claim ?? boardPage.mainClaim).termId}
          counterTermId={
            (boardPage.market.claim ?? boardPage.mainClaim).counterTermId
          }
          title={boardPage.title}
          favicon={boardPage.favicon}
          intention={
            boardPage.market.claim
              ? RECOMMEND_LABEL
              : claimMeta(boardPage.mainClaim.predicateLabel).label
          }
          intentionColor={
            boardPage.market.claim
              ? RECOMMEND_COLOR
              : claimMeta(boardPage.mainClaim.predicateLabel).color
          }
          walletAddress={user?.wallet?.address}
          curveId={boardPage.market.claim ? 2 : undefined}
          context={boardContext(boardPage)}
        />
      )}
    </div>
  )
}
