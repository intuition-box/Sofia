// Shared types for the circle-pro "Share in Sofia" flow. Kept isolated under
// lib/circle-pro/ so the whole feature is lift-ready into the explorer later.

/** A taxonomy context the user tagged the page with (topic / category / niche). */
export interface Context {
  id: string
  label: string
  color: string
  /** Where it sits in the taxonomy. */
  level: "topic" | "category" | "niche"
}

/** A circle (workspace) the caller can write to — from GET /me/circles. */
export interface CircleMembership {
  /** On-chain group atom term_id — the canonical circleId. */
  groupTermId: string
  role: string
}

/** Payload sent to circle-pro-api when sharing a page. The backend normalises
 *  the URL server-side (the on-chain key invariant), so we send the raw url. */
export interface SharePayload {
  url: string
  title: string
  context: string
  /** Taxonomy tags — the qualification. No intentions, per the spec. */
  tags: Context[]
}

// ── Content-script ⇄ background messages ──
// The injected modal can't fetch circle-pro-api itself (MV3 content scripts are
// CORS-bound and can't read session storage). It asks the service worker, which
// holds the JWT and fetches with host_permissions.

/** Resolve the caller's session + circles when the modal opens. Flat shape (not
 *  a discriminated union) — the extension's tsconfig runs with strictNullChecks
 *  off, where union narrowing is unreliable. `circles` is [] when signed out. */
export interface ShareLoadMessage {
  type: "CIRCLE_PRO_LOAD"
}
export interface ShareLoadResponse {
  signedOut: boolean
  circles: CircleMembership[]
}

/** Share the qualified page into a circle. */
export interface ShareSubmitMessage {
  type: "CIRCLE_PRO_SHARE"
  payload: SharePayload
  circleId: string
}
export interface ShareSubmitResponse {
  ok: boolean
  /** Set when ok === false, to drive a precise message. */
  kind?: "not-member" | "profile-required" | "error"
  message?: string
}
