import type { PlatformMetrics, SignalFetcher } from "../types"
import { safeNumber } from "../utils"
import { asAddress, getMainnetClient } from "./utils"
import { formatEther } from "viem"

/**
 * wallet-siwe — generic wallet reputation from on-chain Ethereum mainnet.
 *
 * Reads:
 *   - ETH balance
 *   - nonce (tx count out of this wallet)
 *   - first-seen block (for ancienneté) — approx via tx count heuristics
 *
 * More detailed stats (unique protocols, NFT count, etc.) would require
 * Alchemy/Etherscan APIs — we keep this lightweight with just the RPC.
 */
export const fetchWalletSiweSignals: SignalFetcher = async (
  walletAddress,
  _userId,
  ctx
): Promise<PlatformMetrics> => {
  const safe = ctx?.safeStep ?? (async (fn, fallback) => {
    try { return await fn() } catch { return fallback }
  })

  const client = getMainnetClient()
  const addr = asAddress(walletAddress.toLowerCase())

  const [balance, nonce] = await Promise.all([
    safe(
      async () => await client.getBalance({ address: addr }),
      0n,
      "wallet_siwe_balance"
    ),
    safe(
      async () => await client.getTransactionCount({ address: addr }),
      0,
      "wallet_siwe_nonce"
    ),
  ])

  const balanceEth = safeNumber(parseFloat(formatEther(balance as bigint)))

  return {
    eth_balance: Math.round(balanceEth * 10000) / 10000,
    tx_count: safeNumber(nonce),
    is_active: (nonce as number) > 0 ? 1 : 0,
  }
}
