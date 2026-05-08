import { memo } from "react"
import type { IntentionPurpose } from '../../types/discovery'
import { INTENTION_ITEMS, TRUST_ITEMS } from '~/types/intentionCategories'
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
  // Allow re-clicking certified pills to add a deposit + context
  allowDepositContext?: boolean
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
  allowDepositContext = false,
}: IntentionBubbleSelectorProps) => {
  const handleClick = (intention: IntentionPurpose, isCertified: boolean) => {
    if (disabled || !isEligible) return
    if (isCertified && !allowDepositContext) return
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

          return (
            <button
              key={type}
              className={`intention-pill intention-pill--${type} ${isCertified ? 'certified' : ''} ${isInCart && !isCertified ? 'in-cart' : ''}`}
              onClick={() => onTrustClick!(
                predicateLabel as "trusts" | "distrust"
              )}
              disabled={disabled || isCertified}
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

          return (
            <button
              key={key}
              className={`intention-pill intention-pill--${type} ${isCertified ? 'certified' : ''} ${isInCart && !isCertified ? 'in-cart' : ''}`}
              onClick={() => handleClick(key, isCertified)}
              disabled={disabled || !isEligible || isCertified}
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
