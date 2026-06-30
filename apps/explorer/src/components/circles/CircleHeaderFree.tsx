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

// Decisions tab is hidden for now (kept in the code for a future Pro update).
// Flip to `true` to restore the locked/unlocked Decisions KPI tiles.
const SHOW_DECISIONS = false

interface CircleHeaderFreeProps {
  name: string
  description: string
  circleColor: string
  /** Aggregate metrics — drives the first two KPI tiles. */
  stats?: CircleStats
  /** Total roster size — denominator of the "Active curators" tile. */
  totalMembers: number
  /** Whether the viewer is already a member of this circle. */
  isMember: boolean
  /** Whether this circle has a Free/Pro plan. The personal Trust Circle
   *  has none, so its plan badge, Upgrade button and locked Decisions
   *  KPI are suppressed. */
  showPlan: boolean
  /** Hide the header action buttons (join / upgrade) while the join gate
   *  overlay is showing, so the gate is the single, unambiguous join CTA. */
  hideActions?: boolean
  /** Fires when a non-member clicks "Enter this Circle". */
  onJoin?: () => void
  /** Fires for any Pro-gated affordance (Upgrade button). */
  onUpgrade: () => void
  /** Fires when an existing member clicks the "Member" confirmation. */
  onMemberClick?: () => void
  /** Toggles the in-page Decisions tab from the locked KPI tile. */
  onDecisionsClick?: () => void
  /** Whether the Decisions tab is currently open — toggles the tile's
   *  active styling. */
  decisionsActive?: boolean
  /** Pro tier: render the Decisions tile as an UNLOCKED nav (no lock glyph,
   *  shows open/closed counts) instead of the Free locked teaser. */
  decisionsUnlocked?: boolean
  /** Open/closed decision counts for the unlocked Pro tile. */
  decisionsMeta?: { open: number; closed: number }
}

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

export default function CircleHeaderFree({
  name,
  description,
  circleColor,
  stats,
  totalMembers,
  isMember,
  showPlan,
  hideActions = false,
  onJoin,
  onUpgrade,
  onMemberClick,
  onDecisionsClick,
  decisionsActive = false,
  decisionsUnlocked = false,
  decisionsMeta,
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
          <div className="cf-header-idcol">
            <div className="cf-header-name-row">
              <span
                className="cf-header-logo"
                style={{ background: circleColor }}
              >
                {name.slice(0, 1).toUpperCase()}
              </span>
              <h1 className="cf-header-name">{name}</h1>
              {showPlan && (
                <span className="cf-plan-badge">
                  <Lock className="cf-plan-badge-icon" aria-hidden="true" />
                  Free plan
                </span>
              )}
            </div>
            <p className="cf-header-desc">{description}</p>
            {!hideActions && (
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
                {showPlan && (
                  <button
                    type="button"
                    className="cf-btn cf-btn-pro"
                    onClick={onUpgrade}
                  >
                    <Sparkles className="cf-btn-icon" aria-hidden="true" />
                    Upgrade to Pro
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={`cf-kpis${
          SHOW_DECISIONS && (showPlan || decisionsUnlocked)
            ? ''
            : ' cf-kpis--duo'
        }`}
        role="group"
        aria-label="Circle metrics"
      >
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

        {SHOW_DECISIONS && showPlan && (
          <button
            type="button"
            className={`cf-kpi cf-kpi-locked${
              decisionsActive ? ' is-active' : ''
            }`}
            onClick={onDecisionsClick}
            aria-pressed={decisionsActive}
            aria-label="Decisions — a Pro feature. Open to preview."
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
        )}

        {SHOW_DECISIONS && decisionsUnlocked && (
          <button
            type="button"
            className={`cf-kpi cf-kpi-nav${decisionsActive ? ' is-active' : ''}`}
            onClick={onDecisionsClick}
            aria-pressed={decisionsActive}
            aria-label="Open the Decisions room"
          >
            <span className="cf-kpi-label">
              <span
                className="cf-kpi-dot"
                style={{ background: 'var(--ds-accent)' }}
                aria-hidden="true"
              />
              Decisions
            </span>
            <span className="cf-kpi-value">
              {decisionsMeta?.open ?? 0}
              <span className="cf-kpi-unit">
                / {decisionsMeta?.closed ?? 0}
              </span>
            </span>
            <span className="cf-kpi-delta is-up">
              {decisionsActive ? '‹ Back to Circle' : 'Open vote room →'}
            </span>
          </button>
        )}
      </div>
    </header>
  )
}
