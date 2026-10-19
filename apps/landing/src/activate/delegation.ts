/**
 * "Publish without popup" — on-chain side of the activation page.
 *
 * Two ways to get a MetaMask smart account that can delegate:
 * - "7702": the user's EOA itself is upgraded (MetaMask). msg.sender stays the
 *   user, TRUST stays in the wallet.
 * - "hybrid": wallets without 7702 (Rabby…) get a HybridDeleGator owned by the
 *   EOA, funded with a budget. Shares still go to the EOA (receiver).
 * Either way the user signs ONE delegation letting the extension's session
 * key deposit through the Sofia fee proxy — receiver forced to the user,
 * capped per action and per day, expiring.
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
  type MetaMaskSmartAccount,
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

/** Poll an on-chain condition (every 2s) until true or timeout */
async function waitOnChain(
  check: () => Promise<boolean>,
  timeoutMs: number,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await check().catch(() => false)) return true
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
  return false
}

type BatchCall = { to: Address; data?: Hex; value?: bigint }

/**
 * One wallet confirmation for several calls (EIP-5792 atomic batch).
 * MetaMask can answer wallet_sendCalls / wallet_getCallsStatus with an
 * "internal error" on Intuition even though the batch went through, so the
 * outcome is confirmed on-chain with `confirmed`.
 */
async function sendBatch(
  { walletClient }: Clients,
  calls: BatchCall[],
  confirmed: () => Promise<boolean>,
) {
  let id: string | undefined
  let sendError: unknown
  try {
    ;({ id } = await walletClient.sendCalls({ forceAtomic: true, calls }))
  } catch (error) {
    sendError = error
  }

  if (id) {
    try {
      const result = await walletClient.waitForCallsStatus({
        id,
        timeout: 180_000,
      })
      if (result.status === 'success') return
      if (result.status === 'failure') {
        throw new Error('The transaction failed in your wallet.')
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('failed in your'))
        throw error
      // Status unsupported by the wallet on this chain → check on-chain below
    }
  }

  if (await waitOnChain(confirmed, sendError ? 60_000 : 180_000)) return
  throw sendError instanceof Error
    ? sendError
    : new Error('The transaction was not confirmed.')
}

const approveCall = (net: NetworkConfig): BatchCall => ({
  to: net.multiVault,
  data: encodeFunctionData({
    abi: multiVaultApproveAbi,
    functionName: 'approve',
    args: [net.proxy, APPROVAL_DEPOSIT],
  }),
})

/**
 * ONE confirmation: approve the proxy on MultiVault + fund the session key's
 * gas, as an atomic batch — MetaMask offers the smart-account upgrade here.
 */
export async function upgradeApproveAndFund(
  clients: Clients,
  net: NetworkConfig,
  wallet: Address,
  sessionKey: Address,
) {
  await sendBatch(
    clients,
    [approveCall(net), { to: sessionKey, value: SESSION_GAS_FUNDING }],
    async () =>
      (await isUpgraded(clients, wallet, net.chain.id)) &&
      (await clients.publicClient.getBalance({ address: sessionKey })) >=
        SESSION_GAS_FUNDING,
  )
}

export interface DelegationLimits {
  dailyCap: bigint
  maxPerAction: bigint
}

export type ActivationKind = '7702' | 'hybrid'

/** The user's EOA itself, upgraded via 7702 */
export const eoaSmartAccount = (clients: Clients, address: Address) =>
  toMetaMaskSmartAccount({
    client: clients.publicClient,
    implementation: Implementation.Stateless7702,
    address,
    signer: { walletClient: clients.walletClient },
  })

/** Counterfactual HybridDeleGator owned by the EOA (same address every time) */
export async function hybridSmartAccount(clients: Clients, owner: Address) {
  const account = await toMetaMaskSmartAccount({
    client: clients.publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [owner, [], [], []],
    deploySalt: '0x',
    signer: { walletClient: clients.walletClient },
  })
  const { factory, factoryData } = await account.getFactoryArgs()
  if (!factory || !factoryData) {
    throw new Error('Could not compute the Sofia smart account.')
  }
  return { account, factory, factoryData }
}

/**
 * Hybrid setup: approve the proxy on MultiVault, fund the smart account's
 * budget, fund the session gas. One confirmation when the wallet can batch
 * (MetaMask), otherwise three plain transactions.
 */
export async function fundHybrid(
  clients: Clients,
  net: NetworkConfig,
  smartAccount: Address,
  sessionKey: Address,
  budget: bigint,
  onStep: (label: string) => void,
  batch: boolean,
) {
  const { walletClient, publicClient } = clients
  if (batch) {
    onStep('Confirm in your wallet: approval + publishing budget + gas')
    const budgetBefore = await publicClient.getBalance({
      address: smartAccount,
    })
    const gasBefore = await publicClient.getBalance({ address: sessionKey })
    await sendBatch(
      clients,
      [
        approveCall(net),
        { to: smartAccount, value: budget },
        { to: sessionKey, value: SESSION_GAS_FUNDING },
      ],
      async () =>
        (await publicClient.getBalance({ address: smartAccount })) >=
          budgetBefore + budget &&
        (await publicClient.getBalance({ address: sessionKey })) >=
          gasBefore + SESSION_GAS_FUNDING,
    )
    return
  }

  const send = async (label: string, run: () => Promise<Hex>) => {
    onStep(label)
    const hash = await run()
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    if (receipt.status !== 'success') throw new Error(`${label} failed.`)
  }
  await send('Confirm 1/3: allow the Sofia proxy to deposit for you', () =>
    walletClient.writeContract({
      address: net.multiVault,
      abi: multiVaultApproveAbi,
      functionName: 'approve',
      args: [net.proxy, APPROVAL_DEPOSIT],
    }),
  )
  await send('Confirm 2/3: send your publishing budget', () =>
    walletClient.sendTransaction({ to: smartAccount, value: budget }),
  )
  await send('Confirm 3/3: send the publishing gas', () =>
    walletClient.sendTransaction({
      to: sessionKey,
      value: SESSION_GAS_FUNDING,
    }),
  )
}

/**
 * Build + sign the scoped delegation (ONE signature, no gas). `delegator` is
 * the account that executes (EOA for 7702, smart account for hybrid);
 * `receiver` is always the user's EOA — it receives the shares.
 */
export async function signPublishingDelegation(
  clients: Clients,
  net: NetworkConfig,
  delegator: MetaMaskSmartAccount,
  receiver: Address,
  sessionKey: Address,
  limits: DelegationLimits,
): Promise<{ delegation: Delegation; expiresAt: number }> {
  const environment = getSmartAccountsEnvironment(net.chain.id)

  // Chain clock, not browser clock: Intuition block timestamps can lag local
  // time by minutes, and a period starting "in the future" rejects deposits.
  const now = Number((await clients.publicClient.getBlock()).timestamp)
  const expiresAt = now + DURATION_DAYS * 86400

  const delegation = createDelegation({
    environment,
    from: delegator.address,
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
      allowedCalldata: [{ startIndex: 4, value: pad(receiver, { size: 32 }) }],
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

  const signature = await delegator.signDelegation({ delegation })
  return { delegation: { ...delegation, signature }, expiresAt }
}

/** Calldata: the session key redeems a small real deposit for `receiver` */
async function probeRedeemData(
  { publicClient }: Clients,
  net: NetworkConfig,
  receiver: Address,
  delegation: Delegation,
) {
  const value = await publicClient.readContract({
    address: net.proxy,
    abi: proxyAbi,
    functionName: 'getTotalDepositCost',
    args: [parseEther('0.01')],
  })
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
            args: [receiver, net.probeTerm, 1n, 0n],
          }),
        },
      ],
    ],
  })
  return { value, data }
}

/**
 * Pre-flight: simulate the session key redeeming a small real deposit (and,
 * for a not-yet-deployed hybrid account, deploying it first). Proves
 * signature + caveats work before handing the delegation to the extension.
 * Skipped (returns false) when the delegator can't cover the probe deposit.
 */
export async function probeDelegation(
  clients: Clients,
  net: NetworkConfig,
  delegatorAddress: Address,
  receiver: Address,
  sessionKey: Address,
  delegation: Delegation,
  deploy?: { factory: Address; factoryData: Hex },
): Promise<boolean> {
  const { publicClient } = clients
  const { value, data } = await probeRedeemData(
    clients,
    net,
    receiver,
    delegation,
  )
  const balance = await publicClient.getBalance({ address: delegatorAddress })
  if (balance < value) return false

  const manager = getSmartAccountsEnvironment(net.chain.id).DelegationManager
  const deployed = !!(await publicClient.getCode({ address: delegatorAddress }))
  const calls = [
    ...(deploy && !deployed
      ? [{ account: sessionKey, to: deploy.factory, data: deploy.factoryData }]
      : []),
    { account: sessionKey, to: manager, data },
  ]
  const [block] = await publicClient.simulateBlocks({ blocks: [{ calls }] })
  const failed = block.calls.find((c) => c.status !== 'success')
  if (failed) {
    throw new Error(
      `The permission check failed: ${failed.error?.message ?? 'reverted'}`,
    )
  }
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

export async function fundBudget(
  { walletClient, publicClient }: Clients,
  smartAccount: Address,
  amount: bigint,
) {
  const hash = await walletClient.sendTransaction({
    to: smartAccount,
    value: amount,
  })
  await publicClient.waitForTransactionReceipt({ hash })
}

/** The kit doesn't export ScopeConfig — derive it from createDelegation */
type DelegationScope = NonNullable<
  Parameters<typeof createDelegation>[0]['scope']
>

/**
 * A HybridDeleGator only executes through the EntryPoint (no bundler here) or
 * through a delegation. So the owner signs a narrow delegation to ITSELF and
 * redeems it on the DelegationManager — one signature + one transaction.
 */
async function ownerRedeem(
  clients: Clients,
  net: NetworkConfig,
  owner: Address,
  scope: DelegationScope,
  call: { target: Address; value: bigint; callData: Hex },
) {
  const { account } = await hybridSmartAccount(clients, owner)
  const environment = getSmartAccountsEnvironment(net.chain.id)
  const delegation = createDelegation({
    environment,
    from: account.address,
    to: owner,
    scope,
    caveats: [{ type: 'redeemer', redeemers: [owner] }],
  })
  const signed = {
    ...delegation,
    signature: await account.signDelegation({ delegation }),
  }
  const hash = await clients.walletClient.sendTransaction({
    to: environment.DelegationManager,
    data: contracts.DelegationManager.encode.redeemDelegations({
      delegations: [[signed]],
      modes: [ExecutionMode.SingleDefault],
      executions: [[call]],
    }),
  })
  await clients.publicClient.waitForTransactionReceipt({ hash })
}

/** Send the whole hybrid budget back to the owner's wallet */
export async function withdrawBudget(
  clients: Clients,
  net: NetworkConfig,
  owner: Address,
  smartAccount: Address,
) {
  const balance = await clients.publicClient.getBalance({
    address: smartAccount,
  })
  if (balance === 0n) return
  await ownerRedeem(
    clients,
    net,
    owner,
    { type: ScopeType.NativeTokenTransferAmount, maxAmount: balance },
    { target: owner, value: balance, callData: '0x' },
  )
}

/**
 * disableDelegation must come from the delegator: the EOA itself (7702), or
 * the hybrid smart account through an owner delegation.
 */
export async function disableDelegationOnChain(
  clients: Clients,
  net: NetworkConfig,
  owner: Address,
  delegation: Delegation,
) {
  const manager = getSmartAccountsEnvironment(net.chain.id).DelegationManager
  const callData = contracts.DelegationManager.encode.disableDelegation({
    delegation,
  })
  if (delegation.delegator.toLowerCase() === owner.toLowerCase()) {
    const hash = await clients.walletClient.sendTransaction({
      to: manager,
      data: callData,
    })
    await clients.publicClient.waitForTransactionReceipt({ hash })
    return
  }
  await ownerRedeem(
    clients,
    net,
    owner,
    {
      type: ScopeType.FunctionCall,
      targets: [manager],
      selectors: [
        'disableDelegation((address,address,bytes32,(address,bytes,bytes)[],uint256,bytes))',
      ],
    },
    { target: manager, value: 0n, callData },
  )
}
