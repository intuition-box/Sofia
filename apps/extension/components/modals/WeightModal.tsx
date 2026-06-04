import { UserBadge, VerbTag } from "@0xsofia/design-system"
import type { IntentionSlug, UserBadgeTier } from "@0xsofia/design-system"
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
import { EXPLORER_URLS } from "~/lib/config/chainConfig"
import { contextColor, contextLabel } from "~/lib/config/contextDisplay"
import { createHookLogger, getFaviconUrl } from "~/lib/utils"
import {
  INTENTION_CONFIG,
  predicateLabelToIntentionType
} from "~/types/intentionCategories"
import type { IntentionType } from "~/types/intentionCategories"

import contributorBadge from "../ui/img/badges/contributor.png"
import explorerBadge from "../ui/img/badges/explorer.png"
import pioneerBadge from "../ui/img/badges/pioneer.png"
import SofiaLoader from "../ui/SofiaLoader"
import {
  DEFAULT_WEIGHT,
  formatTrust,
  getWeightValue,
  weightOptions,
  type DiscoveryReward,
  type WeightOptionId
} from "./weight/types"
import WeightActions from "./weight/WeightActions"
import WeightApplyAllBar from "./weight/WeightApplyAllBar"
import WeightItem from "./weight/WeightItem"
import WeightSuccessCard from "./weight/WeightSuccessCard"
import WeightTotal from "./weight/WeightTotal"

import "../styles/Modal.css"

const logger = createHookLogger("WeightModal")

const TIER_ORDER = ["pioneer", "explorer", "contributor"] as const
type RewardTier = (typeof TIER_ORDER)[number]

const BADGE_IMAGES: Record<UserBadgeTier, string> = {
  pioneer: pioneerBadge,
  explorer: explorerBadge,
  contributor: contributorBadge
}

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
          <div className="amp b3 b3--v5">
            <div className="b3-bg b3-bg--v5" aria-hidden="true">
              <div className="b3-bg-hex b3-bg-hex--1" />
              <div className="b3-bg-hex b3-bg-hex--2" />
              <div className="b3-bg-hex b3-bg-hex--3" />
              <div className="b3-bg-grain" />
            </div>

            {isProcessing && (
              <div className="b3-loading" role="status" aria-live="polite">
                <SofiaLoader size={120} />
                <p className="b3-loading-title">Amplifying</p>
                <p className="b3-loading-step">{processingStep}</p>
                <p className="b3-loading-warn">
                  Do not close or navigate away from this tab
                </p>
              </div>
            )}

            <div className="b3-ticket">
              <div className="b3-body">
                <div className="b3-headline">
                  <span className="b3-drop">A</span>
                  <h1 className="b3-h1">mplify.</h1>
                </div>
                <p className="b3-sub">
                  {fixedDeposit != null
                    ? "Review the cost breakdown before confirming."
                    : "Compose your basket — pick a strength for each mark."}
                </p>

                {fixedDeposit == null && activeCount > 1 && (
                  <div className="b3-presets">
                    <span className="b3-presets-k">QUICK</span>
                    {weightOptions.map((o) => (
                      <button
                        key={o.id}
                        className="b3-preset"
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleApplyAll(o.id)}>
                        All · {o.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="b3-basket">
                  {triplets.map((triplet, index) => {
                    const on = !removedIndices.has(index)
                    const sel = selectedWeights[index]
                    const name = triplet.description || triplet.triplet.object
                    const intentKey: IntentionType | null = triplet.intention
                      ? (((triplet.intention as string) in INTENTION_CONFIG
                          ? triplet.intention
                          : triplet.intention.replace(
                              /^for_/,
                              ""
                            )) as IntentionType)
                      : // Trust / distrust rows carry no `intention` —
                        // resolve the verb from the predicate label.
                        predicateLabelToIntentionType(triplet.triplet.predicate)
                    const intentEntry =
                      intentKey && intentKey in INTENTION_CONFIG
                        ? INTENTION_CONFIG[intentKey]
                        : null
                    const topic = triplet.interestContext
                      ? contextLabel(triplet.interestContext)
                      : null
                    const topicColor = triplet.interestContext
                      ? contextColor(triplet.interestContext)
                      : null
                    const canToggleOff = activeCount > 1
                    const lockedSingle = triplets.length <= 1
                    const platform =
                      ppEnabled && fixedDeposit == null
                        ? detectPlatformFromUrl(triplet.url)
                        : null
                    const toggle = () => {
                      if (lockedSingle || isProcessing) return
                      if (on) {
                        if (!canToggleOff) return
                        setRemovedIndices((prev) => new Set(prev).add(index))
                        onRemoveTriplet?.(triplet.id)
                      } else {
                        setRemovedIndices((prev) => {
                          const next = new Set(prev)
                          next.delete(index)
                          return next
                        })
                      }
                    }
                    const rowTrust = on ? getWeightValue(sel) : 0
                    const ppFraction = platform
                      ? getPpForSlug(platform.slug) / PP_FEE_DENOMINATOR
                      : 0
                    const platAmt = on ? rowTrust * ppFraction : 0
                    const urlAmt = on ? rowTrust - platAmt : 0
                    return (
                      <div
                        className={`b3-row${on ? " is-on" : ""}`}
                        key={triplet.id}>
                        <button
                          className="b3-check"
                          role="checkbox"
                          aria-checked={on}
                          aria-label={on ? "Deselect mark" : "Select mark"}
                          type="button"
                          disabled={lockedSingle || (on && !canToggleOff)}
                          onClick={toggle}>
                          {on && (
                            <svg
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none">
                              <path
                                d="M5 12l4 4L19 6"
                                stroke="var(--ds-on-accent)"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </button>

                        <img
                          src={getFaviconUrl(triplet.url, 32)}
                          alt=""
                          className="b3-row-fav"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.visibility =
                              "hidden"
                          }}
                        />

                        <div className="b3-row-meta">
                          <div className="b3-row-name" title={name}>
                            {name}
                          </div>
                          <div className="b3-row-sub" title={triplet.url}>
                            {hostFromUrl(triplet.url)}
                          </div>
                          {(intentEntry || topic) && (
                            <div className="b3-row-tags">
                              {intentEntry && (
                                <VerbTag
                                  intent={intentKey as IntentionSlug}
                                  label={intentEntry.label}
                                />
                              )}
                              {topic && topicColor && (
                                <span
                                  className="amp-tag"
                                  style={
                                    {
                                      "--tag-color": topicColor,
                                      "--tag-pastel": topicColor
                                    } as React.CSSProperties
                                  }>
                                  {topic}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="b3-row-right">
                          <div className="b3-row-trust">
                            <span className="b3-row-trust-val">
                              {fixedDeposit != null
                                ? "—"
                                : formatTrust(rowTrust)}
                            </span>
                            <span className="b3-row-trust-unit">TRUST</span>
                          </div>
                          {fixedDeposit == null && (
                            <div
                              className="b3-tiers"
                              role="radiogroup"
                              aria-disabled={!on}>
                              {weightOptions.map((o) => (
                                <button
                                  key={o.id}
                                  role="radio"
                                  aria-checked={sel === o.id}
                                  type="button"
                                  className={`b3-tier${
                                    sel === o.id ? " is-on" : ""
                                  }`}
                                  disabled={!on || isProcessing}
                                  onClick={() =>
                                    on && handleWeightSelection(index, o.id)
                                  }>
                                  <span className="b3-tier-label">
                                    {o.label}
                                  </span>
                                  <span className="b3-tier-value">
                                    {o.value}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {platform && fixedDeposit == null && (
                          <div className={`b3-dest${on ? "" : " is-off"}`}>
                            <div className="b3-dest-line">
                              <span className="b3-dest-tag b3-dest-tag--url">
                                URL
                              </span>
                              <span
                                className="b3-dest-where"
                                title={triplet.url}>
                                {hostFromUrl(triplet.url)} · this page
                              </span>
                              <span className="b3-dest-amt">
                                {formatTrust(urlAmt)} T
                              </span>
                            </div>
                            <div className="b3-dest-line">
                              <span className="b3-dest-tag b3-dest-tag--domain">
                                DOMAIN
                              </span>
                              <span className="b3-dest-where">
                                {platform.label} · whole platform
                              </span>
                              <span className="b3-dest-ctl">
                                <input
                                  type="range"
                                  min={0}
                                  max={100000}
                                  step={1000}
                                  value={getPpForSlug(platform.slug)}
                                  onChange={(e) =>
                                    setPpForSlug(
                                      platform.slug,
                                      Number(e.target.value)
                                    )
                                  }
                                  disabled={!on || isProcessing}
                                  aria-label={`${platform.label} share`}
                                  className="b3-dest-range"
                                  style={
                                    {
                                      "--pp-fill": `${
                                        getPpForSlug(platform.slug) / 1000
                                      }%`
                                    } as React.CSSProperties
                                  }
                                />
                                <span className="b3-dest-pct">
                                  {(getPpForSlug(platform.slug) / 1000).toFixed(
                                    0
                                  )}
                                  %
                                </span>
                              </span>
                              <span className="b3-dest-amt">
                                {formatTrust(platAmt)} T
                              </span>
                            </div>
                            <div className="b3-dest-scale" aria-hidden="true">
                              <span>0</span>
                              <span>50</span>
                              <span>100</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {curveSelector && (
                  <div className="b3-extra">
                    <div className="curve-selector">
                      <span className="curve-selector-label">
                        Bonding curve:
                      </span>
                      <div className="curve-toggle">
                        <button
                          className={`curve-toggle-btn ${
                            curveSelector.selected === "linear" ? "active" : ""
                          }`}
                          onClick={() => curveSelector.onChange("linear")}
                          disabled={isProcessing}>
                          Linear
                        </button>
                        <button
                          className={`curve-toggle-btn ${
                            curveSelector.selected === "progressive"
                              ? "active"
                              : ""
                          }`}
                          onClick={() => curveSelector.onChange("progressive")}
                          disabled={isProcessing}>
                          Progressive
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {gsEnabled && (
                  <div className="b3-extra">
                    <div className="gs-slider-section">
                      <div className="gs-slider-header">
                        <span className="gs-slider-label">
                          Beta Season Pool
                        </span>
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
                        onChange={(e) =>
                          setGsPercentage(Number(e.target.value))
                        }
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
                  </div>
                )}

                <div className="b3-ledger">
                  <div className="b3-ledger-row">
                    <span>Subtotal</span>
                    <span>{formatTrust(breakdown.totalTrust)} TRUST</span>
                  </div>
                  {breakdown.poolAmount > 0 && (
                    <div className="b3-ledger-row">
                      <span>Beta Season Pool</span>
                      <span>{formatTrust(breakdown.poolAmount)} TRUST</span>
                    </div>
                  )}
                  {breakdown.platformPoolAmount > 0 && (
                    <div className="b3-ledger-row">
                      <span>{platformLabel}</span>
                      <span>
                        {formatTrust(breakdown.platformPoolAmount)} TRUST
                      </span>
                    </div>
                  )}
                  <div className="b3-ledger-row">
                    <span>Fees</span>
                    <span>{formatTrust(breakdown.totalFees)} TRUST</span>
                  </div>
                  <div className="b3-ledger-row b3-ledger-total">
                    <span>Total deposit</span>
                    <span>{formatTrust(breakdown.totalEstimate)} TRUST</span>
                  </div>
                  <div className="b3-ledger-row b3-ledger-row--muted">
                    <span>Your balance</span>
                    <span>{formatTrust(userBalance)} TRUST</span>
                  </div>
                </div>

                <div className="b3-actions">
                  <button
                    className="b3-btn"
                    type="button"
                    onClick={handleClose}
                    disabled={isProcessing}>
                    Cancel
                  </button>
                  <button
                    className="b3-btn b3-btn--primary"
                    type="button"
                    onClick={handleSubmit}
                    disabled={
                      isProcessing ||
                      breakdown.totalEstimate > userBalance ||
                      activeCount === 0
                    }>
                    {submitLabel || "Amplify"}
                    <span className="b3-btn-amt">
                      {formatTrust(breakdown.totalEstimate)} T
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
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
                    const earned = discoveryReward.status.toLowerCase() === tier
                    return (
                      <div
                        className={`rc-tier${earned ? " is-earned" : ""}`}
                        key={tier}>
                        <UserBadge
                          tier={tier as RewardTier}
                          iconUrl={BADGE_IMAGES[tier as RewardTier]}
                          size={32}
                        />
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
