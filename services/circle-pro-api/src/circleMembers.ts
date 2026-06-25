// Build the Members-tab payload: join circle members (from group-api) to their
// circle-pro profile and DERIVE their expertise from the bookmarks they've
// shared in the circle (top taxonomy tags). Pure — no DB / no network — so the
// aggregation is unit-tested in isolation.
import type { Bookmark, BookmarkTag, Profile } from '@prisma/client'
import { publicProfile, type PublicProfile } from './serialize'
import type { CircleMemberRef } from './membership'

export interface MemberExpertise {
  tagId: string
  label: string
  color: string
  count: number
}

export interface CircleMember {
  wallet: string
  role: string
  /** null when the member hasn't created a circle-pro profile yet. */
  profile: PublicProfile | null
  /** How many bookmarks they've shared in this circle. */
  shareCount: number
  /** Their most-used taxonomy tags in this circle (most first). */
  expertise: MemberExpertise[]
}

type BookmarkWithTags = Bookmark & { tags: BookmarkTag[] }

/**
 * Join members → profiles + expertise. `bookmarks` must already be scoped to the
 * circle and to these members' wallets. Wallets are matched lowercased.
 */
export function buildCircleMembers(
  refs: CircleMemberRef[],
  profiles: Profile[],
  bookmarks: BookmarkWithTags[],
  topExpertise = 4,
): CircleMember[] {
  const profileByWallet = new Map(profiles.map((p) => [p.wallet.toLowerCase(), p]))

  // Per-author: share count + tag frequency.
  type Agg = { shareCount: number; tags: Map<string, MemberExpertise> }
  const agg = new Map<string, Agg>()
  for (const b of bookmarks) {
    const w = b.authorWallet.toLowerCase()
    const a = agg.get(w) ?? { shareCount: 0, tags: new Map() }
    a.shareCount++
    for (const t of b.tags) {
      const cur = a.tags.get(t.tagId) ?? { tagId: t.tagId, label: t.label, color: t.color, count: 0 }
      cur.count++
      a.tags.set(t.tagId, cur)
    }
    agg.set(w, a)
  }

  return refs.map((m) => {
    const w = m.wallet.toLowerCase()
    const a = agg.get(w)
    const p = profileByWallet.get(w)
    const expertise = a
      ? [...a.tags.values()].sort((x, y) => y.count - x.count).slice(0, topExpertise)
      : []
    return {
      wallet: w,
      role: m.role,
      profile: p ? publicProfile(p) : null,
      shareCount: a?.shareCount ?? 0,
      expertise,
    }
  })
}
