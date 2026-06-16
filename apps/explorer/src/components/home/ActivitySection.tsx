/**
 * ActivitySection — Explore-home block. Shows the most recent feed items as
 * a compact preview and a "N new" badge counting items certified since the
 * user's previous visit. "View all" opens the full activity feed.
 */
import type { Address } from 'viem'
import type { CircleItem } from '@/services/circleService'
import FeedCard from './FeedCard'
import HomeSection from './HomeSection'
import { countNewSince } from '@/hooks/useLastVisit'

const PREVIEW_COUNT = 6

interface ActivitySectionProps {
  items: CircleItem[]
  getDisplay: (addr: Address) => string
  getAvatar: (addr: Address) => string
  ownAddresses: Set<string>
  onDeposit: (side: 'support' | 'oppose', item: CircleItem) => void
  lastVisit: string | null
  onSeeAll: () => void
}

export default function ActivitySection({
  items,
  getDisplay,
  getAvatar,
  ownAddresses,
  onDeposit,
  lastVisit,
  onSeeAll,
}: ActivitySectionProps) {
  const preview = items.slice(0, PREVIEW_COUNT)
  const newCount = countNewSince(
    items.map((i) => i.timestamp),
    lastVisit,
  )

  return (
    <HomeSection
      title="Activity"
      badge={newCount > 0 ? `${newCount} new` : undefined}
      action={{ label: 'View all', onClick: onSeeAll }}
    >
      {preview.length === 0 ? (
        <p className="hm-empty">No recent activity yet.</p>
      ) : (
        <div className="hm-drill-grid">
          {preview.map((item) => {
            const addr = item.certifierAddress as Address
            const name = addr ? getDisplay(addr) : item.certifier
            const av = addr ? getAvatar(addr) : ''
            const isOwner = ownAddresses.has(
              (item.certifierAddress || '').toLowerCase(),
            )
            return (
              <FeedCard
                key={item.id}
                item={item}
                displayName={name}
                avatar={av}
                isOwner={isOwner}
                size="md"
                onDeposit={onDeposit}
              />
            )
          })}
        </div>
      )}
    </HomeSection>
  )
}
