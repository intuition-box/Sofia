/**
 * MissionsPanel — the Trend Hunter hero on /trending (TREND_HUNTER_SPEC §5).
 * Today's three missions + the topic of the week, computed from the wallet's
 * on-chain positions, with the wallet's monthly rank and a way into the
 * Trend Hunters ranking. Logged out: the pitch and a connect button.
 */
import { Link } from 'react-router-dom'
import { useLogin } from '@privy-io/react-auth'
import { Check, ChevronRight, Crosshair, Wallet } from 'lucide-react'
import type { MissionProgress } from '@0xsofia/quests'
import { useMissions } from '@/hooks/useMissions'
import {
  formatMonth,
  TREND_HUNTER_BADGE_RANK,
  useTrendHunters,
} from '@/hooks/useTrendHunters'

/** "Resets in 5h" — days end at 00:00 UTC */
function resetsIn(): string {
  const now = new Date()
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  )
  const hours = Math.max(1, Math.round((next - now.getTime()) / 3_600_000))
  return `Resets in ${hours}h`
}

function MissionCard({ mission }: { mission: MissionProgress }) {
  const pct = Math.round((mission.progress / mission.target) * 100)
  return (
    <li className={`th-mission${mission.done ? ' is-done' : ''}`}>
      <div className="th-mission-top">
        <span className="th-mission-period">
          {mission.period === 'week' ? 'This week' : 'Today'}
        </span>
        <span className="th-mission-count">
          {mission.done ? (
            <Check size={16} aria-label="done" />
          ) : (
            `${mission.progress}/${mission.target}`
          )}
        </span>
      </div>
      <span className="th-mission-title">{mission.title}</span>
      <span className="th-mission-desc">{mission.description}</span>
      <span className="th-mission-bar" aria-hidden>
        <span style={{ width: `${pct}%` }} />
      </span>
    </li>
  )
}

export default function MissionsPanel({
  walletAddress,
}: {
  walletAddress?: string | null
}) {
  const { missions, loading } = useMissions(walletAddress)
  const { entries, month } = useTrendHunters(50)
  const { login } = useLogin()

  const me = walletAddress?.toLowerCase()
  const mine = me ? entries.find((e) => e.wallet === me) : undefined
  const dailyDone = missions?.daily.filter((m) => m.done).length ?? 0

  return (
    <section className="th-hero th-hunt" aria-label="Trend Hunter missions">
      <div className="th-hero-glow" aria-hidden />
      <div className="th-hero-top">
        <span className="th-kicker">
          <Crosshair className="h-3.5 w-3.5" aria-hidden />
          Trend Hunter{month ? ` · ${formatMonth(month)}` : ''}
        </span>
        {walletAddress && <span className="th-countdown">{resetsIn()}</span>}
      </div>

      <div className="th-hunt-head">
        <div>
          <h2 className="th-title">
            {walletAddress
              ? dailyDone === 3
                ? 'Hunt complete for today.'
                : "Today's hunt"
              : 'Spot it before everyone else.'}
          </h2>
          <p className="th-sub">
            {walletAddress
              ? `${dailyDone}/3 daily missions done. Be early on pages others will follow: the Top ${TREND_HUNTER_BADGE_RANK} of the month earn the badge.`
              : `Take a position early on pages that take off. The Top ${TREND_HUNTER_BADGE_RANK} Trend Hunters of the month earn the badge.`}
          </p>
        </div>
        <Link to="/leaderboard?tab=trend-hunters" className="th-rank-card">
          <span className="th-stat-value">{mine ? `#${mine.rank}` : '—'}</span>
          <span className="th-stat-label">
            {mine ? 'Your rank this month' : 'Not ranked yet'}
          </span>
          <span className="th-rank-link">
            Ranking <ChevronRight className="h-3 w-3" aria-hidden />
          </span>
        </Link>
      </div>

      {!walletAddress ? (
        <button type="button" className="th-connect" onClick={() => login()}>
          <Wallet className="h-4 w-4" aria-hidden />
          Connect to start hunting
        </button>
      ) : loading || !missions ? (
        <div className="th-mission-loading">Loading your missions…</div>
      ) : (
        <ul className="th-missions">
          {missions.daily.map((m) => (
            <MissionCard key={m.id} mission={m} />
          ))}
          <MissionCard mission={missions.weekly} />
        </ul>
      )}
    </section>
  )
}
