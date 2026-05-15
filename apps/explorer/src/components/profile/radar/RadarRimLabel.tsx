/**
 * RadarRimLabel — a single clickable badge at the rim of the radar,
 * pinned along the axis direction. Renders the Material Symbols
 * Outlined glyph (`axis.icon`) when available so the rim icons read
 * as monochrome black pictograms; falls back to the emoji glyph
 * (`axis.emoji`) for any axis that hasn't been wired yet.
 */
import type { PositionedAxis } from '@/lib/radar'

interface RadarRimLabelProps {
  axis: PositionedAxis
  cx: number
  cy: number
  outerR: number
  isActive: boolean
  onClick: () => void
  onHover?: (id: string | null, e: React.MouseEvent<SVGGElement>) => void
}

export default function RadarRimLabel({
  axis,
  cx,
  cy,
  outerR,
  isActive,
  onClick,
  onHover,
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
      onMouseEnter={(e) => onHover?.(axis.id, e)}
      onMouseLeave={(e) => onHover?.(null, e)}
    >
      <circle r="15" className="pc-radar-label-bg" />
      {axis.icon ? (
        <text
          x="0"
          y="0"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="Material Symbols Outlined"
          fontSize="18"
          className="pc-radar-label-glyph"
        >
          {axis.icon}
        </text>
      ) : (
        <text
          x="0"
          y="0"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="14"
        >
          {axis.emoji}
        </text>
      )}
    </g>
  )
}
