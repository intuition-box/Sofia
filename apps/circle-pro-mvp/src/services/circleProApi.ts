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

/** True when an error is the membership gate refusing a write (403). Lets the
 *  UI tell "not a member of this circle" apart from other failures. */
export function isNotMemberError(e: unknown): boolean {
  return e instanceof ApiError && e.status === 403
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

// ── Circles (membership) ──

export interface CircleMembership {
  /** On-chain group atom term_id — the canonical circleId. */
  groupTermId: string
  role: string
}

/** The circles the caller can write to (source for the circle picker). */
export const getMyCircles = (token: string) =>
  api<{ circles: CircleMembership[] }>(token, '/me/circles').then(
    (r) => r.circles,
  )

export interface MemberExpertise {
  tagId: string
  label: string
  color: string
  count: number
}

export interface CircleMember {
  wallet: string
  role: string
  /** null when the member hasn't created a Pro profile yet. */
  profile: PublicProfile | null
  shareCount: number
  /** Most-used taxonomy tags in this circle (derived, most first). */
  expertise: MemberExpertise[]
}

/** Members of a circle + role + profile + derived expertise. Public read. */
export const getCircleMembers = (token: string | null, circleId: string = CIRCLE_ID) =>
  api<{ members: CircleMember[] }>(
    token,
    `/circles/${encodeURIComponent(circleId)}/members`,
  ).then((r) => r.members)

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

export const postComment = (
  token: string,
  key: string,
  text: string,
  circleId: string = CIRCLE_ID,
) =>
  api<{ comment: PublicComment }>(
    token,
    `/bookmarks/${encodeURIComponent(key)}/comments`,
    { method: 'POST', body: JSON.stringify({ text, circleId }) },
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

// ── Bookmarks ──

export interface PublicTag {
  id: string
  label: string
  color: string
  level: string
}

export interface PublicBookmark {
  id: string
  url: string
  normalizedUrl: string
  title: string
  context: string
  circleId: string
  author: PublicProfile
  tags: PublicTag[]
  createdAt: string
}

export const listBookmarks = (
  token: string | null,
  opts?: { mine?: boolean; offset?: number; circleId?: string },
) =>
  api<{ bookmarks: PublicBookmark[]; hasMore: boolean }>(
    token,
    `/bookmarks?circleId=${opts?.circleId ?? CIRCLE_ID}&offset=${opts?.offset ?? 0}${
      opts?.mine ? '&mine=1' : ''
    }`,
  )

export const postBookmark = (
  token: string,
  body: { url: string; normalizedUrl: string; title: string; context?: string; tags?: PublicTag[] },
  circleId: string = CIRCLE_ID,
) =>
  api<{ bookmark: PublicBookmark }>(token, '/bookmarks', {
    method: 'POST',
    body: JSON.stringify({ ...body, circleId }),
  }).then((r) => r.bookmark)

/** Who in the circle has shared each URL — REAL social proof (replaces the mock
 *  "who on your team keeps this"). Batched: pass every visible URL at once. */
export const getSharers = (
  token: string | null,
  normalizedUrls: string[],
  circleId: string = CIRCLE_ID,
) =>
  api<{ sharers: Record<string, PublicProfile[]> }>(token, '/bookmarks/sharers', {
    method: 'POST',
    body: JSON.stringify({ circleId, normalizedUrls }),
  }).then((r) => r.sharers)

// ── Search — the group's knowledge access ──

export interface SearchComment {
  id: string
  text: string
  bookmarkKey: string
  author: PublicProfile
  createdAt: string
}

export interface SearchResults {
  query: string
  bookmarks: PublicBookmark[]
  comments: SearchComment[]
  people: PublicProfile[]
}

export interface SearchHint {
  type: 'tag' | 'bookmark' | 'person'
  label: string
  value: string
  color?: string
}

export const searchAll = (
  token: string | null,
  q: string,
  circleId: string = CIRCLE_ID,
) =>
  api<SearchResults>(
    token,
    `/search?circleId=${circleId}&q=${encodeURIComponent(q)}`,
  )

export const searchHints = (token: string | null, q: string) =>
  api<{ hints: SearchHint[] }>(
    token,
    `/search/hints?q=${encodeURIComponent(q)}`,
  ).then((r) => r.hints)
