import { useState, useCallback } from "react"
import { useCreateTripleOnChain } from "./useCreateTripleOnChain"
import { useWalletFromStorage } from "./useWalletFromStorage"
import { cartService, questTrackingService } from "~/lib/services"
import { createHookLogger } from "~/lib/utils"
import type { CartItemRecord } from "~/lib/database"
import type { BatchTripleResult } from "~/types/blockchain"

const logger = createHookLogger("useCartSubmit")

export const useCartSubmit = () => {
  const { createTriplesBatch } = useCreateTripleOnChain()
  const { walletAddress } = useWalletFromStorage()
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<BatchTripleResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submitCart = useCallback(
    async (items: CartItemRecord[], customWeight?: bigint) => {
      if (!walletAddress || items.length === 0) return

      setSubmitting(true)
      setError(null)
      setResult(null)

      try {
        const batchInputs = cartService.toBatchInputs(items)

        // Apply shared weight to all inputs
        if (customWeight) {
          for (const input of batchInputs) {
            input.customWeight = customWeight
          }
        }

        logger.info("Submitting cart batch", {
          count: batchInputs.length,
          weight: customWeight?.toString()
        })

        const batchResult = await createTriplesBatch(batchInputs)

        setResult(batchResult)

        if (batchResult.success) {
          // Clear submitted items from cart
          await cartService.clearCart(walletAddress)

          // Track certifications for quest system
          for (let i = 0; i < items.length; i++) {
            questTrackingService.recordCertificationActivity()
          }

          logger.info("Cart batch submitted successfully", {
            created: batchResult.createdCount,
            deposited: batchResult.depositCount
          })
        } else {
          setError("Some certifications failed. Check results.")
          logger.error("Cart batch partially failed", {
            failed: batchResult.failedTriples.length
          })
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
        logger.error("Cart batch submission failed", { error: msg })
      } finally {
        setSubmitting(false)
      }
    },
    [walletAddress, createTriplesBatch]
  )

  const reset = useCallback(() => {
    setSubmitting(false)
    setResult(null)
    setError(null)
  }, [])

  return { submitCart, submitting, result, error, reset }
}
