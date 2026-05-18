/**
 * Shared filter options for the Verbs + Topics dropdowns (EchoesTab,
 * BookmarkTab). One source of truth so the extension filter system stays
 * coherent with the explorer:
 *   - Verbs  = the 8 intention types (INTENTION_CONFIG)
 *   - Topics = the SOFIA topics (TOPIC_LABELS/COLORS, pulled 1:1 from the
 *              explorer's SOFIA_TOPICS taxonomy)
 *
 * Shape matches FilterDropdown's `FilterOption` (id/label/color).
 */
import { getTopicIcon, TOPIC_COLORS, TOPIC_LABELS } from "./topicConfig"
import { INTENTION_CONFIG } from "../../types/intentionCategories"
import type { IntentionType } from "../../types/intentionCategories"

export interface FilterOptionConfig {
  id: string
  label: string
  color?: string
  /** Material Symbols glyph name (topics only — verbs use a plain dot,
   *  exactly like the explorer's verb vs. topic dropdowns). */
  icon?: string
}

export const VERB_FILTER_OPTIONS: FilterOptionConfig[] = (
  Object.entries(INTENTION_CONFIG) as [
    IntentionType,
    { label: string; color: string }
  ][]
).map(([id, cfg]) => ({ id, label: cfg.label, color: cfg.color }))

export const TOPIC_FILTER_OPTIONS: FilterOptionConfig[] = Object.entries(
  TOPIC_LABELS
).map(([id, label]) => ({
  id,
  label,
  color: TOPIC_COLORS[id],
  icon: getTopicIcon(id)
}))
