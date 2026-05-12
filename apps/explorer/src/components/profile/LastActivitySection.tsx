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
  /** When true (default), each card links to `/profile/platform/:domain`. */
  linkable?: boolean
  /** When provided, the link gains `?address=:viewedAddress` so the
   *  platform detail page renders for THAT wallet instead of the
   *  connected user. Public profile pages pass this through; the
   *  personal profile leaves it `undefined`. */
  viewedAddress?: string
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
    // The italic predicate line was noise — every cert on a card
    // already exposes its intention through the colored cert dots.
    currentPredicate: null,
    activeUrlCount: g.activeUrlCount,
    certifiedCount: g.certifiedCount,
    // Attention time isn't measurable here (no extension context),
    // so we skip the "0s" stat entirely.
    timeLabel: '',
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
  viewedAddress,
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
          {groups.map((g) => {
            if (!linkable) {
              return <GroupBentoCard key={g.id} {...toCardProps(g)} />
            }
            const base = `/profile/platform/${encodeURIComponent(g.domain)}`
            const href = viewedAddress
              ? `${base}?address=${viewedAddress}`
              : base
            return (
              <Link key={g.id} to={href} className="echoes-card-link">
                <GroupBentoCard {...toCardProps(g)} />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
