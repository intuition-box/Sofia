import type { PlatformMetrics, SignalFetcher } from "../types"
import { safeNumber } from "../utils"
import { asAddress, getMainnetClient } from "./utils"
import { parseAbi, formatEther } from "viem"

const STETH_ADDRESS = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84" // stETH
const WSTETH_ADDRESS = "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0" // wstETH

const ERC20_ABI = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
])

export const fetchLidoSignals: SignalFetcher = async (
  walletAddress,
  _userId,
  ctx
): Promise<PlatformMetrics> => {
  const safe = ctx?.safeStep ?? (async (fn, fallback) => {
    try { return await fn() } catch { return fallback }
  })

  const client = getMainnetClient()
  const addr = asAddress(walletAddress.toLowerCase())

  const [stethBalance, wstethBalance] = await Promise.all([
    safe(
      async () =>
        await client.readContract({
          address: STETH_ADDRESS,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [addr],
        }),
      0n,
      "lido_steth_balance"
    ),
    safe(
      async () =>
        await client.readContract({
          address: WSTETH_ADDRESS,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [addr],
        }),
      0n,
      "lido_wsteth_balance"
    ),
  ])

  const stethEth = safeNumber(parseFloat(formatEther(stethBalance as bigint)))
  const wstethEth = safeNumber(parseFloat(formatEther(wstethBalance as bigint)))

  return {
    steth_balance_eth: Math.round(stethEth * 1000) / 1000,
    wsteth_balance_eth: Math.round(wstethEth * 1000) / 1000,
    total_staked_eth: Math.round((stethEth + wstethEth) * 1000) / 1000,
    is_staker: stethEth + wstethEth > 0 ? 1 : 0,
  }
}
