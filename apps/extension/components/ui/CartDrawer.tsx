import { ShoppingCart } from "lucide-react"
import { useRef } from "react"

import { useCart, useCartSubmit } from "~/hooks"

import { useRouter } from "../layout/RouterProvider"
import BatchRewardContent from "../modals/reward/BatchRewardContent"
import WeightModal from "../modals/WeightModal"

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

/**
 * Opening the cart goes straight to the Amplify ticket — there is no
 * separate slide-up "cart list" surface anymore. The Amplify basket
 * (.b3-basket) already lists every item with a per-row toggle (remove)
 * and a weight selector, so it fully replaces the old drawer list.
 * The legacy `.cart-drawer*` markup has been removed; only the post-tx
 * reward handoff (BatchRewardContent) is stitched in on success.
 */
const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  const { items, atomsToCreate, removeFromCart, clearCart } = useCart()
  const { submitCart, submitting, result, error, reset, clearSubmittedItems } =
    useCartSubmit()
  const { navigateTo, setMyProfileIntent } = useRouter()
  const submittedItemsRef = useRef<CartItemRecord[]>([])

  const handleWeightSubmit = async (customWeights?: (bigint | null)[]) => {
    // Snapshot the items being submitted — the post-tx reward handoff
    // renders from this snapshot even after the cart is cleared.
    submittedItemsRef.current = [...items]
    const weight = customWeights?.[0] ?? undefined
    await submitCart(items, weight ?? undefined)
  }

  /**
   * Closes the Amplify modal. On success the reward handoff has already
   * been shown and dismissed (Done) — clear the submitted items. On
   * cancel/error just close. In every case the cart closes (there is no
   * drawer to fall back to).
   */
  const handleWeightClose = async () => {
    if (result?.success) {
      await clearSubmittedItems()
      submittedItemsRef.current = []
    }
    reset()
    onClose()
  }

  /**
   * Empties the whole cart and closes the modal. Wired to the basket's
   * "Clear all" button and to unchecking the last remaining mark.
   */
  const handleClearCart = () => {
    clearCart()
    onClose()
  }

  /**
   * Primary CTA on the post-tx reward screen.
   * Mono: navigate to MyProfile › Echoes and auto-open the matching group.
   * Multi: navigate to MyProfile › Echoes (bento) and highlight every
   * freshly-Marked domain. Cleans up cart state and closes, like a close.
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

    await clearSubmittedItems()
    submittedItemsRef.current = []
    reset()
    onClose()
    navigateTo("my-profile")
  }

  // Build modal triplets for WeightModal
  const modalTriplets: ModalTriplet[] = items.map((item) => ({
    id: item.id,
    triplet: {
      subject: "You",
      predicate: item.predicateName,
      object: item.pageTitle || item.normalizedUrl
    },
    description: item.pageTitle || item.normalizedUrl,
    url: item.url,
    intention: item.intention ?? undefined,
    interestContext: item.interestContext,
    interestContexts:
      item.interestContexts ??
      (item.interestContext ? [item.interestContext] : [])
  }))

  if (!isOpen) return null

  return (
    <WeightModal
      isOpen={isOpen}
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
      onClearCart={handleClearCart}
      onClose={handleWeightClose}
      onSubmit={handleWeightSubmit}
    />
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
