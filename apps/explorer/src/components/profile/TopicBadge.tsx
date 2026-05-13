/**
 * TopicBadge — a small coloured disc with the topic's emoji inside.
 *
 * Reusable visual primitive: same silhouette in the Context Manager
 * popover, the ProfileDrawer score legend, the Interests grid, etc.
 * Keeps the rendering rule in one place so any future tweak
 * (size, emoji fallback, ring on hover) propagates everywhere.
 */
import { getTopicEmoji } from '@/config/topicEmoji'

interface TopicBadgeProps {
  /** Topic slug — used to resolve the emoji + as a stable test hook. */
  topicId: string
  /** Background colour of the disc. Usually the topic's color from
   *  the taxonomy; pass `var(--ds-muted)` when no colour is known. */
  color: string
  /** Pixel size of the disc. Defaults to 22 — matches the Context
   *  Manager popover. Bump up for hero badges. */
  size?: number
  /** Optional className appended to the root so callers can tweak
   *  margins without leaking colour rules. */
  className?: string
  /** Hover tooltip — defaults to the topic id. */
  title?: string
}

export default function TopicBadge({
  topicId,
  color,
  size = 22,
  className,
  title,
}: TopicBadgeProps) {
  const emoji = getTopicEmoji(topicId) || '📌'
  return (
    <span
      className={`topic-badge${className ? ` ${className}` : ''}`}
      style={{
        background: color,
        width: size,
        height: size,
        fontSize: Math.round(size * 0.5),
      }}
      title={title ?? topicId}
      aria-hidden="true"
    >
      {emoji}
    </span>
  )
}
