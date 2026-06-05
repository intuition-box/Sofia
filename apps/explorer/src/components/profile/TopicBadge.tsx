/**
 * TopicBadge — a small coloured disc with a monochrome Material
 * Symbols glyph inside.
 *
 * Reusable visual primitive: same silhouette in the Context Manager
 * popover, the ProfileDrawer score legend, the Interests grid, etc.
 * Keeps the rendering rule in one place so any future tweak
 * (size, icon fallback, ring on hover) propagates everywhere.
 *
 * Uses the Google Material Symbols Outlined webfont (loaded in
 * `index.html`). The glyph name comes from `getTopicIcon(slug)`.
 */
import { getTopicIcon } from '@/config/topicEmoji'
import '@/components/styles/profile-sections.css'

interface TopicBadgeProps {
  /** Topic slug — used to resolve the icon + as a stable test hook. */
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
  const icon = getTopicIcon(topicId)
  // Glyph fills ~60% of the disc — same optical weight as the old
  // emoji rendering, but the icon is a stroked monochrome so we land
  // on the navbar's lucide visual family.
  const glyphSize = Math.round(size * 0.6)
  return (
    <span
      className={`topic-badge${className ? ` ${className}` : ''}`}
      style={{
        background: color,
        width: size,
        height: size,
      }}
      title={title ?? topicId}
      aria-hidden="true"
    >
      <span
        className="material-symbols-outlined topic-badge-glyph"
        style={{ fontSize: glyphSize }}
      >
        {icon}
      </span>
    </span>
  )
}
