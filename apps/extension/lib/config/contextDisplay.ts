/**
 * contextDisplay — resolve a context slug (a TOPIC slug OR a CATEGORY slug)
 * to its display label + color. A category borrows its parent topic's color
 * so it reads as part of that topic family. Use this everywhere the extension
 * renders an `interestContext` pill so category tags display correctly.
 */
import { CATEGORY_BY_ID, CATEGORY_TO_TOPIC } from "@0xsofia/taxonomy"

import { TOPIC_COLORS, TOPIC_LABELS } from "./topicConfig"

/** Display label for a context slug, or null if it's neither a known topic
 *  nor a known category. */
export function contextLabel(slug: string): string | null {
  return TOPIC_LABELS[slug] ?? CATEGORY_BY_ID.get(slug)?.label ?? null
}

/** Display color for a context slug — the topic color, or the parent topic's
 *  color for a category. */
export function contextColor(slug: string): string {
  return (
    TOPIC_COLORS[slug] ??
    TOPIC_COLORS[CATEGORY_TO_TOPIC[slug] ?? ""] ??
    "var(--ds-accent)"
  )
}
