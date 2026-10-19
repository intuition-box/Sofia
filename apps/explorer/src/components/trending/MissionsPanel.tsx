/**
 * MissionsPanel — Trend Hunter missions on /trending (TREND_HUNTER_SPEC §5).
 * Three daily missions + the topic of the week, computed from the wallet's
 * on-chain positions. Hidden when no wallet is connected.
 */
import { Check } from 'lucide-react'
import type { MissionProgress } from '@0xsofia/quests'
import { useMissions } from '@/hooks/useMissions'

/** "resets in 5h" — days end at 00:00 UTC */
function resetsIn(): string {
  const now = new Date()
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  )
  const hours = Math.max(1, Math.round((next - now.getTime()) / 3_600_000))
  return `resets in ${hours}h`
}

function MissionCard({ mission }: { mission: MissionProgress }) {
  const pct = Math.round((mission.progress / mission.target) * 100)
  return (
    <li
      className={`mk-mission${mission.done ? ' is-done' : ''}`}
      title={mission.description}
    >
      <div className="mk-mission-top">
        <span className="mk-mission-title">{mission.title}</span>
        <span className="mk-mission-count">
          {mission.done ? (
            <Check size={14} aria-label="done" />
          ) : (
            `${mission.progress}/${mission.target}`
          )}
        </span>
      </div>
      <span className="mk-mission-desc">{mission.description}</span>
      <span className="mk-mission-bar" aria-hidden>
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
  if (!walletAddress) return null

  return (
    <section className="mk-missions" aria-label="Your missions">
      <header className="mk-missions-head">
        <span className="mk-missions-label">Trend Hunter · missions</span>
        <span className="mk-missions-reset">{resetsIn()}</span>
      </header>
      {loading || !missions ? (
        <div className="mk-missions-loading">Loading your missions…</div>
      ) : (
        <ul className="mk-missions-list">
          {missions.daily.map((m) => (
            <MissionCard key={m.id} mission={m} />
          ))}
          <MissionCard mission={missions.weekly} />
        </ul>
      )}
    </section>
  )
}
