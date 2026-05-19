import { monthLabel } from '~/lib/format'
import styles from './MonthBucket.module.css'

interface MonthBucketProps {
  /** `YYYY-MM` (or any ISO date) for the bucket. */
  iso: string
  count: number
}

/**
 * MonthBucket — the month divider that makes 26 near-identically
 * titled logbooks scannable. Month in italic Fraunces, year + count
 * in mono.
 */
export function MonthBucket({ iso, count }: MonthBucketProps) {
  const { label, year } = monthLabel(iso)
  return (
    <header className={styles.mb}>
      <span className={styles.month}>{label}</span>
      <span className={styles.year}>{year}</span>
      <span className={styles.count}>
        {String(count).padStart(2, '0')} {count > 1 ? 'entries' : 'entry'}
      </span>
    </header>
  )
}
