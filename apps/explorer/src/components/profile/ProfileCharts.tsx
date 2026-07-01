/**
 * ProfileCharts — the "Score & Activity" panel (Claude Design handoff).
 *
 * Layout: one wide card, two columns —
 *   ┌──────────────────────────────────────────────┐
 *   │ pc-main (wide)                                │
 *   │  ┌────────────┐   ┌─────────────────────────┐ │
 *   │  │ Score      │   │ Activity heatmap        │ │
 *   │  │ donut      │   │ (topics + verbs)        │ │
 *   │  └────────────┘   └─────────────────────────┘ │
 *   └──────────────────────────────────────────────┘
 *
 * Layout-only; derivation lives in hooks:
 *   - `useRadarFocus`     → `focus` (kept 'all'; feeds the calendar resolver)
 *   - `useCalendarSeries` → per-topic + per-verb heat-map series
 * A lifted `hoverTopic` cross-highlights the donut, its centre, and the
 * heatmap off one topic id.
 */
import { useMemo, useState } from 'react'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { useRadarFocus } from '@/hooks/useRadarFocus'
import { useCalendarSeries } from '@/hooks/useCalendarSeries'
import { useUserCertCounts } from '@/hooks/useUserCertCountsByTopic'
import { POINTS_PER_CERT } from '@/services/reputationScoreService'
import { INTENTION_CONFIG } from '@/config/intentions'
import type { TopicScore } from '@/types/reputation'
import ActivityCalendar from './ActivityCalendar'
import TopicScorePie, { type TopicPieSlice } from './TopicScorePie'
import '../styles/profile-charts.css'

interface ProfileChartsProps {
  /** Selected topic slugs — feed the calendar series resolver. */
  selectedTopics?: string[]
  /** Topic reputation scores — sized into the score-donut slices. */
  topicScores?: TopicScore[]
  /**
   * Linked-wallet addresses, unioned for the calendar heat-map. Pass
   * `useLinkedWallets().addresses` for the current user, or `[address]`
   * for a public profile.
   */
  addresses?: readonly string[]
  /** When provided, hovering the donut centre reveals a "View details"
   *  button (personal profile → /scores). Omitted on the public profile,
   *  which is read-only and has no scores page for the viewed wallet. */
  onViewScores?: () => void
  /** True while the trust boost is still loading — pulses the donut centre. */
  refining?: boolean
  /** Personal profile only: drill into a topic's page when its donut slice is
   *  clicked. Omitted on the public profile (the interest page is the
   *  connected user's, not the viewed wallet's). */
  onSelectTopic?: (id: string) => void
}

export default function ProfileCharts({
  selectedTopics = [],
  topicScores = [],
  addresses,
  onViewScores,
  refining = false,
  onSelectTopic,
}: ProfileChartsProps) {
  const { topicById } = useTaxonomy()

  // Radar removed — the score donut replaces it. We still read `focus`
  // (stays 'all' with no pills) so the calendar series resolver behaves.
  const { focus } = useRadarFocus(selectedTopics, topicById, addresses)

  const calendarSeries = useCalendarSeries(
    selectedTopics,
    topicById,
    addresses,
    focus,
  )
  const certCounts = useUserCertCounts(addresses)

  // Donut slices — the topics the user actually scored in, strongest first.
  // Reputation comes from a cert's topic context (within a verb); certs
  // with NO context aren't attributed to any topic, so they're surfaced as
  // a single "General" slice — same rule the sidepanel donut used, so the
  // donut total matches the All-Topics score.
  const pieSlices = useMemo<TopicPieSlice[]>(() => {
    const out: TopicPieSlice[] = [...topicScores]
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((s) => {
        const topic = topicById(s.topicId)
        return {
          id: s.topicId,
          label: topic?.label ?? s.topicId,
          emoji: '',
          color: topic?.color ?? 'var(--ds-muted)',
          score: Math.round(s.score),
        }
      })
    // Trust / distrust are full circle slices in their own right — they
    // can't carry a topic context, so they live beside the topics rather
    // than rotting in the "No context" bucket.
    const trustedScore = certCounts.trusted * POINTS_PER_CERT
    if (trustedScore > 0) {
      out.push({
        id: 'trusted',
        label: INTENTION_CONFIG.trusted.label,
        emoji: '',
        color: INTENTION_CONFIG.trusted.color,
        score: Math.round(trustedScore),
      })
    }
    const distrustedScore = certCounts.distrusted * POINTS_PER_CERT
    if (distrustedScore > 0) {
      out.push({
        id: 'distrusted',
        label: INTENTION_CONFIG.distrusted.label,
        emoji: '',
        color: INTENTION_CONFIG.distrusted.color,
        score: Math.round(distrustedScore),
      })
    }
    // "No context" now only holds taggable certs not yet tagged, so it
    // actually drains as the user adds context in the Context Manager.
    const generalScore = certCounts.general * POINTS_PER_CERT
    if (generalScore > 0) {
      out.push({
        id: 'general',
        label: 'No context',
        emoji: '✨',
        color: 'var(--ds-muted)',
        score: Math.round(generalScore),
      })
    }
    return out
  }, [
    topicScores,
    topicById,
    certCounts.general,
    certCounts.trusted,
    certCounts.distrusted,
  ])

  // Shared cross-highlight topic id — the donut, the heatmap and the legend
  // all read/write it so hovering one highlights that topic everywhere.
  const [hoverTopic, setHoverTopic] = useState<string | null>(null)

  return (
    <section className="pc-section">
      <div className="pc-grid">
        {/* Main: radar + details + calendar (wide) */}
        <div className="pc-card pc-card-wide pc-main">
          <div className="pc-radar-wrap">
            <div className="pc-radar-meta pc-radar-meta--top">
              <span className="pc-radar-meta-left">
                <span className="pc-radar-meta-dot" aria-hidden="true" />
                Score · Topics
              </span>
            </div>
            <div className="pc-score-donut">
              {/* The donut is ALWAYS rendered — with no certs it falls back to
                  a neutral "0" placeholder ring (handled inside TopicScorePie)
                  instead of a text CTA, so the score visual is always the
                  primary element. */}
              <TopicScorePie
                slices={pieSlices}
                focus={hoverTopic}
                setFocus={setHoverTopic}
                onViewDetails={onViewScores}
                refining={refining}
                onSelectTopic={
                  onSelectTopic
                    ? (id) => {
                        // Only real topics have an interest page — skip the
                        // synthetic general / trusted / distrusted slices.
                        if (topicById(id)) onSelectTopic(id)
                      }
                    : undefined
                }
              />
            </div>
          </div>
          <div className="pc-main-right">
            <div className="pc-panel-meta pc-panel-meta--top">
              <span className="pc-panel-meta-left">
                <span className="pc-panel-meta-dot" aria-hidden="true" />
                Overview × Activity
              </span>
            </div>
            <div className="pc-main-cal">
              <ActivityCalendar
                topicSeries={calendarSeries}
                focus={hoverTopic}
                setFocus={setHoverTopic}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
