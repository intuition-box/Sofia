/**
 * ProfileDetailsPanel — stats shown to the right of the radar.
 * Ported from proto-explorer renderDetailsPanel (profileCharts.ts:273-341).
 *
 * Three modes:
 *   - `topicFilter === 'all'` → aggregate overview across every selected topic
 *   - topic id   → focused topic stats from `topics`
 *   - verb id    → intent label + colour from `focusMeta`; per-verb breakdown
 *                  isn't computed yet so numbers stay aggregated.
 *
 * In `'all'` mode the panel can also render a compact "Interests" rail on
 * the right (small chip rows + add/remove). It replaces the standalone
 * `<InterestsGrid>` section that used to sit at the top of the profile
 * page, keeping topic management inline with the score overview.
 */
import { X } from 'lucide-react'
import TopicBadge from './TopicBadge'

export interface ProfileTopicStats {
  id: string
  label: string
  emoji: string
  color: string
  categoriesCount: number
  platformsCount: number
  /** Number of connected platforms that produced signals on this topic. */
  signals: number
  /** Trust P&L in TRUST units. `null` while no per-topic aggregate is exposed. */
  pnl: number | null
  /** Topic score (cats × 5 + plats × 10 convention from proto). */
  score: number
}

export interface ProfileDetailsFocusMeta {
  label: string
  emoji: string
  color: string
  kind: 'topic' | 'verb'
}

export interface InterestPill {
  id: string
  label: string
  color: string
  score: number
}

interface ProfileDetailsPanelProps {
  topics: ProfileTopicStats[]
  /** `'all'` shows the aggregate overview; any other id is a focused selection. */
  topicFilter: string | 'all'
  /** Meta for the focused selection (topic OR verb). Required when not `'all'`. */
  focusMeta?: ProfileDetailsFocusMeta
  /** Fired when the user clicks `Clear filter` on a focused view. */
  onClearFilter: () => void
  /**
   * Number of certs the user has on each radar verb (work / learning /
   * fun / inspiration / buying / music). Used to compute the per-verb
   * score and certification count when a verb is focused — without it
   * the panel falls back to the aggregate score, which is wrong.
   */
  verbCertCounts?: Readonly<Record<string, number>>
  /**
   * Number of certs the user owns that have NO `in context of` topic
   * triple. Counted into the "All Topics" total so the donut and the
   * panel agree, and certs without context aren't silently zeroed.
   */
  generalCertCount?: number
  /** Points awarded per cert (defaults to 5 to match scoring service). */
  pointsPerCert?: number
  /**
   * Compact interest pills rendered alongside the overview metrics when
   * the panel is in 'all' mode. Caller resolves taxonomy + score so the
   * panel stays presentational.
   */
  interestPills?: InterestPill[]
  /** Max slot count for the rail; empty slots become "+ Pick" buttons. */
  interestSlots?: number
  /** Fires when the user clicks `+ Pick` or `Edit interests`. */
  onAddInterest?: () => void
  /** Fires when the user clicks the × on a pill. Omit to hide remove UI. */
  onRemoveInterest?: (topicId: string) => void
  /** Fires when the user clicks the body of a pill (label/score). */
  onSelectInterest?: (topicId: string) => void
}

export default function ProfileDetailsPanel({
  topics,
  topicFilter,
  focusMeta,
  onClearFilter,
  verbCertCounts,
  generalCertCount = 0,
  pointsPerCert = 5,
  interestPills,
  interestSlots = 3,
  onAddInterest,
  onRemoveInterest,
  onSelectInterest,
}: ProfileDetailsPanelProps) {
  const isAll = topicFilter === 'all' || !focusMeta
  const isVerb = !isAll && focusMeta?.kind === 'verb'
  // Only look the focused id up in `topics` when it's a topic — verbs aren't
  // listed in `topicStats`.
  const selectedTopic =
    !isAll && focusMeta?.kind === 'topic'
      ? (topics.find((t) => t.id === topicFilter) ?? null)
      : null

  const label = isAll
    ? 'All Topics'
    : focusMeta
      ? `${focusMeta.emoji} ${focusMeta.label}`
      : '—'
  const color = focusMeta?.color ?? 'var(--ds-accent)'

  // Verb focus uses verbCertCounts for the score; categories, platforms
  // and signals stay aggregate since they're profile-wide and have no
  // verb-scoped equivalent on-chain.
  const useAggregate = isAll || isVerb
  const verbCertCount =
    isVerb && verbCertCounts ? (verbCertCounts[topicFilter] ?? 0) : 0

  const generalScore = generalCertCount * pointsPerCert
  const score = isVerb
    ? verbCertCount * pointsPerCert
    : isAll
      ? topics.reduce((a, s) => a + s.score, 0) + generalScore
      : (selectedTopic?.score ?? 0)
  // P&L is null whenever no contributing topic has a real per-topic aggregate.
  // Aggregate sum across topics; if every topic reports null, the row is hidden.
  const pnlContribs = useAggregate
    ? topics.map((s) => s.pnl)
    : [selectedTopic?.pnl ?? null]
  const hasPnl = pnlContribs.some((v) => v !== null)
  const pnl = hasPnl
    ? pnlContribs.reduce((a: number, v) => a + (v ?? 0), 0)
    : null

  const kicker = isAll ? 'Overview' : isVerb ? 'Intent' : 'Topic'
  const scoreLabel = isAll
    ? 'Total Score'
    : isVerb
      ? 'Intent Score'
      : 'Topic Score'

  const showInterests = isAll && interestPills !== undefined
  const emptySlotCount = showInterests
    ? Math.max(0, interestSlots - (interestPills?.length ?? 0))
    : 0

  return (
    <div
      className={`pc-details${showInterests ? ' has-side' : ''}`}
      style={{ ['--topic-color' as string]: color }}
    >
      <div className="pc-details-main">
        <div className="pc-details-head">
          <span className="pc-kicker">{kicker}</span>
          {!isAll && (
            <button
              type="button"
              className="pc-details-clear"
              onClick={onClearFilter}
            >
              Clear filter
            </button>
          )}
        </div>
        <div className="pc-details-title">{label}</div>
        <div className="pc-details-hero">
          <span className="pc-details-score">{score}</span>
          <span className="pc-details-score-label">{scoreLabel}</span>
        </div>
        {pnl !== null && (
          <div className="pc-details-list">
            <div className="pc-details-row">
              <span className="pc-details-row-label">Trust P&L</span>
              <span
                className="pc-details-row-value"
                style={{
                  color:
                    pnl >= 0
                      ? 'var(--trusted, #6dd4a0)'
                      : 'var(--distrusted, #e87c7c)',
                }}
              >
                {pnl >= 0 ? '+' : ''}
                {pnl.toFixed(1)} T
              </span>
            </div>
          </div>
        )}
      </div>

      {showInterests && (
        <div className="pc-details-side">
          <div className="pc-details-side-head">
            <span className="pc-kicker">Interests</span>
            {onAddInterest && (interestPills?.length ?? 0) > 0 && (
              <button
                type="button"
                className="pc-details-side-edit"
                onClick={onAddInterest}
              >
                Edit
              </button>
            )}
          </div>
          <div className="pc-details-side-list">
            {(interestPills ?? []).map((p) => (
              <div
                key={p.id}
                className="pc-interest-pill"
                style={{ ['--pill-color' as string]: p.color }}
              >
                <button
                  type="button"
                  className="pc-interest-pill-main"
                  onClick={
                    onSelectInterest ? () => onSelectInterest(p.id) : undefined
                  }
                  disabled={!onSelectInterest}
                  aria-label={`Open ${p.label} details`}
                >
                  <TopicBadge
                    topicId={p.id}
                    color={p.color}
                    size={14}
                    title={p.label}
                  />
                  <span className="pc-interest-pill-label">{p.label}</span>
                  <span className="pc-interest-pill-score">{p.score}</span>
                </button>
                {onRemoveInterest && (
                  <button
                    type="button"
                    className="pc-interest-pill-remove"
                    onClick={() => onRemoveInterest(p.id)}
                    aria-label={`Remove ${p.label}`}
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            ))}
            {Array.from({ length: emptySlotCount }).map((_, i) =>
              onAddInterest ? (
                <button
                  key={`add-${i}`}
                  type="button"
                  className="pc-interest-pill pc-interest-pill--add"
                  onClick={onAddInterest}
                >
                  <span className="pc-interest-pill-plus">+</span>
                  <span className="pc-interest-pill-label">Pick interest</span>
                </button>
              ) : (
                <div
                  key={`empty-${i}`}
                  className="pc-interest-pill pc-interest-pill--empty"
                  aria-hidden="true"
                />
              ),
            )}
          </div>
        </div>
      )}
    </div>
  )
}
