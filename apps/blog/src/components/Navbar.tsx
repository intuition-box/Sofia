import { Link } from 'react-router-dom'
import styles from './Navbar.module.css'

/**
 * Navbar — Sofia brand + lightweight nav back to the landing /
 * explorer / docs. The blog has no auth or wallet of its own so the
 * right cluster stays minimal compared to the landing.
 */
export function Navbar() {
  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>
        <a
          href="https://sofia.intuition.box"
          className={styles.logo}
          aria-label="Sofia home">
          <img src="/img/logo-black.png" alt="Sofia" />
        </a>
        <span className={styles.brandSep}>Chronicles</span>
      </div>

      <div className={styles.right}>
        <Link to="/">All posts</Link>
        <a
          href="https://sofia.intuition.box"
          target="_blank"
          rel="noopener noreferrer">
          Landing
        </a>
        <a
          href="https://doc.sofia.intuition.box"
          target="_blank"
          rel="noopener noreferrer">
          Docs
        </a>
        <a
          href="https://explorer.sofia.intuition.box"
          target="_blank"
          rel="noopener noreferrer">
          Explorer
        </a>
      </div>
    </nav>
  )
}
