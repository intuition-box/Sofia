import { getAddress } from "viem"

import { getClients } from "../clients/viemClients"
import { SELECTED_CHAIN } from "../config/chainConfig"
import type { TxSigner } from "./types"

/**
 * Signs through the user's injected wallet (one popup per transaction).
 * Same behaviour as calling getClients() directly.
 */
export async function createInjectedSigner(): Promise<TxSigner> {
  const { walletClient } = await getClients()
  const address = getAddress(walletClient.account.address)

  return {
    kind: "injected",
    account: address,
    receiver: address,
    writeContract: (request) =>
      walletClient.writeContract({
        ...request,
        chain: SELECTED_CHAIN,
        account: walletClient.account
      })
  }
}
