import { useMemo } from 'react'
import { GroupBentoCard, type CertificationDot, formatDuration } from '@0xsofia/design-system'
import {
  displayLabelToIntentionType,
  CERTIFICATION_COLORS,
  type IntentionType,
} from '@/config/intentions'
import {
  useIntentionGroups,
  pickDominantColor,
  type IntentionActivityInput,
  type IntentionGroupWithStats,
} from '@/hooks/useIntentionGroups'
import { calculateLevelProgress } from '@/lib/level/calculation'
import { getLevelColor, getLevelColorAlpha } from '@/lib/level/colors'
import type { CircleItem } from '@/services/circleService'
import { getFaviconUrl } from '@/utils/favicon'
import { ActivityCardSkeleton } from './ProfileSkeletons'

interface LastActivitySectionProps {
  items: CircleItem[]
  loading: boolean
  walletAddress: string
}

/** Map a filtered CircleItem into the hook's activity input shape. */
function toActivityInput(item: CircleItem): IntentionActivityInput | null {
  const intents = item.intentions
    .map(displayLabelToIntentionType)
    .filter((x): x is IntentionType => x !== null)
  if (intents.length === 0) return null
  return {
    domain: item.domain || item.url,
    intents,
    tags: item.topicContexts,
    isCertification: Object.keys(item.intentionVaults).length > 0,
  }
}

/** Build the prop bag consumed by the presentational <GroupBentoCard>. */
function toCardProps(g: IntentionGroupWithStats) {
  const xp = calculateLevelProgress(g.certifiedCount, g.level)
  const dots: CertificationDot[] = (
    Object.entries(g.certificationBreakdown) as [IntentionType, number | undefined][]
  )
    .filter(([, c]) => (c ?? 0) > 0)
    .map(([type]) => ({
      key: type,
      color: CERTIFICATION_COLORS[type],
      title: type,
    }))
  return {
    domain: g.domain,
    faviconSrc: getFaviconUrl(g.domain),
    currentPredicate: g.currentPredicate,
    activeUrlCount: g.activeUrlCount,
    certifiedCount: g.certifiedCount,
    timeLabel: formatDuration(g.totalAttentionTime),
    level: g.level,
    levelColor: getLevelColor(g.level),
    levelColorAlpha: getLevelColorAlpha(g.level),
    progressPercent: xp.progressPercent,
    progressLabel:
      xp.xpToNextLevel > 0
        ? `${xp.xpToNextLevel} cert${xp.xpToNextLevel > 1 ? 's' : ''} to LVL ${g.level + 1}`
        : 'Max level!',
    dominantColor: pickDominantColor(g),
    certificationDots: dots,
    canLevelUp: g.level > 1 && g.certifiedCount > 0,
  }
}

export default function LastActivitySection({ items, loading }: LastActivitySectionProps) {
  const activities = useMemo<IntentionActivityInput[]>(() => {
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
            <GroupBentoCard key={g.id} {...toCardProps(g)} />
          ))}
        </div>
      </div>
    </div>
  )
}
