import { useState, useCallback } from "react"
import { getClients } from "../lib/clients/viemClients"
import { SofiaFeeProxyAbi } from "../ABI/SofiaFeeProxy"
import { SELECTED_CHAIN } from "../lib/config/chainConfig"
import { useCreateAtom } from "./useCreateAtom"
import { useWalletFromStorage } from "./useWalletFromStorage"
import { BlockchainService } from "../lib/services"
import { createHookLogger } from "../lib/utils/logger"
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

// Curve IDs
const CREATION_CURVE_ID = 1n
const DEPOSIT_CURVE_ID = 2n

export type VoteType = "like" | "dislike"

export interface VoteOnTripleResult {
  vote: (tripleTermId: string, voteType: VoteType) => Promise<void>
  reset: () => void
  loading: boolean
  error: string | null
  success: boolean
  votingTripleId: string | null
}

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

  // Get or create the predicate atom for "like" or "dislike"
  const getPredicateId = async (voteType: VoteType): Promise<string> => {
    const existingId =
      voteType === "like" ? PREDICATE_IDS.LIKE : PREDICATE_IDS.DISLIKE
    if (existingId) return existingId

    // Predicate doesn't exist yet — create it
    logger.info("Creating predicate atom on-demand", { voteType })
    const pinned = await pinAtomToIPFS({
      name: voteType,
      description: `Predicate representing the relation "${voteType}"`,
      url: ""
    })
    const created = await createAtomsFromPinned([pinned])
    const result = created[voteType]
    if (!result?.vaultId) {
      throw new Error(`Failed to create "${voteType}" predicate atom`)
    }
    return result.vaultId
  }

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
        await ensureProxyApproval()

        const predicateId = await getPredicateId(voteType)
        const subjectId = SUBJECT_IDS.I

        logger.info("Creating vote triple", {
          voteType,
          tripleTermId,
          predicateId,
          subjectId
        })

        // Check if vote triple already exists
        const tripleCheck = await BlockchainService.checkTripleExists(
          subjectId,
          predicateId,
          tripleTermId
        )

        const { walletClient, publicClient } = await getClients()
        const contractAddress = BlockchainService.getContractAddress()

        if (tripleCheck.exists) {
          // Triple exists — deposit on it
          const totalDepositCost =
            await BlockchainService.getTotalDepositCost(VOTE_STAKE)

          logger.debug("Vote triple exists, depositing", {
            tripleVaultId: tripleCheck.tripleVaultId,
            totalDepositCost: totalDepositCost.toString()
          })

          await publicClient.simulateContract({
            address: contractAddress as Address,
            abi: SofiaFeeProxyAbi,
            functionName: "deposit",
            args: [
              address as Address,
              tripleCheck.tripleVaultId as Address,
              DEPOSIT_CURVE_ID,
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
              DEPOSIT_CURVE_ID,
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

          logger.info("Vote deposit successful", { txHash: hash, voteType })
        } else {
          // Triple does not exist — create it
          const tripleCost = await BlockchainService.getTripleCost()
          const multiVaultCost = tripleCost + VOTE_STAKE
          const totalCost = await BlockchainService.getTotalCreationCost(
            1,
            VOTE_STAKE,
            multiVaultCost
          )

          logger.debug("Creating new vote triple", {
            totalCost: totalCost.toString()
          })

          await publicClient.simulateContract({
            address: contractAddress as Address,
            abi: SofiaFeeProxyAbi,
            functionName: "createTriples",
            args: [
              address as Address,
              [subjectId as Address],
              [predicateId as Address],
              [tripleTermId as Address],
              [VOTE_STAKE],
              CREATION_CURVE_ID
            ],
            value: totalCost,
            account: walletClient.account
          })

          const hash = await walletClient.writeContract({
            address: contractAddress as Address,
            abi: SofiaFeeProxyAbi,
            functionName: "createTriples",
            args: [
              address as Address,
              [subjectId as Address],
              [predicateId as Address],
              [tripleTermId as Address],
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
