import { Link } from 'react-router-dom'
import styles from './BlogPost.module.css'

/**
 * NotFound — generic 404 for unknown routes. Mirrors the BlogPost
 * not-found block so the visual treatment is consistent across the
 * blog's error states.
 */
export function NotFound() {
  return (
    <div className={styles.notFound}>
      <h1 className={styles.notFoundTitle}>Page not found.</h1>
      <p className="lede">
        The URL you followed doesn&apos;t match any blog route.
      </p>
      <Link to="/" className={styles.notFoundLink}>
        ← Back to all posts
      </Link>
    </div>
  )
}
