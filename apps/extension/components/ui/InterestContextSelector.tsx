import { memo, useMemo } from "react"
import FilterDropdown, { type FilterOption } from "./FilterDropdown"
import {
  TOPIC_ATOM_IDS,
  TOPIC_LABELS,
  TOPIC_COLORS,
  TOPIC_ICON,
} from "~/lib/config/topicConfig"

interface InterestContextSelectorProps {
  selectedContext: string | null
  onSelectContext: (slug: string | null) => void
  disabled?: boolean
  /** Topics already attached as on-chain context for the current page.
   *  Currently unused visually (FilterDropdown has no per-option marker
   *  slot) but kept so callers can keep passing the data; we can wire a
   *  checkmark glyph here once FilterDropdown grows a status hint. */
  certifiedContexts?: string[]
}

export const InterestContextSelector = memo(
  ({
    selectedContext,
    onSelectContext,
    disabled = false,
  }: InterestContextSelectorProps) => {
    // Source of truth = the explorer's 14 topics (topicConfig). We expose
    // all of them, in config declaration order, so the context picker is
    // not gated on the user having staked positions yet.
    const options = useMemo<FilterOption[]>(
      () =>
        Object.keys(TOPIC_ATOM_IDS).map((slug) => ({
          id: slug,
          label: TOPIC_LABELS[slug] ?? slug,
          color: TOPIC_COLORS[slug] ?? "#888888",
          icon: TOPIC_ICON[slug],
        })),
      [],
    )

    if (disabled) {
      // FilterDropdown has no disabled state; render the trigger frame
      // with a muted dimming when the parent flow is processing.
      return (
        <div style={{ opacity: 0.55, pointerEvents: "none" }}>
          <FilterDropdown
            label="In context of"
            value={selectedContext ?? "all"}
            onChange={() => undefined}
            options={options}
            placeholder="Choose"
            wide
          />
        </div>
      )
    }

    return (
      <FilterDropdown
        label="In context of"
        value={selectedContext ?? "all"}
        onChange={(id) => onSelectContext(id === "all" ? null : id)}
        options={options}
        placeholder="Choose"
        wide
      />
    )
  },
)

export default InterestContextSelector
