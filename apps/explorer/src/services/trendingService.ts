import {
  useGetTrendingByPredicateQuery,
  type GetTrendingByPredicateQuery,
} from '@0xsofia/dashboard-graphql'
import { PREDICATE_IDS } from '@/config'
import type { IntentCategory, TrendingItemLive } from '@/types'
import { extractDomain } from '@/utils/formatting'
import { getFaviconUrl } from '@/utils/favicon'

type TrendingTripleRaw = GetTrendingByPredicateQuery['triples'][number]

const CATEGORIES: { type: IntentCategory; predicateId: string }[] = [
  { type: 'trusted', predicateId: PREDICATE_IDS.TRUSTS },
  { type: 'distrusted', predicateId: PREDICATE_IDS.DISTRUST },
  { type: 'work', predicateId: PREDICATE_IDS.VISITS_FOR_WORK },
  { type: 'learning', predicateId: PREDICATE_IDS.VISITS_FOR_LEARNING },
  { type: 'fun', predicateId: PREDICATE_IDS.VISITS_FOR_FUN },
  { type: 'inspiration', predicateId: PREDICATE_IDS.VISITS_FOR_INSPIRATION },
]

const ENS_SUFFIXES = ['.eth', '.box']
const WALLET_RE = /^0x[0-9a-f]{4,}$/i

export function isValidTriple(triple: TrendingTripleRaw): boolean {
  const label = (triple.object?.label || '').toLowerCase()
  if (ENS_SUFFIXES.some(s => label.endsWith(s))) return false
  if (WALLET_RE.test(label.replace(/[\u2026.]+/g, ''))) return false
  if ((triple.all_positions || []).length === 0) return false
  const thingUrl = triple.object?.value?.thing?.url
  if (!thingUrl && !label.startsWith('http') && !/[\w-]+\.[\w.-]+/.test(label)) return false
  return true
}

export function tripleToItem(triple: TrendingTripleRaw, category: IntentCategory): TrendingItemLive {
  const label = triple.object?.label || ''
  const thingUrl = triple.object?.value?.thing?.url
  const url = thingUrl || (label.startsWith('http') ? label : `https://${label}`)
  const domain = extractDomain(url)
  return {
    category,
    label: label || domain,
    url: `https://${domain}`,
    domain,
    favicon: getFaviconUrl(domain, 32),
    certifiers: triple.all_positions.length,
    termId: triple.term_id ?? undefined,
    counterTermId: triple.counter_term_id ?? undefined,
  }
}

export async function fetchTrendingItems(): Promise<TrendingItemLive[]> {
  const promises = CATEGORIES.map(async ({ type, predicateId }) => {
    const data = await useGetTrendingByPredicateQuery.fetcher({
      predicateId,
      limit: 5,
    })()
    const first = (data.triples || []).find(isValidTriple)
    return first ? tripleToItem(first, type) : null
  })

  const results = await Promise.allSettled(promises)
  return results
    .filter((r): r is PromiseFulfilledResult<TrendingItemLive | null> => r.status === 'fulfilled')
    .map(r => r.value)
    .filter((item): item is TrendingItemLive => item !== null)
}
