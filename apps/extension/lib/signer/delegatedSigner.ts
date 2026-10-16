/**
 * Delegated signer: the session key redeems the user's delegation through the
 * MetaMask DelegationManager, so the user's (7702-upgraded) account executes
 * the call — msg.sender stays the user, TRUST comes from the user's wallet,
 * and no wallet popup is shown.
 */

import {
  createWalletClient,
  encodeFunctionData,
  formatEther,
  getAddress,
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

const toFriendlyError = (error: unknown): Error => {
  const message = error instanceof Error ? error.message : String(error)
  const match = ENFORCER_ERRORS.find(([needle]) => message.includes(needle))
  return match ? new DelegationError(match[1]) : (error as Error)
}

export function createDelegatedSigner(session: DelegatedSession): TxSigner {
  const wallet = getAddress(session.wallet)
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

  return {
    kind: "delegated",
    account: wallet,
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
