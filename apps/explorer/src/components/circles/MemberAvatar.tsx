/**
 * MemberAvatar — circle member avatar with ENS image + coloured initials
 * fallback. Graceful `onError` handler so broken ENS URLs don't leave a
 * blank square; the background always shows through.
 *
 * Pass `linkable` to opt the avatar into a route on click. The component
 * renders an `<a>` when the member has a wallet address — otherwise it
 * falls back to the inert `<span>` (clicking a member with no resolved
 * wallet has nowhere meaningful to go).
 *
 * Callers that already sit inside a `<button>` (e.g. TrustCircleCard,
 * GroupCard) MUST leave `linkable` off: an interactive element nested
 * inside a button is invalid HTML and triggers React warnings.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { TrustCircleAccount } from '@/services/trustCircleService'
import { avatarColor } from '@/utils/avatarColor'
import { getAvatarUrl } from '@/services/ensService'

interface MemberAvatarProps {
  member: TrustCircleAccount
  /** `.mav` or `.mav ns-mav` etc. — the avatar circle sizing rules. */
  className?: string
  /** When true and the member has a resolved walletAddress, the avatar
   *  becomes a link to `/profile/:walletAddress`. Defaults to false to
   *  keep current usages (button-nested) HTML-valid. */
  linkable?: boolean
}

export default function MemberAvatar({
  member,
  className = 'mav',
  linkable = false,
}: MemberAvatarProps) {
  const [primaryFailed, setPrimaryFailed] = useState(false)
  const bg = avatarColor(member.termId || member.label)

  // Universal fallback — the same resolver the feed, profile and leaderboard
  // use (ENS-cached image → deterministic DiceBear glass). Group members carry
  // no on-chain `image`, so without this they'd render bare initials while the
  // very same wallet shows a generated avatar elsewhere. The generated value is
  // a local data URI, so it never 404s; initials only remain when there's no
  // wallet to seed from at all.
  const generated = member.walletAddress
    ? getAvatarUrl(member.walletAddress)
    : ''
  const usePrimary = !!member.image && !primaryFailed
  const src = usePrimary ? member.image! : generated
  const hasImage = !!src
  const initials = member.label.slice(0, 2).toUpperCase()

  const content = hasImage ? (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setPrimaryFailed(true)}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: 'inherit',
      }}
    />
  ) : (
    initials
  )

  if (linkable && member.walletAddress) {
    // Client-side route (not a raw <a>, which would hard-reload the whole
    // SPA). `stopPropagation` keeps the click from bubbling up to any outer
    // row/card click handler that would otherwise route somewhere else.
    return (
      <Link
        to={`/profile/${member.walletAddress}`}
        className={className}
        style={{
          background: bg,
          position: 'relative',
          textDecoration: 'none',
          color: 'inherit',
        }}
        title={member.label}
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </Link>
    )
  }

  return (
    <span
      className={className}
      style={{ background: bg, position: 'relative' }}
      title={member.label}
    >
      {content}
    </span>
  )
}
