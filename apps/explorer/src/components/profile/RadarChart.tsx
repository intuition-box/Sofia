/**
 * RadarChart — split radar orchestrator.
 *
 *   top semicircle = `topAxes`     (e.g. interests / topics)
 *   bottom semicircle = `bottomAxes` (e.g. intents / verbs)
 *
 * Pure view. Subviews live under `./radar/` and the geometry helpers in
 * `@/lib/radar`. A single `focus` id drives both the pill row and the
 * rim emojis via the two onChange callbacks (callers typically point
 * them at the same setter).
 */
import { positionAxes, type RadarAxis, type RadarSeries, type SeriesFilter } from '@/lib/radar'
import RadarPills from './radar/RadarPills'
import RadarHalfLabels from './radar/RadarHalfLabels'
import RadarPolygon from './radar/RadarPolygon'
import RadarRimLabel from './radar/RadarRimLabel'

const W = 420
const H = 420
const CX = W / 2
const CY = H / 2
const OUTER_R = 150

interface RadarChartProps {
  topAxes: RadarAxis[]
  bottomAxes: RadarAxis[]
  series: RadarSeries[]
  seriesFilter: SeriesFilter
  onSeriesFilterChange: (v: SeriesFilter) => void
  axisFilter: string | 'all'
  onAxisFilterChange: (t: string | 'all') => void
  /** Override the pill row. Falls back to `series` if omitted. */
  pillItems?: readonly RadarAxis[]
  topLabel?: string
  bottomLabel?: string
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
  if (topAxes.length + bottomAxes.length === 0) {
    return <div className="pc-empty">Pick a topic to chart your verbs.</div>
  }

  const positioned = positionAxes(topAxes, bottomAxes)
  const maxCount = Math.max(1, ...series.flatMap((s) => Object.values(s.counts)))
  const pillList = pillItems ?? series

  /** Pill click, rim click and centre reset all converge on a single id. */
  const setFocus = (id: SeriesFilter) => {
    onSeriesFilterChange(id)
    onAxisFilterChange(id)
  }
  const onAxisClick = (axisId: string) => {
    setFocus(axisFilter === axisId ? 'all' : axisId)
  }

  const pills = (
    <RadarPills items={pillList} seriesFilter={seriesFilter} onFocus={setFocus} />
  )

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

        <RadarHalfLabels
          cx={CX}
          cy={CY}
          outerR={OUTER_R}
          topLabel={topLabel}
          bottomLabel={bottomLabel}
        />

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

        {series.map((s) => (
          <RadarPolygon
            key={s.id}
            series={s}
            axes={positioned}
            cx={CX}
            cy={CY}
            outerR={OUTER_R}
            maxCount={maxCount}
            seriesFilter={seriesFilter}
            axisFilter={axisFilter}
          />
        ))}

        {positioned.map((d) => (
          <RadarRimLabel
            key={d.id}
            axis={d}
            cx={CX}
            cy={CY}
            outerR={OUTER_R}
            isActive={axisFilter === d.id}
            onClick={() => onAxisClick(d.id)}
          />
        ))}

        {/* Centre Sofia logo — click to clear both filters */}
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
