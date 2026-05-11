/**
 * CircleData — normalised view-model that powers `<CircleDetailView>`.
 *
 * Both the user's Trust Circle and on-chain `is_member_of` groups
 * collapse onto this shape so the detail page can stay completely
 * unaware of the concrete source. New "circle kinds" (e.g. an
 * algorithmically-curated smart circle) plug in via a new builder
 * without touching the view layer.
 */

import type { TrustCircleAccount } from '@/services/trustCircleService'

export type CircleKind = 'trust' | 'group'

export interface CircleData {
  /** Stable identifier used in routing: `'trust'` or the group atom term_id. */
  id: string
  kind: CircleKind
  name: string
  description: string
  /** CSS color (hex or var()). Sourced from the first associated topic for
   *  groups, the user-chosen palette for the Trust Circle. */
  color: string
  /** Member roster — already shaped like `TrustCircleAccount` so existing
   *  sub-components (`CircleMembersCard`, `AllMembersPanel`) keep working
   *  without a parallel type. */
  members: TrustCircleAccount[]
  /** Wallet addresses (lowercased) used as input for any feed / topic-count
   *  query downstream. Includes the user's own linked wallets for the
   *  Trust Circle kind so their own activity shows up. */
  addresses: string[]
  /** Human-readable creation hint — "a long time ago" for trust, a relative
   *  date for groups. Pure display, never a Date object. */
  createdAgo: string
  /** Sponsor budget placeholder. `null` when the circle has no sponsorship
   *  concept (currently every kind — the Trust Circle's number is a mock). */
  sponsorClaimsLeft: number | null
  /** True when the user can see the full content. Always `true` for the
   *  Trust Circle (it's local). For groups, computed by checking that one
   *  of the user's linked wallets matches a member subject's wallet. */
  isMember: boolean
  /** Hint passed to `<CircleJoinOverlay>` when `isMember === false`. The
   *  caller is responsible for converting it into a cart item — this type
   *  stays free of cart coupling. */
  joinAction?: {
    /** Group atom term_id — the object of the membership triple to mint. */
    atomTermId: string
  }
}
