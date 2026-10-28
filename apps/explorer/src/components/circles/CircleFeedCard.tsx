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
import { INTENTION_COLORS, INTENTION_CONFIG } from '@/config/intentions'
import { getIntentionIconByLabel } from '@/config/intentionIcons'
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
   * Whether this cert belongs to the viewer. The "+ Context" tagging CTA is
   * shown only on your own Marks; on someone else's claim you can only back it
   * (the like/dislike thumbs). Defaults to false (others' cards).
   */
  isOwner?: boolean
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
  isOwner = false,
  livePositionTermIds,
}: CircleFeedCardProps) {
  const navigate = useNavigate()
  const { topicById } = useTaxonomy()
  const host = item.domain || (item.url ? extractDomain(item.url) : '')

  const verbs: FeedCardVerb[] = item.intentions
    .filter((l) => !l.startsWith('quest:'))
    .slice(0, 2)
    .map((label) => {
      const Icon = getIntentionIconByLabel(label)
      return {
        label,
        color: INTENTION_COLORS[label],
        icon: Icon ? <Icon className="fc-verb-ic" /> : undefined,
      }
    })

  const topics: FeedCardTopic[] = [
    ...item.topicContexts
      .map((id) => {
        const t = topicById(id)
        return t ? { id, label: t.label, color: t.color } : null
      })
      .filter((t): t is NonNullable<typeof t> => t !== null),
    ...categoryPills(item.categorySlugs ?? []),
  ]

  // 👍 / 👎 = the page's one market (its Recommend claim) — see
  // pageMarketCartService. User state is the UNION of the feed snapshot and
  // the live realtime positions, so a fresh deposit lights the thumb at once.
  const market = item.intentionVaults[INTENTION_CONFIG.trusted.label]
  const supports = market?.supportCount ?? 0
  const opposes = market?.opposeCount ?? 0
  const userSupported =
    !!market?.userSupported || !!livePositionTermIds?.has(market?.termId ?? '')
  const userOpposed =
    !!market?.userOpposed ||
    !!livePositionTermIds?.has(market?.counterTermId ?? '')
  const canSupport = !!item.objectTermId
  const canOppose = !!market?.counterTermId

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
        isOwner ? (
          <ContextPicker
            certTermId={certTermId}
            certTitle={item.title || host}
            certFavicon={item.favicon}
            existingTopics={[
              ...item.topicContexts,
              ...(item.categorySlugs ?? []),
            ]}
          />
        ) : undefined
      }
    />
  )
}
