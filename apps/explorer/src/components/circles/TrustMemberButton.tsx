/**
 * TrustMemberButton — small pill action attached to each row in
 * `AllMembersPanel`. Wraps `useTrustMember` so the button shows the
 * right state at every step: idle / queued / disabled with reason.
 * Click stops propagation so the surrounding row link still navigates
 * to the public profile when clicked elsewhere.
 */
import type { MouseEvent } from 'react'
import { ShieldCheck, Check } from 'lucide-react'
import { useTrustMember } from '@/hooks/useTrustMember'
import type { TrustCircleAccount } from '@/services/trustCircleService'

interface TrustMemberButtonProps {
  member: TrustCircleAccount
}

export default function TrustMemberButton({ member }: TrustMemberButtonProps) {
  const {
    trust,
    inCart,
    alreadyTrusted,
    isSelf,
    disabledReason,
    disabledHint,
  } = useTrustMember(member)

  // The row is one of the viewer's own linked wallets — trusting
  // yourself doesn't make sense. Hide the button entirely.
  if (isSelf) return null

  const handleClick = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    trust()
  }

  // Trusted on-chain — solid green badge, no interaction. Read-only
  // confirmation that the user already emitted the triple in the past.
  if (alreadyTrusted) {
    return (
      <button
        type="button"
        className="crd-trust-btn is-trusted"
        disabled
        aria-label="You trust this member"
        title="You trust this member on-chain"
      >
        <Check className="h-3 w-3" aria-hidden="true" />
        <span>Trusted</span>
      </button>
    )
  }

  const label = inCart ? 'Queued' : 'Trust'
  const title =
    disabledHint ??
    (inCart ? 'In cart — submit to emit' : 'Trust this member')

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
