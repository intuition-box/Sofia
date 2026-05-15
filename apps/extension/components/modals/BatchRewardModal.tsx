/**
 * BatchRewardModal
 * Thin overlay wrapper around BatchRewardContent.
 * Owns the portal + overlay markup; defers all reward logic to BatchRewardContent
 * so the same content can be rendered inside other modals (e.g. WeightModal).
 */

import { createPortal } from "react-dom"
import BatchRewardContent from "./reward/BatchRewardContent"
import type { CartItemRecord } from "~/lib/database"
import "../styles/Modal.css"
import "../styles/BatchRewardModal.css"

interface BatchRewardModalProps {
  isOpen: boolean
  items: CartItemRecord[]
  txHash?: string
  onClose: () => void
}

const BatchRewardModal = ({
  isOpen,
  items,
  txHash,
  onClose
}: BatchRewardModalProps) => {
  if (!isOpen || items.length === 0) return null

  return createPortal(
    <div className="batch-reward-overlay">
      <div className="batch-reward">
        <BatchRewardContent
          items={items}
          txHash={txHash}
          onClose={onClose}
          enabled={isOpen}
        />
      </div>
    </div>,
    document.body
  )
}

export default BatchRewardModal
