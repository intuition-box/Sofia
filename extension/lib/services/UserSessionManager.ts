/**
 * UserSessionManager.ts
 *
 * Manages user identity and room generation based on wallet addresses.
 * Each wallet generates a unique, deterministic UUID for user identification.
 */

import { Storage } from "@plasmohq/storage"

const storage = new Storage()

// Global server ID (shared across all users) - must match ElizaOS default
const GLOBAL_SERVER_ID = "00000000-0000-0000-0000-000000000000"

/**
 * Simple hash function for strings (deterministic)
 */
async function simpleHash(str: string): Promise<string> {
  // Use Web Crypto API (available in browser)
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

/**
 * Generates a deterministic UUID v4 from any input string
 * Same input always produces the same UUID
 */
export async function generateDeterministicUUID(input: string): Promise<string> {
  // Create SHA-256 hash from input using Web Crypto API
  const hash = await simpleHash(input)

  // Format as UUID v4: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const uuid = [
    hash.substring(0, 8),
    hash.substring(8, 12),
    "4" + hash.substring(13, 16), // Version 4
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.substring(18, 20), // Variant bits
    hash.substring(20, 32)
  ].join("-")

  return uuid
}

/**
 * Gets the connected wallet address from storage
 * @throws Error if wallet is not connected
 */
export async function getWalletAddress(): Promise<string> {
  const walletAddress = await storage.get("metamask-account")

  if (!walletAddress) {
    throw new Error("Wallet non connecté - Connexion requise pour utiliser SofIA")
  }

  return walletAddress
}

/**
 * Checks if a wallet is connected
 */
export async function isWalletConnected(): Promise<boolean> {
  try {
    const walletAddress = await storage.get("metamask-account")
    return !!walletAddress
  } catch (error) {
    return false
  }
}

/**
 * Generates a deterministic user UUID from wallet address
 * @returns User UUID (AUTHOR_ID)
 * @throws Error if wallet is not connected
 */
export async function getUserId(): Promise<string> {
  try {
    const walletAddress = await getWalletAddress()

    // Generate deterministic UUID from wallet address
    const userId = await generateDeterministicUUID(`user:${walletAddress.toLowerCase()}`)

    // Store mapping for debugging
    const mapping = await storage.get("user-wallet-mapping") || {}
    mapping[walletAddress] = userId
    await storage.set("user-wallet-mapping", mapping)

    return userId
  } catch (error) {
    console.error("❌ Error getting user ID:", error)
    throw error
  }
}


/**
 * Interface for agent IDs configuration
 */
export interface AgentIds {
  AUTHOR_ID: string    // User UUID (from wallet)
  ROOM_ID: string      // Room/Channel ID (set after REST API channel creation)
  CHANNEL_ID: string   // Same as ROOM_ID (set after REST API channel creation)
  AGENT_ID: string     // Agent UUID (from constants.ts - UNCHANGED)
  SERVER_ID: string    // Global server ID
  AGENT_NAME: string   // Agent name for logging
}

/**
 * Generates complete agent IDs configuration for a user
 * @param agentName Name of the agent (for logging only)
 * @param baseAgentId Agent ID from constants.ts (MUST NOT CHANGE)
 * @returns Complete agent IDs object
 * @throws Error if wallet is not connected
 */
export async function getUserAgentIds(
  agentName: string,
  baseAgentId: string
): Promise<AgentIds> {
  try {
    // Get user UUID from wallet
    const userId = await getUserId()

    const agentIds: AgentIds = {
      AUTHOR_ID: userId,           // User UUID (from wallet)
      ROOM_ID: "",                  // Will be set after REST API channel creation
      CHANNEL_ID: "",               // Will be set after REST API channel creation
      AGENT_ID: baseAgentId,        // Agent UUID (from constants.ts - UNCHANGED)
      SERVER_ID: GLOBAL_SERVER_ID,  // Global - must match ElizaOS default server
      AGENT_NAME: agentName         // For logging
    }

    console.log(`🔑 Generated IDs for ${agentName}:`, {
      wallet: await getWalletAddress(),
      userId: userId.substring(0, 8) + "...",
      agentId: baseAgentId.substring(0, 8) + "..."
    })

    return agentIds
  } catch (error) {
    console.error(`❌ Error generating IDs for ${agentName}:`, error)
    throw error
  }
}

/**
 * Gets the stored wallet-to-UUID mapping (for debugging)
 */
export async function getUserMapping(): Promise<Record<string, string>> {
  try {
    const mapping = await storage.get("user-wallet-mapping") || {}
    return mapping
  } catch (error) {
    console.error("❌ Error getting user mapping:", error)
    return {}
  }
}

/**
 * Resets the user session (for testing purposes)
 */
export async function resetUserSession(): Promise<void> {
  try {
    await storage.remove("user-wallet-mapping")
    console.log("✅ User session reset")
  } catch (error) {
    console.error("❌ Error resetting user session:", error)
    throw error
  }
}

/**
 * Debug function to display current user session info
 */
export async function debugUserSession(): Promise<void> {
  try {
    const isConnected = await isWalletConnected()

    if (!isConnected) {
      console.log("❌ No wallet connected")
      return
    }

    const walletAddress = await getWalletAddress()
    const userId = await getUserId()
    const mapping = await getUserMapping()

    console.log("=== User Session Debug ===")
    console.log("Wallet Address:", walletAddress)
    console.log("User UUID:", userId)
    console.log("Stored Mapping:", mapping)
    console.log("========================")
  } catch (error) {
    console.error("❌ Error in debug:", error)
  }
}
