import { useState } from "react"
import { createPortal } from "react-dom"
import { X, Trash2, ShoppingCart } from "lucide-react"
import { useCart, useCartSubmit } from "~/hooks"
import { getIntentionBadge } from "~/types/intentionCategories"
import WeightModal from "../modals/WeightModal"
import type { ModalTriplet } from "~/hooks"
import "../styles/CartDrawer.css"

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  const { items, count, removeFromCart, clearCart } = useCart()
  const { submitCart, submitting, result, error, reset } = useCartSubmit()
  const [showWeightModal, setShowWeightModal] = useState(false)

  if (!isOpen) return null

  const handleCertifyAll = () => {
    setShowWeightModal(true)
  }

  const handleWeightSubmit = async (
    customWeights?: (bigint | null)[]
  ) => {
    const weight = customWeights?.[0] ?? undefined
    await submitCart(items, weight ?? undefined)
  }

  const handleWeightClose = () => {
    setShowWeightModal(false)
    reset()
    if (result?.success) {
      onClose()
    }
  }

  // Build modal triplets for WeightModal
  const modalTriplets: ModalTriplet[] = items.map(item => {
    const badge = getIntentionBadge(item.intention ?? undefined)
    return {
      id: item.id,
      triplet: {
        subject: "You",
        predicate: item.predicateName,
        object: item.pageTitle || item.normalizedUrl
      },
      description: item.pageTitle || item.normalizedUrl,
      url: item.url,
      intention: item.intention ?? undefined
    }
  })

  return createPortal(
    <>
      <div
        className="cart-drawer-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div className="cart-drawer">
          {/* Header */}
          <div className="cart-drawer__header">
            <div className="cart-drawer__title">
              Cart
              <span className="cart-drawer__title-count">({count})</span>
            </div>
            <div className="cart-drawer__actions">
              {count > 0 && (
                <button
                  className="cart-drawer__clear-btn"
                  onClick={clearCart}
                >
                  Clear all
                </button>
              )}
              <button
                className="cart-drawer__close-btn"
                onClick={onClose}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Items */}
          {count === 0 ? (
            <div className="cart-drawer__empty">
              <ShoppingCart
                size={32}
                className="cart-drawer__empty-icon"
              />
              <span className="cart-drawer__empty-text">
                Enable cart mode and click intentions to add them here
              </span>
            </div>
          ) : (
            <div className="cart-drawer__list">
              {items.map(item => {
                const badge = getIntentionBadge(
                  item.intention ?? undefined
                )
                return (
                  <div key={item.id} className="cart-drawer__item">
                    {item.faviconUrl ? (
                      <img
                        src={item.faviconUrl}
                        className="cart-drawer__item-favicon"
                        alt=""
                      />
                    ) : (
                      <div className="cart-drawer__item-favicon--fallback">
                        ?
                      </div>
                    )}
                    <div className="cart-drawer__item-info">
                      <div className="cart-drawer__item-title">
                        {item.pageTitle || item.normalizedUrl}
                      </div>
                      <div className="cart-drawer__item-url">
                        {item.normalizedUrl}
                      </div>
                    </div>
                    {badge && (
                      <span
                        className="cart-drawer__item-pill"
                        style={{
                          backgroundColor: `${badge.color}20`,
                          color: badge.color,
                          border: `1px solid ${badge.color}40`
                        }}
                      >
                        {badge.label}
                      </span>
                    )}
                    <button
                      className="cart-drawer__item-remove"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Footer */}
          {count > 0 && (
            <div className="cart-drawer__footer">
              <div className="cart-drawer__fee-row">
                <span>{count} certification{count > 1 ? "s" : ""}</span>
                <span className="cart-drawer__fee-value">
                  1 transaction
                </span>
              </div>
              <button
                className="cart-drawer__submit-btn"
                onClick={handleCertifyAll}
                disabled={submitting}
              >
                {submitting ? "Certifying..." : `Certify All (${count})`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* WeightModal for shared weight selection */}
      {showWeightModal &&
        createPortal(
          <WeightModal
            isOpen={showWeightModal}
            triplets={modalTriplets}
            isProcessing={submitting}
            transactionSuccess={result?.success ?? false}
            transactionError={error || undefined}
            transactionHash={
              result?.txHash || undefined
            }
            createdCount={result?.createdCount ?? 0}
            depositCount={result?.depositCount ?? 0}
            isIntentionCertification={true}
            onClose={handleWeightClose}
            onSubmit={handleWeightSubmit}
          />,
          document.body
        )}
    </>,
    document.body
  )
}

export default CartDrawer

/** Floating cart button — renders when cart has items */
export const CartFab = ({
  count,
  onClick
}: {
  count: number
  onClick: () => void
}) => {
  if (count === 0) return null

  return (
    <button className="cart-fab" onClick={onClick}>
      <ShoppingCart size={20} className="cart-fab__icon" />
      <span className="cart-fab__badge">{count}</span>
    </button>
  )
}

/** Toast shown briefly when item is added to cart */
export const CartToast = ({ message }: { message: string | null }) => {
  if (!message) return null
  return <div className="cart-toast">{message}</div>
}
