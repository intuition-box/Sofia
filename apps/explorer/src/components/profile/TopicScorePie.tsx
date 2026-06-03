/**
 * TopicScorePie — donut of the user's reputation split across topics.
 * Used by the ProfileCharts main panel. Ported from proto renderTopicPie.
 *
 * Hovering a slice highlights it and swaps the donut centre to show that
 * slice's label + score (in the slice colour); the centre returns to the
 * total on mouse-out. This replaces the old below-the-donut legend list,
 * which got clipped by the card's `overflow: hidden`.
 */
import { useState } from 'react'
import '../styles/topic-score-pie.css'

export interface TopicPieSlice {
  id: string
  label: string
  emoji: string
  color: string
  score: number
}

export default function TopicScorePie({ slices }: { slices: TopicPieSlice[] }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const realTotal = slices.reduce((a, s) => a + s.score, 0)
  // When no topic has scored yet, fall back to equal slices so the ring
  // still teases the colour breakdown.
  const equalFallback = realTotal === 0 && slices.length > 0
  const denom = equalFallback ? slices.length : realTotal
  const r = 50
  const C = 2 * Math.PI * r
  let cursor = 0

  const active = activeId ? (slices.find((s) => s.id === activeId) ?? null) : null

  return (
    <div className="pd-ts-pie-wrap">
      <svg className="pd-ts-pie" viewBox="0 0 120 120">
        {slices.map((t) => {
          const value = equalFallback ? 1 : t.score
          const pct = denom > 0 ? value / denom : 0
          const sliceLen = pct * C
          const rest = C - sliceLen
          const startDeg = -90 + (denom > 0 ? (cursor / denom) * 360 : 0)
          cursor += value
          const dimmed = activeId !== null && activeId !== t.id
          return (
            <circle
              key={t.id}
              className="pd-ts-slice"
              cx={60}
              cy={60}
              r={r}
              fill="none"
              stroke={t.color}
              strokeWidth={14}
              strokeDasharray={`${sliceLen.toFixed(2)} ${rest.toFixed(2)}`}
              strokeOpacity={equalFallback ? 0.35 : dimmed ? 0.3 : 1}
              transform={`rotate(${startDeg.toFixed(2)} 60 60)`}
              onMouseEnter={() => setActiveId(t.id)}
              onMouseLeave={() =>
                setActiveId((cur) => (cur === t.id ? null : cur))
              }
            />
          )
        })}
        <circle cx={60} cy={60} r={36} fill="var(--ds-card)" />
      </svg>
      <div className="pd-ts-pie-center">
        {active ? (
          <>
            <span className="pd-ts-pie-value" style={{ color: active.color }}>
              {Math.round(active.score)}
            </span>
            <span className="pd-ts-pie-label pd-ts-pie-label--slice">
              {active.label}
            </span>
          </>
        ) : (
          <>
            <span className="pd-ts-pie-value">{Math.round(realTotal)}</span>
            <span className="pd-ts-pie-label">
              {equalFallback ? 'build it up' : 'total'}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
