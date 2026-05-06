import type { ReactNode } from 'react';
import styles from './Section.module.css';

interface SectionProps {
  id?: string;
  /** Coord prefix shown in the meta strip (e.g. "S.01"). */
  code: string;
  /** Label next to the code (e.g. "CAPABILITIES"). */
  label: string;
  /** Right-side meta string (e.g. "04 MODULES"). */
  meta: string;
  /** Visual variant. `"peach"` = ink-on-peach banner. */
  variant?: 'dark' | 'peach';
  /** Optional absolute decoration filling the whole section (e.g. HexSplit).
   * Rendered outside the `.container` so it can span the full section width
   * regardless of gutter constraints. */
  decoration?: ReactNode;
  /** Extra className appended to the outer section. */
  className?: string;
  children: ReactNode;
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
  const peach = variant === 'peach';
  return (
    <section
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
      <div className={styles.meta}>
        <span className={styles.metaL}>
          <span className={styles.dot} />
          <span>{code} · {label}</span>
        </span>
        <span className={styles.metaR}>{meta}</span>
      </div>
      <div className={`container ${styles.body}`}>{children}</div>
    </section>
  );
}
