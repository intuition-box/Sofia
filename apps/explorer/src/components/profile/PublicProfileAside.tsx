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
import { CalendarDays, Hash, ShieldCheck, Users } from 'lucide-react'
import type { UserCert } from '@/services/userOnChainProfileService'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { useTrustCircle } from '@/hooks/useTrustCircle'
import { useVerifiedSocials } from '@/hooks/useVerifiedSocials'
import { useEndorseAttribute } from '@/hooks/useEndorseAttribute'
import SocialLinks from '@/components/profile/SocialLinks'
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
  const { socials } = useVerifiedSocials(
    walletAddress ? [walletAddress] : undefined,
  )
  const socialLinks = walletAddress
    ? (socials[walletAddress.toLowerCase()] ?? [])
    : []

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

        {socialLinks.length > 0 ? (
          <div className="ppa-section">
            <p className="ppa-section-title">Socials</p>
            <SocialLinks
              variant="aside"
              socials={socialLinks}
              ownerLabel={displayName || shortAddress}
            />
          </div>
        ) : null}

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
