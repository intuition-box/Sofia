import type { ReactNode } from 'react'
import styles from './SceneBtn.module.css'

interface SceneBtnProps {
  href: string
  children: ReactNode
  /** Slide bg under the button. `dark` (S.05 Vision-style white slab)
   *  → black hover. `peach` → peach hover. */
  variant: 'peach' | 'dark'
  /** Override the resting ink colour. Default keys off the variant —
   *  dark slab → deep-ink, peach slab → off-white. Pass `dark` on a
   *  peach slide when the button needs to match a sibling primary
   *  button (e.g. Hero "Read the docs" next to "Open Explorer"). */
  ink?: 'dark' | 'light'
  /** Optional override for the hover fill. Defaults to peach-accent on
   *  peach slabs / deep-ink on dark slabs.
   *   - `'white'` → solid white slab with deep-ink text.
   *   - `'peach'` → peach-accent slab with deep-ink text (used on dark
   *      slabs where you want the hover to pop with brand colour). */
  hoverFill?: 'white' | 'peach'
  /** Optional fill colour for the RESTING state. Default `'transparent'`
   *  (outline-only). Pass `'white'` to render a filled white pill at
   *  rest — useful on near-white slabs where the button still needs to
   *  read as a distinct surface against the slab. */
  restFill?: 'transparent' | 'white'
  /** Size token. Default ``undefined`` → standard 10×16 padding. */
  size?: 'sm'
  /** Per-zone positioning hook. Looked up by CSS via `data-anchor` so
   *  zones that need extra margin/alignment around the button (e.g.
   *  the team CTA below the quote list) declare it as a CSS rule
   *  rather than pushing inline styles through the component. */
  anchor?: 'team-cta'
}

/**
 * SceneBtn — drop-in replacement for the global `.btn.btn-secondary`
 * anchors. Variant-aware hover (black on dark slabs, peach on peach
 * slabs). All styling lives in `SceneBtn.module.css` — variants and
 * size modifiers are picked via data-attributes so the markup stays
 * declarative and the component carries no inline styles.
 */
export function SceneBtn({
  href,
  children,
  variant,
  ink,
  hoverFill,
  restFill,
  size,
  anchor,
}: SceneBtnProps) {
  const resolvedInk = ink ?? (variant === 'peach' ? 'light' : 'dark')
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.btn}
      data-variant={variant}
      data-ink={resolvedInk}
      data-rest-fill={restFill ?? 'transparent'}
      data-hover-fill={hoverFill}
      data-size={size}
      data-anchor={anchor}>
      {children}
    </a>
  )
}
