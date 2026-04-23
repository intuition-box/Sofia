/**
 * useRealtimeSync — wires the SubscriptionManager to the user's auth state.
 *
 * Opens/closes WebSocket subscriptions as Privy ready/wallet changes.
 * Subscribes for the union of all linked wallets. Mount exactly once per
 * app via <RealtimeSyncBoundary /> in App.tsx.
 */

import { useEffect, useRef } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useQueryClient } from '@tanstack/react-query'
import { SubscriptionManager } from '@/lib/realtime/SubscriptionManager'
import { useLinkedWallets } from '@/hooks/useLinkedWallets'

export function useRealtimeSync() {
  const { ready, authenticated } = usePrivy()
  const { addresses } = useLinkedWallets()
  const queryClient = useQueryClient()
  const managerRef = useRef<SubscriptionManager | null>(null)

  if (!managerRef.current) {
    managerRef.current = new SubscriptionManager(queryClient)
  }

  // Stable dependency: the sorted, joined address set. Reconnect only when
  // the set actually changes, not on every render.
  const addressesKey = [...addresses].sort().join(',')

  useEffect(() => {
    if (!ready || !authenticated || addresses.length === 0) {
      managerRef.current?.disconnect()
      return
    }
    managerRef.current?.connect(addresses)
    return () => {
      managerRef.current?.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authenticated, addressesKey])
}

/**
 * Invisible mount point. Render once inside App.tsx under the auth provider.
 */
export function RealtimeSyncBoundary() {
  useRealtimeSync()
  return null
}
