import { useState, useEffect, useMemo, useCallback } from "react"
import { createPortal } from "react-dom"
import { useBalance } from "wagmi"
import { formatUnits, getAddress } from "viem"
import SofiaLoader from "../ui/SofiaLoader"
import {
  useWalletFromStorage,
  useFeeEstimate,
  useOnboardingClaim
} from "~/hooks"
import { EXPLORER_URLS } from "~/lib/config/chainConfig"
import { getIntentionBadge } from "~/types/intentionCategories"
import { createHookLogger } from "~/lib/utils"
import "../styles/OnboardingClaimModal.css"

const logger = createHookLogger("OnboardingClaimModal")

type WeightOption = {
  id: "minimum" | "default" | "strong" | "high" | "max" | "custom"
  label: string
  value: number | null
  description: string
}

const weightOptions: WeightOption[] = [
  { id: "minimum", label: "Minimum", value: 0.01, description: "0.01 TRUST" },
  { id: "default", label: "Default", value: 0.5, description: "0.5 TRUST" },
  { id: "strong", label: "Strong", value: 1, description: "1 TRUST" },
  { id: "high", label: "High", value: 5, description: "5 TRUST" },
  { id: "max", label: "Max", value: 10, description: "10 TRUST" }
]

const STEP_HINTS = [
  "This is your first claim — you recommend this page on the Intuition protocol.",
  "Choose how much TRUST to stake on this signal.",
  "Your stake goes to this page — it stays your position.",
  "Review the total cost before confirming.",
  "Confirm your first claim on-chain!"
]

interface OnboardingClaimModalProps {
  isOpen: boolean
  url: string
  onClose: () => void
  onComplete: () => void
}

const OnboardingClaimModal = ({
  isOpen,
  url,
  onClose,
  onComplete
}: OnboardingClaimModalProps) => {
  const {
    step,
    nextStep,
    loading: txLoading,
    success: txSuccess,
    error: txError,
    transactionHash,
    operationType,
    submitClaim,
    reset,
    hasCompletedFirstClaim,
    storeFirstTxFlag
  } = useOnboardingClaim(url)

  const [selectedWeight, setSelectedWeight] =
    useState<WeightOption["id"] | null>(null)
  const [customValue, setCustomValue] = useState("")
  const [processingStep, setProcessingStep] = useState("")
  const [alreadyClaimed, setAlreadyClaimed] = useState(false)

  const { walletAddress } = useWalletFromStorage()
  const { estimate } = useFeeEstimate()

  const checksumAddress = walletAddress ? getAddress(walletAddress) : undefined
  const { data: balanceData } = useBalance({ address: checksumAddress })
  const userBalance = balanceData
    ? parseFloat(formatUnits(balanceData.value, balanceData.decimals))
    : 0

  // Check if already claimed on mount
  useEffect(() => {
    if (isOpen && walletAddress) {
      hasCompletedFirstClaim().then((done) => {
        if (done) {
          setAlreadyClaimed(true)
          logger.info("First claim already completed, skipping modal")
          onClose()
        }
      })
    }
  }, [isOpen, walletAddress, hasCompletedFirstClaim, onClose])

  // Processing animation steps
  useEffect(() => {
    if (txLoading) {
      const steps = [
        "Preparing triples...",
        "Creating atoms...",
        "Publishing to blockchain...",
        "Confirming transaction..."
      ]
      let stepIndex = 0
      setProcessingStep(steps[0])
      const interval = setInterval(() => {
        stepIndex = (stepIndex + 1) % steps.length
        setProcessingStep(steps[stepIndex])
      }, 2000)
      return () => clearInterval(interval)
    } else {
      setProcessingStep("")
    }
  }, [txLoading])

  // On TX success → store flag + auto-redirect after 2s
  useEffect(() => {
    if (txSuccess) {
      storeFirstTxFlag()
      const timeout = setTimeout(() => {
        onComplete()
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [txSuccess, storeFirstTxFlag, onComplete])

  // Compute cost breakdown
  const breakdown = useMemo(() => {
    const minimumValue = weightOptions.find((opt) => opt.id === "minimum")!
      .value!
    const defaultValue = weightOptions.find((opt) => opt.id === "default")!
      .value!

    let totalTrust: number
    if (selectedWeight === null) {
      totalTrust = 0
    } else if (selectedWeight === "custom") {
      totalTrust =
        customValue && customValue.trim() !== ""
          ? parseFloat(customValue) || 0
          : minimumValue
    } else {
      const opt = weightOptions.find((o) => o.id === selectedWeight)
      totalTrust = opt?.value ?? defaultValue
    }

    const createOpts = { isNewTriple: true, newAtomCount: 1 }

    const costEstimate =
      totalTrust > 0 ? (estimate?.(totalTrust, createOpts) ?? null) : null
    return {
      totalTrust,
      creationCost: costEstimate?.creationCost ?? 0,
      sofiaFixedFee: costEstimate?.sofiaFixedFee ?? 0,
      sofiaPercentFee: costEstimate?.sofiaPercentFee ?? 0,
      totalFees: costEstimate?.totalFees ?? 0,
      totalEstimate: costEstimate?.totalEstimate ?? totalTrust,
      depositCount: costEstimate?.depositCount ?? 1
    }
  }, [selectedWeight, customValue, estimate])

  const handleSubmit = useCallback(async () => {
    try {
      const minimumValue = weightOptions.find(
        (opt) => opt.id === "minimum"
      )!.value!
      const defaultValue = weightOptions.find(
        (opt) => opt.id === "default"
      )!.value!

      let trustValue: number
      if (selectedWeight === null) {
        return
      } else if (selectedWeight === "custom") {
        trustValue =
          customValue && customValue.trim() !== ""
            ? parseFloat(customValue)
            : minimumValue
      } else {
        const option = weightOptions.find((opt) => opt.id === selectedWeight)
        trustValue =
          !option || option.value === null ? defaultValue : option.value
      }

      const weightBigInt = BigInt(Math.floor(trustValue * 1e18))
      await submitClaim(weightBigInt)
    } catch (error) {
      logger.error("Failed to submit onboarding claim", error)
    }
  }, [selectedWeight, customValue, submitClaim])

  const handleClose = useCallback(() => {
    reset()
    setSelectedWeight(null)
    setCustomValue("")
    onClose()
  }, [reset, onClose])

  // Can continue to next step?
  const canContinue = useMemo(() => {
    if (step === 2) return selectedWeight !== null
    return true
  }, [step, selectedWeight])

  const handleContinue = useCallback(() => {
    if (!canContinue) return
    if (step === 5) {
      handleSubmit()
    } else {
      nextStep()
    }
  }, [step, nextStep, handleSubmit, canContinue])

  const formatTrust = (val: number): string => {
    if (val === 0) return "0"
    return parseFloat(val.toFixed(4)).toString()
  }

  const parseErrorMessage = (error: string): string => {
    if (
      error.includes("Wallet unavailable:") ||
      error.includes("navigate to an HTTPS page")
    ) {
      return error
    }
    const failedMatch = error.match(
      /(Shares addition failed|Weight addition failed):/i
    )
    const failedText = failedMatch ? failedMatch[0] : "Transaction failed:"
    const detailsMatch = error.match(/Details:\s*(.+?)(?:\n|$)/i)
    const detailsText = detailsMatch ? `Details: ${detailsMatch[1]}` : ""
    return detailsText ? `${failedText}\n${detailsText}` : failedText
  }

  const isFormState = !txSuccess && !txError
  const badge = getIntentionBadge("trusted")

  if (!isOpen || alreadyClaimed) return null

  // Restyled to share the Amplify (b3) editorial ticket — parchment surface,
  // drop-cap headline, b3 ledger + actions — while keeping the progressive
  // step machine (onboarding-section reveal) and useOnboardingClaim hook.
  return createPortal(
    <div
      className={`modal-overlay onboarding-claim-overlay ${txLoading ? "processing" : ""}`}
    >
      <div className="modal-content onboarding-claim-modal">
        <div className="amp b3 b3--v5">
          <div className="b3-bg b3-bg--v5" aria-hidden="true">
            <div className="b3-bg-hex b3-bg-hex--1" />
            <div className="b3-bg-hex b3-bg-hex--2" />
            <div className="b3-bg-hex b3-bg-hex--3" />
            <div className="b3-bg-grain" />
          </div>

          {txLoading && !txSuccess && (
            <div className="b3-loading" role="status" aria-live="polite">
              <SofiaLoader size={120} />
              <p className="b3-loading-title">Creating</p>
              <p className="b3-loading-step">{processingStep}</p>
              <p className="b3-loading-warn">
                Do not close or navigate away from this tab
              </p>
            </div>
          )}

          <div className="b3-ticket">
            <div className="b3-body">
              <div className="b3-headline">
                <span className="b3-drop">F</span>
                <h1 className="b3-h1">irst claim.</h1>
              </div>
              {isFormState && step >= 1 && step <= 5 && (
                <p className="b3-sub">{STEP_HINTS[step - 1]}</p>
              )}
              {isFormState && (
                <div className="onboarding-step-indicators">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div
                      key={s}
                      className={`onboarding-step-dot ${s === step ? "active" : ""} ${s < step ? "completed" : ""}`}
                    />
                  ))}
                </div>
              )}

              {/* Step 1+: Triple card */}
              {isFormState && (
                <div
                  className={`onboarding-section ${step >= 1 ? "visible" : ""} ${step === 1 ? "highlighted" : ""}`}
                >
                  <div className="weight-modal-triplet-card">
                    <div className="weight-modal-triplet-text">
                      {badge ? (
                        <span
                          className="weight-modal-cert-target"
                          style={{
                            borderColor: `${badge.color}40`,
                            backgroundColor: `${badge.color}0A`
                          }}
                        >
                          <span className="object">Sofia</span>
                          <span className="weight-modal-cert-dot">&middot;</span>
                          <span
                            className="weight-modal-intention-badge"
                            style={{ color: badge.color }}
                          >
                            {badge.label}
                          </span>
                        </span>
                      ) : (
                        <>
                          <span className="subject">I</span>{" "}
                          <span className="action">trust</span>{" "}
                          <span className="object">Sofia</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2+: Weight pills */}
              {isFormState && (
                <div
                  className={`onboarding-section ${step >= 2 ? "visible" : ""} ${step === 2 ? "highlighted" : ""}`}
                >
                  <div className="weight-modal-amount-row">
                    <input
                      type="number"
                      min="0"
                      step="0.000001"
                      value={
                        selectedWeight === null
                          ? ""
                          : selectedWeight === "custom"
                            ? customValue || ""
                            : weightOptions.find(
                                  (opt) => opt.id === selectedWeight
                                )?.value || ""
                      }
                      onChange={(e) => {
                        setSelectedWeight("custom")
                        setCustomValue(e.target.value)
                      }}
                      onFocus={(e) => {
                        setSelectedWeight("custom")
                        e.target.select()
                      }}
                      className="weight-modal-amount-input"
                      placeholder="0.01"
                      disabled={txLoading}
                    />
                    <div className="weight-modal-pills">
                      {weightOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setSelectedWeight(option.id)}
                          className={`weight-modal-pill ${selectedWeight === option.id ? "selected" : ""}`}
                          disabled={txLoading}
                        >
                          {option.value}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4+: Cost ledger (b3) */}
              {isFormState && (
                <div
                  className={`onboarding-section ${step >= 4 ? "visible" : ""} ${step === 4 ? "highlighted" : ""}`}
                >
                  <div className="b3-ledger">
                    <div className="b3-ledger-row">
                      <span>Deposit</span>
                      <span>{formatTrust(breakdown.totalTrust)} TRUST</span>
                    </div>
                    {breakdown.totalFees > 0 && (
                      <div className="b3-ledger-row">
                        <span>Fees</span>
                        <span>{formatTrust(breakdown.totalFees)} TRUST</span>
                      </div>
                    )}
                    <div className="b3-ledger-row b3-ledger-total">
                      <span>Total deposit</span>
                      <span>{formatTrust(breakdown.totalEstimate)} TRUST</span>
                    </div>
                    <div
                      className={`b3-ledger-row b3-ledger-row--muted ${breakdown.totalEstimate > userBalance ? "weight-modal-insufficient" : ""}`}
                    >
                      <span>Your balance</span>
                      <span>{formatTrust(userBalance)} TRUST</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Success State */}
              {txSuccess && (
                <div className="modal-success-card">
                  <div className="modal-success-card-glow" />
                  <div className="modal-success-card-inner">
                    <div className="modal-success-left">
                      <h2 className="modal-success-title">
                        First Claim
                        <br />
                        Validated
                      </h2>
                      <p className="modal-success-subtitle">
                        {operationType === "deposit"
                          ? "Your Recommend has been reinforced!"
                          : "Your Recommend has been amplified!"}
                      </p>
                      {transactionHash && (
                        <a
                          href={`${EXPLORER_URLS.TRANSACTION}${transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="modal-tx-link"
                        >
                          View on Explorer &rarr;
                        </a>
                      )}
                      <p className="onboarding-redirect-hint">
                        Redirecting to tutorial...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error State */}
              {txError && !txSuccess && (
                <div className="modal-error-section">
                  <div className="modal-error-icon">&#10060;</div>
                  <div className="modal-error-text">
                    <p className="modal-error-title">Transaction Failed</p>
                    <p className="modal-error-message">
                      {parseErrorMessage(txError)}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions (b3) */}
              {!txSuccess && (
                <div className="b3-actions">
                  {txError ? (
                    <>
                      <button className="b3-btn" onClick={handleClose}>
                        Close
                      </button>
                      <button
                        className="b3-btn b3-btn--primary"
                        onClick={handleSubmit}
                        disabled={txLoading}
                      >
                        Retry
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="b3-btn"
                        onClick={() => {
                          reset()
                          onComplete()
                        }}
                        disabled={txLoading}
                      >
                        Skip
                      </button>
                      <button
                        className="b3-btn b3-btn--primary"
                        onClick={handleContinue}
                        disabled={
                          txLoading ||
                          !canContinue ||
                          (step === 5 && breakdown.totalEstimate > userBalance)
                        }
                      >
                        {txLoading
                          ? "Processing..."
                          : step === 5
                            ? "Mark"
                            : "Continue"}
                        {step === 5 && !txLoading && (
                          <span className="b3-btn-amt">
                            {formatTrust(breakdown.totalEstimate)} T
                          </span>
                        )}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default OnboardingClaimModal
