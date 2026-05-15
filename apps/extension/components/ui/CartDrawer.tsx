import { useState, useRef } from "react"
import { X, Trash2, ShoppingCart } from "lucide-react"
import { VerbTag } from "@0xsofia/design-system"
import type { IntentionSlug } from "@0xsofia/design-system"
import { useCart, useCartSubmit } from "~/hooks"
import type { IntentionType } from "~/types/intentionCategories"
import { getIntentionBadge, predicateLabelToIntentionType } from "~/types/intentionCategories"
import { TOPIC_LABELS, TOPIC_COLORS } from "~/lib/config/topicConfig"
import { useRouter } from "../layout/RouterProvider"
import WeightModal from "../modals/WeightModal"
import BatchRewardContent from "../modals/reward/BatchRewardContent"
import "../styles/BatchRewardModal.css"
import type { ModalTriplet } from "~/hooks"
import type { CartItemRecord } from "~/lib/database"
import "../styles/CartDrawer.css"

const hostFromUrl = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  const { items, count, atomsToCreate, removeFromCart, clearCart } = useCart()
  const { submitCart, submitting, result, error, reset, clearSubmittedItems } =
    useCartSubmit()
  const { navigateTo, setMyProfileIntent } = useRouter()
  const [showWeightModal, setShowWeightModal] = useState(false)
  const submittedItemsRef = useRef<CartItemRecord[]>([])

  if (!isOpen) return null

  const handleCertifyAll = () => {
    // Save a snapshot of items before submission
    submittedItemsRef.current = [...items]
    setShowWeightModal(true)
  }

  const handleWeightSubmit = async (
    customWeights?: (bigint | null)[]
  ) => {
    const weight = customWeights?.[0] ?? undefined
    await submitCart(items, weight ?? undefined)
  }

  /**
   * Closes the WeightModal. When the tx succeeded, BatchRewardContent has been
   * rendered inside the modal (Phase 3a stitching) and the user has now dismissed it
   * via Done — so we also clear the submitted items and close the cart drawer.
   * On cancel/error we just close the weight modal and keep the cart open.
   */
  const handleWeightClose = async () => {
    setShowWeightModal(false)
    if (result?.success) {
      await clearSubmittedItems()
      submittedItemsRef.current = []
      onClose()
    }
    reset()
  }

  /**
   * Primary CTA on the post-tx reward screen.
   * Mono: navigate to MyProfile › Echoes and auto-open the matching group.
   * Multi: navigate to MyProfile › Echoes (bento) and highlight every freshly-Marked domain.
   * In both cases we clean up cart state and close the drawer, like a normal close.
   */
  const handleViewEchoes = async () => {
    const submitted = submittedItemsRef.current
    const uniqueDomains = Array.from(
      new Set(submitted.map((item) => hostFromUrl(item.url)))
    ).filter((d) => d.length > 0)

    if (uniqueDomains.length === 1) {
      setMyProfileIntent({
        initialTab: "Echoes",
        highlightDomain: uniqueDomains[0]
      })
    } else if (uniqueDomains.length > 1) {
      setMyProfileIntent({
        initialTab: "Echoes",
        highlightDomains: uniqueDomains
      })
    }

    setShowWeightModal(false)
    await clearSubmittedItems()
    submittedItemsRef.current = []
    reset()
    onClose()
    navigateTo("my-profile")
  }

  // Build modal triplets for WeightModal
  const modalTriplets: ModalTriplet[] = items.map(item => {
    return {
      id: item.id,
      triplet: {
        subject: "You",
        predicate: item.predicateName,
        object: item.pageTitle || item.normalizedUrl
      },
      description: item.pageTitle || item.normalizedUrl,
      url: item.url,
      intention: item.intention ?? undefined,
      interestContext: item.interestContext
    }
  })

  return (
    <>
      {/* Cart Drawer */}
      {isOpen && (
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
                <ShoppingCart size={40} className="cart-drawer__empty-icon" strokeWidth={1.5} />
                <span className="cart-drawer__empty-text">
                  Click intentions to add them here
                </span>
              </div>
            ) : (
              <div className="cart-drawer__list">
                {items.map(item => {
                  const intentionType: IntentionType | null = item.intention
                    ? (item.intention.replace('for_', '') as IntentionType)
                    : predicateLabelToIntentionType(item.predicateName)
                  const badge = getIntentionBadge(item.intention ?? undefined)
                    || (intentionType ? getIntentionBadge(intentionType) : null)
                  const isVote = !!item.voteAction
                  const hasContext = !!(item.interestContext && TOPIC_LABELS[item.interestContext])
                  return (
                    <div key={item.id} className="cart-drawer__item">
                      {/* Top row: favicon + title/url + remove */}
                      <div className="cart-drawer__item-main">
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
                        <button
                          className="cart-drawer__item-remove"
                          onClick={() => removeFromCart(item.id)}
                          title="Remove from cart"
                          aria-label="Remove from cart"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Bottom row: pills (intention/vote + topic context) */}
                      {(isVote || badge || hasContext) && (
                        <div className="cart-drawer__item-pills">
                          {isVote ? (
                            <span
                              className={`cart-drawer__item-pill cart-drawer__item-pill--${item.voteAction}`}
                            >
                              {item.voteAction === "support" ? "▲ Support" : "▼ Oppose"}
                            </span>
                          ) : intentionType ? (
                            <VerbTag
                              intent={intentionType as IntentionSlug}
                              label={badge?.label || intentionType}
                            />
                          ) : null}
                          {hasContext && (
                            <span
                              className="cart-drawer__item-pill cart-drawer__item-pill--context"
                              style={{
                                background: TOPIC_COLORS[item.interestContext!] || "var(--ds-accent)"
                              }}
                            >
                              {TOPIC_LABELS[item.interestContext!]}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Footer */}
            {count > 0 && (() => {
              const certCount = items.filter(i => !i.voteAction).length
              const voteItemCount = items.filter(i => !!i.voteAction).length
              const hasVotes = voteItemCount > 0
              const hasCerts = certCount > 0
              const summary = [
                hasCerts ? `${certCount} cert${certCount > 1 ? "s" : ""}` : "",
                hasVotes ? `${voteItemCount} vote${voteItemCount > 1 ? "s" : ""}` : ""
              ].filter(Boolean).join(" + ")
              const btnLabel = hasVotes && !hasCerts
                ? `Vote All (${count})`
                : hasVotes
                  ? `Submit All (${count})`
                  : `Mark All (${count})`

              return (
                <div className="cart-drawer__footer">
                  <div className="cart-drawer__fee-row">
                    <span>{summary}</span>
                    <span className="cart-drawer__fee-value">
                      {hasCerts && hasVotes
                        ? `${1 + voteItemCount} transaction${voteItemCount > 0 ? "s" : ""}`
                        : hasVotes
                          ? `${voteItemCount} transaction${voteItemCount > 1 ? "s" : ""}`
                          : "1 transaction"}
                    </span>
                  </div>
                  <button
                    className="cart-drawer__submit-btn"
                    onClick={handleCertifyAll}
                    disabled={submitting}
                  >
                    {submitting ? "Processing..." : btnLabel}
                  </button>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* WeightModal — stitched with BatchRewardContent on success (Phase 3a) */}
      {showWeightModal && (
        <WeightModal
          isOpen={showWeightModal}
          triplets={modalTriplets}
          isProcessing={submitting}
          transactionSuccess={result?.success ?? false}
          transactionError={error || undefined}
          transactionHash={result?.txHash || undefined}
          createdCount={result?.createdCount ?? 0}
          depositCount={result?.depositCount ?? 0}
          isIntentionCertification={true}
          showXpAnimation={true}
          estimateOptions={{
            isNewTriple: true,
            newAtomCount: atomsToCreate.newObjectAtoms,
            newPredicateAtomCount: atomsToCreate.newPredicateAtoms,
            needsContextPredicateAtom: atomsToCreate.needsContextPredicateAtom
          }}
          successContent={
            <BatchRewardContent
              items={submittedItemsRef.current}
              txHash={result?.txHash}
              onClose={handleWeightClose}
              onViewEchoes={handleViewEchoes}
              enabled={!!result?.success}
            />
          }
          onRemoveTriplet={(tripletId) => removeFromCart(tripletId)}
          onClose={handleWeightClose}
          onSubmit={handleWeightSubmit}
        />
      )}
    </>
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
    <button className="cart-fab" onClick={onClick} aria-label="Open cart">
      <ShoppingCart size={20} className="cart-fab__icon" strokeWidth={2} />
      <span key={count} className="cart-fab__badge">
        {count}
      </span>
    </button>
  )
}

/** Toast shown briefly when item is added to cart */
export const CartToast = ({ message }: { message: string | null }) => {
  if (!message) return null
  return <div className="cart-toast">{message}</div>
}
