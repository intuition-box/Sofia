/**
 * missionsService — Trend Hunter daily/weekly missions for a wallet
 * (docs/plans/TREND_HUNTER_SPEC.md §3, §6). Read-only: everything comes from
 * the user's on-chain positions; the pure rules live in @0xsofia/quests.
 */
import {
  useGetUserContextAdditionsQuery,
  useGetUserMarketPositionsQuery,
} from '@0xsofia/graphql'
import {
  computeDailyMissions,
  computeWeeklyMission,
  startOfUtcDay,
  topicOfWeek,
  type MissionPosition,
  type MissionProgress,
  type TaggedPage,
} from '@0xsofia/quests'
import {
  CATEGORY_ATOM_IDS,
  SOFIA_TOPICS,
  TOPIC_ATOM_IDS,
} from '@/config/taxonomy'
import { resolveWebKey } from '@/utils/webAtom'
import { fetchClaimSupporters } from './claimSupportersService'

const PAGE = 100
/** Positions come newest first — today's always fit well within this */
const MAX_PAGES = 5

export interface MissionsResult {
  daily: MissionProgress[]
  weekly: MissionProgress
  topic: { id: string; label: string }
}

/** The user's page claims opened since `since` (newest first walk) */
async function fetchRecentPositions(
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
      const createdAt = Date.parse(row.created_at)
      const triple = row.term?.triple
      const pageKey = triple ? resolveWebKey(triple.object) : null
      if (!triple || !pageKey) continue
      out.push({
        claimTermId: triple.term_id,
        pageKey,
        createdAt,
        deposit: BigInt(row.total_deposit_assets_after_total_fees ?? '0'),
      })
    }
    const oldest = rows[rows.length - 1]
    if (
      rows.length < PAGE ||
      (oldest && Date.parse(oldest.created_at) < since)
    ) {
      break
    }
  }
  return out
}

/** Claims where the user holds the earliest open position */
async function fetchPioneerClaims(
  addresses: string[],
  claimIds: string[],
): Promise<Set<string>> {
  if (claimIds.length === 0) return new Set()
  const own = new Set(addresses.map((a) => a.toLowerCase()))
  const supporters = await fetchClaimSupporters(claimIds)
  return new Set(
    claimIds.filter((id) => {
      const first = supporters[id]?.support[0]
      return !!first && own.has(first.account.toLowerCase())
    }),
  )
}

/** Pages the user tagged with the topic of the week (topic or a category) */
async function fetchTaggedPages(
  addresses: string[],
  topicId: string,
): Promise<TaggedPage[]> {
  const topic = SOFIA_TOPICS.find((t) => t.id === topicId)
  const atomIds = [
    TOPIC_ATOM_IDS[topicId],
    ...(topic?.categories ?? []).map((c) => CATEGORY_ATOM_IDS[c.id]),
  ].filter(Boolean)
  if (atomIds.length === 0) return []
  const data = await useGetUserContextAdditionsQuery.fetcher({
    userAddresses: addresses,
    topicAtomIds: atomIds,
  })()
  const pages: TaggedPage[] = []
  for (const row of data.triples ?? []) {
    const pageKey = resolveWebKey(row.subject?.term?.triple?.object)
    const createdAt = row.positions?.[0]?.created_at
    if (pageKey && createdAt) {
      pages.push({ pageKey, createdAt: Date.parse(createdAt) })
    }
  }
  return pages
}

export async function fetchMissions(
  addresses: string[],
  trendingKeys: ReadonlySet<string>,
  now: number = Date.now(),
): Promise<MissionsResult> {
  const topic = topicOfWeek(SOFIA_TOPICS, now)
  const dayStart = startOfUtcDay(now)

  const [positions, taggedPages] = await Promise.all([
    fetchRecentPositions(addresses, dayStart),
    fetchTaggedPages(addresses, topic.id),
  ])
  const todayClaims = [
    ...new Set(
      positions
        .filter((p) => p.createdAt >= dayStart)
        .map((p) => p.claimTermId),
    ),
  ]
  const pioneerClaimIds = await fetchPioneerClaims(addresses, todayClaims)

  return {
    daily: computeDailyMissions({
      positions,
      trendingKeys,
      pioneerClaimIds,
      now,
    }),
    weekly: computeWeeklyMission(topic, taggedPages, now),
    topic: { id: topic.id, label: topic.label },
  }
}
