/**
 * contextDisplay — resolve a context slug (a TOPIC slug OR a CATEGORY slug)
 * to its display label + color. A category borrows its parent topic's color
 * so it reads as part of that topic family. Use this everywhere the extension
 * renders an `interestContext` pill so category tags display correctly.
 * Intention tags (`intent:work`) read "For work" in the intention's color.
 */
import {
  CATEGORY_BY_ID,
  CATEGORY_TO_TOPIC,
  intentionTagBySlug
} from "@0xsofia/taxonomy"

import { INTENTION_CONFIG, type IntentionType } from "../../types/intentionCategories"
import { getTopicIcon, TOPIC_COLORS, TOPIC_LABELS } from "./topicConfig"

/** Material Symbols glyph per intention tag (same set as the explorer radar) */
const INTENT_ICON: Record<string, string> = {
  work: "work",
  learning: "school",
  fun: "sports_esports",
  inspiration: "auto_awesome",
  buying: "shopping_bag",
  music: "headphones"
}

/** Intention tag (`intent:work`) → its verb type, else null */
const intentType = (slug: string): IntentionType | null => {
  const tag = intentionTagBySlug(slug)
  return tag ? (tag.key as IntentionType) : null
}

/** Display label for a context slug, or null if it's neither a known topic
 *  nor a known category. */
export function contextLabel(slug: string): string | null {
  const intent = intentType(slug)
  if (intent) return `For ${INTENTION_CONFIG[intent].label.toLowerCase()}`
  return TOPIC_LABELS[slug] ?? CATEGORY_BY_ID.get(slug)?.label ?? null
}

/** Display color for a context slug — the topic color, or the parent topic's
 *  color for a category. */
export function contextColor(slug: string): string {
  const intent = intentType(slug)
  if (intent) return INTENTION_CONFIG[intent].color
  return (
    TOPIC_COLORS[slug] ??
    TOPIC_COLORS[CATEGORY_TO_TOPIC[slug] ?? ""] ??
    "var(--ds-accent)"
  )
}

/** Material Symbols glyph name for a context slug — the topic's icon, or the
 *  parent topic's icon for a category (so a category pill carries its family's
 *  pictogram, matching the explorer's TopicPill). */
export function contextIcon(slug: string): string {
  const intent = intentType(slug)
  if (intent) return INTENT_ICON[intent] ?? "label"
  return getTopicIcon(TOPIC_COLORS[slug] ? slug : (CATEGORY_TO_TOPIC[slug] ?? slug))
}
