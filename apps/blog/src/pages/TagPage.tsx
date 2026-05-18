import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PostCard } from '~/components/PostCard'
import { findTagByRoute } from '~/lib/tags'
import { postsByTag } from '~/lib/posts'
import styles from './AuthorPage.module.css'

/**
 * TagPage — `/tags/:idOrPermalink`. Same shape as AuthorPage:
 * accepts either the raw tag id or its custom permalink. Re-uses
 * AuthorPage.module.css since the hero / list visuals match.
 */
export function TagPage() {
  const { id } = useParams<{ id: string }>()
  const tag = id ? findTagByRoute(id) : undefined
  const posts = tag ? postsByTag(tag.id) : []

  useEffect(() => {
    if (tag) {
      document.title = `${tag.label} — Sofia Chronicles`
    }
  }, [tag])

  if (!tag) {
    return (
      <section className={styles.list}>
        <p className={styles.empty}>Tag not found.</p>
        <Link to="/" className={styles.backLink}>
          ← All posts
        </Link>
      </section>
    )
  }

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <Link to="/" className={styles.backLink}>
            ← All posts
          </Link>
          <span className={`eyebrow ${styles.heroEyebrow}`}>Tag</span>
          <h1 className={styles.title}>{tag.label}</h1>
          {tag.description && (
            <p className={`lede ${styles.tagDesc}`}>{tag.description}</p>
          )}
        </div>
      </section>

      <section className={styles.list}>
        {posts.length === 0 ? (
          <p className={styles.empty}>No posts under this tag yet.</p>
        ) : (
          posts.map((post) => <PostCard key={post.slug} post={post} />)
        )}
      </section>
    </>
  )
}
