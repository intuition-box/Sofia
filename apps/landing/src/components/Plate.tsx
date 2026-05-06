import type { ReactNode } from 'react'
import styles from './Plate.module.css'

type PlateVariant = 'dark' | 'on-peach' | 'cmp-dark'
type Instrument = 'iso' | 'circles' | 'topics'
type BodyModifier = 'flush' | 'grid'

interface PlateProps {
  /** Tag badge — e.g. "PLATE.C". */
  tag: string
  /** Plate title — e.g. "Three circles · attention relief". */
  title: string
  /** Right-side mono meta strings (one or many). */
  meta?: string[]
  /** Mono foot strings (one or many). */
  foot?: string[]
  /** SVG content (TopicsIntentions / IsoStack / ThreeCircles). */
  children: ReactNode
  /** Visual variant. */
  variant?: PlateVariant
  /** Optional instrument-aspect body wrapper (sets ratio + dark inner bg). */
  instrument?: Instrument
  /** Body layout modifier — `flush` removes padding for tables, `grid` for grid children. */
  body?: BodyModifier
  /** Extra className on the outer wrapper. */
  className?: string
  /** Extra className on the body wrapper (for per-instance aspect / size overrides). */
  bodyClassName?: string
}

const VARIANT_CLASS: Record<PlateVariant, string> = {
  dark: '',
  'on-peach': 'plate-on-peach',
  'cmp-dark': 'plate-cmp-dark',
}

/**
 * Plate — shared engineering-card frame wrapping any of the SVG
 * micrographics or other content. Used in Hero, Features, Steps,
 * Comparison, Chronicles.
 */
export function Plate({
  tag,
  title,
  meta = [],
  foot = [],
  children,
  variant = 'dark',
  instrument,
  body,
  className = '',
  bodyClassName = '',
}: PlateProps) {
  const variantStyle =
    variant === 'on-peach'
      ? styles.onPeach
      : variant === 'cmp-dark'
        ? styles.cmpDark
        : ''
  const variantGlobal = VARIANT_CLASS[variant]

  const bodyClass = [
    styles.body,
    body === 'flush' ? styles.bodyFlush : '',
    body === 'grid' ? styles.bodyGrid : '',
    instrument === 'iso' ? styles.bodyInstrumentIso : '',
    instrument === 'circles' ? styles.bodyInstrumentCircles : '',
    instrument === 'topics' ? styles.bodyInstrumentTopics : '',
    bodyClassName,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={[styles.plate, variantStyle, variantGlobal, className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.head}>
        <div className={styles.headLeft}>
          <span className={styles.tag}>{tag}</span>
          <span className={styles.title}>{title}</span>
        </div>
        {meta.length > 0 && (
          <div className={styles.meta}>
            {meta.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        )}
      </div>
      <div className={bodyClass}>{children}</div>
      {foot.length > 0 && (
        <div className={styles.foot}>
          {foot.map((f) => (
            <span key={f}>{f}</span>
          ))}
        </div>
      )}
    </div>
  )
}
