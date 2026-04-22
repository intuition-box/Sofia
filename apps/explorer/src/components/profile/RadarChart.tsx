/**
 * RadarChart — split radar: top semicircle = `topAxes`, bottom = `bottomAxes`.
 *
 * The chart is directionless: the caller decides what each half represents.
 * On /profile we draw topic axes in the top half (interests) and verb axes
 * in the bottom half (intents), with topic polygons overlaid.
 *
 * Pure view. Caller supplies:
 *   - `topAxes` / `bottomAxes`: spokes distributed across each half
 *   - `series`: one polygon per item (each with counts keyed by axis id)
 *   - `seriesFilter`/onSeriesFilterChange: pill-row selection (ALL + one per series)
 *   - `axisFilter`/onAxisFilterChange: click a rim emoji to focus one spoke
 *   - `topLabel`/`bottomLabel`: divider-line kickers
 */
import type { RadarAxis, RadarSeries, SeriesFilter } from '@/lib/radar'

const W = 420
const H = 420
const CX = W / 2
const CY = H / 2
const OUTER_R = 150

type PositionedAxis = RadarAxis & { angle: number }

/**
 * Evenly distribute `n` axes inside one semicircle.
 *   top    → angles in (-π, 0)  (sin < 0, upper half of the SVG)
 *   bottom → angles in (0, π)   (sin > 0, lower half of the SVG)
 */
function angleInHalf(i: number, n: number, half: 'top' | 'bottom'): number {
  const gap = Math.PI / (n + 1)
  const t = gap * (i + 1)
  return half === 'top' ? -Math.PI + t : t
}

/** Build a closed SVG path from points using Catmull-Rom → cubic smoothing. */
function smoothClosedPath(points: readonly [number, number][], tension = 0.03): string {
  const len = points.length
  if (len === 0) return ''
  if (len === 1) return `M ${points[0][0]} ${points[0][1]} Z`
  let d = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`
  for (let i = 0; i < len; i++) {
    const p0 = points[(i - 1 + len) % len]
    const p1 = points[i]
    const p2 = points[(i + 1) % len]
    const p3 = points[(i + 2) % len]
    const c1x = p1[0] + (p2[0] - p0[0]) * tension
    const c1y = p1[1] + (p2[1] - p0[1]) * tension
    const c2x = p2[0] - (p3[0] - p1[0]) * tension
    const c2y = p2[1] - (p3[1] - p1[1]) * tension
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`
  }
  d += ' Z'
  return d
}

interface RadarChartProps {
  topAxes: RadarAxis[]
  bottomAxes: RadarAxis[]
  series: RadarSeries[]
  seriesFilter: SeriesFilter
  onSeriesFilterChange: (v: SeriesFilter) => void
  axisFilter: string | 'all'
  onAxisFilterChange: (t: string | 'all') => void
  /** Override the pill row with an explicit list of clickable items. Falls
   *  back to `series` when omitted. Use this to expose both halves of the
   *  split radar (topics + verbs) in the same pill row. */
  pillItems?: readonly RadarAxis[]
  /** Kicker labels for each half — rendered on the divider line. */
  topLabel?: string
  bottomLabel?: string
  /** Position for the filter pill row — defaults to 'top'. */
  pillsPosition?: 'top' | 'bottom'
}

export default function RadarChart({
  topAxes,
  bottomAxes,
  series,
  seriesFilter,
  onSeriesFilterChange,
  axisFilter,
  onAxisFilterChange,
  pillItems,
  topLabel = 'interests',
  bottomLabel = 'intents',
  pillsPosition = 'top',
}: RadarChartProps) {
  const pillList: readonly RadarAxis[] = pillItems ?? series
  const total = topAxes.length + bottomAxes.length
  if (total === 0) {
    return <div className="pc-empty">Pick a topic to chart your verbs.</div>
  }

  const positioned: PositionedAxis[] = [
    ...topAxes.map((a, i) => ({ ...a, angle: angleInHalf(i, topAxes.length, 'top') })),
    ...bottomAxes.map((a, i) => ({ ...a, angle: angleInHalf(i, bottomAxes.length, 'bottom') })),
  ]

  const maxCount = Math.max(1, ...series.flatMap((s) => Object.values(s.counts)))

  /** Drive both filters at once so axis clicks, pill clicks and the centre
   *  reset all feel coherent (the chart converges on a single focus id). */
  const setFocus = (id: string) => {
    onSeriesFilterChange(id)
    onAxisFilterChange(id)
  }
  const handleAxisClick = (axisId: string) => {
    setFocus(axisFilter === axisId ? 'all' : axisId)
  }

  // Arc radii + paths for curved half-labels (compass-style). Both arcs run
  // left→right: sweep=1 traces the top half, sweep=0 the bottom half. In
  // both cases the tangent at the midpoint points right, so the glyphs
  // stand upright on the outside of the chart.
  const LABEL_R = OUTER_R + 46
  const topArcPath =
    `M ${CX - LABEL_R} ${CY} ` +
    `A ${LABEL_R} ${LABEL_R} 0 0 1 ${CX + LABEL_R} ${CY}`
  const bottomArcPath =
    `M ${CX - LABEL_R} ${CY} ` +
    `A ${LABEL_R} ${LABEL_R} 0 0 0 ${CX + LABEL_R} ${CY}`

  const pills = (
    <div className="pc-radar-verbs">
      <button
        type="button"
        className={`pc-radar-verb${seriesFilter === 'all' ? ' active' : ''}`}
        data-verb-radar="all"
        onClick={() => setFocus('all')}
      >
        All
      </button>
      {pillList.map((s) => (
        <button
          key={s.id}
          type="button"
          className={`pc-radar-verb${seriesFilter === s.id ? ' active' : ''}`}
          data-verb-radar={s.id}
          style={{ ['--verb-color' as string]: s.color }}
          onClick={() => setFocus(s.id)}
        >
          <span className="pc-radar-verb-emoji">{s.emoji}</span>
          {s.label}
        </button>
      ))}
    </div>
  )

  const dividerX1 = CX - OUTER_R - 18
  const dividerX2 = CX + OUTER_R + 18

  return (
    <div className="pc-radar-wrap">
      {pillsPosition === 'top' ? pills : null}

      <svg className="pc-radar" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="radar-glow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
          <filter id="radar-logo-outline">
            <feMorphology in="SourceAlpha" operator="dilate" radius="1.2" result="dilated" />
            <feComposite in="dilated" in2="SourceAlpha" operator="out" result="edge" />
            <feFlood floodColor="#6dd4a0" />
            <feComposite operator="in" in2="edge" />
          </filter>
          {/* Per-series radial fade: transparent at centre, dense near the outer edge. */}
          {series.map((s) => (
            <radialGradient
              key={`fade-${s.id}`}
              id={`radar-fade-${s.id}`}
              cx={CX}
              cy={CY}
              r={OUTER_R}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor={s.color} stopOpacity={0} />
              <stop offset="55%" stopColor={s.color} stopOpacity={0.1} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.45} />
            </radialGradient>
          ))}
        </defs>

        {/* Grid rings */}
        {[0.25, 0.5, 0.75, 1].map((frac) => (
          <circle
            key={frac}
            cx={CX}
            cy={CY}
            r={(OUTER_R * frac).toFixed(1)}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.09"
            strokeDasharray="2 3"
          />
        ))}

        {/* Half-divider: dashed horizontal line + compass-style curved labels. */}
        <line
          x1={dividerX1}
          y1={CY}
          x2={dividerX2}
          y2={CY}
          stroke="currentColor"
          strokeOpacity={0.2}
          strokeDasharray="3 4"
          strokeWidth={1}
        />
        <defs>
          <path id="radar-arc-top" d={topArcPath} />
          <path id="radar-arc-bottom" d={bottomArcPath} />
        </defs>
        <text className="pc-radar-half-label">
          <textPath href="#radar-arc-top" startOffset="50%" textAnchor="middle">
            {topLabel}
          </textPath>
        </text>
        <text className="pc-radar-half-label">
          <textPath
            href="#radar-arc-bottom"
            startOffset="50%"
            textAnchor="middle"
            side="right"
          >
            {bottomLabel}
          </textPath>
        </text>

        {/* Spokes — one per axis */}
        {positioned.map((d) => {
          const ex = CX + Math.cos(d.angle) * OUTER_R
          const ey = CY + Math.sin(d.angle) * OUTER_R
          const isActive = axisFilter === d.id
          return (
            <line
              key={d.id}
              x1={CX}
              y1={CY}
              x2={ex.toFixed(1)}
              y2={ey.toFixed(1)}
              stroke={isActive ? d.color : 'currentColor'}
              strokeOpacity={isActive ? 0.5 : 0.08}
              strokeWidth={isActive ? 2 : 1}
            />
          )
        })}

        {/* Series polygons — only visit axes this series actually has a count
            for. Skipping irrelevant axes keeps the curve from dipping back
            through the centre on every missing spoke. Axis focus only
            highlights the spoke; polygons stay intact. */}
        {series.map((s) => {
          const relevant = positioned.filter((d) => d.id in s.counts)
          const rawPoints: [number, number][] = relevant.map((d) => {
            const val = s.counts[d.id] ?? 0
            const r = (val / maxCount) * OUTER_R
            return [CX + Math.cos(d.angle) * r, CY + Math.sin(d.angle) * r]
          })
          const pathD = smoothClosedPath(rawPoints, 0.03)

          const isActive = seriesFilter === s.id
          const allMode = seriesFilter === 'all'
          // When an axis is focused, dim any polygon with no count on that
          // axis so the chart actually reduces to relevant curves.
          const axisRelevant =
            axisFilter === 'all' || (s.counts[axisFilter] ?? 0) > 0
          const baseOpacity = allMode ? 0.75 : isActive ? 1 : 0.08
          const opacity = axisRelevant ? baseOpacity : 0.05
          const strokeW = isActive ? 4 : allMode ? 3 : 2
          const glow = isActive
            ? `drop-shadow(0 0 8px ${s.color})`
            : `drop-shadow(0 0 3px color-mix(in srgb, ${s.color} 45%, transparent))`

          return (
            <g
              key={s.id}
              className={`pc-radar-verb-poly${isActive ? ' active' : ''}`}
              data-series={s.id}
              style={{ filter: glow }}
            >
              <path
                d={pathD}
                fill={`url(#radar-fade-${s.id})`}
                stroke={s.color}
                strokeWidth={strokeW}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={opacity}
              />
            </g>
          )
        })}

        {/* Axis rim labels (emoji badges) — click to focus */}
        {positioned.map((d) => {
          const lx = CX + Math.cos(d.angle) * (OUTER_R + 26)
          const ly = CY + Math.sin(d.angle) * (OUTER_R + 26)
          const isActive = axisFilter === d.id
          return (
            <g
              key={d.id}
              className={`pc-radar-label${isActive ? ' active' : ''}`}
              data-axis-filter={d.id}
              style={{ ['--topic-color' as string]: d.color, cursor: 'pointer' }}
              transform={`translate(${lx.toFixed(1)}, ${ly.toFixed(1)})`}
              onClick={() => handleAxisClick(d.id)}
            >
              <circle r="15" className="pc-radar-label-bg" />
              <text x="0" y="0" textAnchor="middle" dominantBaseline="central" fontSize="14">
                {d.emoji}
              </text>
            </g>
          )
        })}

        {/* Centre Sofia logo — click to clear the axis filter */}
        <g
          className="pc-radar-clear"
          data-axis-filter="all"
          style={{ cursor: 'pointer' }}
          onClick={() => setFocus('all')}
        >
          <circle
            cx={CX}
            cy={CY}
            r={30}
            fill="#0b0a12"
            stroke="color-mix(in srgb, #6dd4a0 40%, transparent)"
            strokeWidth={1}
          />
          <image
            href="/logo_invert.png"
            x={CX - 20}
            y={CY - 20}
            width={40}
            height={40}
            filter="url(#radar-logo-outline)"
            style={{ pointerEvents: 'none' }}
          />
          <title>Clear filter</title>
        </g>
      </svg>

      {pillsPosition === 'bottom' ? pills : null}
    </div>
  )
}
