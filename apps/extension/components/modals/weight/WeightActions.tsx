/**
 * WeightActions — Cancel / Submit / Retry / Close buttons at the bottom of WeightModal.
 *
 * Behavior preserved 1:1 from the original modal-actions block.
 * Hidden by the parent when rewardClaimed or when the success-with-reward layout is active.
 */

import type { WeightBreakdown } from "./types"

export interface WeightActionsProps {
  isProcessing: boolean
  transactionSuccess: boolean
  transactionError?: string
  submitLabel?: string
  breakdown: WeightBreakdown
  userBalance: number
  activeCount: number
  onClose: () => void
  onSubmit: () => void
}

const WeightActions = ({
  isProcessing,
  transactionSuccess,
  transactionError,
  submitLabel,
  breakdown,
  userBalance,
  activeCount,
  onClose,
  onSubmit
}: WeightActionsProps) => {
  const showAmplify = !transactionSuccess && !transactionError
  const showRetry = Boolean(transactionError) && !transactionSuccess

  return (
    <div className="modal-actions">
      <button
        className="stake-btn stake-btn-cancel"
        onClick={onClose}
        disabled={isProcessing}>
        {transactionSuccess || transactionError ? "Close" : "Cancel"}
      </button>

      {showAmplify && (
        <button
          className="modal-btn primary"
          onClick={onSubmit}
          disabled={
            isProcessing ||
            breakdown.totalEstimate > userBalance ||
            activeCount === 0
          }>
          {isProcessing
            ? submitLabel
              ? "Processing..."
              : "Amplifying..."
            : submitLabel || "Amplify"}
        </button>
      )}

      {showRetry && (
        <button
          className="modal-btn primary"
          onClick={onSubmit}
          disabled={isProcessing}>
          Retry
        </button>
      )}
    </div>
  )
}

export default WeightActions
