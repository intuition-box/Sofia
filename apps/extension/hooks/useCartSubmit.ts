import { useState, useCallback } from "react"
import { useCreateTripleOnChain } from "./useCreateTripleOnChain"
import { useWeightOnChain } from "./useWeightOnChain"
import { useWalletFromStorage } from "./useWalletFromStorage"
import { cartService, questTrackingService, goldService, txEventBus } from "~/lib/services"
import { createHookLogger } from "~/lib/utils"
import { TOPIC_ATOM_IDS } from "~/lib/config/topicConfig"
import type { CartItemRecord } from "~/lib/database"
import type { BatchTripleResult } from "~/types/blockchain"

const logger = createHookLogger("useCartSubmit")

export const useCartSubmit = () => {
  const { createTriplesBatch, createContextTriplesBatch } = useCreateTripleOnChain()
  const { depositWithPool } = useWeightOnChain()
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
        const certItems = items.filter(item => !item.voteAction)
        const voteItems = cartService.getVoteItems(items)
        let batchResult: BatchTripleResult | null = null

        // 1. Process certifications
        if (certItems.length > 0) {
          const batchInputs = cartService.toBatchInputs(certItems)

          if (customWeight) {
            for (const input of batchInputs) {
              input.customWeight = customWeight
            }
          }

          logger.info("Submitting cart certifications", {
            count: batchInputs.length,
            weight: customWeight?.toString()
          })

          batchResult = await createTriplesBatch(batchInputs)
        }

        // 2. Process votes via depositWithPool (curve 1n)
        let votesSucceeded = 0
        if (voteItems.length > 0) {
          const voteWeight = customWeight || BigInt(Math.floor(0.5 * 1e18))

          for (const vote of voteItems) {
            if (!vote.tripleTermId) continue
            try {
              const voteResult = await depositWithPool(
                vote.tripleTermId,
                voteWeight,
                1n // Curve 1n for votes
              )
              if (voteResult.success) {
                votesSucceeded++
                // Track vote for Gold
                try {
                  await questTrackingService.recordVoteActivity()
                  const dailyCount = await questTrackingService.getDailyVoteCount()
                  await goldService.addVoteGold(walletAddress, dailyCount)
                } catch {
                  // Non-critical
                }
              } else {
                logger.error("Vote deposit failed", {
                  tripleTermId: vote.tripleTermId,
                  error: voteResult.error
                })
              }
            } catch (err) {
              logger.error("Vote deposit error", { error: err })
            }
          }
          setVoteCount(votesSucceeded)
        }

        // 3. Process interest context triples (TX2 — nested triples)
        if (batchResult?.success) {
          const contextItems = certItems
            .filter(item => item.interestContext)
            .map((item, i) => {
              const tripleVaultId = batchResult.results[i]?.tripleVaultId
              const topicTermId = TOPIC_ATOM_IDS[item.interestContext!]
              return tripleVaultId && topicTermId
                ? { certTripleVaultId: tripleVaultId, topicTermId }
                : null
            })
            .filter(Boolean) as { certTripleVaultId: string; topicTermId: string }[]

          if (contextItems.length > 0) {
            try {
              logger.info("Submitting context triples", { count: contextItems.length })
              await createContextTriplesBatch(contextItems)
              logger.info("Context triples submitted successfully")
            } catch (ctxError) {
              // Non-blocking: cert succeeded, context is bonus
              logger.warn("Context triples failed (non-blocking)", { error: ctxError })
            }
          }
        }

        // Build combined result
        if (batchResult) {
          setResult(batchResult)

          if (batchResult.success) {
            for (let i = 0; i < certItems.length; i++) {
              questTrackingService.recordCertificationActivity()
            }
            logger.info("Cart batch submitted successfully", {
              created: batchResult.createdCount,
              deposited: batchResult.depositCount,
              votes: votesSucceeded
            })
            txEventBus.emit("batch_certification", batchResult.results[0]?.txHash)
          } else {
            setError("Some certifications failed. Check results.")
            logger.error("Cart batch partially failed", {
              failed: batchResult.failedTriples.length
            })
          }
        } else if (voteItems.length > 0) {
          // Votes only — create a synthetic result
          setResult({
            success: votesSucceeded > 0,
            results: [],
            failedTriples: [],
            createdCount: 0,
            depositCount: votesSucceeded
          })
          if (votesSucceeded > 0) {
            logger.info("Vote-only cart submitted", { votes: votesSucceeded })
            txEventBus.emit("vote")
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
        logger.error("Cart batch submission failed", { error: msg })
      } finally {
        setSubmitting(false)
      }
    },
    [walletAddress, createTriplesBatch, depositWithPool]
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

  return { submitCart, submitting, result, error, reset, clearSubmittedItems, voteCount }
}
