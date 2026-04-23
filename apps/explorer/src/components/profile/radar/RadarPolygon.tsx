/**
 * RadarPolygon — a single series polygon with its own radial-gradient
 * fill. Only iterates axes that the series has a count for, so curves
 * never dip back through the centre on irrelevant spokes.
 */
import { type PositionedAxis, type RadarSeries, smoothClosedPath } from '@/lib/radar'

interface RadarPolygonProps {
  series: RadarSeries
  axes: readonly PositionedAxis[]
  cx: number
  cy: number
  outerR: number
  maxCount: number
  seriesFilter: string
  axisFilter: string
}

export default function RadarPolygon({
  series,
  axes,
  cx,
  cy,
  outerR,
  maxCount,
  seriesFilter,
  axisFilter,
}: RadarPolygonProps) {
  const relevant = axes.filter((d) => d.id in series.counts)
  const rawPoints: [number, number][] = relevant.map((d) => {
    const val = series.counts[d.id] ?? 0
    const r = (val / maxCount) * outerR
    return [cx + Math.cos(d.angle) * r, cy + Math.sin(d.angle) * r]
  })
  const pathD = smoothClosedPath(rawPoints, 0.03)

  const isActive = seriesFilter === series.id
  const allMode = seriesFilter === 'all'
  // When an axis is focused, dim any polygon with no count on that axis
  // so the chart actually reduces to relevant curves.
  const axisRelevant = axisFilter === 'all' || (series.counts[axisFilter] ?? 0) > 0
  const baseOpacity = allMode ? 0.75 : isActive ? 1 : 0.08
  const opacity = axisRelevant ? baseOpacity : 0.05
  const strokeW = isActive ? 4 : allMode ? 3 : 2
  const glow = isActive
    ? `drop-shadow(0 0 8px ${series.color})`
    : `drop-shadow(0 0 3px color-mix(in srgb, ${series.color} 45%, transparent))`

  return (
    <g
      className={`pc-radar-verb-poly${isActive ? ' active' : ''}`}
      data-series={series.id}
      style={{ filter: glow }}
    >
      <path
        d={pathD}
        fill={`url(#radar-fade-${series.id})`}
        stroke={series.color}
        strokeWidth={strokeW}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={opacity}
      />
    </g>
  )
}
