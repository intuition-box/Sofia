import type { IntentionPurpose } from '../../types/discovery'
import { INTENTION_ITEMS, getIntentionColor } from '~/types/intentionCategories'
import '../styles/IntentionBubbleSelector.css'

interface IntentionBubbleSelectorProps {
  onBubbleClick: (intention: IntentionPurpose) => void
  disabled?: boolean
  isEligible?: boolean
  selectedIntention?: IntentionPurpose | null
  certifiedIntentions?: IntentionPurpose[]
}

export const IntentionBubbleSelector = ({
  onBubbleClick,
  disabled = false,
  isEligible = true,
  selectedIntention = null,
  certifiedIntentions = []
}: IntentionBubbleSelectorProps) => {
  const handleClick = (intention: IntentionPurpose) => {
    if (disabled || !isEligible) return
    onBubbleClick(intention)
  }

  return (
    <div className={`intention-selector ${!isEligible ? 'not-eligible' : ''}`}>
      <div className="intention-pills">
        {INTENTION_ITEMS.map(({ key, label, type }) => {
          const isCertified = certifiedIntentions.includes(key)
          const color = isCertified ? getIntentionColor(type) : undefined

          return (
            <button
              key={key}
              className={`intention-pill ${selectedIntention === key ? 'active' : ''} ${isCertified ? 'certified' : ''}`}
              onClick={() => handleClick(key)}
              disabled={disabled || !isEligible}
              style={isCertified ? {
                backgroundColor: `${color}25`,
                borderColor: color,
                color
              } : undefined}
            >
              {label}
            </button>
          )
        })}
      </div>
      {!isEligible && (
        <span className="intention-hint">Explore the page first</span>
      )}
    </div>
  )
}

export default IntentionBubbleSelector
