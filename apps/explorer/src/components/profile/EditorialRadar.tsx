/**
 * EditorialRadar — data-wired port of `apps/landing/src/components/
 * PlateA.tsx`. Same chassis (dark plate, pill labels, concentric
 * polygons, FIG header, progress bar) but parameterised for any axis
 * count and fed real reputation values instead of a hardcoded
 * breathing sine wave.
 *
 * Static by design — the profile shows the user's actual per-axis
 * scores, so a respiring polygon would mislead.
 */

import type { CSSProperties } from 'react'

export interface EditorialRadarAxis {
  /** Stable slug used as React key + to fire onClick. */
  id: string
  /** Short uppercase pill label (~12 chars max). Kept for aria-label
   *  only — the chip no longer renders text. */
  label: string
  /** Pill background colour. Hex / CSS variable / rgb both OK. */
  color: string
  /** Score normalised to 0..1 — drives the polygon vertex radius. */
  value: number
  /** Material Symbols Outlined glyph name rendered inside the chip
   *  (e.g. `'terminal'`, `'palette'`). Resolved via `getTopicIcon`
   *  or the per-verb `icon` set on `RADAR_VERBS`. */
  icon?: string
}

interface EditorialRadarProps {
  /** Ordered list of axes. Positions are computed by uniform angular
   *  spacing starting at the top (90°) and going clockwise. */
  axes: readonly EditorialRadarAxis[]
  /** Highlights one axis pill. Pass `'all'` or undefined for none. */
  activeId?: string | 'all'
  onAxisClick?: (id: string) => void
  /** Optional accent colour for the polygon stroke + fill. Defaults
   *  to white; pass the focused axis's colour to make the polygon
   *  visually echo the active filter. */
  accentColor?: string
}

// Strokes / rings / polygon are white so the radar reads on the dark
// profile card. Chip backgrounds keep their topic / verb hues, and
// the Material Symbol inside each chip stays ink-dark so it reads on
// the pastel chip surface.
const PALETTE = {
  ink: '#ffffff',
  ringFaint: 'rgba(255,255,255,0.55)',
  lattice: 'rgba(255,255,255,0.22)',
  grid: 'rgba(255,255,255,0.3)',
  ringLabel: 'rgba(255,255,255,0.55)',
  polyFill: 'rgba(255,255,255,0.10)',
  polyStroke: '#ffffff',
  /** Pill glyph fill — ink-dark so it reads on the coloured chip
   *  backgrounds (pastel topic / verb hues). */
  pillGlyph: '#02000e',
}

const CX = 240
const CY = 240
const R = 175
const RING_LEVELS = [0.2, 0.4, 0.6, 0.8] // 100% is the outer ring itself
const LABEL_RADIUS_OFFSET = 32

const rad = (deg: number) => (deg * Math.PI) / 180
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

/**
 * Map an axis index to its angle in degrees, measured from the top
 * going clockwise (so axis 0 is at the top, axis N/2 is at the
 * bottom). PlateA uses non-uniform angles for editorial perfection;
 * here we go uniform so any axis count slots in cleanly.
 */
function axisAngle(i: number, total: number): number {
  return 90 - (i / total) * 360
}

function axisPoint(angle: number, radius: number) {
  const r = rad(angle)
  return {
    x: CX + Math.cos(r) * radius,
    y: CY - Math.sin(r) * radius,
  }
}

export default function EditorialRadar({
  axes,
  activeId,
  onAxisClick,
  accentColor,
}: EditorialRadarProps) {
  const c = PALETTE
  const polyStroke = accentColor ?? c.polyStroke
  const polyFill = accentColor
    ? `color-mix(in srgb, ${accentColor} 18%, transparent)`
    : c.polyFill
  const total = axes.length || 1
  const isFocused = activeId !== undefined && activeId !== 'all'

  // Polygon points from real axis values (clamped to a tiny floor so
  // a 0 score still produces a visible vertex).
  const polygonPoints = axes
    .map((axis, i) => {
      const v = Math.max(0.06, clamp01(axis.value))
      const p = axisPoint(axisAngle(i, total), R * v)
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg
      viewBox="0 0 480 480"
      className="pc-radar pc-plate-radar"
      style={{ display: 'block' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer ring (100%) */}
      <circle
        cx={CX}
        cy={CY}
        r={R}
        fill="none"
        stroke={c.ringFaint}
        strokeWidth="1"
      />

      {/* Concentric lattice rings (20/40/60/80 %) — circles so the
          grid stays smooth regardless of axis count. */}
      <g fill="none" stroke={c.lattice} strokeWidth="0.6">
        {RING_LEVELS.map((frac) => (
          <circle key={frac} cx={CX} cy={CY} r={R * frac} />
        ))}
      </g>

      {/* Axis spokes — one per axis. */}
      <g stroke={c.grid} strokeWidth="0.6">
        {axes.map((axis, i) => {
          const tip = axisPoint(axisAngle(i, total), R)
          return (
            <line
              key={`spoke-${axis.id}`}
              x1={CX}
              y1={CY}
              x2={tip.x.toFixed(1)}
              y2={tip.y.toFixed(1)}
            />
          )
        })}
      </g>

      {/* Ring scale labels — only on the top vertical spoke so the
          plate stays uncluttered. Sit just above each ring so the
          glyph doesn't overlap the lattice line. */}
      <g fontSize="7" fill={c.ringLabel} textAnchor="end">
        <text x={232} y={201}>
          20
        </text>
        <text x={232} y={166}>
          40
        </text>
        <text x={232} y={131}>
          60
        </text>
        <text x={232} y={96}>
          80
        </text>
        <text x={232} y={61}>
          100
        </text>
      </g>

      {/* Real-data polygon */}
      <polygon
        points={polygonPoints}
        fill={polyFill}
        stroke={polyStroke}
        strokeWidth="1.3"
      />

      {/* Tracker dots on each polygon vertex. */}
      <g fill={c.ink}>
        {axes.map((axis, i) => {
          const v = Math.max(0.06, clamp01(axis.value))
          const p = axisPoint(axisAngle(i, total), R * v)
          return (
            <circle
              key={`dot-${axis.id}`}
              cx={p.x.toFixed(1)}
              cy={p.y.toFixed(1)}
              r="2.2"
            />
          )
        })}
      </g>

      {/* Centre node */}
      <circle cx={CX} cy={CY} r="2.8" fill={c.ink} />

      {/* Pill labels — auto-positioned just outside the rim, anchored
          per-quadrant so the text always reads outward from the
          centre. Active pill gets a thin outline. */}
      {axes.map((axis, i) => {
        const angle = axisAngle(i, total)
        const labelPos = axisPoint(angle, R + LABEL_RADIUS_OFFSET)
        const isActive = activeId === axis.id
        const dim = isFocused && !isActive
        const style: CSSProperties | undefined = onAxisClick
          ? { cursor: 'pointer' }
          : undefined
        return (
          <PillLabel
            key={`label-${axis.id}`}
            x={labelPos.x}
            y={labelPos.y}
            bg={axis.color}
            outline={isActive ? c.ink : undefined}
            opacity={dim ? 0.45 : 1}
            fontSize={12}
            icon={axis.icon}
            style={style}
            onClick={onAxisClick ? () => onAxisClick(axis.id) : undefined}
          >
            {axis.label}
          </PillLabel>
        )
      })}
    </svg>
  )
}

/**
 * SVG chip — coloured disc + monochrome Material Symbols glyph
 * inside. No text in the chip (the axis identity reads from colour +
 * glyph); the original `children` label is folded into the
 * `aria-label` for screen readers. Active axes get a thin ink-ring.
 */
function PillLabel({
  x,
  y,
  bg,
  outline,
  opacity = 1,
  fontSize,
  icon,
  children,
  style,
  onClick,
}: {
  x: number
  y: number
  bg: string
  outline?: string
  opacity?: number
  fontSize: number
  /** Material Symbols Outlined glyph name (e.g. `'palette'`). */
  icon?: string
  children: string
  style?: CSSProperties
  onClick?: () => void
}) {
  const label = String(children).replace(/\s+/g, ' ').trim()
  const size = fontSize * 2.2
  const rectX = x - size / 2
  const rectY = y - size / 2
  return (
    <g
      style={style}
      onClick={onClick}
      opacity={opacity}
      role={onClick ? 'button' : undefined}
      aria-label={label}
    >
      <rect
        x={rectX}
        y={rectY}
        width={size}
        height={size}
        rx={size / 2}
        ry={size / 2}
        fill={bg}
        stroke={outline ?? 'none'}
        strokeWidth={outline ? 1.5 : 0}
      />
      {icon && (
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={fontSize * 1.25}
          fontFamily="Material Symbols Outlined"
          fill="#02000e"
          style={{
            fontVariationSettings: "'FILL' 0, 'wght' 600, 'GRAD' 0, 'opsz' 24",
          }}
        >
          {icon}
        </text>
      )}
    </g>
  )
}
