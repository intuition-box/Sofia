import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { findTagByRoute, tagColorVar } from '~/lib/tags'
import { postsByTag } from '~/lib/posts'
import { groupByMonth } from '~/lib/format'
import { PostCard } from '~/components/PostCard'
import { MonthBucket } from '~/components/MonthBucket'
import { NotFound } from './NotFound'
import styles from './TagPage.module.css'

/**
 * TagPage — `/tags/:idOrPermalink`. Tinted tag header, then the
 * matching posts bucketed by month. Unknown tags fall through to the
 * designed 404.
 */
export function TagPage() {
  const { id } = useParams<{ id: string }>()
  const tag = id ? findTagByRoute(id) : undefined

  useEffect(() => {
    if (tag) document.title = `${tag.label} — Sofia Chronicles`
  }, [tag])

  if (!tag) return <NotFound />

  const matching = postsByTag(tag.id)
  const buckets = groupByMonth(matching)
  const accent = tagColorVar(tag.id)

  return (
    <>
      <section className={`container ${styles.head}`}>
        <Link to="/" className={styles.back}>
          ← All posts
        </Link>
        <div className={styles.titleRow}>
          <h1 className={`h-disp ${styles.title}`}>
            <span
              className={styles.swatch}
              style={{ '--c': accent } as CSSProperties}
              aria-hidden="true"
            />
            <span className={styles.label}>
              <span style={{ color: accent } as CSSProperties}>#</span>
              {tag.label}
            </span>
          </h1>
        </div>
        <p className={`muted ${styles.desc}`}>
          {tag.description ? (
            tag.description
          ) : (
            <>
              Every week we touched{' '}
              <code
                className={styles.codeTag}
                style={{ color: accent } as CSSProperties}>
                {tag.id}
              </code>
              . Newest first.
            </>
          )}
        </p>
      </section>

      <section className={`container ${styles.listSection}`}>
        {buckets.length === 0 ? (
          <p className={styles.empty}>No posts under this tag yet.</p>
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
