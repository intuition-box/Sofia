import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import { PostMeta } from '~/components/PostMeta'
import { POSTS_BY_SLUG } from '~/lib/posts'
import styles from './BlogPost.module.css'

/**
 * BlogPost — `/blog/:slug`. Looks up the compiled MDX component from
 * the loader's slug map and renders it inside a `.prose` wrapper. The
 * MDXProvider stays in case future posts want to inject custom MDX
 * components (callouts, embeds, etc.) — for now it's a passthrough.
 */
export function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const post = slug ? POSTS_BY_SLUG[slug] : undefined

  useEffect(() => {
    if (post) {
      document.title = `${post.title} — Sofia Chronicles`
    }
  }, [post])

  if (!post) {
    return (
      <div className={styles.notFound}>
        <h1 className={styles.notFoundTitle}>Post not found.</h1>
        <p className="lede">
          The URL you followed doesn&apos;t match any chronicles entry.
        </p>
        <Link to="/" className={styles.notFoundLink}>
          ← Back to all posts
        </Link>
      </div>
    )
  }

  const Content = post.Content

  return (
    <article className={styles.article}>
      <header className={styles.header}>
        <Link to="/" className={styles.backLink}>
          ← All posts
        </Link>
        <h1 className={`h-display ${styles.title}`}>{post.title}</h1>
        <PostMeta post={post} />
      </header>
      <div className={styles.body}>
        <div className="prose">
          <MDXProvider>
            <Content />
          </MDXProvider>
        </div>
      </div>
    </article>
  )
}
