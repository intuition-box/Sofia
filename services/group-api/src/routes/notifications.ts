// Notification history (REST, complements the Ably realtime push) + the Ably
// token endpoint a client calls to subscribe to its own channel.
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { AppEnv } from '../auth'
import { getWallet } from '../auth'
import { prisma } from '../db'
import { createTokenRequest } from '../ably'

export const notifications = new Hono<AppEnv>()

/** The caller's recent notifications (optionally unread only). */
notifications.get('/me/notifications', async (c) => {
  const wallet = getWallet(c)
  const unreadOnly = c.req.query('unread') === 'true'
  const list = await prisma.notification.findMany({
    where: { recipientWallet: wallet, ...(unreadOnly ? { readAt: null } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  const unread = await prisma.notification.count({
    where: { recipientWallet: wallet, readAt: null },
  })
  return c.json({ notifications: list, unread })
})

/** Mark one of the caller's notifications as read. */
notifications.post('/notifications/:id/read', async (c) => {
  const wallet = getWallet(c)
  const id = c.req.param('id')
  const notif = await prisma.notification.findUnique({ where: { id } })
  if (!notif || notif.recipientWallet !== wallet) {
    throw new HTTPException(404, { message: 'Notification not found' })
  }
  const updated = await prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  })
  return c.json({ notification: updated })
})

/** Mark all of the caller's notifications as read. */
notifications.post('/me/notifications/read-all', async (c) => {
  const wallet = getWallet(c)
  await prisma.notification.updateMany({
    where: { recipientWallet: wallet, readAt: null },
    data: { readAt: new Date() },
  })
  return c.json({ ok: true })
})

/** Scoped Ably token so the client can subscribe to `notif:{wallet}` only. */
notifications.get('/ably/token', async (c) => {
  const wallet = getWallet(c)
  const tokenRequest = await createTokenRequest(wallet)
  return c.json(tokenRequest)
})
