/**
 * groupJoinApi — thin client for the `group-api` backend (gated group-join).
 *
 * Every call needs the caller's Privy access token (the backend verifies it
 * server-side and resolves the wallet). The React layer fetches the token via
 * `getAccessToken()` and passes it in, so this module stays hook-free.
 */
import { GROUP_API_URL } from '@/config'

export type MembershipRole = 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER'
export type MembershipState = 'ACTIVE' | 'BANNED'
export type ApplicationState =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'BANNED'

export interface MembershipResponse {
  membership: { role: MembershipRole; status: MembershipState } | null
  application: { status: ApplicationState } | null
}

export interface Application {
  id: string
  wallet: string
  groupTermId: string
  status: ApplicationState
  reviewerWallet: string | null
  reviewedAt: string | null
  reviewNote: string | null
  createdAt: string
}

export interface GroupMember {
  id: string
  wallet: string
  groupTermId: string
  role: MembershipRole
  status: MembershipState
  createdAt: string
}

export interface Notification {
  id: string
  recipientWallet: string
  type: string
  title: string
  message: string
  metadata: Record<string, unknown> | null
  readAt: string | null
  createdAt: string
}

async function api<T>(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${GROUP_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error || `group-api ${path}: HTTP ${res.status}`)
  }
  return (await res.json()) as T
}

// ── Membership / applications ──
export const getMembership = (token: string, groupTermId: string) =>
  api<MembershipResponse>(
    token,
    `/me/membership?groupTermId=${encodeURIComponent(groupTermId)}`,
  )

export const requestJoin = (
  token: string,
  groupTermId: string,
  answers?: unknown,
) =>
  api<{ application: Application }>(
    token,
    `/groups/${encodeURIComponent(groupTermId)}/applications`,
    { method: 'POST', body: JSON.stringify({ answers }) },
  )

export const listApplications = (
  token: string,
  groupTermId: string,
  status = 'pending',
) =>
  api<{ applications: Application[] }>(
    token,
    `/groups/${encodeURIComponent(groupTermId)}/applications?status=${status}`,
  )

export const approveApplication = (token: string, id: string) =>
  api<{ application: Application }>(token, `/applications/${id}/approve`, {
    method: 'POST',
  })

export const rejectApplication = (token: string, id: string, note?: string) =>
  api<{ application: Application }>(token, `/applications/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  })

// ── Roles / admin ──
export const getIsAdmin = (token: string, groupTermId: string) =>
  api<{ isAdmin: boolean; role: MembershipRole | null }>(
    token,
    `/groups/${encodeURIComponent(groupTermId)}/me/is-admin`,
  )

export const listMembers = (token: string, groupTermId: string) =>
  api<{ members: GroupMember[] }>(
    token,
    `/groups/${encodeURIComponent(groupTermId)}/members`,
  )

// ── Notifications ──
export const listNotifications = (token: string) =>
  api<{ notifications: Notification[]; unread: number }>(
    token,
    `/me/notifications`,
  )

export const markNotificationRead = (token: string, id: string) =>
  api<{ notification: Notification }>(token, `/notifications/${id}/read`, {
    method: 'POST',
  })

export const markAllNotificationsRead = (token: string) =>
  api<{ ok: boolean }>(token, `/me/notifications/read-all`, { method: 'POST' })

/** Ably token request (TokenRequest JSON) for subscribing to `notif:{wallet}`. */
export const getAblyToken = (token: string) =>
  api<Record<string, unknown>>(token, `/ably/token`)
