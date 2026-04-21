import { useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useBalance } from 'wagmi'
import { formatUnits, getAddress } from 'viem'

import SofiaLoader from '../ui/SofiaLoader'
import XpAnimation from '../ui/XpAnimation'
import { useWalletFromStorage, useGoldSystem, useFeeEstimate, useGlobalStake, GS_FEE_DENOMINATOR, usePlatformPool, PP_FEE_DENOMINATOR } from "~/hooks"
import type { ModalTriplet } from "~/hooks"
import { EXPLORER_URLS } from "~/lib/config/chainConfig"
import { createHookLogger } from "~/lib/utils"
import type { IntentionPurpose } from "~/types/discovery"
import type { IntentionType } from "~/types/intentionCategories"
import { getIntentionBadge } from "~/types/intentionCategories"
import { TOPIC_LABELS, TOPIC_COLORS } from "~/lib/config/topicConfig"
import '../styles/Modal.css'

const logger = createHookLogger('WeightModal')
const goldRewardVideoUrl = chrome.runtime.getURL('assets/bggoldreward.mp4')
const goldReward50VideoUrl = chrome.runtime.getURL('assets/bggoldreward50.mp4')

interface DiscoveryReward {
  status: 'Pioneer' | 'Explorer' | 'Contributor'
  gold: number
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
  estimateOptions?: { isNewTriple?: boolean; newAtomCount?: number }
  /** Customize submit button text (default: "Amplify") */
  submitLabel?: string
  /** Show XP cube animation on success (for quest/XP claim flows) */
  showXpAnimation?: boolean
  /** Optional curve selector for debate claims (linear=1 / progressive=2) */
  curveSelector?: {
    selected: "linear" | "progressive"
    onChange: (curve: "linear" | "progressive") => void
  }
  /** Rendered below the success card (e.g. PagePositionBoard) */
  positionBoard?: React.ReactNode
  /** Called when user removes a triplet from the batch (receives triplet id) */
  onRemoveTriplet?: (tripletId: string) => void
  onClose: () => void
  onSubmit: (customWeights?: (bigint | null)[]) => Promise<void>
}

type WeightOption = {
  id: 'minimum' | 'default' | 'strong' | 'high' | 'max' | 'custom'
  label: string
  value: number | null
  description: string
}

const weightOptions: WeightOption[] = [
  { id: 'minimum', label: 'Minimum', value: 0.01, description: '0.01 TRUST' },
  { id: 'default', label: 'Default', value: 0.5, description: '0.5 TRUST' },
  { id: 'strong', label: 'Strong', value: 1, description: '1 TRUST' },
  { id: 'high', label: 'High', value: 5, description: '5 TRUST' },
  { id: 'max', label: 'Max', value: 10, description: '10 TRUST' },
  { id: 'custom', label: 'Custom', value: null, description: 'Enter your own amount' }
]

const WeightModal = ({ isOpen, triplets, isProcessing, transactionSuccess = false, transactionError, transactionHash, createdCount = 0, depositCount = 0, isIntentionCertification = false, discoveryReward, onClaimReward, rewardClaimed = false, fixedDeposit, estimateOptions, submitLabel, showXpAnimation = false, curveSelector, positionBoard, onRemoveTriplet, onClose, onSubmit }: WeightModalProps) => {
  const [selectedWeights, setSelectedWeights] = useState<(WeightOption['id'])[]>([])
  const [customValues, setCustomValues] = useState<string[]>([])
  const [processingStep, setProcessingStep] = useState('')

  const { gsEnabled, gsConfig, getUserPercentage, setUserPercentage } = useGlobalStake()
  const [gsPercentage, setGsPercentage] = useState<number>(() =>
    getUserPercentage()
  )

  const { ppEnabled, getUserPercentage: getPPPercentage, setUserPercentage: setPPPercentage, detectPlatformFromUrl } = usePlatformPool()
  // Per-platform percentage: slug → percentage (0-50000)
  const [ppPerPlatform, setPpPerPlatform] = useState<Record<string, number>>({})

  const setPpForSlug = (slug: string, pct: number) => {
    setPpPerPlatform(prev => ({ ...prev, [slug]: pct }))
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
  const platformLabel = detectedPlatforms.length === 1
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

  // Resync GS + PP preferences when modal opens
  useEffect(() => {
    if (isOpen) {
      setGsPercentage(getUserPercentage())
      setPpPerPlatform({})
    }
  }, [isOpen, getUserPercentage, getPPPercentage])

  // Track removed triplets (by index) — kept in array for stable submit mapping
  const [removedIndices, setRemovedIndices] = useState<Set<number>>(new Set())
  // Apply a single weight option to ALL triplets at once
  const [globalWeight, setGlobalWeight] = useState<WeightOption['id']>('default')
  const [globalCustomValue, setGlobalCustomValue] = useState('')

  // Initialize weights array when the actual triplets change (not just reference)
  const tripletKey = triplets.map(t => t.id).join(',')
  useEffect(() => {
    if (triplets.length > 0) {
      setSelectedWeights(new Array(triplets.length).fill('default'))
      setCustomValues(new Array(triplets.length).fill(''))
      setGlobalWeight('default')
      setGlobalCustomValue('')
      setRemovedIndices(new Set())
    }
  }, [tripletKey])

  // Warn user before leaving during processing
  useEffect(() => {
    if (!isProcessing) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isProcessing])

  // Processing animation steps
  useEffect(() => {
    if (isProcessing) {
      const steps = [
        'Preparing triples...',
        'Creating atoms...',
        'Publishing to blockchain...',
        'Confirming transaction...'
      ]

      let stepIndex = 0
      setProcessingStep(steps[0])

      const interval = setInterval(() => {
        stepIndex = (stepIndex + 1) % steps.length
        setProcessingStep(steps[stepIndex])
      }, 2000)

      return () => clearInterval(interval)
    } else {
      setProcessingStep('')
    }
  }, [isProcessing])

  // Destructure estimateOptions for stable useMemo deps
  const isNewTriple = estimateOptions?.isNewTriple ?? true
  const newAtomCount = estimateOptions?.newAtomCount ?? 1

  // Compute real-time breakdown for display
  const activeCount = triplets.length - removedIndices.size
  const breakdown = useMemo(() => {
    const minimumValue = weightOptions.find(opt => opt.id === 'minimum')!.value!
    const defaultValue = weightOptions.find(opt => opt.id === 'default')!.value!

    let totalTrust = 0
    if (fixedDeposit != null) {
      totalTrust = fixedDeposit
    } else {
      for (let i = 0; i < selectedWeights.length; i++) {
        if (removedIndices.has(i)) continue
        const sel = selectedWeights[i]
        if (sel === 'custom') {
          const cv = customValues[i]
          totalTrust += (cv && cv.trim() !== '') ? parseFloat(cv) || 0 : minimumValue
        } else {
          const opt = weightOptions.find(o => o.id === sel)
          totalTrust += opt?.value ?? defaultValue
        }
      }
    }

    // Count active items with interest context for TX2 cost estimation
    const contextTripleCount = triplets.filter(
      (t, i) => !removedIndices.has(i) && t.interestContext
    ).length
    // Average PP percentage across all detected platforms
    const totalPPPercentage = hasPlatforms
      ? detectedPlatforms.reduce((sum, p) => sum + getPpForSlug(p.slug), 0) / detectedPlatforms.length
      : 0
    const effectivePP = Math.round(totalPPPercentage)
    const createOpts = { isNewTriple, newAtomCount, itemCount: activeCount, contextTripleCount, ppPercentage: effectivePP }

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
    // Check belowMinimum per item, not on total — each triple is split individually
    const perItemPool = activeCount > 0 ? poolAmount / activeCount : poolAmount
    const belowMinimum = perItemPool > 0 && perItemPool < minDeposit

    const effectiveGsPercentage = belowMinimum ? 0 : gsPercentage
    const costEstimate = estimate?.(totalTrust, effectiveGsPercentage, createOpts) ?? null

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
  }, [selectedWeights, customValues, gsPercentage, ppPerPlatform, gsEnabled, gsConfig, estimate, fixedDeposit, isNewTriple, newAtomCount, activeCount, removedIndices, triplets, hasPlatforms, detectedPlatforms])

  const handleSubmit = async () => {
    try {
      // Persist GS + PP preferences before submitting
      if (gsEnabled) {
        setUserPercentage(gsPercentage)
      }
      if (ppEnabled && hasPlatforms) {
        // Persist the average as default for next time
        const avgPP = detectedPlatforms.reduce((sum, p) => sum + getPpForSlug(p.slug), 0) / detectedPlatforms.length
        setPPPercentage(Math.round(avgPP))
      }

      const minimumValue = weightOptions.find(opt => opt.id === 'minimum')!.value!
      const defaultValue = weightOptions.find(opt => opt.id === 'default')!.value!

      const weightBigIntArray: (bigint | null)[] = selectedWeights.map((selectedWeight, index) => {
        // Removed items → null weight
        if (removedIndices.has(index)) return null

        let trustValue: number

        if (selectedWeight === 'custom') {
          const customValue = customValues[index]
          if (customValue && customValue.trim() !== '') {
            trustValue = parseFloat(customValue)
          } else {
            trustValue = minimumValue
          }
        } else {
          const option = weightOptions.find(opt => opt.id === selectedWeight)
          if (!option || option.value === null) {
            logger.error('Invalid weight option', selectedWeight)
            trustValue = defaultValue
          } else {
            trustValue = option.value
          }
        }

        return BigInt(Math.floor(trustValue * 1e18))
      })

      await onSubmit(weightBigIntArray)
    } catch (error) {
      logger.error('Failed to submit weights', error)
    }
  }

  const handleClose = () => {
    if (isProcessing) return
    setSelectedWeights(new Array(triplets.length).fill('default'))
    setCustomValues(new Array(triplets.length).fill(''))
    onClose()
  }

  const handleWeightSelection = (tripletIndex: number, optionId: WeightOption['id']) => {
    const newSelectedWeights = [...selectedWeights]
    newSelectedWeights[tripletIndex] = optionId
    setSelectedWeights(newSelectedWeights)
  }

  const handleCustomValueChange = (tripletIndex: number, value: string) => {
    const newCustomValues = [...customValues]
    newCustomValues[tripletIndex] = value
    setCustomValues(newCustomValues)
  }

  const handleApplyAll = (optionId: WeightOption['id']) => {
    setGlobalWeight(optionId)
    setSelectedWeights(new Array(triplets.length).fill(optionId))
    if (optionId !== 'custom') {
      setCustomValues(new Array(triplets.length).fill(''))
    }
  }

  const handleGlobalCustomChange = (value: string) => {
    setGlobalCustomValue(value)
    setGlobalWeight('custom')
    setSelectedWeights(new Array(triplets.length).fill('custom'))
    setCustomValues(new Array(triplets.length).fill(value))
  }

  const parseErrorMessage = (error: string): string => {
    if (error.includes('Wallet unavailable:') || error.includes('navigate to an HTTPS page')) {
      return error
    }
    const failedMatch = error.match(/(Shares addition failed|Weight addition failed):/i)
    const failedText = failedMatch ? failedMatch[0] : 'Transaction failed:'
    const detailsMatch = error.match(/Details:\s*(.+?)(?:\n|$)/i)
    const detailsText = detailsMatch ? `Details: ${detailsMatch[1]}` : ''
    return detailsText ? `${failedText}\n${detailsText}` : failedText
  }

  /** Format number to max 4 decimal places, strip trailing zeros */
  const formatTrust = (val: number): string => {
    if (val === 0) return '0'
    return parseFloat(val.toFixed(4)).toString()
  }

  const isFormState = !transactionSuccess && !transactionError

  if (!isOpen || triplets.length === 0) return null

  return createPortal(
    <div className={`modal-overlay ${isProcessing ? 'processing' : ''}`}>
      <div className="modal-content">
        {!(rewardClaimed && discoveryReward) && (
        <>
        <div className="modal-body">
          {isFormState && (
            <p className="modal-description">
              {fixedDeposit != null
                ? 'Review the cost breakdown before confirming.'
                : 'Set your deposit, allocate to pools, review fees and confirm.'}
            </p>
          )}

          {/* Apply to all — when multiple triplets */}
          {isFormState && fixedDeposit == null && activeCount > 1 && (
            <div className="weight-modal-apply-all">
              <span className="weight-modal-apply-all__label">
                Set all ({activeCount} items)
              </span>
              <div className="weight-modal-amount-row">
                <input
                  type="number"
                  min="0"
                  step="0.000001"
                  value={
                    globalWeight === 'custom'
                      ? globalCustomValue
                      : (weightOptions.find(opt => opt.id === globalWeight)?.value || '')
                  }
                  onChange={(e) => handleGlobalCustomChange(e.target.value)}
                  onFocus={(e) => {
                    handleApplyAll('custom')
                    e.target.select()
                  }}
                  className="weight-modal-amount-input"
                  placeholder="0.01"
                  disabled={isProcessing}
                />
                <div className="weight-modal-pills">
                  {weightOptions.filter(opt => opt.id !== 'custom').map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        handleApplyAll(option.id)
                        setGlobalCustomValue('')
                      }}
                      className={`weight-modal-pill ${globalWeight === option.id ? 'selected' : ''}`}
                      disabled={isProcessing}
                    >
                      {option.value}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Triplets List — form state only (hidden on success with reward) */}
          {!(transactionSuccess && discoveryReward) && (
            <div className="modal-triplets-list">
              {triplets.map((triplet, index) => {
                if (removedIndices.has(index)) return null
                return (
                <div key={triplet.id} className="weight-modal-triplet-card">
                  {/* Remove button — only when multiple items */}
                  {isFormState && triplets.length > 1 && (
                    <button
                      className="weight-modal-triplet-remove"
                      onClick={() => {
                        setRemovedIndices(prev => new Set(prev).add(index))
                        onRemoveTriplet?.(triplet.id)
                      }}
                      disabled={isProcessing || activeCount <= 1}
                      title="Remove from batch"
                    >
                      ×
                    </button>
                  )}
                  <div className="weight-modal-triplet-text">
                    {(() => {
                      const badge = getIntentionBadge(triplet.intention)
                      const truncate = (text: string, max: number) =>
                        text.length > max ? text.slice(0, max) + '...' : text
                      const isVotePredicate = ['like', 'dislike'].includes(
                        triplet.triplet.predicate.toLowerCase()
                      )
                      if (!badge) {
                        return (
                          <>
                            <span className="subject">{triplet.triplet.subject || 'I'}</span>{' '}
                            <span className="action">{triplet.triplet.predicate}</span>{' '}
                            <span className="object">{truncate(triplet.triplet.object, 40)}</span>
                          </>
                        )
                      }
                      const badgeContainer = (
                        <span
                          className="weight-modal-cert-target"
                          style={{
                            borderColor: `${badge.color}40`,
                            backgroundColor: `${badge.color}0A`
                          }}
                        >
                          <span className="object">{truncate(triplet.triplet.object, 40)}</span>
                          <span className="weight-modal-cert-dot">·</span>
                          <span
                            className="weight-modal-intention-badge"
                            style={{ color: badge.color }}
                          >
                            {badge.label}
                          </span>
                          {triplet.interestContext && TOPIC_LABELS[triplet.interestContext] && (
                            <>
                              <span className="weight-modal-cert-dot">·</span>
                              <span
                                className="weight-modal-context-badge"
                                style={{ color: TOPIC_COLORS[triplet.interestContext] || "#888" }}
                              >
                                {TOPIC_LABELS[triplet.interestContext]}
                              </span>
                            </>
                          )}
                        </span>
                      )
                      if (isVotePredicate) {
                        return (
                          <>
                            <span className="subject">I</span>{' '}
                            <span className="action">{triplet.triplet.predicate}</span>{' '}
                            {badgeContainer}
                          </>
                        )
                      }
                      return badgeContainer
                    })()}
                  </div>

                  {/* Amount pills — only in form state, hidden when fixedDeposit */}
                  {isFormState && fixedDeposit == null && (
                    <div className="weight-modal-amount-row">
                      <div className="weight-modal-pills">
                        {weightOptions.filter(opt => opt.id !== 'custom').map((option) => (
                          <button
                            key={option.id}
                            onClick={() => handleWeightSelection(index, option.id)}
                            className={`weight-modal-pill ${selectedWeights[index] === option.id ? 'selected' : ''}`}
                            disabled={isProcessing}
                          >
                            {option.value}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Per-item platform pool slider */}
                  {isFormState && ppEnabled && (() => {
                    const itemPlatform = detectPlatformFromUrl(triplet.url)
                    if (!itemPlatform) return null
                    const slugPct = getPpForSlug(itemPlatform.slug)
                    return (
                      <div className="pp-item-slider">
                        <span className="pp-item-slider__label">
                          {itemPlatform.label} Pool
                        </span>
                        <input
                          type="range"
                          min={0}
                          max={50000}
                          step={1000}
                          value={slugPct}
                          onChange={(e) => setPpForSlug(itemPlatform.slug, Number(e.target.value))}
                          className="pp-item-slider__input"
                          style={{ '--pp-fill-pct': `${(slugPct / 50000) * 100}%` } as React.CSSProperties}
                          disabled={isProcessing}
                        />
                        <span className="pp-item-slider__value">
                          {slugPct / 1000}%
                        </span>
                      </div>
                    )
                  })()}
                </div>
                )
              })}
            </div>
          )}

          {/* Curve Selector — debate claims only */}
          {isFormState && curveSelector && (
            <div className="curve-selector">
              <span className="curve-selector-label">Bonding curve:</span>
              <div className="curve-toggle">
                <button
                  className={`curve-toggle-btn ${curveSelector.selected === 'linear' ? 'active' : ''}`}
                  onClick={() => curveSelector.onChange('linear')}
                  disabled={isProcessing}
                >
                  Linear
                </button>
                <button
                  className={`curve-toggle-btn ${curveSelector.selected === 'progressive' ? 'active' : ''}`}
                  onClick={() => curveSelector.onChange('progressive')}
                  disabled={isProcessing}
                >
                  Progressive
                </button>
              </div>
            </div>
          )}

          {/* Global Stake Slider — form state only, when GS enabled */}
          {isFormState && gsEnabled && (
            <div className="gs-slider-section">
              <div className="gs-slider-header">
                <span className="gs-slider-label">Beta Season Pool</span>
                <span className="gs-slider-value">{gsPercentage / 1000}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={50000}
                step={1000}
                value={gsPercentage}
                onChange={(e) => setGsPercentage(Number(e.target.value))}
                className="gs-slider-input"
                style={{ '--gs-fill-pct': `${(gsPercentage / 50000) * 100}%` } as React.CSSProperties}
                disabled={isProcessing}
              />
              <div className="gs-slider-breakdown">
                <div className="gs-slider-breakdown-item">
                  <span className="gs-slider-breakdown-label">Signal</span>
                  <span className="gs-slider-breakdown-value">{formatTrust(breakdown.signalAmount)} TRUST</span>
                </div>
                <div className="gs-slider-breakdown-item">
                  <span className="gs-slider-breakdown-label">Beta Season Pool</span>
                  <span className="gs-slider-breakdown-value pool">{formatTrust(breakdown.poolAmount)} TRUST</span>
                </div>
              </div>
              {breakdown.belowMinimum && (
                <span className="gs-slider-minimum-hint">Below minimum — pool contribution skipped</span>
              )}
            </div>
          )}

          {/* Cost breakdown — form state only */}
          {isFormState && (
            <div className="weight-modal-cost-summary">
              <div className="weight-modal-cost-row">
                <span>Deposit</span>
                <span>{formatTrust(breakdown.totalTrust)} TRUST</span>
              </div>
              {gsEnabled && gsPercentage > 0 && !breakdown.belowMinimum && (
                <>
                  <div className="weight-modal-cost-row weight-modal-cost-sub">
                    <span>Signal</span>
                    <span>{formatTrust(breakdown.signalAmount)} TRUST</span>
                  </div>
                  <div className="weight-modal-cost-row weight-modal-cost-sub">
                    <span>Beta Season Pool</span>
                    <span>{formatTrust(breakdown.poolAmount)} TRUST</span>
                  </div>
                </>
              )}
              {hasPlatforms && breakdown.platformPoolAmount > 0 && (
                <div className="weight-modal-cost-row weight-modal-cost-sub">
                  <span>{platformLabel}</span>
                  <span>{formatTrust(breakdown.platformPoolAmount)} TRUST</span>
                </div>
              )}
              {breakdown.totalFees > 0 && (
                <>
                  <div className="weight-modal-cost-divider" />
                  <div className="weight-modal-cost-row weight-modal-cost-fees-subtotal">
                    <span>Fees</span>
                    <span>{formatTrust(breakdown.totalFees)} TRUST</span>
                  </div>
                  {(breakdown.sofiaFixedFee > 0 || breakdown.sofiaPercentFee > 0) && (
                    <div className="weight-modal-cost-row weight-modal-cost-sub">
                      <span>Sofia fee</span>
                      <span>{formatTrust(breakdown.sofiaFixedFee + breakdown.sofiaPercentFee)} TRUST</span>
                    </div>
                  )}
                  {breakdown.creationCost > 0 && (
                    <div className="weight-modal-cost-row weight-modal-cost-sub">
                      <span>Intuition fee (creation only)</span>
                      <span>{formatTrust(breakdown.creationCost)} TRUST</span>
                    </div>
                  )}
                  {breakdown.contextTripleCost > 0 && (
                    <div className="weight-modal-cost-row weight-modal-cost-sub">
                      <span>Context (creation + deposit)</span>
                      <span>{formatTrust(breakdown.contextTripleCost)} TRUST</span>
                    </div>
                  )}
                  <div className="weight-modal-cost-divider" />
                  <div className="weight-modal-cost-row weight-modal-cost-total">
                    <span>Total</span>
                    <span>{formatTrust(breakdown.totalEstimate)} TRUST</span>
                  </div>
                </>
              )}
              <div className={`weight-modal-cost-row weight-modal-cost-balance ${breakdown.totalEstimate > userBalance ? 'weight-modal-insufficient' : ''}`}>
                <span>Balance</span>
                <span>{formatTrust(userBalance)} TRUST</span>
              </div>
              <p className="weight-modal-cost-note">
                {fixedDeposit != null
                  ? '* Estimated — actual may vary'
                  : '* May be lower for existing certifications'}
              </p>
            </div>
          )}

          {/* Success State */}
          {transactionSuccess && (
            <div className={`modal-success-card ${discoveryReward ? 'has-reward' : ''}`}>
              <div className="modal-success-card-glow" />
              {showXpAnimation && (
                <div className="modal-success-xp-animation">
                  <XpAnimation size={140} />
                </div>
              )}
              <div className="modal-success-card-inner">
                <div className="modal-success-left">
                  <h2 className="modal-success-title">
                    Transaction<br />Validated
                  </h2>
                  <p className="modal-success-subtitle">
                    {createdCount > 0 && depositCount > 0
                      ? `${createdCount} signal${createdCount > 1 ? 's' : ''} created, ${depositCount} existing signal${depositCount > 1 ? 's' : ''} reinforced!`
                      : depositCount > 0
                        ? `Your signal${depositCount > 1 ? 's have' : ' has'} been reinforced!`
                        : `Your signal${createdCount > 1 ? 's have' : ' has'} been amplified!`
                    }
                  </p>
                  {transactionHash && (
                    <a
                      href={`${EXPLORER_URLS.TRANSACTION}${transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="modal-tx-link"
                    >
                      View on Explorer →
                    </a>
                  )}
                </div>

                {/* Position Board — between explorer link and reward */}
                {positionBoard && (
                  <div className="modal-position-board">
                    {positionBoard}
                  </div>
                )}

                {discoveryReward && !rewardClaimed && (
                  <div className="modal-success-right">
                    <span className="reward-status-badge">{discoveryReward.status}</span>
                    <div className="reward-info">
                      <span className="reward-label">Reward</span>
                      <span className="reward-amount">+{discoveryReward.gold} Gold</span>
                    </div>
                    <button
                      className="claim-reward-btn"
                      onClick={onClaimReward}
                    >
                      Claim Reward
                    </button>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Error State */}
          {transactionError && !transactionSuccess && (
            <div className="modal-error-section">
              <div className="modal-error-icon">❌</div>
              <div className="modal-error-text">
                <p className="modal-error-title">Transaction Failed</p>
                <p className="modal-error-message">{parseErrorMessage(transactionError)}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
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
            <div className="modal-actions">
              <button
                className="stake-btn stake-btn-cancel"
                onClick={handleClose}
                disabled={isProcessing}
              >
                {(transactionSuccess || transactionError) ? 'Close' : 'Cancel'}
              </button>
              {!transactionSuccess && !transactionError && (
                <button
                  className="modal-btn primary"
                  onClick={handleSubmit}
                  disabled={isProcessing || breakdown.totalEstimate > userBalance || activeCount === 0}
                >
                  {isProcessing
                    ? (submitLabel ? 'Processing...' : 'Amplifying...')
                    : (submitLabel || 'Amplify')}
                </button>
              )}
              {transactionError && (
                <button
                  className="modal-btn primary"
                  onClick={handleSubmit}
                  disabled={isProcessing}
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </div>
        </>
        )}

        {/* Reward Claimed Overlay */}
        {rewardClaimed && discoveryReward && (
          <div className="reward-claimed-overlay">
            <video
              className="reward-claimed-bg-video"
              src={discoveryReward.gold >= 25 ? goldReward50VideoUrl : goldRewardVideoUrl}
              autoPlay
              muted
              loop
              playsInline
            />
            <div className="reward-claimed-content">
              <div className="reward-claimed-top">
                <h2 className="reward-claimed-title">
                  Reward<br />Claimed!
                </h2>
                <p className="reward-claimed-subtitle">
                  {discoveryReward.gold} Gold added to your balance
                </p>
              </div>

              <div className="reward-claimed-bottom">
                <p className="reward-claimed-total">
                  Total: {totalGold} Gold
                </p>
                <button
                  className="reward-continue-btn"
                  onClick={handleClose}
                >
                  Continue Building
                </button>
                {transactionHash && (
                  <a
                    href={`${EXPLORER_URLS.TRANSACTION}${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="reward-view-tx-link"
                  >
                    View Transaction →
                  </a>
                )}
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
