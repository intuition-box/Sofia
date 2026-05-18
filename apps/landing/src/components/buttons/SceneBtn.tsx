import { useState, type CSSProperties, type ReactNode } from 'react'

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
  style?: CSSProperties
}

/**
 * SceneBtn — drop-in replacement for the global `.btn.btn-secondary`
 * anchors. Variant-aware hover (black on dark slabs, peach on peach
 * slabs). Inline styles driven by React state so the hover is
 * deterministic — no specificity fights, no class collisions.
 */
export function SceneBtn({
  href,
  children,
  variant,
  ink,
  hoverFill,
  restFill,
  style,
}: SceneBtnProps) {
  const [hover, setHover] = useState(false)
  const resolvedInk = ink ?? (variant === 'peach' ? 'light' : 'dark')
  const restingInk = resolvedInk === 'light' ? '#f5e9d8' : '#02000e'
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    border: `1px solid ${restingInk}`,
    borderRadius: 999,
    fontFamily: 'var(--font-mono)',
    fontSize: '0.85rem',
    fontWeight: 500,
    letterSpacing: '0.04em',
    textDecoration: 'none',
    color: restingInk,
    background: restFill === 'white' ? '#ffffff' : 'transparent',
    transition:
      'background 160ms ease, color 160ms ease, border-color 160ms ease, transform 160ms ease',
    cursor: 'pointer',
  }
  const hovered: CSSProperties =
    hoverFill === 'white'
      ? {
          background: '#ffffff',
          borderColor: '#ffffff',
          color: '#02000e',
          transform: 'translateY(-1px)',
        }
      : hoverFill === 'peach'
        ? {
            background: 'var(--color-accent)',
            borderColor: 'var(--color-accent)',
            color: '#02000e',
            transform: 'translateY(-1px)',
          }
        : variant === 'peach'
          ? {
              background: 'var(--color-accent)',
              borderColor: 'var(--color-accent)',
              color: '#02000e',
              transform: 'translateY(-1px)',
            }
          : {
              background: '#02000e',
              borderColor: '#02000e',
              color: '#f5e9d8',
              transform: 'translateY(-1px)',
            }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...base, ...(hover ? hovered : null), ...style }}>
      {children}
    </a>
  )
}
