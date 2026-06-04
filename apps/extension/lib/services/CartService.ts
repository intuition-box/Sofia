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
import { getPredicateIdByName, isKnownPredicateName } from "../config/predicateConstants"
import { PREDICATE_NAMES } from "../config/chainConfig"
import type { CartItemRecord } from "../../types/database"
import type { IntentionPurpose } from "../../types/discovery"
import type { BatchTripleInput } from "../../types/blockchain"

/** Worst-case count of atoms that may need on-chain creation for a cart batch. */
export interface AtomsToCreateEstimate {
  /** Unique URLs (object atoms — one per page) */
  newObjectAtoms: number
  /** Unique non-pre-defined predicate names (e.g. testnet predicates) */
  newPredicateAtoms: number
  /** True if any cert item has interestContext AND "in context of" predicate has no pre-defined ID */
  needsContextPredicateAtom: boolean
}

const logger = createServiceLogger("CartService")

// Sanity check: every UI-visible intention predicate must resolve to a known
// on-chain predicate. Catches drift between INTENTION_PREDICATES (UI) and
// PREDICATE_NAME_TO_ID (canonical registry) at module load.
for (const predicateName of Object.values(INTENTION_PREDICATES)) {
  if (!isKnownPredicateName(predicateName)) {
    logger.error(
      `INTENTION_PREDICATES drift: "${predicateName}" missing from PREDICATE_NAME_TO_ID`
    )
  }
}

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
    faviconUrl: string | null,
    interestContexts?: string[]
  ): Promise<boolean> {
    // Reject free-form predicate strings to prevent silent on-chain creation
    // of attacker-shaped predicate atoms (lookalike trailing space, homograph,
    // double-space). Only names registered in PREDICATE_NAME_TO_ID are allowed.
    if (!isKnownPredicateName(predicateName)) {
      logger.error("Rejected unknown predicate", { predicateName })
      return false
    }

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
      addedAt: Date.now(),
      // Keep the first as the primary single-pill field; store the full set
      // so submit mints one `in context of` triple per context.
      interestContext: interestContexts?.[0] ?? null,
      interestContexts:
        interestContexts && interestContexts.length ? interestContexts : undefined,
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

  async addVoteItem(
    walletAddress: string,
    url: string,
    pageTitle: string | null,
    predicateName: string,
    intention: IntentionPurpose | null,
    faviconUrl: string | null,
    voteAction: "support" | "oppose",
    tripleTermId: string
  ): Promise<boolean> {
    // Reject free-form predicate strings — see addItem rationale.
    if (!isKnownPredicateName(predicateName)) {
      logger.error("Rejected unknown predicate on vote", { predicateName })
      return false
    }

    const { label: normalizedLabel } = normalizeUrl(url)
    const wallet = walletAddress.toLowerCase()
    const id = `${wallet}:${normalizedLabel}:${predicateName}:${voteAction}`

    // Check for duplicate
    if (this.state.items.some(item => item.id === id)) {
      logger.debug("Vote already in cart", { normalizedLabel, voteAction })
      return false
    }

    // Check for conflicting vote (support vs oppose on same triple)
    if (this.hasConflictingVote(normalizedLabel, predicateName, voteAction)) {
      logger.debug("Conflicting vote in cart", { normalizedLabel, voteAction })
      return false
    }

    const record: CartItemRecord = {
      id,
      walletAddress: wallet,
      url,
      normalizedUrl: normalizedLabel,
      pageTitle,
      predicateName,
      intention,
      faviconUrl,
      addedAt: Date.now(),
      voteAction,
      tripleTermId
    }

    try {
      await CartDataService.addItem(record)
      const items = [...this.state.items, record]
      this.updateState({ items, count: items.length })
      logger.info("Vote added to cart", { normalizedLabel, voteAction })
      chrome.runtime
        .sendMessage({ type: "NUDGE_DISMISSED" })
        .catch(() => {})
      return true
    } catch (error) {
      logger.error("Failed to add vote to cart", { error })
      return false
    }
  }

  hasConflictingVote(
    normalizedUrl: string,
    predicateName: string,
    voteAction: "support" | "oppose"
  ): boolean {
    const opposite = voteAction === "support" ? "oppose" : "support"
    return this.state.items.some(
      item =>
        item.normalizedUrl === normalizedUrl &&
        item.predicateName === predicateName &&
        item.voteAction === opposite
    )
  }

  hasVoteInCart(
    normalizedUrl: string,
    predicateName: string,
    voteAction: "support" | "oppose"
  ): boolean {
    return this.state.items.some(
      item =>
        item.normalizedUrl === normalizedUrl &&
        item.predicateName === predicateName &&
        item.voteAction === voteAction
    )
  }

  async updateContextForUrl(
    walletAddress: string,
    url: string,
    interestContexts: string[]
  ): Promise<void> {
    const wallet = walletAddress.toLowerCase()
    const { label: normalizedLabel } = normalizeUrl(url)
    const matching = this.state.items.filter(
      item =>
        item.walletAddress === wallet && item.normalizedUrl === normalizedLabel
    )
    if (matching.length === 0) return

    // Keep the first as the primary single-pill field; store the full set.
    const patch = {
      interestContext: interestContexts[0] ?? null,
      interestContexts: interestContexts.length ? interestContexts : undefined
    }

    try {
      const updated = matching.map(item => ({ ...item, ...patch }))
      for (const item of updated) {
        await CartDataService.addItem(item) // put = upsert
      }
      const items = this.state.items.map(item =>
        item.walletAddress === wallet && item.normalizedUrl === normalizedLabel
          ? { ...item, ...patch }
          : item
      )
      this.updateState({ items, count: items.length })
      logger.info("Updated context for URL", {
        normalizedLabel,
        interestContexts
      })
    } catch (error) {
      logger.error("Failed to update context for URL", { error })
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
    const certItems = items.filter(item => !item.voteAction)
    return certItems.map(item => ({
      predicateName: item.predicateName,
      objectData: {
        name: item.pageTitle || item.normalizedUrl,
        description: `Page: ${item.normalizedUrl}`,
        url: item.url,
        image: item.faviconUrl || undefined
      }
    }))
  }

  getVoteItems(items: CartItemRecord[]): CartItemRecord[] {
    return items.filter(item => !!item.voteAction && !!item.tripleTermId)
  }

  /**
   * Worst-case count of atoms that may need on-chain creation for a cart batch.
   * Used by fee estimation to avoid the under-counting that happens when only
   * the URL atom is assumed (default newAtomCount=1) but the batch also creates
   * predicate atoms (testnet) and/or the "in context of" predicate (mainnet first use).
   *
   * Pure derivation, no chain reads — surestimates if atoms already exist.
   */
  estimateAtomsToCreate(items: CartItemRecord[]): AtomsToCreateEstimate {
    const certItems = items.filter(item => !item.voteAction)

    const uniqueUrls = new Set<string>()
    const uniqueNewPredicates = new Set<string>()
    let hasContext = false

    for (const item of certItems) {
      uniqueUrls.add(item.normalizedUrl)
      if (!getPredicateIdByName(item.predicateName)) {
        uniqueNewPredicates.add(item.predicateName)
      }
      if (item.interestContext) hasContext = true
    }

    const needsContextPredicateAtom =
      hasContext && !getPredicateIdByName(PREDICATE_NAMES.IN_CONTEXT_OF)

    return {
      newObjectAtoms: uniqueUrls.size,
      newPredicateAtoms: uniqueNewPredicates.size,
      needsContextPredicateAtom
    }
  }

  // Helper: get predicate name from intention
  static getPredicateName(intention: IntentionPurpose): string {
    return INTENTION_PREDICATES[intention]
  }
}

export const cartService = new CartServiceClass()
export { CartServiceClass }
