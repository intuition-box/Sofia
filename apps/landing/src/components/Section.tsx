import type { ReactNode } from 'react'
import { useSectionEnter } from '../hooks/useSectionEnter'
import styles from './Section.module.css'

interface SectionProps {
  id?: string
  /** Coord prefix shown in the meta strip (e.g. "S.01"). */
  code: string
  /** Label next to the code (e.g. "CAPABILITIES"). */
  label: string
  /** Right-side meta string (e.g. "04 MODULES"). */
  meta: string
  /** Visual variant. `"peach"` = ink-on-peach banner. */
  variant?: 'dark' | 'peach'
  /** Optional absolute decoration filling the whole section (e.g. HexSplit).
   * Rendered outside the `.container` so it can span the full section width
   * regardless of gutter constraints. */
  decoration?: ReactNode
  /** Extra className appended to the outer section. */
  className?: string
  children: ReactNode
}

/**
 * Section — design v2 section frame: 140px vertical rhythm, border-top
 * between consecutive sections, mono coord strip absolutely positioned
 * at the top, optional peach variant for banner sections.
 *
 * Children render inside `.container` (max-width + gutter from globals).
 */
export function Section({
  id,
  code,
  label,
  meta,
  variant = 'dark',
  decoration,
  className = '',
  children,
}: SectionProps) {
  const peach = variant === 'peach'
  const ref = useSectionEnter<HTMLElement>()
  return (
    <section
      ref={ref}
      id={id}
      className={[
        styles.section,
        peach ? styles.peach : '',
        peach ? 'on-peach' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {decoration}
      <span data-section-rule className={styles.rule} aria-hidden="true" />
      <CornerBrackets peach={peach} />
      <div className={styles.meta}>
        <span data-meta-l className={styles.metaL}>
          <span className={styles.dot} />
          <span>
            {code} · {label}
          </span>
        </span>
        <span data-meta-r className={styles.metaR}>
          {meta}
        </span>
      </div>
      <div data-section-body className={`container ${styles.body}`}>
        {children}
      </div>
    </section>
  )
}

/**
 * Four L-shaped corner brackets, each drawn as one SVG path so the hook
 * can animate stroke-dashoffset from full length to 0.
 *
 * The brackets are absolutely positioned 16px from each corner, 18px legs.
 */
function CornerBrackets({ peach }: { peach: boolean }) {
  const stroke = peach ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.4)'
  return (
    <div className={styles.corners} aria-hidden="true">
      {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => (
        <svg
          key={pos}
          className={`${styles.corner} ${styles[`corner_${pos}`]}`}
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            data-corner-path
            d={CORNER_PATHS[pos]}
            stroke={stroke}
            strokeWidth="1"
            strokeLinecap="square"
          />
        </svg>
      ))}
    </div>
  )
}

const CORNER_PATHS = {
  tl: 'M 1 18 L 1 1 L 18 1',
  tr: 'M 6 1 L 23 1 L 23 18',
  bl: 'M 1 6 L 1 23 L 18 23',
  br: 'M 6 23 L 23 23 L 23 6',
} as const
