/**
 * ProfileDetailsPanel — topic stats shown to the right of the radar.
 * Ported from proto-explorer renderDetailsPanel (profileCharts.ts:273-341).
 *
 * Two modes:
 *   - All Topics (topicFilter === 'all'): sums every selected topic
 *   - Focused:   picks the matching entry from `topics`
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

interface ProfileDetailsPanelProps {
  topics: ProfileTopicStats[]
  /** `'all'` shows the aggregate overview; a topic id focuses on that topic. */
  topicFilter: string | 'all'
  /** Fired when the user clicks `Clear filter` on a focused view. */
  onClearFilter: () => void
}

export default function ProfileDetailsPanel({
  topics,
  topicFilter,
  onClearFilter,
}: ProfileDetailsPanelProps) {
  const isAll = topicFilter === 'all'
  const selected = isAll ? null : topics.find((t) => t.id === topicFilter) ?? null

  const label = isAll
    ? 'All Topics'
    : selected
      ? `${selected.emoji} ${selected.label}`
      : '—'
  const color = selected?.color ?? 'var(--ds-accent)'

  const categoriesCount = isAll
    ? topics.reduce((a, s) => a + s.categoriesCount, 0)
    : selected?.categoriesCount ?? 0
  const platformsCount = isAll
    ? topics.reduce((a, s) => a + s.platformsCount, 0)
    : selected?.platformsCount ?? 0
  const signals = isAll
    ? topics.reduce((a, s) => a + s.signals, 0)
    : selected?.signals ?? 0
  const score = isAll
    ? topics.reduce((a, s) => a + s.score, 0)
    : selected?.score ?? 0
  const pnl = isAll
    ? topics.reduce((a, s) => a + s.pnl, 0)
    : selected?.pnl ?? 0

  // Mock weekly trend — identical to the proto (8.2% focused / 12.4% overview).
  const scoreDelta = isAll ? 12.4 : 8.2

  return (
    <div className="pc-details" style={{ ['--topic-color' as string]: color }}>
      <div className="pc-details-head">
        <span className="pc-kicker">{isAll ? 'Overview' : 'Topic'}</span>
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
        <span className="pc-details-score-label">
          {isAll ? 'Total Score' : 'Topic Score'}
        </span>
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
