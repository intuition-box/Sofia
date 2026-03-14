import { useSyncExternalStore, useEffect, useCallback } from "react"
import { useWalletFromStorage } from "./useWalletFromStorage"
import { cartService } from "~/lib/services"
import { normalizeUrl, createHookLogger } from "~/lib/utils"
import type { IntentionPurpose } from "~/types/discovery"

const logger = createHookLogger("useCart")

export const useCart = () => {
  const { walletAddress } = useWalletFromStorage()
  const state = useSyncExternalStore(
    cartService.subscribe,
    cartService.getSnapshot
  )

  // Load cart when wallet changes
  useEffect(() => {
    if (walletAddress) {
      cartService.loadCart(walletAddress)
    }
  }, [walletAddress])

  const addToCart = useCallback(
    (
      url: string,
      pageTitle: string | null,
      predicateName: string,
      intention: IntentionPurpose | null,
      faviconUrl: string | null
    ) => {
      if (!walletAddress) return Promise.resolve(false)
      return cartService.addItem(
        walletAddress,
        url,
        pageTitle,
        predicateName,
        intention,
        faviconUrl
      )
    },
    [walletAddress]
  )

  const removeFromCart = useCallback(
    (itemId: string) => cartService.removeItem(itemId),
    []
  )

  const clearCart = useCallback(() => {
    if (walletAddress) cartService.clearCart(walletAddress)
  }, [walletAddress])

  const isInCart = useCallback(
    (url: string, predicateName: string) => {
      const { label } = normalizeUrl(url)
      return cartService.hasItem(label, predicateName)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state]
  )

  return {
    items: state.items,
    count: state.count,
    addToCart,
    removeFromCart,
    clearCart,
    isInCart
  }
}
