import { useState, useCallback } from "react"
import { useCreateAtom } from "./useCreateAtom"
import { useWalletFromStorage } from "./useWalletFromStorage"
import { getClients } from "../lib/clients/viemClients"
import { SofiaFeeProxyAbi } from "../ABI/SofiaFeeProxy"
import { SELECTED_CHAIN } from "../lib/config/chainConfig"
import { BlockchainService } from "../lib/services"
import { createHookLogger } from "../lib/utils/logger"
import { questTrackingService } from "../lib/services/QuestTrackingService"
import { goldService } from "../lib/services/GoldService"
import {
  BLOCKCHAIN_CONFIG,
  ERROR_MESSAGES,
  PREDICATE_IDS,
  SUBJECT_IDS
} from "../lib/config/constants"
import type { Address } from "../types/viem"

const logger = createHookLogger("useVoteOnTriple")

// 1 TRUST deposit per vote
const VOTE_STAKE = 1000000000000000000n
const CREATION_CURVE_ID = 1n

export type VoteType = "like" | "dislike"

export interface VoteOnTripleResult {
  vote: (tripleTermId: string, voteType: VoteType) => Promise<void>
  reset: () => void
  loading: boolean
  error: string | null
  success: boolean
  votingTripleId: string | null
}

/**
 * Vote on a certification triple by creating a nested triple:
 *   I | like/dislike | <certificationTripleTermId>
 *
 * The object IS the certification triple itself (referenced by its term_id).
 * This creates a TRUE nested triple — no new atom is created for the object.
 *
 * Uses direct contract calls to bypass createTripleOnChain (which always
 * creates a new IPFS atom for the object). Only the predicate atom
 * ("like"/"dislike") is created via IPFS if it doesn't exist yet.
 */
export const useVoteOnTriple = (): VoteOnTripleResult => {
  const {
    pinAtomToIPFS,
    createAtomsFromPinned,
    ensureProxyApproval
  } = useCreateAtom()
  const { walletAddress: address } = useWalletFromStorage()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [votingTripleId, setVotingTripleId] = useState<string | null>(null)

  const vote = useCallback(
    async (tripleTermId: string, voteType: VoteType) => {
      if (!address) {
        setError(ERROR_MESSAGES.WALLET_NOT_CONNECTED)
        return
      }
      if (!tripleTermId) {
        setError("Missing triple term ID")
        return
      }

      setLoading(true)
      setError(null)
      setSuccess(false)
      setVotingTripleId(tripleTermId)

      try {
        logger.info("Creating vote triple", { voteType, tripleTermId })

        // 1. Ensure proxy is approved (one-time)
        await ensureProxyApproval()

        // 2. Get or create the predicate atom ("like" or "dislike")
        const existingPredicateId =
          voteType === "like"
            ? PREDICATE_IDS.LIKE || null
            : PREDICATE_IDS.DISLIKE || null

        let predicateId: string

        if (existingPredicateId) {
          predicateId = existingPredicateId
        } else {
          // Create predicate atom via IPFS pin + on-chain creation
          const pinnedPredicate = await pinAtomToIPFS({
            name: voteType,
            description: `Predicate representing the relation "${voteType}"`,
            url: ""
          })
          const createdAtoms = await createAtomsFromPinned([pinnedPredicate])
          predicateId = createdAtoms[voteType].vaultId
        }

        // 3. Subject = universal "I"
        //    Object = tripleTermId directly (the certification triple's own term_id)
        const subjectId = SUBJECT_IDS.I
        const objectId = tripleTermId

        // 4. Check if vote triple already exists
        const tripleCheck = await BlockchainService.checkTripleExists(
          subjectId,
          predicateId,
          objectId
        )

        const { walletClient, publicClient } = await getClients()
        const contractAddress = BlockchainService.getContractAddress()

        if (tripleCheck.exists) {
          // 5a. Vote triple exists → deposit additional stake (linear curve, same as creation)
          const curveId = CREATION_CURVE_ID
          const totalDepositCost =
            await BlockchainService.getTotalDepositCost(VOTE_STAKE)

          logger.info("Vote triple exists, depositing", {
            tripleVaultId: tripleCheck.tripleVaultId,
            depositAmount: VOTE_STAKE.toString()
          })

          await publicClient.simulateContract({
            address: contractAddress as Address,
            abi: SofiaFeeProxyAbi,
            functionName: "deposit",
            args: [
              address as Address,
              tripleCheck.tripleVaultId as Address,
              curveId,
              0n
            ],
            value: totalDepositCost,
            account: walletClient.account
          })

          const hash = await walletClient.writeContract({
            address: contractAddress as Address,
            abi: SofiaFeeProxyAbi,
            functionName: "deposit",
            args: [
              address as Address,
              tripleCheck.tripleVaultId as Address,
              curveId,
              0n
            ],
            value: totalDepositCost,
            chain: SELECTED_CHAIN,
            maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
            maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
            account: address as Address
          })

          const receipt = await publicClient.waitForTransactionReceipt({
            hash
          })
          if (receipt.status !== "success") {
            throw new Error(
              `${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`
            )
          }

          logger.info("Vote deposit successful", {
            tripleVaultId: tripleCheck.tripleVaultId,
            txHash: hash,
            voteType
          })
        } else {
          // 5b. Vote triple doesn't exist → create it
          const tripleCost = await BlockchainService.getTripleCost()
          const multiVaultCost = tripleCost + VOTE_STAKE
          const totalCost =
            await BlockchainService.getTotalCreationCost(
              1,
              VOTE_STAKE,
              multiVaultCost
            )

          logger.info("Creating new vote triple", {
            subjectId,
            predicateId,
            objectId,
            totalCost: totalCost.toString()
          })

          // Simulate first
          await publicClient.simulateContract({
            address: contractAddress as Address,
            abi: SofiaFeeProxyAbi,
            functionName: "createTriples",
            args: [
              address as Address,
              [subjectId as Address],
              [predicateId as Address],
              [objectId as Address],
              [VOTE_STAKE],
              CREATION_CURVE_ID
            ],
            value: totalCost,
            account: walletClient.account
          })

          // Execute
          const hash = await walletClient.writeContract({
            address: contractAddress as Address,
            abi: SofiaFeeProxyAbi,
            functionName: "createTriples",
            args: [
              address as Address,
              [subjectId as Address],
              [predicateId as Address],
              [objectId as Address],
              [VOTE_STAKE],
              CREATION_CURVE_ID
            ],
            value: totalCost,
            chain: SELECTED_CHAIN,
            maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
            maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
            account: address as Address
          })

          const receipt = await publicClient.waitForTransactionReceipt({
            hash
          })
          if (receipt.status !== "success") {
            throw new Error(
              `${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`
            )
          }

          logger.info("Vote triple created", { txHash: hash, voteType })
        }

        setSuccess(true)

        // Track vote activity for quests + award Gold
        try {
          await questTrackingService.recordVoteActivity()
          const dailyCount = await questTrackingService.getDailyVoteCount()
          if (address) {
            await goldService.addVoteGold(address, dailyCount)
          }
        } catch (trackErr) {
          logger.warn("Failed to track vote activity", { error: trackErr })
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : ERROR_MESSAGES.UNKNOWN_ERROR
        logger.error("Vote failed", { error: msg })
        setError(msg)
      } finally {
        setLoading(false)
        setVotingTripleId(null)
      }
    },
    [address, ensureProxyApproval, pinAtomToIPFS, createAtomsFromPinned]
  )

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setSuccess(false)
    setVotingTripleId(null)
  }, [])

  return { vote, reset, loading, error, success, votingTripleId }
}
