/**
 * EarlySignalsSection — the month's best calls (TREND_HUNTER_SPEC §5.2):
 * "Spotted by @x, N days before the next 5". On Explore and atop Trending.
 * Hidden until the month has at least one signal.
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Address } from 'viem'
import { Avatar, ModuleHead } from '@0xsofia/design-system'
import { useEnsNames } from '@/hooks/useEnsNames'
import { formatMonth, useEarlySignals } from '@/hooks/useTrendHunters'
import { extractDomain } from '@/utils/formatting'
import { getFaviconUrl } from '@/utils/favicon'
import '@0xsofia/design-system/styles/module-head.css'
import '@/components/styles/platform-market.css'
import '@/components/styles/trend-hunter.css'

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
    <section className="th-section" aria-label="Early signals">
      <ModuleHead
        title="Early signals"
        desc={`Pages spotted early in ${formatMonth(month)}, before credible accounts followed.`}
        right={
          <Link to="/leaderboard?tab=trend-hunters" className="pm-chip">
            Trend Hunters
          </Link>
        }
      />
      <ul className="th-cards" style={{ listStyle: 'none', padding: 0 }}>
        {entries.map((s) => {
          const addr = s.wallet as Address
          const domain = s.pageUrl ? extractDomain(s.pageUrl) : null
          const title = s.pageLabel || domain || 'A page'
          return (
            <li key={s.claimId} className="th-card">
              <span className="th-card-title th-signal-page">
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
              <Link to={`/profile/${s.wallet}`} className="th-signal-by">
                <Avatar
                  label={getDisplay(addr)}
                  imageUrl={getAvatar(addr)}
                  size={20}
                />
                <span>
                  Spotted by {getDisplay(addr)}, {leadLabel(s.leadDays)}
                </span>
              </Link>
              <span className="th-eyebrow">
                {s.followers} credible followers
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
