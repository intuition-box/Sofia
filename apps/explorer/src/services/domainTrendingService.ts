import {
  useGetTrendingByPredicateQuery,
  type GetTrendingByPredicateQuery,
} from '@0xsofia/dashboard-graphql'
import { GRAPHQL_URL } from '@/config'
import { getPlatformsByTopic } from '@/config/platformCatalog'
import { extractDomain } from '@/utils/formatting'
import { getFaviconUrl } from '@/utils/favicon'
import { isValidTriple, tripleToItem } from './trendingService'
import { INTENTION_COLORS } from '@/config/intentions'
import type { IntentCategory, TrendingItemLive, TrendingPlatform } from '@/types'

type TrendingTripleRaw = GetTrendingByPredicateQuery['triples'][number]

const ALL_CATEGORIES: { type: IntentCategory; label: string }[] = [
  { type: 'trusted', label: 'trusts' },
  { type: 'distrusted', label: 'distrust' },
  { type: 'work', label: 'visits for work' },
  { type: 'learning', label: 'visits for learning' },
  { type: 'fun', label: 'visits for fun' },
  { type: 'inspiration', label: 'visits for inspiration' },
  { type: 'music', label: 'visits for music' },
  { type: 'buying', label: 'visits for buying' },
]

const CATEGORY_DISPLAY: Record<IntentCategory, string> = {
  trusted: 'Trusted',
  distrusted: 'Distrusted',
  work: 'Work',
  learning: 'Learning',
  fun: 'Fun',
  inspiration: 'Inspiration',
  music: 'Music',
  buying: 'Buying',
}

const TRENDING_BY_LABEL_QUERY = `
  query GetTrendingByLabel($label: String!, $limit: Int!) {
    triples(
      where: { predicate: { label: { _eq: $label } } }
      order_by: [{ positions_aggregate: { count: desc } }, { created_at: desc }]
      limit: $limit
    ) {
      term_id
      counter_term_id
      object {
        label
        value { thing { url } }
      }
      all_positions: positions(where: { shares: { _gt: "0" } }) {
        account { id }
      }
    }
  }
`

async function fetchByLabel(label: string, limit: number): Promise<TrendingTripleRaw[]> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: TRENDING_BY_LABEL_QUERY, variables: { label, limit } }),
  })
  const json = await res.json()
  return json.data?.triples ?? []
}


/** Known aliases: apiBaseUrl hostname → real website domain */
const DOMAIN_ALIASES: Record<string, string> = {
  'audioscrobbler.com': 'last.fm',
  'ws.audioscrobbler.com': 'last.fm',
  'listenbrainz.org': 'listenbrainz.org',
  'musicbrainz.org': 'musicbrainz.org',
}

/** Extract root domain (last two parts, or last three for co.uk etc.) */
function rootDomain(host: string): string {
  const alias = DOMAIN_ALIASES[host]
  if (alias) return alias
  const parts = host.split('.')
  if (parts.length >= 3 && parts[parts.length - 2].length <= 3 && parts[parts.length - 1].length <= 2) {
    return parts.slice(-3).join('.')
  }
  return parts.slice(-2).join('.')
}

function normalizeDomain(host: string): string {
  return rootDomain(host.replace(/^www\./, ''))
}

function matchesDomain(triple: TrendingTripleRaw, domainDomains: Set<string>): boolean {
  const label = triple.object?.label || ''
  const thingUrl = triple.object?.value?.thing?.url
  const url = thingUrl || (label.startsWith('http') ? label : `https://${label}`)
  const domain = normalizeDomain(extractDomain(url))
  return domainDomains.has(domain)
}

function getDomainFromTriple(triple: TrendingTripleRaw): string {
  const label = triple.object?.label || ''
  const thingUrl = triple.object?.value?.thing?.url
  const url = thingUrl || (label.startsWith('http') ? label : `https://${label}`)
  return normalizeDomain(extractDomain(url))
}

function buildPlatformDomains(topicId: string) {
  const platforms = getPlatformsByTopic(topicId)
  const platformDomains = new Set<string>()
  const domainToName = new Map<string, string>()
  const domainToSlug = new Map<string, string>()

  for (const p of platforms) {
    const hosts: string[] = [normalizeDomain(`${p.id}.com`)]
    if (p.website) {
      try { hosts.push(normalizeDomain(new URL(p.website).hostname)) } catch {}
    }
    if (p.apiBaseUrl) {
      const extracted = normalizeDomain(extractDomain(p.apiBaseUrl))
      if (extracted) hosts.push(extracted)
      try { hosts.push(normalizeDomain(new URL(p.apiBaseUrl).hostname)) } catch {}
    }
    for (const h of hosts) {
      platformDomains.add(h)
      domainToName.set(h, p.name)
      domainToSlug.set(h, p.id)
    }
  }

  return { platformDomains, domainToName, domainToSlug }
}

/**
 * Fetch trending platforms aggregated by domain
 */
export async function fetchTrendingByDomain(topicId: string): Promise<TrendingPlatform[]> {
  const { platformDomains, domainToName, domainToSlug } = buildPlatformDomains(topicId)

  // Fetch all categories in parallel using label-based query
  const promises = ALL_CATEGORIES.map(async ({ type, label }) => {
    const triples = await fetchByLabel(label, 50)
    const valid = triples.filter(isValidTriple)
    return valid
      .filter((t) => matchesDomain(t, platformDomains))
      .map((t) => ({
        item: tripleToItem(t, type),
        host: getDomainFromTriple(t),
      }))
  })

  const results = await Promise.allSettled(promises)
  const allMatches = results
    .filter((r): r is PromiseFulfilledResult<{ item: TrendingItemLive; host: string }[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value)

  // Aggregate by platform host
  const platformMap = new Map<string, {
    name: string
    totalCertifiers: number
    intentionCounts: Map<IntentCategory, number>
    termId?: string
    counterTermId?: string
  }>()

  for (const { item, host } of allMatches) {
    let entry = platformMap.get(host)
    if (!entry) {
      entry = {
        name: domainToName.get(host) || host,
        totalCertifiers: 0,
        intentionCounts: new Map(),
      }
      platformMap.set(host, entry)
    }
    entry.totalCertifiers += item.certifiers
    entry.intentionCounts.set(
      item.category,
      (entry.intentionCounts.get(item.category) || 0) + item.certifiers,
    )
    // Keep termId/counterTermId from the first triple that has them (prefer "trusted" category)
    if (!entry.termId && item.termId) {
      entry.termId = item.termId
      entry.counterTermId = item.counterTermId
    }
  }

  // Convert to TrendingPlatform[]
  const platformEntries = [...platformMap.entries()]

  const platforms: TrendingPlatform[] = platformEntries.map(([host, entry]) => {
    const slug = domainToSlug.get(host)
    return {
      platformDomain: host,
      platformName: entry.name,
      platformSlug: slug,
      favicon: slug ? `/favicons/${slug}.png` : getFaviconUrl(host, 32),
      totalCertifiers: entry.totalCertifiers,
      intentions: [...entry.intentionCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([cat, count]) => ({
          category: cat,
          count,
          color: INTENTION_COLORS[CATEGORY_DISPLAY[cat]] ?? '#888',
        })),
      termId: entry.termId,
      counterTermId: entry.counterTermId,
      userPnlPct: null,
    }
  })

  return platforms.sort((a, b) => b.totalCertifiers - a.totalCertifiers)
}
