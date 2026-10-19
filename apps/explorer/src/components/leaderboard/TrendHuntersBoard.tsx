/**
 * TrendHuntersBoard — the month's Flair ranking (TREND_HUNTER_SPEC §4, §5.4).
 * Flair = Σ credibility of the accounts that took a position after you on a
 * page where you were among the first 3. The Top 10 earns the month's badge.
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Address } from 'viem'
import { Avatar } from '@0xsofia/design-system'
import { useEnsNames } from '@/hooks/useEnsNames'
import {
  formatMonth,
  TREND_HUNTER_BADGE_RANK,
  useTrendHunters,
} from '@/hooks/useTrendHunters'
import { timeAgo } from '@/utils/formatting'

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

  if (loading) return <p className="hm-empty">Loading…</p>
  if (error) return <p className="hm-empty">Trend Hunters are unavailable.</p>

  return (
    <section className="mk-missions" aria-label="Trend Hunters">
      <header className="mk-missions-head">
        <span className="mk-missions-label">
          Trend Hunters{month ? ` · ${formatMonth(month)}` : ''}
        </span>
        {computedAt && (
          <span className="mk-missions-reset">
            Updated {timeAgo(computedAt)}
          </span>
        )}
      </header>
      <p className="mk-mission-desc mk-hunters-intro">
        Flair grows when credible accounts take a position after you on a page
        where you were among the first 3. The Top {TREND_HUNTER_BADGE_RANK} of
        the month earn the Trend Hunter badge.
      </p>
      {entries.length === 0 ? (
        <p className="hm-empty">
          No Trend Hunters yet this month. Be early on a page others follow.
        </p>
      ) : (
        <ol className="mk-hunters">
          {entries.map((e) => {
            const addr = e.wallet as Address
            const classes = [
              'mk-hunter',
              e.rank <= TREND_HUNTER_BADGE_RANK && 'is-top',
              e.wallet === me && 'is-me',
            ]
              .filter(Boolean)
              .join(' ')
            return (
              <li key={e.wallet} className={classes}>
                <span className="mk-hunter-rank">#{e.rank}</span>
                <Link to={`/profile/${e.wallet}`} className="mk-hunter-who">
                  <Avatar
                    label={getDisplay(addr)}
                    imageUrl={getAvatar(addr)}
                    size={28}
                  />
                  <span>{getDisplay(addr)}</span>
                </Link>
                <span className="mk-hunter-calls">
                  {e.calls > 0
                    ? `${e.calls} call${e.calls === 1 ? '' : 's'}`
                    : ''}
                </span>
                <span className="mk-hunter-flair" title="Flair">
                  {Math.round(e.flair).toLocaleString()}
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
