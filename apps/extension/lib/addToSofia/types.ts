// Shared types for the "Add to Sofia" flow (right-click → modal → extension
// cart). Kept isolated under lib/addToSofia/ so the whole feature stays lift-ready.
//
// NON-PRO (active): the modal qualifies a page with a title, one or more
// intentions (a cart predicate each) and taxonomy tags (the cart's
// interestContexts), then pushes it into the extension's batch-certification cart.
//
// PRO (later): the prototype also sent a free-text `context` note + a workspace
// (circleId) to circle-pro-api. That path is preserved as commented code in the
// modal / QualifyFields / background so the Pro version can revive it — see the
// `// PRO (later):` markers. The pro-only message + payload types are kept here
// (commented) for the same reason.

import type { IntentionPurpose } from "~types/intentionCategories"

/** A taxonomy context the user tagged the page with (topic / category / niche). */
export interface Context {
  id: string
  label: string
  color: string
  /** Where it sits in the taxonomy. */
  level: "topic" | "category" | "niche"
}

// ── Content-script ⇄ background messages (NON-PRO) ──
// The injected modal can't touch the cart's IndexedDB (it lives on the page's
// origin, not the extension's) so it asks the service worker, which reads the
// connected wallet and calls cartService.addItem().

/** Open the modal on a right-clicked target (background → content script). */
export interface AddToSofiaOpenMessage {
  type: "ADD_TO_SOFIA_OPEN"
  url: string
  title: string
  isLink: boolean
}

/** Queue the qualified page into the extension cart (content script → background). */
export interface AddToCartMessage {
  type: "ADD_TO_CART"
  url: string
  title: string
  /** Chosen intentions → one cart item (predicate) added per selection. */
  intentions: IntentionPurpose[]
  /** Taxonomy tag ids → the cart item's interestContexts (slugs). */
  contextSlugs: string[]
  /** When the user picked an existing Intuition atom in the title search, its
   *  term_id — the batch deposits the triple on it instead of creating a new
   *  object atom from the URL. Absent → create from URL as usual. */
  objectTermId?: string | null
}

export interface AddToCartResponse {
  ok: boolean
  /** Set when ok === false, to drive a precise toast. */
  reason?: "no-wallet" | "duplicate" | "error"
}

/** Ask the SW whether a wallet is connected (content script → background).
 *  Sent when the modal opens so it can render a connect-first affordance
 *  (the content script can't read chrome.storage.session itself). */
export interface AddToSofiaStatusMessage {
  type: "ADD_TO_SOFIA_STATUS"
}

export interface AddToSofiaStatusResponse {
  connected: boolean
}

// ── Title autocomplete: search existing url/thing atoms ──
// The modal (content script) can't reach the indexer (CORS) so it asks the
// service worker, which runs the SearchUrlAtoms query via intuitionGraphqlClient.

/** One existing atom surfaced by the title search. */
export interface AtomSuggestion {
  termId: string
  label: string
  url: string | null
  image?: string | null
}

export interface SearchAtomsMessage {
  type: "SEARCH_ATOMS"
  query: string
}

export interface SearchAtomsResponse {
  atoms: AtomSuggestion[]
}

// ── PRO (later): circle-pro workspace share ────────────────────────────────
// Revive when the Pro version lands. Sent the page (incl. a free-text context
// note) into a chosen workspace via circle-pro-api instead of the local cart.
//
// /** A circle (workspace) the caller can write to — from GET /me/circles. */
// export interface CircleMembership {
//   groupTermId: string // on-chain group atom term_id — the canonical circleId
//   role: string
// }
//
// export interface SharePayload {
//   url: string
//   title: string
//   context: string // free-text editorial note ("the context only you have")
//   tags: Context[]
// }
//
// export interface ShareLoadMessage { type: "CIRCLE_PRO_LOAD" }
// export interface ShareLoadResponse { signedOut: boolean; circles: CircleMembership[] }
// export interface ShareSubmitMessage { type: "CIRCLE_PRO_SHARE"; payload: SharePayload; circleId: string }
// export interface ShareSubmitResponse { ok: boolean; kind?: "not-member" | "profile-required" | "error"; message?: string }
