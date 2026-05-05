import { URLS } from '../lib/config/urls';
import styles from './Footer.module.css';

const NAV_LINKS = [
  { label: 'Manifesto', href: URLS.docs.manifesto },
  { label: 'Docs', href: URLS.docs.intro },
  { label: 'Blog', href: URLS.blog.index },
];

const SOCIAL_LINKS = [
  { label: 'Discord', href: URLS.external.discord },
  { label: 'X', href: URLS.external.x },
  { label: 'GitHub', href: URLS.external.github },
  { label: 'Explorer', href: URLS.external.board },
  { label: 'Proxy Dashboard', href: URLS.external.proxyDashboard },
];

const LEGAL_LINKS = [
  { label: 'Privacy', href: 'https://sofia.intuition.box/privacy' },
  { label: 'Terms', href: 'https://sofia.intuition.box/terms' },
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.columns}>
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Resources</h4>
            <ul className={styles.links}>
              {NAV_LINKS.map((l) => (
                <li key={l.label}><a href={l.href}>{l.label}</a></li>
              ))}
            </ul>
          </div>
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Community</h4>
            <ul className={styles.links}>
              {SOCIAL_LINKS.map((l) => (
                <li key={l.label}><a href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a></li>
              ))}
            </ul>
          </div>
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Legal</h4>
            <ul className={styles.links}>
              {LEGAL_LINKS.map((l) => (
                <li key={l.label}><a href={l.href}>{l.label}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className={styles.copy}>
          <img src="/img/sofiaLogo.png" alt="Sofia" className="footer-logo" />
          <span>&copy; Sofia 2026</span>
        </div>
      </div>
    </footer>
  );
}
