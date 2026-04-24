/**
 * StreaksPage — `/streaks`. Daily certification / voting streak
 * leaderboard. Native proto-aligned markup; all tokens via `--ds-*`.
 * Keeps the gold/silver/bronze podium + animated entrance.
 */
import { useState } from 'react'
import { formatEther, type Address } from 'viem'
import { Flame } from 'lucide-react'
import { useStreakLeaderboard } from '@/hooks/useStreakLeaderboard'
import { DAILY_CERTIFICATION_ATOM_ID, DAILY_VOTE_ATOM_ID } from '@/services/streakService'
import { useEnsNames } from '@/hooks/useEnsNames'
import SofiaLoader from '@/components/ui/SofiaLoader'
import { PageHero } from '@0xsofia/design-system'
import { PAGE_COLORS } from '@/config/pageColors'
import { avatarColor } from '@/utils/avatarColor'
import '@/components/styles/pages.css'
import '@/components/styles/streaks-page.css'

function formatShares(shares: string): string {
  const num = parseFloat(formatEther(BigInt(shares)))
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  if (num >= 100) return num.toFixed(1)
  if (num >= 1) return num.toFixed(2)
  return num.toFixed(4)
}

function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

const PODIUM_ORDER = [1, 0, 2] as const
const PODIUM_LABELS = ['', '1ST', '2ND', '3RD']

type Tab = 'signals' | 'vote'

interface StreakEntry {
  address: string
  streakDays: number
  shares: string
  displayName: string
  avatar: string
}

function PodiumAvatar({ entry, rank }: { entry: StreakEntry; rank: number }) {
  const bg = avatarColor(entry.address)
  return (
    <div className={`sp-avatar sp-avatar--${rank}`} style={{ background: bg }}>
      {entry.avatar ? (
        <img
          src={entry.avatar}
          alt=""
          onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
        />
      ) : null}
      <span className="sp-avatar-fallback">
        {entry.displayName.slice(0, 2).toUpperCase()}
      </span>
    </div>
  )
}

export default function StreaksPage() {
  const [tab, setTab] = useState<Tab>('signals')
  const signals = useStreakLeaderboard(DAILY_CERTIFICATION_ATOM_ID)
  const vote = useStreakLeaderboard(DAILY_VOTE_ATOM_ID)
  const active = tab === 'signals' ? signals : vote
  const { entries, loading, error } = active

  const addresses = entries.map((e) => e.address as Address)
  const { getDisplay, getAvatar } = useEnsNames(addresses)

  const streakData: StreakEntry[] = entries.map((entry) => ({
    ...entry,
    displayName: getDisplay(entry.address as Address),
    avatar: getAvatar(entry.address as Address),
  }))

  const top3 = streakData.slice(0, 3)
  const rest = streakData.slice(3)

  const pc = PAGE_COLORS['/streaks']

  return (
    <div className="page-content page-enter sp-page">
      <PageHero background={pc.color} title={pc.title} description={pc.subtitle} />

      {/* Filter row — tabs on the left, summary pill on the right. */}
      <div className="sp-filters">
        <div className="sp-tabs" role="tablist" aria-label="Streak type">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'signals'}
            className={`sp-tab${tab === 'signals' ? ' sp-tab--active' : ''}`}
            onClick={() => setTab('signals')}
          >
            Signals
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'vote'}
            className={`sp-tab${tab === 'vote' ? ' sp-tab--active' : ''}`}
            onClick={() => setTab('vote')}
          >
            Vote
          </button>
        </div>

        {!loading ? (
          <div className="sp-summary">
            <span className="sp-summary-icon" aria-hidden="true">
              <Flame className="h-4 w-4" />
            </span>
            <span className="sp-summary-label">
              {tab === 'signals' ? 'Daily signals' : 'Daily votes'}
            </span>
            <span className="sp-summary-count">
              {streakData.length} streaker{streakData.length === 1 ? '' : 's'}
            </span>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="sp-loader">
          <SofiaLoader size={96} />
        </div>
      ) : null}

      {error ? <div className="sp-error">{error}</div> : null}

      {/* Podium — rendered only once top 3 are in. */}
      {!loading && top3.length >= 3 ? (
        <section className="sp-podium" aria-label="Top 3 streakers">
          {PODIUM_ORDER.map((dataIdx) => {
            const rank = dataIdx + 1
            const entry = top3[dataIdx]
            return (
              <article
                key={entry.address}
                className={`sp-pedestal sp-pedestal--${rank}`}
              >
                <div className="sp-pedestal-avatar">
                  <PodiumAvatar entry={entry} rank={rank} />
                </div>
                <div className="sp-pedestal-info">
                  <p className="sp-pedestal-name">{entry.displayName}</p>
                  <div className="sp-pedestal-streak">
                    <Flame className="h-3.5 w-3.5" />
                    <span>{entry.streakDays}d</span>
                  </div>
                </div>
                <div className="sp-pedestal-block">
                  <span className="sp-pedestal-rank">{PODIUM_LABELS[rank]}</span>
                </div>
              </article>
            )
          })}
        </section>
      ) : null}

      {/* Rank #4+ list */}
      {!loading && !error && rest.length > 0 ? (
        <section className="sp-list">
          <header className="sp-list-head">
            <span className="sp-list-title">Rankings</span>
            <span className="sp-list-count">{rest.length}</span>
          </header>
          <div className="sp-list-rows">
            {rest.map((entry, i) => {
              const bg = avatarColor(entry.address)
              const hasStreak = entry.streakDays > 0
              return (
                <div key={entry.address} className="sp-row">
                  <span className="sp-row-rank">{i + 4}</span>
                  <span className="sp-row-avatar" style={{ background: bg }}>
                    {entry.avatar ? (
                      <img
                        src={entry.avatar}
                        alt=""
                        onError={(e) =>
                          ((e.target as HTMLImageElement).style.display = 'none')
                        }
                      />
                    ) : null}
                    <span className="sp-row-avatar-fallback">
                      {entry.displayName.slice(0, 2).toUpperCase()}
                    </span>
                  </span>
                  <div className="sp-row-user">
                    <span className="sp-row-name">{entry.displayName}</span>
                    <span className="sp-row-addr">{shortAddress(entry.address)}</span>
                  </div>
                  <div className={`sp-row-streak${hasStreak ? ' is-active' : ''}`}>
                    <Flame className="h-3.5 w-3.5" />
                    <span>{entry.streakDays}</span>
                  </div>
                  <div className="sp-row-trust">
                    <span className="sp-row-trust-num">{formatShares(entry.shares)}</span>
                    <span className="sp-row-trust-lbl">TRUST</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}

      {!loading && !error && streakData.length === 0 ? (
        <div className="sp-empty">No streakers yet — light the first flame.</div>
      ) : null}
    </div>
  )
}
