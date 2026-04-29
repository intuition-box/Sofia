/**
 * useCalendarSeries — per-topic contribution heat-map.
 *
 * Pure deriver over `useUserOnChainProfile`: bucket every UserCert by
 * (day × topic) using `certifiedAt`. A cert with multiple topic slugs
 * counts in each — same "spread" semantics as the radar bucket.
 */
import { useMemo } from 'react'
import {
  CAL_DAYS,
  type CalendarTopicSeries,
} from '@/lib/activityCalendar'
import { getIntentionColor } from '@/config/intentions'
import { useUserOnChainProfile } from '@/hooks/useUserOnChainProfile'
import type { OnChainTopic } from '@/services/taxonomyService'

const EMPTY_SERIES: number[] = new Array(CAL_DAYS).fill(0)

export function useCalendarSeries(
  selectedTopics: readonly string[],
  topicById: (id: string) => OnChainTopic | undefined,
  addresses: readonly string[] | undefined,
): CalendarTopicSeries[] {
  const { profile } = useUserOnChainProfile(addresses)

  // Map<topicSlug, number[]> of CAL_DAYS-length arrays. Built once per
  // certs change and re-used for every selected topic below.
  const countsByTopic = useMemo(() => {
    const out = new Map<string, number[]>()
    if (profile.certs.length === 0) return out

    const todayMidnight = new Date()
    todayMidnight.setHours(0, 0, 0, 0)
    const todayMs = todayMidnight.getTime()
    const dayMs = 86_400_000

    for (const cert of profile.certs) {
      if (cert.topicSlugs.length === 0) continue
      const ts = cert.certifiedAt
      if (!ts) continue
      const itemMs = Date.parse(ts)
      if (Number.isNaN(itemMs)) continue
      const itemDay = new Date(itemMs)
      itemDay.setHours(0, 0, 0, 0)
      const daysAgo = Math.round((todayMs - itemDay.getTime()) / dayMs)
      if (daysAgo < 0 || daysAgo >= CAL_DAYS) continue
      const idx = CAL_DAYS - 1 - daysAgo
      for (const slug of cert.topicSlugs) {
        let counts = out.get(slug)
        if (!counts) {
          counts = new Array<number>(CAL_DAYS).fill(0)
          out.set(slug, counts)
        }
        counts[idx] += 1
      }
    }
    return out
  }, [profile])

  return useMemo(
    () =>
      selectedTopics
        .map((id) => {
          const topic = topicById(id)
          if (!topic) return null
          const counts = countsByTopic.get(id) ?? EMPTY_SERIES
          return {
            id,
            label: topic.label,
            color: topic.color ?? getIntentionColor('inspiration'),
            counts,
          }
        })
        .filter((x): x is CalendarTopicSeries => x !== null),
    [selectedTopics, topicById, countsByTopic],
  )
}
