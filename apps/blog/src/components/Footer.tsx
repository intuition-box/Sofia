import styles from './Footer.module.css'

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span className={styles.copy}>
          © Sofia · {new Date().getFullYear()} · Open source
        </span>
        <div className={styles.links}>
          <a
            href="https://github.com/intuition-box"
            target="_blank"
            rel="noopener noreferrer">
            GitHub
          </a>
          <a
            href="https://discord.gg/sofia3"
            target="_blank"
            rel="noopener noreferrer">
            Discord
          </a>
          <a
            href="https://doc.sofia.intuition.box"
            target="_blank"
            rel="noopener noreferrer">
            Docs
          </a>
        </div>
      </div>
    </footer>
  )
}
