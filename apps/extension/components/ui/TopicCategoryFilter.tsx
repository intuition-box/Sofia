/**
 * TopicCategoryFilter — a two-step filter (Topics dropdown → Category
 * dropdown) that yields ONE context slug: a topic slug, or a category slug
 * for a sharper filter. "all" = no filter. Reuses FilterDropdown so it matches
 * the other Mark/Echoes/Bookmark filters; the read side records both the
 * category slug and its parent topic, so the resulting slug matches either way.
 */
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

interface TopicCategoryFilterProps {
  /** "all" | topic slug | category slug */
  value: string
  onChange: (value: string) => void
}

export default function TopicCategoryFilter({
  value,
  onChange,
}: TopicCategoryFilterProps) {
  const topicSlug =
    value === "all"
      ? "all"
      : TOPIC_ATOM_IDS[value]
        ? value
        : (CATEGORY_TO_TOPIC[value] ?? "all")
  const categorySlug = value !== "all" && CATEGORY_BY_ID.get(value) ? value : "all"

  const topicOptions: FilterOption[] = Object.keys(TOPIC_ATOM_IDS).map(
    (slug) => ({
      id: slug,
      label: TOPIC_LABELS[slug] ?? slug,
      color: TOPIC_COLORS[slug] ?? "#888888",
      icon: TOPIC_ICON[slug],
    }),
  )

  const categoryOptions: FilterOption[] =
    topicSlug !== "all"
      ? getCategoriesForTopic(topicSlug).map((c) => ({
          id: c.id,
          label: c.label,
          color: TOPIC_COLORS[topicSlug] ?? "#888888",
          icon: TOPIC_ICON[topicSlug],
        }))
      : []

  return (
    <>
      <FilterDropdown
        label="Topics"
        value={topicSlug}
        // Picking a topic filters the whole topic (and clears any category).
        onChange={(id) => onChange(id)}
        options={topicOptions}
        wide
      />
      {topicSlug !== "all" && categoryOptions.length > 0 && (
        <FilterDropdown
          label="Category"
          // "All" here = the whole topic (no category narrowing).
          value={categorySlug}
          onChange={(id) => onChange(id === "all" ? topicSlug : id)}
          options={categoryOptions}
          wide
        />
      )}
    </>
  )
}
