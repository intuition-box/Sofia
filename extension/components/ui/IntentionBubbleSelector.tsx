import type { IntentionPurpose } from '../../types/discovery'
import { INTENTION_ITEMS } from '~/types/intentionCategories'
import '../styles/IntentionBubbleSelector.css'

interface IntentionBubbleSelectorProps {
  onBubbleClick: (intention: IntentionPurpose) => void
  disabled?: boolean
  isEligible?: boolean
  selectedIntention?: IntentionPurpose | null
}

export const IntentionBubbleSelector = ({
  onBubbleClick,
  disabled = false,
  isEligible = true,
  selectedIntention = null
}: IntentionBubbleSelectorProps) => {
  const handleClick = (intention: IntentionPurpose) => {
    if (disabled || !isEligible) return
    onBubbleClick(intention)
  }

  return (
    <div className={`intention-selector ${!isEligible ? 'not-eligible' : ''}`}>
      <div className="intention-pills">
        {INTENTION_ITEMS.map(({ key, label }) => (
          <button
            key={key}
            className={`intention-pill ${selectedIntention === key ? 'active' : ''}`}
            onClick={() => handleClick(key)}
            disabled={disabled || !isEligible}
          >
            {label}
          </button>
        ))}
      </div>
      {!isEligible && (
        <span className="intention-hint">Explore the page first</span>
      )}
    </div>
  )
}

export default IntentionBubbleSelector
