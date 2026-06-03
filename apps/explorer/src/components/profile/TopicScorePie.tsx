/**
 * TopicScorePie — donut of the user's reputation split across topics.
 * Shared by the ProfileDrawer right rail and the ProfileCharts main panel.
 * Ported from proto renderTopicPie (profileDrawer.ts:57-86).
 */
import '../styles/topic-score-pie.css'

export interface TopicPieSlice {
  id: string
  label: string
  emoji: string
  color: string
  score: number
}

export default function TopicScorePie({ slices }: { slices: TopicPieSlice[] }) {
  const realTotal = slices.reduce((a, s) => a + s.score, 0)
  // When no topic has scored yet, fall back to equal slices so the ring
  // still teases the colour breakdown.
  const equalFallback = realTotal === 0 && slices.length > 0
  const denom = equalFallback ? slices.length : realTotal
  const r = 50
  const C = 2 * Math.PI * r
  let cursor = 0

  return (
    <div className="pd-ts-pie-wrap">
      <svg className="pd-ts-pie" viewBox="0 0 120 120" aria-hidden="true">
        {slices.map((t) => {
          const value = equalFallback ? 1 : t.score
          const pct = denom > 0 ? value / denom : 0
          const sliceLen = pct * C
          const rest = C - sliceLen
          const startDeg = -90 + (denom > 0 ? (cursor / denom) * 360 : 0)
          cursor += value
          return (
            <circle
              key={t.id}
              cx={60}
              cy={60}
              r={r}
              fill="none"
              stroke={t.color}
              strokeWidth={14}
              strokeDasharray={`${sliceLen.toFixed(2)} ${rest.toFixed(2)}`}
              strokeOpacity={equalFallback ? 0.35 : 1}
              transform={`rotate(${startDeg.toFixed(2)} 60 60)`}
            />
          )
        })}
        <circle cx={60} cy={60} r={36} fill="var(--ds-card)" />
      </svg>
      <div className="pd-ts-pie-center">
        <span className="pd-ts-pie-value">{Math.round(realTotal)}</span>
        <span className="pd-ts-pie-label">
          {equalFallback ? 'build it up' : 'total'}
        </span>
      </div>
    </div>
  )
}
