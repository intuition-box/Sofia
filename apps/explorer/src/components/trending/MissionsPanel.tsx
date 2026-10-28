/**
 * MissionsPanel — Trend Hunter on /trending (TREND_HUNTER_SPEC §5): today's
 * three missions + the topic of the week, computed from the wallet's
 * on-chain positions, and what hunting earns — free Recommends per call, a
 * share of the monthly pool for the Top 10. Logged out: the pitch and a
 * connect button.
 */
import { Link } from 'react-router-dom'
import { useLogin } from '@privy-io/react-auth'
import { CircleHelp, Wallet } from 'lucide-react'
import { AnimatedNumber, ModuleHead, StatePill } from '@0xsofia/design-system'
import type { MissionProgress } from '@0xsofia/quests'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useMissions } from '@/hooks/useMissions'
import {
  CREDITS_PER_CALL,
  useTrendHunters,
  type TrendHunterEntry,
  type TrendHunterPool,
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

/** What the wallet earned this month, else what hunting can earn */
function rewardLabel(
  mine: TrendHunterEntry | undefined,
  pool: TrendHunterPool | null,
): string {
  const parts: string[] = []
  if (mine?.calls)
    parts.push(`+${mine.calls * CREDITS_PER_CALL} free Recommends`)
  if (mine?.reward) parts.push(`${mine.reward.toFixed(2)} TRUST`)
  if (parts.length > 0) return `Earned: ${parts.join(' · ')}`
  return pool
    ? `Top ${pool.size} share ${pool.trust} TRUST`
    : `+${CREDITS_PER_CALL} free Recommends per call`
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
            <AnimatedNumber value={mission.progress} />/{mission.target}
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
  const { entries, pool } = useTrendHunters(50)
  const { login } = useLogin()

  const me = walletAddress?.toLowerCase()
  const mine = me ? entries.find((e) => e.wallet === me) : undefined

  return (
    <section className="th-section" aria-label="Trend Hunter missions">
      <ModuleHead
        title={
          <span className="th-title-hint">
            Missions
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="th-hint"
                  aria-label="How Trend Hunter works"
                >
                  <CircleHelp aria-hidden />
                </button>
              </TooltipTrigger>
              <TooltipContent className="th-hint-content">
                Be early on pages others will follow. When 5 credible accounts
                follow you on a page, that call earns +{CREDITS_PER_CALL} free
                Recommends.
                {pool && (
                  <>
                    {' '}
                    The Top {pool.size} of the month share {pool.trust} TRUST,
                    by Flair.
                  </>
                )}
                {walletAddress && (
                  <>
                    <br />
                    {resetsIn()}.
                  </>
                )}
              </TooltipContent>
            </Tooltip>
          </span>
        }
        right={
          <Link to="/leaderboard?tab=trend-hunters" className="pm-chip">
            {rewardLabel(mine, pool)}
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
        <ul className="th-cards" style={{ listStyle: 'none', padding: 0 }}>
          {missions.daily.map((m) => (
            <MissionCard key={m.id} mission={m} />
          ))}
          <MissionCard mission={missions.weekly} />
        </ul>
      )}
    </section>
  )
}
