import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { Post } from '~/lib/types'
import { MONTHS, parseDate } from '~/lib/format'
import { tagColorVar } from '~/lib/tags'
import { Tag } from './Tag'
import styles from './HeroCard.module.css'

interface HeroCardProps {
  post: Post
}

/**
 * HeroCard — the pinned Story / Monthly Review treatment. The title is
 * the real link with a stretched ::after covering the card; tag chips
 * sit above the overlay so they stay independently clickable.
 */
export function HeroCard({ post }: HeroCardProps) {
  const { day, month, year } = parseDate(post.date)
  const isStory = post.kind === 'story'
  const accent = tagColorVar(post.tags[0]?.id ?? '')

  return (
    <article
      className={`${styles.hero} ${isStory ? styles.kindStory : ''}`}
      style={{ '--tag-c': accent } as CSSProperties}>
      <span className={styles.pin}>
        <span className={styles.pinDot} aria-hidden="true" />
        {isStory ? 'Founding story · pinned' : 'Monthly review'}
      </span>

      <h2 className={`h-disp h-disp--md ${styles.title}`}>
        <Link to={`/${post.slug}`} className={styles.titleLink}>
          {post.title}
        </Link>
      </h2>

      {post.excerpt && <p className={styles.lede}>{post.excerpt}</p>}

      <div className={`eyebrow ${styles.eyebrow}`}>
        <span>
          {MONTHS[Math.max(0, month - 1)]} {day}, {year}
        </span>
      </div>

      <div className={styles.meta}>
        <div className={styles.tags}>
          {post.tags.slice(0, 3).map((t) => (
            <Tag key={t.id} tag={t} size="xs" />
          ))}
        </div>
        <span className={styles.read}>Read →</span>
      </div>
    </article>
  )
}
