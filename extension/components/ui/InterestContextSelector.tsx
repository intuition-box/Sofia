import { memo } from "react"
import type { UserTopicPosition } from "~/lib/services/TopicPositionsService"
import "../styles/InterestContextSelector.css"

interface InterestContextSelectorProps {
  interests: UserTopicPosition[]
  selectedContext: string | null
  onSelectContext: (slug: string | null) => void
  disabled?: boolean
}

export const InterestContextSelector = memo(({
  interests,
  selectedContext,
  onSelectContext,
  disabled = false,
}: InterestContextSelectorProps) => {
  if (interests.length === 0) return null

  const handleClick = (slug: string) => {
    if (disabled) return
    onSelectContext(selectedContext === slug ? null : slug)
  }

  return (
    <div className="interest-context">
      <span className="interest-context__label">in context of</span>
      <div className="interest-context__buttons">
        {interests.map(({ topicSlug, label, color }) => {
          const isSelected = selectedContext === topicSlug
          return (
            <button
              key={topicSlug}
              className={`interest-context__btn ${isSelected ? "interest-context__btn--selected" : ""}`}
              onClick={() => handleClick(topicSlug)}
              disabled={disabled}
              style={isSelected ? {
                borderColor: color,
                color,
                backgroundColor: `${color}20`,
                boxShadow: `0 0 12px ${color}30`,
              } : undefined}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
})

export default InterestContextSelector
