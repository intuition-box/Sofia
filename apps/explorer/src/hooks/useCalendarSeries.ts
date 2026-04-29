/**
 * useCalendarSeries — per-topic contribution heat-map driven by the user's
 * real on-chain certification feed.
 *
 * Each selected topic gets a CAL_DAYS-long count array sourced from
 * `useUserActivity().items` and bucketed via
 * `buildCalendarSeriesFromActivity`. Pass the linked-wallet addresses so
 * we can union activity across every wallet the user owns.
 */
import { useMemo } from 'react'
import {
  buildCalendarSeriesFromActivity,
  CAL_DAYS,
  type CalendarTopicSeries,
} from '@/lib/activityCalendar'
import { getIntentionColor } from '@/config/intentions'
import { useUserActivity } from '@/hooks/useUserActivity'
import type { OnChainTopic } from '@/services/taxonomyService'

const EMPTY_SERIES: number[] = new Array(CAL_DAYS).fill(0)

export function useCalendarSeries(
  selectedTopics: readonly string[],
  topicById: (id: string) => OnChainTopic | undefined,
  addresses: readonly string[] | undefined,
): CalendarTopicSeries[] {
  const { items } = useUserActivity(
    addresses && addresses.length > 0 ? [...addresses] : undefined,
  )

  return useMemo(
    () =>
      selectedTopics
        .map((id) => {
          const topic = topicById(id)
          if (!topic) return null
          const counts =
            items.length > 0
              ? buildCalendarSeriesFromActivity(items, id)
              : EMPTY_SERIES
          return {
            id,
            label: topic.label,
            color: topic.color ?? getIntentionColor('inspiration'),
            counts,
          }
        })
        .filter((x): x is CalendarTopicSeries => x !== null),
    [selectedTopics, topicById, items],
  )
}
