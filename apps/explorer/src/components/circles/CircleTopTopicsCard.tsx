/**
 * CircleTopTopicsCard — proto's "Top topics" bars with real topic labels
 * + colours.
 *
 * Counts come from the alltime aggregate in `useCircleTopicCounts` (one
 * dedicated Hasura query, cached for 5 min). While that query is
 * loading, the card falls back to a recent-window tally derived from
 * the feed payload (`useCircleFeed.items.topicContexts`) so the bars
 * never appear empty during the first paint.
 */
import { useMemo } from 'react'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { TOPIC_ATOM_IDS } from '@/config/atomIds'
import type { CircleItem } from '@/services/circleService'
import type { CircleTopicCounts } from '@/services/circleTopicCountsService'

interface CircleTopTopicsCardProps {
  /** Topic slugs to surface (in display order). */
  topicIds: string[]
  /** Accent colour driving the bar fill. */
  circleColor: string
  /**
   * Alltime per-topic cert counts. Keys are topic atom term_ids — the
   * card resolves each `topicIds` entry via `TOPIC_ATOM_IDS`. Pass an
   * empty Map (or omit) while loading to fall back on `items`.
   */
  counts?: CircleTopicCounts
  /**
   * Circle feed items used as the loading fallback for `counts`. Pass
   * `useCircleFeed(addresses).items` so first paint reflects recent
   * activity instead of empty bars.
   */
  items?: readonly CircleItem[]
}

export default function CircleTopTopicsCard({
  topicIds,
  circleColor,
  counts,
  items,
}: CircleTopTopicsCardProps) {
  const { topicById } = useTaxonomy()

  const fallbackCounts = useMemo(() => {
    const map = new Map<string, number>()
    if (!items) return map
    for (const item of items) {
      for (const t of item.topicContexts) {
        map.set(t, (map.get(t) ?? 0) + 1)
      }
    }
    return map
  }, [items])

  const rows = topicIds
    .map((id) => {
      const topic = topicById(id)
      if (!topic) return null
      const atomId = TOPIC_ATOM_IDS[id]
      const alltime = atomId ? counts?.get(atomId) : undefined
      const count = alltime ?? fallbackCounts.get(id) ?? 0
      return { id, label: topic.label, count }
    })
    .filter(
      (x): x is { id: string; label: string; count: number } => x !== null,
    )

  // Scale bars to the largest count in the visible set (or 1 when empty)
  // so a circle with fewer signals still gets readable proportions.
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0) || 1

  return (
    <div className="crd-topics-section">
      <div className="cr-section-head">Top topics</div>
      <div className="cr-topics-list">
        {rows.map((r) => (
          <div key={r.id} className="cr-topics-row">
            <span className="cr-topics-label">{r.label}</span>
            <span className="cr-topics-num">{r.count}</span>
            <div className="cr-topics-bar">
              <div
                className="cr-topics-fill"
                style={{
                  width: `${(r.count / max) * 100}%`,
                  background: circleColor,
                }}
              />
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="crd-feed-empty" style={{ marginTop: 4 }}>
            No top topics yet.
          </div>
        )}
      </div>
    </div>
  )
}
