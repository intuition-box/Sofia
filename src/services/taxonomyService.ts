/**
 * On-chain Taxonomy Service
 * Fetches topics and categories from Intuition knowledge graph via GraphQL.
 * Replaces the static taxonomy.ts data with on-chain atoms + "has tag" triples.
 */

import { GRAPHQL_URL } from "@/config"
import {
  TOPIC_ATOM_IDS,
  CATEGORY_ATOM_IDS,
  HAS_TAG_PREDICATE_ID,
  TOPIC_TERM_IDS,
  ATOM_ID_TO_TOPIC,
  ATOM_ID_TO_CATEGORY,
} from "@/config/atomIds"
import { TOPIC_META } from "@/config/topicMeta"

// ── Types ──

export interface OnChainTopic {
  id: string // slug (e.g. "tech-dev")
  termId: string // on-chain atom term_id
  label: string
  description?: string
  image?: string
  icon: string
  color: string
  categories: OnChainCategory[]
}

export interface OnChainCategory {
  id: string // slug (e.g. "web-development")
  termId: string // on-chain atom term_id
  label: string
  description?: string
  image?: string
  topicId: string
}

export interface TaxonomyData {
  topics: OnChainTopic[]
  // Plain Records (not Maps) so this object survives JSON.stringify
  // used by the React Query persister (localStorage).
  topicById: Record<string, OnChainTopic>
  categoryById: Record<string, OnChainCategory>
  allCategories: OnChainCategory[]
}

// ── GraphQL queries ──

const GET_TAXONOMY_TRIPLES = `
  query GetTaxonomyTriples($predicateId: String!, $topicTermIds: [String!]!) {
    triples(
      where: {
        predicate_id: { _eq: $predicateId }
        object: { term_id: { _in: $topicTermIds } }
      }
      limit: 500
    ) {
      term_id
      subject {
        term_id
        label
        image
        value {
          thing {
            url
            description
          }
        }
      }
      object {
        term_id
        label
        image
        value {
          thing {
            url
            description
          }
        }
      }
    }
  }
`

const GET_TOPIC_ATOMS = `
  query GetTopicAtoms($termIds: [String!]!) {
    atoms(where: { term_id: { _in: $termIds } }) {
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
  }
`

// ── Helpers ──

function slugify(label: string): string {
  // Try to match against known slugs first
  for (const [slug, termId] of Object.entries(TOPIC_ATOM_IDS)) {
    if (termId === label) return slug
  }
  for (const [slug, termId] of Object.entries(CATEGORY_ATOM_IDS)) {
    if (termId === label) return slug
  }
  // Fallback: derive slug from label
  return label
    .toLowerCase()
    .replace(/[&/]/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function resolveSlug(termId: string, type: "topic" | "category"): string {
  if (type === "topic") {
    return ATOM_ID_TO_TOPIC.get(termId) || slugify(termId)
  }
  return ATOM_ID_TO_CATEGORY.get(termId) || slugify(termId)
}

// ── Main fetch ──

export async function fetchTaxonomy(): Promise<TaxonomyData> {
  // Fetch topic atoms + category-has tag-topic triples in parallel
  const [topicRes, triplesRes] = await Promise.all([
    fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: GET_TOPIC_ATOMS,
        variables: { termIds: TOPIC_TERM_IDS },
      }),
    }),
    fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: GET_TAXONOMY_TRIPLES,
        variables: {
          predicateId: HAS_TAG_PREDICATE_ID,
          topicTermIds: TOPIC_TERM_IDS,
        },
      }),
    }),
  ])

  const topicJson = await topicRes.json()
  const triplesJson = await triplesRes.json()

  const topicAtoms = topicJson.data?.atoms || []
  const triples = triplesJson.data?.triples || []

  // Build topic map from atoms
  const topicMap = new Map<string, OnChainTopic>()

  for (const atom of topicAtoms) {
    const slug = resolveSlug(atom.term_id, "topic")
    const meta = TOPIC_META[slug] || { icon: "circle", color: "#888" }

    topicMap.set(atom.term_id, {
      id: slug,
      termId: atom.term_id,
      label: atom.label || atom.value?.thing?.name || slug,
      description: atom.value?.thing?.description,
      image: atom.image,
      icon: meta.icon,
      color: meta.color,
      categories: [],
    })
  }

  // Build categories from triples and attach to topics
  const categoryById: Record<string, OnChainCategory> = {}
  const allCategories: OnChainCategory[] = []

  for (const triple of triples) {
    const subject = triple.subject // category atom
    const object = triple.object // topic atom

    const topicSlug = resolveSlug(object.term_id, "topic")
    const catSlug = resolveSlug(subject.term_id, "category")

    const category: OnChainCategory = {
      id: catSlug,
      termId: subject.term_id,
      label: subject.label || catSlug,
      description: subject.value?.thing?.description,
      image: subject.image,
      topicId: topicSlug,
    }

    categoryById[catSlug] = category
    allCategories.push(category)

    // Attach to topic
    const topic = topicMap.get(object.term_id)
    if (topic) {
      topic.categories.push(category)
    }
  }

  const topics = Array.from(topicMap.values())
  const topicById: Record<string, OnChainTopic> = {}
  for (const t of topics) topicById[t.id] = t

  return { topics, topicById, categoryById, allCategories }
}
