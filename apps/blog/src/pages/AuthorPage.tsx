import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PostCard } from '~/components/PostCard'
import { findAuthorByRoute } from '~/lib/authors'
import { postsByAuthor } from '~/lib/posts'
import styles from './AuthorPage.module.css'

/**
 * AuthorPage — `/authors/:idOrPermalink`. Accepts either the raw
 * author id (e.g. `/authors/Maxime`) or a custom permalink configured
 * in authors.yml (e.g. `/authors/all-Samuel-Chauche-articles`). The
 * loader's permalink lookup handles both.
 */
export function AuthorPage() {
  const { id } = useParams<{ id: string }>()
  const author = id ? findAuthorByRoute(id) : undefined
  const posts = author ? postsByAuthor(author.id) : []

  useEffect(() => {
    if (author) {
      document.title = `${author.name} — Sofia Chronicles`
    }
  }, [author])

  if (!author) {
    return (
      <section className={styles.list}>
        <p className={styles.empty}>Author not found.</p>
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
          <span className={`eyebrow ${styles.heroEyebrow}`}>Author</span>
          <div className={styles.authorRow}>
            {author.imageUrl && (
              <img
                src={author.imageUrl}
                alt={author.name}
                className={styles.avatar}
              />
            )}
            <div className={styles.authorIdent}>
              <h1 className={styles.title}>{author.name}</h1>
              {author.title && (
                <span className={styles.role}>{author.title}</span>
              )}
            </div>
          </div>
          {author.socials && (
            <div className={styles.socials}>
              {author.socials.x && (
                <a
                  href={`https://x.com/${author.socials.x}`}
                  target="_blank"
                  rel="noopener noreferrer">
                  X
                </a>
              )}
              {author.socials.linkedin && (
                <a
                  href={`https://linkedin.com/in/${author.socials.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer">
                  LinkedIn
                </a>
              )}
              {author.socials.github && (
                <a
                  href={`https://github.com/${author.socials.github}`}
                  target="_blank"
                  rel="noopener noreferrer">
                  GitHub
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      <section className={styles.list}>
        {posts.length === 0 ? (
          <p className={styles.empty}>No posts from this author yet.</p>
        ) : (
          posts.map((post) => <PostCard key={post.slug} post={post} />)
        )}
      </section>
    </>
  )
}
