/**
 * Mission credits: every Trend Hunter mission a wallet completed this month
 * earns free Recommends (MISSION_CREDITS in @0xsofia/quests — 1 per daily
 * mission, 3 per weekly one). Checked on-chain with the same rules as the
 * explorer shows them: the account's page positions, their claims' backers
 * and its topic tags. No claim step: the quota counts them as they land.
 */
import {
  useClaimSupportersQuery,
  useGetUserContextAdditionsQuery,
  useGetUserMarketPositionsQuery,
} from '@0xsofia/graphql'
import {
  monthMissionCredits,
  startOfUtcWeek,
  topicOfWeek,
  type ClaimBacker,
  type MissionPosition,
  type TaggedPage,
} from '@0xsofia/quests'
import {
  CATEGORY_ATOM_IDS,
  PAGE_SUPPORT_PREDICATE_LABELS,
  SOFIA_TOPICS,
  TOPIC_ATOM_IDS,
} from '@0xsofia/taxonomy'
import { getAddress } from 'viem'

const PAGE = 100
/** 2 000 positions in a month — far past what a person opens */
const MAX_PAGES = 20
const BATCH = 50
const WEEK_MS = 7 * 86_400_000
const PAGE_PREDICATES = new Set(PAGE_SUPPORT_PREDICATE_LABELS)

/** The indexer stores account ids in mixed casings — query both */
const casings = (wallets: readonly string[]) => [
  ...new Set(wallets.flatMap((w) => [w.toLowerCase(), getAddress(w)])),
]

async function positionsSince(
  addresses: string[],
  since: number,
): Promise<MissionPosition[]> {
  const out: MissionPosition[] = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await useGetUserMarketPositionsQuery.fetcher({
      addresses,
      limit: PAGE,
      offset: page * PAGE,
    })()
    const rows = data.positions ?? []
    for (const row of rows) {
      const triple = row.term?.triple
      const pageKey = triple?.object?.term_id
      if (!triple || !pageKey) continue
      if (!PAGE_PREDICATES.has(triple.predicate?.label ?? '')) continue
      out.push({
        claimTermId: triple.term_id,
        pageKey,
        createdAt: Date.parse(row.created_at),
        deposit: BigInt(row.total_deposit_assets_after_total_fees ?? '0'),
        // An oppose row is the claim's counter vault
        side:
          row.term_id.toLowerCase() === triple.term_id.toLowerCase()
            ? 'support'
            : 'oppose',
      })
    }
    const oldest = rows[rows.length - 1]
    if (rows.length < PAGE || (oldest && Date.parse(oldest.created_at) < since))
      break
  }
  return out
}

async function backersOf(
  claimIds: string[],
): Promise<Map<string, ClaimBacker[]>> {
  const ids = [...new Set(claimIds)]
  const out = new Map<string, ClaimBacker[]>()
  for (let i = 0; i < ids.length; i += BATCH) {
    const data = await useClaimSupportersQuery.fetcher({
      claimTermIds: ids.slice(i, i + BATCH),
    })()
    for (const t of data.triples ?? []) {
      out.set(
        t.term_id,
        (t.support ?? []).map((p) => ({
          account: p.account_id,
          createdAt: Date.parse(p.created_at),
        })),
      )
    }
  }
  return out
}

/** The account's tags on the topics of the weeks since `since` */
async function tagsSince(
  addresses: string[],
  since: number,
  now: number,
): Promise<TaggedPage[]> {
  const topicOfAtom = new Map<string, string>()
  for (let week = since; week <= now; week += WEEK_MS) {
    const topic = topicOfWeek(SOFIA_TOPICS, week)
    const atoms = [
      TOPIC_ATOM_IDS[topic.id],
      ...topic.categories.map((c) => CATEGORY_ATOM_IDS[c.id]),
    ]
    for (const atom of atoms) if (atom) topicOfAtom.set(atom, topic.id)
  }
  if (topicOfAtom.size === 0) return []
  const data = await useGetUserContextAdditionsQuery.fetcher({
    userAddresses: addresses,
    topicAtomIds: [...topicOfAtom.keys()],
  })()
  const tags: TaggedPage[] = []
  for (const row of data.triples ?? []) {
    const pageKey = row.subject?.term?.triple?.object?.term_id
    const createdAt = row.positions?.[0]?.created_at
    if (!pageKey || !createdAt) continue
    tags.push({
      pageKey,
      createdAt: Date.parse(createdAt),
      topicId: topicOfAtom.get(row.object_id),
    })
  }
  return tags
}

/** Free Recommends the account's missions earned this month */
export async function missionCreditsOf(
  wallets: readonly string[],
  now: number = Date.now(),
): Promise<number> {
  if (wallets.length === 0) return 0
  const addresses = casings(wallets)
  const d = new Date(now)
  const monthStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)
  const firstWeek = startOfUtcWeek(monthStart)

  const [positions, taggedPages] = await Promise.all([
    positionsSince(addresses, monthStart),
    tagsSince(addresses, firstWeek, now),
  ])
  const monthPositions = positions.filter((p) => p.createdAt >= monthStart)
  const backers = await backersOf(monthPositions.map((p) => p.claimTermId))
  return monthMissionCredits({
    positions: monthPositions,
    backers,
    own: new Set(wallets.map((w) => w.toLowerCase())),
    taggedPages,
    topicAt: (at) => topicOfWeek(SOFIA_TOPICS, at),
    now,
  })
}
