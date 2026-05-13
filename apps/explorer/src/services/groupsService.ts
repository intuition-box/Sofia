/**
 * groupsService — discover & enumerate `is member of` groups on the
 * Intuition graph.
 *
 * Sofia model: anyone can mint "X is member of Y" and the indexer
 * surfaces every such triple. We aggregate by the object atom (the
 * group) so the UI can list groups and their member rosters. Anti-fake
 * filtering is intentionally out of scope — a future on-chain process
 * will gate membership validity. For now: every claim shows up.
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
  const accountWallet = value?.account?.id?.toLowerCase() ?? null

  return {
    tripleTermId: triple.term_id,
    member: {
      termId: subject.term_id,
      label: subject.label ?? subject.term_id.slice(0, 10),
      image: subject.image ?? null,
      description,
      walletAddress: accountWallet,
    },
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
      value?.thing?.url ?? value?.organization?.url ?? value?.person?.url ?? ''
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
        createdAt: triple.created_at,
        memberships: [],
      }
      groups.set(obj.term_id, entry)
    }

    entry.memberships.push(membership)
    if (Date.parse(triple.created_at) < Date.parse(entry.createdAt)) {
      entry.createdAt = triple.created_at
    }
  }

  // Resolve the per-group member count in a second pass so dedup spans
  // every membership row in the group.
  for (const entry of groups.values()) {
    const memberSet = new Set<string>()
    for (const m of entry.memberships) memberSet.add(m.member.termId)
    entry.memberCount = memberSet.size
  }

  return [...groups.values()]
}

// ── Fetchers ────────────────────────────────────────────────────────

/**
 * Fetch every `is_member_of` triple (paginated) and aggregate by the
 * object atom. Sorted by member count desc, then by creation date desc
 * (newer groups break ties).
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
    return Date.parse(b.createdAt) - Date.parse(a.createdAt)
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
