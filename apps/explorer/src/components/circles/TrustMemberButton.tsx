/**
 * TrustMemberButton — small pill action attached to each row in
 * `AllMembersPanel`. Wraps `useTrustMember` so the button shows the
 * right state at every step: idle / queued / disabled with reason.
 * Click stops propagation so the surrounding row link still navigates
 * to the public profile when clicked elsewhere.
 */
import type { MouseEvent } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useTrustMember } from '@/hooks/useTrustMember'
import type { TrustCircleAccount } from '@/services/trustCircleService'

interface TrustMemberButtonProps {
  member: TrustCircleAccount
}

export default function TrustMemberButton({ member }: TrustMemberButtonProps) {
  const { trust, inCart, disabledReason, disabledHint } = useTrustMember(member)

  const handleClick = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    trust()
  }

  const label = inCart ? 'Queued' : 'Trust'
  const title = disabledHint ?? (inCart ? 'In cart — submit to emit' : 'Trust this member')

  return (
    <button
      type="button"
      className={`crd-trust-btn${inCart ? ' is-queued' : ''}`}
      onClick={handleClick}
      disabled={!!disabledReason}
      aria-label={title}
      title={title}
    >
      <ShieldCheck className="h-3 w-3" aria-hidden="true" />
      <span>{label}</span>
    </button>
  )
}
