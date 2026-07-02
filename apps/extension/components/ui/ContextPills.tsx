/**
 * ContextPills — render a cert's context slugs (topics and/or categories) as
 * `.amp-tag` pills on a SINGLE line. Any that would wrap to a second line
 * collapse into a "+N" chip whose hover shows the same styled tooltip as the
 * explorer (dot + label per hidden context). Ported from the explorer's
 * ChipOverflowRow (glitch-free: a hidden mirror is measured pre-paint).
 */
import {
  TopicPill,
  useAnchoredTooltip,
  useChipOverflow
} from "@0xsofia/design-system"
import { createPortal } from "react-dom"

import {
  contextColor,
  contextIcon,
  contextLabel
} from "~/lib/config/contextDisplay"

import "../styles/ContextPicker.css"

interface ResolvedPill {
  slug: string
  label: string
  color: string
  icon: string
}

export default function ContextPills({ slugs }: { slugs: string[] }) {
  const chips: ResolvedPill[] = slugs
    .map((slug) => ({
      slug,
      label: contextLabel(slug),
      color: contextColor(slug),
      icon: contextIcon(slug)
    }))
    .filter((c): c is ResolvedPill => Boolean(c.label))

  const total = chips.length
  // Shared glitch-free mirror-measure; re-measures when the slug set changes.
  const { mirrorRef, shown } = useChipOverflow(total, [slugs.join(",")])
  const tip = useAnchoredTooltip()

  if (total === 0) return null

  const hidden = chips.slice(shown)
  // Visible pills use the shared DS <TopicPill>; the hidden mirror below keeps
  // raw `.sf-topic-pill` spans (same class → same width) carrying `data-chip`
  // for the overflow measure.
  const pill = (c: ResolvedPill) => (
    <TopicPill key={c.slug} color={c.color} label={c.label} glyph={c.icon} />
  )

  return (
    <div className="ext-cp-wrap">
      {/* hidden mirror — all chips, measured for the first-line fit */}
      <div
        className="ext-cp-row ext-cp-row--measure"
        ref={mirrorRef}
        aria-hidden>
        {chips.map((c) => (
          <span key={c.slug} data-chip="1" className="sf-topic-pill">
            <span
              className="material-symbols-outlined sf-topic-pill-glyph"
              aria-hidden>
              {c.icon}
            </span>
            {c.label}
          </span>
        ))}
      </div>
      {/* visible row — only what fits + the overflow badge */}
      <div className="ext-cp-row">
        {chips.slice(0, shown).map(pill)}
        {hidden.length > 0 && (
          <button
            type="button"
            className="ext-cp-more"
            aria-label={`Show ${hidden.length} more: ${hidden
              .map((c) => c.label)
              .join(", ")}`}
            onMouseEnter={(e) =>
              tip.openFrom(e.currentTarget.getBoundingClientRect())
            }
            onMouseLeave={tip.close}
            onFocus={(e) =>
              tip.openFrom(e.currentTarget.getBoundingClientRect())
            }
            onBlur={tip.close}>
            +{hidden.length}
          </button>
        )}
      </div>
      {tip.anchor &&
        hidden.length > 0 &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="ext-cp-tip"
            style={{ left: tip.anchor.left, top: tip.anchor.top }}
            role="tooltip">
            {hidden.map((c) => (
              <div className="ext-cp-tip-row" key={c.slug}>
                <span
                  className="ext-cp-tip-dot"
                  style={{ background: c.color }}
                />
                <span className="ext-cp-tip-label">{c.label}</span>
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  )
}
