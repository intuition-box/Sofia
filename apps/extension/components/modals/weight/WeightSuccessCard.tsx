/**
 * WeightSuccessCard — success state UI shown in WeightModal after a successful tx.
 *
 * Note: this block will be replaced or wrapped by BatchRewardContent during Phase 3a
 * (modal stitching). Extracted now to keep WeightModal lean and to make the swap
 * a one-line change later.
 *
 * Behavior preserved 1:1 from the original modal-success-card block.
 */

import { EXPLORER_URLS } from "~/lib/config/chainConfig"

export interface WeightSuccessCardProps {
  transactionHash?: string
  createdCount: number
  depositCount: number
  positionBoard?: React.ReactNode
}

const WeightSuccessCard = ({
  transactionHash,
  createdCount,
  depositCount,
  positionBoard
}: WeightSuccessCardProps) => {
  const subtitle =
    createdCount > 0 && depositCount > 0
      ? `${createdCount} signal${createdCount > 1 ? "s" : ""} created, ${depositCount} existing signal${depositCount > 1 ? "s" : ""} reinforced!`
      : depositCount > 0
        ? `Your signal${depositCount > 1 ? "s have" : " has"} been reinforced!`
        : `Your signal${createdCount > 1 ? "s have" : " has"} been amplified!`

  return (
    <div className="modal-success-card">
      <div className="modal-success-card-glow" />
      <div className="modal-success-card-inner">
        <div className="modal-success-left">
          <h2 className="modal-success-title">
            Transaction
            <br />
            Validated
          </h2>
          <p className="modal-success-subtitle">{subtitle}</p>
          {transactionHash && (
            <a
              href={`${EXPLORER_URLS.TRANSACTION}${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="modal-tx-link">
              View on Explorer →
            </a>
          )}
        </div>

        {positionBoard && (
          <div className="modal-position-board">{positionBoard}</div>
        )}

      </div>
    </div>
  )
}

export default WeightSuccessCard
