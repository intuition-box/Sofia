/**
 * Shared types & constants for WeightModal sub-components.
 *
 * The deposit picker uses 3 presets (Light / Medium / Strong) — no slider, no custom input.
 * Values were kept aligned with the historical "minimum / default / strong" thresholds so
 * existing flows (follow, intentions) don't see a cost change.
 */

export type WeightOptionId = "light" | "medium" | "strong"

export interface WeightOption {
  id: WeightOptionId
  label: string
  value: number
  description: string
}

export const weightOptions: WeightOption[] = [
  { id: "light", label: "Light", value: 0.01, description: "0.01 TRUST" },
  { id: "medium", label: "Medium", value: 0.5, description: "0.5 TRUST" },
  { id: "strong", label: "Strong", value: 1, description: "1 TRUST" }
]

export const DEFAULT_WEIGHT: WeightOptionId = "medium"

export const getWeightValue = (id: WeightOptionId): number => {
  const opt = weightOptions.find((o) => o.id === id)
  return opt?.value ?? weightOptions[1].value
}

export interface WeightBreakdown {
  totalTrust: number
  signalAmount: number
  poolAmount: number
  platformPoolAmount: number
  belowMinimum: boolean
  creationCost: number
  sofiaFixedFee: number
  sofiaPercentFee: number
  contextTripleCost: number
  totalFees: number
  totalEstimate: number
  depositCount: number
}

export interface DiscoveryReward {
  status: "Pioneer" | "Explorer" | "Contributor"
  gold: number
}

export const formatTrust = (val: number): string => {
  if (val === 0) return "0"
  return parseFloat(val.toFixed(4)).toString()
}
