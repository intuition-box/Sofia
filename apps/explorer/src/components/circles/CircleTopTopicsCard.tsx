/**
 * CircleTopTopicsCard — proto's "Top topics" bars with real topic labels
 * + colours. Counts are mocked until we can aggregate per-topic activity
 * across the circle's members.
 */
import { useTaxonomy } from '@/hooks/useTaxonomy'

interface CircleTopTopicsCardProps {
  /** Topic slugs to surface (in display order). */
  topicIds: string[]
  /** Accent colour driving the bar fill. */
  circleColor: string
}

export default function CircleTopTopicsCard({ topicIds, circleColor }: CircleTopTopicsCardProps) {
  const { topicById } = useTaxonomy()
  const rows = topicIds
    .map((id, i) => {
      const topic = topicById(id)
      if (!topic) return null
      // Synthetic count — proto pattern. Real aggregation comes later.
      const count = Math.max(20, Math.round(200 - i * 60))
      return { id, label: topic.label, count }
    })
    .filter((x): x is { id: string; label: string; count: number } => x !== null)

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
                  width: `${Math.min(100, r.count / 2.5)}%`,
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
