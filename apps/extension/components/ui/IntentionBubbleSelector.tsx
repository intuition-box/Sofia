import { memo } from "react"
import type { IntentionPurpose } from '../../types/discovery'
import { INTENTION_ITEMS, TRUST_ITEMS, getIntentionColor } from '~/types/intentionCategories'
import '../styles/IntentionBubbleSelector.css'

interface IntentionBubbleSelectorProps {
  onBubbleClick: (intention: IntentionPurpose) => void
  disabled?: boolean
  isEligible?: boolean
  certifiedIntentions?: IntentionPurpose[]
  cartIntentions?: IntentionPurpose[]
  // Trust/Distrust props
  onTrustClick?: (predicate: "trusts" | "distrust") => void
  alreadyTrusted?: boolean
  alreadyDistrusted?: boolean
  trustInCart?: boolean
  distrustInCart?: boolean
}

export const IntentionBubbleSelector = memo(({
  onBubbleClick,
  disabled = false,
  isEligible = true,
  certifiedIntentions = [],
  cartIntentions = [],
  onTrustClick,
  alreadyTrusted = false,
  alreadyDistrusted = false,
  trustInCart = false,
  distrustInCart = false,
}: IntentionBubbleSelectorProps) => {
  const handleClick = (intention: IntentionPurpose) => {
    if (disabled || !isEligible) return
    onBubbleClick(intention)
  }

  const showTrust = !!onTrustClick

  return (
    <div className={`intention-selector ${!isEligible ? 'not-eligible' : ''}`}>
      <div className="intention-pills">
        {/* Trust/Distrust pills */}
        {showTrust && TRUST_ITEMS.map(({ type, label, predicateLabel }) => {
          const isTrust = type === "trusted"
          const isCertified = isTrust ? alreadyTrusted : alreadyDistrusted
          const isInCart = isTrust ? trustInCart : distrustInCart
          const color = (isCertified || isInCart)
            ? getIntentionColor(type)
            : undefined

          return (
            <button
              key={type}
              className={`intention-pill intention-pill--trust ${isCertified ? 'certified' : ''} ${isInCart && !isCertified ? 'in-cart' : ''}`}
              onClick={() => onTrustClick!(
                predicateLabel as "trusts" | "distrust"
              )}
              disabled={disabled || isCertified || isInCart}
              style={(isCertified || isInCart) ? {
                backgroundColor: `${color}${isInCart && !isCertified ? '15' : '25'}`,
                borderColor: color,
                color
              } : undefined}
            >
              {isCertified
                ? label
                : isInCart
                  ? `+ ${label}`
                  : label}
            </button>
          )
        })}

        {/* Separator between trust and intention pills */}
        {showTrust && (
          <span className="intention-pills__separator" />
        )}

        {/* Intention pills */}
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
