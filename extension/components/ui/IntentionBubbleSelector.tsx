import { memo } from "react"
import type { IntentionPurpose } from '../../types/discovery'
import { INTENTION_ITEMS, getIntentionColor } from '~/types/intentionCategories'
import '../styles/IntentionBubbleSelector.css'

interface IntentionBubbleSelectorProps {
  onBubbleClick: (intention: IntentionPurpose) => void
  disabled?: boolean
  isEligible?: boolean
  certifiedIntentions?: IntentionPurpose[]
  cartIntentions?: IntentionPurpose[]
}

export const IntentionBubbleSelector = memo(({
  onBubbleClick,
  disabled = false,
  isEligible = true,
  certifiedIntentions = [],
  cartIntentions = []
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
          const isInCart = cartIntentions.includes(key)
          const color = (isCertified || isInCart)
            ? getIntentionColor(type)
            : undefined

          return (
            <button
              key={key}
              className={`intention-pill ${isCertified ? 'certified' : ''} ${isInCart && !isCertified ? 'in-cart' : ''}`}
              onClick={() => handleClick(key)}
              disabled={disabled || !isEligible}
              style={(isCertified || isInCart) ? {
                backgroundColor: `${color}${isInCart && !isCertified ? '15' : '25'}`,
                borderColor: color,
                color
              } : undefined}
            >
              {isInCart && !isCertified ? `+ ${label}` : label}
            </button>
          )
        })}
      </div>
      {!isEligible && (
        <span className="intention-hint">Explore the page first</span>
      )}
    </div>
  )
})

export default IntentionBubbleSelector
