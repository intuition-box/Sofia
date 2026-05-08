/**
 * groupsService — discover & enumerate `is member of` groups on the
 * Intuition graph.
 *
 * Sofia model: anyone can claim "X is member of Y" and people vouch
 * via positions on the resulting triple. We aggregate every triple
 * with `predicate = MEMBER_OF` by the object atom (the group) so the
 * UI can list the groups, their member rosters, and the wallets that
 * have backed each membership claim.
 */

import {
  useGetGroupsListQuery,
  useGetGroupDetailQuery,
  type GetGroupsListQuery,
} from '@0xsofia/graphql'
import { PREDICATE_IDS } from '../config'

type RawTriple = NonNullable<GetGroupsListQuery['triples']>[number]

const PAGE_SIZE = 200
const MAX_PAGES = 25 // 5 000 triples cap — orders of magnitude past today

// ── Public types ────────────────────────────────────────────────────

/** One claim that someone is a member of a group. */
export interface GroupMembership {
  /** Triple term_id. */
  tripleTermId: string
  /** Subject atom — the claimed member. */
  member: {
    termId: string
    label: string
    image: string | null
    description: string
    /** Wallet address resolved from `value.account.id`, lowercased.
     *  Null when the subject atom isn't an Account. */
    walletAddress: string | null
  }
  /** Vouching wallets — `account_id` of every position with shares > 0. */
  voucherWallets: string[]
  /** Total shares (wei) staked across both curves on this triple. */
  totalShares: bigint
  /** Earliest claim timestamp. */
  createdAt: string
}

/** Aggregated group entry — one per unique object atom. */
export interface GroupEntry {
  /** Group atom term_id. */
  termId: string
  label: string
  image: string | null
  description: string
  url: string
  /** Distinct member subjects (claimed members). */
  memberCount: number
  /** Distinct vouching wallets across all memberships. */
  voucherCount: number
  /** Total shares (wei) staked across every membership in this group. */
  totalShares: bigint
  /** Earliest membership timestamp on this group. */
  createdAt: string
  memberships: GroupMembership[]
}

// ── Helpers ─────────────────────────────────────────────────────────

function toMembership(triple: RawTriple): GroupMembership | null {
  if (!triple.subject) return null

  const subject = triple.subject
  const value = subject.value
  const description =
    value?.thing?.description ??
    value?.person?.description ??
    value?.organization?.description ??
    ''
  const accountWallet =
    value?.account?.id?.toLowerCase() ?? null

  const voucherWallets = new Set<string>()
  let totalShares = 0n
  for (const vault of triple.term?.vaults ?? []) {
    for (const pos of vault.positions ?? []) {
      const shares = safeBigInt(pos.shares)
      if (shares > 0n) {
        voucherWallets.add(pos.account_id.toLowerCase())
        totalShares += shares
      }
    }
  }

  return {
    tripleTermId: triple.term_id,
    member: {
      termId: subject.term_id,
      label: subject.label ?? subject.term_id.slice(0, 10),
      image: subject.image ?? null,
      description,
      walletAddress: accountWallet,
    },
    voucherWallets: [...voucherWallets],
    totalShares,
    createdAt: triple.created_at,
  }
}

function aggregateByObject(triples: RawTriple[]): GroupEntry[] {
  const groups = new Map<string, GroupEntry>()

  for (const triple of triples) {
    if (!triple.object) continue
    const membership = toMembership(triple)
    if (!membership) continue

    const obj = triple.object
    const value = obj.value
    const objLabel =
      value?.thing?.name ??
      value?.organization?.name ??
      value?.person?.name ??
      obj.label ??
      obj.term_id.slice(0, 10)
    const objDescription =
      value?.thing?.description ??
      value?.organization?.description ??
      value?.person?.description ??
      ''
    const objUrl =
      value?.thing?.url ??
      value?.organization?.url ??
      value?.person?.url ??
      ''
    const objImage =
      value?.thing?.image ??
      value?.organization?.image ??
      value?.person?.image ??
      obj.image ??
      null

    let entry = groups.get(obj.term_id)
    if (!entry) {
      entry = {
        termId: obj.term_id,
        label: objLabel,
        image: objImage,
        description: objDescription,
        url: objUrl,
        memberCount: 0,
        voucherCount: 0,
        totalShares: 0n,
        createdAt: triple.created_at,
        memberships: [],
      }
      groups.set(obj.term_id, entry)
    }

    entry.memberships.push(membership)
    entry.totalShares += membership.totalShares
    if (Date.parse(triple.created_at) < Date.parse(entry.createdAt)) {
      entry.createdAt = triple.created_at
    }
  }

  // Resolve the per-group counts in a second pass so dedup spans
  // every membership row in the group.
  for (const entry of groups.values()) {
    const memberSet = new Set<string>()
    const voucherSet = new Set<string>()
    for (const m of entry.memberships) {
      memberSet.add(m.member.termId)
      for (const v of m.voucherWallets) voucherSet.add(v)
    }
    entry.memberCount = memberSet.size
    entry.voucherCount = voucherSet.size
  }

  return [...groups.values()]
}

function safeBigInt(v: unknown): bigint {
  if (v == null) return 0n
  try {
    return BigInt(v as string | number)
  } catch {
    return 0n
  }
}

// ── Fetchers ────────────────────────────────────────────────────────

/**
 * Fetch every `is_member_of` triple (paginated) and aggregate by the
 * object atom. Sorted by member count desc, then by total shares desc.
 */
export async function fetchAllGroups(): Promise<GroupEntry[]> {
  const all: RawTriple[] = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const response = await useGetGroupsListQuery.fetcher({
      predicateId: PREDICATE_IDS.MEMBER_OF,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    })()
    const rows = response?.triples ?? []
    all.push(...rows)
    if (rows.length < PAGE_SIZE) break
  }

  const groups = aggregateByObject(all)
  groups.sort((a, b) => {
    if (b.memberCount !== a.memberCount) return b.memberCount - a.memberCount
    return Number(b.totalShares - a.totalShares)
  })
  return groups
}

/** Fetch every membership claim for a single group atom. */
export async function fetchGroupDetail(
  groupTermId: string,
): Promise<GroupEntry | null> {
  const all: RawTriple[] = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const response = await useGetGroupDetailQuery.fetcher({
      predicateId: PREDICATE_IDS.MEMBER_OF,
      objectId: groupTermId,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    })()
    const rows = response?.triples ?? []
    all.push(...rows)
    if (rows.length < PAGE_SIZE) break
  }

  const groups = aggregateByObject(all)
  return groups[0] ?? null
}
