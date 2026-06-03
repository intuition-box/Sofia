import { useMemo } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useEnsNames } from '../hooks/useEnsNames'
import { useLinkedWallets } from '../hooks/useLinkedWallets'
import { useTaxonomy } from '../hooks/useTaxonomy'
import { useUserOnChainProfile } from '../hooks/useUserOnChainProfile'
import { useGroups } from '@/hooks/useGroups'
import { useUserPositionTermIds } from '@/hooks/useUserPositionTermIds'
import { getFaviconUrl } from '@/utils/favicon'
import { getTopicIcon } from '@/config/topicEmoji'
import { cleanLabel } from '@/utils/formatting'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { VerbPill } from './profile/FeedPills'
import { INTENTION_COLORS } from '@/config/intentions'
import { timeAgo, extractDomain } from '@/utils/formatting'
import type { TopicChip, Verb } from '@/types/profileChips'
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

// ── Main component ────────────────────────────────────────────────────

export default function ProfileDrawer({ isOpen }: ProfileDrawerProps) {
  const { authenticated, user } = usePrivy()
  const address = user?.wallet?.address ?? ''
  const { addresses: linkedAddresses } = useLinkedWallets()
  const { getDisplay, getAvatar } = useEnsNames(
    address ? [address as Address] : [],
  )
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
          verb: null as Verb | null,
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
      let verbLabel = 'Certified'
      if (intentionLower === 'trusts') verbLabel = 'Trusted'
      else if (isOppose) verbLabel = 'Distrusted'
      else if (intentionLower.startsWith('visits for ')) {
        const tail = intentionLower.slice('visits for '.length).trim()
        verbLabel = tail.charAt(0).toUpperCase() + tail.slice(1)
      }
      // Color from the DS intention palette (keyed by label); unknown
      // labels (e.g. "Certified") fall through to the neutral pill.
      const verb: Verb = { label: verbLabel, color: INTENTION_COLORS[verbLabel] }
      return {
        id: c.termId,
        title,
        url: linkUrl,
        domain,
        favicon,
        timestamp: e.ts,
        isOppose,
        verb,
        topic: null as TopicChip | null,
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
            </div>
          </div>

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
                        {a.topic ? (
                          // Topic events carry the topic glyph as the corner
                          // badge — black icon on the topic color, sitting
                          // where the support/oppose check would otherwise be.
                          <span
                            className="pd-la-badge pd-la-badge--topic"
                            style={{
                              ['--pill-color' as string]:
                                a.topic.color || 'var(--ds-accent)',
                            }}
                            title={a.topic.label}
                            aria-label={a.topic.label}
                          >
                            <span
                              className="material-symbols-outlined sf-topic-pill-glyph"
                              aria-hidden="true"
                            >
                              {getTopicIcon(a.topic.id)}
                            </span>
                          </span>
                        ) : (
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
                        )}
                      </span>
                      <span className="pd-la-text">
                        <span className="pd-la-title">
                          {a.verb ? (
                            <VerbPill label={a.verb.label} color={a.verb.color} />
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
