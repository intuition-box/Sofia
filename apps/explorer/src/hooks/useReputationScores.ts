import { useMemo } from 'react'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { computeReputationProfile } from '@/services/reputationScoreService'
import type { ConnectionStatus, UserReputationProfile } from '@/types/reputation'
import type { SignalResult } from '@/types/signals'

export function useReputationScores(
  getStatus: (platformId: string) => ConnectionStatus,
  selectedTopics: string[],
  selectedCategories: string[],
  compositeScore?: number | null,
  signals?: Record<string, SignalResult>,
): UserReputationProfile | null {
  return useMemo(
    () => computeReputationProfile(getStatus, selectedTopics, selectedCategories, compositeScore, signals),
    [getStatus, selectedTopics, selectedCategories, compositeScore, signals],
  )
}

export function useTopicLabel(topicId: string): string {
  const { topicById } = useTaxonomy()
  return topicById(topicId)?.label ?? topicId
}
