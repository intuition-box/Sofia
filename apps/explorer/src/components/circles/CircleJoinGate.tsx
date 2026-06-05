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
import { circleUpsellToast } from './CircleUpsellToast'

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
  /** Fires the cart-based join — only when authed, not in-cart, enabled. */
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

  const handleEnter = () => {
    if (!authenticated) {
      login()
      return
    }
    onJoin?.()
  }

  const ctaDisabled = authenticated && disabled

  return (
    <div className="join-gate" role="region" aria-label="Join this circle">
      <div className="jg-card">
        <span className="jg-logo" style={{ background: circleColor }}>
          {circleName.slice(0, 1).toUpperCase()}
        </span>
        <div className="jg-eyebrow">Members-only Circle</div>
        <h2 className="jg-title">Enter the {circleName} Circle</h2>
        <p className="jg-sub">
          {authenticated
            ? "Join to read the Circle's signals, topics and members. Free — your wallet is your membership."
            : "Connect your wallet to read the Circle's signals, topics and members. Free — your wallet is your membership."}
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

        {inCart ? (
          <span className="jg-status">
            <Check className="jg-status-ic" aria-hidden="true" />
            Added to cart — confirm in the drawer
          </span>
        ) : (
          <button
            type="button"
            className="cf-btn cf-btn-pro jg-cta"
            onClick={handleEnter}
            disabled={ctaDisabled}
          >
            <Zap className="jg-cta-ic" aria-hidden="true" />
            {authenticated ? 'Enter this Circle' : 'Connect to enter'}
          </button>
        )}

        {!inCart && ctaDisabled && disabledReason && (
          <span className="jg-hint">{disabledReason}</span>
        )}

        {authenticated && (
          <button
            type="button"
            className="jg-alt"
            onClick={() =>
              circleUpsellToast(
                'Sofia Pro — contact the core team on Discord to upgrade',
              )
            }
          >
            or upgrade to Pro for full analytics
          </button>
        )}
      </div>
    </div>
  )
}
