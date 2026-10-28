/**
 * FeedCard — explore/home feed item. Thin mapper from `CircleItem` onto the
 * shared <FeedCardView> (Claude Design "Feed Card" handoff): header
 * (avatar + handle + time), preview media, title, and a footer with
 * support/oppose thumbs + intent verb chips.
 */
import type { CircleItem } from '@/services/circleService'
import { INTENTION_COLORS, INTENTION_CONFIG } from '@/config/intentions'
import { SOFIA_TOPICS } from '@/config/taxonomy'
import { timeAgo } from '@/utils/formatting'
import FeedCardView, {
  type FeedCardVerb,
  type FeedCardTopic,
  type FeedCardSize,
} from '@/components/feed/FeedCardView'
import ContextPicker from '@/components/ContextPicker'
import { categoryPills } from '@/config/contextNodes'
import { getIntentionIconByLabel } from '@/config/intentionIcons'
import { useCart } from '@/hooks/useCart'
import '@/components/styles/feed-card.css'

interface FeedCardProps {
  item: CircleItem
  displayName: string
  avatar: string
  isPrivate?: boolean
  /** Whether this cert is the viewer's own. The "+ Context" tagging CTA shows
   *  only on your own Marks; on others' you only get the like/dislike thumbs. */
  isOwner?: boolean
  /** Card size — Activity uses 'md' for a uniform medium grid; default 'lg'. */
  size?: FeedCardSize
  onDeposit?: (side: 'support' | 'oppose', item: CircleItem) => void
}

export default function FeedCard({
  item,
  displayName,
  avatar,
  isPrivate,
  isOwner = false,
  size,
  onDeposit,
}: FeedCardProps) {
  // 👍 / 👎 = the page's one market (its Recommend claim), on any card that
  // points to a page — see pageMarketCartService
  const market = item.intentionVaults[INTENTION_CONFIG.trusted.label]
  const supports = market?.supportCount ?? 0
  const opposes = market?.opposeCount ?? 0
  const userSupported = !!market?.userSupported
  const userOpposed = !!market?.userOpposed
  const canSupport = !!item.objectTermId
  const canOppose = !!market?.counterTermId

  // Queued in the cart: the thumb shows pending until the batch is signed
  const { items: cartItems } = useCart()
  const pendingUp = cartItems.some(
    (ci) => ci.side === 'support' && ci.id === `recommend:${item.objectTermId}`,
  )
  const pendingDown = cartItems.some(
    (ci) =>
      ci.side === 'oppose' &&
      !!market?.counterTermId &&
      ci.termId.toLowerCase() === market.counterTermId.toLowerCase(),
  )

  const verbs: FeedCardVerb[] = item.intentions.map((label) => {
    const Icon = getIntentionIconByLabel(label)
    return {
      label,
      color: INTENTION_COLORS[label],
      icon: Icon ? <Icon className="fc-verb-ic" /> : undefined,
    }
  })

  const topics: FeedCardTopic[] = [
    ...(item.topicContexts ?? []).map((slug) => {
      const meta = SOFIA_TOPICS.find((t) => t.id === slug)
      return { id: slug, label: meta?.label ?? slug, color: meta?.color }
    }),
    ...categoryPills(item.categorySlugs ?? []),
  ]

  // The "in context of" subject is a cert triple term_id; a page can hold
  // several (the Recommend + legacy claims). Tags go on the Recommend (the
  // page market); else the first one, deterministically, so the cart dedupe
  // id is stable across re-renders.
  const certTermId =
    item.intentionVaults[INTENTION_CONFIG.trusted.label]?.termId ||
    Object.values(item.intentionVaults)
      .map((v) => v.termId)
      .filter(Boolean)
      .sort()[0]

  return (
    <FeedCardView
      size={size}
      handle={isPrivate ? 'Someone' : displayName}
      avatarUrl={isPrivate ? undefined : avatar || undefined}
      when={timeAgo(item.timestamp)}
      title={item.title}
      url={item.url}
      domain={item.domain}
      verbs={verbs}
      topics={topics}
      up={supports}
      down={opposes}
      userUp={userSupported}
      userDown={userOpposed}
      pendingUp={pendingUp}
      pendingDown={pendingDown}
      canUp={canSupport}
      canDown={canOppose}
      onVote={onDeposit ? (side) => onDeposit(side, item) : undefined}
      onOpen={() => {
        if (item.url) window.open(item.url, '_blank', 'noopener,noreferrer')
      }}
      addContextSlot={
        isOwner ? (
          <ContextPicker
            certTermId={certTermId}
            certTitle={item.title || item.domain}
            certFavicon={item.favicon}
            existingTopics={[
              ...(item.topicContexts ?? []),
              ...(item.categorySlugs ?? []),
            ]}
          />
        ) : undefined
      }
    />
  )
}
