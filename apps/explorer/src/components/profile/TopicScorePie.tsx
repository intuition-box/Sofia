/**
 * TopicScorePie — reputation donut, split across topics (+ a "No context"
 * slice). Implements the Claude Design "Score & Activity" donut: a ring of
 * contiguous flat-capped segments (one per topic, no grey "other" arc),
 * rotated so it starts at 12 o'clock. The centre shows the total; hovering a
 * segment dims the rest, fattens the hovered one, and swaps the centre to
 * that topic's score + name in its colour. Hovering the centre (the total)
 * swaps it for a "View details" button.
 *
 * `focus` is LIFTED to the parent (ProfileCharts) so the donut, its centre
 * and the activity heatmap all cross-highlight off the same topic id.
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

interface TopicScorePieProps {
  slices: TopicPieSlice[]
  focus: string | null
  setFocus: (id: string | null) => void
  /** When set, hovering the donut centre (the total) swaps it for a
   *  "View details" button that calls this. Hovering a segment still
   *  shows that topic's score. */
  onViewDetails?: () => void
  /** True while the trust boost is still loading (MCP latency). The base
   *  score is already shown; the centre caption pulses "refining" so the
   *  upcoming grow reads as an enrichment, not a jump. */
  refining?: boolean
}

const R = 104
const SW = 26
const C = 2 * Math.PI * R

export default function TopicScorePie({
  slices,
  focus,
  setFocus,
  onViewDetails,
  refining = false,
}: TopicScorePieProps) {
  const [centerHover, setCenterHover] = useState(false)
  const total = slices.reduce((a, s) => a + s.score, 0)

  // Build contiguous arc segments sized by share of total.
  let acc = 0
  const segs = slices.map((s) => {
    const len = total > 0 ? (s.score / total) * C : 0
    const seg = { slice: s, dash: len, off: -acc }
    acc += len
    return seg
  })

  const focused = focus ? (slices.find((s) => s.id === focus) ?? null) : null

  return (
    <div className={`donut${focus ? ' dim' : ''}`}>
      <svg className="donut-svg" viewBox="0 0 248 248">
        {segs.map((s) => (
          <circle
            key={s.slice.id}
            className={`donut-seg${focus === s.slice.id ? ' hot' : ''}`}
            cx={124}
            cy={124}
            r={R}
            fill="none"
            stroke={s.slice.color}
            strokeWidth={SW}
            strokeLinecap="butt"
            strokeDasharray={`${s.dash.toFixed(2)} ${(C - s.dash).toFixed(2)}`}
            strokeDashoffset={s.off.toFixed(2)}
            role="button"
            tabIndex={0}
            aria-label={`${s.slice.label}: ${Math.round(s.slice.score)}`}
            onMouseEnter={() => setFocus(s.slice.id)}
            onMouseLeave={() => setFocus(null)}
            onFocus={() => setFocus(s.slice.id)}
            onBlur={() => setFocus(null)}
          />
        ))}
      </svg>
      <div
        className={`donut-center${focused ? ' has-focus' : ''}`}
        // Focusable when there's a "View details" action, so keyboard users
        // can reveal + reach the button the same way hover does.
        tabIndex={onViewDetails ? 0 : undefined}
        aria-label={onViewDetails ? 'Score details' : undefined}
        onMouseEnter={() => setCenterHover(true)}
        onMouseLeave={() => setCenterHover(false)}
        onFocus={() => setCenterHover(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node))
            setCenterHover(false)
        }}
      >
        {focused ? (
          <>
            <span className="donut-num">{Math.round(focused.score)}</span>
            <span
              className="donut-focus-label"
              style={{ color: focused.color }}
            >
              {focused.label}
            </span>
          </>
        ) : centerHover && onViewDetails ? (
          <button
            type="button"
            className="donut-view-btn"
            onClick={onViewDetails}
          >
            View details <span aria-hidden="true">→</span>
          </button>
        ) : (
          <>
            <span className="donut-num">
              {Math.round(total).toLocaleString()}
            </span>
            <span className={`donut-cap${refining ? ' refining' : ''}`}>
              {refining ? 'refining trust…' : 'Total score'}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
