/**
 * sortQueueService — pages waiting for a second opinion: a Sofia Recommend
 * claim exactly one other account holds (62% of pages never get past it).
 * Read-only; the queue UI recommends or opposes them for free through the
 * write-relayer ("Sort your pages" mission).
 */
import { useGetTrendingPagePositionsQuery } from '@0xsofia/graphql'
import { extractDomain } from '@/utils/formatting'
import { fetchClaimSupporters } from './claimSupportersService'
import { recommendClaimId } from './pageMarketCartService'

const PAGE = 100
/** The newest 300 positions hold plenty of fresh single-recommender pages */
const MAX_PAGES = 3
/** Claims checked for their supporters */
const MAX_CLAIMS = 80

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
  const claims = new Map<
    string,
    { objectId: string; label: string | null; url: string | null }
  >()
  for (let page = 0; page < MAX_PAGES && claims.size < MAX_CLAIMS; page++) {
    const data = await useGetTrendingPagePositionsQuery.fetcher({
      predicateLabels: ['recommends'],
      limit: PAGE,
      offset: page * PAGE,
    })()
    const rows = data.positions ?? []
    for (const row of rows) {
      const triple = row.term?.triple
      const objectId = triple?.object_id
      // Support rows on Sofia's own claim (I | recommends | page)
      if (!triple || !objectId || row.term_id !== triple.term_id) continue
      if (triple.term_id.toLowerCase() !== recommendClaimId(objectId)) continue
      if (claims.has(triple.term_id)) continue
      claims.set(triple.term_id, {
        objectId,
        label: triple.object?.label ?? null,
        url: triple.object?.value?.thing?.url ?? null,
      })
    }
    if (rows.length < PAGE) break
  }

  const supporters = await fetchClaimSupporters([...claims.keys()])
  const out: SortCandidate[] = []
  for (const [claimId, claim] of claims) {
    const s = supporters[claimId]
    if (!s) continue
    const backers = new Set(s.support.map((b) => b.account.toLowerCase()))
    if (backers.size !== 1) continue
    const [recommender] = backers
    if (mine.has(recommender)) continue
    if (s.oppose.some((b) => mine.has(b.account.toLowerCase()))) continue
    const domain = claim.url ? extractDomain(claim.url) : null
    out.push({
      claimId,
      objectId: claim.objectId,
      title: claim.label || domain || 'A page',
      url: claim.url,
      domain,
      recommender,
      recommendedAt: Date.parse(s.support[0].createdAt),
    })
  }
  return out.sort((a, b) => b.recommendedAt - a.recommendedAt)
}
