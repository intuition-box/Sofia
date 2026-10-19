/**
 * TrendHuntersBoard — the month's Flair ranking (TREND_HUNTER_SPEC §4, §5.4),
 * staged as an event: hero with the countdown, your standing, a podium for
 * the top 3, how to climb, the month's early signals, then the ranking.
 *
 * Flair = Σ credibility of the accounts that took a position after you on a
 * page where you were among the first 3. The Top 10 earns the month's badge.
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Address } from 'viem'
import { Crosshair, Radar, Trophy, Users } from 'lucide-react'
import { Avatar } from '@0xsofia/design-system'
import SofiaLoader from '@/components/ui/SofiaLoader'
import EarlySignalsSection from '@/components/trending/EarlySignalsSection'
import { useEnsNames } from '@/hooks/useEnsNames'
import {
  formatMonth,
  TREND_HUNTER_BADGE_RANK,
  useTrendHunters,
  type TrendHunterEntry,
} from '@/hooks/useTrendHunters'
import { timeAgo } from '@/utils/formatting'
import '@/components/styles/streaks-page.css'

const PODIUM_ORDER = [1, 0, 2] as const
const PODIUM_LABELS = ['', '1ST', '2ND', '3RD']

const STEPS = [
  {
    icon: Radar,
    title: 'Be early',
    text: 'Take a position on a page while it is still unknown: be among the first 3.',
  },
  {
    icon: Users,
    title: 'Get followed',
    text: 'Every credible account that takes a position after you this month adds to your Flair.',
  },
  {
    icon: Trophy,
    title: 'Make the Top 10',
    text: 'The 10 best Trend Hunters of the month earn the badge on their profile.',
  },
]

/** "Ends in 12 days" — months close at 00:00 UTC on the 1st */
function endsIn(month: string | null): string | null {
  if (!month) return null
  const [y, m] = month.split('-').map(Number)
  const ms = Date.UTC(y, m, 1) - Date.now()
  if (ms <= 0) return 'Final ranking'
  const days = Math.floor(ms / 86_400_000)
  if (days >= 1) return `Ends in ${days} day${days === 1 ? '' : 's'}`
  return `Ends in ${Math.max(1, Math.round(ms / 3_600_000))}h`
}

const flair = (n: number) => Math.round(n).toLocaleString()

export default function TrendHuntersBoard({
  connectedAddress,
}: {
  connectedAddress?: string | null
}) {
  const { entries, month, computedAt, loading, error } = useTrendHunters(50)
  const wallets = useMemo(
    () => entries.map((e) => e.wallet as Address),
    [entries],
  )
  const { getDisplay, getAvatar } = useEnsNames(wallets)
  const me = connectedAddress?.toLowerCase()
  const mine = entries.find((e) => e.wallet === me)
  const tenth = entries[TREND_HUNTER_BADGE_RANK - 1]
  const totalCalls = entries.reduce((sum, e) => sum + e.calls, 0)
  const top = entries.slice(0, 3)
  const rest = entries.slice(3)
  const monthLabel = month ? formatMonth(month) : ''

  const standing = (() => {
    if (!me) return null
    if (mine && mine.rank <= TREND_HUNTER_BADGE_RANK) {
      return `You're #${mine.rank} with ${flair(mine.flair)} Flair: badge secured if you hold on.`
    }
    if (mine && tenth) {
      return `You're #${mine.rank}. ${flair(tenth.flair - mine.flair + 1)} more Flair to enter the Top ${TREND_HUNTER_BADGE_RANK}.`
    }
    return "You're not ranked yet. Be first on a page others will follow."
  })()

  const renderPedestal = (entry: TrendHunterEntry, rank: number) => {
    const addr = entry.wallet as Address
    return (
      <Link
        key={entry.wallet}
        to={`/profile/${entry.wallet}`}
        className={`sp-pedestal sp-pedestal--${rank} th-pedestal`}
      >
        <div className="sp-pedestal-avatar">
          <Avatar
            label={getDisplay(addr)}
            imageUrl={getAvatar(addr)}
            size={rank === 1 ? 72 : 56}
            className={`sp-avatar sp-avatar--${rank}`}
          />
        </div>
        <div className="sp-pedestal-info">
          <p className="sp-pedestal-name">{getDisplay(addr)}</p>
          <div className="th-pedestal-flair">
            {flair(entry.flair)} <span>Flair</span>
          </div>
          {entry.calls > 0 && (
            <div className="th-pedestal-calls">
              {entry.calls} call{entry.calls === 1 ? '' : 's'}
            </div>
          )}
        </div>
        <div className="sp-pedestal-block">
          <span className="sp-pedestal-rank">{PODIUM_LABELS[rank]}</span>
        </div>
      </Link>
    )
  }

  return (
    <div className="th-board">
      <section className="th-hero" aria-label="Trend Hunters">
        <div className="th-hero-glow" aria-hidden />
        <div className="th-hero-top">
          <span className="th-kicker">
            <Crosshair className="h-3.5 w-3.5" aria-hidden />
            Trend Hunters · {monthLabel}
          </span>
          {month && <span className="th-countdown">{endsIn(month)}</span>}
        </div>
        <h2 className="th-title">Spot it before everyone else.</h2>
        <p className="th-sub">
          The Top {TREND_HUNTER_BADGE_RANK} of the month earn the{' '}
          <span className="th-badge">
            <Crosshair className="h-3 w-3" aria-hidden />
            Trend Hunter · {monthLabel}
          </span>{' '}
          badge on their profile.
        </p>
        <div className="th-stats">
          <div className="th-stat">
            <span className="th-stat-value">{entries.length}</span>
            <span className="th-stat-label">Hunters ranked</span>
          </div>
          <div className="th-stat">
            <span className="th-stat-value">{totalCalls}</span>
            <span className="th-stat-label">Calls this month</span>
          </div>
          <div className="th-stat">
            <span className="th-stat-value">
              {mine ? `#${mine.rank}` : '—'}
            </span>
            <span className="th-stat-label">Your rank</span>
          </div>
        </div>
        {standing && <p className="th-standing">{standing}</p>}
      </section>

      {loading ? (
        <div className="sp-loader">
          <SofiaLoader size={64} />
        </div>
      ) : error ? (
        <div className="sp-empty">Trend Hunters are unavailable right now.</div>
      ) : entries.length === 0 ? (
        <div className="sp-empty">
          Nobody is ranked yet this month. The first call of {monthLabel} is
          still open.
        </div>
      ) : (
        <section className="sp-podium" aria-label="Top 3 Trend Hunters">
          {PODIUM_ORDER.filter((i) => top[i]).map((i) =>
            renderPedestal(top[i], i + 1),
          )}
        </section>
      )}

      <section className="th-steps" aria-label="How to climb">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <div key={title} className="th-step">
            <span className="th-step-num">{i + 1}</span>
            <Icon className="th-step-icon" aria-hidden />
            <span className="th-step-title">{title}</span>
            <span className="th-step-text">{text}</span>
          </div>
        ))}
      </section>

      <EarlySignalsSection />

      {rest.length > 0 && (
        <section className="sp-list">
          <header className="sp-list-head">
            <span className="sp-list-title">Rankings</span>
            {computedAt && (
              <span className="sp-list-count">
                Updated {timeAgo(computedAt)}
              </span>
            )}
          </header>
          <ol className="th-rows">
            {rest.map((e) => {
              const addr = e.wallet as Address
              const classes = [
                'th-row',
                e.rank <= TREND_HUNTER_BADGE_RANK && 'is-top',
                e.wallet === me && 'is-me',
              ]
                .filter(Boolean)
                .join(' ')
              return (
                <li key={e.wallet}>
                  <Link to={`/profile/${e.wallet}`} className={classes}>
                    <span className="th-row-rank">{e.rank}</span>
                    <Avatar
                      label={getDisplay(addr)}
                      imageUrl={getAvatar(addr)}
                      size={32}
                    />
                    <span className="th-row-name">
                      {getDisplay(addr)}
                      {e.rank <= TREND_HUNTER_BADGE_RANK && (
                        <Crosshair
                          className="th-row-badge"
                          aria-label="Top 10"
                        />
                      )}
                    </span>
                    <span className="th-row-calls">
                      {e.calls > 0
                        ? `${e.calls} call${e.calls === 1 ? '' : 's'}`
                        : ''}
                    </span>
                    <span className="th-row-flair">{flair(e.flair)}</span>
                  </Link>
                </li>
              )
            })}
          </ol>
        </section>
      )}
    </div>
  )
}
