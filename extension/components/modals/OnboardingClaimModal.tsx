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
import { globalStakeService } from "~/lib/services"
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

const FEE_DENOMINATOR = 100000

const STEP_HINTS = [
  "This is your first claim — a trust signal on the Intuition protocol.",
  "Choose how much TRUST to stake on this signal.",
  "Allocate a portion to the Beta Season Pool.",
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
  const [gsPercentage, setGsPercentage] = useState<number>(() =>
    globalStakeService.getUserPercentage()
  )
  const [gsInteracted, setGsInteracted] = useState(false)
  const [alreadyClaimed, setAlreadyClaimed] = useState(false)

  const { walletAddress } = useWalletFromStorage()
  const { estimate } = useFeeEstimate()

  const checksumAddress = walletAddress ? getAddress(walletAddress) : undefined
  const { data: balanceData } = useBalance({ address: checksumAddress })
  const userBalance = balanceData
    ? parseFloat(formatUnits(balanceData.value, balanceData.decimals))
    : 0

  const gsEnabled = globalStakeService.isEnabled()

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

  // Resync GS preference when modal opens
  useEffect(() => {
    if (isOpen) {
      setGsPercentage(globalStakeService.getUserPercentage())
    }
  }, [isOpen])

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

    if (totalTrust <= 0 || !gsEnabled) {
      const costEstimate = estimate?.(totalTrust, 0, createOpts) ?? null
      return {
        totalTrust,
        signalAmount: totalTrust,
        poolAmount: 0,
        belowMinimum: false,
        creationCost: costEstimate?.creationCost ?? 0,
        sofiaFixedFee: costEstimate?.sofiaFixedFee ?? 0,
        sofiaPercentFee: costEstimate?.sofiaPercentFee ?? 0,
        totalFees: costEstimate?.totalFees ?? 0,
        totalEstimate: costEstimate?.totalEstimate ?? totalTrust,
        depositCount: costEstimate?.depositCount ?? 1
      }
    }

    const poolAmount = (totalTrust * gsPercentage) / FEE_DENOMINATOR
    const signalAmount = totalTrust - poolAmount
    const config = globalStakeService.getConfig()
    const minDeposit = Number(config.minGlobalDeposit) / 1e18
    const belowMinimum = poolAmount > 0 && poolAmount < minDeposit

    const effectiveGsPercentage = belowMinimum ? 0 : gsPercentage
    const costEstimate =
      estimate?.(totalTrust, effectiveGsPercentage, createOpts) ?? null

    return {
      totalTrust,
      signalAmount,
      poolAmount,
      belowMinimum,
      creationCost: costEstimate?.creationCost ?? 0,
      sofiaFixedFee: costEstimate?.sofiaFixedFee ?? 0,
      sofiaPercentFee: costEstimate?.sofiaPercentFee ?? 0,
      totalFees: costEstimate?.totalFees ?? 0,
      totalEstimate: costEstimate?.totalEstimate ?? totalTrust,
      depositCount: costEstimate?.depositCount ?? 1
    }
  }, [selectedWeight, customValue, gsPercentage, gsEnabled, estimate])

  const handleSubmit = useCallback(async () => {
    try {
      if (gsEnabled) {
        globalStakeService.setUserPercentage(gsPercentage)
      }

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
  }, [selectedWeight, customValue, gsPercentage, gsEnabled, submitClaim])

  const handleClose = useCallback(() => {
    reset()
    setSelectedWeight(null)
    setCustomValue("")
    setGsInteracted(false)
    onClose()
  }, [reset, onClose])

  // Can continue to next step?
  const canContinue = useMemo(() => {
    if (step === 2) return selectedWeight !== null
    if (step === 3) return gsInteracted
    return true
  }, [step, selectedWeight, gsInteracted])

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

  return createPortal(
    <div
      className={`modal-overlay onboarding-claim-overlay ${txLoading ? "processing" : ""}`}
    >
      <div className="modal-content onboarding-claim-modal">
        <div className="modal-body">

          {/* Step 1+: Triple card (always visible from step 1) */}
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

          {/* Step 3+: Global Stake slider */}
          {isFormState && gsEnabled && (
            <div
              className={`onboarding-section ${step >= 3 ? "visible" : ""} ${step === 3 ? "highlighted" : ""}`}
            >
              <div className="gs-slider-section">
                <div className="gs-slider-header">
                  <span className="gs-slider-label">Beta Season Pool</span>
                  <span className="gs-slider-value">
                    {gsPercentage / 1000}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50000}
                  step={1000}
                  value={gsPercentage}
                  onChange={(e) => {
                    setGsPercentage(Number(e.target.value))
                    setGsInteracted(true)
                  }}
                  className="gs-slider-input"
                  style={
                    {
                      "--gs-fill-pct": `${(gsPercentage / 50000) * 100}%`
                    } as React.CSSProperties
                  }
                  disabled={txLoading}
                />
                <div className="gs-slider-breakdown">
                  <div className="gs-slider-breakdown-item">
                    <span className="gs-slider-breakdown-label">Signal</span>
                    <span className="gs-slider-breakdown-value">
                      {formatTrust(breakdown.signalAmount)} TRUST
                    </span>
                  </div>
                  <div className="gs-slider-breakdown-item">
                    <span className="gs-slider-breakdown-label">
                      Beta Season Pool
                    </span>
                    <span className="gs-slider-breakdown-value pool">
                      {formatTrust(breakdown.poolAmount)} TRUST
                    </span>
                  </div>
                </div>
                {breakdown.belowMinimum && (
                  <span className="gs-slider-minimum-hint">
                    Below minimum — pool contribution skipped
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Step 4+: Cost breakdown */}
          {isFormState && (
            <div
              className={`onboarding-section ${step >= 4 ? "visible" : ""} ${step === 4 ? "highlighted" : ""}`}
            >
              <div className="weight-modal-cost-summary">
                <div className="weight-modal-cost-row">
                  <span>Deposit</span>
                  <span>{formatTrust(breakdown.totalTrust)} TRUST</span>
                </div>
                {gsEnabled &&
                  gsPercentage > 0 &&
                  !breakdown.belowMinimum && (
                    <>
                      <div className="weight-modal-cost-row weight-modal-cost-sub">
                        <span>Signal</span>
                        <span>
                          {formatTrust(breakdown.signalAmount)} TRUST
                        </span>
                      </div>
                      <div className="weight-modal-cost-row weight-modal-cost-sub">
                        <span>Beta Season Pool</span>
                        <span>
                          {formatTrust(breakdown.poolAmount)} TRUST
                        </span>
                      </div>
                    </>
                  )}
                {breakdown.totalFees > 0 && (
                  <>
                    <div className="weight-modal-cost-divider" />
                    <div className="weight-modal-cost-row weight-modal-cost-fees-subtotal">
                      <span>Fees</span>
                      <span>{formatTrust(breakdown.totalFees)} TRUST</span>
                    </div>
                    {(breakdown.sofiaFixedFee > 0 ||
                      breakdown.sofiaPercentFee > 0) && (
                      <div className="weight-modal-cost-row weight-modal-cost-sub">
                        <span>Sofia fee</span>
                        <span>
                          {formatTrust(
                            breakdown.sofiaFixedFee +
                              breakdown.sofiaPercentFee
                          )}{" "}
                          TRUST
                        </span>
                      </div>
                    )}
                    {breakdown.creationCost > 0 && (
                      <div className="weight-modal-cost-row weight-modal-cost-sub">
                        <span>Intuition fee (creation only)</span>
                        <span>
                          {formatTrust(breakdown.creationCost)} TRUST
                        </span>
                      </div>
                    )}
                    <div className="weight-modal-cost-divider" />
                    <div className="weight-modal-cost-row weight-modal-cost-total">
                      <span>Total</span>
                      <span>
                        {formatTrust(breakdown.totalEstimate)} TRUST
                      </span>
                    </div>
                  </>
                )}
                <div
                  className={`weight-modal-cost-row weight-modal-cost-balance ${breakdown.totalEstimate > userBalance ? "weight-modal-insufficient" : ""}`}
                >
                  <span>Balance</span>
                  <span>{formatTrust(userBalance)} TRUST</span>
                </div>
                <p className="weight-modal-cost-note">
                  * Estimated — actual may vary
                </p>
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
                      ? "Your trust signal has been reinforced!"
                      : "Your trust signal has been amplified!"}
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

          {/* Processing State */}
          {txLoading && !txSuccess && (
            <div className="modal-processing-section">
              <SofiaLoader size={60} />
              <div className="modal-processing-text">
                <p className="modal-processing-title">Creating</p>
                <p className="modal-processing-step">{processingStep}</p>
              </div>
            </div>
          )}

          {/* Step hint + indicators (bottom) */}
          {isFormState && step <= 5 && (
            <p className="onboarding-step-hint">{STEP_HINTS[step - 1]}</p>
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
        </div>

        {/* Actions */}
        {!txSuccess && (
          <div className="modal-actions">
            {step === 5 && !txError && (
              <button
                className="stake-btn stake-btn-cancel"
                onClick={() => { reset(); onComplete() }}
                disabled={txLoading}
              >
                Skip
              </button>
            )}
            {txError && (
              <button
                className="stake-btn stake-btn-cancel"
                onClick={handleClose}
              >
                Close
              </button>
            )}
            {!txError && isFormState && (
              <button
                className="modal-btn primary"
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
                    ? "Certify"
                    : "Continue"}
              </button>
            )}
            {txError && (
              <button
                className="modal-btn primary"
                onClick={handleSubmit}
                disabled={txLoading}
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

export default OnboardingClaimModal
