/**
 * useProfileTopicStats — per-topic stats for the ProfileDetailsPanel.
 *
 * Pulls everything the panel needs out of the taxonomy + connections +
 * score data: categories matched, connected platforms, topic score.
 * Signals / pnl stay at 0 until the real activity series is wired.
 */
import { useMemo } from 'react'
import { getTopicEmoji } from '@/config/topicEmoji'
import { getIntentionColor } from '@/config/intentions'
import type { ProfileTopicStats } from '@/components/profile/ProfileDetailsPanel'
import type { TopicScore } from '@/types/reputation'
import type { OnChainTopic } from '@/services/taxonomyService'
import type { OnChainPlatform } from '@/services/platformCatalogService'
import type { ConnectionStatus } from '@/types/reputation'

interface Input {
  selectedTopics: readonly string[]
  selectedCategories: readonly string[]
  topicById: (id: string) => OnChainTopic | undefined
  topicScores: readonly TopicScore[]
  getPlatformsByTopic: (topicId: string) => OnChainPlatform[]
  getStatus: (platformId: string) => ConnectionStatus
}

export function useProfileTopicStats({
  selectedTopics,
  selectedCategories,
  topicById,
  topicScores,
  getPlatformsByTopic,
  getStatus,
}: Input): ProfileTopicStats[] {
  return useMemo(() => {
    const scoreMap = new Map(topicScores.map((s) => [s.topicId, s]))
    return selectedTopics
      .map((id) => {
        const topic = topicById(id)
        if (!topic) return null
        const categoriesCount = topic.categories.filter((c) =>
          selectedCategories.includes(c.id),
        ).length
        const platforms = getPlatformsByTopic(id) ?? []
        const platformsCount = platforms.filter((p) => getStatus(p.id) === 'connected').length
        const score = scoreMap.get(id)
        return {
          id,
          label: topic.label,
          emoji: getTopicEmoji(id) || '📌',
          color: topic.color ?? getIntentionColor('inspiration'),
          categoriesCount,
          platformsCount,
          signals: 0,
          pnl: 0,
          score: Math.round(score?.score ?? categoriesCount * 5 + platformsCount * 10),
        }
      })
      .filter((x): x is ProfileTopicStats => x !== null)
  }, [
    selectedTopics,
    selectedCategories,
    topicById,
    topicScores,
    getPlatformsByTopic,
    getStatus,
  ])
}
