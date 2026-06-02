import type { ReactNode } from 'react'

/**
 * Admonition — note / info / tip / warning / danger, each mapped
 * to a predicate color (the design's motif: note→accent,
 * info→learning, tip→trusted, warning→fun, danger→distrusted).
 * Ported from the design `Admonition` + `ADMONITION_MAP`.
 */
export type AdmonitionKind =
  | 'note'
  | 'info'
  | 'tip'
  | 'warning'
  | 'danger'

const MAP: Record<
  AdmonitionKind,
  { c: string; label: string; ico: string }
> = {
  note: { c: 'accent', label: 'Note', ico: 'i' },
  info: { c: 'learning', label: 'Info', ico: 'i' },
  tip: { c: 'trusted', label: 'Tip', ico: '✓' },
  warning: { c: 'fun', label: 'Warning', ico: '!' },
  danger: { c: 'distrusted', label: 'Danger', ico: '×' },
}

export function Admonition({
  kind = 'note',
  title,
  children,
}: {
  kind?: AdmonitionKind
  title?: string
  children: ReactNode
}) {
  const meta = MAP[kind] ?? MAP.note
  return (
    <div className="adm" data-kind={kind}>
      <span className="adm-ico">{meta.ico}</span>
      <div className="adm-body">
        <span className="title">{title ?? meta.label}</span>
        {children}
      </div>
    </div>
  )
}
