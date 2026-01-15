import React from 'react'
import type { IntentionPurpose } from '../../types/discovery'
import { INTENTION_LABELS } from '../../types/discovery'
import './IntentionBubbleSelector.css'

interface IntentionBubbleSelectorProps {
  onBubbleClick: (intention: IntentionPurpose) => void
  disabled?: boolean
  isEligible?: boolean
  selectedIntention?: IntentionPurpose | null
}

const INTENTION_OPTIONS: IntentionPurpose[] = [
  'for_work',
  'for_learning',
  'for_fun',
  'for_inspiration',
  'for_buying'
]

export const IntentionBubbleSelector: React.FC<IntentionBubbleSelectorProps> = ({
  onBubbleClick,
  disabled = false,
  isEligible = true,
  selectedIntention = null
}) => {
  const handleBubbleClick = (intention: IntentionPurpose) => {
    if (disabled || !isEligible) return
    onBubbleClick(intention)
  }

  return (
    <div className="intention-bubble-selector">
      {/* Phrase with placeholder */}
      <div className="intention-phrase">
        <span className="phrase-text">I visit</span>
        <div className={`intention-placeholder ${selectedIntention ? 'filled' : ''}`}>
          {selectedIntention ? INTENTION_LABELS[selectedIntention] : '?'}
        </div>
        <span className="phrase-text">this page</span>
      </div>

      {/* Bubbles row */}
      <div className="intention-bubbles">
        {INTENTION_OPTIONS.map((intention) => (
          <button
            key={intention}
            className={`intention-bubble ${selectedIntention === intention ? 'selected' : ''} ${!isEligible ? 'disabled' : ''}`}
            onClick={() => handleBubbleClick(intention)}
            disabled={disabled || !isEligible}
            title={INTENTION_LABELS[intention]}
          >
            <span className="bubble-text">{INTENTION_LABELS[intention]}</span>
          </button>
        ))}
      </div>

      {/* Message when not eligible */}
      {!isEligible && (
        <div className="eligibility-message">
          Explore the page first
        </div>
      )}
    </div>
  )
}

export default IntentionBubbleSelector
