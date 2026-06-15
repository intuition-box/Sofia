import { useMemo } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useEnsNames } from '../hooks/useEnsNames'
import { useLinkedWallets } from '../hooks/useLinkedWallets'
import { useTaxonomy } from '../hooks/useTaxonomy'
import { useUserOnChainProfile } from '../hooks/useUserOnChainProfile'
import { useGroups } from '@/hooks/useGroups'
import { useUserPositionTermIds } from '@/hooks/useUserPositionTermIds'
import { getFaviconUrl } from '@/utils/favicon'
import { cleanLabel } from '@/utils/formatting'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { VerbPill } from './profile/FeedPills'
import { INTENTION_COLORS } from '@/config/intentions'
import { timeAgo, extractDomain } from '@/utils/formatting'
import type { TopicChip, Verb } from '@/types/profileChips'
import type { Address } from 'viem'
import FeedCardView from '@/components/feed/FeedCardView'
import { useUserPlatformInvests } from '@/hooks/useUserPlatformInvests'
import ProfileAttributes from '@/components/profile/ProfileAttributes'
import '@/components/styles/feed-card.css'
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
  const { invests: platformInvests } = useUserPlatformInvests(linkedAddresses)
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
    type CertEvent = {
      kind: 'cert'
      cert: (typeof profile.certs)[number]
      ts: string
    }
    // A context event can land on a cert the viewer doesn't own. When the
    // owned cert is present (`cert`) we use its richer fields; otherwise we
    // fall back to the page info carried on the addition itself.
    type ContextEvent = {
      kind: 'context'
      cert: (typeof profile.certs)[number] | null
      objectUrl: string
      objectLabel: string
      topicSlug: string
      topicAtomId: string
      ts: string
    }
    type InvestEvent = {
      kind: 'invest'
      platformName: string
      favicon: string
      website: string
      ts: string
    }
    type Event = CertEvent | ContextEvent | InvestEvent
    const events: Event[] = []
    for (const c of profile.certs) {
      if (c.certifiedAt)
        events.push({ kind: 'cert', cert: c, ts: c.certifiedAt })
    }
    for (const ca of profile.contextAdditions) {
      if (!ca.addedAt) continue
      const cert = certByTerm.get(ca.certTermId) ?? null
      // No owned cert AND no carried page info → nothing renderable.
      if (!cert && !ca.objectUrl && !ca.objectLabel) continue
      events.push({
        kind: 'context',
        cert,
        objectUrl: ca.objectUrl,
        objectLabel: ca.objectLabel,
        topicSlug: ca.topicSlug,
        topicAtomId: ca.topicAtomId,
        ts: ca.addedAt,
      })
    }
    for (const inv of platformInvests) {
      events.push({
        kind: 'invest',
        platformName: inv.platformName,
        favicon: inv.favicon,
        website: inv.website,
        ts: inv.createdAt,
      })
    }
    events.sort((a, b) => (b.ts > a.ts ? 1 : -1))
    // Up from 10 → 30 so the drawer surfaces a richer activity tail.
    // The list scrolls inside the drawer's outer `overflow-y: auto`
    // (the inner `max-height` was removed in Phase A) so there's no
    // visual cap on display either — the user just sees more by
    // scrolling.
    return events.slice(0, 30).map((e) => {
      // Platform stake — its own card with a "Stake" pill.
      if (e.kind === 'invest') {
        return {
          id: `invest::${e.platformName}::${e.ts}`,
          title: e.platformName,
          url: e.website,
          domain: '',
          favicon: e.favicon,
          timestamp: e.ts,
          isOppose: false,
          verb: { label: 'Stake', color: '#10B981' } as Verb,
          topic: null as TopicChip | null,
        }
      }

      // Page info comes from the owned cert when we have it, else from the
      // fields carried on a context addition (cert not owned by viewer).
      const objectUrl =
        e.kind === 'context' && !e.cert
          ? e.objectUrl
          : (e.cert?.objectUrl ?? '')
      const objectLabel =
        e.kind === 'context' && !e.cert
          ? e.objectLabel
          : (e.cert?.objectLabel ?? '')
      const url = objectUrl || ''
      const domain = extractDomain(url) || extractDomain(objectLabel) || ''
      const title = cleanLabel(objectLabel || domain || '')
      const linkUrl = url || (objectLabel.startsWith('http') ? objectLabel : '')
      const favicon = domain ? getFaviconUrl(domain) : ''

      if (e.kind === 'context') {
        const topic = e.topicSlug ? topicById(e.topicSlug) : null
        const topicLabel = topic?.label ?? e.topicSlug ?? 'topic'
        const rowKey = e.cert?.termId ?? domain ?? 'cert'
        // Context on someone else's cert = a "like" → show a Like pill.
        // Context on your own cert = a topic tag → show the topic pill.
        const isLike = !e.cert
        return {
          // Include the timestamp: a not-owned like falls back to `domain`
          // for rowKey, so two likes on different certs of the same domain +
          // same topic would otherwise collide on one React key.
          id: `${rowKey}::${e.topicAtomId}::${e.ts}`,
          title,
          url: linkUrl,
          domain,
          favicon,
          timestamp: e.ts,
          isOppose: false,
          verb: isLike
            ? ({ label: 'Like', color: '#ec4899' } as Verb)
            : (null as Verb | null),
          topic:
            !isLike && e.topicSlug
              ? {
                  id: e.topicSlug,
                  label: topicLabel,
                  color: topic?.color ?? '',
                }
              : null,
        }
      }

      // Only reached for `kind: 'cert'`, where `e.cert` is always present.
      const c = e.cert
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
      const verb: Verb = {
        label: verbLabel,
        color: INTENTION_COLORS[verbLabel],
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
        topic: null as TopicChip | null,
      }
    })
  }, [profile, topicById, platformInvests])

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

          {/* Skills & Tools — declare your own (on-chain), others endorse */}
          <div className="pd-section">
            <p className="pd-section-title">Skills &amp; Tools</p>
            <ProfileAttributes address={address || undefined} canDeclare />
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

          {/* Last Activity — xs feed cards with topic/support badge overlay. */}
          {lastActivity.length > 0 && (
            <div className="pd-section">
              <p className="pd-section-title">Last activity</p>
              <div className="pd-la-list">
                {lastActivity.map((a) => {
                  const verbs = a.verb
                    ? [{ label: a.verb.label, color: a.verb.color }]
                    : []
                  const topics = a.topic
                    ? [
                        {
                          id: a.topic.id,
                          label: a.topic.label,
                          color: a.topic.color,
                        },
                      ]
                    : []
                  return (
                    <FeedCardView
                      key={a.id}
                      size="xs"
                      handle=""
                      when={timeAgo(a.timestamp)}
                      title={a.title}
                      url={a.url || undefined}
                      domain={a.domain || undefined}
                      thumbnailSrc={a.favicon || undefined}
                      verbs={verbs}
                      topics={topics}
                      up={-1}
                      down={-1}
                      onOpen={() => {
                        if (a.url)
                          window.open(a.url, '_blank', 'noopener,noreferrer')
                      }}
                    />
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
