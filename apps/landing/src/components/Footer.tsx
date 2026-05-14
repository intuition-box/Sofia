import { URLS } from '../lib/config/urls'
import styles from './Footer.module.css'

const RESOURCES = [
  { label: 'Manifesto', href: URLS.docs.manifesto },
  { label: 'Docs', href: URLS.docs.intro },
  { label: 'Blog', href: URLS.blog.index },
]

const COMMUNITY = [
  { label: 'Discord', href: URLS.external.discord },
  { label: 'X', href: URLS.external.x },
  { label: 'GitHub', href: URLS.external.github },
  { label: 'Explorer', href: URLS.external.board },
]

const LEGAL = [
  { label: 'Privacy', href: URLS.docs.privacy },
  { label: 'Terms', href: URLS.docs.privacy },
]

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <img src="/img/logo-black.png" alt="Sofia" className="logo-invert" />
            <p>
              From surfing the web to owning it. Your actions become your
              identity, not your claims.
            </p>
          </div>

          <div className={styles.col}>
            <h4 className={styles.colTitle}>Resources</h4>
            <ul className={styles.links}>
              {RESOURCES.map((l) => (
                <li key={l.label}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.col}>
            <h4 className={styles.colTitle}>Community</h4>
            <ul className={styles.links}>
              {COMMUNITY.map((l) => (
                <li key={l.label}>
                  <a href={l.href} target="_blank" rel="noopener noreferrer">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.col}>
            <h4 className={styles.colTitle}>Legal</h4>
            <ul className={styles.links}>
              {LEGAL.map((l) => (
                <li key={l.label}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.bot}>
          <span>© Sofia · 2026</span>
          <span>Built on Intuition · Open-source</span>
        </div>
      </div>
    </footer>
  )
}
