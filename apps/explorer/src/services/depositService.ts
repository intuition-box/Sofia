import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  formatUnits,
} from 'viem'
import {
  intuitionChain,
  INTUITION_RPC_URL,
  PROXY_ADDRESS,
  SofiaFeeProxyAbi,
} from '../lib/contracts'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DepositResult {
  success: boolean
  txHash?: string
  error?: string
}

export interface BatchDepositItem {
  termId: string
  amountTrust: number
}

/** Minimal wallet descriptor accepted by service functions. */
export interface WalletDescriptor {
  address: string
  getEthereumProvider: () => Promise<any>
  switchChain: (chainId: number) => Promise<void>
}

// ---------------------------------------------------------------------------
// Shared public client (read-only, no wallet needed)
// ---------------------------------------------------------------------------

const publicClient = createPublicClient({
  transport: http(INTUITION_RPC_URL),
})

// ---------------------------------------------------------------------------
// Wallet client initialisation
// ---------------------------------------------------------------------------

export async function buildWalletClient(wallet: WalletDescriptor) {
  await wallet.switchChain(intuitionChain.id)
  const provider = await wallet.getEthereumProvider()
  const address = wallet.address as `0x${string}`
  return {
    address,
    client: createWalletClient({
      account: address,
      chain: intuitionChain,
      transport: custom(provider),
    }),
  }
}

// ---------------------------------------------------------------------------
// Fee types
// ---------------------------------------------------------------------------

export interface FeeParams {
  depositFixed: bigint
  depositPct: bigint
  creationFixed: bigint
  /** Full creation cost per triple (MultiVault portion ~0.1 TRUST). */
  tripleCost: bigint
  feeDenom: bigint
}

export interface CostEstimate {
  depositAmount: number
  sofiaFixedFee: number
  sofiaPercentFee: number
  /** Sum of `tripleCost × tripleCreateCount` — the protocol's per-triple
   *  creation cost when the cart will mint new triples. 0 for pure
   *  deposit-on-existing-triple flows. */
  tripleCreationCost: number
  totalFees: number
  totalEstimate: number
  depositCount: number
  tripleCreateCount: number
}

/** Optional knobs for cost estimation. Defaults model a single
 *  deposit-on-existing-triple — anything that mints new triples or
 *  fans out into multiple deposits must override these. */
export interface CostEstimateOptions {
  /** Number of deposits the transaction will perform. Drives the
   *  Sofia fixed-fee multiplier. Defaults to 1. */
  depositCount?: number
  /** Number of NEW triples the transaction will mint. Each one costs
   *  `tripleCost` (~0.1 TRUST) on top of any signal deposit. Defaults
   *  to 0 (pure deposit). */
  tripleCreateCount?: number
}

// ---------------------------------------------------------------------------
// Fee calculation
// ---------------------------------------------------------------------------

export async function calculateFee(
  depositCount: number,
  totalDeposit: bigint,
): Promise<bigint> {
  return await publicClient.readContract({
    address: PROXY_ADDRESS,
    abi: SofiaFeeProxyAbi,
    functionName: 'calculateDepositFee',
    args: [BigInt(depositCount), totalDeposit],
    authorizationList: undefined,
  })
}

// ---------------------------------------------------------------------------
// Fee params reading (from SofiaFeeProxy contract)
// ---------------------------------------------------------------------------

let feeParamsCache: FeeParams | null = null

export async function getFeeParams(): Promise<FeeParams> {
  if (feeParamsCache) return feeParamsCache

  const [depositFixed, depositPct, feeDenom, tripleCost] = await Promise.all([
    publicClient.readContract({
      address: PROXY_ADDRESS,
      abi: SofiaFeeProxyAbi,
      functionName: 'depositFixedFee',
      authorizationList: undefined,
    }) as Promise<bigint>,
    publicClient.readContract({
      address: PROXY_ADDRESS,
      abi: SofiaFeeProxyAbi,
      functionName: 'depositPercentageFee',
      authorizationList: undefined,
    }) as Promise<bigint>,
    publicClient.readContract({
      address: PROXY_ADDRESS,
      abi: SofiaFeeProxyAbi,
      functionName: 'FEE_DENOMINATOR',
      authorizationList: undefined,
    }) as Promise<bigint>,
    publicClient.readContract({
      address: PROXY_ADDRESS,
      abi: SofiaFeeProxyAbi,
      functionName: 'getTripleCost',
      authorizationList: undefined,
    }) as Promise<bigint>,
  ])

  let creationFixed = 0n
  try {
    creationFixed = (await publicClient.readContract({
      address: PROXY_ADDRESS,
      abi: SofiaFeeProxyAbi,
      functionName: 'creationFixedFee',
      authorizationList: undefined,
    })) as bigint
  } catch {
    // creationFixedFee not available on older contract deployments
  }

  feeParamsCache = {
    depositFixed,
    depositPct,
    creationFixed,
    tripleCost,
    feeDenom,
  }
  return feeParamsCache
}

// ---------------------------------------------------------------------------
// Pure cost estimation (same logic as extension)
// ---------------------------------------------------------------------------

export function estimateDepositCost(
  depositTrust: number,
  feeParams: FeeParams,
  options: CostEstimateOptions = {},
): CostEstimate {
  const { depositFixed, depositPct, creationFixed, tripleCost, feeDenom } =
    feeParams
  const depositCount = options.depositCount ?? 1
  const tripleCreateCount = options.tripleCreateCount ?? 0

  // Sofia fixed fee per deposit
  const fixedFeePerDeposit = Number(depositFixed) / 1e18
  const sofiaFixedFee = fixedFeePerDeposit * depositCount

  // Sofia percentage fee on the deposit amount
  const pctRate = Number(depositPct) / Number(feeDenom)
  const sofiaPercentFee = pctRate * depositTrust

  // Protocol creation cost — what MultiVault charges to mint each new
  // triple, plus the Sofia per-creation fixed fee if configured.
  const perTripleCreation = Number(tripleCost) / 1e18
  const perTripleSofiaCreationFee = Number(creationFixed) / 1e18
  const tripleCreationCost =
    (perTripleCreation + perTripleSofiaCreationFee) * tripleCreateCount

  const totalFees = sofiaFixedFee + sofiaPercentFee + tripleCreationCost
  const totalEstimate = depositTrust + totalFees

  return {
    depositAmount: depositTrust,
    sofiaFixedFee,
    sofiaPercentFee,
    tripleCreationCost,
    totalFees,
    totalEstimate,
    depositCount,
    tripleCreateCount,
  }
}

// ---------------------------------------------------------------------------
// Single deposit (simulate → write → wait)
// ---------------------------------------------------------------------------

export async function executeSingleDeposit(
  wallet: WalletDescriptor,
  termId: string,
  amountTrust: number,
): Promise<DepositResult> {
  const { address, client } = await buildWalletClient(wallet)
  const depositWei = BigInt(Math.floor(amountTrust * 1e18))

  const totalCost = await publicClient.readContract({
    address: PROXY_ADDRESS,
    abi: SofiaFeeProxyAbi,
    functionName: 'getTotalDepositCost',
    args: [depositWei],
    authorizationList: undefined,
  })

  await publicClient.simulateContract({
    address: PROXY_ADDRESS,
    abi: SofiaFeeProxyAbi,
    functionName: 'deposit',
    args: [address, termId as `0x${string}`, 1n, 0n],
    value: totalCost,
    account: address,
  })

  const hash = await client.writeContract({
    address: PROXY_ADDRESS,
    abi: SofiaFeeProxyAbi,
    functionName: 'deposit',
    args: [address, termId as `0x${string}`, 1n, 0n],
    value: totalCost,
    chain: intuitionChain,
    account: address,
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  return receipt.status === 'success'
    ? { success: true, txHash: hash }
    : { success: false, error: 'Transaction reverted' }
}

// ---------------------------------------------------------------------------
// Batch deposit (simulate → write → wait)
// ---------------------------------------------------------------------------

export async function executeBatchDeposit(
  wallet: WalletDescriptor,
  items: BatchDepositItem[],
): Promise<DepositResult> {
  const { address, client } = await buildWalletClient(wallet)

  const termIds = items.map((i) => i.termId as `0x${string}`)
  const curveIds = items.map(() => 1n)
  const assets = items.map((i) => BigInt(Math.floor(i.amountTrust * 1e18)))
  const minShares = items.map(() => 0n)

  const totalDeposit = assets.reduce((a, b) => a + b, 0n)
  const fee = await calculateFee(items.length, totalDeposit)
  const totalValue = totalDeposit + fee

  await publicClient.simulateContract({
    address: PROXY_ADDRESS,
    abi: SofiaFeeProxyAbi,
    functionName: 'depositBatch',
    args: [address, termIds, curveIds, assets, minShares],
    value: totalValue,
    account: address,
  })

  const hash = await client.writeContract({
    address: PROXY_ADDRESS,
    abi: SofiaFeeProxyAbi,
    functionName: 'depositBatch',
    args: [address, termIds, curveIds, assets, minShares],
    value: totalValue,
    chain: intuitionChain,
    account: address,
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  return receipt.status === 'success'
    ? { success: true, txHash: hash }
    : { success: false, error: 'Transaction reverted' }
}

// ---------------------------------------------------------------------------
// Balance fetching
// ---------------------------------------------------------------------------

export async function fetchBalance(address: string): Promise<string> {
  const bal = await publicClient.getBalance({
    address: address as `0x${string}`,
  })
  return formatUnits(bal, 18)
}
