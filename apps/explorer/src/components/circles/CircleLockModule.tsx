/**
 * CircleLockModule — Free-tier "Decisions" module (Phase 3).
 *
 * A `.cf-module` titled "Decisions" whose body is a `.lock-wrap`:
 * blurred ghost rows behind a centered `.lock-over` overlay (lock icon,
 * title, description, feature pills, "Upgrade to Pro" CTA). Ported from
 * the design handoff's `LockModule` + `GhostRows`. Read-only / inert —
 * the only affordance is the upsell CTA, which fires the shared
 * `circleUpsellToast`.
 *
 * The ghost rows are purely decorative scaffolding (no real data): they
 * exist to suggest the shape of the locked feature without fabricating
 * decision content the free tier has no access to.
 */
import { Check } from 'lucide-react'
import { circleUpsellToast } from './CircleUpsellToast'

interface CircleLockModuleProps {
  /** Section heading (e.g. "Decisions"). */
  title: string
  /** Overlay headline naming the locked feature. */
  lockTitle: string
  /** One-line description of what Pro unlocks. */
  desc: string
  /** Feature pills rendered under the description. */
  feats: readonly string[]
  /** Number of blurred ghost rows behind the overlay. */
  ghostRows?: number
}

/** Inline lock glyph — matches the handoff's `LockGlyph`. */
function LockGlyph() {
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
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </svg>
  )
}

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

interface GhostRowsProps {
  rows: number
}

function GhostRows({ rows }: GhostRowsProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <div className="lock-ghost-row" key={i} aria-hidden="true">
          <span className="lock-ghost-av" />
          <div className="lock-ghost-lines">
            <span
              className="lock-ghost-bar"
              style={{ width: `${52 + (i % 3) * 14}%` }}
            />
            <span
              className="lock-ghost-bar lock-ghost-bar-sm"
              style={{ width: `${30 + (i % 2) * 12}%` }}
            />
          </div>
          <span className="lock-ghost-pill" />
          <span className="lock-ghost-pill lock-ghost-pill-sm" />
        </div>
      ))}
    </>
  )
}

export default function CircleLockModule({
  title,
  lockTitle,
  desc,
  feats,
  ghostRows = 3,
}: CircleLockModuleProps) {
  const onUpgrade = () =>
    circleUpsellToast('Sofia Pro — contact your Circle steward to upgrade')

  return (
    <section className="cf-module" aria-labelledby="cf-decisions-title">
      <div className="cf-module-head">
        <h2 id="cf-decisions-title" className="cf-module-title">
          {title}
        </h2>
        <span className="cf-module-note">
          <span className="lock-note-ic">
            <LockGlyph />
          </span>
          Pro feature
        </span>
      </div>

      <div className="lock-wrap">
        <div className="lock-ghost">
          <GhostRows rows={ghostRows} />
        </div>
        <div className="lock-over">
          <span className="lock-icon">
            <LockGlyph />
          </span>
          <h3 className="lock-title">{lockTitle}</h3>
          <p className="lock-desc">{desc}</p>
          <div className="lock-feats">
            {feats.map((f) => (
              <span className="lock-feat" key={f}>
                <Check className="lock-feat-ic" aria-hidden="true" />
                {f}
              </span>
            ))}
          </div>
          <button
            type="button"
            className="cf-btn cf-btn-pro lock-cta"
            onClick={onUpgrade}
          >
            <span className="lock-cta-ic">
              <SparkGlyph />
            </span>
            Upgrade to Pro
          </button>
        </div>
      </div>
    </section>
  )
}
