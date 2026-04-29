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
import {
  displayLabelToIntentionType,
  INTENTION_CONFIG,
  type IntentionType,
} from '@/config/intentions'
import type { CircleItem } from '@/services/circleService'

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
  {
    id: 'work',
    label: INTENTION_CONFIG.work.label,
    emoji: '💼',
    color: INTENTION_CONFIG.work.color,
  },
  {
    id: 'learning',
    label: INTENTION_CONFIG.learning.label,
    emoji: '📚',
    color: INTENTION_CONFIG.learning.color,
  },
  {
    id: 'inspiration',
    label: INTENTION_CONFIG.inspiration.label,
    emoji: '✨',
    color: INTENTION_CONFIG.inspiration.color,
  },
  {
    id: 'fun',
    label: INTENTION_CONFIG.fun.label,
    emoji: '🎮',
    color: INTENTION_CONFIG.fun.color,
  },
  {
    id: 'buying',
    label: INTENTION_CONFIG.buying.label,
    emoji: '🛍️',
    color: INTENTION_CONFIG.buying.color,
  },
  {
    id: 'music',
    label: INTENTION_CONFIG.music.label,
    emoji: '🎵',
    color: INTENTION_CONFIG.music.color,
  },
]

/**
 * Real per-(topic × verb) cert counts derived from the user's CircleItem
 * activity feed. An item with multiple `topicContexts` and multiple
 * `intentions` is counted in every (topic, verb) cell it covers — that
 * matches how the radar should "spread" a multi-intent cert.
 *
 * `quest:*` intentions and intentions that don't resolve to a radar verb
 * (e.g. trusted / distrusted) are skipped.
 */
export interface TopicVerbCounts {
  /** counts[topicId][verbId] = number of certs in that cell. */
  counts: Map<string, Map<string, number>>
  /** Total certs per topic (sum across all verbs). */
  topicTotals: Map<string, number>
  /** Total certs per verb (sum across all topics). */
  verbTotals: Map<string, number>
  /** Lookup: 0 if the cell is missing. */
  get: (topicId: string, verbId: string) => number
  /** Total certs on a topic axis, regardless of verb. */
  getTopicTotal: (topicId: string) => number
  /** Total certs on a verb axis, regardless of topic. */
  getVerbTotal: (verbId: string) => number
}

const RADAR_VERB_IDS = new Set<string>(['work', 'learning', 'inspiration', 'fun', 'buying', 'music'])

export function bucketActivityByTopicAndVerb(
  items: readonly CircleItem[],
): TopicVerbCounts {
  const counts = new Map<string, Map<string, number>>()
  const topicTotals = new Map<string, number>()
  const verbTotals = new Map<string, number>()

  for (const item of items) {
    if (item.topicContexts.length === 0) continue
    const verbIds = new Set<string>()
    for (const label of item.intentions) {
      if (label.startsWith('quest:')) continue
      const verbId = displayLabelToIntentionType(label)
      if (verbId && RADAR_VERB_IDS.has(verbId)) verbIds.add(verbId)
    }
    if (verbIds.size === 0) continue
    for (const topicId of item.topicContexts) {
      let row = counts.get(topicId)
      if (!row) {
        row = new Map()
        counts.set(topicId, row)
      }
      topicTotals.set(topicId, (topicTotals.get(topicId) ?? 0) + 1)
      for (const verbId of verbIds) {
        row.set(verbId, (row.get(verbId) ?? 0) + 1)
        verbTotals.set(verbId, (verbTotals.get(verbId) ?? 0) + 1)
      }
    }
  }

  return {
    counts,
    topicTotals,
    verbTotals,
    get: (topicId, verbId) => counts.get(topicId)?.get(verbId) ?? 0,
    getTopicTotal: (topicId) => topicTotals.get(topicId) ?? 0,
    getVerbTotal: (verbId) => verbTotals.get(verbId) ?? 0,
  }
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
    ...topAxes.map((a, i) => ({
      ...a,
      angle: angleInHalf(i, topAxes.length, 'top'),
    })),
    ...bottomAxes.map((a, i) => ({
      ...a,
      angle: angleInHalf(i, bottomAxes.length, 'bottom'),
    })),
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
