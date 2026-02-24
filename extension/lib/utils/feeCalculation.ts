import type { FeeParams, ProtocolCosts, CostEstimate } from "../../types/blockchain"

/**
 * Pure function to estimate the total cost of a certification action.
 *
 * All monetary values are expressed in TRUST (floating-point for display).
 * Fee params and protocol costs are read from the chain elsewhere and
 * passed in — this function does zero network calls.
 *
 * @param depositTrust   Total deposit chosen by user (e.g. 0.5 TRUST)
 * @param gsPercentage   Global Stake slider value (0-100000, denom 100000)
 * @param gsDenominator  Global Stake denominator (100000)
 * @param feeParams      Fee params read from SofiaFeeProxy contract
 * @param protocolCosts  Protocol costs read from MultiVault contract
 * @param options        Optional flags for CREATE vs DEPOSIT path
 */
export function estimateCertificationCost(
  depositTrust: number,
  gsPercentage: number,
  gsDenominator: number,
  feeParams: FeeParams,
  protocolCosts: ProtocolCosts,
  options?: { isNewTriple?: boolean; newAtomCount?: number }
): CostEstimate {
  const { depositFixed, depositPct, creationFixed, feeDenom } = feeParams
  const { tripleCost, atomCost } = protocolCosts
  const isNewTriple = options?.isNewTriple ?? false
  const newAtomCount = options?.newAtomCount ?? 0

  // --- Deposit split ---
  const poolFraction = gsPercentage / gsDenominator
  const poolAmount = depositTrust * poolFraction
  const signalAmount = depositTrust - poolAmount
  const depositCount = poolAmount > 0 ? 2 : 1

  // --- Sofia fees (from SofiaFeeProxy) ---
  // Fixed fee: depositFixedFee per deposit entry
  const fixedFeePerDeposit = Number(depositFixed) / 1e18
  const sofiaFixedFee = fixedFeePerDeposit * depositCount

  // Percentage fee: depositPercentageFee / FEE_DENOMINATOR * totalDeposit
  // Math: 5% * (signal + pool) = 5% * total  (distributive property)
  const pctRate = Number(depositPct) / Number(feeDenom)
  const sofiaPercentFee = pctRate * depositTrust

  // Creation fixed fee: only on CREATE path (per new triple/atom)
  const creationFixedPerUnit = Number(creationFixed) / 1e18
  let creationFixedFeeTotal = 0
  if (isNewTriple) {
    // 1 triple creation + newAtomCount atom creations
    creationFixedFeeTotal = creationFixedPerUnit * (1 + newAtomCount)
  }

  // --- Creation costs (full mandatory cost from MultiVault on CREATE path) ---
  // Includes protocol fee + initial vault deposits — all leave the user's wallet
  let creationCost = 0
  if (isNewTriple) {
    creationCost += Number(tripleCost) / 1e18
    creationCost += (Number(atomCost) / 1e18) * newAtomCount
  }

  // --- Totals ---
  const totalFees = sofiaFixedFee + sofiaPercentFee + creationFixedFeeTotal + creationCost
  const totalEstimate = depositTrust + totalFees

  return {
    depositAmount: depositTrust,
    signalAmount,
    poolAmount,
    creationCost,
    sofiaFixedFee,
    sofiaPercentFee,
    creationFixedFee: creationFixedFeeTotal,
    totalFees,
    totalEstimate,
    depositCount
  }
}
