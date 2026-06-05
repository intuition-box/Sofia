/**
 * MemberSocialLinks — Discord / X / GitHub icon-buttons for a circle
 * member row in the Free-tier members side panel.
 *
 * DATA REALITY: `TrustCircleAccount` exposes NO social handles (only
 * label / image / walletAddress / trustAmount). There is no per-member
 * social record on-chain today, so we DO NOT invent URLs. Instead each
 * icon links to the member's public profile (`/profile/:walletAddress`),
 * where their identity + socials surface — a meaningful, non-fabricated
 * destination. When the member has no resolved wallet the icons render
 * disabled.
 *
 * The X / Discord glyphs are copied from `PublicProfileAside` so the
 * icon language stays consistent across the app; GitHub uses the shared
 * lucide icon already used there.
 *
 * TODO: wire real socials — swap the profile-link fallback for actual
 * Discord / X / GitHub URLs once a per-member social record exists.
 */
import { Link } from 'react-router-dom'
import { Github } from 'lucide-react'
import type { TrustCircleAccount } from '@/services/trustCircleService'

interface MemberSocialLinksProps {
  member: TrustCircleAccount
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  )
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.369A19.79 19.79 0 0 0 15.43 2.85a.075.075 0 0 0-.079.038c-.21.375-.444.864-.608 1.249a18.27 18.27 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127c-.598.349-1.22.645-1.873.892a.076.076 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.056c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028ZM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
    </svg>
  )
}

const SOCIALS = [
  { key: 'discord', label: 'Discord', node: <DiscordIcon /> },
  { key: 'x', label: 'X', node: <XIcon /> },
  {
    key: 'github',
    label: 'GitHub',
    node: <Github className="cf-social-icon" aria-hidden="true" />,
  },
] as const

export default function MemberSocialLinks({ member }: MemberSocialLinksProps) {
  const profileHref = member.walletAddress
    ? `/profile/${member.walletAddress}`
    : null

  return (
    <div className="cf-socials" aria-label={`${member.label} socials`}>
      {SOCIALS.map((s) =>
        profileHref ? (
          <Link
            key={s.key}
            to={profileHref}
            className="cf-social"
            // Placeholder destination until real socials are wired —
            // the member's profile surfaces their actual links.
            title={`${s.label} · view ${member.label}'s profile`}
            aria-label={`${s.label} · ${member.label}`}
            onClick={(e) => e.stopPropagation()}
          >
            {s.node}
          </Link>
        ) : (
          <span
            key={s.key}
            className="cf-social is-disabled"
            aria-label={`${s.label} unavailable`}
            title={`${s.label} unavailable`}
          >
            {s.node}
          </span>
        ),
      )}
    </div>
  )
}
