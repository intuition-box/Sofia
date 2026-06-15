/**
 * PublicProfileAside — right-rail info panel shown ONLY on the public
 * profile (`/profile/:address`). Where the personal profile surfaces the
 * connected user's ProfileDrawer, the public profile has no use for it —
 * so this rail summarises the VIEWED user instead: identity, since-when,
 * on-chain footprint, trust circle size, social buttons and their
 * most-marked topics.
 *
 * Portaled to `document.body` so its `position: fixed` resolves against
 * the viewport (the page root carries a `page-enter` transform, which
 * would otherwise become the containing block and mis-place the rail).
 *
 * Read-only. All copy is English. Social buttons are mocked for now.
 */
import { useMemo } from 'react'
import { createPortal } from 'react-dom'
import type { Address } from 'viem'
import {
  CalendarDays,
  Github,
  Globe,
  Hash,
  Mail,
  ShieldCheck,
  Users,
} from 'lucide-react'
import type { UserCert } from '@/services/userOnChainProfileService'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { useTrustCircle } from '@/hooks/useTrustCircle'
import { useEndorseAttribute } from '@/hooks/useEndorseAttribute'
import { TopicPill } from '@/components/profile/FeedPills'
import ProfileAttributes from '@/components/profile/ProfileAttributes'
import type { TopicChip } from '@/types/profileChips'

interface PublicProfileAsideProps {
  walletAddress?: string
  displayName: string
  ensAvatar: string
  shortAddress: string
  trustScore: number | null | undefined
  certs: readonly UserCert[]
  /** slug → cert count, from `useUserCertCountsByTopic`. */
  certCountsByTopic: ReadonlyMap<string, number>
}

// ── Mocked social links ──────────────────────────────────────────────
// Placeholder buttons until real per-user social records are wired.
function XIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  )
}
function FarcasterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M5 3h14v3h-2v12h2v3h-5v-7a2 2 0 0 0-4 0v7H5v-3h2V6H5V3Z" />
    </svg>
  )
}
function DiscordIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.317 4.369A19.79 19.79 0 0 0 15.43 2.85a.075.075 0 0 0-.079.038c-.21.375-.444.864-.608 1.249a18.27 18.27 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127c-.598.349-1.22.645-1.873.892a.076.076 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.056c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028ZM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
    </svg>
  )
}

const SOCIALS = [
  {
    key: 'github',
    label: 'GitHub',
    node: <Github className="ppa-social-icon" />,
  },
  { key: 'x', label: 'X', node: <XIcon /> },
  { key: 'farcaster', label: 'Farcaster', node: <FarcasterIcon /> },
  {
    key: 'website',
    label: 'Website',
    node: <Globe className="ppa-social-icon" />,
  },
  { key: 'mail', label: 'Email', node: <Mail className="ppa-social-icon" /> },
  { key: 'discord', label: 'Discord', node: <DiscordIcon /> },
]

export default function PublicProfileAside({
  walletAddress,
  displayName,
  ensAvatar,
  shortAddress,
  trustScore,
  certs,
  certCountsByTopic,
}: PublicProfileAsideProps) {
  const { topicById } = useTaxonomy()
  const { endorse } = useEndorseAttribute()
  const { accounts: trustCircle } = useTrustCircle(
    walletAddress ? [walletAddress as Address] : undefined,
  )

  const activeSince = useMemo(() => {
    let min = ''
    for (const c of certs) {
      if (c.certifiedAt && (!min || c.certifiedAt < min)) min = c.certifiedAt
    }
    if (!min) return null
    const d = new Date(min)
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }, [certs])

  const topTopics = useMemo(
    () =>
      [...certCountsByTopic.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([slug]) => {
          const t = topicById(slug)
          if (!t) return null
          return { id: slug, label: t.label.split(' ')[0], color: t.color }
        })
        .filter((x): x is TopicChip => !!x),
    [certCountsByTopic, topicById],
  )

  const initials = (displayName || shortAddress || '?')
    .slice(0, 2)
    .toUpperCase()

  const rail = (
    <aside className="ppa-aside" aria-label="Profile details">
      <div className="ppa-inner">
        <p className="ppa-kicker">Readout · Who</p>

        <div className="ppa-identity">
          <span className="ppa-avatar" aria-hidden="true">
            {ensAvatar ? (
              <img src={ensAvatar} alt="" referrerPolicy="no-referrer" />
            ) : (
              <span className="ppa-avatar-initials">{initials}</span>
            )}
          </span>
          <div className="ppa-identity-text">
            <span className="ppa-name">{displayName || shortAddress}</span>
            {shortAddress && shortAddress !== displayName ? (
              <span className="ppa-addr">{shortAddress}</span>
            ) : null}
          </div>
        </div>

        <div className="ppa-section">
          <p className="ppa-section-title">Socials</p>
          <div className="ppa-socials">
            {SOCIALS.map((s) => (
              <button
                key={s.key}
                type="button"
                className="ppa-social"
                aria-label={s.label}
                title={s.label}
              >
                {s.node}
              </button>
            ))}
          </div>
        </div>

        <dl className="ppa-stats">
          {activeSince ? (
            <div className="ppa-stat">
              <dt>
                <CalendarDays className="ppa-stat-icon" aria-hidden="true" />
                Active since
              </dt>
              <dd>{activeSince}</dd>
            </div>
          ) : null}
          <div className="ppa-stat">
            <dt>
              <Hash className="ppa-stat-icon" aria-hidden="true" />
              Marks on-chain
            </dt>
            <dd>{certs.length}</dd>
          </div>
          {typeof trustScore === 'number' && trustScore > 0 ? (
            <div className="ppa-stat">
              <dt>
                <ShieldCheck className="ppa-stat-icon" aria-hidden="true" />
                Trust score
              </dt>
              <dd>{Math.round(trustScore)}</dd>
            </div>
          ) : null}
          <div className="ppa-stat">
            <dt>
              <Users className="ppa-stat-icon" aria-hidden="true" />
              Trust circle
            </dt>
            <dd>
              {trustCircle.length}{' '}
              <span className="ppa-stat-unit">
                {trustCircle.length === 1 ? 'member' : 'members'}
              </span>
            </dd>
          </div>
        </dl>

        {topTopics.length > 0 ? (
          <div className="ppa-section">
            <p className="ppa-section-title">Most-marked topics</p>
            <div className="ppa-topics">
              {topTopics.map((t) => (
                <TopicPill
                  key={t.id}
                  topicId={t.id}
                  color={t.color}
                  label={t.label}
                />
              ))}
            </div>
          </div>
        ) : null}

        {/* Skills & Tools — on-chain endorsements; votable on a public profile */}
        <div className="ppa-section">
          <p className="ppa-section-title">Skills &amp; Tools</p>
          <ProfileAttributes address={walletAddress} onEndorse={endorse} />
        </div>
      </div>
    </aside>
  )

  return createPortal(rail, document.body)
}
