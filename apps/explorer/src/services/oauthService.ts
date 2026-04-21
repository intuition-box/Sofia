/**
 * OAuth Service — Dashboard
 * Handles connection flows for ALL 101 platforms.
 *
 * Strategy by authType:
 *  - oauth2 (70):  Popup → sofia-mastra proxies auth URL + handles secrets
 *  - oauth1 (3):   Same popup flow, backend handles OAuth1 request token dance
 *  - api_key (5):  Backend holds the keys — user just provides username
 *  - public (19):  User provides username → backend verifies via public API
 *  - siwe (2):     Sign message with wallet (Privy)
 *  - siwf (1):     Sign-In With Farcaster
 *  - none (1):     Auto-connect (bandcamp — no auth)
 *
 * The dashboard NEVER holds client secrets or API keys — everything goes
 * through sofia-mastra backend at MASTRA_URL/oauth/*
 */

import type { AuthType } from '../types/reputation'
import { PLATFORM_CATALOG } from '../config/platformCatalog'

const MASTRA_URL =
  (import.meta.env.VITE_MASTRA_URL as string) || 'http://localhost:4111'

const OAUTH_CALLBACK_URL =
  (import.meta.env.VITE_OAUTH_CALLBACK_URL as string) ||
  `${window.location.origin}/auth/callback`

// ── Types ──

export type ConnectionStrategy =
  | 'oauth_popup'   // oauth2 + oauth1 — popup flow
  | 'username'      // public + api_key — user provides username, backend verifies
  | 'siwe'          // wallet signature
  | 'siwf'          // farcaster signature
  | 'auto'          // no auth needed

export interface ConnectResult {
  success: boolean
  platformId: string
  userId?: string
  username?: string
  accessToken?: string
  refreshToken?: string
  expiresIn?: number
  error?: string
}

export interface LinkResult {
  success: boolean
  platformId: string
  userId?: string
  username?: string
  txHash?: string
  error?: string
}

// ── Strategy Resolution ──

const AUTH_TYPE_TO_STRATEGY: Record<AuthType, ConnectionStrategy> = {
  oauth2: 'oauth_popup',
  oauth1: 'oauth_popup',
  api_key: 'username',
  public: 'username',
  siwe: 'siwe',
  siwf: 'siwf',
  none: 'auto',
}

/**
 * Get the connection strategy for a platform.
 */
export function getConnectionStrategy(platformId: string): ConnectionStrategy {
  const platform = PLATFORM_CATALOG.find((p) => p.id === platformId)
  if (!platform) return 'username'
  return AUTH_TYPE_TO_STRATEGY[platform.authType]
}

/**
 * Check if a platform requires OAuth popup flow.
 */
export function isOAuthPlatform(platformId: string): boolean {
  return getConnectionStrategy(platformId) === 'oauth_popup'
}

/**
 * Check if a platform needs a username input from the user.
 */
export function needsUsernameInput(platformId: string): boolean {
  return getConnectionStrategy(platformId) === 'username'
}

// ── OAuth Popup Flow (oauth2 + oauth1) ──

/**
 * Initiate OAuth flow via popup window.
 * The backend (sofia-mastra) handles:
 *  - Injecting client_id, client_secret
 *  - Building the correct auth URL per provider
 *  - OAuth1 request token exchange
 * The dashboard just opens the popup and waits for the callback.
 */
export function startOAuthFlow(platformId: string): Promise<string> {
  const state = `${platformId}_${Date.now()}_${Math.random().toString(36).slice(2)}`
  sessionStorage.setItem('oauth_state', state)

  const params = new URLSearchParams({
    redirect_uri: OAUTH_CALLBACK_URL,
    state,
  })

  const url = `${MASTRA_URL}/oauth/${platformId}/authorize?${params}`

  return new Promise((resolve, reject) => {
    const popup = window.open(url, 'oauth_popup', 'width=600,height=700')
    if (!popup) {
      reject(new Error('Popup blocked — please allow popups'))
      return
    }

    const interval = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(interval)
          reject(new Error('OAuth cancelled'))
        }
      } catch {
        // Cross-origin — popup still loading
      }
    }, 500)

    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type !== 'oauth_callback') return

      clearInterval(interval)
      window.removeEventListener('message', handler)
      popup.close()

      const savedState = sessionStorage.getItem('oauth_state')
      sessionStorage.removeItem('oauth_state')

      if (event.data.state !== savedState) {
        reject(new Error('OAuth state mismatch'))
        return
      }

      if (event.data.error) {
        reject(new Error(event.data.error))
        return
      }

      resolve(event.data.code)
    }

    window.addEventListener('message', handler)

    setTimeout(() => {
      clearInterval(interval)
      window.removeEventListener('message', handler)
      if (!popup.closed) popup.close()
      reject(new Error('OAuth timeout'))
    }, 5 * 60 * 1000)
  })
}

/**
 * Exchange authorization code for token via sofia-mastra backend.
 * Works for both oauth2 and oauth1 — backend handles the difference.
 */
export async function exchangeOAuthCode(
  platformId: string,
  code: string,
): Promise<ConnectResult> {
  const response = await fetch(`${MASTRA_URL}/oauth/${platformId}/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirectUri: OAUTH_CALLBACK_URL }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OAuth exchange failed: ${text}`)
  }

  return response.json()
}

// ── Bio Challenge Flow (public + api_key platforms) ──

export interface ChallengeResult {
  challengeCode: string
  platformId: string
  username: string
  instruction: string
}

/**
 * Step 1: Request a challenge code for a platform.
 * Backend generates a unique code and returns instructions for where to paste it.
 */
export async function requestChallenge(
  platformId: string,
  username: string,
): Promise<ChallengeResult> {
  const response = await fetch(`${MASTRA_URL}/api/platforms/${platformId}/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Challenge request failed: ${text}`)
  }

  return response.json()
}

/**
 * Step 2: Verify the challenge code is present in the user's bio/profile.
 * Backend checks the platform's public API (or its own API key) to confirm.
 */
export async function verifyChallenge(
  platformId: string,
  username: string,
  challengeCode: string,
): Promise<ConnectResult> {
  const response = await fetch(`${MASTRA_URL}/api/platforms/${platformId}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, challengeCode }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Challenge verification failed: ${text}`)
  }

  return response.json()
}

// ── SIWE Flow ──

/**
 * Connect via Sign-In With Ethereum.
 * The wallet signs a message, backend verifies the signature.
 */
export async function connectWithSIWE(
  platformId: string,
  walletAddress: string,
  signature: string,
  message: string,
): Promise<ConnectResult> {
  const response = await fetch(`${MASTRA_URL}/api/platforms/${platformId}/siwe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress, signature, message }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`SIWE verification failed: ${text}`)
  }

  return response.json()
}

// ── Link to Wallet (On-Chain) ──

/**
 * Link a verified platform to user's wallet via linkSocialWorkflow.
 * Creates on-chain triple: [wallet] [has verified {platform} id] [userId]
 */
export async function linkPlatformToWallet(
  walletAddress: string,
  platformId: string,
  oauthToken: string,
): Promise<LinkResult> {
  const response = await fetch(
    `${MASTRA_URL}/api/workflows/linkSocialWorkflow/start-async`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputData: {
          walletAddress,
          platform: platformId,
          oauthToken,
        },
      }),
    },
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Link workflow failed: ${text}`)
  }

  return response.json()
}
