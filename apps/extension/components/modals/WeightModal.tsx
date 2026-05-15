import { useState, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { useBalance } from "wagmi"
import { formatUnits, getAddress } from "viem"

import SofiaLoader from "../ui/SofiaLoader"
import {
  useWalletFromStorage,
  useGoldSystem,
  useFeeEstimate,
  useGlobalStake,
  GS_FEE_DENOMINATOR,
  usePlatformPool,
  PP_FEE_DENOMINATOR
} from "~/hooks"
import type { ModalTriplet } from "~/hooks"
import { UserBadge } from "@0xsofia/design-system"
import { EXPLORER_URLS } from "~/lib/config/chainConfig"
import { createHookLogger } from "~/lib/utils"
import WeightItem from "./weight/WeightItem"
import WeightTotal from "./weight/WeightTotal"
import WeightActions from "./weight/WeightActions"
import WeightApplyAllBar from "./weight/WeightApplyAllBar"
import WeightSuccessCard from "./weight/WeightSuccessCard"
import {
  weightOptions,
  formatTrust,
  getWeightValue,
  DEFAULT_WEIGHT,
  type WeightOptionId,
  type DiscoveryReward
} from "./weight/types"
import "../styles/Modal.css"

const logger = createHookLogger("WeightModal")

const TIER_ORDER = ["pioneer", "explorer", "contributor"] as const
type RewardTier = (typeof TIER_ORDER)[number]

const hostFromUrl = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

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
  const [ppPerPlatform, setPpPerPlatform] = useState<Record<string, number>>(
    {}
  )

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

  const checksumAddress = walletAddress
    ? getAddress(walletAddress)
    : undefined
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

    const contextTripleCount = triplets.filter(
      (t, i) => !removedIndices.has(i) && t.interestContext
    ).length
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

  const isFormState = !transactionSuccess && !transactionError

  if (!isOpen || triplets.length === 0) return null

  const showSuccessHandoff = transactionSuccess && !!successContent

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
        {!(rewardClaimed && discoveryReward) && !showSuccessHandoff && (
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
                      <p className="modal-processing-step">{processingStep}</p>
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

        {rewardClaimed && discoveryReward && (
          <div className="rc">
            <div className="rc-ember" />
            <div className="rc-ticket">
              <div className="rc-stub">
                <div className="rc-stub-row">
                  <span className="rc-stub-k">N°</span>
                  <span className="rc-stub-v">
                    {transactionHash
                      ? transactionHash.slice(2, 10).toUpperCase()
                      : "—"}
                  </span>
                </div>
                <div className="rc-stub-row">
                  <span className="rc-stub-k">DATE</span>
                  <span className="rc-stub-v">
                    {new Date()
                      .toLocaleDateString("fr-FR")
                      .replace(/\//g, " · ")}
                  </span>
                </div>
              </div>
              <div className="rc-perf" />

              <div className="rc-body">
                <div className="rc-headline">
                  <span className="rc-drop">M</span>
                  <h1 className="rc-h1">
                    ark
                    <br />
                    captured.
                  </h1>
                </div>
                <p className="rc-sub">
                  {keptTriplets.length === 1
                    ? "Awarded for marking one page."
                    : `Awarded for marking ${keptTriplets.length} pages.`}
                </p>

                <div className="rc-marks">
                  {keptTriplets.map((t) => (
                    <div className="rc-mark" key={t.id}>
                      <span className="rc-mark-verb">
                        {t.triplet.predicate}
                      </span>
                      <span className="rc-mark-obj" title={t.triplet.object}>
                        {t.description || t.triplet.object}
                      </span>
                      <span className="rc-mark-meta">
                        {t.interestContext && (
                          <span className="rc-mark-ctx">
                            {t.interestContext}
                          </span>
                        )}
                        <span className="rc-mark-host">
                          {hostFromUrl(t.url)}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>

                <div className="rc-tiers">
                  <div className="rc-tiers-k">Tier ladder</div>
                  {TIER_ORDER.map((tier) => {
                    const earned =
                      discoveryReward.status.toLowerCase() === tier
                    return (
                      <div
                        className={`rc-tier${earned ? " is-earned" : ""}`}
                        key={tier}>
                        <UserBadge tier={tier as RewardTier} size={16} />
                        <span className="rc-tier-label">
                          {tier.charAt(0).toUpperCase() + tier.slice(1)}
                        </span>
                        <span className="rc-tier-state">
                          {earned ? "earned" : "locked"}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className="rc-ledger">
                  <div className="rc-ledger-row">
                    <span>Gold reward</span>
                    <span>+ {discoveryReward.gold} G</span>
                  </div>
                  <div className="rc-ledger-row rc-ledger-total">
                    <span>Balance</span>
                    <span>{totalGold.toLocaleString()} G</span>
                  </div>
                </div>

                <div className="rc-actions">
                  {transactionHash ? (
                    <a
                      className="rc-btn rc-btn--primary"
                      href={`${EXPLORER_URLS.TRANSACTION}${transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer">
                      View my Echo →
                    </a>
                  ) : (
                    <button
                      className="rc-btn rc-btn--primary"
                      onClick={handleClose}>
                      View my Echo →
                    </button>
                  )}
                  <a
                    className="rc-btn"
                    href={`https://x.com/intent/tweet?text=${encodeURIComponent(
                      `Just marked ${keptTriplets.length} page${
                        keptTriplets.length === 1 ? "" : "s"
                      } on Sofia and earned ${discoveryReward.gold} Gold.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer">
                    Share on X
                  </a>
                  <button className="rc-btn" onClick={handleClose}>
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

export default WeightModal
