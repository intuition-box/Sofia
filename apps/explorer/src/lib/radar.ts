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

/** Build synthetic series from a list of series-meta + axes. */
export function buildSyntheticSeries(
  seriesMeta: readonly RadarAxis[],
  axes: readonly RadarAxis[],
): RadarSeries[] {
  return seriesMeta.map((s) => {
    const counts: Record<string, number> = {}
    for (const a of axes) counts[a.id] = syntheticCount(s.id, a.id)
    return { ...s, counts }
  })
}
