/**
 * CircleFeedCard — circle feed item. Thin mapper from `CircleItem` onto the
 * shared <FeedCardView> (Claude Design "Feed Card" handoff): header
 * (certifier avatar + handle + time + stars), preview media, title, footer
 * with support/oppose thumbs + intent verb chips.
 *
 * Stars come from the circle's personalized-trust score to the certifier
 * (MCP) when available, otherwise the local support-count heuristic.
 * Support / oppose counts are summed across all intention vaults.
 */
import { useNavigate } from 'react-router-dom'
import type { CircleItem } from '@/services/circleService'
import { computeStars, computeStarsFromTrust } from '@/services/circleFeedSort'
import { INTENTION_COLORS } from '@/config/intentions'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { extractDomain, timeAgo } from '@/utils/formatting'
import FeedCardView, {
  type FeedCardVerb,
  type FeedCardTopic,
} from '@/components/feed/FeedCardView'
import '@/components/styles/feed-card.css'

interface CircleFeedCardProps {
  item: CircleItem
  /** Display name + avatar of the certifier, resolved via `useEnsNames`. */
  certifierName: string
  certifierAvatar: string
  /**
   * Fires when the user clicks support/oppose. The parent owns the cart
   * and the optional PredicatePicker for items with multiple intentions.
   * When omitted, the thumbs render as display-only (no click handler).
   */
  onDeposit?: (side: 'support' | 'oppose', item: CircleItem) => void
  /**
   * Live set of term_ids the user has shares > 0 on, sourced from the
   * realtime positions cache. Unioned with the per-vault `userSupported`
   * / `userOpposed` flags so the thumb state updates instantly.
   */
  livePositionTermIds?: ReadonlySet<string>
  /**
   * Personalized-trust score from the circle's anchors to this item's
   * certifier. When > 0, the star rating buckets this MCP score instead
   * of the local support-count heuristic.
   */
  mcpScore?: number
}

export default function CircleFeedCard({
  item,
  certifierName,
  certifierAvatar,
  onDeposit,
  livePositionTermIds,
  mcpScore,
}: CircleFeedCardProps) {
  const navigate = useNavigate()
  const { topicById } = useTaxonomy()
  const host = item.domain || (item.url ? extractDomain(item.url) : '')

  const verbs: FeedCardVerb[] = item.intentions
    .filter((l) => !l.startsWith('quest:'))
    .slice(0, 2)
    .map((label) => ({ label, color: INTENTION_COLORS[label] }))

  const topics: FeedCardTopic[] = item.topicContexts
    .map((id) => {
      const t = topicById(id)
      return t ? { id, label: t.label, color: t.color } : null
    })
    .filter((t): t is NonNullable<typeof t> => t !== null)
    .slice(0, 2)

  // Aggregated position counts and user state across all intention vaults.
  // User state is the UNION of the feed-payload snapshot and the live
  // realtime positions set so a fresh deposit lights the thumb immediately.
  let supports = 0
  let opposes = 0
  let userSupported = false
  let userOpposed = false
  for (const v of Object.values(item.intentionVaults)) {
    supports += v.supportCount
    opposes += v.opposeCount
    if (v.userSupported || livePositionTermIds?.has(v.termId)) {
      userSupported = true
    }
    if (v.userOpposed || livePositionTermIds?.has(v.counterTermId)) {
      userOpposed = true
    }
  }
  const stars =
    mcpScore !== undefined && mcpScore > 0
      ? computeStarsFromTrust(mcpScore)
      : computeStars(supports)

  const canSupport = Object.values(item.intentionVaults).some((v) => v.termId)
  const canOppose = Object.values(item.intentionVaults).some(
    (v) => v.counterTermId,
  )

  // The whole card opens the URL, so the certifier handle can't be a nested
  // <a>. Render it as a click-to-navigate span that stops propagation.
  const handleSlot = item.certifierAddress ? (
    <span
      className="fc-handle-link"
      role="link"
      tabIndex={0}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        navigate(`/profile/${item.certifierAddress}`)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          e.stopPropagation()
          navigate(`/profile/${item.certifierAddress}`)
        }
      }}
    >
      {certifierName}
    </span>
  ) : undefined

  return (
    <FeedCardView
      handle={certifierName}
      avatarUrl={certifierAvatar || undefined}
      handleSlot={handleSlot}
      when={timeAgo(item.timestamp)}
      rating={stars}
      title={item.title || host}
      url={item.url}
      domain={host}
      verbs={verbs}
      topics={topics}
      up={supports}
      down={opposes}
      userUp={userSupported}
      userDown={userOpposed}
      canUp={canSupport}
      canDown={canOppose}
      onVote={onDeposit ? (side) => onDeposit(side, item) : undefined}
      onOpen={() => {
        if (item.url && item.url.startsWith('http')) {
          window.open(item.url, '_blank', 'noopener,noreferrer')
        }
      }}
    />
  )
}
