import { memo, useMemo } from "react"

import { INTENTION_CONFIG, type IntentionType } from "~/types/intentionCategories"
import { INTENTION_ICONS } from "~/lib/config/intentionIcons"
import FilterDropdown, { type FilterOption } from "./FilterDropdown"

interface IntentionSelectorProps {
  /** Currently picked intention, or null when none is selected. */
  selected: IntentionType | null
  /** Fires when an intention is picked from the dropdown. */
  onSelect: (type: IntentionType) => void
  /** Fires when the user clears the current selection. */
  onClear: () => void
  disabled?: boolean
}

// Trust verbs first, then the six purposes — same order as the old pill row.
const OPTION_TYPES: IntentionType[] = [
  "trusted",
  "distrusted",
  "work",
  "learning",
  "fun",
  "inspiration",
  "buying",
  "music"
]

/**
 * IntentionSelector — single-choice dropdown, mirroring
 * `InterestContextSelector` so the actions panel reads as two matching
 * pickers ("Intention" + "In context of"). No implicit "All": a real
 * choice is required (placeholder until picked) and the selection can be
 * cleared. The parent owns the value and queues/removes the cart item.
 */
export const IntentionSelector = memo(
  ({ selected, onSelect, onClear, disabled = false }: IntentionSelectorProps) => {
    const options = useMemo<FilterOption[]>(
      () =>
        OPTION_TYPES.map((type) => {
          const Icon = INTENTION_ICONS[type]
          const color = INTENTION_CONFIG[type].color
          return {
            id: type,
            label: INTENTION_CONFIG[type].label,
            color,
            node: <Icon size={14} style={{ color }} />
          }
        }),
      []
    )

    const handleChange = (id: string) => {
      if (id === "all") {
        onClear()
        return
      }
      onSelect(id as IntentionType)
    }

    if (disabled) {
      // FilterDropdown has no disabled state; dim the trigger frame while
      // the parent flow is processing.
      return (
        <div style={{ opacity: 0.55, pointerEvents: "none" }}>
          <FilterDropdown
            label="Intention"
            value={selected ?? "all"}
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
        label="Intention"
        value={selected ?? "all"}
        onChange={handleChange}
        options={options}
        placeholder="Choose"
        wide
      />
    )
  }
)

export default IntentionSelector
