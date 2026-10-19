/**
 * EarlySignalsSection — the month's best calls (TREND_HUNTER_SPEC §5.2):
 * "Spotted by @x, N days before the next 5". On Explore and atop Trending.
 * Hidden until the month has at least one signal.
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Address } from 'viem'
import { Avatar } from '@0xsofia/design-system'
import { useEnsNames } from '@/hooks/useEnsNames'
import { formatMonth, useEarlySignals } from '@/hooks/useTrendHunters'
import { extractDomain } from '@/utils/formatting'
import { getFaviconUrl } from '@/utils/favicon'
import '@/components/styles/market-pages.css'

function leadLabel(days: number): string {
  if (days < 1) return 'the same day as the next 5'
  return `${days} day${days === 1 ? '' : 's'} before the next 5`
}

export default function EarlySignalsSection() {
  const { entries, month } = useEarlySignals(6)
  const wallets = useMemo(
    () => entries.map((e) => e.wallet as Address),
    [entries],
  )
  const { getDisplay, getAvatar } = useEnsNames(wallets)

  if (entries.length === 0 || !month) return null

  return (
    <section className="mk-missions" aria-label="Early signals">
      <header className="mk-missions-head">
        <span className="mk-missions-label">
          Early signals · {formatMonth(month)}
        </span>
        <Link to="/leaderboard?tab=trend-hunters" className="mk-signals-more">
          Trend Hunters
        </Link>
      </header>
      <ul className="mk-missions-list">
        {entries.map((s) => {
          const addr = s.wallet as Address
          const domain = s.pageUrl ? extractDomain(s.pageUrl) : null
          const title = s.pageLabel || domain || 'A page'
          return (
            <li key={s.claimId} className="mk-mission mk-signal">
              <span className="mk-signal-page">
                {domain && (
                  <img src={getFaviconUrl(domain, 32)} alt="" aria-hidden />
                )}
                {s.pageUrl ? (
                  <a href={s.pageUrl} target="_blank" rel="noreferrer">
                    {title}
                  </a>
                ) : (
                  <span>{title}</span>
                )}
              </span>
              <Link to={`/profile/${s.wallet}`} className="mk-signal-by">
                <Avatar
                  label={getDisplay(addr)}
                  imageUrl={getAvatar(addr)}
                  size={20}
                />
                <span>
                  Spotted by <strong>{getDisplay(addr)}</strong>,{' '}
                  {leadLabel(s.leadDays)}
                </span>
              </Link>
              <span className="mk-mission-desc">
                {s.followers} credible followers this month
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
