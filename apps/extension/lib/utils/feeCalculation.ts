import type {
  CostEstimate,
  FeeParams,
  ProtocolCosts
} from "../../types/blockchain"

/** Platform pool share denominator (PlatformPoolService) */
const PP_DENOMINATOR = 100000
/** PlatformPoolService.MIN_PLATFORM_DEPOSIT, in TRUST */
const MIN_PLATFORM_DEPOSIT = 0.01

/**
 * Pure function to estimate the total cost of a certification action.
 *
 * All monetary values are expressed in TRUST (floating-point for display).
 * Fee params and protocol costs are read from the chain elsewhere and
 * passed in — this function does zero network calls.
 *
 * @param depositTrust   Total deposit chosen by user (e.g. 0.5 TRUST)
 * @param feeParams      Fee params read from SofiaFeeProxy contract
 * @param protocolCosts  Protocol costs read from MultiVault contract
 * @param options        Optional flags for CREATE vs DEPOSIT path
 */
export function estimateCertificationCost(
  depositTrust: number,
  feeParams: FeeParams,
  protocolCosts: ProtocolCosts,
  options?: {
    isNewTriple?: boolean
    /** Number of new object atoms (URLs) to create */
    newAtomCount?: number
    /** Number of new predicate atoms to create (testnet predicates without pre-defined ID) */
    newPredicateAtomCount?: number
    /** Number of items in the batch (default 1) */
    itemCount?: number
    /** Number of context triples (TX2) — each costs tripleCost + min deposit */
    contextTripleCount?: number
    /** True if "in context of" predicate atom must be created (mainnet first use) */
    needsContextPredicateAtom?: boolean
    /** Platform pool share of the stake (0-80000, denominator 100000) */
    ppPercentage?: number
    /** Unique platforms in the batch — one pool deposit entry each */
    platformCount?: number
  }
): CostEstimate {
  const { depositFixed, depositPct, creationFixed, feeDenom } = feeParams
  const { tripleCost, atomCost } = protocolCosts
  const isNewTriple = options?.isNewTriple ?? false
  const newAtomCount = options?.newAtomCount ?? 0
  const newPredicateAtomCount = options?.newPredicateAtomCount ?? 0
  const itemCount = options?.itemCount ?? 1
  const contextTripleCount = options?.contextTripleCount ?? 0
  const needsContextPredicateAtom = options?.needsContextPredicateAtom ?? false
  const ppPercentage = options?.ppPercentage ?? 0
  const platformCount = options?.platformCount ?? (ppPercentage > 0 ? 1 : 0)

  const atomCostTrust = Number(atomCost) / 1e18

  // --- Deposit split: the platform pool share is taken OUT of the stake ---
  // (below the 0.01 TRUST minimum the service skips it — mirror that)
  const rawPlatformAmount =
    platformCount > 0 ? depositTrust * (ppPercentage / PP_DENOMINATOR) : 0
  const platformPoolAmount =
    rawPlatformAmount >= MIN_PLATFORM_DEPOSIT ? rawPlatformAmount : 0
  const signalAmount = depositTrust - platformPoolAmount
  const platformEntries = platformPoolAmount > 0 ? platformCount : 0
  // One signal entry per item + one pool entry per unique platform
  const depositCount = itemCount + platformEntries

  // --- Sofia fees (from SofiaFeeProxy) ---
  // Fixed fee: depositFixedFee per deposit entry
  const fixedFeePerDeposit = Number(depositFixed) / 1e18
  const sofiaFixedFee = fixedFeePerDeposit * depositCount

  // Percentage fee: depositPercentageFee / FEE_DENOMINATOR * totalDeposit
  const pctRate = Number(depositPct) / Number(feeDenom)
  const sofiaPercentFee = pctRate * depositTrust

  // Creation fixed fee: only on CREATE path (per new triple/atom)
  const creationFixedPerUnit = Number(creationFixed) / 1e18
  let creationFixedFeeTotal = 0
  if (isNewTriple) {
    // Each item = 1 triple creation + newAtomCount object atoms + newPredicateAtomCount predicate atoms
    creationFixedFeeTotal =
      creationFixedPerUnit * (itemCount + newAtomCount + newPredicateAtomCount)
  }

  // --- Creation costs (full mandatory cost from MultiVault on CREATE path) ---
  // Includes protocol fee + initial vault deposits — all leave the user's wallet
  let creationCost = 0
  if (isNewTriple) {
    creationCost += (Number(tripleCost) / 1e18) * itemCount
    creationCost += atomCostTrust * (newAtomCount + newPredicateAtomCount)
  }

  // --- TX2: Context triple costs (min deposit + creation per context triple) ---
  // If "in context of" predicate atom is missing, an extra createAtoms TX precedes
  // the context createTriples — adds atomCost + creationFixedFee (one-time for the batch).
  let contextTripleCost = 0
  if (contextTripleCount > 0) {
    const minDeposit = 0.01 // MIN_TRIPLE_DEPOSIT in TRUST
    const ctxTripleCost = Number(tripleCost) / 1e18
    // Each context triple: creation cost + min deposit + sofia fees on deposit
    const ctxSofiaFixed = fixedFeePerDeposit * contextTripleCount
    const ctxSofiaPct = pctRate * (minDeposit * contextTripleCount)
    const ctxCreationFixed = creationFixedPerUnit * contextTripleCount
    const ctxPredicateAtomCost = needsContextPredicateAtom
      ? atomCostTrust + creationFixedPerUnit
      : 0
    contextTripleCost =
      ctxTripleCost * contextTripleCount +
      minDeposit * contextTripleCount +
      ctxSofiaFixed +
      ctxSofiaPct +
      ctxCreationFixed +
      ctxPredicateAtomCost
  }

  // --- Totals ---
  // (on the CREATE path the pool entries go in a separate depositBatch after
  // creation — their fixed fees are already counted in depositCount above)
  const totalFees =
    sofiaFixedFee +
    sofiaPercentFee +
    creationFixedFeeTotal +
    creationCost +
    contextTripleCost
  const totalEstimate = depositTrust + totalFees

  return {
    depositAmount: depositTrust,
    signalAmount,
    platformPoolAmount,
    creationCost,
    sofiaFixedFee,
    sofiaPercentFee,
    creationFixedFee: creationFixedFeeTotal,
    totalFees,
    totalEstimate,
    depositCount,
    contextTripleCost
  }
}
