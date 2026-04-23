/**
 * useTopPlatformStats — ranked "Top Platforms" items derived from real
 * platform markets. Topic filter is a placeholder until the catalog
 * exposes platform→topic mappings.
 */
import { useMemo } from 'react'
import { ATOM_ID_TO_PLATFORM } from '@/config/atomIds'
import { getIntentionColor } from '@/config/intentions'
import type { TopPlatformStat } from '@/components/profile/TopPlatforms'
import type { PlatformVaultData } from '@/services/platformMarketService'
import type { OnChainTopic } from '@/services/taxonomyService'

interface Input {
  markets: readonly PlatformVaultData[]
  selectedTopics: readonly string[]
  topicById: (id: string) => OnChainTopic | undefined
  focus: string
}

export function useTopPlatformStats({
  markets,
  selectedTopics,
  topicById,
  focus: _focus,
}: Input): TopPlatformStat[] {
  return useMemo(() => {
    const filtered = markets
      .map((m) => {
        const slug = ATOM_ID_TO_PLATFORM.get(m.termId)
        if (!slug) return null
        // Best-effort: first selected topic colours the platform chip until
        // the catalog exposes a proper platform→topic mapping.
        const primaryTopicId = selectedTopics[0] ?? 'tech-dev'
        const topic = topicById(primaryTopicId)
        return {
          id: m.termId,
          name: m.label,
          faviconSrc: `/favicons/${slug}.png`,
          count: m.positionCount,
          color: topic?.color ?? getIntentionColor('work'),
          primaryLabel: topic?.label?.split(' ')[0] ?? 'All',
          delta: m.userPnlPct ?? 0,
        }
      })
      .filter((x): x is TopPlatformStat => x !== null)

    return filtered.sort((a, b) => b.count - a.count).slice(0, 6)
    // TODO: filter by `platform.topicIds.includes(focus)` once the catalog
    // hook exposes that mapping.
  }, [markets, selectedTopics, topicById])
}
