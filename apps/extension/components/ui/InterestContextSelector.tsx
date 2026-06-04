import { memo, useMemo } from "react"

import {
  CATEGORY_BY_ID,
  CATEGORY_TO_TOPIC,
  getCategoriesForTopic,
} from "@0xsofia/taxonomy"

import {
  TOPIC_ATOM_IDS,
  TOPIC_COLORS,
  TOPIC_ICON,
  TOPIC_LABELS,
} from "~/lib/config/topicConfig"

import FilterDropdown, { type FilterOption } from "./FilterDropdown"

interface InterestContextSelectorProps {
  /** The chosen context slug — a TOPIC slug or a CATEGORY slug. */
  selectedContext: string | null
  onSelectContext: (slug: string | null) => void
  disabled?: boolean
  /** Topics already attached as on-chain context — reserved for a future
   *  per-option done marker. */
  certifiedContexts?: string[]
}

/** Parent topic of a context slug (the slug itself when it is a topic). */
function topicOf(slug: string | null): string | null {
  if (!slug) return null
  if (TOPIC_ATOM_IDS[slug]) return slug
  return CATEGORY_TO_TOPIC[slug] ?? null
}

/**
 * Two-step context picker for the Mark page: pick a TOPIC, then optionally
 * drill into one of its CATEGORIES for a sharper tag. A category scores under
 * its parent topic (rollup), so this fits the single-context model — the
 * chosen slug (topic or category) flows straight into `interestContext`.
 */
export const InterestContextSelector = memo(
  ({
    selectedContext,
    onSelectContext,
    disabled = false,
  }: InterestContextSelectorProps) => {
    const topicSlug = topicOf(selectedContext)
    // selectedContext is a category only when it resolves in CATEGORY_BY_ID.
    const categorySlug =
      selectedContext && CATEGORY_BY_ID.get(selectedContext)
        ? selectedContext
        : null

    const topicOptions = useMemo<FilterOption[]>(
      () =>
        Object.keys(TOPIC_ATOM_IDS).map((slug) => ({
          id: slug,
          label: TOPIC_LABELS[slug] ?? slug,
          color: TOPIC_COLORS[slug] ?? "#888888",
          icon: TOPIC_ICON[slug],
        })),
      [],
    )

    // Categories of the selected topic — borrow the topic's color + glyph so
    // they read as part of that topic family.
    const categoryOptions = useMemo<FilterOption[]>(() => {
      if (!topicSlug) return []
      return getCategoriesForTopic(topicSlug).map((c) => ({
        id: c.id,
        label: c.label,
        color: TOPIC_COLORS[topicSlug] ?? "#888888",
        icon: TOPIC_ICON[topicSlug],
      }))
    }, [topicSlug])

    const body = (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <FilterDropdown
          label="In context of"
          value={topicSlug ?? "all"}
          // Picking a topic selects the whole topic (and resets any category).
          onChange={(id) => onSelectContext(id === "all" ? null : id)}
          options={topicOptions}
          placeholder="Choose"
          wide
        />
        {topicSlug && categoryOptions.length > 0 && (
          <FilterDropdown
            label="Category"
            // "All" here means "the whole topic" (no category narrowing).
            value={categorySlug ?? "all"}
            onChange={(id) =>
              onSelectContext(id === "all" ? topicSlug : id)
            }
            options={categoryOptions}
            wide
          />
        )}
      </div>
    )

    if (disabled) {
      return (
        <div style={{ opacity: 0.55, pointerEvents: "none" }}>{body}</div>
      )
    }
    return body
  },
)

export default InterestContextSelector
