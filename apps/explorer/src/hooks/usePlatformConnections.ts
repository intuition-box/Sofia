import { useState, useCallback, useEffect, useMemo } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import type { PlatformConnection, ConnectionStatus } from '../types/reputation'
import { PLATFORM_CATALOG } from '../config/platformCatalog'
import {
  startOAuthFlow,
  exchangeOAuthCode,
  requestChallenge,
  verifyChallenge,
  connectWithSIWE,
  getConnectionStrategy,
  linkPlatformToWallet,
} from '../services/oauthService'

const STORAGE_KEY = 'sofia_platform_connections'

/**
 * Platforms that don't need OAuth or a signed message — the Privy wallet
 * address is sufficient and the backend reads the blockchain / public APIs
 * directly. Must match WALLET_BASED_PLATFORMS on the mastra side.
 */
const WALLET_BASED_PLATFORMS = new Set<string>([
  'ens',
  'lido',
  'aave',
  'uniswap',
  'snapshot',
  'the-graph',
  'wallet-siwe',
  'lens',
  'farcaster',
  'opensea',
])

function loadFromStorage(): Map<string, PlatformConnection> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const arr: PlatformConnection[] = JSON.parse(raw)
      return new Map(arr.map((c) => [c.platformId, c]))
    }
  } catch {}
  return new Map()
}

function saveToStorage(connections: Map<string, PlatformConnection>) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([...connections.values()])
  )
}

export function usePlatformConnections() {
  const { user } = usePrivy()
  const { wallets } = useWallets()
  const [connections, setConnections] = useState<Map<string, PlatformConnection>>(loadFromStorage)

  useEffect(() => {
    saveToStorage(connections)
  }, [connections])

  const updateConnection = useCallback(
    (platformId: string, update: Partial<PlatformConnection>) => {
      setConnections((prev) => {
        const next = new Map(prev)
        const existing = next.get(platformId) || {
          platformId,
          status: 'disconnected' as ConnectionStatus,
        }
        next.set(platformId, { ...existing, ...update })
        return next
      })
    },
    [],
  )

  /**
   * Connect a platform — routes to the correct flow based on authType.
   */
  const connect = useCallback(
    async (platformId: string) => {
      const strategy = getConnectionStrategy(platformId)
      const platform = PLATFORM_CATALOG.find((p) => p.id === platformId)

      // ── Wallet-based platforms (on-chain + API-key) ──
      // These bypass OAuth and signature flows: the Privy wallet address is
      // all the backend needs. Takes precedence over the strategy-based
      // routing below (e.g. authType "siwe" or "api_key" is overridden here).
      if (WALLET_BASED_PLATFORMS.has(platformId)) {
        const walletAddress = user?.wallet?.address
        if (!walletAddress) return
        updateConnection(platformId, {
          status: 'connected',
          connectedAt: Date.now(),
          userId: walletAddress,
          username: walletAddress,
        })
        return
      }

      // ── auto (authType: none) ──
      if (strategy === 'auto') {
        updateConnection(platformId, {
          status: 'connected',
          connectedAt: Date.now(),
        })
        return
      }

      // ── Web3 public (Analyze) — auto-connect via wallet address ──
      if (strategy === 'username' && platform?.targetTopics.includes('web3-crypto')) {
        const walletAddress = user?.wallet?.address
        if (!walletAddress) return
        updateConnection(platformId, {
          status: 'connected',
          connectedAt: Date.now(),
          userId: walletAddress,
          username: walletAddress,
        })
        return
      }

      // ── username — handled by startChallenge, not here ──
      if (strategy === 'username') {
        // PlatformGrid shows username input → calls startChallenge
        return
      }

      // ── SIWE — sign message with wallet ──
      if (strategy === 'siwe') {
        const wallet = wallets[0]
        if (!wallet) return
        updateConnection(platformId, { status: 'connecting', error: undefined })

        try {
          const provider = await wallet.getEthereumProvider()
          const message = `Connect ${platform?.name ?? platformId} to Sofia\n\nWallet: ${wallet.address}\nTimestamp: ${new Date().toISOString()}`
          const signature = await provider.request({
            method: 'personal_sign',
            params: [message, wallet.address],
          })
          const result = await connectWithSIWE(platformId, wallet.address, signature as string, message)
          if (result.success) {
            updateConnection(platformId, {
              status: 'connected',
              connectedAt: Date.now(),
              userId: result.userId ?? wallet.address,
              username: result.username ?? wallet.address,
            })
          } else {
            updateConnection(platformId, { status: 'error', error: result.error || 'SIWE failed' })
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'SIWE failed'
          updateConnection(platformId, { status: msg.includes('reject') ? 'disconnected' : 'error', error: msg.includes('reject') ? undefined : msg })
        }
        return
      }

      // ── SIWF — same as SIWE for now, backend differentiates ──
      if (strategy === 'siwf') {
        const wallet = wallets[0]
        if (!wallet) return
        updateConnection(platformId, { status: 'connecting', error: undefined })

        try {
          const provider = await wallet.getEthereumProvider()
          const message = `Connect Farcaster to Sofia\n\nWallet: ${wallet.address}\nTimestamp: ${new Date().toISOString()}`
          const signature = await provider.request({
            method: 'personal_sign',
            params: [message, wallet.address],
          })
          const result = await connectWithSIWE(platformId, wallet.address, signature as string, message)
          if (result.success) {
            updateConnection(platformId, {
              status: 'connected',
              connectedAt: Date.now(),
              userId: result.userId ?? wallet.address,
              username: result.username,
            })
          } else {
            updateConnection(platformId, { status: 'error', error: result.error || 'SIWF failed' })
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'SIWF failed'
          updateConnection(platformId, { status: msg.includes('reject') ? 'disconnected' : 'error', error: msg.includes('reject') ? undefined : msg })
        }
        return
      }

      // ── OAuth popup (oauth2 + oauth1) ──
      updateConnection(platformId, {
        status: 'connecting',
        connectedAt: Date.now(),
        error: undefined,
      })

      try {
        const code = await startOAuthFlow(platformId)
        const result = await exchangeOAuthCode(platformId, code)

        if (result.success) {
          // Persist the token in mastra (encrypted storage) and create on-chain triple.
          // Without this, signalFetcherWorkflow has no token to use and scoring stays at 0.
          const walletAddress = user?.wallet?.address
          if (walletAddress && result.accessToken) {
            try {
              await linkPlatformToWallet(walletAddress, platformId, result.accessToken)
            } catch (linkErr) {
              console.error(`[usePlatformConnections] linkPlatformToWallet failed for ${platformId}`, linkErr)
              // Continue: user is still "connected" in UI, but signals won't be fetchable
            }
          }

          updateConnection(platformId, {
            status: 'connected',
            connectedAt: Date.now(),
            userId: result.userId,
            username: result.username,
          })
        } else {
          updateConnection(platformId, {
            status: 'error',
            error: result.error || 'Connection failed',
          })
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Connection failed'
        if (message === 'OAuth cancelled') {
          updateConnection(platformId, { status: 'disconnected' })
        } else {
          updateConnection(platformId, {
            status: 'error',
            error: message,
          })
        }
      }
    },
    [updateConnection, user, wallets],
  )

  /**
   * Step 1 of bio challenge: request a code for a public/api_key platform.
   * User must paste this code in their profile bio, then call verifyChallengeCode().
   */
  const startChallenge = useCallback(
    async (platformId: string, username: string) => {
      updateConnection(platformId, {
        status: 'connecting',
        username,
        error: undefined,
      })

      try {
        const result = await requestChallenge(platformId, username)
        updateConnection(platformId, {
          status: 'pending_verification',
          username,
          challengeCode: result.challengeCode,
        })
      } catch (err) {
        updateConnection(platformId, {
          status: 'error',
          error: err instanceof Error ? err.message : 'Challenge request failed',
        })
      }
    },
    [updateConnection],
  )

  /**
   * Step 2 of bio challenge: verify the code is in the user's bio.
   */
  const verifyChallengeCode = useCallback(
    async (platformId: string) => {
      const conn = connections.get(platformId)
      if (!conn?.username || !conn?.challengeCode) return

      updateConnection(platformId, {
        status: 'connecting',
        error: undefined,
      })

      try {
        const result = await verifyChallenge(
          platformId,
          conn.username,
          conn.challengeCode,
        )

        if (result.success) {
          updateConnection(platformId, {
            status: 'connected',
            connectedAt: Date.now(),
            userId: result.userId,
            challengeCode: undefined,
          })
        } else {
          updateConnection(platformId, {
            status: 'pending_verification',
            error: result.error || 'Code not found in bio',
          })
        }
      } catch (err) {
        updateConnection(platformId, {
          status: 'pending_verification',
          error: err instanceof Error ? err.message : 'Verification failed',
        })
      }
    },
    [connections, updateConnection],
  )

  const disconnect = useCallback((platformId: string) => {
    setConnections((prev) => {
      const next = new Map(prev)
      next.delete(platformId)
      return next
    })
  }, [])

  const getStatus = useCallback(
    (platformId: string): ConnectionStatus => {
      return connections.get(platformId)?.status ?? 'disconnected'
    },
    [connections]
  )

  const getConnection = useCallback(
    (platformId: string): PlatformConnection | undefined => {
      return connections.get(platformId)
    },
    [connections]
  )

  const connectedCount = useMemo(
    () => [...connections.values()].filter((c) => c.status === 'connected').length,
    [connections]
  )

  return {
    connections,
    connect,
    startChallenge,
    verifyChallengeCode,
    disconnect,
    getStatus,
    getConnection,
    connectedCount,
  }
}
