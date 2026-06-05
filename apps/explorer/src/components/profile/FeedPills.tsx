/**
 * FeedPills — the ONE source of truth for the topic + verb pills shown
 * across every feed surface (circle, explore/home, profile Echoes, the
 * ProfileDrawer activity rows and the public-profile rail). Before this,
 * each surface re-styled its own `.fc-tag` / `.group-bento-tag` /
 * `.pd-la-topic` / `.ppa-topic` (and duplicate `.fc-verb-tag`) so the
 * same pill looked different depending on where you were.
 *
 * Visual contract (see styles/pills.css):
 *   - VerbPill  : solid intent-colored fill, black text.
 *   - TopicPill : black icon on the topic's color, border of that color.
 */
import { getTopicIcon } from '@/config/topicEmoji'

interface TopicPillProps {
  topicId: string
  /** Topic color from the taxonomy — drives the fill + border. */
  color: string
  label: string
  /** Render only the black glyph on the colored disc — drops the label.
   *  Used where space is tight (e.g. the ProfileDrawer activity rows). */
  iconOnly?: boolean
}

/** A topic rendered as a colored pill: black glyph on the topic color,
 *  border of the same color. With `iconOnly`, collapses to a colored disc
 *  carrying just the glyph (label still exposed via the tooltip/aria). */
export function TopicPill({ topicId, color, label, iconOnly }: TopicPillProps) {
  return (
    <span
      className={`sf-topic-pill${iconOnly ? ' sf-topic-pill--icon' : ''}`}
      style={{ ['--pill-color' as string]: color || 'var(--ds-accent)' }}
      title={iconOnly ? label : undefined}
      aria-label={iconOnly ? label : undefined}
    >
      <span
        className="material-symbols-outlined sf-topic-pill-glyph"
        aria-hidden="true"
      >
        {getTopicIcon(topicId)}
      </span>
      {iconOnly ? null : label}
    </span>
  )
}

interface VerbPillProps {
  label: string
  /** Intent color (design-system INTENTION_COLORS) — drives the text +
   *  border. Undefined → neutral. */
  color?: string
}

/** A verb/intention rendered as an outlined pill: text + border in the
 *  intent color, transparent fill. */
export function VerbPill({ label, color }: VerbPillProps) {
  return (
    <span
      className="sf-verb-pill"
      style={color ? { ['--pill-color' as string]: color } : undefined}
    >
      {label}
    </span>
  )
}
