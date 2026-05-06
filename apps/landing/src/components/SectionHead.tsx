import type { ReactNode } from 'react';
import { useScrollAnim } from '../hooks/useScrollAnim';
import styles from './SectionHead.module.css';

interface SectionHeadProps {
  eyebrow: string;
  /** Title content (use `<em>` for italic accents). */
  title: ReactNode;
  /** Optional subtitle/lede paragraph rendered under the title (left col). */
  sub?: ReactNode;
  /** Optional right-column slot. When provided, layout becomes bipartite
   * (eyebrow + title left, this slot right). Pass a `<p className="lede">`
   * for a right-aligned lede, or a button for split-CTA. */
  right?: ReactNode;
  /** Apply ink-on-peach styling for sections inside a peach banner. */
  variant?: 'dark' | 'peach';
}

/**
 * SectionHead — header used inside a `Section`. Two layouts:
 *   solo (eyebrow + title + optional sub stacked, max-width 720px)
 *   bipartite (eyebrow + title + optional sub left, `right` slot right)
 */
export function SectionHead({ eyebrow, title, sub, right, variant = 'dark' }: SectionHeadProps) {
  const ref = useScrollAnim<HTMLElement>();
  const peach = variant === 'peach';
  const bipartite = right !== undefined;
  const rightContent = typeof right === 'string' ? <p className="lede">{right}</p> : right;
  const subContent = typeof sub === 'string' ? <p className="lede">{sub}</p> : sub;

  return (
    <header
      ref={ref}
      className={[
        styles.head,
        bipartite ? styles.bipartite : styles.solo,
        peach ? styles.peach : '',
        'anim anim-up',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.left}>
        <span className="eyebrow">{eyebrow}</span>
        <h2 className={`h-section ${styles.title}`}>{title}</h2>
        {subContent ? subContent : null}
      </div>
      {bipartite ? <div className={styles.right}>{rightContent}</div> : null}
    </header>
  );
}
