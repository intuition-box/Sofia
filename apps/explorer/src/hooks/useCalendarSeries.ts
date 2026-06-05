/**
 * useCalendarSeries — heat-map series for the profile activity calendar.
 *
 * Default (ALL or topic focus): per-topic series sourced from each cert's
 * `topicSlugs`. Only certs with a topic context contribute — the rest are
 * shown when the pill switches to a specific verb (work / learning / fun /
 * inspiration / buying / music), in which case the calendar collapses to
 * a single series for that verb covering EVERY cert with that intention,
 * topic-context or not.
 */
import { useMemo } from 'react'
import { CAL_DAYS, type CalendarTopicSeries } from '@/lib/activityCalendar'
import {
  INTENTION_CONFIG,
  getIntentionColor,
  predicateLabelToIntentionType,
} from '@/config/intentions'
import { useUserOnChainProfile } from '@/hooks/useUserOnChainProfile'
import type { OnChainTopic } from '@/services/taxonomyService'

const EMPTY_SERIES: number[] = new Array(CAL_DAYS).fill(0)

// Verbs visible in the radar pills.
const RADAR_VERB_IDS = new Set([
  'work',
  'learning',
  'inspiration',
  'fun',
  'buying',
  'music',
])

// Calendar bucket scope — radar verbs + the trust/distrust pair so the
// heat-map captures every certification the user has authored, including
// "Supported X" / "Opposed X" rows that don't show on the radar.
const CALENDAR_VERB_IDS = new Set([...RADAR_VERB_IDS, 'trusted', 'distrusted'])

function dayIndexFor(timestamp: string, todayMs: number): number | null {
  if (!timestamp) return null
  const ms = Date.parse(timestamp)
  if (Number.isNaN(ms)) return null
  const day = new Date(ms)
  day.setHours(0, 0, 0, 0)
  const daysAgo = Math.round((todayMs - day.getTime()) / 86_400_000)
  if (daysAgo < 0 || daysAgo >= CAL_DAYS) return null
  return CAL_DAYS - 1 - daysAgo
}

export function useCalendarSeries(
  selectedTopics: readonly string[],
  topicById: (id: string) => OnChainTopic | undefined,
  addresses: readonly string[] | undefined,
  focus: string = 'all',
): CalendarTopicSeries[] {
  const { profile } = useUserOnChainProfile(addresses)

  // Pre-compute today midnight once — both the topic and verb buckets
  // share the same day index resolver.
  const todayMs = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }, [])

  const countsByTopic = useMemo(() => {
    const out = new Map<string, number[]>()
    // Topic activity is dated by WHEN the context was added (the tagging
    // action), not the cert's original certification date — so URLs
    // categorised today land on today, matching the Last-activity feed.
    for (const ca of profile.contextAdditions) {
      if (!ca.topicSlug) continue
      const idx = dayIndexFor(ca.addedAt, todayMs)
      if (idx === null) continue
      let counts = out.get(ca.topicSlug)
      if (!counts) {
        counts = new Array<number>(CAL_DAYS).fill(0)
        out.set(ca.topicSlug, counts)
      }
      counts[idx] += 1
    }
    return out
  }, [profile, todayMs])

  // Build per-verb buckets up front — they cover EVERY cert with a verb
  // intention (including trusts/distrusts), regardless of topic context,
  // so the verb view captures the user's full activity.
  const countsByVerb = useMemo(() => {
    const out = new Map<string, number[]>()
    for (const cert of profile.certs) {
      const verbId = predicateLabelToIntentionType(cert.intention)
      if (!verbId || !CALENDAR_VERB_IDS.has(verbId)) continue
      const idx = dayIndexFor(cert.certifiedAt, todayMs)
      if (idx === null) continue
      let counts = out.get(verbId)
      if (!counts) {
        counts = new Array<number>(CAL_DAYS).fill(0)
        out.set(verbId, counts)
      }
      counts[idx] += 1
    }
    return out
  }, [profile, todayMs])

  return useMemo(() => {
    // Topic focus — narrow to the focused topic.
    if (focus !== 'all' && selectedTopics.includes(focus)) {
      const topic = topicById(focus)
      if (!topic) return []
      return [
        {
          id: focus,
          label: topic.label,
          color: topic.color ?? getIntentionColor('inspiration'),
          counts: countsByTopic.get(focus) ?? EMPTY_SERIES,
        },
      ]
    }

    // Verb focus — single verb series. Includes trusts/distrusts when
    // the user clicks one of those pills.
    if (CALENDAR_VERB_IDS.has(focus)) {
      const cfg = INTENTION_CONFIG[focus as keyof typeof INTENTION_CONFIG]
      return [
        {
          id: focus,
          label: cfg?.label ?? focus,
          color: cfg?.color ?? getIntentionColor('inspiration'),
          counts: countsByVerb.get(focus) ?? EMPTY_SERIES,
        },
      ]
    }

    // ALL — show BOTH lenses: per-topic series (matching the score donut,
    // so the donut ↔ heatmap cross-highlight keys off the same topic ids)
    // followed by per-verb series. The legend lists topics then verbs.
    const total = (counts: number[]) => counts.reduce((s, n) => s + n, 0)

    const topicSeries: CalendarTopicSeries[] = [...countsByTopic.entries()]
      .map(([slug, counts]) => {
        const topic = topicById(slug)
        return {
          id: slug,
          label: topic?.label ?? slug,
          color: topic?.color ?? getIntentionColor('inspiration'),
          counts,
        }
      })
      .sort((a, b) => total(b.counts) - total(a.counts))

    const verbSeries: CalendarTopicSeries[] = (
      Array.from(CALENDAR_VERB_IDS) as Array<keyof typeof INTENTION_CONFIG>
    )
      .map((verbId): CalendarTopicSeries | null => {
        const cfg = INTENTION_CONFIG[verbId]
        const counts = countsByVerb.get(verbId)
        if (!counts) return null
        return {
          id: verbId,
          label: cfg?.label ?? verbId,
          color: cfg?.color ?? getIntentionColor('inspiration'),
          counts,
        }
      })
      .filter((x): x is CalendarTopicSeries => x !== null)
      .sort((a, b) => total(b.counts) - total(a.counts))

    return [...topicSeries, ...verbSeries]
  }, [focus, selectedTopics, topicById, countsByTopic, countsByVerb])
}
