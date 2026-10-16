import { useCallback, useState } from "react"

import type { CartItemRecord } from "~/lib/database"
import { cartService, certificationService } from "~/lib/services"
import type { BatchTripleResult } from "~/types/blockchain"

import { useWalletFromStorage } from "./useWalletFromStorage"

/** Thin facade over CertificationService.submitCart, exposing UI state. */
export const useCartSubmit = () => {
  const { walletAddress } = useWalletFromStorage()
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<BatchTripleResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [voteCount, setVoteCount] = useState(0)

  const submitCart = useCallback(
    async (items: CartItemRecord[], customWeight?: bigint) => {
      if (!walletAddress || items.length === 0) return

      setSubmitting(true)
      setError(null)
      setResult(null)
      setVoteCount(0)

      try {
        const outcome = await certificationService.submitCart(
          walletAddress,
          items,
          customWeight
        )
        setResult(outcome.batchResult)
        setVoteCount(outcome.votesSucceeded)
        setError(outcome.error)
      } finally {
        setSubmitting(false)
      }
    },
    [walletAddress]
  )

  const clearSubmittedItems = useCallback(async () => {
    if (walletAddress) {
      await cartService.clearCart(walletAddress)
    }
  }, [walletAddress])

  const reset = useCallback(() => {
    setSubmitting(false)
    setResult(null)
    setError(null)
  }, [])

  return {
    submitCart,
    submitting,
    result,
    error,
    reset,
    clearSubmittedItems,
    voteCount
  }
}
