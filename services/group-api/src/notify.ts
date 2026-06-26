// Notification helper — persists the in-app notification (REST history) and
// pushes it over Ably in one call so callers don't repeat both steps.
import type { NotificationType, Prisma } from './generated/prisma'
import { prisma } from './db'
import { publishToWallet } from './ably'

export async function notify(params: {
  recipientWallet: string
  type: NotificationType
  title: string
  message: string
  metadata?: Prisma.InputJsonValue
}): Promise<void> {
  const notification = await prisma.notification.create({
    data: {
      recipientWallet: params.recipientWallet.toLowerCase(),
      type: params.type,
      title: params.title,
      message: params.message,
      metadata: params.metadata,
    },
  })
  await publishToWallet(params.recipientWallet, 'notification', notification)
}
