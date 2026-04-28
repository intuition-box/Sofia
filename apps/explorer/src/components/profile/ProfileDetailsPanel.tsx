/**
 * ProfileDetailsPanel — stats shown to the right of the radar.
 * Ported from proto-explorer renderDetailsPanel (profileCharts.ts:273-341).
 *
 * Three modes:
 *   - `topicFilter === 'all'` → aggregate overview across every selected topic
 *   - topic id   → focused topic stats from `topics`
 *   - verb id    → intent label + colour from `focusMeta`; per-verb breakdown
 *                  isn't computed yet so numbers stay aggregated.
 */

export interface ProfileTopicStats {
  id: string
  label: string
  emoji: string
  color: string
  categoriesCount: number
  platformsCount: number
  /** Activity / signal count — can be 0 until real series is wired. */
  signals: number
  /** Mock trust P&L in TRUST units. */
  pnl: number
  /** Topic score (cats × 5 + plats × 10 convention from proto). */
  score: number
}

export interface ProfileDetailsFocusMeta {
  label: string
  emoji: string
  color: string
  kind: 'topic' | 'verb'
}

interface ProfileDetailsPanelProps {
  topics: ProfileTopicStats[]
  /** `'all'` shows the aggregate overview; any other id is a focused selection. */
  topicFilter: string | 'all'
  /** Meta for the focused selection (topic OR verb). Required when not `'all'`. */
  focusMeta?: ProfileDetailsFocusMeta
  /** Fired when the user clicks `Clear filter` on a focused view. */
  onClearFilter: () => void
}

export default function ProfileDetailsPanel({
  topics,
  topicFilter,
  focusMeta,
  onClearFilter,
}: ProfileDetailsPanelProps) {
  const isAll = topicFilter === 'all' || !focusMeta
  const isVerb = !isAll && focusMeta?.kind === 'verb'
  // Only look the focused id up in `topics` when it's a topic — verbs aren't
  // listed in `topicStats`.
  const selectedTopic =
    !isAll && focusMeta?.kind === 'topic'
      ? topics.find((t) => t.id === topicFilter) ?? null
      : null

  const label = isAll
    ? 'All Topics'
    : focusMeta
      ? `${focusMeta.emoji} ${focusMeta.label}`
      : '—'
  const color = focusMeta?.color ?? 'var(--ds-accent)'

  // Verb focus has no per-intent breakdown yet — fall back to aggregate.
  const useAggregate = isAll || isVerb

  const categoriesCount = useAggregate
    ? topics.reduce((a, s) => a + s.categoriesCount, 0)
    : selectedTopic?.categoriesCount ?? 0
  const platformsCount = useAggregate
    ? topics.reduce((a, s) => a + s.platformsCount, 0)
    : selectedTopic?.platformsCount ?? 0
  const signals = useAggregate
    ? topics.reduce((a, s) => a + s.signals, 0)
    : selectedTopic?.signals ?? 0
  const score = useAggregate
    ? topics.reduce((a, s) => a + s.score, 0)
    : selectedTopic?.score ?? 0
  const pnl = useAggregate
    ? topics.reduce((a, s) => a + s.pnl, 0)
    : selectedTopic?.pnl ?? 0

  // Mock weekly trend — identical to the proto (8.2% focused / 12.4% overview).
  const scoreDelta = isAll ? 12.4 : 8.2

  const kicker = isAll ? 'Overview' : isVerb ? 'Intent' : 'Topic'
  const scoreLabel = isAll
    ? 'Total Score'
    : isVerb
      ? 'Intent Score'
      : 'Topic Score'

  return (
    <div className="pc-details" style={{ ['--topic-color' as string]: color }}>
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
        <span className="pc-details-delta" style={{ color: 'var(--trusted, #6dd4a0)' }}>
          ▲ {scoreDelta.toFixed(1)}%
        </span>
      </div>
      <div className="pc-details-list">
        <div className="pc-details-row">
          <span className="pc-details-row-label">Categories</span>
          <span className="pc-details-row-value">{categoriesCount}</span>
        </div>
        <div className="pc-details-row">
          <span className="pc-details-row-label">Certified platforms</span>
          <span className="pc-details-row-value">{platformsCount}</span>
        </div>
        <div className="pc-details-row">
          <span className="pc-details-row-label">Signals</span>
          <span className="pc-details-row-value">{signals}</span>
        </div>
        <div className="pc-details-row">
          <span className="pc-details-row-label">Trust P&L</span>
          <span
            className="pc-details-row-value"
            style={{ color: 'var(--trusted, #6dd4a0)' }}
          >
            +{pnl.toFixed(1)} T
          </span>
        </div>
      </div>
    </div>
  )
}
