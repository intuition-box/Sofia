import { Link, useLocation } from 'react-router-dom'
import styles from './Navbar.module.css'

/**
 * Navbar — Sofia · Chronicles chrome. Brand (internal) on the left,
 * the navigable surfaces in the center, the product CTA on the right.
 *
 * Only routes that exist are linked: the prototype's Tags/Authors
 * index + search + RSS have no backing pages/feed yet, so they're
 * intentionally omitted rather than shipped as dead controls.
 */
export function Navbar() {
  const { pathname } = useLocation()
  const onHome = pathname === '/'

  return (
    <nav className={styles.nv}>
      <div className={styles.left}>
        <Link to="/" className={styles.brand} aria-label="Sofia Chronicles">
          <img className={styles.mark} src="/img/logoWhite.svg" alt="Sofia" />
          <span className={styles.brandText}>
            <span className={styles.name}>
              Sofia <em>Chronicles</em>
            </span>
            <span className={styles.domain}>blog.sofia.intuition.box</span>
          </span>
        </Link>
      </div>

      <div className={styles.links}>
        <Link
          to="/"
          className={`${styles.link} ${onHome ? styles.active : ''}`}
        >
          Chronicles
        </Link>
        <a
          className={styles.link}
          href="https://sofia.intuition.box"
          target="_blank"
          rel="noopener noreferrer"
        >
          Landing
        </a>
        <a
          className={styles.link}
          href="https://doc.sofia.intuition.box"
          target="_blank"
          rel="noopener noreferrer"
        >
          Docs
        </a>
        <a
          className={styles.link}
          href="https://explorer.sofia.intuition.box"
          target="_blank"
          rel="noopener noreferrer"
        >
          Explorer
        </a>
      </div>

      <div className={styles.right}>
        <a
          className={styles.cta}
          href="https://sofia.intuition.box"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg
            className={styles.ctaIcon}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
          >
            <rect x="2" y="3" width="12" height="10" rx="2" />
            <path d="M5 7h6M5 10h4" strokeLinecap="round" />
          </svg>
          Install extension
        </a>
      </div>
    </nav>
  )
}
