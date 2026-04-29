/**
 * useRadarFocus — state + derived data for the split radar on /profile.
 *
 * Owns the single `focus` id shared by the filter pills, the topic rim
 * emojis and the verb rim emojis, and derives:
 *   - `topicAxes`  : one axis per selected topic (top semicircle)
 *   - `verbAxes`   : the 6 RADAR_VERBS (bottom semicircle)
 *   - `displayedSeries` : the polygons to draw. Defaults to one per topic;
 *     when `focus` matches a verb, a single synthesised verb polygon is
 *     returned instead so the chart mirrors the topic-polygon behaviour.
 *
 * Counts come from the real (topic × verb) bucket of `useUserActivity`'s
 * items — no synthetic fallback. Topics with zero certs render as a
 * polygon at the center until the user actually certifies something.
 */
import { useMemo, useState } from 'react'
import {
  RADAR_VERBS,
  bucketProfileByTopicAndVerb,
  type RadarAxis,
  type RadarSeries,
  type SeriesFilter,
} from '@/lib/radar'
import { getTopicEmoji } from '@/config/topicEmoji'
import { getIntentionColor } from '@/config/intentions'
import { useUserOnChainProfile } from '@/hooks/useUserOnChainProfile'
import type { OnChainTopic } from '@/services/taxonomyService'

interface RadarFocusResult {
  focus: SeriesFilter
  setFocus: (v: SeriesFilter) => void
  topicAxes: RadarAxis[]
  verbAxes: RadarAxis[]
  displayedSeries: RadarSeries[]
  pillItems: RadarAxis[]
}

export function useRadarFocus(
  selectedTopics: readonly string[],
  topicById: (id: string) => OnChainTopic | undefined,
  addresses: readonly string[] | undefined,
): RadarFocusResult {
  const [focus, setFocus] = useState<SeriesFilter>('all')

  const { profile } = useUserOnChainProfile(addresses)

  const verbAxes = useMemo<RadarAxis[]>(() => [...RADAR_VERBS], [])

  const topicAxes = useMemo<RadarAxis[]>(
    () =>
      selectedTopics
        .map((id) => {
          const topic = topicById(id)
          if (!topic) return null
          return {
            id,
            label: topic.label,
            emoji: getTopicEmoji(id) || '📌',
            color: topic.color ?? getIntentionColor('inspiration'),
          }
        })
        .filter((x): x is RadarAxis => x !== null),
    [selectedTopics, topicById],
  )

  const buckets = useMemo(
    () => bucketProfileByTopicAndVerb(profile.certs),
    [profile],
  )

  // One polygon per topic — spike on its own topic axis (= total certs in
  // that topic) + per-verb counts. Other topics' axes are omitted so the
  // curve doesn't get pulled back through the centre on irrelevant spokes.
  const topicSeries = useMemo<RadarSeries[]>(
    () =>
      topicAxes.map((s) => {
        const counts: Record<string, number> = {
          [s.id]: buckets.getTopicTotal(s.id),
        }
        for (const v of verbAxes) counts[v.id] = buckets.get(s.id, v.id)
        return { ...s, counts }
      }),
    [topicAxes, verbAxes, buckets],
  )

  const displayedSeries = useMemo<RadarSeries[]>(() => {
    const verbMatch = verbAxes.find((v) => v.id === focus)
    if (!verbMatch) return topicSeries
    // Symmetric to a topic polygon: spike on its own verb axis + counts
    // across the topic axes.
    const counts: Record<string, number> = {
      [verbMatch.id]: buckets.getVerbTotal(verbMatch.id),
    }
    for (const t of topicAxes) counts[t.id] = buckets.get(t.id, verbMatch.id)
    return [{ ...verbMatch, counts }]
  }, [focus, verbAxes, topicAxes, topicSeries, buckets])

  const pillItems = useMemo<RadarAxis[]>(
    () => [...topicAxes, ...verbAxes],
    [topicAxes, verbAxes],
  )

  return { focus, setFocus, topicAxes, verbAxes, displayedSeries, pillItems }
}
