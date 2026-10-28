/**
 * MissionsPanel — today's three missions + the topic of the week
 * (TREND_HUNTER_SPEC §3), computed from the wallet's on-chain positions.
 * A side card of /spotters, one row per mission. Each one done earns
 * free Recommends: the write-relayer checks the chain on its own.
 */
import { AnimatedNumber } from '@0xsofia/design-system'
import type { MissionProgress } from '@0xsofia/quests'
import { useMissions } from '@/hooks/useMissions'
import { nextUtcDay, useMinuteClock } from '@/hooks/useMinuteClock'
import { countdown } from '@/utils/formatting'
import '@/components/styles/trend-hunter.css'

function MissionRow({ mission }: { mission: MissionProgress }) {
  const pct = Math.round((mission.progress / mission.target) * 100)
  return (
    <li className={`th-mission${mission.done ? ' is-done' : ''}`}>
      <div className="th-mission-top">
        <span className="th-mission-title">{mission.title}</span>
        <span className="th-mission-count">
          {mission.done ? (
            'Done'
          ) : (
            <>
              <AnimatedNumber value={mission.progress} />/{mission.target}
            </>
          )}
        </span>
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
  walletAddress: string
}) {
  const { missions, loading } = useMissions(walletAddress)
  const now = useMinuteClock()

  return (
    <section className="th-panel" aria-label="Today's missions">
      <div className="th-panel-head">
        <h2 className="th-panel-title">Today's missions</h2>
        <span className="th-desc">
          Reset in {countdown(nextUtcDay(now), now)}
        </span>
      </div>
      {loading || !missions ? (
        <p className="th-desc">Loading your missions…</p>
      ) : (
        <ul className="th-missions">
          {missions.daily.map((m) => (
            <MissionRow key={m.id} mission={m} />
          ))}
          <MissionRow mission={missions.weekly} />
        </ul>
      )}
    </section>
  )
}
