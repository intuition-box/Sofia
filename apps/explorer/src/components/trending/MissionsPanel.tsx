/**
 * MissionsPanel — Trend Hunter on /trending (TREND_HUNTER_SPEC §5): today's
 * three missions + the topic of the week, computed from the wallet's
 * on-chain positions, and a way into the monthly ranking. Logged out: the
 * pitch and a connect button.
 */
import { Link } from 'react-router-dom'
import { useLogin } from '@privy-io/react-auth'
import { Wallet } from 'lucide-react'
import { ModuleHead, StatePill } from '@0xsofia/design-system'
import type { MissionProgress } from '@0xsofia/quests'
import { useMissions } from '@/hooks/useMissions'
import {
  TREND_HUNTER_BADGE_RANK,
  useTrendHunters,
} from '@/hooks/useTrendHunters'
import '@0xsofia/design-system/styles/module-head.css'
import '@0xsofia/design-system/styles/state-pill.css'
import '@/components/styles/platform-market.css'
import '@/components/styles/trend-hunter.css'

/** "Resets in 5h" — days end at 00:00 UTC */
function resetsIn(): string {
  const now = new Date()
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  )
  const hours = Math.max(1, Math.round((next - now.getTime()) / 3_600_000))
  return `Daily missions reset in ${hours}h`
}

function MissionCard({ mission }: { mission: MissionProgress }) {
  const pct = Math.round((mission.progress / mission.target) * 100)
  return (
    <li className="th-card">
      <div className="th-card-top">
        <span className="th-card-title">{mission.title}</span>
        {mission.done ? (
          <StatePill state="aligned" label="Done" />
        ) : (
          <span className="th-value">
            {mission.progress}/{mission.target}
          </span>
        )}
      </div>
      <span className="th-desc">{mission.description}</span>
      <span className="th-bar" aria-hidden>
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
  const { entries } = useTrendHunters(50)
  const { login } = useLogin()

  const me = walletAddress?.toLowerCase()
  const mine = me ? entries.find((e) => e.wallet === me) : undefined

  return (
    <section className="th-section" aria-label="Trend Hunter missions">
      <ModuleHead
        title="Trend Hunter"
        desc={`Be early on pages others will follow. The Top ${TREND_HUNTER_BADGE_RANK} of the month earn the Trend Hunter badge.`}
        right={
          <Link to="/leaderboard?tab=trend-hunters" className="pm-chip">
            {mine ? `#${mine.rank} this month` : 'Ranking'}
          </Link>
        }
      />
      {!walletAddress ? (
        <button
          type="button"
          className="pm-dex-invest"
          style={{ background: 'var(--ds-accent)' }}
          onClick={() => login()}
        >
          <Wallet className="h-3.5 w-3.5" aria-hidden />
          Connect to start hunting
        </button>
      ) : loading || !missions ? (
        <p className="th-desc">Loading your missions…</p>
      ) : (
        <>
          <ul className="th-cards" style={{ listStyle: 'none', padding: 0 }}>
            {missions.daily.map((m) => (
              <MissionCard key={m.id} mission={m} />
            ))}
            <MissionCard mission={missions.weekly} />
          </ul>
          <p className="th-foot">{resetsIn()}</p>
        </>
      )}
    </section>
  )
}
