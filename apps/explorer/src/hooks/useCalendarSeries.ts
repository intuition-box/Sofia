/**
 * useCalendarSeries — synthetic per-topic calendar series for the profile
 * activity heat-map. Replaced by real user-activity counts once the real
 * source is wired.
 */
import { useMemo } from 'react'
import { buildSyntheticCalendarSeries, type CalendarTopicSeries } from '@/lib/activityCalendar'
import { getIntentionColor } from '@/config/intentions'
import type { OnChainTopic } from '@/services/taxonomyService'

export function useCalendarSeries(
  selectedTopics: readonly string[],
  topicById: (id: string) => OnChainTopic | undefined,
): CalendarTopicSeries[] {
  return useMemo(
    () =>
      selectedTopics
        .map((id) => {
          const topic = topicById(id)
          if (!topic) return null
          return {
            id,
            label: topic.label,
            color: topic.color ?? getIntentionColor('inspiration'),
            counts: buildSyntheticCalendarSeries(id),
          }
        })
        .filter((x): x is CalendarTopicSeries => x !== null),
    [selectedTopics, topicById],
  )
}
