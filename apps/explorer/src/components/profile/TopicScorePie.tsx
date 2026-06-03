/**
 * TopicScorePie — reputation donut, split across topics (+ a "No context"
 * slice). Implements the Claude Design "Score & Activity" donut: a balanced
 * ring of rounded segments with 3° gaps (no grey "other" arc), rotated so it
 * starts at 12 o'clock. The centre shows the total; hovering a segment dims
 * the rest, fattens the hovered one, and swaps the centre to that topic's
 * score + name in its colour.
 *
 * `focus` is LIFTED to the parent (ProfileCharts) so the donut, the legend
 * and the activity heatmap all cross-highlight off the same topic id.
 */
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
}

const R = 104
const SW = 26
const C = 2 * Math.PI * R
const GAP_DEG = 0

export default function TopicScorePie({
  slices,
  focus,
  setFocus,
}: TopicScorePieProps) {
  const total = slices.reduce((a, s) => a + s.score, 0)
  const gapLen = (GAP_DEG / 360) * C

  // Build arc segments sized by share of total, each shortened by the gap.
  let acc = 0
  const segs = slices.map((s) => {
    const len = total > 0 ? (s.score / total) * C : 0
    const seg = { slice: s, dash: Math.max(0, len - gapLen), off: -acc }
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
            onMouseEnter={() => setFocus(s.slice.id)}
            onMouseLeave={() => setFocus(null)}
          />
        ))}
      </svg>
      <div className={`donut-center${focused ? ' has-focus' : ''}`}>
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
        ) : (
          <>
            <span className="donut-num">{Math.round(total).toLocaleString()}</span>
            <span className="donut-cap">Total signals</span>
          </>
        )}
      </div>
    </div>
  )
}
