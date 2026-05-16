import { useCallback, useState } from "react"

import { TOPIC_ATOM_IDS } from "~/lib/config/topicConfig"
import type { CartItemRecord } from "~/lib/database"
import {
  BlockchainService,
  cartService,
  goldService,
  questTrackingService,
  txEventBus
} from "~/lib/services"
import { createHookLogger } from "~/lib/utils"
import type { BatchTripleResult } from "~/types/blockchain"

import { useCreateTripleOnChain } from "./useCreateTripleOnChain"
import { useWalletFromStorage } from "./useWalletFromStorage"
import { useWeightOnChain } from "./useWeightOnChain"

const logger = createHookLogger("useCartSubmit")

export const useCartSubmit = () => {
  const { createTriplesBatch, createContextTriplesBatch } =
    useCreateTripleOnChain()
  const { depositWithPool } = useWeightOnChain()
  const { walletAddress } = useWalletFromStorage()
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<BatchTripleResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [voteCount, setVoteCount] = useState(0)

  const submitCart = useCallback(
    async (items: CartItemRecord[], customWeight?: bigint) => {
      if (!walletAddress || items.length === 0) return

      // Refuse to sign for cart items that don't belong to the active wallet.
      // An async wallet swap between cart load and submit (chrome.storage
      // listeners are independent) could otherwise cause the user to sign a
      // batch they never assembled.
      const submitter = walletAddress.toLowerCase()
      const orphan = items.find(
        (item) => item.walletAddress.toLowerCase() !== submitter
      )
      if (orphan) {
        const msg = "Cart wallet mismatch — refresh the cart"
        logger.error(msg, {
          submitter,
          orphanWallet: orphan.walletAddress,
          orphanId: orphan.id
        })
        setError(msg)
        return
      }

      setSubmitting(true)
      setError(null)
      setResult(null)
      setVoteCount(0)

      try {
        const certItems = items.filter((item) => !item.voteAction)
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

          // Verify all vote target triples exist on-chain before depositing.
          // A poisoned indexer or stale cart entry could otherwise route TRUST
          // into an attacker-controlled vault. Single multicall3 roundtrip.
          const termIds = voteItems
            .map((v) => v.tripleTermId)
            .filter((id): id is string => !!id)
          const existsMap =
            await BlockchainService.checkTriplesExistByTermIds(termIds)

          for (const vote of voteItems) {
            if (!vote.tripleTermId) continue
            if (!existsMap.get(vote.tripleTermId)) {
              logger.warn("Skip vote: triple does not exist on-chain", {
                tripleTermId: vote.tripleTermId
              })
              continue
            }
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
                  const dailyCount =
                    await questTrackingService.getDailyVoteCount()
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
            .filter((item) => item.interestContext)
            .map((item) => {
              // Look up the triple vault by stable input key. Indexing into
              // `batchResult.results` positionally is wrong: the service
              // reorders entries (created first, then deposits) after dedup.
              const inputKey = `${item.predicateName}|${item.url}`
              const tripleVaultId = batchResult.vaultIdByInputKey?.[inputKey]
              const topicTermId = TOPIC_ATOM_IDS[item.interestContext!]
              if (!tripleVaultId) {
                logger.warn("Skip context triple: no vaultId resolved", {
                  inputKey,
                  interestContext: item.interestContext
                })
              }
              return tripleVaultId && topicTermId
                ? { certTripleVaultId: tripleVaultId, topicTermId }
                : null
            })
            .filter(Boolean) as {
            certTripleVaultId: string
            topicTermId: string
          }[]

          if (contextItems.length > 0) {
            try {
              logger.info("Submitting context triples", {
                count: contextItems.length
              })
              await createContextTriplesBatch(contextItems)
              logger.info("Context triples submitted successfully")
            } catch (ctxError) {
              // Non-blocking: cert succeeded, context is bonus
              logger.warn("Context triples failed (non-blocking)", {
                error: ctxError
              })
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
            // URLs are now validated on-chain — empty the cart immediately
            // (incl. items that were already in the cart before this run).
            // The reward screen renders from its own snapshot, so this is safe.
            await cartService.clearCart(walletAddress)
            logger.info("Cart batch submitted successfully", {
              created: batchResult.createdCount,
              deposited: batchResult.depositCount,
              votes: votesSucceeded
            })
            txEventBus.emit(
              "batch_certification",
              batchResult.results[0]?.txHash
            )
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
            await cartService.clearCart(walletAddress)
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
