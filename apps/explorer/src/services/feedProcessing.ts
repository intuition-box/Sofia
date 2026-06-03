import {
  PREDICATE_TO_INTENTION,
  LABEL_TO_INTENTION,
} from '../config/intentions'
import { GRAPHQL_URL } from '../config'
import { ATOM_ID_TO_TOPIC } from '../config/atomIds'
import { extractDomain, cleanLabel } from '../utils/formatting'
import { getFaviconUrl } from '../utils/favicon'
import type { CircleItem } from './circleService'

interface VaultPositionCount {
  position_count?: number | null
  positions?: Array<{ shares?: string | null }> | null
}

export interface FeedEvent {
  id: string
  created_at?: string | null
  triple?: {
    term_id?: string | null
    counter_term_id?: string | null
    object?: {
      label?: string | null
      value?: {
        thing?: { url?: string | null; name?: string | null } | null
      } | null
    } | null
    predicate?: {
      term_id?: string | null
      label?: string | null
    } | null
    /** Vaults on the positive term — populated by GetSofiaTrustedActivity (all curves). */
    term?: {
      vaults?: VaultPositionCount[] | null
    } | null
    /** Vaults on the counter term (all curves). */
    counter_term?: {
      vaults?: VaultPositionCount[] | null
    } | null
  } | null
  deposit?: {
    receiver?: { id?: string | null; label?: string | null } | null
  } | null
  redemption?: {
    sender?: { id?: string | null; label?: string | null } | null
  } | null
}

function sumVaultPositions(vaults?: VaultPositionCount[] | null): number {
  if (!vaults) return 0
  let total = 0
  for (const v of vaults) total += v.position_count ?? 0
  return total
}

/** True if the user owns shares > 0 on any of the term's vaults (any curve). */
function userHoldsShares(vaults?: VaultPositionCount[] | null): boolean {
  if (!vaults) return false
  for (const v of vaults) {
    for (const p of v.positions ?? []) {
      try {
        if (BigInt(p.shares ?? '0') > 0n) return true
      } catch {
        // ignore malformed shares strings
      }
    }
  }
  return false
}

export interface CertifierInfo {
  address: string
  label: string
}

// ── Context triples resolution ──

const CONTEXT_TRIPLES_QUERY = `
  query GetContextTriples($subjectIds: [String!]!) {
    triples(
      where: {
        subject_id: { _in: $subjectIds }
        predicate: { label: { _eq: "in context of" } }
      }
      limit: 500
    ) {
      subject_id
      object { term_id label }
    }
  }
`

/**
 * Fetch "in context of" nested triples for a set of cert triple term_ids.
 * Returns a map: certTripleTermId → topic slugs[]
 */
async function fetchContextTriples(
  certTermIds: string[],
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>()
  if (certTermIds.length === 0) return result

  try {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: CONTEXT_TRIPLES_QUERY,
        variables: { subjectIds: certTermIds },
      }),
    })
    const json = await res.json()
    const triples = json.data?.triples || []

    for (const t of triples) {
      const subjectId = t.subject_id
      const objectTermId = t.object?.term_id
      if (!subjectId || !objectTermId) continue

      const topicSlug = ATOM_ID_TO_TOPIC.get(objectTermId)
      if (!topicSlug) continue

      const existing = result.get(subjectId)
      if (existing) {
        if (!existing.includes(topicSlug)) existing.push(topicSlug)
      } else {
        result.set(subjectId, [topicSlug])
      }
    }
  } catch {
    // Non-blocking: context is bonus info
  }

  return result
}

// ── Main processing ──

/**
 * Process raw GraphQL events into grouped CircleItem[].
 * Shared between activityService and circleService.
 */
export function processEvents(
  events: FeedEvent[],
  getCertifier: (evt: FeedEvent) => CertifierInfo,
): CircleItem[] {
  const groupedMap = new Map<string, CircleItem>()

  for (const evt of events) {
    const triple = evt.triple
    if (!triple) continue

    const objectLabel = triple.object?.label || ''
    const thingUrl = triple.object?.value?.thing?.url
    const hasRealUrl =
      thingUrl || objectLabel.startsWith('http') || objectLabel.includes('.')
    const url =
      thingUrl ||
      (objectLabel.startsWith('http')
        ? objectLabel
        : hasRealUrl
          ? `https://${objectLabel}`
          : '')
    const domain = url ? extractDomain(url) : ''

    const predicateId = triple.predicate?.term_id || ''
    const predicateLabel = triple.predicate?.label || ''
    const isTag = predicateLabel.toLowerCase() === 'has tag'
    const isContextOf = predicateLabel.toLowerCase() === 'in context of'
    const termId = triple.term_id || ''
    const counterTermId = triple.counter_term_id || ''
    const supportCount = sumVaultPositions(triple.term?.vaults)
    const opposeCount = sumVaultPositions(triple.counter_term?.vaults)
    const userSupported = userHoldsShares(triple.term?.vaults)
    const userOpposed = userHoldsShares(triple.counter_term?.vaults)

    const { address: certifierAddress, label: certifier } = getCertifier(evt)

    // Skip "in context of" nested triples — resolved separately via enrichWithTopicContexts
    if (isContextOf) continue

    // Skip "has tag" events — they used to surface as quest badges in
    // the feed, but those add noise without a URL and pollute the
    // surfaces (Home, Circle) that we now want focused on URL cards.
    if (isTag) continue

    const intention =
      PREDICATE_TO_INTENTION[predicateId] ||
      LABEL_TO_INTENTION[predicateLabel.toLowerCase()] ||
      predicateLabel ||
      ''

    const rawTitle = triple.object?.value?.thing?.name || objectLabel || domain
    const title = cleanLabel(rawTitle)

    const key = `${certifierAddress}-${objectLabel}`
    const existing = groupedMap.get(key)

    if (existing) {
      if (intention && !existing.intentions.includes(intention)) {
        existing.intentions.push(intention)
      }
      if (intention) {
        existing.intentionVaults[intention] = {
          termId,
          counterTermId,
          supportCount,
          opposeCount,
          userSupported,
          userOpposed,
        }
      }
    } else {
      const intentionVaults: CircleItem['intentionVaults'] = {}
      if (intention) {
        intentionVaults[intention] = {
          termId,
          counterTermId,
          supportCount,
          opposeCount,
          userSupported,
          userOpposed,
        }
      }
      groupedMap.set(key, {
        id: evt.id,
        title,
        url,
        domain,
        favicon: domain ? getFaviconUrl(domain) : '',
        certifier,
        certifierAddress,
        intentions: intention ? [intention] : [],
        timestamp: evt.created_at || '',
        intentionVaults,
        topicContexts: [],
      })
    }
  }

  return Array.from(groupedMap.values())
}

/**
 * Enrich CircleItems with topic contexts from "in context of" nested triples.
 * Call after processEvents — does a secondary GraphQL query.
 */
export async function enrichWithTopicContexts(
  items: CircleItem[],
): Promise<void> {
  // Collect all cert triple termIds from intentionVaults
  const termIdToItems = new Map<string, CircleItem[]>()
  for (const item of items) {
    for (const vault of Object.values(item.intentionVaults)) {
      if (!vault.termId) continue
      const existing = termIdToItems.get(vault.termId)
      if (existing) {
        existing.push(item)
      } else {
        termIdToItems.set(vault.termId, [item])
      }
    }
  }

  const contextMap = await fetchContextTriples(Array.from(termIdToItems.keys()))

  for (const [termId, topicSlugs] of contextMap) {
    const linkedItems = termIdToItems.get(termId)
    if (!linkedItems) continue
    for (const item of linkedItems) {
      for (const slug of topicSlugs) {
        if (!item.topicContexts.includes(slug)) {
          item.topicContexts.push(slug)
        }
      }
    }
  }
}
