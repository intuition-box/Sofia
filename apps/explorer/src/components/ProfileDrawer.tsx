import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth'
import { useEnsNames } from '../hooks/useEnsNames'
import { useLinkedWallets } from '../hooks/useLinkedWallets'
import { useTopicSelection } from '../hooks/useDomainSelection'
import { usePlatformConnections } from '../hooks/usePlatformConnections'
import { useReputationScores } from '../hooks/useReputationScores'
import {
  useUserCertCountsByTopic,
  useUserCertCounts,
} from '../hooks/useUserCertCountsByTopic'
import { POINTS_PER_CERT } from '../services/reputationScoreService'
import { useSignals } from '../hooks/useSignals'
import { useTrustScore } from '../hooks/useTrustScore'
import { useTaxonomy } from '../hooks/useTaxonomy'
import { useUserOnChainProfile } from '../hooks/useUserOnChainProfile'
import { useGroups } from '@/hooks/useGroups'
import { useUserPositionTermIds } from '@/hooks/useUserPositionTermIds'
import { getFaviconUrl } from '@/utils/favicon'
import { cleanLabel } from '@/utils/formatting'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import TopicBadge from './profile/TopicBadge'
import { getTopicEmoji } from '@/config/topicEmoji'
import { getIntentionColor } from '@/config/intentions'
import { timeAgo, extractDomain } from '@/utils/formatting'
import type { Address } from 'viem'
import './styles/profile-drawer.css'

interface ProfileDrawerProps {
  isOpen: boolean
  onClose: () => void
}

function formatStatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

// ── Pie chart helper ───────────────────────────────────────────────────
// Proto renderTopicPie ported to React (profileDrawer.ts:57-86).

interface TopicPieSlice {
  id: string
  label: string
  emoji: string
  color: string
  score: number
}

function TopicScorePie({ slices }: { slices: TopicPieSlice[] }) {
  const realTotal = slices.reduce((a, s) => a + s.score, 0)
  // When no topic has scored yet, fall back to equal slices so the ring
  // still teases the colour breakdown of the user's picked topics.
  const equalFallback = realTotal === 0 && slices.length > 0
  const denom = equalFallback ? slices.length : realTotal
  const r = 50
  const C = 2 * Math.PI * r
  let cursor = 0

  return (
    <div className="pd-ts-pie-wrap">
      <svg className="pd-ts-pie" viewBox="0 0 120 120" aria-hidden="true">
        {slices.map((t) => {
          const value = equalFallback ? 1 : t.score
          const pct = denom > 0 ? value / denom : 0
          const sliceLen = pct * C
          const rest = C - sliceLen
          const startDeg = -90 + (denom > 0 ? (cursor / denom) * 360 : 0)
          cursor += value
          return (
            <circle
              key={t.id}
              cx={60}
              cy={60}
              r={r}
              fill="none"
              stroke={t.color}
              strokeWidth={14}
              strokeDasharray={`${sliceLen.toFixed(2)} ${rest.toFixed(2)}`}
              strokeOpacity={equalFallback ? 0.35 : 1}
              transform={`rotate(${startDeg.toFixed(2)} 60 60)`}
            />
          )
        })}
        <circle cx={60} cy={60} r={36} fill="var(--ds-card)" />
      </svg>
      <div className="pd-ts-pie-center">
        <span className="pd-ts-pie-value">{Math.round(realTotal)}</span>
        <span className="pd-ts-pie-label">
          {equalFallback ? 'build it up' : 'total'}
        </span>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────

export default function ProfileDrawer({ isOpen }: ProfileDrawerProps) {
  const navigate = useNavigate()
  const { authenticated, user } = usePrivy()
  const address = user?.wallet?.address ?? ''
  const { addresses: linkedAddresses } = useLinkedWallets()
  const { getDisplay, getAvatar } = useEnsNames(
    address ? [address as Address] : [],
  )
  const { selectedTopics, selectedCategories } = useTopicSelection()
  const { getStatus } = usePlatformConnections()
  const { score: trustScore } = useTrustScore(address || undefined)
  const { signals } = useSignals(address || undefined)
  const certCountsByTopic = useUserCertCountsByTopic(linkedAddresses)
  const certCounts = useUserCertCounts(linkedAddresses)
  const scores = useReputationScores(
    getStatus,
    selectedTopics,
    selectedCategories,
    trustScore,
    signals,
    certCountsByTopic,
  )
  const topicScores = scores?.topics ?? []
  const { topicById } = useTaxonomy()
  // Activity comes from the master on-chain profile (alltime, paginated,
  // shared across the page via React Query dedupe). Every cert kind
  // surfaces here — visits_for_* + trusts + distrust — sorted by recency
  // so the panel reads as a true activity feed and not just a trust log.
  const { profile } = useUserOnChainProfile(linkedAddresses)
  // Circle impact stats — Trust Circle is implicit (+1) and we add every
  // on-chain group the user is the subject of an `is_member_of` claim in.
  const { groups } = useGroups()
  const positions = useUserPositionTermIds(linkedAddresses)
  const circlesCount = useMemo(() => {
    if (linkedAddresses.length === 0) return 1
    const userWallets = new Set(linkedAddresses.map((a) => a.toLowerCase()))
    const joined = groups.filter((g) =>
      g.memberships.some((m) => {
        const w = m.member.walletAddress?.toLowerCase()
        return w !== undefined && userWallets.has(w)
      }),
    )
    return 1 + joined.length
  }, [groups, linkedAddresses])
  // Merge cert events (initial certification with a verb) and context
  // additions (later "in context of <topic>" stakes) into one feed so
  // tagging activity isn't invisible just because the underlying cert
  // is old. Each kind keeps its own timestamp.
  const lastActivity = useMemo(() => {
    const certByTerm = new Map(profile.certs.map((c) => [c.termId, c]))
    type Event =
      | { kind: 'cert'; cert: (typeof profile.certs)[number]; ts: string }
      | {
          kind: 'context'
          cert: (typeof profile.certs)[number]
          topicSlug: string
          topicAtomId: string
          ts: string
        }
    const events: Event[] = []
    for (const c of profile.certs) {
      if (c.certifiedAt)
        events.push({ kind: 'cert', cert: c, ts: c.certifiedAt })
    }
    for (const ca of profile.contextAdditions) {
      const cert = certByTerm.get(ca.certTermId)
      if (!cert || !ca.addedAt) continue
      events.push({
        kind: 'context',
        cert,
        topicSlug: ca.topicSlug,
        topicAtomId: ca.topicAtomId,
        ts: ca.addedAt,
      })
    }
    events.sort((a, b) => (b.ts > a.ts ? 1 : -1))
    // Up from 10 → 30 so the drawer surfaces a richer activity tail.
    // The list scrolls inside the drawer's outer `overflow-y: auto`
    // (the inner `max-height` was removed in Phase A) so there's no
    // visual cap on display either — the user just sees more by
    // scrolling.
    return events.slice(0, 30).map((e) => {
      const c = e.cert
      const url = c.objectUrl || ''
      const domain = extractDomain(url) || extractDomain(c.objectLabel) || ''
      const title = cleanLabel(c.objectLabel || domain || '')
      const linkUrl =
        url || (c.objectLabel.startsWith('http') ? c.objectLabel : '')
      const favicon = domain ? getFaviconUrl(domain) : ''

      if (e.kind === 'context') {
        const topic = e.topicSlug ? topicById(e.topicSlug) : null
        const topicLabel = topic?.label ?? e.topicSlug ?? 'topic'
        return {
          id: `${c.termId}::${e.topicAtomId}`,
          title,
          url: linkUrl,
          domain,
          favicon,
          timestamp: e.ts,
          isOppose: false,
          // Surface the topic as a structured payload so the row can
          // render a coloured <TopicBadge> inline instead of dropping
          // a raw emoji into the action-label string.
          // Tagging activity carries no intention verb — just the topic
          // chip (same chip as the Echoes cards).
          verb: null as { label: string; cssClass: string } | null,
          topic: e.topicSlug
            ? { id: e.topicSlug, label: topicLabel, color: topic?.color ?? '' }
            : null,
        }
      }

      const intentionLower = (c.intention ?? '').trim().toLowerCase()
      const isOppose = intentionLower === 'distrust'
      // Verb chip per intention — same colored-pill language as the
      // Echoes cards. `cssClass` maps to the intent palette; an empty
      // class falls back to the neutral accent for unknown predicates.
      let verb: { label: string; cssClass: string } | null = {
        label: 'Certified',
        cssClass: '',
      }
      if (intentionLower === 'trusts')
        verb = { label: 'Trusted', cssClass: 'trusted' }
      else if (isOppose) verb = { label: 'Distrusted', cssClass: 'distrusted' }
      else if (intentionLower.startsWith('visits for ')) {
        const tail = intentionLower.slice('visits for '.length).trim()
        verb = {
          label: tail.charAt(0).toUpperCase() + tail.slice(1),
          cssClass: tail,
        }
      }
      return {
        id: c.termId,
        title,
        url: linkUrl,
        domain,
        favicon,
        timestamp: e.ts,
        isOppose,
        verb,
        topic: null as { id: string; label: string; color: string } | null,
      }
    })
  }, [profile, topicById])

  if (!authenticated) return null

  const displayName = address ? getDisplay(address as Address) : ''
  const avatar = address ? getAvatar(address as Address) : ''
  const shortAddr = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : ''
  const initials = (displayName || address).slice(0, 2).toUpperCase()

  const pieSlices: TopicPieSlice[] = selectedTopics
    .map((id) => {
      const topic = topicById(id)
      if (!topic) return null
      const scoreEntry = topicScores.find((s) => s.topicId === id)
      return {
        id,
        label: topic.label,
        emoji: getTopicEmoji(id) || '📌',
        color: topic.color ?? getIntentionColor('inspiration'),
        score: Math.round(scoreEntry?.score ?? 0),
      }
    })
    .filter((x): x is TopicPieSlice => x !== null)
  // "General" sector for certs the user owns without an `in context of`
  // nested triple. Counts toward the donut total so power users with
  // mostly-untagged certs aren't stuck at zero.
  const generalScore = certCounts.general * POINTS_PER_CERT
  if (generalScore > 0) {
    pieSlices.push({
      id: 'general',
      label: 'General',
      emoji: '✨',
      color: 'var(--ds-muted, #888)',
      score: generalScore,
    })
  }

  // Percentile derived from `trustScore` (0–100, where 100 = most trusted).
  // We only show a percentile when the user actually has a non-zero score —
  // a 0 here means "no eigentrust paths yet", which would otherwise render
  // as the misleading "Top 100%".
  const percentileLabel =
    trustScore != null && trustScore > 0
      ? `Top ${Math.max(1, Math.round(100 - trustScore))}% · View details`
      : 'View details'

  return (
    <>
      <aside className={`pd-aside ${isOpen ? 'pd-open' : ''}`}>
        <div className="flex flex-col">
          {/* Banner — avatar + name + share + journey CTA */}
          <div className="pd-banner">
            <Avatar className="pd-avatar border-2 border-border shadow-lg">
              {avatar && <AvatarImage src={avatar} alt={displayName} />}
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="pd-name-wrap">
              <p className="pd-name">{displayName}</p>
              <p className="pd-address">{shortAddr}</p>
            </div>
          </div>

          {/* Circle impact — sits right under the banner so identity +
              footprint read together before any of the analytic
              surfaces (score donut, last activity). */}
          <div className="pd-section">
            <p className="pd-section-title">Circle impact</p>
            <div
              className="pd-impact-row"
              role="group"
              aria-label="My impact in circles"
            >
              <div className="pd-impact-cell">
                <span className="pd-impact-num">{circlesCount}</span>
                <span className="pd-impact-label">Circles</span>
              </div>
              <div className="pd-impact-cell">
                <span className="pd-impact-num">
                  {formatStatCount(profile.certs.length)}
                </span>
                <span className="pd-impact-label">Posts</span>
              </div>
              <div className="pd-impact-cell">
                <span className="pd-impact-num">
                  {formatStatCount(positions.size)}
                </span>
                <span className="pd-impact-label">Votes</span>
              </div>
              <div
                className="pd-impact-cell pd-impact-cell--coming"
                title="Gold sponsored — lands with the Boost feature"
              >
                <span className="pd-impact-num">—</span>
                <span className="pd-impact-label">Gold</span>
                <span className="pd-impact-soon">soon</span>
              </div>
            </div>
          </div>

          {/* Topic Score pie chart */}
          <div className="pd-topic-score">
            <span className="pd-section-title">Score</span>
            {pieSlices.length > 0 ? (
              <>
                <TopicScorePie slices={pieSlices} />
                <div className="pd-ts-legend">
                  {pieSlices.map((t) => {
                    const inner = (
                      <>
                        <TopicBadge
                          topicId={t.id}
                          color={t.color}
                          size={18}
                          title={t.label}
                        />
                        <span className="pd-ts-legend-label">{t.label}</span>
                        <span className="pd-ts-legend-val">{t.score}</span>
                      </>
                    )
                    // The "general" slice is the only one with an
                    // actionable next step — open the Context Manager
                    // so the user can tag the URLs that landed in it.
                    if (t.id === 'general') {
                      return (
                        <button
                          key={t.id}
                          type="button"
                          className="pd-ts-legend-item pd-ts-legend-item--link"
                          style={{ ['--slice-color' as string]: t.color }}
                          onClick={() => navigate('/profile/context-manager')}
                          title="Add topic context to these certs"
                        >
                          {inner}
                        </button>
                      )
                    }
                    return (
                      <span
                        key={t.id}
                        className="pd-ts-legend-item"
                        style={{ ['--slice-color' as string]: t.color }}
                      >
                        {inner}
                      </span>
                    )
                  })}
                </div>
              </>
            ) : (
              <p className="pd-ts-empty">
                Pick topics to see your score breakdown.
              </p>
            )}
          </div>

          <button
            type="button"
            className="pd-ts-view-btn"
            onClick={() => navigate('/scores')}
          >
            <span>{percentileLabel}</span>
            <span className="pd-ts-view-arrow">→</span>
          </button>

          {/* Last Activity — support/oppose only for now. */}
          {lastActivity.length > 0 && (
            <div className="pd-section">
              <p className="pd-section-title">Last activity</p>
              <div className="pd-la-list">
                {lastActivity.map((a) => {
                  const isOppose = a.isOppose
                  const root = a.domain
                  return (
                    <a
                      key={a.id}
                      className="pd-la-row"
                      href={a.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="pd-la-anchor">
                        <span
                          className="favicon"
                          style={{ ['--fav-size' as string]: '32px' }}
                        >
                          {a.favicon ? (
                            <img
                              src={a.favicon}
                              alt=""
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).style.display =
                                  'none'
                              }}
                            />
                          ) : null}
                        </span>
                        <span
                          className={`pd-la-badge ${isOppose ? 'oppose' : 'support'}`}
                          aria-hidden="true"
                        >
                          {isOppose ? (
                            <svg
                              viewBox="0 0 24 24"
                              width="9"
                              height="9"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M18 6 6 18" />
                              <path d="M6 6l12 12" />
                            </svg>
                          ) : (
                            <svg
                              viewBox="0 0 24 24"
                              width="9"
                              height="9"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                      </span>
                      <span className="pd-la-text">
                        <span className="pd-la-title">
                          {a.verb ? (
                            <span
                              className={`pd-la-verb ${a.verb.cssClass}`.trim()}
                            >
                              {a.verb.label}
                            </span>
                          ) : null}
                          {a.topic ? (
                            <span className="pd-la-topic">
                              <TopicBadge
                                topicId={a.topic.id}
                                color={a.topic.color || 'var(--ds-muted)'}
                                size={13}
                                title={a.topic.label}
                              />
                              <span className="pd-la-topic-label">
                                {a.topic.label}
                              </span>
                            </span>
                          ) : null}
                          <strong>{a.title}</strong>
                        </span>
                        <span className="pd-la-sub">
                          {root}
                          {root ? ' · ' : ''}
                          {timeAgo(a.timestamp)}
                        </span>
                      </span>
                    </a>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
