/**
 * CircleJoinOverlay — gating CTA rendered on top of the blurred
 * circle content when the user isn't a member yet. Sits above
 * `CircleMembersCard`, `CircleTopTopicsCard` and `CircleFeedSection`
 * inside a positioned wrapper.
 */
import { Lock, UserPlus, Check } from 'lucide-react'

interface CircleJoinOverlayProps {
  circleName: string
  /** When `inCart` is true, swap the primary button for a confirmation
   *  hint — the user has already queued the join and just needs to
   *  submit the cart. */
  inCart?: boolean
  /** When `disabled` is true (no wallet / no account atom yet), the
   *  primary button is greyed out and the hint surfaces the reason. */
  disabled?: boolean
  disabledReason?: string | null
  onJoin: () => void
}

export default function CircleJoinOverlay({
  circleName,
  inCart = false,
  disabled = false,
  disabledReason,
  onJoin,
}: CircleJoinOverlayProps) {
  return (
    <div className="crd-join-overlay" role="region" aria-label="Join this circle">
      <div className="crd-join-overlay-card">
        <span className="crd-join-overlay-icon" aria-hidden="true">
          <Lock className="h-5 w-5" />
        </span>
        <p className="crd-join-overlay-title">
          Join {circleName} to see members & activity
        </p>
        <p className="crd-join-overlay-sub">
          Members of this circle shape its perspective.
        </p>

        {inCart ? (
          <span className="crd-join-overlay-status">
            <Check className="h-4 w-4" />
            Added to cart — confirm in the drawer
          </span>
        ) : (
          <button
            type="button"
            className="crd-join-overlay-cta"
            onClick={onJoin}
            disabled={disabled}
          >
            <UserPlus className="h-4 w-4" />
            Join {circleName}
          </button>
        )}
        {!inCart && disabled && disabledReason && (
          <span className="crd-join-overlay-hint">{disabledReason}</span>
        )}
      </div>
    </div>
  )
}
