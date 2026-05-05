import type { ReactNode } from 'react';
import styles from './Module.module.css';

interface ModuleProps {
  id?: string;
  /** S.0X — left-side coord prefix (e.g. "S.01"). */
  code: string;
  /** Left-side label after the dot (e.g. "CAPABILITIES"). */
  label: string;
  /** Right-side meta (e.g. "04 MODULES", "T+ 00:00 → 02:00"). */
  meta: string;
  /** Visual surface — "dark" (default) or "peach" banner. */
  variant?: 'dark' | 'peach';
  children: ReactNode;
}

/**
 * Module — shared section frame for the landing page.
 *
 * Borrows the v2 mockup vocabulary: corner ticks at the four corners,
 * mono coordinate labels at the top (S.0X · NAME on the left, meta on
 * the right), uniform 120px vertical padding, single border-top so
 * sections snap together without explicit dividers.
 *
 * Use `variant="peach"` for sections that should read as a banner
 * (ink-on-peach). Children render inside a centered `.container`.
 */
export function Module({ id, code, label, meta, variant = 'dark', children }: ModuleProps) {
  return (
    <section
      id={id}
      className={`${styles.module} ${variant === 'peach' ? styles.peach : ''}`}
    >
      <span className={`${styles.tick} ${styles.tl}`} />
      <span className={`${styles.tick} ${styles.tr}`} />
      <span className={`${styles.tick} ${styles.bl}`} />
      <span className={`${styles.tick} ${styles.br}`} />

      <div className={styles.coord}>
        <span className={styles.dot} />
        <span>{code}</span>
        <span className={styles.coordSep}>·</span>
        <span>{label}</span>
      </div>
      <div className={styles.coordR}>{meta}</div>

      <div className={`container ${styles.body}`}>{children}</div>
    </section>
  );
}
