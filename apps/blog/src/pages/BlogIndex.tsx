import { useEffect } from 'react'
import { PostCard } from '~/components/PostCard'
import { POSTS } from '~/lib/posts'
import styles from './BlogIndex.module.css'

/**
 * BlogIndex — the `/` route. Posts arrive pre-sorted (newest first)
 * from the loader so we only have to lay them out.
 */
export function BlogIndex() {
  useEffect(() => {
    document.title = 'Sofia Chronicles — the public build log'
  }, [])

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={`eyebrow ${styles.heroEyebrow}`}>Build log</span>
          <h1 className={`h-display ${styles.heroTitle}`}>
            Sofia <em>Chronicles.</em>
          </h1>
          <p className={`lede ${styles.heroLede}`}>
            A public build log — every two weeks, what was done, what was
            tried, what was scrapped. No pitch, no dressed-up roadmap — just
            what the team actually shipped.
          </p>
        </div>
      </section>

      <section className={styles.list}>
        {POSTS.length === 0 ? (
          <p className={styles.empty}>No posts yet.</p>
        ) : (
          POSTS.map((post) => <PostCard key={post.slug} post={post} />)
        )}
      </section>
    </>
  )
}
