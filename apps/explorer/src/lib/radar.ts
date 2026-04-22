/**
 * Radar chart helpers — verb series + synthetic fallback.
 * Ported from proto-explorer/src/components/profileCharts.ts:99-133.
 */
import { INTENTION_CONFIG, type IntentionType } from '@/config/intentions'

export type RadarVerbId = Exclude<IntentionType, 'trusted' | 'distrusted'>
export type VerbFilter = 'all' | RadarVerbId

export interface RadarVerb {
  id: RadarVerbId
  label: string
  emoji: string
  color: string
}

/** Six-verb ordering used by the proto radar chart (trust + distrust excluded). */
export const RADAR_VERBS: readonly RadarVerb[] = [
  { id: 'work',        label: INTENTION_CONFIG.work.label,        emoji: '💼', color: INTENTION_CONFIG.work.color },
  { id: 'learning',    label: INTENTION_CONFIG.learning.label,    emoji: '📚', color: INTENTION_CONFIG.learning.color },
  { id: 'inspiration', label: INTENTION_CONFIG.inspiration.label, emoji: '✨', color: INTENTION_CONFIG.inspiration.color },
  { id: 'fun',         label: INTENTION_CONFIG.fun.label,         emoji: '🎮', color: INTENTION_CONFIG.fun.color },
  { id: 'buying',      label: INTENTION_CONFIG.buying.label,      emoji: '🛍️', color: INTENTION_CONFIG.buying.color },
  { id: 'music',       label: INTENTION_CONFIG.music.label,       emoji: '🎵', color: INTENTION_CONFIG.music.color },
]

/** One axis of the radar — a topic with its visual identity. */
export interface RadarTopicAxis {
  id: string
  label: string
  emoji: string
  color: string
}

/** Count per topic for a given verb. */
export interface RadarVerbSeries {
  verb: RadarVerb
  /** Keyed by topic id (axis). */
  counts: Record<string, number>
}

/**
 * Deterministic synthetic per-(verb, topic) count pattern — a stable hash
 * of the pair seeds a pseudo-random 0..12 count. Same role as the
 * calendar's synthetic builder: keeps the radar readable before the
 * real on-chain count series is wired.
 */
export function buildSyntheticVerbSeries(axes: RadarTopicAxis[]): RadarVerbSeries[] {
  return RADAR_VERBS.map((v) => {
    const counts: Record<string, number> = {}
    for (const axis of axes) {
      const key = `${v.id}:${axis.id}`
      let hash = 2166136261 >>> 0
      for (let i = 0; i < key.length; i++) {
        hash ^= key.charCodeAt(i)
        hash = Math.imul(hash, 16777619) >>> 0
      }
      counts[axis.id] = hash % 13
    }
    return { verb: v, counts }
  })
}
