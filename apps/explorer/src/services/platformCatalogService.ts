/**
 * On-chain Platform Catalog Service
 * Fetches platform atoms + their category relationships from Intuition knowledge graph.
 * Replaces the static platformCatalog.ts data.
 */

import { GRAPHQL_URL } from "@/config"
import {
  PLATFORM_ATOM_IDS,
  CATEGORY_ATOM_IDS,
  HAS_TAG_PREDICATE_ID,
  ATOM_ID_TO_PLATFORM,
  ATOM_ID_TO_CATEGORY,
} from "@/config/atomIds"
import { TOPIC_META } from "@/config/topicMeta"

// ── Types ──

export interface OnChainPlatform {
  id: string // slug (e.g. "github")
  termId: string // on-chain atom term_id
  name: string // atom label
  website?: string
  image?: string
  description?: string
  color: string // derived from first topic color
  categoryIds: string[] // slugs derived from has-tag triples
  topicIds: string[] // derived transitively via category→topic
}

export interface PlatformCatalogData {
  platforms: OnChainPlatform[]
  platformById: Map<string, OnChainPlatform>
  getPlatformsByTopic: (topicId: string) => OnChainPlatform[]
  getPlatformsByCategory: (categoryId: string) => OnChainPlatform[]
}

// ── GraphQL queries ──

const GET_PLATFORM_TRIPLES = `
  query GetPlatformTriples($predicateId: String!, $categoryTermIds: [String!]!) {
    triples(
      where: {
        predicate_id: { _eq: $predicateId }
        object: { term_id: { _in: $categoryTermIds } }
        subject: { term_id: { _nin: $categoryTermIds } }
      }
      limit: 1000
    ) {
      subject {
        term_id
        label
        image
        value {
          thing {
            url
            name
            description
          }
        }
      }
      object {
        term_id
        label
      }
    }
  }
`

// ── Helpers ──

// Category → Topic mapping (built from atomIds + taxonomy knowledge)
// We need to know which topic each category belongs to.
// This is fetched separately by useTaxonomy, so we accept it as param.
export type CategoryToTopicMap = Map<string, string>

function resolveSlug(termId: string): string {
  return ATOM_ID_TO_PLATFORM.get(termId) || termId
}

// ── Main fetch ──

export async function fetchPlatformCatalog(
  categoryToTopic: CategoryToTopicMap,
): Promise<PlatformCatalogData> {
  const categoryTermIds = Object.values(CATEGORY_ATOM_IDS)

  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: GET_PLATFORM_TRIPLES,
      variables: {
        predicateId: HAS_TAG_PREDICATE_ID,
        categoryTermIds,
      },
    }),
  })

  const json = await res.json()
  const triples = json.data?.triples || []

  // Group triples by platform (subject)
  const platformMap = new Map<string, OnChainPlatform>()

  for (const triple of triples) {
    const subject = triple.subject
    const object = triple.object

    const platformSlug = resolveSlug(subject.term_id)
    const categorySlug = ATOM_ID_TO_CATEGORY.get(object.term_id) || ""

    if (!platformSlug || !categorySlug) continue

    let platform = platformMap.get(platformSlug)
    if (!platform) {
      platform = {
        id: platformSlug,
        termId: subject.term_id,
        name: subject.label || subject.value?.thing?.name || platformSlug,
        website: subject.value?.thing?.url,
        image: subject.image,
        description: subject.value?.thing?.description,
        color: '#888',
        categoryIds: [],
        topicIds: [],
      }
      platformMap.set(platformSlug, platform)
    }

    if (!platform.categoryIds.includes(categorySlug)) {
      platform.categoryIds.push(categorySlug)
    }

    // Derive topic from category
    const topicId = categoryToTopic.get(categorySlug)
    if (topicId && !platform.topicIds.includes(topicId)) {
      platform.topicIds.push(topicId)
      // Use first topic color as platform color
      if (platform.color === '#888') {
        platform.color = TOPIC_META[topicId]?.color ?? '#888'
      }
    }
  }

  const platforms = Array.from(platformMap.values())
  const byId = new Map(platforms.map((p) => [p.id, p]))

  // Build topic and category index for fast lookups
  const byTopic = new Map<string, OnChainPlatform[]>()
  const byCategory = new Map<string, OnChainPlatform[]>()

  for (const p of platforms) {
    for (const tid of p.topicIds) {
      if (!byTopic.has(tid)) byTopic.set(tid, [])
      byTopic.get(tid)!.push(p)
    }
    for (const cid of p.categoryIds) {
      if (!byCategory.has(cid)) byCategory.set(cid, [])
      byCategory.get(cid)!.push(p)
    }
  }

  return {
    platforms,
    platformById: byId,
    getPlatformsByTopic: (topicId: string) => byTopic.get(topicId) || [],
    getPlatformsByCategory: (categoryId: string) => byCategory.get(categoryId) || [],
  }
}
