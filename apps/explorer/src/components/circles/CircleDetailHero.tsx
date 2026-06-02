/**
 * CircleDetailHero — big title + description on the left, activity stats
 * panel on the right rail.
 *
 * When `onColorChange` is provided, hovering/focusing the circle avatar
 * surfaces a small color picker — used today by the Trust Circle to let
 * the owner pick its accent color.
 */
import type { ReactNode } from 'react'
import type { CircleStats } from '@/services/circleStats'

interface CircleDetailHeroProps {
  name: string
  description: string
  createdAgo: string
  circleColor: string
  /** Enables the hover color-picker overlay on the avatar. */
  onColorChange?: (color: string) => void
  /** Palette rendered inside the picker. Ignored when onColorChange is not set. */
  colorOptions?: readonly string[]
  /** Optional slot rendered between the left title block and the right
   *  actions-budget panel. Used today by non-member groups to surface
   *  the Join CTA without taking a row of its own below the hero. */
  cta?: ReactNode
  /** Aggregate metrics rendered above the Actions Budget block — posts,
   *  votes, and 7-day active members. Omit for locked / non-member
   *  views so the page doesn't leak cumulative volume. */
  stats?: CircleStats
}

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

export default function CircleDetailHero({
  name,
  description,
  createdAgo,
  circleColor,
  onColorChange,
  colorOptions,
  cta,
  stats,
}: CircleDetailHeroProps) {
  const pickerEnabled =
    Boolean(onColorChange) && (colorOptions?.length ?? 0) > 0

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

      {cta && <div className="crd-hero-cta">{cta}</div>}

      <div className="crd-hero-right">
        {stats && (
          <div
            className="crd-hero-stats"
            role="group"
            aria-label="Circle activity"
          >
            <div className="crd-hero-stat">
              <span className="crd-hero-stat__num">
                {formatCount(stats.postCount)}
              </span>
              <span className="crd-hero-stat__label">posts</span>
            </div>
            <div className="crd-hero-stat">
              <span className="crd-hero-stat__num">
                {formatCount(stats.voteCount)}
              </span>
              <span className="crd-hero-stat__label">votes</span>
            </div>
            <div className="crd-hero-stat">
              <span className="crd-hero-stat__num">
                {stats.activeMemberCount}
                <span className="crd-hero-stat__pulse" aria-hidden="true" />
              </span>
              <span className="crd-hero-stat__label">live</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
