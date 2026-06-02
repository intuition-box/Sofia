import { useMemo } from 'react'
import {
  CERTIFICATION_COLORS,
  INTENTION_CONFIG,
  predicateLabelToIntentionType,
  type IntentionType,
} from '../config/intentions'
import { calculateLevel } from '../lib/level/calculation'
import type { UserCert } from '../services/userOnChainProfileService'
import { extractDomain } from '../utils/formatting'

// ── Input contract ───────────────────────────────────────────────────────

export interface IntentionActivityInput {
  domain: string
  intents: IntentionType[]
  tags?: string[]
  isCertification?: boolean
  attentionSeconds?: number
  /** Full URL of the certified resource. Optional — old atoms only
   *  stored the domain. Used downstream to derive YouTube thumbnails
   *  and similar URL-specific previews on the Echoes bento cards. */
  url?: string
}

// ── Output shape ─────────────────────────────────────────────────────────

export interface IntentionGroupWithStats {
  id: string
  domain: string
  activeUrlCount: number
  certifiedCount: number
  totalAttentionTime: number
  currentPredicate: string | null
  level: number
  certificationBreakdown: Partial<Record<IntentionType, number>>
  /** Topic slugs seen across the group's activities, ordered by
   *  frequency desc. Powers the context chips on the Echoes card. */
  topicSlugs: string[]
  urls: {
    /** Historically the domain — kept for back-compat with callers
     *  that read `.url`. New consumers should prefer `fullUrl`. */
    url: string
    intent: IntentionType
    /** Full URL when available (post-migration certs); undefined for
     *  legacy atoms that only stored the domain in `objectLabel`. */
    fullUrl?: string
  }[]
}

// ── Adapters ─────────────────────────────────────────────────────────────

/**
 * Convert master-profile UserCert rows to the `IntentionActivityInput`
 * shape consumed by `buildIntentionGroups`. Every cert is treated as a
 * certification (the master fetcher already filters out non-cert
 * predicates) and the domain is derived from the URL atom — falling
 * back to the label when the atom doesn't expose a URL (old-style
 * atoms only stored the domain in `label`).
 */
export function userCertsToActivityInputs(
  certs: readonly UserCert[],
): IntentionActivityInput[] {
  const out: IntentionActivityInput[] = []
  for (const cert of certs) {
    const intent = predicateLabelToIntentionType(cert.intention)
    if (!intent) continue
    const domain =
      (cert.objectUrl && extractDomain(cert.objectUrl)) ||
      (cert.objectLabel && extractDomain(cert.objectLabel)) ||
      cert.objectLabel
    if (!domain) continue
    out.push({
      domain,
      intents: [intent],
      tags: cert.topicSlugs,
      isCertification: true,
      url: cert.objectUrl || undefined,
    })
  }
  return out
}

// ── Sort strategies ──────────────────────────────────────────────────────

export type EchoesSort = 'platform' | 'verb' | 'topic'

export interface BuildIntentionGroupsOptions {
  topicFilter?: string | 'all'
  verbFilter?: IntentionType | 'all'
  sort?: EchoesSort
}

// ── Core pure function ───────────────────────────────────────────────────

export function buildIntentionGroups(
  activities: readonly IntentionActivityInput[],
  opts: BuildIntentionGroupsOptions = {},
): IntentionGroupWithStats[] {
  const topicFilter = opts.topicFilter ?? 'all'
  const verbFilter = opts.verbFilter ?? 'all'
  const sort: EchoesSort = opts.sort ?? 'platform'

  const groups = new Map<string, IntentionGroupWithStats>()
  // Per-group topic tallies, kept aside so the group's `topicSlugs`
  // can be ordered by frequency once every activity is folded in.
  const topicCounts = new Map<string, Map<string, number>>()
  for (const a of activities) {
    if (topicFilter !== 'all' && (!a.tags || !a.tags.includes(topicFilter)))
      continue
    if (
      verbFilter !== 'all' &&
      !a.intents.includes(verbFilter as IntentionType)
    )
      continue

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
        topicSlugs: [],
        urls: [],
      }
      groups.set(key, g)
    }
    g.activeUrlCount++
    if (a.isCertification) g.certifiedCount++
    g.totalAttentionTime += a.attentionSeconds ?? 0

    if (a.tags && a.tags.length > 0) {
      let counts = topicCounts.get(key)
      if (!counts) {
        counts = new Map<string, number>()
        topicCounts.set(key, counts)
      }
      for (const t of a.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
    }

    for (const i of a.intents) {
      g.certificationBreakdown[i] = (g.certificationBreakdown[i] ?? 0) + 1
    }
    const firstIntent = a.intents[0]
    if (firstIntent !== undefined) {
      g.urls.push({ url: a.domain, intent: firstIntent, fullUrl: a.url })
    }
  }

  for (const g of groups.values()) {
    g.level = calculateLevel(
      g.certifiedCount + Math.floor(g.activeUrlCount / 2),
    )
    const dominant = pickDominantIntent(g)
    if (dominant) {
      g.currentPredicate = INTENTION_CONFIG[dominant]?.predicateLabel ?? null
    }
    const counts = topicCounts.get(g.id)
    if (counts) {
      g.topicSlugs = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([slug]) => slug)
    }
  }

  const out = [...groups.values()]
  // Level desc is always the primary key — highest-level groups float
  // to the top regardless of the tab. The chosen tab becomes the
  // tiebreaker within the same level (alpha / verb cluster / topic
  // cluster), with `activeUrlCount` desc as the final fallback.
  switch (sort) {
    case 'platform':
      out.sort(
        (a, b) =>
          b.level - a.level ||
          b.activeUrlCount - a.activeUrlCount ||
          a.domain.localeCompare(b.domain),
      )
      break
    case 'verb': {
      const verbKey = (g: IntentionGroupWithStats): string =>
        (pickDominantIntent(g) as string | undefined) ?? 'zz'
      out.sort(
        (a, b) =>
          b.level - a.level ||
          verbKey(a).localeCompare(verbKey(b)) ||
          b.activeUrlCount - a.activeUrlCount,
      )
      break
    }
    case 'topic': {
      const topicKey = (
        g: IntentionGroupWithStats,
        lookup: Map<string, string[]>,
      ): string => {
        const tagCounts = new Map<string, number>()
        for (const u of g.urls) {
          for (const t of lookup.get(u.url) ?? []) {
            tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)
          }
        }
        const top = [...tagCounts.entries()].sort((a, b) => b[1] - a[1])[0]
        return top ? top[0] : 'zz'
      }
      const lookup = new Map<string, string[]>()
      for (const a of activities) {
        if (a.tags && a.tags.length > 0) lookup.set(a.domain, a.tags)
      }
      out.sort(
        (a, b) =>
          b.level - a.level ||
          topicKey(a, lookup).localeCompare(topicKey(b, lookup)) ||
          b.activeUrlCount - a.activeUrlCount,
      )
      break
    }
  }

  return out
}

// ── React hook ───────────────────────────────────────────────────────────

export function useIntentionGroups(
  activities: readonly IntentionActivityInput[],
  opts: BuildIntentionGroupsOptions = {},
): IntentionGroupWithStats[] {
  return useMemo(
    () => buildIntentionGroups(activities, opts),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activities, opts.topicFilter, opts.verbFilter, opts.sort],
  )
}

// ── Pure helpers re-used by consumers ────────────────────────────────────

export function pickDominantIntent(
  g: Pick<IntentionGroupWithStats, 'certificationBreakdown'>,
): IntentionType | null {
  let best: [IntentionType, number] | null = null
  for (const [k, v] of Object.entries(g.certificationBreakdown) as [
    IntentionType,
    number,
  ][]) {
    if (v === undefined) continue
    if (!best || v > best[1]) best = [k, v]
  }
  return best ? best[0] : null
}

export function pickDominantColor(
  g: Pick<IntentionGroupWithStats, 'certificationBreakdown'>,
  fallback = '#C7866C',
): string {
  const dominant = pickDominantIntent(g)
  return dominant ? CERTIFICATION_COLORS[dominant] : fallback
}
