/**
 * FeedCard — explore/home feed item. Thin mapper from `CircleItem` onto the
 * shared <FeedCardView> (Claude Design "Feed Card" handoff): header
 * (avatar + handle + time), preview media, title, and a footer with
 * support/oppose thumbs + intent verb chips.
 */
import type { CircleItem } from '@/services/circleService'
import { INTENTION_COLORS } from '@/config/intentions'
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
  // A like/dislike stakes the cert's "in context of <topic>" nested
  // triples — NOT the per-verb vaults — so one click = one position on the
  // topic context(s), no verb picker. Counts + the lit state aggregate
  // across those context triples. No context tag → nothing to stake, so the
  // thumbs render disabled (with a tooltip) rather than fanning out across
  // every verb vault.
  let supports = 0
  let opposes = 0
  let userSupported = false
  let userOpposed = false
  for (const c of item.contextTriples) {
    supports += c.supportCount
    opposes += c.opposeCount
    if (c.userSupported) userSupported = true
    if (c.userOpposed) userOpposed = true
  }
  const canSupport = item.contextTriples.some((c) => c.termId)
  const canOppose = item.contextTriples.some((c) => c.counterTermId)

  // Queued-in-cart state — a like/dislike goes to the cart first and settles
  // on-chain at batch submit. Mark the matching thumb as pending (dashed green)
  // so the click gives immediate feedback while the tx is still unconfirmed.
  const { items: cartItems } = useCart()
  const pendingUp = item.contextTriples.some(
    (c) =>
      c.termId &&
      cartItems.some((ci) => ci.termId === c.termId && ci.side === 'support'),
  )
  const pendingDown = item.contextTriples.some(
    (c) =>
      c.counterTermId &&
      cartItems.some(
        (ci) => ci.termId === c.counterTermId && ci.side === 'oppose',
      ),
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

  // The "in context of" subject is a cert triple term_id; a cert can hold
  // several (one per intention vault). Pick the first deterministically so the
  // cart dedupe id is stable across re-renders.
  const certTermId = Object.values(item.intentionVaults)
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
