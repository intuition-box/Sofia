/**
 * CircleDetailHero — big title + description on the left, actions-budget
 * panel on the right rail. `sponsorClaimsLeft` is a mock placeholder
 * until the sponsor primitive is live on-chain.
 *
 * When `onColorChange` is provided, hovering/focusing the circle avatar
 * surfaces a small color picker — used today by the Trust Circle to let
 * the owner pick its accent color.
 */
import { Zap } from 'lucide-react'

interface CircleDetailHeroProps {
  name: string
  description: string
  createdAgo: string
  circleColor: string
  sponsorClaimsLeft: number
  memberCount: number
  /** Enables the hover color-picker overlay on the avatar. */
  onColorChange?: (color: string) => void
  /** Palette rendered inside the picker. Ignored when onColorChange is not set. */
  colorOptions?: readonly string[]
}

export default function CircleDetailHero({
  name,
  description,
  createdAgo,
  circleColor,
  sponsorClaimsLeft,
  memberCount,
  onColorChange,
  colorOptions,
}: CircleDetailHeroProps) {
  const total = sponsorClaimsLeft + 2000
  const pct = Math.min(100, Math.round((sponsorClaimsLeft / total) * 100))
  const perMember = Math.max(1, Math.round(sponsorClaimsLeft / Math.max(1, memberCount)))
  const pickerEnabled = Boolean(onColorChange) && (colorOptions?.length ?? 0) > 0

  return (
    <div
      className="crd-hero"
      style={{ ['--circle-color' as string]: circleColor }}
    >
      <div className="crd-hero-left">
        <div className="crd-hero-main">
          {pickerEnabled ? (
            <div
              className="crd-hero-avatar-wrap"
              tabIndex={0}
              role="group"
              aria-label="Circle color"
            >
              <span
                className="crd-hero-logo fallback"
                style={{ background: circleColor }}
              >
                {name.slice(0, 1).toUpperCase()}
              </span>
              <div
                className="crd-hero-color-picker"
                role="radiogroup"
                aria-label="Pick circle color"
              >
                {colorOptions!.map((c, i) => (
                  <button
                    key={c}
                    type="button"
                    className="crd-color-swatch"
                    style={{
                      background: c,
                      ['--angle' as string]: `${(i / colorOptions!.length) * 360}deg`,
                    }}
                    role="radio"
                    aria-checked={c === circleColor}
                    aria-label={`Set color ${c}`}
                    onClick={() => onColorChange!(c)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <span
              className="crd-hero-logo fallback"
              style={{ background: circleColor }}
            >
              {name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="crd-hero-title-wrap">
            <div className="crd-hero-name">{name}</div>
            <div className="crd-hero-sub">created {createdAgo}</div>
          </div>
          <span className="cr-role cr-role-owner">owner</span>
        </div>
        <p className="crd-hero-desc">{description}</p>
      </div>

      <div className="crd-hero-right">
        <div className="crd-hero-actions">
          <div className="crd-actions-head">
            <div className="cr-section-head">Actions budget</div>
            <button type="button" className="crd-get-more">
              <Zap size={14} />
              <span>Boost</span>
            </button>
          </div>
          <div className="crd-actions-body">
            <div>
              <div className="crd-actions-big">{sponsorClaimsLeft.toLocaleString()}</div>
              <div className="crd-actions-sub">actions left this month</div>
            </div>
            <div className="crd-actions-right">
              <div className="crd-actions-bar">
                <div className="crd-actions-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="crd-actions-meta">
                <span>~{perMember} per member</span>
                <span>resets in 16 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
