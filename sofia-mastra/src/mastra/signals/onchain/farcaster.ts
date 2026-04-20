import type { PlatformMetrics, SignalFetcher } from "../types"
import { safeNumber } from "../utils"

/**
 * Farcaster — lookup via Neynar's /user/bulk-by-address endpoint.
 *
 * Requires NEYNAR_API_KEY (free tier available at https://neynar.com).
 * Lookup maps a custody address OR verified address to a Farcaster FID.
 * If no account is linked to this wallet, returns zero metrics (not an error).
 */
const NEYNAR_BASE = "https://api.neynar.com/v2/farcaster"

export const fetchFarcasterSignals: SignalFetcher = async (
  walletAddress,
  _userId,
  _ctx
): Promise<PlatformMetrics> => {
  const apiKey = process.env.NEYNAR_API_KEY
  if (!apiKey) {
    throw new Error("missing_neynar_api_key")
  }

  const addr = walletAddress.toLowerCase()

  // Look up users by verified address
  const res = await fetch(
    `${NEYNAR_BASE}/user/bulk-by-address?addresses=${addr}`,
    {
      headers: {
        "x-api-key": apiKey,
        Accept: "application/json",
      },
    }
  )

  if (res.status === 404) {
    // No account linked — not an error, just empty metrics
    return {
      has_account: 0,
      fid: 0,
      followers: 0,
      following: 0,
      verified_addresses: 0,
    }
  }

  if (!res.ok) {
    throw new Error(`neynar_error:${res.status}`)
  }

  const data = await res.json()
  const users = data?.[addr] ?? data?.users ?? []

  if (!Array.isArray(users) || users.length === 0) {
    return {
      has_account: 0,
      fid: 0,
      followers: 0,
      following: 0,
      verified_addresses: 0,
    }
  }

  // Pick the user with the highest follower count if multiple
  const user = users.reduce(
    (top: any, u: any) =>
      safeNumber(u.follower_count) > safeNumber(top.follower_count) ? u : top,
    users[0]
  )

  return {
    has_account: 1,
    fid: safeNumber(user.fid),
    followers: safeNumber(user.follower_count),
    following: safeNumber(user.following_count),
    verified_addresses: safeNumber(
      user.verified_addresses?.eth_addresses?.length
    ),
    is_power_badge: user.power_badge ? 1 : 0,
  }
}
