import { Link } from 'react-router-dom'
import type { Post } from '~/lib/types'
import { parseDate } from '~/lib/format'
import { Tag } from './Tag'
import styles from './PostCard.module.css'

interface PostCardProps {
  post: Post
}

/**
 * PostCard — one row in any post list. The title is the real link; a
 * stretched ::after makes the whole card navigate to the post, while
 * the tag chips sit above the overlay so they remain independently
 * clickable (→ tag page). No nested anchors.
 */
export function PostCard({ post }: PostCardProps) {
  const { day } = parseDate(post.date)
  return (
    <article className={styles.pc}>
      <div className={styles.date}>
        <span className={styles.day}>{day}</span>
      </div>

      <div className={styles.body}>
        {post.kind !== 'logbook' && (
          <div className={styles.kicker}>
            {post.kind === 'story' ? 'Founding story' : 'Monthly review'}
          </div>
        )}
        <h3 className={styles.title}>
          <Link to={`/${post.slug}`} className={styles.titleLink}>
            {post.title}
          </Link>
        </h3>
        {post.excerpt && <p className={styles.excerpt}>{post.excerpt}</p>}
        {post.tags.length > 0 && (
          <div className={styles.tags}>
            {post.tags.map((t) => (
              <Tag key={t.id} tag={t} size="xs" />
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
