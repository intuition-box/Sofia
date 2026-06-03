import { Menu, ShoppingCart, PanelRight } from 'lucide-react'

interface MobileHeaderProps {
  /** Open / close the left nav drawer (NavSidebar in mobile mode). */
  onMenuClick: () => void
  /** Open / close the right-rail drawer. */
  onRightRailClick?: () => void
  /** Opens the CartDrawer (mirrors the desktop NavSidebar cart button). */
  onCartClick?: () => void
  /** Current cart item count for the badge. */
  cartCount?: number
  /** Hide the right-rail button on pages that opt out (profile, full-width). */
  hideRightRailButton?: boolean
}

/**
 * MobileHeader — fixed 56px top bar shown only on viewports <768px.
 *
 * Layout: [burger]   [logo]   [right-rail toggle] [cart with badge]
 *
 * The styling is owned by the `.app-mobile-header` class in
 * @0xsofia/design-system/styles/app-shell.css, which handles the
 * desktop `display: none` + mobile `display: flex` + positioning.
 * This component only wires the contents and click handlers.
 *
 * Bottom-nav lives in BottomNav.tsx — together they sandwich the
 * main content area on mobile (header 56px + content + bottom-nav
 * 64px + safe-area-inset).
 */
export function MobileHeader({
  onMenuClick,
  onRightRailClick,
  onCartClick,
  cartCount = 0,
  hideRightRailButton = false,
}: MobileHeaderProps) {
  return (
    <header className="app-mobile-header">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
      >
        <Menu size={20} />
      </button>

      <div className="flex flex-1 items-center justify-center">
        <img src="/logo.png" alt="Sofia" className="h-6 w-auto" />
      </div>

      <div className="flex items-center gap-1">
        {onRightRailClick && !hideRightRailButton && (
          <button
            type="button"
            onClick={onRightRailClick}
            aria-label="Open right panel"
            className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
          >
            <PanelRight size={18} />
          </button>
        )}
        {onCartClick && (
          <button
            type="button"
            onClick={onCartClick}
            aria-label={`Open cart${cartCount > 0 ? ` (${cartCount} items)` : ''}`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
          >
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-on-accent"
              >
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  )
}
