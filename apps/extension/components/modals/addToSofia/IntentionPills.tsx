// "Why?" — the optional intention tags (work, learning, …) as toggle pills.
// Shared by the Add-to-Sofia modal and the side panel's Page tab.
import type { CSSProperties } from "react"

import { INTENTION_ICONS } from "~lib/config/intentionIcons"
import {
  INTENTION_CONFIG,
  INTENTION_ITEMS,
  type IntentionPurpose
} from "~types/intentionCategories"

interface IntentionPillsProps {
  selected: IntentionPurpose[]
  onToggle: (purpose: IntentionPurpose) => void
}

export function IntentionPills({ selected, onToggle }: IntentionPillsProps) {
  return (
    <div className="sis-intentions">
      {INTENTION_ITEMS.map((it) => {
        const color = INTENTION_CONFIG[it.type].color
        const on = selected.includes(it.key)
        const Glyph = INTENTION_ICONS[it.type]
        return (
          <button
            key={it.key}
            type="button"
            className={`sis-intention${on ? " on" : ""}`}
            style={{ "--c": color } as CSSProperties}
            aria-pressed={on}
            onClick={() => onToggle(it.key)}>
            {Glyph ? (
              <Glyph
                className="sis-intention-glyph"
                size={14}
                style={{ color }}
              />
            ) : null}
            {INTENTION_CONFIG[it.type].label}
          </button>
        )
      })}
    </div>
  )
}
