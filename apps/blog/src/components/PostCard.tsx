import { Link } from 'react-router-dom'
import type { Post } from '~/lib/types'
import styles from './PostCard.module.css'

interface PostCardProps {
  post: Post
}

/**
 * PostCard — single row in the blog index. Date · authors · title ·
 * excerpt · tag chips. Authors render with a 18px avatar mini-stack so
 * the human side reads at a glance.
 */
export function PostCard({ post }: PostCardProps) {
  return (
    <Link to={`/${post.slug}`} className={styles.card} aria-label={post.title}>
      <div className={styles.metaRow}>
        <span>{post.dateLabel}</span>
        {post.authors.length > 0 && (
          <>
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.authors}>
              {post.authors.map((a) => (
                <span key={a.id}>
                  {a.imageUrl && (
                    <img
                      src={a.imageUrl}
                      alt=""
                      className={styles.authorAvatar}
                      loading="lazy"
                    />
                  )}{' '}
                  {a.name}
                </span>
              ))}
            </span>
          </>
        )}
      </div>
      <h2 className={styles.title}>{post.title}</h2>
      {post.excerpt && <p className={styles.excerpt}>{post.excerpt}</p>}
      {post.tags.length > 0 && (
        <div className={styles.tagRow}>
          {post.tags.map((t) => (
            <span key={t.id} className={styles.tag}>
              {t.label}
            </span>
          ))}
        </div>
      )}
    </Link>
  )
}
