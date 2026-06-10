/**
 * useGroupNotifications — notification history (REST, polled) + an Ably realtime
 * subscription that pushes new notifications instantly. On any realtime event we
 * invalidate the notification, application and membership caches so the bell,
 * the admin requests panel and the join gate all update live.
 *
 * REST polling is the baseline (works without Ably); the realtime push just
 * makes it instant.
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

export function useGroupNotifications() {
  const { getAccessToken, authenticated, user } = usePrivy()
  const qc = useQueryClient()
  const wallet = user?.wallet?.address?.toLowerCase() ?? null

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

  // ── Ably realtime ──
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
              // Ably accepts a TokenRequest object here.
              cb(null, tokenRequest as never)
            } catch (err) {
              cb(err as string, null)
            }
          },
        })
        client = realtime
        const channel = realtime.channels.get(`notif:${wallet}`)
        channel.subscribe('notification', () => {
          // A new notification → refresh the bell + anything it might affect.
          qc.invalidateQueries({ queryKey: KEY })
          qc.invalidateQueries({ queryKey: ['groupApplications'] })
          qc.invalidateQueries({ queryKey: ['groupMembership'] })
        })
      } catch (err) {
        // Realtime is optional — REST polling still delivers notifications.
        console.warn('[notifications] Ably unavailable', err)
      }
    })()

    return () => {
      cancelled = true
      client?.close()
    }
  }, [authenticated, wallet, getAccessToken, qc])

  return {
    notifications: query.data?.notifications ?? [],
    unread: query.data?.unread ?? 0,
    loading: query.isLoading,
    markRead: (id: string) => markRead.mutate(id),
    markAllRead: () => markAll.mutate(),
  }
}
