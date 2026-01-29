import type { IntentionPurpose } from '../../types/discovery'
import '../styles/IntentionBubbleSelector.css'

interface IntentionBubbleSelectorProps {
  onBubbleClick: (intention: IntentionPurpose) => void
  disabled?: boolean
  isEligible?: boolean
  selectedIntention?: IntentionPurpose | null
}

const INTENTIONS: { key: IntentionPurpose; label: string }[] = [
  { key: 'for_work', label: 'work' },
  { key: 'for_learning', label: 'learning' },
  { key: 'for_fun', label: 'fun' },
  { key: 'for_inspiration', label: 'inspiration' },
  { key: 'for_buying', label: 'buying' }
]

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
        {INTENTIONS.map(({ key, label }) => (
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
