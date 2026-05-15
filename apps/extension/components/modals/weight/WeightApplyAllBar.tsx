/**
 * WeightApplyAllBar — preset row shown above the triplet list when the batch has more than one item.
 *
 * Applies a single preset (Light / Medium / Strong) to every triplet in the batch.
 * No numeric input — value is constrained to the 3 presets defined in types.ts.
 */

import { weightOptions, type WeightOptionId } from "./types"

export interface WeightApplyAllBarProps {
  activeCount: number
  globalWeight: WeightOptionId
  isProcessing: boolean
  onApplyAll: (optionId: WeightOptionId) => void
}

const WeightApplyAllBar = ({
  activeCount,
  globalWeight,
  isProcessing,
  onApplyAll
}: WeightApplyAllBarProps) => {
  return (
    <div className="weight-apply-all">
      <span className="weight-apply-all__label">
        Apply to all ({activeCount} items)
      </span>
      <div className="weight-apply-all__presets">
        {weightOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => onApplyAll(option.id)}
            className={`weight-preset weight-preset--compact ${globalWeight === option.id ? "is-selected" : ""}`}
            disabled={isProcessing}
            type="button">
            <span className="weight-preset__label">{option.label}</span>
            <span className="weight-preset__value">{option.value}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default WeightApplyAllBar
