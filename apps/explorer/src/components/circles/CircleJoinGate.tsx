/**
 * CircleJoinGate — Free-tier membership gate (Phase 3).
 *
 * Rendered as a centered overlay above the blurred (`content-gated`)
 * circle content when the viewer is NOT a member of a locked group.
 * Ported from the design handoff's `JoinGate`, wired to the REAL join
 * flow already plumbed into `CircleDetailView`:
 *
 *   - `onJoin` fires the cart-based join (same handler the header's
 *     "Enter this Circle" button uses).
 *   - `inCart` reflects the queued state — the CTA becomes a
 *     "confirm in the drawer" status instead of re-queuing.
 *   - `disabled` + `disabledReason` grey out the CTA and surface why
 *     (no wallet / no account atom yet).
 *
 * Non-auth visitors have no wallet to join with, so for them the CTA
 * routes to Privy `login()` ("Connect to enter") and the "upgrade to
 * Pro" alt link is hidden — there's nothing to upgrade yet.
 *
 * The 3-stat row uses REAL values (members / active now / signals per
 * week) and omits any stat that's absent rather than fabricating a zero.
 */
import { useLogin } from '@privy-io/react-auth'
import { Zap, Check } from 'lucide-react'

interface JoinGateStat {
  label: string
  value: number
}

interface CircleJoinGateProps {
  /** Circle name — used in the headline and CTA. */
  circleName: string
  /** First letter of the name → logo tile glyph. */
  circleColor: string
  /** Total roster size. Always present. */
  memberCount: number
  /** Members active in the last window — omitted when stats absent. */
  activeCount?: number
  /** Signals marked in the window — omitted when stats absent. */
  signalCount?: number
  /** Whether the viewer is authenticated (has a wallet to join with). */
  authenticated: boolean
  /** Gated-join state from the backend. `none` → request, `invited` → accept a
   *  pending invitation, `pending` → awaiting review, `approved` → unlock the
   *  on-chain mint, `rejected` → declined. */
  joinStatus?: 'none' | 'invited' | 'pending' | 'approved' | 'rejected'
  /** Submits a join request to the backend (shown when `joinStatus==='none'`). */
  onRequest?: () => void
  /** Request submission in flight. */
  requesting?: boolean
  /** Accept / decline a pending invitation (shown when `joinStatus==='invited'`). */
  onAccept?: () => void
  onDecline?: () => void
  /** Invitation response in flight. */
  responding?: boolean
  /** Fires the cart-based on-chain mint — used once `joinStatus==='approved'`. */
  onJoin?: () => void
  /** Join already queued in the cart → CTA shows a confirmation status. */
  inCart?: boolean
  /** Join blocked (no wallet / no account atom) → CTA disabled + reason. */
  disabled?: boolean
  disabledReason?: string | null
}

export default function CircleJoinGate({
  circleName,
  circleColor,
  memberCount,
  activeCount,
  signalCount,
  authenticated,
  joinStatus = 'none',
  onRequest,
  requesting = false,
  onAccept,
  onDecline,
  responding = false,
  onJoin,
  inCart = false,
  disabled = false,
  disabledReason,
}: CircleJoinGateProps) {
  const { login } = useLogin()

  // Build the stat row from REAL values only — drop any stat the
  // aggregate query didn't return (locked / loading) instead of faking 0.
  const stats: JoinGateStat[] = [{ label: 'members', value: memberCount }]
  if (activeCount !== undefined) {
    stats.push({ label: 'active now', value: activeCount })
  }
  if (signalCount !== undefined) {
    stats.push({ label: 'signals / wk', value: signalCount })
  }

  return (
    <div className="join-gate" role="region" aria-label="Join this circle">
      <div className="jg-card">
        <span className="jg-logo" style={{ background: circleColor }}>
          {circleName.slice(0, 1).toUpperCase()}
        </span>
        {joinStatus === 'approved' ? (
          <div className="jg-eyebrow jg-eyebrow--approved">
            <Check className="jg-eyebrow-ic" aria-hidden="true" />
            Request approved
          </div>
        ) : joinStatus === 'invited' ? (
          <div className="jg-eyebrow jg-eyebrow--approved">
            <Check className="jg-eyebrow-ic" aria-hidden="true" />
            You're invited
          </div>
        ) : (
          <div className="jg-eyebrow">Members-only Circle</div>
        )}
        <h2 className="jg-title">
          {joinStatus === 'approved'
            ? `Become a member of ${circleName}`
            : joinStatus === 'invited'
              ? `You're invited to ${circleName}`
              : `Enter the ${circleName} Circle`}
        </h2>
        <p className="jg-sub">
          {!authenticated
            ? 'Connect your wallet to request access to this Circle.'
            : joinStatus === 'invited'
              ? 'You were invited to this Circle. Accept to become a member, then mint your membership on-chain.'
              : joinStatus === 'pending'
                ? "Your request is in review — you'll be notified when an admin decides."
                : joinStatus === 'rejected'
                  ? 'Your request was declined. You can ask again later.'
                  : joinStatus === 'approved'
                    ? "You're in — mint your membership on-chain to finish joining."
                    : 'An admin reviews new members. Free — your wallet is your membership.'}
        </p>

        {stats.length > 0 && (
          <div className="jg-stats">
            {stats.map((s) => (
              <div className="jg-stat" key={s.label}>
                <b>{s.value}</b>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {!authenticated ? (
          <button
            type="button"
            className="cf-btn cf-btn-pro jg-cta"
            onClick={() => login()}
          >
            <Zap className="jg-cta-ic" aria-hidden="true" />
            Connect to enter
          </button>
        ) : joinStatus === 'invited' ? (
          <div className="jg-invite-actions">
            <button
              type="button"
              className="cf-btn cf-btn-pro jg-cta"
              onClick={() => onAccept?.()}
              disabled={responding}
            >
              <Zap className="jg-cta-ic" aria-hidden="true" />
              {responding ? 'Accepting…' : 'Accept invitation'}
            </button>
            <button
              type="button"
              className="cf-btn jg-cta jg-cta--ghost"
              onClick={() => onDecline?.()}
              disabled={responding}
            >
              Decline
            </button>
          </div>
        ) : joinStatus === 'pending' ? (
          <span className="jg-status">
            <Check className="jg-status-ic" aria-hidden="true" />
            Request pending review
          </span>
        ) : joinStatus === 'approved' ? (
          inCart ? (
            <span className="jg-status">
              <Check className="jg-status-ic" aria-hidden="true" />
              Added to cart — confirm in the drawer
            </span>
          ) : (
            <button
              type="button"
              className="cf-btn cf-btn-pro jg-cta"
              onClick={() => onJoin?.()}
              disabled={disabled}
            >
              <Zap className="jg-cta-ic" aria-hidden="true" />
              Become a member
            </button>
          )
        ) : (
          <button
            type="button"
            className="cf-btn cf-btn-pro jg-cta"
            onClick={() => onRequest?.()}
            disabled={requesting}
          >
            <Zap className="jg-cta-ic" aria-hidden="true" />
            {requesting
              ? 'Requesting…'
              : joinStatus === 'rejected'
                ? 'Request again'
                : 'Request to join'}
          </button>
        )}

        {authenticated &&
          joinStatus === 'approved' &&
          !inCart &&
          disabled &&
          disabledReason && (
            <span className="jg-hint">
              {disabledReason}{' '}
              <a
                href="https://portal.intuition.systems"
                target="_blank"
                rel="noreferrer"
                className="jg-hint-link"
              >
                Create your identity on the Intuition portal →
              </a>
            </span>
          )}
      </div>
    </div>
  )
}
