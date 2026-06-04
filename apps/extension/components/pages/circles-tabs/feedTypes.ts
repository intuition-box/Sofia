/**
 * Shared types for the Trust Circle feed (CircleFeedTab + useCircleFeed).
 */
import type { IntentionPurpose } from "~/types/discovery"
import type { IntentionType } from "~/types/intentionCategories"

export interface CircleFeedItem {
  id: string
  tripleTermId: string
  counterTermId: string
  intentionType: IntentionType
  tripleSubject: string
  triplePredicate: string
  tripleObject: string
  pageLabel: string
  pageUrl: string
  domain: string
  memberAddress: string
  memberLabel: string
  memberImage: string
  createdAt: string
}

// A stakeable "in context of" triple nested under a cert. Voting fans out
// across these (explorer parity) — `supportTermId`/`opposeTermId` are the
// context triple's own term_id / counter_term_id, NOT the cert triple's.
export interface FeedContext {
  slug: string
  supportTermId: string
  opposeTermId: string
  // Source cert predicate/purpose — kept so the cart item passes the
  // known-predicate check and displays sensibly while depositing on the
  // context vault.
  predicate: string
  purpose: IntentionPurpose | null
}

export interface GroupedFeedItem {
  groupKey: string
  pageLabel: string
  pageUrl: string
  domain: string
  memberAddress: string
  memberLabel: string
  memberImage: string
  createdAt: string
  intentions: CircleFeedItem[]
  // Context triples across all the group's intention certs (deduped by
  // vault). Empty → the card falls back to voting the cert triple.
  contexts: FeedContext[]
  // Unique topic/category slugs for the context pills.
  contextSlugs: string[]
}
