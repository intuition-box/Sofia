import ActivityCard from './ActivityCard'
import type { CircleItem } from '@/services/circleService'
import { ActivityCardSkeleton } from './ProfileSkeletons'

interface LastActivitySectionProps {
  items: CircleItem[]
  loading: boolean
  walletAddress: string
}

export default function LastActivitySection({ items, loading, walletAddress }: LastActivitySectionProps) {
  if (loading) {
    return (
      <div className="las-grid">
        {Array.from({ length: 4 }).map((_, i) => <ActivityCardSkeleton key={i} />)}
      </div>
    )
  }

  // Filter out quest items (Daily Certification, Daily Voter, etc.)
  const certifications = items.filter((item) => !item.intentions.some((i) => i.startsWith('quest:')))

  if (certifications.length === 0) {
    return (
      <div className="las-empty">
        <p className="text-sm text-muted-foreground">No activity yet. Start certifying pages with Sofia!</p>
      </div>
    )
  }

  const display = certifications.slice(0, 12)

  return (
    <div className="las-grid">
      {display.map((item) => (
        <ActivityCard
          key={item.id}
          item={item}
          walletAddress={walletAddress}
        />
      ))}
    </div>
  )
}
