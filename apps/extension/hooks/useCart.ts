import { useSyncExternalStore, useEffect, useCallback } from "react"
import { useWalletFromStorage } from "./useWalletFromStorage"
import { cartService } from "~/lib/services"
import { normalizeUrl } from "~/lib/utils"
import type { IntentionPurpose } from "~/types/discovery"

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
      faviconUrl: string | null,
      interestContext?: string | null
    ) => {
      if (!walletAddress) return Promise.resolve(false)
      return cartService.addItem(
        walletAddress,
        url,
        pageTitle,
        predicateName,
        intention,
        faviconUrl,
        interestContext
      )
    },
    [walletAddress]
  )

  const removeFromCart = useCallback(
    (itemId: string) => cartService.removeItem(itemId),
    []
  )

  const updateContextForUrl = useCallback(
    (url: string, interestContext: string | null) => {
      if (!walletAddress) return Promise.resolve()
      return cartService.updateContextForUrl(walletAddress, url, interestContext)
    },
    [walletAddress]
  )

  const clearCart = useCallback(() => {
    if (walletAddress) cartService.clearCart(walletAddress)
  }, [walletAddress])

  const addVoteToCart = useCallback(
    (
      url: string,
      pageTitle: string | null,
      predicateName: string,
      intention: IntentionPurpose | null,
      faviconUrl: string | null,
      voteAction: "support" | "oppose",
      tripleTermId: string
    ) => {
      if (!walletAddress) return Promise.resolve(false)
      return cartService.addVoteItem(
        walletAddress,
        url,
        pageTitle,
        predicateName,
        intention,
        faviconUrl,
        voteAction,
        tripleTermId
      )
    },
    [walletAddress]
  )

  const isInCart = useCallback(
    (url: string, predicateName: string) => {
      const { label } = normalizeUrl(url)
      return cartService.hasItem(label, predicateName)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state]
  )

  const isVoteInCart = useCallback(
    (url: string, predicateName: string, voteAction: "support" | "oppose") => {
      try {
        const { label } = normalizeUrl(url)
        return cartService.hasVoteInCart(label, predicateName, voteAction)
      } catch {
        return false
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state]
  )

  const hasConflictingVote = useCallback(
    (url: string, predicateName: string, voteAction: "support" | "oppose") => {
      try {
        const { label } = normalizeUrl(url)
        return cartService.hasConflictingVote(label, predicateName, voteAction)
      } catch {
        return false
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state]
  )

  return {
    items: state.items,
    count: state.count,
    addToCart,
    addVoteToCart,
    removeFromCart,
    updateContextForUrl,
    clearCart,
    isInCart,
    isVoteInCart,
    hasConflictingVote
  }
}
