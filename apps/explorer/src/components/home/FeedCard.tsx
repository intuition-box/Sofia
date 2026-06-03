/**
 * FeedCard — explore/home feed item. Thin mapper from `CircleItem` onto the
 * shared <FeedCardView> (Claude Design "Feed Card" handoff): header
 * (avatar + handle + time + stars), preview media, title, and a footer with
 * support/oppose thumbs + intent verb chips.
 *
 * Stars here are derived from the support count (same fallback heuristic the
 * circle card uses when no MCP trust score is available) so the explore feed
 * and the circle feed read identically.
 */
import type { CircleItem } from '@/services/circleService'
import { computeStars } from '@/services/circleFeedSort'
import { INTENTION_COLORS } from '@/config/intentions'
import { SOFIA_TOPICS } from '@/config/taxonomy'
import { timeAgo } from '@/utils/formatting'
import FeedCardView, {
  type FeedCardVerb,
  type FeedCardTopic,
} from '@/components/feed/FeedCardView'
import '@/components/styles/feed-card.css'

interface FeedCardProps {
  item: CircleItem
  displayName: string
  avatar: string
  isPrivate?: boolean
  onDeposit?: (side: 'support' | 'oppose', item: CircleItem) => void
}

export default function FeedCard({
  item,
  displayName,
  avatar,
  isPrivate,
  onDeposit,
}: FeedCardProps) {
  // Aggregate position counts + the viewer's own stake across every
  // intention vault — same rule as CircleFeedCard. `userSupported` /
  // `userOpposed` come from the feed payload so a thumb the user has
  // staked on stays lit across reloads.
  let supports = 0
  let opposes = 0
  let userSupported = false
  let userOpposed = false
  for (const v of Object.values(item.intentionVaults)) {
    supports += v.supportCount
    opposes += v.opposeCount
    if (v.userSupported) userSupported = true
    if (v.userOpposed) userOpposed = true
  }
  const canSupport = Object.values(item.intentionVaults).some((v) => v.termId)
  const canOppose = Object.values(item.intentionVaults).some(
    (v) => v.counterTermId,
  )

  const verbs: FeedCardVerb[] = item.intentions.map((label) => ({
    label,
    color: INTENTION_COLORS[label],
  }))

  const topics: FeedCardTopic[] = (item.topicContexts ?? [])
    .slice(0, 2)
    .map((slug) => {
      const meta = SOFIA_TOPICS.find((t) => t.id === slug)
      return { id: slug, label: meta?.label ?? slug }
    })

  return (
    <FeedCardView
      handle={isPrivate ? 'Someone' : displayName}
      avatarUrl={isPrivate ? undefined : avatar || undefined}
      when={timeAgo(item.timestamp)}
      rating={computeStars(supports)}
      title={item.title}
      url={item.url}
      domain={item.domain}
      verbs={verbs}
      topics={topics}
      up={supports}
      down={opposes}
      userUp={userSupported}
      userDown={userOpposed}
      canUp={canSupport}
      canDown={canOppose}
      onVote={
        onDeposit ? (side) => onDeposit(side, item) : undefined
      }
      onOpen={() => {
        if (item.url) window.open(item.url, '_blank', 'noopener,noreferrer')
      }}
    />
  )
}
