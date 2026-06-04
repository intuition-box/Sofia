/**
 * ContextPills — render a cert's context slugs (topics and/or categories) as
 * `.amp-tag` pills. Beyond `max`, the rest collapse into a "+N" chip whose
 * tooltip lists them — so the row never wraps to a second line.
 */
import type { CSSProperties } from "react"

import { contextColor, contextLabel } from "~/lib/config/contextDisplay"

interface ContextPillsProps {
  slugs: string[]
  /** Max pills shown before collapsing into +N. */
  max?: number
}

export default function ContextPills({ slugs, max = 2 }: ContextPillsProps) {
  const resolved = slugs
    .map((slug) => ({
      slug,
      label: contextLabel(slug),
      color: contextColor(slug),
    }))
    .filter((c): c is { slug: string; label: string; color: string } =>
      Boolean(c.label),
    )

  if (resolved.length === 0) return null

  const shown = resolved.slice(0, max)
  const hidden = resolved.slice(max)

  return (
    <>
      {shown.map((c) => (
        <span
          key={c.slug}
          className="amp-tag"
          style={
            { "--tag-color": c.color, "--tag-pastel": c.color } as CSSProperties
          }>
          {c.label}
        </span>
      ))}
      {hidden.length > 0 && (
        <span
          className="amp-tag amp-tag--more"
          title={hidden.map((c) => c.label).join(", ")}>
          +{hidden.length}
        </span>
      )}
    </>
  )
}
