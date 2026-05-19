import { Link, useLocation } from 'react-router-dom'
import { getLatestLogbook } from '~/lib/posts'
import styles from './NotFound.module.css'

/**
 * NotFound — the designed 404. Also reused as the fallback when a
 * `/:slug`, `/tags/:id` or `/authors/:id` lookup misses, so the
 * error treatment is consistent everywhere.
 */
export function NotFound() {
  const { pathname } = useLocation()
  const latest = getLatestLogbook()

  return (
    <div className={styles.nf}>
      <div className={styles.glyph}>404</div>
      <h1 className={`h-disp h-disp--md ${styles.title}`}>
        <em>Lost</em> in the graph.
      </h1>
      <p className={`muted ${styles.msg}`}>
        This page doesn&apos;t exist — maybe it never did, maybe it was
        unpublished. When in doubt, start from the most recent logbook.
      </p>
      <div className={styles.actions}>
        {latest && (
          <Link to={`/${latest.slug}`} className={styles.ctaPrimary}>
            ← Read the latest logbook
          </Link>
        )}
        <Link to="/" className={styles.ctaGhost}>
          Browse all posts
        </Link>
      </div>
      <div className={styles.readout}>
        <span>requested · /{pathname.replace(/^\//, '') || 'unknown'}</span>
        <span className={styles.dim}>·</span>
        <span>error 404</span>
      </div>
    </div>
  )
}
