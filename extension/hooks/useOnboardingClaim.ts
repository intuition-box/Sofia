import { useState, useCallback } from "react"
import { useIntentionCertify } from "./useIntentionCertify"
import { useWalletFromStorage } from "./useWalletFromStorage"
import { createHookLogger } from "~/lib/utils"

const logger = createHookLogger("useOnboardingClaim")

const TOTAL_STEPS = 6

export interface UseOnboardingClaimResult {
  step: number
  nextStep: () => void
  loading: boolean
  success: boolean
  error: string | null
  transactionHash: string | null
  operationType: "created" | "deposit" | null
  submitClaim: (weight: bigint) => Promise<void>
  reset: () => void
  hasCompletedFirstClaim: () => Promise<boolean>
  storeFirstTxFlag: () => Promise<void>
}

export const useOnboardingClaim = (
  url: string
): UseOnboardingClaimResult => {
  const [step, setStep] = useState(1)
  const { walletAddress } = useWalletFromStorage()

  const {
    certifyWithCustomPredicate,
    reset: resetCertify,
    loading,
    success,
    error,
    transactionHash,
    operationType
  } = useIntentionCertify()

  const nextStep = useCallback(() => {
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS))
  }, [])

  const submitClaim = useCallback(
    async (weight: bigint) => {
      if (!walletAddress) return
      logger.info("Submitting first claim", { url, weight: weight.toString() })
      await certifyWithCustomPredicate(
        url,
        "trusts",
        undefined,
        "Sofia",
        weight
      )
    },
    [walletAddress, url, certifyWithCustomPredicate]
  )

  const storeFirstTxFlag = useCallback(async () => {
    if (!walletAddress) return
    const key = `first_claim_done_${walletAddress.toLowerCase()}`
    await chrome.storage.local.set({ [key]: true })
    logger.info("First claim flag stored", { wallet: walletAddress })
  }, [walletAddress])

  const hasCompletedFirstClaim = useCallback(async () => {
    if (!walletAddress) return false
    const key = `first_claim_done_${walletAddress.toLowerCase()}`
    const result = await chrome.storage.local.get(key)
    return !!result[key]
  }, [walletAddress])

  const reset = useCallback(() => {
    setStep(1)
    resetCertify()
  }, [resetCertify])

  return {
    step,
    nextStep,
    loading,
    success,
    error,
    transactionHash,
    operationType,
    submitClaim,
    reset,
    hasCompletedFirstClaim,
    storeFirstTxFlag
  }
}
