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
import type { TrustCircleAccount } from '@/services/trustCircleService'
import { avatarColor } from '@/utils/avatarColor'

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
  const [imgOk, setImgOk] = useState(true)
  const bg = avatarColor(member.termId || member.label)
  const hasImage = !!member.image && imgOk
  const initials = member.label.slice(0, 2).toUpperCase()

  const content = hasImage ? (
    <img
      src={member.image!}
      alt=""
      loading="lazy"
      onError={() => setImgOk(false)}
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
    // `stopPropagation` keeps the click from bubbling up to any outer
    // row/card click handler that would otherwise route somewhere else.
    return (
      <a
        href={`/profile/${member.walletAddress}`}
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
      </a>
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
