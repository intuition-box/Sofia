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
import { getTopicEmoji, getTopicIcon } from '@/config/topicEmoji'
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
  /** Per-verb total cert counts — fed into ProfileDetailsPanel for the
   *  per-verb score when a verb pill is focused. */
  verbCertCounts: Record<string, number>
  /** Per-verb counts reflecting the current focus:
   *  - `focus === 'all'`     → aggregate verb totals
   *  - `focus === verbId`    → same aggregate (the polygon doesn't
   *                             change shape; only the rim label flips)
   *  - `focus === topicId`   → per-verb counts within that topic
   *  Used by `EditorialRadar` to drive its polygon. */
  intentionValuesForFocus: Record<string, number>
  /** Per-axis values (topics + verbs) reflecting the current focus.
   *  Symmetric across both halves of the radar:
   *  - `focus === 'all'`   → topic totals + verb totals
   *  - `focus === topicId` → that topic spikes; verb axes get the
   *                           per-verb breakdown inside the topic
   *  - `focus === verbId`  → that verb spikes; topic axes get the
   *                           per-topic breakdown of that verb
   *  Keys are axis ids (topic slug or verb id). */
  axisValuesForFocus: Record<string, number>
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
      selectedTopics.flatMap<RadarAxis>((id) => {
        const topic = topicById(id)
        if (!topic) return []
        return [
          {
            id,
            label: topic.label,
            emoji: getTopicEmoji(id) || '📌',
            icon: getTopicIcon(id),
            color: topic.color ?? getIntentionColor('inspiration'),
          },
        ]
      }),
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

  // Symmetric: one polygon per radar verb — spike on its own verb axis
  // (= total certs with that intention) + per-topic counts. Used as the
  // default view in ALL mode so the chart shows how each intention
  // distributes across the user's topics, side-by-side.
  const verbSeries = useMemo<RadarSeries[]>(
    () =>
      verbAxes.map((v) => {
        const counts: Record<string, number> = {
          [v.id]: buckets.getVerbTotal(v.id),
        }
        for (const t of topicAxes) counts[t.id] = buckets.get(t.id, v.id)
        return { ...v, counts }
      }),
    [topicAxes, verbAxes, buckets],
  )

  const displayedSeries = useMemo<RadarSeries[]>(() => {
    if (focus === 'all') return verbSeries
    const verbMatch = verbAxes.find((v) => v.id === focus)
    if (verbMatch) {
      // Single verb polygon — spike on its axis + counts across topics.
      const counts: Record<string, number> = {
        [verbMatch.id]: buckets.getVerbTotal(verbMatch.id),
      }
      for (const t of topicAxes) counts[t.id] = buckets.get(t.id, verbMatch.id)
      return [{ ...verbMatch, counts }]
    }
    // Topic focus — single topic polygon.
    return topicSeries.filter((s) => s.id === focus)
  }, [focus, verbAxes, topicAxes, topicSeries, verbSeries, buckets])

  const pillItems = useMemo<RadarAxis[]>(
    () => [...topicAxes, ...verbAxes],
    [topicAxes, verbAxes],
  )

  const verbCertCounts = useMemo<Record<string, number>>(() => {
    const out: Record<string, number> = {}
    for (const v of verbAxes) out[v.id] = buckets.getVerbTotal(v.id)
    return out
  }, [verbAxes, buckets])

  const intentionValuesForFocus = useMemo<Record<string, number>>(() => {
    // Topic focus: distribute that topic's certs across the 6 verbs.
    const isTopicFocus =
      focus !== 'all' && !verbAxes.some((v) => v.id === focus)
    if (isTopicFocus) {
      const out: Record<string, number> = {}
      for (const v of verbAxes) out[v.id] = buckets.get(focus, v.id)
      return out
    }
    // 'all' or verb focus: aggregate verb totals.
    return verbCertCounts
  }, [focus, verbAxes, buckets, verbCertCounts])

  // Symmetric per-axis values for the editorial radar polygon. Topic
  // and verb clicks both reshape the polygon: topic focus pulls the
  // verb axes to the in-topic breakdown, verb focus pulls the topic
  // axes to the per-topic breakdown of that verb. 'all' falls back
  // to raw totals on each side.
  const axisValuesForFocus = useMemo<Record<string, number>>(() => {
    const out: Record<string, number> = {}
    const isVerbFocus = focus !== 'all' && verbAxes.some((v) => v.id === focus)
    const isTopicFocus =
      focus !== 'all' && !isVerbFocus && topicAxes.some((t) => t.id === focus)

    if (isTopicFocus) {
      for (const t of topicAxes) {
        out[t.id] = t.id === focus ? buckets.getTopicTotal(t.id) : 0
      }
      for (const v of verbAxes) out[v.id] = buckets.get(focus, v.id)
    } else if (isVerbFocus) {
      for (const t of topicAxes) out[t.id] = buckets.get(t.id, focus)
      for (const v of verbAxes) {
        out[v.id] = v.id === focus ? buckets.getVerbTotal(v.id) : 0
      }
    } else {
      for (const t of topicAxes) out[t.id] = buckets.getTopicTotal(t.id)
      for (const v of verbAxes) out[v.id] = buckets.getVerbTotal(v.id)
    }
    return out
  }, [focus, topicAxes, verbAxes, buckets])

  return {
    focus,
    setFocus,
    topicAxes,
    verbAxes,
    displayedSeries,
    pillItems,
    verbCertCounts,
    intentionValuesForFocus,
    axisValuesForFocus,
  }
}
