/**
 * useCircleTopicActivity — per-topic activity for the Topics treemap.
 *
 * Derives, for every topic the circle is actually active in, a
 * `{ slug, label, color, signals }` record from the circle feed — the
 * SAME `topicContexts` tally `CircleTopTopicsCard` uses for its loading
 * fallback, but unbounded (all active topics, not just the 4 selected).
 *
 * Counts come from `feedItems[*].topicContexts` (rolled-up topic slugs
 * from each certification's "in context of" triples), so a cell's size is
 * a REAL measure of how much the roster has certified under that topic.
 *
 * Label + colour are resolved from `@0xsofia/taxonomy` (`TOPIC_LABEL` /
 * `TOPIC_META[slug].color`) — the single source the rest of the app uses
 * — so the treemap never drifts from the feed pills. Topic slugs with no
 * taxonomy entry are dropped (we never invent a label or palette colour).
 */
import { useMemo } from 'react'
import { TOPIC_LABEL, TOPIC_META } from '@0xsofia/taxonomy'
import type { CircleItem } from '@/services/circleService'

/** One topic the circle is active in, ready for the treemap. */
export interface CircleTopicActivity {
  /** Topic slug (taxonomy id). */
  slug: string
  /** Canonical short display label. */
  label: string
  /** Topic palette colour from taxonomy `TOPIC_META`. */
  color: string
  /** Real certification count under this topic across the loaded feed. */
  signals: number
}

/**
 * Tally feed items per topic-context slug, resolve label + colour, and
 * return the active topics sorted by signal count descending (ties broken
 * by label for a stable order). Pure — exported for unit testing.
 */
export function deriveTopicActivity(
  items: readonly CircleItem[],
): CircleTopicActivity[] {
  const counts = new Map<string, number>()
  for (const item of items) {
    for (const slug of item.topicContexts) {
      counts.set(slug, (counts.get(slug) ?? 0) + 1)
    }
  }

  const out: CircleTopicActivity[] = []
  for (const [slug, signals] of counts) {
    const label = TOPIC_LABEL[slug]
    const color = TOPIC_META[slug]?.color
    // Drop slugs the taxonomy doesn't know — no fabricated label/colour.
    if (!label || !color) continue
    out.push({ slug, label, color, signals })
  }

  out.sort((a, b) =>
    b.signals !== a.signals
      ? b.signals - a.signals
      : a.label.localeCompare(b.label),
  )
  return out
}

/**
 * React wrapper around {@link deriveTopicActivity}, memoised on the feed
 * reference so the treemap layout only recomputes when the feed changes.
 */
export function useCircleTopicActivity(
  items: readonly CircleItem[],
): CircleTopicActivity[] {
  return useMemo(() => deriveTopicActivity(items), [items])
}
