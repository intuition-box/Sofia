/**
 * usePlatformCatalog — React hook for on-chain platform catalog.
 * Fetches platforms + their category/topic relationships from Intuition knowledge graph.
 * Falls back to static platformCatalog.ts during loading.
 */

import { useQuery } from "@tanstack/react-query"
import {
  fetchPlatformCatalog,
  type PlatformCatalogData,
  type OnChainPlatform,
  type CategoryToTopicMap,
} from "@/services/platformCatalogService"
import { useTaxonomy } from "@/hooks/useTaxonomy"
import { PLATFORM_CATALOG, getPlatformsByTopic as staticGetByTopic } from "@/config/platformCatalog"
import { PLATFORM_ATOM_IDS } from "@/config/atomIds"

// Build static fallback that matches OnChainPlatform shape
function buildStaticFallback(): PlatformCatalogData {
  const platforms: OnChainPlatform[] = PLATFORM_CATALOG.map((p) => ({
    id: p.id,
    termId: PLATFORM_ATOM_IDS[p.id] || "",
    name: p.name,
    website: p.website,
    image: undefined,
    description: undefined,
    categoryIds: p.targetCategories,
    topicIds: p.targetTopics,
  }))

  const platformById = new Map(platforms.map((p) => [p.id, p]))

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
    platformById,
    getPlatformsByTopic: (topicId: string) => byTopic.get(topicId) || [],
    getPlatformsByCategory: (categoryId: string) => byCategory.get(categoryId) || [],
  }
}

const staticFallback = buildStaticFallback()

export function usePlatformCatalog() {
  const { allCategories, isOnChain: taxonomyReady } = useTaxonomy()

  // Build category→topic map from taxonomy
  const categoryToTopic: CategoryToTopicMap = new Map(
    allCategories.map((c) => [c.id, c.topicId])
  )

  const { data, isLoading, error } = useQuery<PlatformCatalogData>({
    queryKey: ["platformCatalog", taxonomyReady],
    queryFn: () => fetchPlatformCatalog(categoryToTopic),
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    enabled: allCategories.length > 0,
    initialData: staticFallback,
    initialDataUpdatedAt: 0,
  })

  const catalog = data || staticFallback

  return {
    platforms: catalog.platforms,
    platformById: (id: string) => catalog.platformById.get(id),
    getPlatformsByTopic: catalog.getPlatformsByTopic,
    getPlatformsByCategory: catalog.getPlatformsByCategory,
    isLoading,
    isOnChain: data !== staticFallback,
    error: error ? String(error) : null,
  }
}
