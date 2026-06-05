/**
 * CircleHeaderFree — Free-tier circle header (design_handoff_circle_free).
 *
 * Mirrors the design's `CircleHeaderFree` (AppFree.jsx) faithfully:
 *   - `.cf-header-id`  → logo tile + identity column side by side.
 *   - identity column  → name row (name + "Free plan" `.cf-plan-badge`
 *     pill), the handle (`.cf-header-sub` / `.cf-header-crumb`), the
 *     description, then the `.cf-header-actions` row.
 *   - the KPI band (`.cf-kpis`, 3 equal centred tiles with a top
 *     border): Signals marked, Active curators (`active / total`),
 *     and the peach-tinted locked Decisions tile.
 *
 * Data degradation (no fabricated numbers):
 *   - "Signals marked" weekly delta is omitted — the aggregate stats
 *     query exposes a 7-day active set but not a week-over-week signal
 *     delta, so we don't invent "+N vs last wk". The delta line instead
 *     carries a real, non-numeric descriptor ("marked on-chain").
 *   - When `stats` is undefined (locked / loading) the numeric tiles
 *     fall back to a muted em dash rather than a fake zero.
 */
import { ShieldCheck, Lock, Sparkles, Zap, Check } from 'lucide-react'
import type { CircleStats } from '@/services/circleStats'

interface CircleHeaderFreeProps {
  name: string
  handle: string
  description: string
  circleColor: string
  /** Aggregate metrics — drives the first two KPI tiles. */
  stats?: CircleStats
  /** Total roster size — denominator of the "Active curators" tile. */
  totalMembers: number
  /** Whether the viewer is already a member of this circle. */
  isMember: boolean
  /** Fires when a non-member clicks "Enter this Circle". */
  onJoin?: () => void
  /** Fires for any Pro-gated affordance (Upgrade button, locked KPI). */
  onUpgrade: () => void
  /** Fires when an existing member clicks the "Member" confirmation. */
  onMemberClick?: () => void
}

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

export default function CircleHeaderFree({
  name,
  handle,
  description,
  circleColor,
  stats,
  totalMembers,
  isMember,
  onJoin,
  onUpgrade,
  onMemberClick,
}: CircleHeaderFreeProps) {
  const signals = stats ? formatCount(stats.postCount) : '—'
  const active = stats ? String(stats.activeMemberCount) : '—'

  return (
    <header
      className="cf-header"
      style={{ ['--circle-color' as string]: circleColor }}
    >
      <div className="cf-header-top">
        <div className="cf-header-id">
          <span className="cf-header-logo" style={{ background: circleColor }}>
            {name.slice(0, 1).toUpperCase()}
          </span>
          <div className="cf-header-idcol">
            <div className="cf-header-name-row">
              <h1 className="cf-header-name">{name}</h1>
              <span className="cf-plan-badge">
                <Lock className="cf-plan-badge-icon" aria-hidden="true" />
                Free plan
              </span>
            </div>
            <div className="cf-header-sub">
              <span className="cf-header-crumb">{handle}</span>
            </div>
            <p className="cf-header-desc">{description}</p>
            <div className="cf-header-actions">
              {isMember ? (
                <button
                  type="button"
                  className="cf-btn cf-btn-member"
                  onClick={onMemberClick}
                >
                  <Check className="cf-btn-icon" aria-hidden="true" />
                  Member
                </button>
              ) : (
                <button
                  type="button"
                  className="cf-btn cf-btn-pro"
                  onClick={onJoin}
                >
                  <Zap className="cf-btn-icon" aria-hidden="true" />
                  Enter this Circle
                </button>
              )}
              <button
                type="button"
                className="cf-btn cf-btn-pro"
                onClick={onUpgrade}
              >
                <Sparkles className="cf-btn-icon" aria-hidden="true" />
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="cf-kpis" role="group" aria-label="Circle metrics">
        <div className="cf-kpi">
          <span className="cf-kpi-label">
            <span
              className="cf-kpi-dot"
              style={{ background: 'var(--learning)' }}
              aria-hidden="true"
            />
            Signals marked
          </span>
          <span className="cf-kpi-value">{signals}</span>
          <span className="cf-kpi-delta is-up">marked on-chain</span>
        </div>

        <div className="cf-kpi">
          <span className="cf-kpi-label">
            <span
              className="cf-kpi-dot"
              style={{ background: 'var(--inspiration)' }}
              aria-hidden="true"
            />
            Active curators
          </span>
          <span className="cf-kpi-value">
            {active}
            <span className="cf-kpi-unit">/ {totalMembers}</span>
          </span>
          <span className="cf-kpi-delta is-flat">active in last 7 days</span>
        </div>

        <button
          type="button"
          className="cf-kpi cf-kpi-locked"
          onClick={onUpgrade}
          aria-label="Decisions — a Pro feature. Upgrade to unlock."
        >
          <span className="cf-kpi-label">
            <span
              className="cf-kpi-dot"
              style={{ background: 'var(--ds-accent)' }}
              aria-hidden="true"
            />
            Decisions
          </span>
          <span className="cf-kpi-lock-glyph">
            <Lock aria-hidden="true" />
          </span>
          <span className="cf-kpi-pro-tag">
            <ShieldCheck className="cf-kpi-pro-tag-icon" aria-hidden="true" />
            Pro feature
          </span>
        </button>
      </div>
    </header>
  )
}
