/**
 * circleBuilders — pure factories that map raw data (TrustCircle
 * fetch, on-chain group entry) into the unified `CircleData` shape
 * consumed by `<CircleDetailView>`.
 *
 * Lives in `lib/` because it has zero React / network coupling — the
 * builders are easy to test in isolation and trivial to extend when a
 * new circle kind appears.
 */

import type { CircleData } from '@/types/circle'
import type { TrustCircleAccount } from '@/services/trustCircleService'
import type { GroupEntry } from '@/services/groupsService'
import { timeAgo } from '@/utils/formatting'

const DEFAULT_TRUST_COLOR = 'var(--trusted, #6dd4a0)'
const DEFAULT_GROUP_COLOR = 'var(--ds-accent, #e87c7c)'

/** Topic descriptor used by `buildGroupCircle` to extract the visual
 *  signature. Kept minimal so the loader hook can pass either the raw
 *  taxonomy entry or a trimmed projection without ceremony. */
export interface GroupTopicSummary {
  id: string
  label: string
  color: string
}

/**
 * Build the user's Trust Circle view-model. The Trust Circle isn't
 * indexed on-chain — it's the union of "I trust X" triples authored
 * by any of the user's linked wallets — so we always include the
 * user's own addresses in the feed roster (their certifications matter
 * to themselves).
 */
export function buildTrustCircle(
  linkedWallets: readonly string[],
  trustMembers: readonly TrustCircleAccount[],
  options: {
    name?: string
    description?: string
    color?: string
  } = {},
): CircleData {
  const addresses = new Set<string>()
  for (const a of linkedWallets) addresses.add(a.toLowerCase())
  for (const m of trustMembers) {
    if (m.walletAddress) addresses.add(m.walletAddress.toLowerCase())
  }

  return {
    id: 'trust',
    kind: 'trust',
    name: options.name ?? 'Trust Circle',
    description:
      options.description ??
      'People whose taste you value — their signals shape your feed. Today this is your personal trust circle; circles you join from the broader network will show up here too.',
    color: options.color ?? DEFAULT_TRUST_COLOR,
    members: [...trustMembers],
    addresses: [...addresses],
    createdAgo: 'a long time ago',
    // The Trust Circle is always "joined" — it IS the user's perspective.
    isMember: true,
  }
}

/**
 * Build an on-chain group view-model. `linkedWallets` drives the
 * `isMember` flag (a user is a member when one of their addresses
 * matches a membership subject's wallet — the same `(account,
 * MEMBER_OF, group)` triple they minted at creation).
 */
export function buildGroupCircle(
  group: GroupEntry,
  linkedWallets: readonly string[],
  topics: readonly GroupTopicSummary[] = [],
): CircleData {
  const userWallets = new Set(linkedWallets.map((w) => w.toLowerCase()))

  // Member subjects → flat addresses (lowercased). Dedupe so a member
  // claimed twice doesn't bloat the feed query.
  const addresses = new Set<string>()
  const members: TrustCircleAccount[] = []
  for (const m of group.memberships) {
    const wallet = m.member.walletAddress?.toLowerCase()
    if (wallet) addresses.add(wallet)
    members.push({
      id: m.member.termId,
      termId: m.member.termId,
      tripleId: m.tripleTermId,
      label: m.member.label,
      image: m.member.image,
      walletAddress: wallet ?? undefined,
      // Trust amount is a Trust-Circle concept — groups don't track a
      // per-member "trust score", so neutral defaults keep the type
      // checking without misleading downstream sorting.
      trustAmount: 0,
      createdAt: 0,
    })
  }

  // Membership test: any user wallet is also a member subject's wallet.
  const isMember = group.memberships.some((m) => {
    const w = m.member.walletAddress?.toLowerCase()
    return w !== undefined && userWallets.has(w)
  })

  return {
    id: group.termId,
    kind: 'group',
    name: group.label,
    description: group.description || '',
    color: topics[0]?.color ?? DEFAULT_GROUP_COLOR,
    members,
    addresses: [...addresses],
    // The hero template already prefixes "created " so we only emit the
    // relative segment (e.g. "5d ago"). Empty when the indexer hasn't
    // returned a timestamp yet — hero hides the line in that case.
    createdAgo: group.createdAt ? timeAgo(group.createdAt) : '',
    isMember,
    joinAction: isMember ? undefined : { atomTermId: group.termId },
  }
}
