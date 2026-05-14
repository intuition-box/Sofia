/**
 * WeightTotal — total deposit + collapsible breakdown shown in WeightModal form state.
 *
 * Top line stays compact: total + balance. Detailed fee breakdown lives behind a <details>
 * toggle, collapsed by default. Insufficient-balance flagged via class on the balance row.
 */

import { formatTrust, type WeightBreakdown } from "./types"

export interface WeightTotalProps {
  breakdown: WeightBreakdown
  userBalance: number
  gsEnabled: boolean
  gsPercentage: number
  hasPlatforms: boolean
  platformLabel: string
  fixedDeposit?: number
}

const WeightTotal = ({
  breakdown,
  userBalance,
  gsEnabled,
  gsPercentage,
  hasPlatforms,
  platformLabel,
  fixedDeposit
}: WeightTotalProps) => {
  const insufficient = breakdown.totalEstimate > userBalance
  const showGsSplit =
    gsEnabled && gsPercentage > 0 && !breakdown.belowMinimum
  const showFees = breakdown.totalFees > 0

  return (
    <div className="weight-total">
      <div className="weight-total__primary">
        <div className="weight-total__row weight-total__row--total">
          <span>Total deposit</span>
          <span>{formatTrust(breakdown.totalEstimate)} TRUST</span>
        </div>
        <div
          className={`weight-total__row weight-total__row--balance ${insufficient ? "is-insufficient" : ""}`}>
          <span>Your balance</span>
          <span>{formatTrust(userBalance)} TRUST</span>
        </div>
      </div>

      {(showGsSplit || hasPlatforms || showFees) && (
        <details className="weight-total__details">
          <summary>Breakdown</summary>

          <div className="weight-total__row">
            <span>Deposit</span>
            <span>{formatTrust(breakdown.totalTrust)} TRUST</span>
          </div>

          {showGsSplit && (
            <>
              <div className="weight-total__row weight-total__row--sub">
                <span>Signal</span>
                <span>{formatTrust(breakdown.signalAmount)} TRUST</span>
              </div>
              <div className="weight-total__row weight-total__row--sub">
                <span>Beta Season Pool</span>
                <span>{formatTrust(breakdown.poolAmount)} TRUST</span>
              </div>
            </>
          )}

          {hasPlatforms && breakdown.platformPoolAmount > 0 && (
            <div className="weight-total__row weight-total__row--sub">
              <span>{platformLabel}</span>
              <span>{formatTrust(breakdown.platformPoolAmount)} TRUST</span>
            </div>
          )}

          {showFees && (
            <>
              <div className="weight-total__divider" />
              <div className="weight-total__row weight-total__row--fees">
                <span>Fees</span>
                <span>{formatTrust(breakdown.totalFees)} TRUST</span>
              </div>
              {(breakdown.sofiaFixedFee > 0 ||
                breakdown.sofiaPercentFee > 0) && (
                <div className="weight-total__row weight-total__row--sub">
                  <span>Sofia fee</span>
                  <span>
                    {formatTrust(
                      breakdown.sofiaFixedFee + breakdown.sofiaPercentFee
                    )}{" "}
                    TRUST
                  </span>
                </div>
              )}
              {breakdown.creationCost > 0 && (
                <div className="weight-total__row weight-total__row--sub">
                  <span>Intuition fee (creation only)</span>
                  <span>{formatTrust(breakdown.creationCost)} TRUST</span>
                </div>
              )}
              {breakdown.contextTripleCost > 0 && (
                <div className="weight-total__row weight-total__row--sub">
                  <span>Context (creation + deposit)</span>
                  <span>{formatTrust(breakdown.contextTripleCost)} TRUST</span>
                </div>
              )}
            </>
          )}

          <p className="weight-total__note">
            {fixedDeposit != null
              ? "* Estimated — actual may vary"
              : "* May be lower for existing Marks"}
          </p>
        </details>
      )}
    </div>
  )
}

export default WeightTotal
