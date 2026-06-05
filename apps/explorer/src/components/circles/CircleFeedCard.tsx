/**
 * CircleFeedCard — circle feed item. Thin mapper from `CircleItem` onto the
 * shared <FeedCardView> (Claude Design "Feed Card" handoff): header
 * (certifier avatar + handle + time), preview media, title, footer
 * with support/oppose thumbs + intent verb chips.
 *
 * Support / oppose counts are summed across all intention vaults.
 */
import { useNavigate } from 'react-router-dom'
import type { CircleItem } from '@/services/circleService'
import { INTENTION_COLORS } from '@/config/intentions'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { extractDomain, timeAgo } from '@/utils/formatting'
import FeedCardView, {
  type FeedCardVerb,
  type FeedCardTopic,
} from '@/components/feed/FeedCardView'
import ContextPicker from '@/components/ContextPicker'
import { categoryPills } from '@/config/contextNodes'
import '@/components/styles/feed-card.css'

interface CircleFeedCardProps {
  item: CircleItem
  /** Display name + avatar of the certifier, resolved via `useEnsNames`. */
  certifierName: string
  certifierAvatar: string
  /**
   * Fires when the user clicks like/dislike. The parent stakes the cert's
   * topic-context triples (no verb picker). When omitted, the thumbs render
   * as display-only (no click handler).
   */
  onDeposit?: (side: 'support' | 'oppose', item: CircleItem) => void
  /**
   * Live set of term_ids the user has shares > 0 on, sourced from the
   * realtime positions cache. Unioned with the per-vault `userSupported`
   * / `userOpposed` flags so the thumb state updates instantly.
   */
  livePositionTermIds?: ReadonlySet<string>
}

export default function CircleFeedCard({
  item,
  certifierName,
  certifierAvatar,
  onDeposit,
  livePositionTermIds,
}: CircleFeedCardProps) {
  const navigate = useNavigate()
  const { topicById } = useTaxonomy()
  const host = item.domain || (item.url ? extractDomain(item.url) : '')

  const verbs: FeedCardVerb[] = item.intentions
    .filter((l) => !l.startsWith('quest:'))
    .slice(0, 2)
    .map((label) => ({ label, color: INTENTION_COLORS[label] }))

  const topics: FeedCardTopic[] = [
    ...item.topicContexts
      .map((id) => {
        const t = topicById(id)
        return t ? { id, label: t.label, color: t.color } : null
      })
      .filter((t): t is NonNullable<typeof t> => t !== null),
    ...categoryPills(item.categorySlugs ?? []),
  ]

  // A like/dislike stakes the cert's "in context of <topic>" nested triples
  // (one click = one position on the topic context, no verb picker), so the
  // counts + lit state aggregate across those — not the per-verb vaults.
  // User state is the UNION of the feed-payload snapshot and the live
  // realtime positions set so a fresh deposit lights the thumb immediately.
  let supports = 0
  let opposes = 0
  let userSupported = false
  let userOpposed = false
  for (const c of item.contextTriples) {
    supports += c.supportCount
    opposes += c.opposeCount
    if (c.userSupported || livePositionTermIds?.has(c.termId)) {
      userSupported = true
    }
    if (c.userOpposed || livePositionTermIds?.has(c.counterTermId)) {
      userOpposed = true
    }
  }
  const canSupport = item.contextTriples.some((c) => c.termId)
  const canOppose = item.contextTriples.some((c) => c.counterTermId)

  // Subject for a new "in context of" triple — the cert triple term_id. A
  // cert can hold several (one per intention vault); pick the first
  // deterministically so the cart dedupe id stays stable.
  const certTermId = Object.values(item.intentionVaults)
    .map((v) => v.termId)
    .filter(Boolean)
    .sort()[0]

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
      addContextSlot={
        <ContextPicker
          certTermId={certTermId}
          certTitle={item.title || host}
          certFavicon={item.favicon}
          existingTopics={[
            ...item.topicContexts,
            ...(item.categorySlugs ?? []),
          ]}
        />
      }
    />
  )
}
