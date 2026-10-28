/**
 * MissionsPanel — today's three missions + the topic of the week
 * (TREND_HUNTER_SPEC §3), computed from the wallet's on-chain positions.
 * Part of "Your month" on /trend-hunters. Each one done earns free
 * Recommends: the write-relayer checks the chain on its own, no claim step.
 */
import { AnimatedNumber, ModuleHead, StatePill } from '@0xsofia/design-system'
import { MISSION_CREDITS, type MissionProgress } from '@0xsofia/quests'
import { useMissions } from '@/hooks/useMissions'
import { nextUtcDay, useMinuteClock } from '@/hooks/useMinuteClock'
import { countdown } from '@/utils/formatting'
import '@0xsofia/design-system/styles/module-head.css'
import '@0xsofia/design-system/styles/state-pill.css'
import '@/components/styles/trend-hunter.css'

function MissionCard({ mission }: { mission: MissionProgress }) {
  const pct = Math.round((mission.progress / mission.target) * 100)
  const reward = MISSION_CREDITS[mission.period]
  return (
    <li className="th-card">
      <div className="th-card-top">
        <span className="th-card-title">{mission.title}</span>
        {mission.done ? (
          <StatePill state="aligned" label={`Done · +${reward}`} />
        ) : (
          <span className="th-value">
            <AnimatedNumber value={mission.progress} />/{mission.target}
          </span>
        )}
      </div>
      <span className="th-desc">
        {mission.description}{' '}
        <b className="th-reward">
          +{reward} free Recommend{reward === 1 ? '' : 's'}
        </b>
      </span>
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
    <section className="th-section" aria-label="Missions">
      <ModuleHead
        title="Today's missions"
        right={
          <span className="th-desc">
            Reset in {countdown(nextUtcDay(now), now)}
          </span>
        }
      />
      {loading || !missions ? (
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
