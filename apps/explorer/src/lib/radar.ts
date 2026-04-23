/**
 * Radar chart helpers — generic axes + series model.
 *
 * The chart has two symmetric roles:
 *   - `axes`: the spokes (one per axis item, emoji labels at the rim)
 *   - `series`: one polygon per series, each with counts keyed by axis id
 *
 * Either shape can play either role — e.g. on /profile we now draw topic
 * polygons over verb axes; the old flavour drew verb polygons over topic
 * axes. Both `RadarAxis` and `RadarSeries` carry the same metadata so
 * the semantics are defined by the caller.
 */
import { INTENTION_CONFIG, type IntentionType } from '@/config/intentions'

export type RadarVerbId = Exclude<IntentionType, 'trusted' | 'distrusted'>
export type SeriesFilter = 'all' | string

export interface RadarAxis {
  id: string
  label: string
  emoji: string
  color: string
}

export interface RadarSeries extends RadarAxis {
  /** Counts keyed by axis id (the spokes). */
  counts: Record<string, number>
}

/** Backwards-compat aliases — old code may still import these names. */
export type RadarTopicAxis = RadarAxis
export type VerbFilter = SeriesFilter

/** Six-verb ordering used by the proto radar chart (trust + distrust excluded). */
export const RADAR_VERBS: readonly RadarAxis[] = [
  { id: 'work',        label: INTENTION_CONFIG.work.label,        emoji: '💼', color: INTENTION_CONFIG.work.color },
  { id: 'learning',    label: INTENTION_CONFIG.learning.label,    emoji: '📚', color: INTENTION_CONFIG.learning.color },
  { id: 'inspiration', label: INTENTION_CONFIG.inspiration.label, emoji: '✨', color: INTENTION_CONFIG.inspiration.color },
  { id: 'fun',         label: INTENTION_CONFIG.fun.label,         emoji: '🎮', color: INTENTION_CONFIG.fun.color },
  { id: 'buying',      label: INTENTION_CONFIG.buying.label,      emoji: '🛍️', color: INTENTION_CONFIG.buying.color },
  { id: 'music',       label: INTENTION_CONFIG.music.label,       emoji: '🎵', color: INTENTION_CONFIG.music.color },
]

/** Deterministic synthetic count for a (seriesKey, axisKey) pair — 0..12. */
export function syntheticCount(seriesKey: string, axisKey: string): number {
  let hash = 2166136261 >>> 0
  const key = `${seriesKey}:${axisKey}`
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i)
    hash = Math.imul(hash, 16777619) >>> 0
  }
  return hash % 13
}

/** An axis positioned on the SVG circle (angle pre-computed). */
export type PositionedAxis = RadarAxis & { angle: number }

/**
 * Evenly distribute `n` axes inside one semicircle of the split radar.
 *   top    → angles in (-π, 0)  (sin < 0, upper half of the SVG)
 *   bottom → angles in (0, π)   (sin > 0, lower half of the SVG)
 */
export function angleInHalf(
  i: number,
  n: number,
  half: 'top' | 'bottom',
): number {
  const gap = Math.PI / (n + 1)
  const t = gap * (i + 1)
  return half === 'top' ? -Math.PI + t : t
}

/** Place each axis in its half of the split radar and return the combined list. */
export function positionAxes(
  topAxes: readonly RadarAxis[],
  bottomAxes: readonly RadarAxis[],
): PositionedAxis[] {
  return [
    ...topAxes.map((a, i) => ({ ...a, angle: angleInHalf(i, topAxes.length, 'top') })),
    ...bottomAxes.map((a, i) => ({ ...a, angle: angleInHalf(i, bottomAxes.length, 'bottom') })),
  ]
}

/** Closed SVG path through `points` using Catmull-Rom → cubic smoothing. */
export function smoothClosedPath(
  points: readonly [number, number][],
  tension = 0.03,
): string {
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
