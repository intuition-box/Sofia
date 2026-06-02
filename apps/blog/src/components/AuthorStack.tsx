import type { CSSProperties } from 'react'
import type { Author } from '~/lib/types'
import styles from './AuthorStack.module.css'

interface AuthorStackProps {
  authors: Author[]
  /** Avatar diameter in px (overlap scales with it). */
  size?: number
}

/**
 * AuthorStack — overlapping circular author avatars. Uses the real
 * GitHub photo (`imageUrl`); falls back to the name initial on the
 * card surface if a photo is missing.
 */
export function AuthorStack({ authors, size = 22 }: AuthorStackProps) {
  const dim: CSSProperties = { width: size, height: size }
  return (
    <span className={styles.stack}>
      {authors.map((a) =>
        a.imageUrl ? (
          <img
            key={a.id}
            className={styles.avatar}
            src={a.imageUrl}
            alt={a.name}
            style={dim}
            loading="lazy"
          />
        ) : (
          <span
            key={a.id}
            className={styles.avatar}
            style={{ ...dim, fontSize: Math.max(10, size * 0.46) }}
            aria-label={a.name}
          >
            {a.name.charAt(0)}
          </span>
        ),
      )}
    </span>
  )
}
