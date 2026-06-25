// circle-pro-api client for the extension. Auth = the session JWT minted during
// the Sofia /auth handshake and stored in chrome.storage.session (cleared on
// browser close, 12h server-side exp). The backend gates writes to circle
// members and normalises the URL server-side.
import { CIRCLE_PRO_API_URL } from "./config"
import type { CircleMembership, SharePayload } from "./types"

/** The Pro session JWT, or null if the user hasn't connected via Sofia /auth. */
export async function getCircleProToken(): Promise<string | null> {
  const { circleProToken } = await chrome.storage.session.get("circleProToken")
  return typeof circleProToken === "string" ? circleProToken : null
}

/** Carries the HTTP status so callers can branch (403 = not a member, 409 =
 *  no Pro profile yet). */
export class CircleProError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

/** The gate refused the write — the caller isn't a member of the circle. */
export function isNotMemberError(e: unknown): boolean {
  return e instanceof CircleProError && e.status === 403
}

/** The caller has no Sofia Pro profile yet (must create one in the web app). */
export function isProfileRequiredError(e: unknown): boolean {
  return e instanceof CircleProError && e.status === 409
}

async function req<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${CIRCLE_PRO_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers
    }
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new CircleProError(body.error || `HTTP ${res.status}`, res.status)
  }
  return (await res.json()) as T
}

/** The circles the caller can write to (source for the picker). */
export async function getMyCircles(token: string): Promise<CircleMembership[]> {
  const { circles } = await req<{ circles: CircleMembership[] }>(token, "/me/circles")
  return circles
}

/** Share a page into a circle. The backend normalises the URL server-side. */
export async function postBookmark(
  token: string,
  payload: SharePayload,
  circleId: string
): Promise<void> {
  await req(token, "/bookmarks", {
    method: "POST",
    body: JSON.stringify({
      url: payload.url,
      title: payload.title,
      context: payload.context,
      tags: payload.tags,
      circleId
    })
  })
}
