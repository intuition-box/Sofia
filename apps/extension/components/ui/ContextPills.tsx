/**
 * ContextPills — render a cert's context slugs (topics and/or categories) as
 * `.amp-tag` pills on a SINGLE line. Any that would wrap to a second line
 * collapse into a "+N" chip whose hover shows the same styled tooltip as the
 * explorer (dot + label per hidden context). Ported from the explorer's
 * ChipOverflowRow (glitch-free: a hidden mirror is measured pre-paint).
 */
import { useLayoutEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import { createPortal } from "react-dom"

import {
  contextColor,
  contextIcon,
  contextLabel,
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
      icon: contextIcon(slug),
    }))
    .filter((c): c is ResolvedPill => Boolean(c.label))

  const mirror = useRef<HTMLDivElement>(null)
  const total = chips.length
  const [shown, setShown] = useState(total)
  const [tip, setTip] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    const el = mirror.current
    if (!el || total === 0) return
    const measure = () => {
      const slots = Array.from(
        el.querySelectorAll<HTMLElement>('[data-chip="1"]'),
      )
      if (slots.length === 0) return
      const top0 = slots[0].offsetTop
      let firstLine = slots.length
      for (let i = 1; i < slots.length; i++) {
        if (slots[i].offsetTop > top0 + 1) {
          firstLine = i
          break
        }
      }
      // Reserve one slot for the +N badge when something overflows.
      setShown(firstLine >= total ? total : Math.max(1, firstLine - 1))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [total, slugs.join(",")])

  if (total === 0) return null

  const hidden = chips.slice(shown)
  const pill = (c: ResolvedPill) => (
    <span
      key={c.slug}
      className="sf-topic-pill"
      style={{ "--pill-color": c.color } as CSSProperties}>
      <span
        className="material-symbols-outlined sf-topic-pill-glyph"
        aria-hidden>
        {c.icon}
      </span>
      {c.label}
    </span>
  )

  return (
    <div className="ext-cp-wrap">
      {/* hidden mirror — all chips, measured for the first-line fit */}
      <div className="ext-cp-row ext-cp-row--measure" ref={mirror} aria-hidden>
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
          <span
            className="ext-cp-more"
            onMouseEnter={(e) => {
              const r = e.currentTarget.getBoundingClientRect()
              setTip({ left: r.left + r.width / 2, top: r.top })
            }}
            onMouseLeave={() => setTip(null)}>
            +{hidden.length}
          </span>
        )}
      </div>
      {tip &&
        hidden.length > 0 &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="ext-cp-tip"
            style={{ left: tip.left, top: tip.top }}
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
          document.body,
        )}
    </div>
  )
}
