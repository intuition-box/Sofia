/**
 * atomCreationService — single source of truth for minting new atoms
 * from the explorer.
 *
 * Mirrors `tripleCreationService` but calls `SofiaFeeProxy.createAtoms`,
 * which atomically:
 *   1. mints one or more atoms from raw `bytes` payloads
 *   2. (optionally) deposits an initial stake on each new atom's positive vault
 *
 * The atom payload is typically an IPFS URI returned by the `pinThing`
 * GraphQL mutation. The deterministic atom term_id is pre-computed via
 * `calculateAtomId` so callers can route/cache before the receipt lands
 * and stay idempotent across indexer lag.
 */

import { createPublicClient, http, stringToHex } from 'viem'
import {
  INTUITION_RPC_URL,
  PROXY_ADDRESS,
  SofiaFeeProxyAbi,
} from '../lib/contracts'
import { buildWalletClient, type WalletDescriptor } from './depositService'

const CREATION_CURVE_ID = 1n

/** Atoms can be minted with zero stake — the protocol only charges the
 *  fixed creation cost (`getAtomCost()`). Triples require a non-zero
 *  signal deposit (`MIN_SIGNAL_TRUST` in tripleCreationService). */
const MIN_ATOM_DEPOSIT = 0n

const publicClient = createPublicClient({
  transport: http(INTUITION_RPC_URL),
})

/** Payload accepted by the `pinThing` GraphQL mutation. The `image` and
 *  `description` fields are optional but kept as required strings ("")
 *  to match the codegen's nullable signature without leaking undefined
 *  through the wire. */
export interface AtomIPFSPayload {
  name: string
  description: string
  image: string
  url: string
}

/** Function shape expected for the IPFS pinning side-effect. Provided by
 *  the caller (typically `usePinThingMutation()` from `@0xsofia/graphql`)
 *  so the service stays free of React-Query coupling. */
export type PinThingFn = (
  vars: AtomIPFSPayload,
) => Promise<{ pinThing?: { uri?: string | null } | null }>

export interface CreateAtomResult {
  success: boolean
  /** Deterministic term_id of the atom (newly created or pre-existing). */
  atomId?: string
  txHash?: string
  /** True when the atom was already on-chain and we skipped minting it.
   *  UI surfaces this as a no-op rather than a "you created an atom". */
  alreadyExisted?: boolean
  error?: string
}

export interface BatchCreateAtomResult {
  success: boolean
  /** One entry per input payload, in the same order. */
  results: CreateAtomResult[]
  /** Hash of the single tx that minted every NEW atom in the batch.
   *  Undefined when every payload was already on-chain. */
  txHash?: string
  error?: string
}

// ── Internal helpers ────────────────────────────────────────────────

/** Pin the payload to IPFS and return the encoded bytes the contract
 *  expects. Errors propagate so the calling tx aborts before any value
 *  leaves the wallet. */
async function pinAtomToIPFS(
  payload: AtomIPFSPayload,
  pinThing: PinThingFn,
): Promise<{ ipfsUri: string; encodedData: `0x${string}` }> {
  const result = await pinThing(payload)
  const ipfsUri = result.pinThing?.uri
  if (!ipfsUri) {
    throw new Error(`Failed to pin atom "${payload.name}" to IPFS`)
  }
  return { ipfsUri, encodedData: stringToHex(ipfsUri) }
}

/** Read-only check via `calculateAtomId` + a simulation probe. The
 *  contract has no `getAtom` selector; instead we attempt a 1-element
 *  `createAtoms` simulation and treat `MultiVault_AtomExists` as the
 *  "already on-chain" signal. */
async function atomExistsOnChain(
  encodedData: `0x${string}`,
  receiver: `0x${string}`,
  atomCost: bigint,
): Promise<boolean> {
  try {
    await publicClient.simulateContract({
      address: PROXY_ADDRESS,
      abi: SofiaFeeProxyAbi,
      functionName: 'createAtoms',
      args: [receiver, [encodedData], [MIN_ATOM_DEPOSIT], CREATION_CURVE_ID],
      value: atomCost,
      account: receiver,
    })
    return false
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return /AtomExists/.test(msg)
  }
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Pin one payload to IPFS and mint the resulting atom on-chain in a
 * single tx. Idempotent — if the atom already exists we return its
 * deterministic term_id without sending a transaction.
 */
export async function executeCreateAtom(
  wallet: WalletDescriptor,
  payload: AtomIPFSPayload,
  pinThing: PinThingFn,
): Promise<CreateAtomResult> {
  try {
    const { address, client } = await buildWalletClient(wallet)
    const { encodedData } = await pinAtomToIPFS(payload, pinThing)

    // Pre-compute the deterministic atom term_id so callers can route
    // before the receipt lands.
    const atomId = (await publicClient.readContract({
      address: PROXY_ADDRESS,
      abi: SofiaFeeProxyAbi,
      functionName: 'calculateAtomId',
      args: [encodedData],
      authorizationList: undefined,
    })) as `0x${string}`

    const atomCost = (await publicClient.readContract({
      address: PROXY_ADDRESS,
      abi: SofiaFeeProxyAbi,
      functionName: 'getAtomCost',
      authorizationList: undefined,
    })) as bigint

    // Idempotent path — atom already on-chain.
    if (await atomExistsOnChain(encodedData, address, atomCost)) {
      return { success: true, atomId, alreadyExisted: true }
    }

    // Total creation cost = MultiVault atom cost + Sofia fees. We let
    // the proxy compute the canonical total.
    const totalCost = (await publicClient.readContract({
      address: PROXY_ADDRESS,
      abi: SofiaFeeProxyAbi,
      functionName: 'getTotalCreationCost',
      args: [0n, MIN_ATOM_DEPOSIT, atomCost],
      authorizationList: undefined,
    })) as bigint

    const args = [
      address,
      [encodedData],
      [MIN_ATOM_DEPOSIT],
      CREATION_CURVE_ID,
    ] as const

    await publicClient.simulateContract({
      address: PROXY_ADDRESS,
      abi: SofiaFeeProxyAbi,
      functionName: 'createAtoms',
      args,
      value: totalCost,
      account: address,
    })

    const hash = await client.writeContract({
      address: PROXY_ADDRESS,
      abi: SofiaFeeProxyAbi,
      functionName: 'createAtoms',
      args,
      value: totalCost,
      chain: undefined,
      account: address,
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    return receipt.status === 'success'
      ? { success: true, atomId, txHash: hash }
      : { success: false, error: 'Transaction reverted', atomId }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Batch atom creation — pins every payload, partitions into "needs
 * creation" vs "already exists", mints the new ones in a single tx,
 * and returns one result per input in the original order.
 */
export async function executeCreateAtomsBatch(
  wallet: WalletDescriptor,
  payloads: AtomIPFSPayload[],
  pinThing: PinThingFn,
): Promise<BatchCreateAtomResult> {
  if (payloads.length === 0) {
    return { success: true, results: [] }
  }

  try {
    const { address, client } = await buildWalletClient(wallet)

    // Pin every payload in parallel — pinning is the slowest step, so
    // overlapping I/O matters more than for the on-chain reads below.
    const pinned = await Promise.all(
      payloads.map(async (payload) => {
        const { encodedData } = await pinAtomToIPFS(payload, pinThing)
        return { payload, encodedData }
      }),
    )

    const atomCost = (await publicClient.readContract({
      address: PROXY_ADDRESS,
      abi: SofiaFeeProxyAbi,
      functionName: 'getAtomCost',
      authorizationList: undefined,
    })) as bigint

    // Pre-compute every atomId + existence flag.
    const calculated = await Promise.all(
      pinned.map(async ({ payload, encodedData }) => {
        const atomId = (await publicClient.readContract({
          address: PROXY_ADDRESS,
          abi: SofiaFeeProxyAbi,
          functionName: 'calculateAtomId',
          args: [encodedData],
          authorizationList: undefined,
        })) as `0x${string}`
        const exists = await atomExistsOnChain(encodedData, address, atomCost)
        return { payload, encodedData, atomId, exists }
      }),
    )

    const toCreate = calculated.filter((c) => !c.exists)
    const results: CreateAtomResult[] = calculated.map((c) =>
      c.exists
        ? { success: true, atomId: c.atomId, alreadyExisted: true }
        : { success: false, atomId: c.atomId, error: 'pending' },
    )

    if (toCreate.length === 0) {
      return { success: true, results }
    }

    const dataArray = toCreate.map((c) => c.encodedData)
    const assetsArray = toCreate.map(() => MIN_ATOM_DEPOSIT)
    const totalDeposit = MIN_ATOM_DEPOSIT * BigInt(toCreate.length)
    const multiVaultCost = atomCost * BigInt(toCreate.length) + totalDeposit
    const totalCost = (await publicClient.readContract({
      address: PROXY_ADDRESS,
      abi: SofiaFeeProxyAbi,
      functionName: 'getTotalCreationCost',
      args: [0n, totalDeposit, multiVaultCost],
      authorizationList: undefined,
    })) as bigint

    const args = [address, dataArray, assetsArray, CREATION_CURVE_ID] as const

    await publicClient.simulateContract({
      address: PROXY_ADDRESS,
      abi: SofiaFeeProxyAbi,
      functionName: 'createAtoms',
      args,
      value: totalCost,
      account: address,
    })

    const hash = await client.writeContract({
      address: PROXY_ADDRESS,
      abi: SofiaFeeProxyAbi,
      functionName: 'createAtoms',
      args,
      value: totalCost,
      chain: undefined,
      account: address,
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    if (receipt.status !== 'success') {
      return {
        success: false,
        results,
        error: 'createAtoms batch reverted',
      }
    }

    // Promote every "pending" entry to success in the original order.
    for (let i = 0; i < calculated.length; i++) {
      if (!calculated[i].exists) {
        results[i] = {
          success: true,
          atomId: calculated[i].atomId,
          txHash: hash,
        }
      }
    }

    return { success: true, results, txHash: hash }
  } catch (err) {
    return {
      success: false,
      results: [],
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
