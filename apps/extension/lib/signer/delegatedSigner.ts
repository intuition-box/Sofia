/**
 * Delegated signer: the session key redeems the user's delegation through the
 * MetaMask DelegationManager, so the delegator account executes the call and
 * no wallet popup is shown.
 * - "7702": the delegator is the user's upgraded EOA — msg.sender stays the
 *   user, TRUST comes from the user's wallet.
 * - "hybrid": the delegator is the user's own HybridDeleGator (budget holder),
 *   deployed by the session key on first use; shares still go to the wallet.
 */

import {
  createWalletClient,
  decodeFunctionData,
  encodeFunctionData,
  formatEther,
  getAddress,
  isAddressEqual,
  parseAbi,
  parseEther,
  type Abi,
  type Chain
} from "viem"
import { privateKeyToAccount } from "viem/accounts"

import { buildRpcTransport, getPublicClient } from "../clients/viemClients"
import { BLOCKCHAIN_CONFIG, SELECTED_CHAIN } from "../config/chainConfig"
import {
  DELEGATION_MANAGER_ADDRESS,
  MIN_SESSION_GAS
} from "../config/delegationConfig"
import {
  buildRedeemArgs,
  buildRedeemArgsFromContext,
  DelegationManagerAbi,
  deserializeDelegation
} from "./delegation"
import type { DelegatedSession } from "./sessionStore"
import type { TxSigner } from "./types"

/** Caveat enforcer revert reason → message the user can act on */
const ENFORCER_ERRORS: [string, string][] = [
  [
    "NativeTokenPeriodTransferEnforcer",
    "Daily publishing limit reached — try again tomorrow or raise it in Settings."
  ],
  ["ValueLteEnforcer", "Amount above your per-action publishing limit."],
  [
    "TimestampEnforcer",
    "Your publishing permission expired — re-enable it in Settings."
  ],
  [
    "CannotUseADisabledDelegation",
    "Your publishing permission was disabled — re-enable it in Settings."
  ]
]

export class DelegationError extends Error {}

// Widened to `Abi` (see DelegationManagerAbi): literal ABIs make viem's
// generics recurse past TS limits in this project.
const SimpleFactoryAbi: Abi = parseAbi([
  "function deploy(bytes _bytecode, bytes32 _salt) returns (address)"
])
const OwnableAbi: Abi = parseAbi(["function owner() view returns (address)"])

const toFriendlyError = (error: unknown): Error => {
  const message = error instanceof Error ? error.message : String(error)
  const match = ENFORCER_ERRORS.find(([needle]) => message.includes(needle))
  return match ? new DelegationError(match[1]) : (error as Error)
}

/** What a pull leaves on the session key for the next transactions' gas */
const GAS_BUFFER = parseEther("0.01")

/**
 * "7715": MetaMask's native-token periodic permission only allows plain TRUST
 * transfers. So the session key pulls exactly what a write needs (+ a small
 * gas buffer) from the user's wallet — capped per day by MetaMask — then
 * sends the write itself with receiver = wallet. The per-action limit is
 * enforced here.
 */
function createPermissionSigner(session: DelegatedSession): TxSigner {
  const wallet = getAddress(session.wallet)
  const context = session.permissionContext
  if (!context) throw new DelegationError("Publishing permission is missing.")
  const sessionAccount = privateKeyToAccount(session.sessionPrivateKey)
  const chain = SELECTED_CHAIN as Chain
  const sessionClient = createWalletClient({
    account: sessionAccount,
    chain,
    transport: buildRpcTransport()
  })
  const publicClient = getPublicClient()
  const maxPerAction = BigInt(session.maxPerAction)
  const fees = (request: {
    maxFeePerGas?: bigint
    maxPriorityFeePerGas?: bigint
  }) => {
    const maxFeePerGas: bigint =
      request.maxFeePerGas ?? BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS
    const maxPriorityFeePerGas: bigint =
      request.maxPriorityFeePerGas ?? BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS
    return { maxFeePerGas, maxPriorityFeePerGas }
  }

  /** Pull TRUST from the wallet to the session key through the permission */
  const pull = async (amount: bigint) => {
    const redeem = {
      address: DELEGATION_MANAGER_ADDRESS,
      abi: DelegationManagerAbi,
      functionName: "redeemDelegations",
      args: buildRedeemArgsFromContext(context, {
        target: sessionAccount.address,
        value: amount,
        callData: "0x"
      })
    } as const
    const estimate = await publicClient.estimateContractGas({
      ...redeem,
      account: sessionAccount.address
    })
    const hash = await sessionClient.writeContract({
      ...redeem,
      chain,
      account: sessionAccount,
      gas: (estimate * 130n) / 100n,
      ...fees({})
    })
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    if (receipt.status !== "success") {
      throw new DelegationError("Could not use your publishing permission.")
    }
  }

  return {
    kind: "delegated",
    // Simulations run as the wallet (it holds the TRUST); the proxy doesn't
    // check msg.sender — shares go to `receiver`.
    account: wallet,
    receiver: wallet,
    async writeContract(request) {
      const value = request.value ?? 0n
      if (value > maxPerAction) {
        throw new DelegationError(
          "Amount above your per-action publishing limit."
        )
      }
      const balance = await publicClient.getBalance({
        address: sessionAccount.address
      })
      if (balance < MIN_SESSION_GAS) {
        throw new DelegationError(
          `Publishing gas is low (${formatEther(balance)} TRUST) — top it up in Settings.`
        )
      }
      const missing = value + GAS_BUFFER - balance
      if (missing > 0n) {
        try {
          await pull(missing)
        } catch (error) {
          throw toFriendlyError(error)
        }
      }
      try {
        return await sessionClient.writeContract({
          address: request.address,
          abi: request.abi,
          functionName: request.functionName,
          args: request.args,
          value,
          chain,
          account: sessionAccount,
          gas: request.gas,
          ...fees(request)
        })
      } catch (error) {
        throw toFriendlyError(error)
      }
    }
  }
}

export function createDelegatedSigner(session: DelegatedSession): TxSigner {
  if (session.kind === "7715") return createPermissionSigner(session)

  const wallet = getAddress(session.wallet)
  const isHybrid = session.kind === "hybrid"
  const delegator = getAddress(session.delegator ?? session.wallet)
  const delegation = deserializeDelegation(session.delegation)
  const sessionAccount = privateKeyToAccount(session.sessionPrivateKey)
  // chainConfig re-exports are untyped; pin the viem Chain type here
  const chain = SELECTED_CHAIN as Chain
  const sessionClient = createWalletClient({
    account: sessionAccount,
    chain,
    transport: buildRpcTransport()
  })
  const publicClient = getPublicClient()
  let deployed = !isHybrid

  /** Hybrid: deploy the user's smart account on first use, check its owner */
  const ensureDeployed = async () => {
    if (deployed) return
    if (!(await publicClient.getCode({ address: delegator }))) {
      if (!session.deploy) {
        throw new DelegationError("Sofia smart account is missing its setup.")
      }
      const { args } = decodeFunctionData({
        abi: SimpleFactoryAbi,
        data: session.deploy.factoryData
      })
      const hash = await sessionClient.writeContract({
        address: session.deploy.factory,
        abi: SimpleFactoryAbi,
        functionName: "deploy",
        args,
        chain,
        account: sessionAccount
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      if (receipt.status !== "success") {
        throw new DelegationError("Could not create your Sofia smart account.")
      }
    }
    const owner = await publicClient.readContract({
      address: delegator,
      abi: OwnableAbi,
      functionName: "owner",
      // viem typing workaround used across the repo (strict: false)
      authorizationList: undefined
    })
    if (
      typeof owner !== "string" ||
      !isAddressEqual(getAddress(owner), wallet)
    ) {
      throw new DelegationError(
        "Your Sofia smart account isn't owned by this wallet — re-enable publishing."
      )
    }
    deployed = true
  }

  return {
    kind: "delegated",
    // msg.sender seen by the proxy: the wallet (7702) or its smart account
    account: delegator,
    receiver: wallet,
    async writeContract(request) {
      const gasBalance = await publicClient.getBalance({
        address: sessionAccount.address
      })
      if (gasBalance < MIN_SESSION_GAS) {
        throw new DelegationError(
          `Publishing gas is low (${formatEther(gasBalance)} TRUST) — top it up in Settings.`
        )
      }

      if (isHybrid) {
        await ensureDeployed()
        const budget = await publicClient.getBalance({ address: delegator })
        if (budget < (request.value ?? 0n)) {
          throw new DelegationError(
            `Publishing budget too low (${formatEther(budget)} TRUST) — top it up in Settings.`
          )
        }
      }

      const args = buildRedeemArgs(delegation, {
        target: request.address,
        value: request.value ?? 0n,
        callData: encodeFunctionData({
          abi: request.abi,
          functionName: request.functionName,
          args: request.args
        })
      })
      const redeem = {
        address: DELEGATION_MANAGER_ADDRESS,
        abi: DelegationManagerAbi,
        functionName: "redeemDelegations",
        args
      } as const

      try {
        const estimate = await publicClient.estimateContractGas({
          ...redeem,
          account: sessionAccount.address
        })
        const maxFeePerGas: bigint =
          request.maxFeePerGas ?? BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS
        const maxPriorityFeePerGas: bigint =
          request.maxPriorityFeePerGas ??
          BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS
        return await sessionClient.writeContract({
          ...redeem,
          chain,
          account: sessionAccount,
          gas: (estimate * 130n) / 100n,
          maxFeePerGas,
          maxPriorityFeePerGas
        })
      } catch (error) {
        throw toFriendlyError(error)
      }
    }
  }
}
