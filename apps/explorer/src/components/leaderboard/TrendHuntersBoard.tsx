/**
 * TrendHuntersBoard — the month's Flair ranking (TREND_HUNTER_SPEC §4, §5.4):
 * the account's progress (HunterProgress), the month's summary, its early
 * signals, then the ranking.
 *
 * Flair = Σ credibility of the accounts that took a position after you on a
 * page where you were among the first 3. Each call earns free Recommends; the
 * Top 10 earn the month's badge and share the monthly TRUST pool.
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Address } from 'viem'
import {
  AnimatedNumber,
  Avatar,
  ModuleHead,
  StatePill,
} from '@0xsofia/design-system'
import SofiaLoader from '@/components/ui/SofiaLoader'
import EarlySignalsSection from '@/components/trending/EarlySignalsSection'
import HunterProgress from './HunterProgress'
import { useEnsNames } from '@/hooks/useEnsNames'
import {
  formatMonth,
  TREND_HUNTER_BADGE_RANK,
  useTrendHunters,
} from '@/hooks/useTrendHunters'
import '@0xsofia/design-system/styles/module-head.css'
import '@0xsofia/design-system/styles/state-pill.css'
import '@/components/styles/trend-hunter.css'

const flair = (n: number) => Math.round(n).toLocaleString()

export default function TrendHuntersBoard({
  connectedAddress,
}: {
  connectedAddress?: string | null
}) {
  const { entries, month, pool, loading, error } = useTrendHunters(50)
  const wallets = useMemo(
    () => entries.map((e) => e.wallet as Address),
    [entries],
  )
  const { getDisplay, getAvatar } = useEnsNames(wallets)
  const me = connectedAddress?.toLowerCase()
  const totalCalls = entries.reduce((sum, e) => sum + e.calls, 0)
  const monthLabel = month ? formatMonth(month) : ''

  return (
    <div>
      <HunterProgress wallet={connectedAddress} />

      <section className="th-section">
        <ModuleHead
          title={`Trend Hunters${monthLabel ? ` · ${monthLabel}` : ''}`}
          desc="Flair grows when credible accounts take a position after you on a page where you were among the first 3."
        />
        <div className="mk-summary">
          <div className="mk-summary-stat">
            <span className="mk-summary-value">
              <AnimatedNumber value={entries.length} />
            </span>
            <span className="mk-summary-label">Hunters ranked</span>
          </div>
          <div className="mk-summary-stat">
            <span className="mk-summary-value">
              <AnimatedNumber value={totalCalls} />
            </span>
            <span className="mk-summary-label">Calls this month</span>
          </div>
          <div className="mk-summary-stat">
            <span className="mk-summary-value">
              {pool ? `${pool.trust.toLocaleString()} TRUST` : '—'}
            </span>
            <span className="mk-summary-label">
              Pool for the Top {pool?.size ?? TREND_HUNTER_BADGE_RANK}
            </span>
          </div>
        </div>
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
              <span role="columnheader" className="th-num">
                Reward
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
                  <span className="th-num">
                    <AnimatedNumber value={e.flair} format={flair} />
                  </span>
                  <span className="th-num">
                    {e.reward ? (
                      <AnimatedNumber
                        value={e.reward}
                        format={(n) => `${n.toFixed(2)} TRUST`}
                      />
                    ) : (
                      '—'
                    )}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
