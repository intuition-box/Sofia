import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { formatUnits, getAddress } from "viem"
import { useBalance } from "wagmi"

import {
  GS_FEE_DENOMINATOR,
  PP_FEE_DENOMINATOR,
  useFeeEstimate,
  useGlobalStake,
  useGoldSystem,
  usePlatformPool,
  useWalletFromStorage
} from "~/hooks"
import type { ModalTriplet } from "~/hooks"
import { createHookLogger } from "~/lib/utils"

import SofiaLoader from "../ui/SofiaLoader"
import {
  DEFAULT_WEIGHT,
  formatTrust,
  getWeightValue,
  type DiscoveryReward,
  type WeightOptionId
} from "./weight/types"
import WeightActions from "./weight/WeightActions"
import WeightAmplifyTicket from "./weight/WeightAmplifyTicket"
import WeightApplyAllBar from "./weight/WeightApplyAllBar"
import WeightItem from "./weight/WeightItem"
import WeightRewardTicket from "./weight/WeightRewardTicket"
import WeightSuccessCard from "./weight/WeightSuccessCard"
import WeightTotal from "./weight/WeightTotal"

import "../styles/Modal.css"

const logger = createHookLogger("WeightModal")

interface WeightModalProps {
  isOpen: boolean
  triplets: ModalTriplet[]
  isProcessing: boolean
  transactionSuccess?: boolean
  transactionError?: string
  transactionHash?: string
  createdCount?: number
  depositCount?: number
  isIntentionCertification?: boolean
  discoveryReward?: DiscoveryReward | null
  onClaimReward?: () => Promise<void>
  rewardClaimed?: boolean
  /** When set, hide weight selection and use this fixed deposit value (in TRUST) */
  fixedDeposit?: number
  /** Override creation cost estimation assumptions (default: isNewTriple=true, newAtomCount=1) */
  estimateOptions?: {
    isNewTriple?: boolean
    newAtomCount?: number
    newPredicateAtomCount?: number
    needsContextPredicateAtom?: boolean
  }
  /** Customize submit button text (default: "Amplify") */
  submitLabel?: string
  /** Pre-selected weight option when the modal opens (default: 'default' / 0.5 TRUST) */
  initialWeight?: WeightOptionId
  /** Show XP cube animation on success (for quest/XP claim flows) */
  showXpAnimation?: boolean
  /** Optional curve selector for debate claims (linear=1 / progressive=2) */
  curveSelector?: {
    selected: "linear" | "progressive"
    onChange: (curve: "linear" | "progressive") => void
  }
  /** Rendered below the success card (e.g. PagePositionBoard) */
  positionBoard?: React.ReactNode
  /**
   * When set, replaces the entire success view (WeightSuccessCard + actions)
   * with this custom node once the tx succeeds. Used by CartDrawer to stitch
   * BatchRewardContent into the same modal surface — no second modal pop.
   * The host node is responsible for its own dismissal (it should call onClose).
   */
  successContent?: React.ReactNode
  /** Called when user removes a triplet from the batch (receives triplet id) */
  onRemoveTriplet?: (tripletId: string) => void
  /**
   * When set, the basket shows a "Clear all" button and unchecking the last
   * remaining mark empties the whole cart. Cart-only (CartDrawer wires it).
   */
  onClearCart?: () => void
  onClose: () => void
  onSubmit: (customWeights?: (bigint | null)[]) => Promise<void>
}

const WeightModal = ({
  isOpen,
  triplets,
  isProcessing,
  transactionSuccess = false,
  transactionError,
  transactionHash,
  createdCount = 0,
  depositCount = 0,
  discoveryReward,
  onClaimReward,
  rewardClaimed = false,
  fixedDeposit,
  estimateOptions,
  submitLabel,
  initialWeight = DEFAULT_WEIGHT,
  showXpAnimation = false,
  curveSelector,
  positionBoard,
  successContent,
  onRemoveTriplet,
  onClearCart,
  onClose,
  onSubmit
}: WeightModalProps) => {
  const [selectedWeights, setSelectedWeights] = useState<WeightOptionId[]>([])
  const [processingStep, setProcessingStep] = useState("")

  const { gsEnabled, gsConfig, getUserPercentage, setUserPercentage } =
    useGlobalStake()
  const [gsPercentage, setGsPercentage] = useState<number>(() =>
    getUserPercentage()
  )

  const {
    ppEnabled,
    getUserPercentage: getPPPercentage,
    setUserPercentage: setPPPercentage,
    detectPlatformFromUrl
  } = usePlatformPool()
  const [ppPerPlatform, setPpPerPlatform] = useState<Record<string, number>>({})

  const setPpForSlug = (slug: string, pct: number) => {
    setPpPerPlatform((prev) => ({ ...prev, [slug]: pct }))
  }

  const getPpForSlug = (slug: string): number => {
    return ppPerPlatform[slug] ?? getPPPercentage()
  }

  const detectedPlatforms = useMemo(() => {
    const seen = new Set<string>()
    const platforms: { slug: string; termId: string; label: string }[] = []
    for (const t of triplets) {
      const p = detectPlatformFromUrl(t.url)
      if (p && !seen.has(p.termId)) {
        seen.add(p.termId)
        platforms.push(p)
      }
    }
    return platforms
  }, [triplets])

  const hasPlatforms = detectedPlatforms.length > 0
  const platformLabel =
    detectedPlatforms.length === 1
      ? `${detectedPlatforms[0].label} Pool`
      : `Platform Pool (${detectedPlatforms.length})`

  const { walletAddress } = useWalletFromStorage()
  const { totalGold } = useGoldSystem()
  const { estimate } = useFeeEstimate()

  const checksumAddress = walletAddress ? getAddress(walletAddress) : undefined
  const { data: balanceData } = useBalance({ address: checksumAddress })

  const userBalance = balanceData
    ? parseFloat(formatUnits(balanceData.value, balanceData.decimals))
    : 0

  useEffect(() => {
    if (isOpen) {
      setGsPercentage(getUserPercentage())
      setPpPerPlatform({})
    }
  }, [isOpen, getUserPercentage, getPPPercentage])

  const [removedIndices, setRemovedIndices] = useState<Set<number>>(new Set())
  const [globalWeight, setGlobalWeight] =
    useState<WeightOptionId>(initialWeight)

  const tripletKey = triplets.map((t) => t.id).join(",")
  useEffect(() => {
    if (triplets.length > 0) {
      setSelectedWeights(new Array(triplets.length).fill(initialWeight))
      setGlobalWeight(initialWeight)
      setRemovedIndices(new Set())
    }
  }, [tripletKey, initialWeight])

  useEffect(() => {
    if (!isProcessing) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isProcessing])

  useEffect(() => {
    if (isProcessing) {
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
  }, [isProcessing])

  const isNewTriple = estimateOptions?.isNewTriple ?? true
  const newAtomCount = estimateOptions?.newAtomCount ?? 1
  const newPredicateAtomCount = estimateOptions?.newPredicateAtomCount ?? 0
  const needsContextPredicateAtom =
    estimateOptions?.needsContextPredicateAtom ?? false

  const activeCount = triplets.length - removedIndices.size
  const keptTriplets = useMemo(
    () => triplets.filter((_, i) => !removedIndices.has(i)),
    [triplets, removedIndices]
  )
  const breakdown = useMemo(() => {
    let totalTrust = 0
    if (fixedDeposit != null) {
      totalTrust = fixedDeposit
    } else {
      for (let i = 0; i < selectedWeights.length; i++) {
        if (removedIndices.has(i)) continue
        totalTrust += getWeightValue(selectedWeights[i])
      }
    }

    // One context triple is minted per context slug, so sum across triplets.
    const contextTripleCount = triplets.reduce((n, t, i) => {
      if (removedIndices.has(i)) return n
      const c = t.interestContexts?.length
        ? t.interestContexts.length
        : t.interestContext
          ? 1
          : 0
      return n + c
    }, 0)
    const totalPPPercentage = hasPlatforms
      ? detectedPlatforms.reduce((sum, p) => sum + getPpForSlug(p.slug), 0) /
        detectedPlatforms.length
      : 0
    const effectivePP = Math.round(totalPPPercentage)
    const createOpts = {
      isNewTriple,
      newAtomCount,
      newPredicateAtomCount,
      itemCount: activeCount,
      contextTripleCount,
      needsContextPredicateAtom:
        needsContextPredicateAtom && contextTripleCount > 0,
      ppPercentage: effectivePP
    }

    if (totalTrust <= 0 || !gsEnabled) {
      const costEstimate = estimate?.(totalTrust, 0, createOpts) ?? null
      const platformPoolAmount = (totalTrust * effectivePP) / PP_FEE_DENOMINATOR
      return {
        totalTrust,
        signalAmount: totalTrust - platformPoolAmount,
        poolAmount: 0,
        platformPoolAmount,
        belowMinimum: false,
        creationCost: costEstimate?.creationCost ?? 0,
        sofiaFixedFee: costEstimate?.sofiaFixedFee ?? 0,
        sofiaPercentFee: costEstimate?.sofiaPercentFee ?? 0,
        contextTripleCost: costEstimate?.contextTripleCost ?? 0,
        totalFees: costEstimate?.totalFees ?? 0,
        totalEstimate: costEstimate?.totalEstimate ?? totalTrust,
        depositCount: costEstimate?.depositCount ?? 1
      }
    }

    const poolAmount = (totalTrust * gsPercentage) / GS_FEE_DENOMINATOR
    const platformPoolAmount = (totalTrust * effectivePP) / PP_FEE_DENOMINATOR
    const signalAmount = totalTrust - poolAmount - platformPoolAmount
    const minDeposit = Number(gsConfig.minGlobalDeposit) / 1e18
    const perItemPool = activeCount > 0 ? poolAmount / activeCount : poolAmount
    const belowMinimum = perItemPool > 0 && perItemPool < minDeposit

    const effectiveGsPercentage = belowMinimum ? 0 : gsPercentage
    const costEstimate =
      estimate?.(totalTrust, effectiveGsPercentage, createOpts) ?? null

    return {
      totalTrust,
      signalAmount,
      poolAmount,
      platformPoolAmount,
      belowMinimum,
      creationCost: costEstimate?.creationCost ?? 0,
      sofiaFixedFee: costEstimate?.sofiaFixedFee ?? 0,
      sofiaPercentFee: costEstimate?.sofiaPercentFee ?? 0,
      contextTripleCost: costEstimate?.contextTripleCost ?? 0,
      totalFees: costEstimate?.totalFees ?? 0,
      totalEstimate: costEstimate?.totalEstimate ?? totalTrust,
      depositCount: costEstimate?.depositCount ?? 1
    }
  }, [
    selectedWeights,
    gsPercentage,
    ppPerPlatform,
    gsEnabled,
    gsConfig,
    estimate,
    fixedDeposit,
    isNewTriple,
    newAtomCount,
    newPredicateAtomCount,
    needsContextPredicateAtom,
    activeCount,
    removedIndices,
    triplets,
    hasPlatforms,
    detectedPlatforms
  ])

  const handleSubmit = async () => {
    try {
      if (gsEnabled) {
        setUserPercentage(gsPercentage)
      }
      if (ppEnabled && hasPlatforms) {
        const avgPP =
          detectedPlatforms.reduce((sum, p) => sum + getPpForSlug(p.slug), 0) /
          detectedPlatforms.length
        setPPPercentage(Math.round(avgPP))
      }

      const weightBigIntArray: (bigint | null)[] = selectedWeights.map(
        (selectedWeight, index) => {
          if (removedIndices.has(index)) return null
          const trustValue = getWeightValue(selectedWeight)
          return BigInt(Math.floor(trustValue * 1e18))
        }
      )

      await onSubmit(weightBigIntArray)
    } catch (error) {
      logger.error("Failed to submit weights", error)
    }
  }

  const handleClose = () => {
    if (isProcessing) return
    setSelectedWeights(new Array(triplets.length).fill(initialWeight))
    onClose()
  }

  const handleWeightSelection = (
    tripletIndex: number,
    optionId: WeightOptionId
  ) => {
    const newSelectedWeights = [...selectedWeights]
    newSelectedWeights[tripletIndex] = optionId
    setSelectedWeights(newSelectedWeights)
  }

  const handleApplyAll = (optionId: WeightOptionId) => {
    setGlobalWeight(optionId)
    setSelectedWeights(new Array(triplets.length).fill(optionId))
  }

  const parseErrorMessage = (error: string): string => {
    // The wallet-bridge error arrives wrapped in a full viem
    // ContractFunctionExecutionError (calldata + ABI dump). Surface only the
    // actionable hint instead of the raw dump that overflowed the box.
    if (
      error.includes("Wallet unavailable") ||
      error.includes("navigate to an HTTPS page")
    ) {
      return "Wallet unavailable — open an HTTPS page (e.g. doc.sofia.intuition.box/wallet-bridge) to sign this transaction."
    }
    // User rejected the signature in their wallet.
    if (/user rejected|user denied|rejected the request/i.test(error)) {
      return "Signature rejected in your wallet."
    }
    const failedMatch = error.match(
      /(Shares addition failed|Weight addition failed):/i
    )
    const failedText = failedMatch ? failedMatch[0] : "Transaction failed."
    const detailsMatch = error.match(/Details:\s*(.+?)(?:\n|$)/i)
    const detailsText = detailsMatch ? `Details: ${detailsMatch[1]}` : ""
    return detailsText ? `${failedText}\n${detailsText}` : failedText
  }

  const isFormState = !transactionSuccess && !transactionError

  const showSuccessHandoff = transactionSuccess && !!successContent

  // The cart is cleared as soon as the tx succeeds (validated URLs leave the
  // cart immediately). The reward handoff renders from its own snapshot, so
  // an empty `triplets` must NOT unmount the modal while a success/reward
  // surface is active — only bail when there's genuinely nothing to show.
  const keepOpenForReward =
    showSuccessHandoff || (rewardClaimed && !!discoveryReward)

  if (!isOpen || (triplets.length === 0 && !keepOpenForReward)) return null

  // The editable weight-selection step is rendered as the "Amplify" editorial
  // ticket (B3 basket · V5 hex). Processing / error / success / reward paths
  // keep their existing markup untouched.
  // Processing stays inside the Amplify ticket (loading overlay below) —
  // we no longer fall back to the legacy dark modal-body during a tx.
  const showAmpForm =
    isFormState && !showSuccessHandoff && !(rewardClaimed && discoveryReward)

  return createPortal(
    <div className={`modal-overlay ${isProcessing ? "processing" : ""}`}>
      <div className="modal-content">
        {!(rewardClaimed && discoveryReward) && showSuccessHandoff && (
          <div
            key="success-handoff"
            className="modal-body modal-body--success-handoff">
            {successContent}
          </div>
        )}
        {!(rewardClaimed && discoveryReward) &&
          !showSuccessHandoff &&
          !showAmpForm && (
            <>
              <div className="modal-body">
                {isFormState && (
                  <p className="modal-description">
                    {fixedDeposit != null
                      ? "Review the cost breakdown before confirming."
                      : "Set your deposit, allocate to pools, review fees and confirm."}
                  </p>
                )}

                {isFormState && fixedDeposit == null && activeCount > 1 && (
                  <WeightApplyAllBar
                    activeCount={activeCount}
                    globalWeight={globalWeight}
                    isProcessing={isProcessing}
                    onApplyAll={handleApplyAll}
                  />
                )}

                {!(transactionSuccess && discoveryReward) && (
                  <div className="modal-triplets-list">
                    {triplets.map((triplet, index) => {
                      if (removedIndices.has(index)) return null
                      return (
                        <WeightItem
                          key={triplet.id}
                          triplet={triplet}
                          index={index}
                          selectedWeight={selectedWeights[index]}
                          isFormState={isFormState}
                          isProcessing={isProcessing}
                          fixedDeposit={fixedDeposit}
                          showRemoveButton={triplets.length > 1}
                          canRemove={activeCount > 1}
                          ppEnabled={ppEnabled}
                          detectPlatformFromUrl={detectPlatformFromUrl}
                          getPpForSlug={getPpForSlug}
                          onPpChange={setPpForSlug}
                          onWeightSelect={handleWeightSelection}
                          onRemove={() => {
                            setRemovedIndices((prev) =>
                              new Set(prev).add(index)
                            )
                            onRemoveTriplet?.(triplet.id)
                          }}
                        />
                      )
                    })}
                  </div>
                )}

                {isFormState && curveSelector && (
                  <div className="curve-selector">
                    <span className="curve-selector-label">Bonding curve:</span>
                    <div className="curve-toggle">
                      <button
                        className={`curve-toggle-btn ${curveSelector.selected === "linear" ? "active" : ""}`}
                        onClick={() => curveSelector.onChange("linear")}
                        disabled={isProcessing}>
                        Linear
                      </button>
                      <button
                        className={`curve-toggle-btn ${curveSelector.selected === "progressive" ? "active" : ""}`}
                        onClick={() => curveSelector.onChange("progressive")}
                        disabled={isProcessing}>
                        Progressive
                      </button>
                    </div>
                  </div>
                )}

                {isFormState && gsEnabled && (
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
                      onChange={(e) => setGsPercentage(Number(e.target.value))}
                      className="gs-slider-input"
                      style={
                        {
                          "--gs-fill-pct": `${(gsPercentage / 50000) * 100}%`
                        } as React.CSSProperties
                      }
                      disabled={isProcessing}
                    />
                    <div className="gs-slider-breakdown">
                      <div className="gs-slider-breakdown-item">
                        <span className="gs-slider-breakdown-label">
                          Signal
                        </span>
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
                )}

                {isFormState && (
                  <WeightTotal
                    breakdown={breakdown}
                    userBalance={userBalance}
                    gsEnabled={gsEnabled}
                    gsPercentage={gsPercentage}
                    hasPlatforms={hasPlatforms}
                    platformLabel={platformLabel}
                    fixedDeposit={fixedDeposit}
                  />
                )}

                {transactionSuccess && (
                  <WeightSuccessCard
                    transactionHash={transactionHash}
                    createdCount={createdCount}
                    depositCount={depositCount}
                    showXpAnimation={showXpAnimation}
                    discoveryReward={discoveryReward}
                    rewardClaimed={rewardClaimed}
                    onClaimReward={onClaimReward}
                    positionBoard={positionBoard}
                  />
                )}

                {transactionError && !transactionSuccess && (
                  <div className="modal-error-section">
                    <div className="modal-error-icon">❌</div>
                    <div className="modal-error-text">
                      <p className="modal-error-title">Transaction Failed</p>
                      <p className="modal-error-message">
                        {parseErrorMessage(transactionError)}
                      </p>
                    </div>
                  </div>
                )}

                {isProcessing && !transactionSuccess && (
                  <>
                    <div className="modal-processing-section">
                      <SofiaLoader size={60} />
                      <div className="modal-processing-text">
                        <p className="modal-processing-title">Creating</p>
                        <p className="modal-processing-step">
                          {processingStep}
                        </p>
                      </div>
                    </div>
                    <div className="modal-processing-warning">
                      Do not close or navigate away from this tab
                    </div>
                  </>
                )}

                {!rewardClaimed && !(transactionSuccess && discoveryReward) && (
                  <WeightActions
                    isProcessing={isProcessing}
                    transactionSuccess={transactionSuccess}
                    transactionError={transactionError}
                    submitLabel={submitLabel}
                    breakdown={breakdown}
                    userBalance={userBalance}
                    activeCount={activeCount}
                    onClose={handleClose}
                    onSubmit={handleSubmit}
                  />
                )}
              </div>
            </>
          )}

        {showAmpForm && (
          <WeightAmplifyTicket
            triplets={triplets}
            removedIndices={removedIndices}
            setRemovedIndices={setRemovedIndices}
            onRemoveTriplet={onRemoveTriplet}
            onClearCart={onClearCart}
            selectedWeights={selectedWeights}
            activeCount={activeCount}
            isProcessing={isProcessing}
            processingStep={processingStep}
            fixedDeposit={fixedDeposit}
            ppEnabled={ppEnabled}
            detectPlatformFromUrl={detectPlatformFromUrl}
            getPpForSlug={getPpForSlug}
            setPpForSlug={setPpForSlug}
            onApplyAll={handleApplyAll}
            onWeightSelect={handleWeightSelection}
            curveSelector={curveSelector}
            gsEnabled={gsEnabled}
            gsPercentage={gsPercentage}
            setGsPercentage={setGsPercentage}
            breakdown={breakdown}
            platformLabel={platformLabel}
            userBalance={userBalance}
            submitLabel={submitLabel}
            onClose={handleClose}
            onSubmit={handleSubmit}
          />
        )}

        {rewardClaimed && discoveryReward && (
          <WeightRewardTicket
            discoveryReward={discoveryReward}
            transactionHash={transactionHash}
            keptTriplets={keptTriplets}
            totalGold={totalGold}
            onClose={handleClose}
          />
        )}
      </div>
    </div>,
    document.body
  )
}

export default WeightModal
