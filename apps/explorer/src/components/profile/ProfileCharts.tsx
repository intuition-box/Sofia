/**
 * ProfileCharts — port of proto-explorer `renderProfileCharts`.
 *
 * Layout:
 *   ┌───────────────────────────────────────────────┐
 *   │ pc-main (wide)                                 │
 *   │  ┌─────────────┐   ┌────────────────────────┐ │
 *   │  │ Radar chart │   │ Details panel          │ │
 *   │  │             │   │ + Activity calendar    │ │
 *   │  └─────────────┘   └────────────────────────┘ │
 *   └───────────────────────────────────────────────┘
 *
 * This file stays layout-only; all derivation lives in hooks:
 *   - `useRadarFocus`         → topic/verb axes + displayedSeries + focus
 *   - `useProfileTopicStats`  → stats for the details panel
 *   - `useCalendarSeries`     → per-topic calendar heat-map
 */
import { useMemo } from 'react'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { usePlatformConnections } from '@/hooks/usePlatformConnections'
import { usePlatformCatalog } from '@/hooks/usePlatformCatalog'
import { useRadarFocus } from '@/hooks/useRadarFocus'
import { useProfileTopicStats } from '@/hooks/useProfileTopicStats'
import { useCalendarSeries } from '@/hooks/useCalendarSeries'
import { useUserCertCounts } from '@/hooks/useUserCertCountsByTopic'
import { POINTS_PER_CERT } from '@/services/reputationScoreService'
import type { TopicScore } from '@/types/reputation'
import ActivityCalendar from './ActivityCalendar'
import EditorialRadar, { type EditorialRadarAxis } from './EditorialRadar'
import ProfileDetailsPanel, { type InterestPill } from './ProfileDetailsPanel'
import { RADAR_VERBS } from '@/lib/radar'
import { getTopicIcon, getTopicShortLabel } from '@/config/topicEmoji'
import RadarPills from './radar/RadarPills'
import '../styles/profile-charts.css'

interface ProfileChartsProps {
  walletAddress?: string
  hideplatformPositions?: boolean
  /** Selected topic slugs — drives the calendar legend + radar axes. */
  selectedTopics?: string[]
  /** Selected category ids — used by the details panel stats. */
  selectedCategories?: string[]
  /** Topic reputation scores — fed into the details panel "Topic Score" row. */
  topicScores?: TopicScore[]
  /**
   * Linked-wallet addresses, unioned for the calendar heat-map. Pass
   * `useLinkedWallets().addresses` for the current user, or `[address]`
   * for a public profile.
   */
  addresses?: readonly string[]
  /** Fired when the user wants to pick/edit interests. When omitted the
   *  compact interest rail in the Overview block is hidden (view-as). */
  onAddInterest?: () => void
  /** Fired when the user clicks the × on an interest pill. */
  onRemoveInterest?: (topicId: string) => void
  /** Fired when the user clicks the body of an interest pill. */
  onSelectInterest?: (topicId: string) => void
}

export default function ProfileCharts({
  selectedTopics = [],
  selectedCategories = [],
  topicScores = [],
  addresses,
  onAddInterest,
  onRemoveInterest,
  onSelectInterest,
}: ProfileChartsProps) {
  const { topicById } = useTaxonomy()
  const { getStatus } = usePlatformConnections()
  const { getPlatformsByTopic } = usePlatformCatalog()

  const {
    focus,
    setFocus,
    topicAxes,
    verbAxes,
    pillItems,
    verbCertCounts,
    axisValuesForFocus,
  } = useRadarFocus(selectedTopics, topicById, addresses)

  const topicStats = useProfileTopicStats({
    selectedTopics,
    selectedCategories,
    topicById,
    topicScores,
    getPlatformsByTopic,
    getStatus,
  })

  const calendarSeries = useCalendarSeries(
    selectedTopics,
    topicById,
    addresses,
    focus,
  )
  const certCounts = useUserCertCounts(addresses)

  // Compact interest pills shown in the Overview block. We resolve
  // taxonomy + score here so the panel stays presentational. Shown only
  // when an `onAddInterest` callback is wired (i.e. own-profile mode);
  // view-as keeps the Overview slim.
  const interestPills = useMemo<InterestPill[] | undefined>(() => {
    if (!onAddInterest) return undefined
    const scoreById = new Map(topicScores.map((s) => [s.topicId, s.score]))
    return selectedTopics
      .map((id) => {
        const topic = topicById(id)
        if (!topic) return null
        return {
          id,
          label: topic.label,
          color: topic.color ?? 'var(--ds-muted)',
          score: Math.round(scoreById.get(id) ?? 0),
        }
      })
      .filter((p): p is InterestPill => p !== null)
  }, [onAddInterest, selectedTopics, topicScores, topicById])

  // Build editorial radar axes — user's selected topics (top hemisphere,
  // pill colour = topic colour) followed by the 6 RADAR_VERBS (lower
  // hemisphere, pill colour = intention colour). Both halves share a
  // single max-normalisation so the polygon stays comparable across
  // axes. `axisValuesForFocus` reshapes the cert counts symmetrically:
  // a verb click pulls the topic axes to that verb's per-topic
  // breakdown (and vice-versa for topic clicks).
  const editorialAxes = useMemo<EditorialRadarAxis[]>(() => {
    const counts = axisValuesForFocus
    let max = 0
    for (const id of selectedTopics) {
      const v = counts[id] ?? 0
      if (v > max) max = v
    }
    for (const v of RADAR_VERBS) {
      const c = counts[v.id] ?? 0
      if (c > max) max = c
    }
    const norm = (n: number) => (max > 0 ? n / max : 0)

    const topicAxesEd: EditorialRadarAxis[] = selectedTopics
      .map((id): EditorialRadarAxis | null => {
        const topic = topicById(id)
        if (!topic) return null
        return {
          id,
          label: getTopicShortLabel(id, topic.label),
          color: topic.color ?? '#a78bdb',
          value: norm(counts[id] ?? 0),
          icon: getTopicIcon(id),
        }
      })
      .filter((x): x is EditorialRadarAxis => x !== null)

    const verbAxesEd: EditorialRadarAxis[] = RADAR_VERBS.map((v) => ({
      id: v.id,
      label: v.label.toUpperCase(),
      color: v.color,
      value: norm(counts[v.id] ?? 0),
      icon: v.icon,
    }))

    return [...topicAxesEd, ...verbAxesEd]
  }, [selectedTopics, topicById, axisValuesForFocus])

  // Focused axis's colour — drives the polygon stroke + fill so the
  // radar visually echoes the filter pill that's currently active.
  const focusColor = useMemo<string | undefined>(() => {
    if (focus === 'all') return undefined
    return (
      topicAxes.find((a) => a.id === focus)?.color ??
      verbAxes.find((a) => a.id === focus)?.color
    )
  }, [focus, topicAxes, verbAxes])

  // Resolve the focused axis (topic OR verb) into meta for the
  // details panel — the panel needs label + colour to render the
  // title, whether a topic or an intent is currently focused.
  const focusMeta = useMemo(() => {
    if (focus === 'all') return undefined
    const topic = topicAxes.find((a) => a.id === focus)
    if (topic) {
      return {
        kind: 'topic' as const,
        label: topic.label,
        emoji: topic.emoji,
        color: topic.color,
      }
    }
    const verb = verbAxes.find((a) => a.id === focus)
    if (verb) {
      return {
        kind: 'verb' as const,
        label: verb.label,
        emoji: verb.emoji,
        color: verb.color,
      }
    }
    return undefined
  }, [focus, topicAxes, verbAxes])

  return (
    <section className="pc-section">
      <div className="pc-grid">
        {/* Main: radar + details + calendar (wide) */}
        <div className="pc-card pc-card-wide pc-main">
          <div className="pc-radar-wrap">
            <div className="pc-radar-meta pc-radar-meta--top">
              <span className="pc-radar-meta-left">
                <span className="pc-radar-meta-dot" aria-hidden="true" />
                Plate · Topics × Intentions
              </span>
            </div>
            <RadarPills
              items={pillItems}
              seriesFilter={focus}
              onFocus={setFocus}
            />
            <EditorialRadar
              axes={editorialAxes}
              activeId={focus}
              accentColor={focusColor}
              onAxisClick={(id) => setFocus(focus === id ? 'all' : id)}
            />
            <div className="pc-radar-meta pc-radar-meta--bottom">
              <span>
                n = {selectedTopics.length} topic
                {selectedTopics.length === 1 ? '' : 's'} · {RADAR_VERBS.length}{' '}
                intents
              </span>
              <span>θ · static</span>
            </div>
          </div>
          <div className="pc-main-right">
            <div className="pc-panel-meta pc-panel-meta--top">
              <span className="pc-panel-meta-left">
                <span className="pc-panel-meta-dot" aria-hidden="true" />
                Readout · Overview × Activity
              </span>
            </div>
            <ProfileDetailsPanel
              topics={topicStats}
              topicFilter={focus === 'all' ? 'all' : focus}
              focusMeta={focusMeta}
              onClearFilter={() => setFocus('all')}
              verbCertCounts={verbCertCounts}
              generalCertCount={certCounts.general}
              pointsPerCert={POINTS_PER_CERT}
              interestPills={interestPills}
              onAddInterest={onAddInterest}
              onRemoveInterest={onRemoveInterest}
              onSelectInterest={onSelectInterest}
            />
            <div className="pc-main-cal">
              <ActivityCalendar topicSeries={calendarSeries} />
            </div>
            <div className="pc-panel-meta pc-panel-meta--bottom">
              <span>frame = 26w × 7d</span>
              <span>θ · sync</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
