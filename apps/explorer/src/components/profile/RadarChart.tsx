/**
 * RadarChart — N-axis radar with verb polygons.
 * Ported from proto-explorer/src/components/profileCharts.ts renderRadarChart.
 *
 * Pure view. Caller supplies:
 *   - `topicAxes`: one per topic the chart renders (order = clockwise from top)
 *   - `verbSeries`: one polygon per verb
 *   - `verbFilter` / `onVerbFilterChange`: controlled verb pill selection
 *   - `topicFilter` / `onTopicFilterChange`: controlled topic axis focus
 */
import { RADAR_VERBS, type RadarTopicAxis, type RadarVerbSeries, type VerbFilter } from '@/lib/radar'

const W = 420
const H = 420
const CX = W / 2
const CY = H / 2
const OUTER_R = 150

function angleFor(i: number, n: number): number {
  return -Math.PI / 2 + (2 * Math.PI / n) * i
}

interface RadarChartProps {
  topicAxes: RadarTopicAxis[]
  verbSeries: RadarVerbSeries[]
  verbFilter: VerbFilter
  onVerbFilterChange: (v: VerbFilter) => void
  /** Topic axis filter. `'all'` renders every polygon; a topic id collapses
   *  all polygons onto that axis with dots at each verb's value. */
  topicFilter: string | 'all'
  onTopicFilterChange: (t: string | 'all') => void
}

export default function RadarChart({
  topicAxes,
  verbSeries,
  verbFilter,
  onVerbFilterChange,
  topicFilter,
  onTopicFilterChange,
}: RadarChartProps) {
  const n = topicAxes.length
  // Guard against a zero-axis state (no selected topic yet).
  if (n === 0) {
    return (
      <div className="pc-empty">
        Pick a topic to chart your verbs.
      </div>
    )
  }

  const maxCount = Math.max(1, ...verbSeries.flatMap((s) => Object.values(s.counts)))
  const focusedIdx = topicFilter !== 'all' ? topicAxes.findIndex((a) => a.id === topicFilter) : -1

  return (
    <div className="pc-radar-wrap">
      <div className="pc-radar-verbs">
        <button
          type="button"
          className={`pc-radar-verb${verbFilter === 'all' ? ' active' : ''}`}
          data-verb-radar="all"
          onClick={() => onVerbFilterChange('all')}
        >
          All
        </button>
        {RADAR_VERBS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`pc-radar-verb${verbFilter === v.id ? ' active' : ''}`}
            data-verb-radar={v.id}
            style={{ ['--verb-color' as string]: v.color }}
            onClick={() => onVerbFilterChange(v.id)}
          >
            <span className="pc-radar-verb-emoji">{v.emoji}</span>
            {v.label}
          </button>
        ))}
      </div>

      <svg
        className="pc-radar"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="radar-glow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
          {/* Green outline on the center logo: dilate the alpha, subtract the
              original to get just the edge ring, then flood it green. */}
          <filter id="radar-logo-outline">
            <feMorphology in="SourceAlpha" operator="dilate" radius="1.2" result="dilated" />
            <feComposite in="dilated" in2="SourceAlpha" operator="out" result="edge" />
            <feFlood floodColor="#6dd4a0" />
            <feComposite operator="in" in2="edge" />
          </filter>
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

        {/* Spokes */}
        {topicAxes.map((d, i) => {
          const angle = angleFor(i, n)
          const ex = CX + Math.cos(angle) * OUTER_R
          const ey = CY + Math.sin(angle) * OUTER_R
          const isActive = topicFilter === d.id
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

        {/* Verb polygons */}
        {verbSeries.map((s) => {
          const points = topicAxes
            .map((d, i) => {
              const angle = angleFor(i, n)
              const val = focusedIdx >= 0 && i !== focusedIdx ? 0 : s.counts[d.id] ?? 0
              const r = (val / maxCount) * OUTER_R
              return `${(CX + Math.cos(angle) * r).toFixed(1)},${(CY + Math.sin(angle) * r).toFixed(1)}`
            })
            .join(' ')

          const isActive = verbFilter === s.verb.id
          const allMode = verbFilter === 'all'
          const opacity = allMode ? 0.75 : isActive ? 1 : 0.08
          const strokeW = isActive ? 4 : allMode ? 3 : 2
          const glow = isActive ? `drop-shadow(0 0 10px ${s.verb.color})` : undefined

          return (
            <g
              key={s.verb.id}
              className={`pc-radar-verb-poly${isActive ? ' active' : ''}`}
              data-verb={s.verb.id}
              style={glow ? { filter: glow } : undefined}
            >
              <polygon
                points={points}
                fill={s.verb.color}
                fillOpacity={0.14}
                stroke={s.verb.color}
                strokeWidth={strokeW}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={opacity}
              />
            </g>
          )
        })}

        {/* Focus dots when topic filter is active */}
        {focusedIdx >= 0 && verbSeries.map((s) => {
          const topicId = topicAxes[focusedIdx].id
          const count = s.counts[topicId] ?? 0
          const angle = angleFor(focusedIdx, n)
          const r = (count / maxCount) * OUTER_R
          return (
            <circle
              key={`dot-${s.verb.id}`}
              cx={(CX + Math.cos(angle) * r).toFixed(1)}
              cy={(CY + Math.sin(angle) * r).toFixed(1)}
              r={6}
              fill={s.verb.color}
              stroke="var(--ds-card)"
              strokeWidth={2}
              style={{ filter: `drop-shadow(0 0 6px ${s.verb.color})` }}
            />
          )
        })}

        {/* Topic axis labels (emoji badges) */}
        {topicAxes.map((d, i) => {
          const angle = angleFor(i, n)
          const lx = CX + Math.cos(angle) * (OUTER_R + 26)
          const ly = CY + Math.sin(angle) * (OUTER_R + 26)
          const isActive = topicFilter === d.id
          return (
            <g
              key={d.id}
              className={`pc-radar-label${isActive ? ' active' : ''}`}
              data-topic-filter={d.id}
              style={{ ['--topic-color' as string]: d.color, cursor: 'pointer' }}
              transform={`translate(${lx.toFixed(1)}, ${ly.toFixed(1)})`}
              onClick={() => onTopicFilterChange(isActive ? 'all' : d.id)}
            >
              <circle r="15" className="pc-radar-label-bg" />
              <text x="0" y="0" textAnchor="middle" dominantBaseline="central" fontSize="14">
                {d.emoji}
              </text>
            </g>
          )
        })}

        {/* Center clear button (logo) */}
        <g
          className="pc-radar-clear"
          data-topic-filter="all"
          style={{ cursor: 'pointer' }}
          onClick={() => onTopicFilterChange('all')}
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
    </div>
  )
}
