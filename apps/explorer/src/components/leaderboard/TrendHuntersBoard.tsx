/**
 * TrendHuntersBoard — the month's Flair ranking (TREND_HUNTER_SPEC §4, §5.4):
 * header, summary stats, how to climb, the month's early
 * signals, then the ranking.
 *
 * Flair = Σ credibility of the accounts that took a position after you on a
 * page where you were among the first 3. The Top 10 earns the month's badge.
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Address } from 'viem'
import { Avatar, ModuleHead, StatePill } from '@0xsofia/design-system'
import SofiaLoader from '@/components/ui/SofiaLoader'
import EarlySignalsSection from '@/components/trending/EarlySignalsSection'
import { useEnsNames } from '@/hooks/useEnsNames'
import {
  formatMonth,
  TREND_HUNTER_BADGE_RANK,
  useTrendHunters,
} from '@/hooks/useTrendHunters'
import '@0xsofia/design-system/styles/module-head.css'
import '@0xsofia/design-system/styles/state-pill.css'
import '@/components/styles/trend-hunter.css'

const STEPS = [
  {
    title: 'Be early',
    text: 'Take a position on a page while it is still unknown: be among the first 3.',
  },
  {
    title: 'Get followed',
    text: 'Every credible account that takes a position after you this month adds to your Flair.',
  },
  {
    title: `Make the Top ${TREND_HUNTER_BADGE_RANK}`,
    text: 'The best Trend Hunters of the month earn the badge on their profile.',
  },
]

const flair = (n: number) => Math.round(n).toLocaleString()

export default function TrendHuntersBoard({
  connectedAddress,
}: {
  connectedAddress?: string | null
}) {
  const { entries, month, loading, error } = useTrendHunters(50)
  const wallets = useMemo(
    () => entries.map((e) => e.wallet as Address),
    [entries],
  )
  const { getDisplay, getAvatar } = useEnsNames(wallets)
  const me = connectedAddress?.toLowerCase()
  const mine = entries.find((e) => e.wallet === me)
  const tenth = entries[TREND_HUNTER_BADGE_RANK - 1]
  const totalCalls = entries.reduce((sum, e) => sum + e.calls, 0)
  const monthLabel = month ? formatMonth(month) : ''

  const standing = (() => {
    if (!me) return null
    if (mine && mine.rank <= TREND_HUNTER_BADGE_RANK) {
      return `You're #${mine.rank} with ${flair(mine.flair)} Flair — in the Top ${TREND_HUNTER_BADGE_RANK}.`
    }
    if (mine && tenth) {
      return `You're #${mine.rank}. ${flair(tenth.flair - mine.flair + 1)} more Flair to enter the Top ${TREND_HUNTER_BADGE_RANK}.`
    }
    return "You're not ranked yet. Be first on a page others will follow."
  })()

  return (
    <div>
      <section className="th-section">
        <ModuleHead
          title={`Trend Hunters${monthLabel ? ` · ${monthLabel}` : ''}`}
          desc="Flair grows when credible accounts take a position after you on a page where you were among the first 3."
        />
        <div className="mk-summary">
          <div className="mk-summary-stat">
            <span className="mk-summary-value">{entries.length}</span>
            <span className="mk-summary-label">Hunters ranked</span>
          </div>
          <div className="mk-summary-stat">
            <span className="mk-summary-value">{totalCalls}</span>
            <span className="mk-summary-label">Calls this month</span>
          </div>
          <div className="mk-summary-stat">
            <span className="mk-summary-value">
              {mine ? `#${mine.rank}` : '—'}
            </span>
            <span className="mk-summary-label">Your rank</span>
          </div>
          <div className="mk-summary-stat">
            <span className="mk-summary-value">
              {mine ? flair(mine.flair) : '—'}
            </span>
            <span className="mk-summary-label">Your Flair</span>
          </div>
        </div>
        {standing && <p className="th-desc">{standing}</p>}
      </section>

      <section className="th-section" aria-label="How to climb">
        <ol className="th-cards" style={{ listStyle: 'none', padding: 0 }}>
          {STEPS.map((step, i) => (
            <li key={step.title} className="th-card">
              <span className="th-card-title">{step.title}</span>
              <span className="th-desc">{step.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <EarlySignalsSection />

      <section className="th-section" aria-label="Ranking">
        <ModuleHead title="Ranking" />
        {loading ? (
          <div className="pm-loader">
            <SofiaLoader size={48} />
          </div>
        ) : error ? (
          <p className="th-desc">Trend Hunters are unavailable right now.</p>
        ) : entries.length === 0 ? (
          <p className="th-desc">
            Nobody is ranked yet this month — the first call of {monthLabel} is
            still open.
          </p>
        ) : (
          <div className="th-table" role="table">
            <div className="th-row th-row--head" role="row">
              <span role="columnheader">#</span>
              <span role="columnheader">Hunter</span>
              <span role="columnheader">Calls</span>
              <span role="columnheader" className="th-num">
                Flair
              </span>
            </div>
            {entries.map((e) => {
              const addr = e.wallet as Address
              return (
                <Link
                  key={e.wallet}
                  to={`/profile/${e.wallet}`}
                  className={`th-row${e.wallet === me ? ' is-me' : ''}`}
                  role="row"
                >
                  <span className="th-rank">{e.rank}</span>
                  <span className="th-who">
                    <Avatar
                      label={getDisplay(addr)}
                      imageUrl={getAvatar(addr)}
                      size={28}
                    />
                    <span>{getDisplay(addr)}</span>
                    {e.rank <= TREND_HUNTER_BADGE_RANK && (
                      <StatePill
                        state="aligned"
                        label={`Top ${TREND_HUNTER_BADGE_RANK}`}
                      />
                    )}
                  </span>
                  <span className="th-rank">{e.calls || '—'}</span>
                  <span className="th-num">{flair(e.flair)}</span>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
