/**
 * CircleFeedSection — "Certified by Trust Circle" — reuses the existing
 * `useCircleFeed` + `CircleCard`. Capped to the first 12 items for now
 * (pagination can be wired later).
 */
import { useCircleFeed } from '@/hooks/useCircleFeed'
import CircleCard from '@/components/CircleCard'

interface CircleFeedSectionProps {
  walletAddress: string | undefined
  circleName: string
}

export default function CircleFeedSection({ walletAddress, circleName }: CircleFeedSectionProps) {
  const { items, loading, error } = useCircleFeed(walletAddress)
  const shown = items.slice(0, 12)

  return (
    <section className="crd-feed-section">
      <h2 className="crd-feed-title">Certified by {circleName}</h2>
      {loading ? (
        <div className="crd-feed-empty">Loading feed…</div>
      ) : error ? (
        <div className="crd-feed-empty">Couldn't load the feed.</div>
      ) : shown.length === 0 ? (
        <div className="crd-feed-empty">No certifications from the circle yet.</div>
      ) : (
        <div className="crd-feed-grid">
          {shown.map((item) => (
            <CircleCard
              key={item.id}
              item={item}
              displayName={item.certifier}
              avatar=""
              isPrivate={false}
            />
          ))}
        </div>
      )}
    </section>
  )
}
