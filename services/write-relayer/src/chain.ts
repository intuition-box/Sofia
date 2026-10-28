/**
 * On-chain side of the relayer: one treasury account sends Recommends (and
 * their tags) through SofiaFeeProxy with `receiver` = the user's wallet, so
 * every position belongs to the user. Sends are serialized (one nonce
 * stream) and chunked under the chain's ~32M gas-per-tx cap.
 */
import {
  BaseError,
  ContractFunctionRevertedError,
  createPublicClient,
  createWalletClient,
  defineChain,
  encodeFunctionData,
  http,
  type Hex,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { env } from './env'
import type { PlannedTriple } from './policy'
import { SofiaFeeProxyAbi } from './sofiaFeeProxyAbi'

const PROXY = '0x26F81d723Ad1648194FAA4b7E235105Fd1212c6c' as const
const ZERO_ID = `0x${'0'.repeat(64)}`
/** createTriples costs up to ~680k gas per triple, depositBatch ~270k */
const CREATE_TX_SIZE = 35
const DEPOSIT_TX_SIZE = 80
/** MultiVault_SenderNotApproved: the receiver never approved the proxy */
const SENDER_NOT_APPROVED = '0xd76f6ff8'
/** Approving the proxy is one ~62k-gas tx — this covers it many times over */
const GAS_DRIP_WEI = 100_000_000_000_000n // 0.0001 TRUST

const intuition = defineChain({
  id: 1155,
  name: 'Intuition',
  nativeCurrency: { name: 'TRUST', symbol: 'TRUST', decimals: 18 },
  rpcUrls: { default: { http: [env.rpcUrl] } },
  contracts: {
    multicall3: { address: '0xcA11bde05977b3631167028862bE2a173976CA11' },
  },
})

const transport = http(env.rpcUrl, {
  retryCount: 4,
  retryDelay: 1_500,
  fetchOptions: env.rpcProxyKey
    ? { headers: { 'x-rpc-proxy-key': env.rpcProxyKey } }
    : undefined,
})

export const account = privateKeyToAccount(env.relayerPrivateKey)
const publicClient = createPublicClient({ chain: intuition, transport })
const walletClient = createWalletClient({
  account,
  chain: intuition,
  transport,
})

export const treasuryBalance = () =>
  publicClient.getBalance({ address: account.address })

const isRevert = (e: unknown) => e instanceof ContractFunctionRevertedError

/** Triples among `ids` already on-chain (one multicall) */
async function existingTriples(ids: readonly Hex[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set()
  const res = await publicClient.multicall({
    contracts: ids.map((id) => ({
      address: PROXY,
      abi: SofiaFeeProxyAbi,
      functionName: 'getTriple' as const,
      args: [id],
    })),
    allowFailure: true,
    batchSize: 0,
  })
  const out = new Set<string>()
  res.forEach((r, i) => {
    // A revert means "no such triple"; anything else (a throttled RPC) must
    // not pass for it, or an existing claim gets created again
    if (r.status !== 'success') {
      if (r.error instanceof BaseError && r.error.walk(isRevert)) return
      throw r.error
    }
    const [s, , o] = r.result as readonly [string, string, string]
    if (s !== ZERO_ID && o !== ZERO_ID) out.add(ids[i].toLowerCase())
  })
  return out
}

interface Sent {
  hash: Hex
  costWei: bigint
}

/** The receiver must approve SofiaFeeProxy once (MultiVault.approve) */
class NotApprovedError extends Error {}

function revertSelector(err: unknown): string | null {
  if (!(err instanceof BaseError)) return null
  const found = err.walk(
    (e) => typeof (e as { data?: unknown }).data === 'string',
  ) as { data?: string } | null
  return found?.data?.slice(0, 10) ?? null
}

/** Simulate (throws on a revert: nothing sent), then send with an explicit
 *  gas limit — never let a node fall back to the block limit — and wait */
async function send(
  data: Hex,
  value: bigint,
  fallbackGas: bigint,
): Promise<Sent | null> {
  const tx = { account, to: PROXY, data, value } as const
  try {
    await publicClient.call(tx)
  } catch (err) {
    if (revertSelector(err) === SENDER_NOT_APPROVED)
      throw new NotApprovedError('Receiver has not approved SofiaFeeProxy')
    throw err
  }
  if (env.dryRun) return null
  let gas = fallbackGas
  try {
    gas = ((await publicClient.estimateGas(tx)) * 130n) / 100n
  } catch {
    // keep the heuristic
  }
  const hash = await walletClient.sendTransaction({
    to: PROXY,
    data,
    value,
    gas,
  })
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  if (receipt.status !== 'success')
    throw new Error(`Transaction reverted: ${hash}`)
  return {
    hash,
    costWei: value + receipt.gasUsed * receipt.effectiveGasPrice,
  }
}

async function createTriples(
  group: readonly PlannedTriple[],
  receiver: Hex,
  depositWei: bigint,
): Promise<Sent | null> {
  const count = BigInt(group.length)
  const total = depositWei * count
  const tripleCost = await publicClient.readContract({
    address: PROXY,
    abi: SofiaFeeProxyAbi,
    functionName: 'getTripleCost',
  })
  const value = await publicClient.readContract({
    address: PROXY,
    abi: SofiaFeeProxyAbi,
    functionName: 'getTotalCreationCost',
    args: [count, total, tripleCost * count + total],
  })
  const data = encodeFunctionData({
    abi: SofiaFeeProxyAbi,
    functionName: 'createTriples',
    args: [
      receiver,
      group.map((t) => t.subjectId),
      group.map((t) => t.predicateId),
      group.map((t) => t.objectId),
      group.map(() => depositWei),
      group[0].curveId,
    ],
  })
  return send(data, value, count * 1_000_000n + 1_000_000n)
}

async function depositBatch(
  group: readonly PlannedTriple[],
  receiver: Hex,
  depositWei: bigint,
): Promise<Sent | null> {
  const count = BigInt(group.length)
  const total = depositWei * count
  const fee = await publicClient.readContract({
    address: PROXY,
    abi: SofiaFeeProxyAbi,
    functionName: 'calculateDepositFee',
    args: [count, total],
  })
  const data = encodeFunctionData({
    abi: SofiaFeeProxyAbi,
    functionName: 'depositBatch',
    args: [
      receiver,
      group.map((t) => t.tripleId),
      group.map((t) => t.curveId),
      group.map(() => depositWei),
      group.map(() => 0n),
    ],
  })
  return send(data, total + fee, count * 600_000n + 1_000_000n)
}

export interface Execution {
  txHashes: Hex[]
  costWei: bigint
  /** Set when a tx failed — the hashes before it did go through */
  error?: string
  /** The receiver never approved the proxy — nothing can land on it yet */
  notApproved?: boolean
}

const chunks = <T>(items: readonly T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
    items.slice(i * size, i * size + size),
  )

let queue: Promise<unknown> = Promise.resolve()

/**
 * Creates the missing triples and deposits on the existing ones — claims
 * first (tags are nested under them), one serialized nonce stream.
 */
export function execute(
  plan: { claims: PlannedTriple[]; tags: PlannedTriple[] },
  receiver: Hex,
  depositWei: bigint,
): Promise<Execution> {
  const run = queue.then(async (): Promise<Execution> => {
    const out: Execution = { txHashes: [], costWei: 0n }
    try {
      for (const group of [plan.claims, plan.tags]) {
        if (group.length === 0) continue
        const onChain = await existingTriples(group.map((t) => t.tripleId))
        const toCreate = group.filter(
          (t) => !onChain.has(t.tripleId.toLowerCase()),
        )
        const toDeposit = group.filter((t) =>
          onChain.has(t.tripleId.toLowerCase()),
        )
        for (const part of chunks(toCreate, CREATE_TX_SIZE)) {
          const sent = await createTriples(part, receiver, depositWei)
          if (sent) {
            out.txHashes.push(sent.hash)
            out.costWei += sent.costWei
          }
        }
        for (const part of chunks(toDeposit, DEPOSIT_TX_SIZE)) {
          const sent = await depositBatch(part, receiver, depositWei)
          if (sent) {
            out.txHashes.push(sent.hash)
            out.costWei += sent.costWei
          }
        }
      }
    } catch (err) {
      out.error =
        err instanceof Error ? err.message.split('\n')[0] : String(err)
      out.notApproved = err instanceof NotApprovedError
    }
    return out
  })
  queue = run.catch(() => undefined)
  return run
}

/**
 * Gas for the user's one-time MultiVault.approve(proxy): an email / Google
 * wallet — or a brand-new crypto wallet — holds no TRUST. Only when it can't already pay; null if nothing sent.
 */
export function fundApprovalGas(wallet: Hex): Promise<Hex | null> {
  const run = queue.then(async () => {
    const balance = await publicClient.getBalance({ address: wallet })
    if (env.dryRun || balance >= GAS_DRIP_WEI / 2n) return null
    const hash = await walletClient.sendTransaction({
      to: wallet,
      value: GAS_DRIP_WEI,
    })
    await publicClient.waitForTransactionReceipt({ hash })
    return hash
  })
  queue = run.catch(() => undefined)
  return run
}
