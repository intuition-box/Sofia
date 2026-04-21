/**
 * useRealtimeSync — wires the SubscriptionManager to the user's auth state.
 *
 * Opens/closes WebSocket subscriptions as Privy ready/wallet changes.
 * Mount exactly once per app via <RealtimeSyncBoundary /> in App.tsx.
 */

import { useEffect, useRef } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useQueryClient } from '@tanstack/react-query'
import { SubscriptionManager } from '@/lib/realtime/SubscriptionManager'

export function useRealtimeSync() {
  const { ready, authenticated } = usePrivy()
  const { wallets } = useWallets()
  const wallet = wallets[0]
  const queryClient = useQueryClient()
  const managerRef = useRef<SubscriptionManager | null>(null)

  if (!managerRef.current) {
    managerRef.current = new SubscriptionManager(queryClient)
  }

  useEffect(() => {
    if (!ready || !authenticated || !wallet?.address) {
      managerRef.current?.disconnect()
      return
    }
    managerRef.current?.connect(wallet.address)
    return () => {
      managerRef.current?.disconnect()
    }
  }, [ready, authenticated, wallet?.address])
}

/**
 * Invisible mount point. Render once inside App.tsx under the auth provider.
 */
export function RealtimeSyncBoundary() {
  useRealtimeSync()
  return null
}
