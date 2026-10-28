/**
 * proxyApprovalService — MultiVault only lets SofiaFeeProxy deposit with a
 * wallet as receiver once that wallet approved it (`approve(proxy, DEPOSIT)`,
 * else `MultiVault_SenderNotApproved`). One tx per wallet, ever.
 */
import { BaseError, encodeFunctionData, type Address } from 'viem'
import { MULTIVAULT_ADDRESS, SOFIA_PROXY_ADDRESS } from '@/config'
import { SOFIA_I_ATOM_ID } from '@/config/atomIds'
import {
  explicitGasLimit,
  MultiVaultAbi,
  SofiaFeeProxyAbi,
} from '@/lib/contracts'
import { intuitionChain } from '@/lib/contracts/chainConfig'
import { buildWalletClient, type WalletDescriptor } from './depositService'
import { rpcClient } from './rpcClient'

const APPROVAL_DEPOSIT = 1
/** MultiVault_SenderNotApproved */
const SENDER_NOT_APPROVED = '0xd76f6ff8'
const PROBE_DEPOSIT = 10n ** 16n
const approvedKey = (address: string) =>
  `sofia:proxy-approved:${address.toLowerCase()}`

function revertSelector(err: unknown): string | null {
  if (!(err instanceof BaseError)) return null
  const found = err.walk(
    (e) => typeof (e as { data?: unknown }).data === 'string',
  ) as { data?: string } | null
  return found?.data?.slice(0, 10) ?? null
}

/**
 * Whether `address` approved the proxy: simulates a tiny deposit on Sofia's
 * `I` atom with the balance overridden (no funds needed). null when the RPC
 * couldn't tell.
 */
export async function isProxyApproved(
  address: Address,
): Promise<boolean | null> {
  const fee = await rpcClient.readContract({
    address: SOFIA_PROXY_ADDRESS,
    abi: SofiaFeeProxyAbi,
    functionName: 'calculateDepositFee',
    args: [1n, PROBE_DEPOSIT],
    authorizationList: undefined,
  })
  try {
    await rpcClient.call({
      account: address,
      to: SOFIA_PROXY_ADDRESS,
      data: encodeFunctionData({
        abi: SofiaFeeProxyAbi,
        functionName: 'depositBatch',
        args: [
          address,
          [SOFIA_I_ATOM_ID as `0x${string}`],
          [1n],
          [PROBE_DEPOSIT],
          [0n],
        ],
      }),
      value: PROBE_DEPOSIT + fee,
      stateOverride: [{ address, balance: 10n ** 20n }],
    })
    return true
  } catch (err) {
    return revertSelector(err) === SENDER_NOT_APPROVED ? false : null
  }
}

export async function approveSofiaProxy(
  wallet: WalletDescriptor,
): Promise<void> {
  const { address, client } = await buildWalletClient(wallet)
  const config = {
    address: MULTIVAULT_ADDRESS,
    abi: MultiVaultAbi,
    functionName: 'approve',
    args: [SOFIA_PROXY_ADDRESS, APPROVAL_DEPOSIT],
    account: address,
  } as const
  const gas = await explicitGasLimit(rpcClient, config, 100_000n)
  const hash = await client.writeContract({
    ...config,
    gas,
    chain: intuitionChain,
  })
  const receipt = await rpcClient.waitForTransactionReceipt({ hash })
  if (receipt.status !== 'success') throw new Error('Approval failed')
}

/**
 * Before a wallet's first write through the proxy: one approval tx when it
 * never approved (a wallet that only ever used the explorer). Remembered per
 * wallet; when the RPC can't tell, the write goes ahead as before.
 */
export async function ensureProxyApproved(
  wallet: WalletDescriptor,
): Promise<void> {
  const key = approvedKey(wallet.address)
  try {
    if (localStorage.getItem(key)) return
  } catch {
    // storage unavailable — check on-chain
  }
  const approved = await isProxyApproved(wallet.address as Address).catch(
    () => null,
  )
  if (approved === null) return
  if (!approved) await approveSofiaProxy(wallet)
  try {
    localStorage.setItem(key, '1')
  } catch {
    // next session checks again
  }
}
