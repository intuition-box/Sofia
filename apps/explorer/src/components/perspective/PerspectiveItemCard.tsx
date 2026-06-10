/**
 * PerspectiveItemCard — single URL aggregated across multiple certifiers in
 * the Compose pipeline, rendered as a medium FeedCardView.
 */
import type { AggregatedCert } from '@/lib/perspectiveAggregation'
import FeedCardView from '@/components/feed/FeedCardView'
import type { FeedCardVerb } from '@/components/feed/FeedCardView'
import { INTENTION_COLORS } from '@/config/intentions'
import '@/components/styles/feed-card.css'

interface PerspectiveItemCardProps {
  item: AggregatedCert
  intentionColors: Record<string, string>
  showContrastScore?: boolean
}

export default function PerspectiveItemCard({
  item,
  intentionColors,
}: PerspectiveItemCardProps) {
  const certifierCount = item.certifierWallets.length

  const verbs: FeedCardVerb[] = item.intentions.slice(0, 2).map((label) => ({
    label,
    color:
      intentionColors[label] ?? INTENTION_COLORS[label] ?? 'var(--ds-muted)',
  }))

  return (
    <FeedCardView
      size="md"
      handle=""
      when=""
      title={item.title || item.domain}
      url={item.url}
      domain={item.domain}
      verbs={verbs}
      up={certifierCount}
      down={0}
      onOpen={() => {
        if (item.url) window.open(item.url, '_blank', 'noopener,noreferrer')
      }}
    />
  )
}
