/**
 * MemberAvatar — circle member avatar with ENS image + coloured initials
 * fallback. Graceful `onError` handler so broken ENS URLs don't leave a
 * blank square; the background always shows through.
 */
import { useState } from 'react'
import type { TrustCircleAccount } from '@/services/trustCircleService'
import { avatarColor } from '@/utils/avatarColor'

interface MemberAvatarProps {
  member: TrustCircleAccount
  /** `.mav` or `.mav ns-mav` etc. — the avatar circle sizing rules. */
  className?: string
}

export default function MemberAvatar({ member, className = 'mav' }: MemberAvatarProps) {
  const [imgOk, setImgOk] = useState(true)
  const bg = avatarColor(member.termId || member.label)
  const hasImage = !!member.image && imgOk
  const initials = member.label.slice(0, 2).toUpperCase()

  return (
    <span
      className={className}
      style={{ background: bg, position: 'relative' }}
      title={member.label}
    >
      {hasImage ? (
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
      )}
    </span>
  )
}
