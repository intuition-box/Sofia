/**
 * proxyApprovalService — MultiVault only lets SofiaFeeProxy deposit with a
 * wallet as receiver once that wallet approved it (`approve(proxy, DEPOSIT)`,
 * else `MultiVault_SenderNotApproved`). One tx per wallet, ever.
 */
import { MULTIVAULT_ADDRESS, SOFIA_PROXY_ADDRESS } from '@/config'
import { explicitGasLimit, MultiVaultAbi } from '@/lib/contracts'
import { intuitionChain } from '@/lib/contracts/chainConfig'
import { buildWalletClient, type WalletDescriptor } from './depositService'
import { rpcClient } from './rpcClient'

const APPROVAL_DEPOSIT = 1

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
