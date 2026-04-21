/**
 * useTaxonomy — React hook for on-chain taxonomy data.
 * Fetches topics + categories from Intuition knowledge graph.
 * Falls back to static taxonomy.ts during loading.
 */

import { useQuery } from "@tanstack/react-query"
import { fetchTaxonomy, type TaxonomyData, type OnChainTopic, type OnChainCategory } from "@/services/taxonomyService"
import { SOFIA_TOPICS, TOPIC_BY_ID, ALL_CATEGORIES, CATEGORY_BY_ID } from "@/config/taxonomy"
import { TOPIC_ATOM_IDS, CATEGORY_ATOM_IDS } from "@/config/atomIds"
import { TOPIC_META } from "@/config/topicMeta"

// Build static fallback that matches OnChainTopic shape
function buildStaticFallback(): TaxonomyData {
  const topics: OnChainTopic[] = SOFIA_TOPICS.map((t) => ({
    id: t.id,
    termId: TOPIC_ATOM_IDS[t.id] || "",
    label: t.label,
    icon: t.icon,
    color: t.color,
    categories: t.categories.map((c) => ({
      id: c.id,
      termId: CATEGORY_ATOM_IDS[c.id] || c.termId || "",
      label: c.label,
      topicId: t.id,
    })),
  }))

  const topicById: Record<string, OnChainTopic> = {}
  for (const t of topics) topicById[t.id] = t
  const allCategories = topics.flatMap((t) => t.categories)
  const categoryById: Record<string, OnChainCategory> = {}
  for (const c of allCategories) categoryById[c.id] = c

  return { topics, topicById, categoryById, allCategories }
}

const staticFallback = buildStaticFallback()

export function useTaxonomy() {
  const { data, isLoading, error } = useQuery<TaxonomyData>({
    queryKey: ["taxonomy"],
    queryFn: fetchTaxonomy,
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    initialData: staticFallback,
    initialDataUpdatedAt: 0,
  })

  const taxonomy = data || staticFallback

  return {
    topics: taxonomy.topics,
    topicById: (id: string) => taxonomy.topicById[id],
    categoryById: (id: string) => taxonomy.categoryById[id],
    allCategories: taxonomy.allCategories,
    getCategoriesForTopic: (topicId: string) =>
      taxonomy.topicById[topicId]?.categories || [],
    isLoading,
    isOnChain: data !== staticFallback,
    error: error ? String(error) : null,
  }
}
