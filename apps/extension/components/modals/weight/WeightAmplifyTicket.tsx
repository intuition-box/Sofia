/**
 * WeightAmplifyTicket — the "Amplify" (b3) deposit surface: headline, quick
 * presets, the basket (a WeightBasketRow per mark), optional bonding-curve and
 * Beta Season Pool controls, the cost ledger, and the confirm/cancel actions.
 *
 * Owns per-row selection wiring (toggle on/off, weight tier) and delegates each
 * row's rendering to WeightBasketRow. All amounts/totals are computed by the
 * parent and passed in via `breakdown`.
 */
import type { Dispatch, SetStateAction } from "react"

import type { ModalTriplet } from "~/hooks"

import SofiaLoader from "../../ui/SofiaLoader"
import WeightBasketRow from "./WeightBasketRow"
import {
  formatTrust,
  weightOptions,
  type DetectPlatformFn,
  type WeightBreakdown,
  type WeightOptionId
} from "./types"

interface CurveSelector {
  selected: "linear" | "progressive"
  onChange: (curve: "linear" | "progressive") => void
}

interface WeightAmplifyTicketProps {
  triplets: ModalTriplet[]
  removedIndices: Set<number>
  setRemovedIndices: Dispatch<SetStateAction<Set<number>>>
  onRemoveTriplet?: (tripletId: string) => void
  onClearCart?: () => void
  selectedWeights: WeightOptionId[]
  activeCount: number
  isProcessing: boolean
  processingStep: string
  fixedDeposit?: number
  ppEnabled: boolean
  detectPlatformFromUrl: DetectPlatformFn
  getPpForSlug: (slug: string) => number
  setPpForSlug: (slug: string, pct: number) => void
  onApplyAll: (optionId: WeightOptionId) => void
  onWeightSelect: (index: number, optionId: WeightOptionId) => void
  curveSelector?: CurveSelector
  gsEnabled: boolean
  gsPercentage: number
  setGsPercentage: (pct: number) => void
  breakdown: WeightBreakdown
  platformLabel: string
  userBalance: number
  submitLabel?: string
  onClose: () => void
  onSubmit: () => void
}

export default function WeightAmplifyTicket({
  triplets,
  removedIndices,
  setRemovedIndices,
  onRemoveTriplet,
  onClearCart,
  selectedWeights,
  activeCount,
  isProcessing,
  processingStep,
  fixedDeposit,
  ppEnabled,
  detectPlatformFromUrl,
  getPpForSlug,
  setPpForSlug,
  onApplyAll,
  onWeightSelect,
  curveSelector,
  gsEnabled,
  gsPercentage,
  setGsPercentage,
  breakdown,
  platformLabel,
  userBalance,
  submitLabel,
  onClose,
  onSubmit
}: WeightAmplifyTicketProps) {
  // In cart mode (onClearCart wired) the basket can be emptied entirely:
  // every mark is uncheckable and unchecking the last one clears the cart.
  // Elsewhere a lone mark stays locked on and the last active mark can't go.
  const clearable = !!onClearCart
  const lockedSingle = triplets.length <= 1 && !clearable
  const canToggleOff = activeCount > 1 || clearable

  const toggleRow = (index: number, triplet: ModalTriplet, on: boolean) => {
    if (lockedSingle || isProcessing) return
    if (on) {
      // Unchecking the last remaining mark empties the whole cart and closes.
      if (activeCount <= 1) {
        if (clearable) onClearCart?.()
        return
      }
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

  return (
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
                  onClick={() => onApplyAll(o.id)}>
                  All · {o.label}
                </button>
              ))}
            </div>
          )}

          {clearable && (
            <div className="b3-basket-head">
              <span className="b3-basket-count">
                {activeCount} {activeCount === 1 ? "mark" : "marks"}
              </span>
              <button
                className="b3-basket-clear"
                type="button"
                disabled={isProcessing}
                onClick={onClearCart}>
                Clear all
              </button>
            </div>
          )}

          <div className="b3-basket">
            {triplets.map((triplet, index) => {
              const on = !removedIndices.has(index)
              return (
                <WeightBasketRow
                  key={triplet.id}
                  triplet={triplet}
                  on={on}
                  sel={selectedWeights[index]}
                  fixedDeposit={fixedDeposit}
                  isProcessing={isProcessing}
                  canToggleOff={canToggleOff}
                  lockedSingle={lockedSingle}
                  ppEnabled={ppEnabled}
                  detectPlatformFromUrl={detectPlatformFromUrl}
                  getPpForSlug={getPpForSlug}
                  setPpForSlug={setPpForSlug}
                  onToggle={() => toggleRow(index, triplet, on)}
                  onWeightSelect={(id) => onWeightSelect(index, id)}
                />
              )
            })}
          </div>

          {curveSelector && (
            <div className="b3-extra">
              <div className="curve-selector">
                <span className="curve-selector-label">Bonding curve:</span>
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
                      curveSelector.selected === "progressive" ? "active" : ""
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
                <span>{formatTrust(breakdown.platformPoolAmount)} TRUST</span>
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
              onClick={onClose}
              disabled={isProcessing}>
              Cancel
            </button>
            <button
              className="b3-btn b3-btn--primary"
              type="button"
              onClick={onSubmit}
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
  )
}
