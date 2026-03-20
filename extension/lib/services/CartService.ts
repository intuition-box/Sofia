/**
 * CartService
 *
 * Singleton store for certification cart.
 * Accumulates intentions across pages for batch submission.
 * Uses useSyncExternalStore protocol for reactive UI.
 *
 * Related files:
 * - hooks/useCart.ts: React hook consumer
 * - hooks/useCartSubmit.ts: Batch submission hook
 * - lib/database/indexedDB-methods.ts: CartDataService (IndexedDB CRUD)
 * - types/database.ts: CartItemRecord type
 */

import { createServiceLogger } from "../utils/logger"
import { normalizeUrl } from "../utils/normalizeUrl"
import { CartDataService } from "../database"
import { INTENTION_PREDICATES } from "../../types/discovery"
import type { CartItemRecord } from "../../types/database"
import type { IntentionPurpose } from "../../types/discovery"
import type { BatchTripleInput } from "../../types/blockchain"

const logger = createServiceLogger("CartService")

export interface CartState {
  items: CartItemRecord[]
  count: number
}

class CartServiceClass {
  private state: CartState = { items: [], count: 0 }
  private listeners = new Set<() => void>()
  private currentWallet: string | null = null
  private initialized = false
  private loaded = false

  // ── Store protocol (useSyncExternalStore) ──

  getSnapshot = (): CartState => this.state

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    if (!this.initialized) this.initializeStore()
    return () => this.listeners.delete(listener)
  }

  private updateState(partial: Partial<CartState>) {
    this.state = { ...this.state, ...partial }
    for (const listener of this.listeners) listener()
    // Sync cart count to session storage so content scripts can react
    this.syncCartCount()
  }

  private syncCartCount() {
    try {
      chrome.storage.session
        .set({ cartItemCount: this.state.count })
        .catch(() => {})
    } catch {
      // Not in extension context
    }
  }

  private initializeStore() {
    if (this.initialized) return
    this.initialized = true

    // Listen to wallet changes to reload cart
    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "session" && changes.walletAddress) {
          const newWallet = changes.walletAddress.newValue?.toLowerCase()
          if (newWallet && newWallet !== this.currentWallet) {
            this.loaded = false
            this.loadCart(newWallet)
          } else if (!newWallet) {
            this.currentWallet = null
            this.loaded = false
            this.updateState({ items: [], count: 0 })
          }
        }
      })
    } catch {
      // Not in extension context (e.g., tests)
    }
  }

  // ── Public API ──

  async loadCart(walletAddress: string, force = false): Promise<void> {
    const wallet = walletAddress.toLowerCase()
    // Skip reload if same wallet already loaded (even if cart is empty)
    if (!force && this.loaded && this.currentWallet === wallet) {
      return
    }
    this.currentWallet = wallet
    this.loaded = true
    try {
      const items = await CartDataService.getByWallet(wallet)
      this.updateState({ items, count: items.length })
      logger.debug("Cart loaded", { wallet: walletAddress.slice(0, 8), count: items.length })
    } catch (error) {
      logger.error("Failed to load cart", { error })
    }
  }

  async addItem(
    walletAddress: string,
    url: string,
    pageTitle: string | null,
    predicateName: string,
    intention: IntentionPurpose | null,
    faviconUrl: string | null
  ): Promise<boolean> {
    const { label: normalizedLabel } = normalizeUrl(url)
    const id = `${walletAddress.toLowerCase()}:${normalizedLabel}:${predicateName}`

    // Check for duplicate
    if (this.state.items.some(item => item.id === id)) {
      logger.debug("Item already in cart", { normalizedLabel, predicateName })
      return false
    }

    const record: CartItemRecord = {
      id,
      walletAddress: walletAddress.toLowerCase(),
      url,
      normalizedUrl: normalizedLabel,
      pageTitle,
      predicateName,
      intention,
      faviconUrl,
      addedAt: Date.now()
    }

    try {
      await CartDataService.addItem(record)
      const items = [...this.state.items, record]
      this.updateState({ items, count: items.length })
      logger.info("Item added to cart", { normalizedLabel, predicateName })
      // Reset browsing nudge counter on cart action
      chrome.runtime
        .sendMessage({ type: "NUDGE_DISMISSED" })
        .catch(() => {})
      return true
    } catch (error) {
      logger.error("Failed to add item to cart", { error })
      return false
    }
  }

  async removeItem(itemId: string): Promise<void> {
    try {
      await CartDataService.removeItem(itemId)
      const items = this.state.items.filter(item => item.id !== itemId)
      this.updateState({ items, count: items.length })
      logger.info("Item removed from cart", { itemId })
    } catch (error) {
      logger.error("Failed to remove item from cart", { error })
    }
  }

  async clearCart(walletAddress: string): Promise<void> {
    try {
      await CartDataService.clearByWallet(walletAddress.toLowerCase())
      this.updateState({ items: [], count: 0 })
      logger.info("Cart cleared", { wallet: walletAddress.slice(0, 8) })
    } catch (error) {
      logger.error("Failed to clear cart", { error })
    }
  }

  hasItem(normalizedUrl: string, predicateName: string): boolean {
    return this.state.items.some(
      item => item.normalizedUrl === normalizedUrl && item.predicateName === predicateName
    )
  }

  // ── Batch submission helper ──

  toBatchInputs(items: CartItemRecord[]): BatchTripleInput[] {
    return items.map(item => ({
      predicateName: item.predicateName,
      objectData: {
        name: item.pageTitle || item.normalizedUrl,
        description: `Page: ${item.normalizedUrl}`,
        url: item.url,
        image: item.faviconUrl || undefined
      }
    }))
  }

  // Helper: get predicate name from intention
  static getPredicateName(intention: IntentionPurpose): string {
    return INTENTION_PREDICATES[intention]
  }
}

export const cartService = new CartServiceClass()
export { CartServiceClass }
