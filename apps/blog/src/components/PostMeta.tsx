import { Link } from 'react-router-dom'
import type { Post } from '~/lib/types'
import styles from './PostMeta.module.css'

interface PostMetaProps {
  post: Post
}

/**
 * PostMeta — full attribution strip for the article page. Each author
 * links to their dedicated author page when one exists (configured in
 * authors.yml via `page: true` or `page: { permalink }`). Tags link
 * to the tag filter page.
 */
export function PostMeta({ post }: PostMetaProps) {
  return (
    <div className={styles.meta}>
      <div className={styles.dateRow}>
        <span>{post.dateLabel}</span>
        {post.tags.length > 0 && (
          <>
            <span className={styles.dot} aria-hidden="true" />
            <div className={styles.tagRow}>
              {post.tags.map((t) => (
                <Link
                  key={t.id}
                  to={`/tags/${t.permalink || t.id}`}
                  className={styles.tag}>
                  {t.label}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
      {post.authors.length > 0 && (
        <div className={styles.authorList}>
          {post.authors.map((a) => {
            const inner = (
              <>
                {a.imageUrl && (
                  <img src={a.imageUrl} alt="" className={styles.avatar} />
                )}
                <span>
                  <span className={styles.authorName}>{a.name}</span>
                  {a.title && (
                    <span className={styles.authorRole}>{a.title}</span>
                  )}
                </span>
              </>
            )
            return (
              <span key={a.id} className={styles.author}>
                {a.permalink ? (
                  <Link to={`/authors/${a.permalink}`}>{inner}</Link>
                ) : (
                  <Link to={`/authors/${a.id}`}>{inner}</Link>
                )}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
