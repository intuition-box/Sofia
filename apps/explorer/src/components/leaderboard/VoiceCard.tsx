/**
 * VoiceCard — one account in the reputation leaderboard, rendered as a profile
 * card (avatar + name + "Top voice · <topic>" + verified socials). No rank
 * number. The bio slot is intentionally left for a later backend. Whole card
 * links to the profile.
 */
import { Link } from 'react-router-dom'
import { Avatar } from '@0xsofia/design-system'
import SocialLinks from '@/components/profile/SocialLinks'
import type { SocialLink } from '@/services/socialsService'

interface VoiceCardProps {
  wallet: string
  display: string
  avatar: string
  /** Label of the account's strongest topic, for the "Top voice · X" line. */
  topicLabel?: string
  /** Reputation score for the active view (overall or the picked topic). */
  score: number
  socials: SocialLink[]
  /** Optional bio — wired to a backend later; omitted when absent. */
  bio?: string
}

export default function VoiceCard({
  wallet,
  display,
  avatar,
  topicLabel,
  score,
  socials,
  bio,
}: VoiceCardProps) {
  return (
    <Link to={`/profile/${wallet}`} className="hm-vcard">
      <div className="hm-vcard-head">
        <Avatar
          label={display}
          imageUrl={avatar}
          size={44}
          square
          className="hm-vcard-avatar"
        />
        <span className="hm-vcard-id">
          <span className="hm-vcard-name">{display}</span>
          <span className="hm-vcard-sub">
            {topicLabel ?? `${wallet.slice(0, 6)}…${wallet.slice(-4)}`}
          </span>
        </span>
        <span className="hm-vcard-score" title="Reputation score">
          {Math.round(score).toLocaleString()}
        </span>
      </div>

      {bio && <p className="hm-vcard-bio">{bio}</p>}

      {socials.length > 0 && (
        <SocialLinks socials={socials} variant="aside" ownerLabel={display} />
      )}
    </Link>
  )
}
