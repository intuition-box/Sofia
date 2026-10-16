/**
 * "Publish without popup" — on-chain side of the activation page.
 *
 * The user's EOA is upgraded (EIP-7702, by MetaMask) to the MetaMask smart
 * account, then signs ONE delegation letting the extension's session key
 * deposit through the Sofia fee proxy on the user's behalf — receiver forced
 * to the user, capped per action and per day, expiring.
 */

import {
  ExecutionMode,
  ScopeType,
  contracts,
  createDelegation,
  getSmartAccountsEnvironment,
  Implementation,
  toMetaMaskSmartAccount,
  type Delegation,
} from '@metamask/smart-accounts-kit'
import {
  createPublicClient,
  createWalletClient,
  custom,
  defineChain,
  encodeFunctionData,
  http,
  pad,
  parseEther,
  toHex,
  type Address,
  type Hex,
} from 'viem'

export const NETWORKS = {
  mainnet: {
    chain: defineChain({
      id: 1155,
      name: 'Intuition',
      nativeCurrency: { name: 'TRUST', symbol: 'TRUST', decimals: 18 },
      rpcUrls: { default: { http: ['https://rpc.intuition.systems'] } },
      blockExplorers: {
        default: {
          name: 'Intuition',
          url: 'https://explorer.intuition.systems',
        },
      },
    }),
    multiVault: '0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e' as Address,
    proxy: '0x26F81d723Ad1648194FAA4b7E235105Fd1212c6c' as Address,
    /** Existing vault used for the pre-flight check (Beta season pool) */
    probeTerm:
      '0xd1315af387fa4148375918e4917466d2ba36c49d07c547c9e04c881b76437d10' as Hex,
  },
} as const

export type NetworkName = keyof typeof NETWORKS
export type NetworkConfig = (typeof NETWORKS)[NetworkName]

export const SESSION_GAS_FUNDING = parseEther('0.05')
export const DEFAULT_DAILY_CAP = '10'
export const DEFAULT_MAX_PER_ACTION = '5'
export const DURATION_DAYS = 30

const multiVaultApproveAbi = [
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'sender', type: 'address' },
      { name: 'approvalType', type: 'uint8' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

const proxyAbi = [
  {
    type: 'function',
    name: 'deposit',
    inputs: [
      { name: 'receiver', type: 'address' },
      { name: 'termId', type: 'bytes32' },
      { name: 'curveId', type: 'uint256' },
      { name: 'minShares', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'getTotalDepositCost',
    inputs: [{ name: 'depositAmount', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

const APPROVAL_DEPOSIT = 1 // MultiVault ApprovalTypes.DEPOSIT

/** Any EIP-1193 provider (Privy's external-wallet provider included) */
export type WalletProvider = Parameters<typeof custom>[0]

export function clientsFor(
  net: NetworkConfig,
  provider: WalletProvider,
  address: Address,
) {
  const publicClient = createPublicClient({
    chain: net.chain,
    transport: http(),
  })
  const walletClient = createWalletClient({
    account: address,
    chain: net.chain,
    transport: custom(provider),
  })
  return { publicClient, walletClient }
}

export type Clients = ReturnType<typeof clientsFor>

export async function ensureChain(
  provider: WalletProvider,
  net: NetworkConfig,
) {
  const chainId = toHex(net.chain.id)
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    })
  } catch {
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId,
          chainName: net.chain.name,
          nativeCurrency: net.chain.nativeCurrency,
          rpcUrls: [...net.chain.rpcUrls.default.http],
          blockExplorerUrls: [net.chain.blockExplorers.default.url],
        },
      ],
    })
  }
}

/** Does the wallet support atomic batches (EIP-5792) — i.e. 7702 upgrade? */
export async function supportsSmartAccount(
  { walletClient }: Clients,
  net: NetworkConfig,
): Promise<boolean> {
  try {
    const caps = await walletClient.getCapabilities({ chainId: net.chain.id })
    const status = caps.atomic?.status
    return status === 'supported' || status === 'ready'
  } catch {
    return false
  }
}

export async function isUpgraded(
  { publicClient }: Clients,
  address: Address,
  chainId: number,
) {
  const code = await publicClient.getCode({ address })
  const impl =
    getSmartAccountsEnvironment(chainId).implementations
      .EIP7702StatelessDeleGatorImpl
  return code?.toLowerCase() === `0xef0100${impl.slice(2)}`.toLowerCase()
}

/**
 * ONE confirmation: approve the proxy on MultiVault + fund the session key's
 * gas, as an atomic batch — MetaMask offers the smart-account upgrade here.
 */
export async function upgradeApproveAndFund(
  { walletClient }: Clients,
  net: NetworkConfig,
  sessionKey: Address,
) {
  const { id } = await walletClient.sendCalls({
    forceAtomic: true,
    calls: [
      {
        to: net.multiVault,
        data: encodeFunctionData({
          abi: multiVaultApproveAbi,
          functionName: 'approve',
          args: [net.proxy, APPROVAL_DEPOSIT],
        }),
      },
      { to: sessionKey, value: SESSION_GAS_FUNDING },
    ],
  })
  const result = await walletClient.waitForCallsStatus({ id, timeout: 180_000 })
  if (result.status !== 'success') {
    throw new Error('The activation transaction failed in your wallet.')
  }
}

export interface DelegationLimits {
  dailyCap: bigint
  maxPerAction: bigint
}

/** Build + sign the scoped delegation (ONE signature, no gas). */
export async function signPublishingDelegation(
  clients: Clients,
  net: NetworkConfig,
  address: Address,
  sessionKey: Address,
  limits: DelegationLimits,
): Promise<{ delegation: Delegation; expiresAt: number }> {
  const environment = getSmartAccountsEnvironment(net.chain.id)
  const account = await toMetaMaskSmartAccount({
    client: clients.publicClient,
    implementation: Implementation.Stateless7702,
    address,
    signer: { walletClient: clients.walletClient },
  })

  // Chain clock, not browser clock: Intuition block timestamps can lag local
  // time by minutes, and a period starting "in the future" rejects deposits.
  const now = Number((await clients.publicClient.getBlock()).timestamp)
  const expiresAt = now + DURATION_DAYS * 86400

  const delegation = createDelegation({
    environment,
    from: address,
    to: sessionKey,
    scope: {
      type: ScopeType.FunctionCall,
      targets: [net.proxy],
      selectors: [
        'deposit(address,bytes32,uint256,uint256)',
        'depositBatch(address,bytes32[],uint256[],uint256[],uint256[])',
        'createAtoms(address,bytes[],uint256[],uint256)',
        'createTriples(address,bytes32[],bytes32[],bytes32[],uint256[],uint256)',
      ],
      valueLte: { maxValue: limits.maxPerAction },
      // receiver (1st arg, calldata offset 4) is always the user
      allowedCalldata: [{ startIndex: 4, value: pad(address, { size: 32 }) }],
    },
    caveats: [
      {
        type: 'nativeTokenPeriodTransfer',
        periodAmount: limits.dailyCap,
        periodDuration: 86400,
        startDate: now - 3600,
      },
      { type: 'timestamp', afterThreshold: 0, beforeThreshold: expiresAt },
      { type: 'redeemer', redeemers: [sessionKey] },
    ],
  })

  const signature = await account.signDelegation({ delegation })
  return { delegation: { ...delegation, signature }, expiresAt }
}

/**
 * Pre-flight: eth_call the session key redeeming a small real deposit. Proves
 * signature + caveats work before handing the delegation to the extension.
 * Skipped (returns false) when the wallet can't cover the probe deposit.
 */
export async function probeDelegation(
  { publicClient }: Clients,
  net: NetworkConfig,
  address: Address,
  sessionKey: Address,
  delegation: Delegation,
): Promise<boolean> {
  const value = await publicClient.readContract({
    address: net.proxy,
    abi: proxyAbi,
    functionName: 'getTotalDepositCost',
    args: [parseEther('0.01')],
  })
  const balance = await publicClient.getBalance({ address })
  if (balance < value) return false

  const data = contracts.DelegationManager.encode.redeemDelegations({
    delegations: [[delegation]],
    modes: [ExecutionMode.SingleDefault],
    executions: [
      [
        {
          target: net.proxy,
          value,
          callData: encodeFunctionData({
            abi: proxyAbi,
            functionName: 'deposit',
            args: [address, net.probeTerm, 1n, 0n],
          }),
        },
      ],
    ],
  })
  await publicClient.call({
    account: sessionKey,
    to: getSmartAccountsEnvironment(net.chain.id).DelegationManager,
    data,
  })
  return true
}

export async function topUpSessionGas(
  { walletClient, publicClient }: Clients,
  sessionKey: Address,
) {
  const hash = await walletClient.sendTransaction({
    to: sessionKey,
    value: SESSION_GAS_FUNDING,
  })
  await publicClient.waitForTransactionReceipt({ hash })
}

/** disableDelegation must come from the delegator = the user's account */
export async function disableDelegationOnChain(
  { walletClient, publicClient }: Clients,
  net: NetworkConfig,
  delegation: Delegation,
) {
  const hash = await walletClient.sendTransaction({
    to: getSmartAccountsEnvironment(net.chain.id).DelegationManager,
    data: contracts.DelegationManager.encode.disableDelegation({ delegation }),
  })
  await publicClient.waitForTransactionReceipt({ hash })
}
