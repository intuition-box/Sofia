/**
 * TopicIcon — a topic's Material Symbol (the design-system / taxonomy glyph via
 * getTopicIcon), replacing emoji as topic icons. Requires the Material Symbols
 * Outlined font (index.html) + `.material-symbols-outlined` base (global.css).
 * Inherits `color` and `font-size` from context (or pass `size`).
 */
import { CATEGORY_MAP } from '../data/topics'

interface TopicIconProps {
  id: string
  size?: number
}

export function TopicIcon({ id, size }: TopicIconProps) {
  const cat = CATEGORY_MAP[id]
  if (!cat) return null
  return (
    <span
      className="topic-ms material-symbols-outlined"
      style={size ? { fontSize: size } : undefined}
      aria-hidden="true"
    >
      {cat.icon}
    </span>
  )
}
