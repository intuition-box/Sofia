import type { ReactNode } from 'react';
import { useScrollAnim } from '../hooks/useScrollAnim';
import { useTextSplit } from '../hooks/useTextSplit';
import styles from './ModuleHead.module.css';

interface ModuleHeadProps {
  eyebrow: string;
  /** Title content — pass <em> spans inline for italic accents. */
  title: ReactNode;
  /** Right slot — typically a `<p>` paragraph or a CTA button. Optional. */
  right?: ReactNode;
  /** Optional descriptive paragraph rendered below the title (left column). */
  sub?: ReactNode;
  /** Apply ink-on-peach styling for sections inside a peach banner. */
  variant?: 'dark' | 'peach';
}

/**
 * ModuleHead — section header used inside a `Module`.
 *
 * Three layouts:
 *   - eyebrow + title only
 *   - eyebrow + title + sub paragraph (single column)
 *   - eyebrow + title (+ optional sub) on the left, right slot on the right
 */
export function ModuleHead({ eyebrow, title, right, sub, variant = 'dark' }: ModuleHeadProps) {
  const wrapRef = useScrollAnim<HTMLDivElement>();
  const titleRef = useTextSplit<HTMLHeadingElement>({ by: 'word' });

  return (
    <div
      ref={wrapRef}
      className={`${styles.head} ${variant === 'peach' ? styles.peach : ''} ${right ? styles.bipartite : styles.solo} anim anim-up`}
    >
      <div className={styles.left}>
        <span className="mono-eyebrow">{eyebrow}</span>
        <h2 ref={titleRef} className={`section-title anim ${styles.title}`}>
          {title}
        </h2>
        {sub ? <div className={styles.sub}>{sub}</div> : null}
      </div>
      {right ? <div className={styles.right}>{right}</div> : null}
    </div>
  );
}
