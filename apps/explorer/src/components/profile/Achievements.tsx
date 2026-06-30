/**
 * Achievements — Module 5 of the Curator Profile (Claude Design handoff
 * "Curator Profile Pro"). Three columns: Level + XP progress · Gold balance
 * (self-only, private) · badge grid (claimed quests + locked).
 *
 * Data is on-chain (useAchievements). Gold comes from the extension's local
 * storage via useExtensionGold and is only shown to the owner; when the
 * extension isn't installed the column is omitted and the panel is 2-col.
 */
import { useState } from 'react'
import { Puzzle } from 'lucide-react'
import { SectionH2 } from '@0xsofia/design-system'
import type { Achievements as AchievementsData } from '@/services/achievementsService'
import { useExtensionInstalled } from '@/hooks/useExtensionInstalled'
import { CHROME_STORE_URL } from '@/utils/sofiaDetect'
import '@/components/styles/achievements.css'

interface AchievementsProps {
  data: AchievementsData | null
  loading: boolean
  /** False when the wallet has no Account atom on-chain yet. */
  hasAccount: boolean
  /** Gold balance from the extension, or null when unavailable. */
  gold: number | null
  /** Self-view → render the (private) Gold column. */
  self: boolean
}

const fmt = (n: number) => n.toLocaleString('en-US')

const INITIAL_BADGES = 12

export default function Achievements({
  data,
  loading,
  hasAccount,
  gold,
  self,
}: AchievementsProps) {
  const [expanded, setExpanded] = useState(false)
  const extensionInstalled = useExtensionInstalled()

  // Quests + XP are earned through the extension. When the owner is viewing
  // their own profile and we can't detect the extension — either absent, or
  // an older build that doesn't announce itself via the data-sofia-extension
  // marker — nudge them to install or update it. The on-chain badges/level
  // still render; this just unblocks quest progress. Never shown to other
  // visitors (quests aren't theirs to act on).
  const installCta =
    self && !extensionInstalled ? (
      <a
        className="ach-install-cta"
        href={CHROME_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="ach-install-cta__icon" aria-hidden="true">
          <Puzzle className="h-4 w-4" />
        </span>
        <span className="ach-install-cta__text">
          Install or update the Sofia extension to progress your quests
        </span>
        <span className="ach-install-cta__arrow" aria-hidden="true">
          →
        </span>
      </a>
    ) : null

  if (loading) {
    return (
      <section className="pp-section">
        <SectionH2>Achievements</SectionH2>
        <div className="ach-loading">Reading achievements…</div>
      </section>
    )
  }

  if (!hasAccount || !data) {
    return (
      <section className="pp-section">
        <SectionH2>Achievements</SectionH2>
        <div className="ach-empty">
          No achievements yet. Certify pages and claim quests to earn XP.
        </div>
        {installCta}
      </section>
    )
  }

  const pct =
    data.xpNext > 0 ? Math.round((data.xpInto / data.xpNext) * 100) : 0
  // Gold column only when the owner actually has a positive balance — never
  // render a bare "0" (and never for other users; Gold is private).
  const showGold = self && gold != null && gold > 0
  const shown = expanded ? data.badges : data.badges.slice(0, INITIAL_BADGES)

  return (
    <section className="pp-section">
      <SectionH2>Achievements</SectionH2>

      {installCta}

      <div className={`ach-panel${showGold ? '' : ' no-gold'}`}>
        {/* Level + XP */}
        <div className="ach-stat">
          <div className="ach-level-row">
            <span className="ach-lvl tnum">LVL {data.level}</span>
            <span className="ach-xp tnum">{fmt(data.totalXP)} XP</span>
          </div>
          <div className="ach-bar">
            <i style={{ width: `${pct}%` }} />
          </div>
          <span className="ach-next tnum">
            {fmt(Math.max(0, data.xpNext - data.xpInto))} XP to level{' '}
            {data.level + 1}
          </span>
        </div>

        {/* Gold (self-only, private) */}
        {showGold ? (
          <div className="ach-gold">
            <span className="ach-gold-v tnum">{fmt(gold as number)}</span>
            <span className="ach-gold-k">
              Gold balance <span className="ach-priv">private</span>
            </span>
          </div>
        ) : null}

        {/* Badges */}
        <div className="ach-badges">
          <div className="ach-badges-grid">
            {shown.map((b) => (
              <span
                key={b.id}
                className={b.on ? 'ach-badge' : 'ach-badge off'}
                title={b.on ? b.name : `${b.name} · locked`}
              >
                <i className="ach-badge-dot" />
                {b.name}
              </span>
            ))}
          </div>
          {data.badges.length > INITIAL_BADGES ? (
            <button
              type="button"
              className="ach-all"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? 'Show less' : `See all ${data.badges.length}`}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  )
}
