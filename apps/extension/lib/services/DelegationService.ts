/**
 * DelegationService
 *
 * Lifecycle of "publish without popup": activation (session key + one-time
 * delegation signed on the Sofia web app), status, gas top-up, deactivation.
 * Signing itself lives in lib/signer (delegatedSigner picks the session up).
 */

import {
  formatEther,
  getAddress,
  isAddressEqual,
  type Address,
  type Hex
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"

import { getPublicClient } from "../clients/viemClients"
import { BLOCKCHAIN_CONFIG } from "../config/chainConfig"
import {
  ACTIVATE_PAGE_URL,
  DELEGATION_MANAGER_ADDRESS,
  MIN_SESSION_GAS,
  ROOT_AUTHORITY,
  SIMPLE_FACTORY_ADDRESS
} from "../config/delegationConfig"
import {
  decodePermissionContext,
  serializeDelegation,
  sessionStore,
  type DelegatedSession,
  type DelegationKind,
  type SerializedDelegation
} from "../signer"
import { createServiceLogger } from "../utils/logger"

const logger = createServiceLogger("DelegationService")

const REVOKING_PREFIX = "delegated_session_revoking_"
/** Hybrid smart account of a wallet — kept after disabling, for withdrawals */
const ACCOUNT_PREFIX = "delegated_session_account_"

export type DelegationState = "inactive" | "active" | "expired"

export interface DelegationStatus {
  state: DelegationState
  expiresAt: number | null
  dailyCap: bigint | null
  maxPerAction: bigint | null
  sessionAddress: Address | null
  gasBalance: bigint | null
  gasLow: boolean
  kind: DelegationKind | null
  /** Hybrid only: the smart account holding the budget (even once disabled) */
  smartAccount: Address | null
  budget: bigint | null
}

/** Payload posted by the activation page (DELEGATION_GRANTED) */
export interface DelegationGrant {
  wallet: string
  /** 7702 / hybrid: the delegation the user signed */
  delegation?: SerializedDelegation
  /** 7715: permission context granted by MetaMask (Delegation[], leaf first) */
  permissionContext?: string
  expiresAt: number
  dailyCap: string
  maxPerAction: string
  delegationManager: string
  chainId: number
  /** Absent from older activation pages → "7702" */
  kind?: DelegationKind
  delegator?: string
  deploy?: { factory: string; factoryData: string }
}

type PageAction =
  | "activate"
  | "update"
  | "topup"
  | "fund"
  | "withdraw"
  | "revoke"

class DelegationServiceClass {
  private async getSmartAccount(wallet: string): Promise<Address | null> {
    const key = `${ACCOUNT_PREFIX}${wallet.toLowerCase()}`
    const result = await chrome.storage.local.get(key)
    return (result[key] as Address | undefined) ?? null
  }

  private async balanceOf(address: Address): Promise<bigint | null> {
    try {
      return await getPublicClient().getBalance({ address })
    } catch (error) {
      logger.warn("Failed to read balance", { address, error })
      return null
    }
  }

  async getStatus(wallet: string): Promise<DelegationStatus> {
    const session = await sessionStore.get(wallet)
    const smartAccount = await this.getSmartAccount(wallet)
    const budget = smartAccount ? await this.balanceOf(smartAccount) : null

    if (!session) {
      return {
        state: "inactive",
        expiresAt: null,
        dailyCap: null,
        maxPerAction: null,
        sessionAddress: null,
        gasBalance: null,
        gasLow: false,
        kind: null,
        smartAccount,
        budget
      }
    }

    const gasBalance = await this.balanceOf(session.sessionAddress)
    const expired = session.expiresAt <= Math.floor(Date.now() / 1000)
    return {
      state: expired ? "expired" : "active",
      expiresAt: session.expiresAt,
      dailyCap: BigInt(session.dailyCap),
      maxPerAction: BigInt(session.maxPerAction),
      sessionAddress: session.sessionAddress,
      gasBalance,
      gasLow: gasBalance !== null && gasBalance < MIN_SESSION_GAS,
      kind: session.kind ?? "7702",
      smartAccount,
      budget
    }
  }

  private openPage(action: PageAction, params: Record<string, string>) {
    const url = new URL(ACTIVATE_PAGE_URL)
    url.searchParams.set("action", action)
    url.searchParams.set("extensionId", chrome.runtime.id)
    url.searchParams.set(
      "network",
      process.env.PLASMO_PUBLIC_NETWORK || "testnet"
    )
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
    chrome.tabs.create({ url: url.toString() })
  }

  /** New session key, kept pending until the page sends the delegation back */
  private async newPendingSession(wallet: string): Promise<Address> {
    const sessionPrivateKey = generatePrivateKey()
    const sessionAddress = privateKeyToAccount(sessionPrivateKey).address
    await sessionStore.savePending({
      wallet: getAddress(wallet),
      sessionPrivateKey,
      sessionAddress,
      createdAt: Date.now()
    })
    return sessionAddress
  }

  async startActivation(wallet: string): Promise<void> {
    const sessionAddress = await this.newPendingSession(wallet)
    logger.info("Activation started", { sessionAddress })
    this.openPage("activate", { wallet, sessionKey: sessionAddress })
  }

  /**
   * Change the limits of an active permission. Caveats are signed, so this is
   * a NEW delegation (one signature) to a NEW session key; on grant the old
   * key's gas moves to the new one and the old key is dropped — the previous
   * delegation becomes unusable since nobody holds its redeemer key anymore.
   */
  async startUpdate(wallet: string): Promise<void> {
    const session = await sessionStore.get(wallet)
    if (!session) throw new Error("No publishing permission to edit")
    const sessionAddress = await this.newPendingSession(wallet)
    const kind = session.kind ?? "7702"
    logger.info("Limits update started", { sessionAddress })
    this.openPage("update", {
      wallet,
      sessionKey: sessionAddress,
      kind,
      ...(kind === "hybrid" && session.delegator
        ? { account: session.delegator }
        : {}),
      daily: formatEther(BigInt(session.dailyCap)),
      perAction: formatEther(BigInt(session.maxPerAction))
    })
  }

  /** Move what's left on a retired session key to the new one (best effort) */
  private async sweepGas(from: DelegatedSession, to: Address): Promise<void> {
    try {
      const publicClient = getPublicClient()
      const account = privateKeyToAccount(from.sessionPrivateKey)
      const balance = await publicClient.getBalance({
        address: account.address
      })
      const gas = 21_000n
      const maxFeePerGas: bigint = BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS
      const value = balance - gas * maxFeePerGas
      if (value <= 0n) return
      const serializedTransaction = await account.signTransaction({
        chainId: publicClient.chain.id,
        type: "eip1559",
        to,
        value,
        gas,
        maxFeePerGas,
        maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
        nonce: await publicClient.getTransactionCount({
          address: account.address
        })
      })
      await publicClient.sendRawTransaction({ serializedTransaction })
      logger.info("Moved gas to the new session key", {
        value: formatEther(value)
      })
    } catch (error) {
      logger.warn("Could not move gas from the previous session key", error)
    }
  }

  async openTopUp(wallet: string): Promise<void> {
    const session = await sessionStore.get(wallet)
    if (!session) throw new Error("No active publishing permission")
    this.openPage("topup", { wallet, sessionKey: session.sessionAddress })
  }

  async openFund(wallet: string): Promise<void> {
    const account = await this.getSmartAccount(wallet)
    if (!account) throw new Error("No Sofia smart account for this wallet")
    this.openPage("fund", { wallet, account })
  }

  async openWithdraw(wallet: string): Promise<void> {
    const account = await this.getSmartAccount(wallet)
    if (!account) throw new Error("No Sofia smart account for this wallet")
    this.openPage("withdraw", { wallet, account })
  }

  /**
   * Stop using the session immediately (local), then let the user disable the
   * delegation on-chain from the page (the page fetches it via GET_DELEGATION).
   */
  async deactivate(wallet: string): Promise<void> {
    const session = await sessionStore.get(wallet)
    await sessionStore.remove(wallet)
    if (!session) return
    await chrome.storage.local.set({
      [`${REVOKING_PREFIX}${wallet.toLowerCase()}`]: session.delegation
    })
    logger.info("Delegated session removed locally", { wallet })
    this.openPage("revoke", { wallet })
  }

  /** Delegation the page needs to call disableDelegation on-chain */
  async getDelegationForRevoke(
    wallet: string
  ): Promise<SerializedDelegation | null> {
    const key = `${REVOKING_PREFIX}${wallet.toLowerCase()}`
    const result = await chrome.storage.local.get(key)
    return (result[key] as SerializedDelegation | undefined) ?? null
  }

  async confirmRevoked(wallet: string): Promise<void> {
    await chrome.storage.local.remove(
      `${REVOKING_PREFIX}${wallet.toLowerCase()}`
    )
  }

  /** Validate the page's delegation against our pending session key, store it */
  async handleGranted(grant: DelegationGrant): Promise<void> {
    const pending = await sessionStore.getPending()
    if (!pending) throw new Error("No pending activation")

    const kind: DelegationKind = grant.kind ?? "7702"
    const isHybrid = kind === "hybrid"
    const isPermission = kind === "7715"
    const delegator = (grant.delegator ?? pending.wallet) as Address

    // 7715: MetaMask's context may hold a chain (leaf first, root last) —
    // the leaf must target our session key, the root must be the wallet.
    let delegation: SerializedDelegation
    let rootDelegator: Address
    if (isPermission) {
      if (!grant.permissionContext) throw new Error("Missing permission")
      const chain = decodePermissionContext(grant.permissionContext as Hex)
      if (!chain.length) throw new Error("Empty permission")
      delegation = serializeDelegation(chain[0])
      rootDelegator = chain[chain.length - 1].delegator
    } else {
      if (!grant.delegation) throw new Error("Missing delegation")
      delegation = grant.delegation
      rootDelegator = delegation.delegator
    }

    const checks: [boolean, string][] = [
      [isAddressEqual(grant.wallet as Address, pending.wallet), "wallet"],
      [isAddressEqual(delegation.delegate, pending.sessionAddress), "delegate"],
      [isAddressEqual(rootDelegator, delegator), "delegator"],
      // 7702: the wallet itself delegates. Hybrid: its own smart account,
      // deployed by the known MetaMask factory (owner checked on deploy).
      [
        isHybrid
          ? !isAddressEqual(delegator, pending.wallet)
          : isAddressEqual(delegator, pending.wallet),
        "kind"
      ],
      [
        !isHybrid ||
          (!!grant.deploy &&
            isAddressEqual(
              grant.deploy.factory as Address,
              SIMPLE_FACTORY_ADDRESS
            ) &&
            grant.deploy.factoryData.length > 2),
        "deploy"
      ],
      [
        isPermission || delegation.authority.toLowerCase() === ROOT_AUTHORITY,
        "authority"
      ],
      [delegation.caveats.length > 0, "caveats"],
      [delegation.signature.length > 2, "signature"],
      [
        isAddressEqual(
          grant.delegationManager as Address,
          DELEGATION_MANAGER_ADDRESS
        ),
        "delegationManager"
      ],
      [grant.chainId === getPublicClient().chain.id, "chainId"],
      [grant.expiresAt > Math.floor(Date.now() / 1000), "expiresAt"]
    ]
    const failed = checks.filter(([ok]) => !ok).map(([, name]) => name)
    if (failed.length) {
      throw new Error(`Invalid delegation: ${failed.join(", ")}`)
    }

    const session: DelegatedSession = {
      wallet: pending.wallet,
      sessionPrivateKey: pending.sessionPrivateKey,
      sessionAddress: pending.sessionAddress,
      delegation,
      expiresAt: grant.expiresAt,
      dailyCap: grant.dailyCap,
      maxPerAction: grant.maxPerAction,
      kind,
      delegator,
      deploy: isHybrid
        ? {
            factory: grant.deploy!.factory as Address,
            factoryData: grant.deploy!.factoryData as Hex
          }
        : undefined,
      permissionContext: isPermission
        ? (grant.permissionContext as Hex)
        : undefined
    }
    const previous = await sessionStore.get(pending.wallet)
    await sessionStore.save(session)
    if (
      previous &&
      !isAddressEqual(previous.sessionAddress, pending.sessionAddress)
    ) {
      await this.sweepGas(previous, pending.sessionAddress)
    }
    if (isHybrid) {
      await chrome.storage.local.set({
        [`${ACCOUNT_PREFIX}${pending.wallet.toLowerCase()}`]: delegator
      })
    }
    await sessionStore.clearPending()
    // The activation batch included MultiVault.approve(proxy) — skip the
    // one-time approval prompt in AtomService.ensureProxyApproval.
    await chrome.storage.local.set({
      [`proxy_approved_${pending.wallet.toLowerCase()}`]: true
    })
    logger.info("Delegated publishing activated", {
      wallet: pending.wallet,
      expiresAt: grant.expiresAt
    })
  }
}

export const delegationService = new DelegationServiceClass()
export { DelegationServiceClass }
