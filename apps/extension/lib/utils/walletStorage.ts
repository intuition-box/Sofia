import { getAddress } from 'viem'

/**
 * Read the connected wallet address from chrome.storage.session.
 *
 * Returns the EIP-55 checksummed address (consistent with how the
 * Intuition indexer stores account_id) or null if no wallet is connected.
 *
 * Storage shape: `{ walletAddress: string }` — written by the landing page
 * via the WALLET_CONNECTED external message handler.
 */
export async function getStoredWalletAddress(): Promise<string | null> {
  const result = await chrome.storage.session.get('walletAddress')
  if (!result.walletAddress) return null
  try {
    return getAddress(result.walletAddress)
  } catch {
    // Fallback to raw value if checksumming fails (malformed address)
    return result.walletAddress as string
  }
}
