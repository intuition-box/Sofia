import { Link } from 'react-router-dom'
import {
  GroupBentoCard,
  type CertificationDot,
  formatDuration,
} from '@0xsofia/design-system'
import { CERTIFICATION_COLORS, type IntentionType } from '@/config/intentions'
import {
  useIntentionGroups,
  pickDominantColor,
  type IntentionActivityInput,
  type IntentionGroupWithStats,
} from '@/hooks/useIntentionGroups'
import { calculateLevelProgress } from '@/lib/level/calculation'
import { getLevelColor, getLevelColorAlpha } from '@/lib/level/colors'
import { getFaviconUrl } from '@/utils/favicon'
import { ActivityCardSkeleton } from './ProfileSkeletons'

interface LastActivitySectionProps {
  /** Pre-built activity inputs — caller derives them from the master profile. */
  activities: IntentionActivityInput[]
  loading: boolean
  /** Sort strategy — defaults to `platform`. Proto offers `platform | verb | topic`. */
  sort?: 'platform' | 'verb' | 'topic'
  /** When true (default), each card links to `/profile/platform/:domain`.
   *  Disable on public-profile views — that detail page is owner-only. */
  linkable?: boolean
}

/** Build the prop bag consumed by the presentational <GroupBentoCard>. */
function toCardProps(g: IntentionGroupWithStats) {
  const xp = calculateLevelProgress(g.certifiedCount, g.level)
  const dots: CertificationDot[] = (
    Object.entries(g.certificationBreakdown) as [
      IntentionType,
      number | undefined,
    ][]
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
  }
}

export default function LastActivitySection({
  activities,
  loading,
  sort = 'platform',
  linkable = true,
}: LastActivitySectionProps) {
  const groups = useIntentionGroups(activities, { sort })

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
          {groups.map((g) =>
            linkable ? (
              <Link
                key={g.id}
                to={`/profile/platform/${encodeURIComponent(g.domain)}`}
                className="echoes-card-link"
              >
                <GroupBentoCard {...toCardProps(g)} />
              </Link>
            ) : (
              <GroupBentoCard key={g.id} {...toCardProps(g)} />
            ),
          )}
        </div>
      </div>
    </div>
  )
}
