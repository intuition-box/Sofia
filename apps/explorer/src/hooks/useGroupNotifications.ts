/**
 * Notification hooks for the group-join flow.
 *
 *  - `useNotifications()`        REST history (polled) + unread count + mark
 *                               read/all. The query is React-Query-deduped, so
 *                               the nav badge and the notifications page share
 *                               one fetch.
 *  - `useNotificationsRealtime()` the Ably subscription — mount ONCE (in the
 *                               always-mounted NavSidebar). A push invalidates
 *                               the notifications / applications / membership
 *                               caches so the badge, admin panel and join gate
 *                               update live.
 */
import { useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAblyToken,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/groupJoinApi'

const KEY = ['groupNotifications']

export function useNotifications() {
  const { getAccessToken, authenticated } = usePrivy()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: KEY,
    enabled: authenticated,
    refetchInterval: 30_000,
    staleTime: 15_000,
    queryFn: async () => {
      const token = await getAccessToken()
      if (!token) throw new Error('Not authenticated')
      return listNotifications(token)
    },
  })

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const token = await getAccessToken()
      if (!token) throw new Error('Not authenticated')
      return markNotificationRead(token, id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })

  const markAll = useMutation({
    mutationFn: async () => {
      const token = await getAccessToken()
      if (!token) throw new Error('Not authenticated')
      return markAllNotificationsRead(token)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })

  return {
    notifications: query.data?.notifications ?? [],
    unread: query.data?.unread ?? 0,
    loading: query.isLoading,
    markRead: (id: string) => markRead.mutate(id),
    markAllRead: () => markAll.mutate(),
  }
}

/** Mount ONCE — opens an Ably channel for the connected wallet and refreshes
 *  the relevant caches on every realtime push. */
export function useNotificationsRealtime() {
  const { getAccessToken, authenticated, user } = usePrivy()
  const qc = useQueryClient()
  const wallet = user?.wallet?.address?.toLowerCase() ?? null

  useEffect(() => {
    if (!authenticated || !wallet) return
    let client: { close: () => void } | null = null
    let cancelled = false

    ;(async () => {
      try {
        const Ably = await import('ably')
        if (cancelled) return
        const realtime = new Ably.Realtime({
          authCallback: async (_params, cb) => {
            try {
              const token = await getAccessToken()
              if (!token) return cb('No token', null)
              const tokenRequest = await getAblyToken(token)
              cb(null, tokenRequest as never)
            } catch (err) {
              cb(err as string, null)
            }
          },
        })
        client = realtime
        realtime.channels
          .get(`notif:${wallet}`)
          .subscribe('notification', () => {
            qc.invalidateQueries({ queryKey: KEY })
            qc.invalidateQueries({ queryKey: ['groupApplications'] })
            qc.invalidateQueries({ queryKey: ['groupMembership'] })
          })
      } catch (err) {
        console.warn('[notifications] Ably unavailable', err)
      }
    })()

    return () => {
      cancelled = true
      client?.close()
    }
  }, [authenticated, wallet, getAccessToken, qc])
}
