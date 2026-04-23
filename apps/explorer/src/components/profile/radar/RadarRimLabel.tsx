/**
 * RadarRimLabel — a single clickable emoji badge at the rim of the radar,
 * pinned along the axis direction.
 */
import type { PositionedAxis } from '@/lib/radar'

interface RadarRimLabelProps {
  axis: PositionedAxis
  cx: number
  cy: number
  outerR: number
  isActive: boolean
  onClick: () => void
}

export default function RadarRimLabel({
  axis,
  cx,
  cy,
  outerR,
  isActive,
  onClick,
}: RadarRimLabelProps) {
  const lx = cx + Math.cos(axis.angle) * (outerR + 26)
  const ly = cy + Math.sin(axis.angle) * (outerR + 26)
  return (
    <g
      className={`pc-radar-label${isActive ? ' active' : ''}`}
      data-axis-filter={axis.id}
      style={{ ['--topic-color' as string]: axis.color, cursor: 'pointer' }}
      transform={`translate(${lx.toFixed(1)}, ${ly.toFixed(1)})`}
      onClick={onClick}
    >
      <circle r="15" className="pc-radar-label-bg" />
      <text x="0" y="0" textAnchor="middle" dominantBaseline="central" fontSize="14">
        {axis.emoji}
      </text>
    </g>
  )
}
