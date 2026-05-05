import type { ReactNode } from 'react';
import { useScrollAnim } from '../hooks/useScrollAnim';
import { useTextSplit } from '../hooks/useTextSplit';
import styles from './ModuleHead.module.css';

interface ModuleHeadProps {
  eyebrow: string;
  /** Title content — pass <em> spans inline for italic accents. */
  title: ReactNode;
  /** Right slot — typically a `<p>` paragraph or a CTA button. */
  right: ReactNode;
  /** Apply ink-on-peach styling for sections inside a peach banner. */
  variant?: 'dark' | 'peach';
}

/**
 * ModuleHead — bipartite section header used inside a `Module`.
 *
 * Two columns at desktop (eyebrow + title on the left, right slot on
 * the right) collapsing to a single column on mobile. Title gets the
 * useTextSplit reveal; the wrapper picks up the useScrollAnim observer.
 */
export function ModuleHead({ eyebrow, title, right, variant = 'dark' }: ModuleHeadProps) {
  const wrapRef = useScrollAnim<HTMLDivElement>();
  const titleRef = useTextSplit<HTMLHeadingElement>({ by: 'word' });

  return (
    <div
      ref={wrapRef}
      className={`${styles.head} ${variant === 'peach' ? styles.peach : ''} anim anim-up`}
    >
      <div className={styles.left}>
        <span className="mono-eyebrow">{eyebrow}</span>
        <h2 ref={titleRef} className={`section-title anim ${styles.title}`}>
          {title}
        </h2>
      </div>
      <div className={styles.right}>{right}</div>
    </div>
  );
}
