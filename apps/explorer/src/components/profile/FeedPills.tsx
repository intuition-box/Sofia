/**
 * FeedPills — thin wrappers over the shared design-system pills so every feed
 * surface (circle, explore/home, profile Echoes, the ProfileDrawer activity
 * rows and the public-profile rail) renders the ONE canonical pill. The DS
 * owns the look (verb-tag.css / topic-pill.css); these wrappers keep the
 * explorer's ergonomic API — resolving the icon/glyph from the app taxonomy —
 * and delegate rendering. Previously each pill had its own `.sf-*-pill` CSS.
 *
 * Visual contract (design-system):
 *   - VerbPill  : outlined — intent-colored text + border + icon, no fill.
 *   - TopicPill : filled disc — black glyph + label on the topic color.
 */
import { TopicPill as DSTopicPill } from '@0xsofia/design-system'
import type { CSSProperties } from 'react'

import { getIntentionIconByLabel } from '@/config/intentionIcons'
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

/** A topic rendered as a colored disc (black glyph + label), via the shared DS
 *  <TopicPill>. The glyph name is resolved from the explorer taxonomy. */
export function TopicPill({ topicId, color, label, iconOnly }: TopicPillProps) {
  return (
    <DSTopicPill
      color={color}
      label={label}
      glyph={getTopicIcon(topicId)}
      iconOnly={iconOnly}
    />
  )
}

interface VerbPillProps {
  label: string
  /** Intent color (design-system INTENTION_COLORS) — drives the text +
   *  border + icon. Undefined → neutral. */
  color?: string
}

/** A verb/intention rendered as an outlined pill (intent-colored text + border
 *  + icon, transparent fill) via the canonical DS `.fc-verb-tag`, colour-driven
 *  through `--vc` so no intent slug is needed. */
export function VerbPill({ label, color }: VerbPillProps) {
  const Icon = getIntentionIconByLabel(label)
  return (
    <span
      className="fc-verb-tag"
      style={color ? ({ ['--vc']: color } as CSSProperties) : undefined}
    >
      {Icon ? <Icon className="fc-verb-ic" aria-hidden="true" /> : null}
      {label}
    </span>
  )
}
