import { useState, useCallback } from "react"
import { useWalletFromStorage } from "./useWalletFromStorage"
import { useCreateAtom } from "./useCreateAtom"
import { tripleService } from "~/lib/services"
import { createHookLogger } from "~/lib/utils"
import { ERROR_MESSAGES, SUBJECT_IDS, PREDICATE_IDS } from "~/lib/config/constants"
import type { Hex } from "viem"

const logger = createHookLogger("useTrustAccount")

// Linear curve for trust triples
const TRUST_CURVE_ID = 1n

export interface TrustAccountResult {
  trustAccount: (
    accountTermId: string,
    accountLabel: string,
    customWeight?: bigint
  ) => Promise<void>
  loading: boolean
  error: string | null
  success: boolean
  tripleVaultId: string | null
  operationType: "created" | "deposit" | null
  transactionHash: string | null
}

export const useTrustAccount = (): TrustAccountResult => {
  const { walletAddress: address } = useWalletFromStorage()
  const { ensureProxyApproval } = useCreateAtom()

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tripleVaultId, setTripleVaultId] = useState<string | null>(null)
  const [operationType, setOperationType] = useState<
    "created" | "deposit" | null
  >(null)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)

  const trustAccount = useCallback(
    async (
      accountTermId: string,
      accountLabel: string,
      customWeight?: bigint
    ) => {
      try {
        if (!address) {
          throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED)
        }

        if (accountTermId.length !== 66) {
          throw new Error(
            `Invalid termId format: ${accountTermId} (expected bytes32)`
          )
        }

        logger.info("Creating trust triple", {
          accountTermId,
          accountLabel,
          customWeight: customWeight?.toString()
        })

        setLoading(true)
        setSuccess(false)
        setError(null)
        setTransactionHash(null)
        setTripleVaultId(null)
        setOperationType(null)

        // Ensure proxy is approved (was missing before — bug fix)
        await ensureProxyApproval()

        // Delegate to TripleService (linear curve for trust)
        const result = await tripleService.createTripleOnChain(
          SUBJECT_IDS.I as Hex,
          PREDICATE_IDS.TRUSTS as Hex,
          accountTermId as Hex,
          address,
          customWeight,
          TRUST_CURVE_ID
        )

        logger.info("Trust triple created", {
          method: result.source,
          txHash: result.txHash,
          tripleVaultId: result.tripleVaultId
        })

        setLoading(false)
        setSuccess(true)
        setTripleVaultId(result.tripleVaultId)
        setOperationType(result.source === "created" ? "created" : "deposit")
        setTransactionHash(result.txHash)
      } catch (err) {
        logger.error("Trust account creation failed", err)

        const errorMessage =
          err instanceof Error ? err.message : ERROR_MESSAGES.UNKNOWN_ERROR

        // TripleService handles triple-exists internally (deposit fallback),
        // so MultiVault_TripleExists should not reach here.
        // But keep safety check for edge cases.
        if (errorMessage.includes("MultiVault_TripleExists")) {
          logger.info("Triple already exists, treating as success")
          setLoading(false)
          setSuccess(true)
          setError(null)
        } else {
          setLoading(false)
          setError(errorMessage)
        }
      }
    },
    [address, ensureProxyApproval]
  )

  return {
    trustAccount,
    loading,
    error,
    success,
    tripleVaultId,
    operationType,
    transactionHash
  }
}
