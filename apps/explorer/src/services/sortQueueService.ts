/**
 * sortQueueService — pages waiting for a second opinion: a Sofia Recommend
 * claim exactly one other account holds (62% of pages never get past it).
 * Read-only; the queue UI recommends or opposes them for free through the
 * write-relayer ("Sort your pages" mission).
 */
import { useGetFreshPageClaimsQuery } from '@0xsofia/graphql'
import { SOFIA_I_ATOM_ID } from '@/config/atomIds'
import { extractDomain } from '@/utils/formatting'

const PAGE = 100
/** The newest 200 page claims — nearly all wait for a second opinion */
const MAX_PAGES = 2

export interface SortCandidate {
  claimId: string
  objectId: string
  title: string
  url: string | null
  domain: string | null
  /** The one account that recommended it */
  recommender: string
  recommendedAt: number
}

/** Newest first; never the account's own pages or pages it already judged */
export async function fetchSortCandidates(
  own: readonly string[],
): Promise<SortCandidate[]> {
  const mine = new Set(own.map((a) => a.toLowerCase()))
  const out: SortCandidate[] = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await useGetFreshPageClaimsQuery.fetcher({
      subjectId: SOFIA_I_ATOM_ID,
      limit: PAGE,
      offset: page * PAGE,
    })()
    const rows = data.triples ?? []
    for (const t of rows) {
      const backers = new Set(
        t.positions.map((p) => p.account_id.toLowerCase()),
      )
      if (backers.size !== 1 || !t.object) continue
      const [recommender] = backers
      if (mine.has(recommender)) continue
      const opposed = t.counter_term?.positions ?? []
      if (opposed.some((p) => mine.has(p.account_id.toLowerCase()))) continue
      const url = t.object.value?.thing?.url ?? null
      const domain = url ? extractDomain(url) : null
      out.push({
        claimId: t.term_id,
        objectId: t.object.term_id,
        title: t.object.label || domain || 'A page',
        url,
        domain,
        recommender,
        recommendedAt: Date.parse(t.positions[0].created_at),
      })
    }
    if (rows.length < PAGE) break
  }
  return out
}
