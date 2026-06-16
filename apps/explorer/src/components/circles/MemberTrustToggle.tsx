/**
 * MemberTrustToggle — the per-row trust control in the Free-tier members
 * side panel, styled per design_handoff_circle_free's `.trust-btn`:
 *   - not trusted  → green-outline "Trust"
 *   - trusted      → solid green "✓ Trusted"; on hover swaps to red "Distrust"
 *
 * Wires to the REAL trust pipeline via `useTrustMember` (cart-based, like
 * the existing `TrustMemberButton`) rather than a fake local boolean:
 *   - `alreadyTrusted` (on-chain) renders the solid-green Trusted state.
 *   - clicking an untrusted member queues the trust intent in the cart
 *     and fires a toast ("Trusting X — added to cart").
 *   - disabled prerequisites (no wallet / no account atom) surface the
 *     hook's hint as the title and disable the control.
 *
 * The proto's "click a Trusted member to distrust" is presented visually
 * (red Distrust on hover) but distrust emission isn't part of Phase 1, so
 * the on-chain Trusted state stays read-only and the click is a no-op
 * that explains why — we never fake an un-trust.
 */
import type { MouseEvent } from 'react'
import { Check } from 'lucide-react'
import { useTrustMember } from '@/hooks/useTrustMember'
import type { TrustCircleAccount } from '@/services/trustCircleService'

interface MemberTrustToggleProps {
  member: TrustCircleAccount
  /** Fires a transient toast after a successful queue. */
  onToast: (message: string) => void
}

export default function MemberTrustToggle({
  member,
  onToast,
}: MemberTrustToggleProps) {
  const { trust, inCart, alreadyTrusted, disabledReason, disabledHint } =
    useTrustMember(member)

  // On-chain trusted — solid green, read-only. Hover reveals the red
  // "Distrust" affordance from the design, but distrust isn't wired in
  // Phase 1, so the click only explains the state.
  if (alreadyTrusted) {
    const handleTrusted = () =>
      onToast(`You already trust ${member.label} on-chain`)
    return (
      <button
        type="button"
        className="cf-trust-btn is-trusted"
        onClick={handleTrusted}
        title={`You trust ${member.label} on-chain`}
        aria-label={`You trust ${member.label}`}
      >
        <span className="cf-trust-default">
          <Check className="cf-trust-icon" aria-hidden="true" />
          Trusted
        </span>
        <span className="cf-trust-hover">Distrust</span>
      </button>
    )
  }

  const disabled = disabledReason !== null
  const label = inCart ? 'Queued' : 'Trust'
  const title =
    disabledHint ??
    (inCart ? 'In cart — submit to emit' : `Trust ${member.label}`)

  const handleClick = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled || inCart) return
    trust()
    onToast(`Trusting ${member.label} — added to your cart`)
  }

  return (
    <button
      type="button"
      className={`cf-trust-btn${inCart ? ' is-queued' : ''}`}
      onClick={handleClick}
      disabled={disabled}
      title={title}
      aria-label={title}
    >
      {label}
    </button>
  )
}
