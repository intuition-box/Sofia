/**
 * RedeemService
 *
 * Exits positions on any vault (claim, counter vault, atom) across BOTH
 * bonding curves — page positions live on the progressive curve (2) since the
 * page market, older ones on the linear curve (1). Every leg with shares goes
 * into ONE transaction (`redeemBatch`, or `redeem` for a single leg).
 *
 * Redeems go straight to the MultiVault from the user's own wallet: the
 * shares belong to that wallet, so a delegated session key can't redeem them.
 */

import type { Address, Hash } from "viem"

import { MultiVaultAbi } from "../../ABI/MultiVault"
import { getClients, getPublicClient } from "../clients/viemClients"
import { SELECTED_CHAIN } from "../config/chainConfig"
import { ERROR_MESSAGES } from "../config/constants"
import { createServiceLogger } from "../utils/logger"
import { BlockchainService } from "./blockchainService"
import { txEventBus } from "./TxEventBus"

const logger = createServiceLogger("RedeemService")

/** Linear (legacy page claims, votes) and progressive (page market) */
const CURVE_IDS = [1n, 2n] as const

/** One vault × curve where the wallet holds shares */
export interface RedeemLeg {
  termId: string
  curveId: bigint
  shares: bigint
}

export interface RedeemResult {
  success: boolean
  txHash?: Hash
  error?: string
}

class RedeemServiceClass {
  /** The wallet's shares on every curve of each vault (empty legs dropped) */
  async findLegs(wallet: string, termIds: string[]): Promise<RedeemLeg[]> {
    const publicClient = getPublicClient()
    const address = BlockchainService.getMultiVaultAddress()
    const pairs = [...new Set(termIds)].flatMap((termId) =>
      CURVE_IDS.map((curveId) => ({ termId, curveId }))
    )
    const shares = await Promise.all(
      pairs.map(
        ({ termId, curveId }) =>
          publicClient.readContract({
            address,
            abi: MultiVaultAbi,
            functionName: "getShares",
            args: [wallet as Address, termId as Address, curveId],
            authorizationList: undefined
          }) as Promise<bigint>
      )
    )
    return pairs
      .map((p, i) => ({ ...p, shares: shares[i] }))
      .filter((leg) => leg.shares > 0n)
  }

  /**
   * Exit positions in one transaction. `fraction` (0–1] scales every leg —
   * 1 exits everything.
   */
  async redeem(
    wallet: string,
    termIds: string[],
    fraction = 1
  ): Promise<RedeemResult> {
    try {
      if (!wallet) throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED)
      const legs = (await this.findLegs(wallet, termIds))
        .map((leg) => ({
          ...leg,
          shares:
            fraction >= 1
              ? leg.shares
              : (leg.shares * BigInt(Math.round(fraction * 10_000))) / 10_000n
        }))
        .filter((leg) => leg.shares > 0n)
      if (legs.length === 0) {
        logger.debug("Nothing to redeem", { termIds })
        return { success: true }
      }
      return await this.redeemLegs(wallet, legs)
    } catch (error) {
      logger.error("Redeem failed", error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
      }
    }
  }

  /** Send the legs as one `redeem` / `redeemBatch` from the user's wallet */
  async redeemLegs(wallet: string, legs: RedeemLeg[]): Promise<RedeemResult> {
    const account = wallet as Address
    const contractAddress = BlockchainService.getMultiVaultAddress()
    const { walletClient, publicClient } = await getClients()

    let hash: Hash
    if (legs.length === 1) {
      const [leg] = legs
      const minAssets = await BlockchainService.previewRedeemMinAssets(
        leg.termId,
        leg.curveId,
        leg.shares
      )
      const args = [
        account,
        leg.termId as Address,
        leg.curveId,
        leg.shares,
        minAssets
      ] as const
      await publicClient.simulateContract({
        address: contractAddress,
        abi: MultiVaultAbi,
        functionName: "redeem",
        args,
        account
      })
      hash = await walletClient.writeContract({
        address: contractAddress,
        abi: MultiVaultAbi,
        functionName: "redeem",
        args,
        chain: SELECTED_CHAIN,
        account
      })
    } else {
      const termIds = legs.map((l) => l.termId as Address)
      const curveIds = legs.map((l) => l.curveId)
      const shares = legs.map((l) => l.shares)
      const minAssets = await BlockchainService.previewRedeemMinAssetsBatch(
        termIds,
        curveIds,
        shares
      )
      const args = [account, termIds, curveIds, shares, minAssets] as const
      await publicClient.simulateContract({
        address: contractAddress,
        abi: MultiVaultAbi,
        functionName: "redeemBatch",
        args,
        account
      })
      hash = await walletClient.writeContract({
        address: contractAddress,
        abi: MultiVaultAbi,
        functionName: "redeemBatch",
        args,
        chain: SELECTED_CHAIN,
        account
      })
    }

    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    if (receipt.status !== "success") {
      throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
    }
    logger.info("Redeemed", { hash, legs: legs.length })
    txEventBus.emit("redeem_triple", hash)
    return { success: true, txHash: hash }
  }
}

export const redeemService = new RedeemServiceClass()
