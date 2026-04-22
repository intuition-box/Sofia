import { useMemo } from 'react'
import {
  CERTIFICATION_COLORS,
  INTENTION_CONFIG,
  type IntentionType,
} from '../taxonomy/intentions'
import { calculateLevel } from '../level/calculation'

// ── Input contract ───────────────────────────────────────────────────────

/**
 * Normalised activity row consumed by {@link buildIntentionGroups}. Callers
 * adapt their own activity types (explorer's `useAllActivity`, extension's
 * `useIntentionGroups`, etc.) into this shape before passing it in.
 */
export interface IntentionActivityInput {
  /** Domain / host string the activity refers to — e.g. `github.com`. */
  domain: string
  /** All intent types associated with the underlying URL. */
  intents: IntentionType[]
  /** Topic / domain tags of the URL (used when sorting by `topic`). */
  tags?: string[]
  /** Whether this activity counts as an on-chain certification. */
  isCertification?: boolean
  /**
   * Contribution to the group's total attention time, in seconds. Callers
   * that have real attention data should sum their own measurements; mock
   * data providers can generate a deterministic value.
   */
  attentionSeconds?: number
}

// ── Output shape ─────────────────────────────────────────────────────────

/**
 * Rolled-up per-domain state derived from one or more activity rows. Matches
 * the shape the extension's bento card renderer expects.
 */
export interface IntentionGroupWithStats {
  id: string
  domain: string
  activeUrlCount: number
  certifiedCount: number
  totalAttentionTime: number
  currentPredicate: string | null
  level: number
  certificationBreakdown: Partial<Record<IntentionType, number>>
  urls: { url: string; intent: IntentionType }[]
}

// ── Sort strategies ──────────────────────────────────────────────────────

export type EchoesSort = 'platform' | 'verb' | 'topic'

export interface BuildIntentionGroupsOptions {
  /** Keep only activities tagged with this topic (id). Set to `'all'` to disable. */
  topicFilter?: string | 'all'
  /** Keep only activities matching this intent type. Set to `'all'` to disable. */
  verbFilter?: IntentionType | 'all'
  /** Order the resulting groups. Defaults to `'platform'`. */
  sort?: EchoesSort
}

// ── Core pure function ───────────────────────────────────────────────────

/**
 * Bucket activities by domain, compute certification/level stats, and
 * return the sorted list. Pure function — callers can memoise as needed.
 */
export function buildIntentionGroups(
  activities: readonly IntentionActivityInput[],
  opts: BuildIntentionGroupsOptions = {},
): IntentionGroupWithStats[] {
  const topicFilter = opts.topicFilter ?? 'all'
  const verbFilter = opts.verbFilter ?? 'all'
  const sort: EchoesSort = opts.sort ?? 'platform'

  const groups = new Map<string, IntentionGroupWithStats>()
  for (const a of activities) {
    if (topicFilter !== 'all' && (!a.tags || !a.tags.includes(topicFilter))) continue
    if (verbFilter !== 'all' && !a.intents.includes(verbFilter as IntentionType)) continue

    const key = a.domain
    let g = groups.get(key)
    if (!g) {
      g = {
        id: key,
        domain: key,
        activeUrlCount: 0,
        certifiedCount: 0,
        totalAttentionTime: 0,
        currentPredicate: null,
        level: 1,
        certificationBreakdown: {},
        urls: [],
      }
      groups.set(key, g)
    }
    g.activeUrlCount++
    if (a.isCertification) g.certifiedCount++
    g.totalAttentionTime += a.attentionSeconds ?? 0

    for (const i of a.intents) {
      g.certificationBreakdown[i] = (g.certificationBreakdown[i] ?? 0) + 1
    }
    if (a.intents.length > 0) {
      g.urls.push({ url: a.domain, intent: a.intents[0] })
    }
  }

  // Derive level + dominant predicate per group.
  for (const g of groups.values()) {
    g.level = calculateLevel(g.certifiedCount + Math.floor(g.activeUrlCount / 2))
    const dominant = pickDominantIntent(g)
    if (dominant) {
      g.currentPredicate = INTENTION_CONFIG[dominant]?.predicateLabel ?? null
    }
  }

  const out = [...groups.values()]
  switch (sort) {
    case 'platform':
      out.sort((a, b) => a.domain.localeCompare(b.domain))
      break
    case 'verb': {
      const verbKey = (g: IntentionGroupWithStats): string =>
        (pickDominantIntent(g) as string | undefined) ?? 'zz'
      out.sort((a, b) => verbKey(a).localeCompare(verbKey(b)) || b.activeUrlCount - a.activeUrlCount)
      break
    }
    case 'topic': {
      // Topic sort uses the most frequent tag across the group's activities;
      // the caller is responsible for populating `tags` on inputs.
      const topicKey = (g: IntentionGroupWithStats, lookup: Map<string, string[]>): string => {
        const tagCounts = new Map<string, number>()
        for (const u of g.urls) {
          for (const t of lookup.get(u.url) ?? []) {
            tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)
          }
        }
        const top = [...tagCounts.entries()].sort((a, b) => b[1] - a[1])[0]
        return top ? top[0] : 'zz'
      }
      // Build lookup from activities (only path that knows tags).
      const lookup = new Map<string, string[]>()
      for (const a of activities) {
        if (a.tags && a.tags.length > 0) lookup.set(a.domain, a.tags)
      }
      out.sort((a, b) => topicKey(a, lookup).localeCompare(topicKey(b, lookup)) || b.activeUrlCount - a.activeUrlCount)
      break
    }
  }

  return out
}

// ── React hook ───────────────────────────────────────────────────────────

/**
 * React-friendly wrapper around {@link buildIntentionGroups} — memoised on
 * the activity list and the options. Use directly from components that need
 * the bento grid data.
 */
export function useIntentionGroups(
  activities: readonly IntentionActivityInput[],
  opts: BuildIntentionGroupsOptions = {},
): IntentionGroupWithStats[] {
  return useMemo(
    () => buildIntentionGroups(activities, opts),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable opts object expected
    [activities, opts.topicFilter, opts.verbFilter, opts.sort],
  )
}

// ── Pure helpers re-used by consumers ────────────────────────────────────

/** Return the intent with the highest breakdown count, or null. */
export function pickDominantIntent(
  g: Pick<IntentionGroupWithStats, 'certificationBreakdown'>,
): IntentionType | null {
  let best: [IntentionType, number] | null = null
  for (const [k, v] of Object.entries(g.certificationBreakdown) as [IntentionType, number][]) {
    if (v === undefined) continue
    if (!best || v > best[1]) best = [k, v]
  }
  return best ? best[0] : null
}

/** Return the hex color for the dominant intent, or a neutral fallback. */
export function pickDominantColor(
  g: Pick<IntentionGroupWithStats, 'certificationBreakdown'>,
  fallback = '#C7866C',
): string {
  const dominant = pickDominantIntent(g)
  return dominant ? CERTIFICATION_COLORS[dominant] : fallback
}
