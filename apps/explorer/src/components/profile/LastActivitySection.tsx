import { useMemo } from 'react'
import {
  GroupBentoCard,
  displayLabelToIntentionType,
  useIntentionGroups,
  type IntentionActivityInput,
  type IntentionType,
} from '@0xsofia/design-system'
import type { CircleItem } from '@/services/circleService'
import { getFaviconUrl } from '@/utils/favicon'
import { ActivityCardSkeleton } from './ProfileSkeletons'

interface LastActivitySectionProps {
  items: CircleItem[]
  loading: boolean
  /** Kept in the props contract for API parity with the previous component,
   *  even though the bento-card layout doesn't surface the wallet directly. */
  walletAddress: string
}

/** Map a filtered CircleItem into the design-system's IntentionActivityInput. */
function toActivityInput(item: CircleItem): IntentionActivityInput | null {
  const intents = item.intentions
    .map(displayLabelToIntentionType)
    .filter((x): x is IntentionType => x !== null)
  if (intents.length === 0) return null
  return {
    domain: item.domain || item.url,
    intents,
    tags: item.topicContexts,
    // Any intention with an on-chain vault counts as a certification.
    isCertification: Object.keys(item.intentionVaults).length > 0,
  }
}

export default function LastActivitySection({ items, loading }: LastActivitySectionProps) {
  const activities = useMemo<IntentionActivityInput[]>(() => {
    // Filter out quest items (Daily Certification, Daily Voter, …) — same
    // rule as the previous implementation.
    const certifications = items.filter(
      (item) => !item.intentions.some((i) => i.startsWith('quest:')),
    )
    return certifications
      .map(toActivityInput)
      .filter((x): x is IntentionActivityInput => x !== null)
  }, [items])

  const groups = useIntentionGroups(activities, { sort: 'platform' })

  if (loading) {
    return (
      <div className="bento-grid bento-grid-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <ActivityCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="groups-empty">
        <p className="text-sm text-muted-foreground">
          No activity yet. Start certifying pages with Sofia!
        </p>
      </div>
    )
  }

  return (
    <div className="triples-container">
      <div className="groups-section">
        <div className="bento-grid bento-grid-3">
          {groups.map((g) => (
            <GroupBentoCard
              key={g.id}
              group={g}
              faviconUrl={(domain) => getFaviconUrl(domain)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
