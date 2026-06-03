import type { CartItem } from '../hooks/useCart'
import WeightModal from './WeightModal'
import './styles/cart-drawer.css'

interface CartDrawerProps {
  items: CartItem[]
  isOpen: boolean
  onClose: () => void
  onRemove: (id: string) => void
  /** Fired when the batch tx succeeds and the user dismisses the success
   *  screen — clears the cart (which lets the aside auto-close). */
  onSuccess: () => void
}

/**
 * CartDrawer — the cart sidepanel. It used to be a standalone item list
 * that handed off to a separate <WeightModal> popup to pick weights and
 * sign. That extra modal step is gone: the Amplify panel (basket +
 * weights + cost + sign + success) now fills this aside directly, so the
 * whole flow happens in one surface with the extension's exact UI.
 *
 * This component is just the slide-in shell; the panel is <WeightModal>
 * rendered inline (no portal, no overlay). Removal is per-row (the basket
 * checkbox) and closing is the panel's Cancel/Close button — mirroring the
 * extension, which has no separate header chrome above the ticket.
 */
export default function CartDrawer({
  items,
  isOpen,
  onClose,
  onRemove,
  onSuccess,
}: CartDrawerProps) {
  return (
    <aside
      className={`fixed right-0 overflow-hidden cd-aside ${isOpen ? 'cd-open' : ''}`}
    >
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-6">
          <img
            src="/logo.png"
            alt="Sofia"
            className="h-12 w-12 mb-4 opacity-30"
          />
          <p className="text-sm">Your cart is empty</p>
          <p className="text-xs mt-2 opacity-70">
            Click Support or Oppose on any claim
          </p>
        </div>
      ) : (
        <WeightModal
          isOpen={isOpen}
          items={items}
          onClose={onClose}
          onSuccess={onSuccess}
          onRemove={onRemove}
        />
      )}
    </aside>
  )
}
