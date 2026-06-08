/**
 * CircleUpgradeBand — Free-tier upgrade band (Phase 3).
 *
 * The full-width, peach-tinted card rendered LAST in the free circle
 * content: a sparkle icon, eyebrow ("Sofia Pro · for DAO operators"),
 * title, sub-copy, a "500 TRUST / mo" price, and an "Upgrade Circle"
 * button that opens the shared `CircleProModal`. Ported from the
 * design handoff's `UpgradeBand`.
 */
import { circleProModal } from './CircleProModal'

/** Inline sparkle glyph — matches the handoff's `SparkGlyph`. */
function SparkGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </svg>
  )
}

export default function CircleUpgradeBand() {
  const onUpgrade = () => circleProModal()

  return (
    <div className="up-band">
      <span className="lock-icon up-band-icon">
        <SparkGlyph />
      </span>
      <div className="up-band-id">
        <div className="up-band-eyebrow">Sofia Pro · for DAO operators</div>
        <div className="up-band-title">
          See who really knows what — and decide accordingly
        </div>
        <p className="up-band-sub">
          Unlock the expertise graph, per-domain trust delegation,
          expertise-weighted decisions, and targeted recruitment for your
          Circle.
        </p>
      </div>
      <div className="up-band-price">
        <div className="up-band-amt">
          500<small> TRUST / mo</small>
        </div>
        <button
          type="button"
          className="cf-btn cf-btn-pro up-band-cta"
          onClick={onUpgrade}
        >
          <span className="up-band-cta-ic">
            <SparkGlyph />
          </span>
          Upgrade Circle
        </button>
      </div>
    </div>
  )
}
