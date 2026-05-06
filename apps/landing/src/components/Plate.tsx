import type { ReactNode } from 'react';
import styles from './Plate.module.css';

interface PlateProps {
  /** Tag badge — e.g. "PLATE.C". */
  tag: string;
  /** Plate title — e.g. "Three circles · attention relief". */
  title: string;
  /** Right-side mono meta strings (one or many). */
  meta?: string[];
  /** Mono foot strings (one or many). */
  foot?: string[];
  /** SVG content (TopicsIntentions / IsoStack / ThreeCircles). */
  children: ReactNode;
  /** Extra className on the outer wrapper. */
  className?: string;
}

/**
 * Plate — shared engineering-card frame wrapping any of the SVG
 * micrographics. Use across Hero, Features, and Steps so all plates
 * read with one visual vocabulary.
 */
export function Plate({ tag, title, meta = [], foot = [], children, className = '' }: PlateProps) {
  return (
    <div className={`${styles.plate} ${className}`}>
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
      <div className={styles.body}>{children}</div>
      {foot.length > 0 && (
        <div className={styles.foot}>
          {foot.map((f) => (
            <span key={f}>{f}</span>
          ))}
        </div>
      )}
    </div>
  );
}
