import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { findAuthorByRoute } from '~/lib/authors'
import { postsByAuthor } from '~/lib/posts'
import { MONTHS, groupByMonth, parseDate } from '~/lib/format'
import { PostCard } from '~/components/PostCard'
import { MonthBucket } from '~/components/MonthBucket'
import { NotFound } from './NotFound'
import styles from './AuthorPage.module.css'

/**
 * AuthorPage — `/authors/:idOrPermalink`. Real GitHub avatar + bio +
 * role + post count, then the author's posts bucketed by month.
 * Unknown authors fall through to the designed 404.
 */
export function AuthorPage() {
  const { id } = useParams<{ id: string }>()
  const author = id ? findAuthorByRoute(id) : undefined

  useEffect(() => {
    if (author) document.title = `${author.name} — Sofia Chronicles`
  }, [author])

  if (!author) return <NotFound />

  const posts = postsByAuthor(author.id)
  const buckets = groupByMonth(posts)
  const earliest = posts[posts.length - 1]
  const since = earliest
    ? `${MONTHS[
        Math.max(0, parseDate(earliest.date).month - 1)
      ].toLowerCase()} ${parseDate(earliest.date).year}`
    : ''

  return (
    <>
      <section className={`container ${styles.head}`}>
        <div className={styles.identity}>
          {author.imageUrl ? (
            <img
              className={styles.avatar}
              src={author.imageUrl}
              alt={author.name}
            />
          ) : (
            <div className={styles.avatarFallback} aria-hidden="true">
              {author.name.charAt(0)}
            </div>
          )}
          <div className={styles.identText}>
            <div className="eyebrow">
              <span className="dot" /> AUTHOR · @{author.id}
            </div>
            <h1 className={`h-disp ${styles.name}`}>
              {author.name}
              <em>.</em>
            </h1>
            {author.bio && <p className={styles.bio}>{author.bio}</p>}
            <div className={styles.metaLine}>
              {author.title && (
                <span className={styles.strong}>{author.title}</span>
              )}
              <span className={styles.dim}>·</span>
              <span>
                <span className={styles.strong}>{posts.length}</span> posts
              </span>
              {since && (
                <>
                  <span className={styles.dim}>·</span>
                  <span>
                    writing since <span className={styles.strong}>{since}</span>
                  </span>
                </>
              )}
            </div>
            {author.socials && (
              <div className={styles.socials}>
                {author.socials.x && (
                  <a
                    href={`https://x.com/${author.socials.x}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    X ↗
                  </a>
                )}
                {author.socials.linkedin && (
                  <a
                    href={`https://linkedin.com/in/${author.socials.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    LinkedIn ↗
                  </a>
                )}
                {author.socials.github && (
                  <a
                    href={`https://github.com/${author.socials.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub ↗
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className={`container ${styles.listSection}`}>
        <div className={`eyebrow ${styles.listTitle}`}>
          <b>Posts by {author.name}</b>
        </div>
        {buckets.length === 0 ? (
          <p className={styles.empty}>No posts from this author yet.</p>
        ) : (
          buckets.map(([key, items]) => (
            <div key={key}>
              <MonthBucket iso={key} count={items.length} />
              {items.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          ))
        )}
      </section>
    </>
  )
}
