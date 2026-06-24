/**
 * circleProApi — thin client for the `circle-pro-api` backend (identity +
 * comments). Hook-free: the React layer fetches the Privy access token via
 * `getAccessToken()` and passes it in. A `null` token means a guest request
 * (allowed only on public reads).
 */
import { CIRCLE_PRO_API_URL, CIRCLE_ID } from '../config'

export interface PublicProfile {
  wallet: string
  handle: string
  displayName: string
  avatarSeed: number
}

export interface PublicComment {
  id: string
  bookmarkKey: string
  circleId: string
  author: PublicProfile
  text: string | null
  edited: boolean
  deleted: boolean
  likeCount: number
  likedByMe: boolean
  createdAt: string
}

export interface CommentsPage {
  comments: PublicComment[]
  hasMore: boolean
}

/** Carries the HTTP status + backend error code so callers can branch (e.g.
 *  PROFILE_REQUIRED → open the pseudo gate). */
export class ApiError extends Error {
  status: number
  code?: string
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

async function api<T>(
  token: string | null,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${CIRCLE_PRO_API_URL}${path}`, {
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: string
      code?: string
    }
    throw new ApiError(
      body.error || `circle-pro-api ${path}: HTTP ${res.status}`,
      res.status,
      body.code,
    )
  }
  return (await res.json()) as T
}

// ── Identity ──

/** Caller's profile, or null when none exists yet (404 → pseudo gate). */
export async function getMyProfile(token: string): Promise<PublicProfile | null> {
  try {
    const { profile } = await api<{ profile: PublicProfile }>(token, '/me/profile')
    return profile
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null
    throw e
  }
}

export const createProfile = (
  token: string,
  body: { handle: string; displayName?: string; avatarSeed?: number },
) =>
  api<{ profile: PublicProfile }>(token, '/me/profile', {
    method: 'POST',
    body: JSON.stringify(body),
  }).then((r) => r.profile)

export const updateProfile = (
  token: string,
  body: { handle?: string; displayName?: string; avatarSeed?: number },
) =>
  api<{ profile: PublicProfile }>(token, '/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(body),
  }).then((r) => r.profile)

export const checkHandle = (token: string, handle: string) =>
  api<{ valid: boolean; available: boolean }>(
    token,
    `/profiles/check?handle=${encodeURIComponent(handle)}`,
  )

// ── Comments ──

export const listComments = (
  token: string | null,
  key: string,
  opts?: { offset?: number; limit?: number; circleId?: string },
) =>
  api<CommentsPage>(
    token,
    `/bookmarks/${encodeURIComponent(key)}/comments?circleId=${
      opts?.circleId ?? CIRCLE_ID
    }&offset=${opts?.offset ?? 0}${opts?.limit ? `&limit=${opts.limit}` : ''}`,
  )

export const postComment = (token: string, key: string, text: string) =>
  api<{ comment: PublicComment }>(
    token,
    `/bookmarks/${encodeURIComponent(key)}/comments`,
    { method: 'POST', body: JSON.stringify({ text, circleId: CIRCLE_ID }) },
  ).then((r) => r.comment)

export const editComment = (token: string, id: string, text: string) =>
  api<{ comment: PublicComment }>(token, `/comments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ text }),
  }).then((r) => r.comment)

export const deleteComment = (token: string, id: string) =>
  api<{ comment: PublicComment }>(token, `/comments/${id}`, {
    method: 'DELETE',
  }).then((r) => r.comment)

export const likeComment = (token: string, id: string) =>
  api<{ comment: PublicComment }>(token, `/comments/${id}/like`, {
    method: 'POST',
  }).then((r) => r.comment)

export const unlikeComment = (token: string, id: string) =>
  api<{ comment: PublicComment }>(token, `/comments/${id}/like`, {
    method: 'DELETE',
  }).then((r) => r.comment)
