import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import type { CSSProperties } from 'react'
import { POSTS, POSTS_BY_SLUG } from '~/lib/posts'
import { MONTHS_LONG, parseDate } from '~/lib/format'
import { tagColorVar } from '~/lib/tags'
import type { PostKind } from '~/lib/types'
import { Tag } from '~/components/Tag'
import { AuthorStack } from '~/components/AuthorStack'
import { useToc } from '~/components/useToc'
import { NotFound } from './NotFound'
import styles from './BlogPost.module.css'

const KIND_LABEL: Record<PostKind, string> = {
  logbook: 'Weekly logbook',
  story: 'Founding story',
  monthly: 'Monthly review',
}

/**
 * BlogPost — `/:slug`. Long-form reading: crumb row, editorial header
 * (title with a tag-tinted period, lede, meta), the MDX body with an
 * optional sticky TOC for long posts, then prev/next within the same
 * archetype. Unknown slugs fall through to the designed 404.
 */
export function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const post = slug ? POSTS_BY_SLUG[slug] : undefined
  const { ref, headings, activeId } = useToc(slug)

  useEffect(() => {
    if (post) document.title = `${post.title} — Sofia Chronicles`
  }, [post])

  if (!post) return <NotFound />

  const { day, month, year } = parseDate(post.date)
  const Content = post.Content
  const accent = tagColorVar(post.tags[0]?.id ?? '')
  const showToc = headings.length >= 2

  const sameKind = POSTS.filter((p) => p.kind === post.kind)
  const idx = sameKind.indexOf(post)
  const prev = sameKind[idx + 1] // older
  const next = sameKind[idx - 1] // newer
  const titleHead = post.title.replace(/\.$/, '')

  return (
    <article className={styles.art}>
      <div className="container">
        <div className={styles.crumbs}>
          <Link to="/" className={styles.backBtn} aria-label="All posts">
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M10 3L5 8l5 5" />
            </svg>
          </Link>
          <span className={styles.crumbMeta}>
            {KIND_LABEL[post.kind]}
            <span className={styles.sep}>·</span>
            {MONTHS_LONG[Math.max(0, month - 1)]} {day}, {year}
          </span>
        </div>

        <header className={styles.head}>
          <h1 className={styles.title}>
            {titleHead}
            <em style={{ color: accent } as CSSProperties}>.</em>
          </h1>
          {post.excerpt && <p className={styles.lede}>{post.excerpt}</p>}
          <div className={styles.metaRow}>
            <div className={styles.metaTags}>
              {post.tags.map((t) => (
                <Tag key={t.id} tag={t} size="xs" />
              ))}
            </div>
            <span className={styles.metaSep} />
            <AuthorStack authors={post.authors} size={26} />
            <span className={styles.authors}>
              {post.authors.map((a) => a.name).join(' & ')}
            </span>
          </div>
        </header>

        <div className={showToc ? styles.bodyGrid : styles.bodyPlain}>
          <div className="prose" ref={ref}>
            <MDXProvider>
              <Content />
            </MDXProvider>
          </div>
          {showToc && (
            <>
              <div aria-hidden="true" />
              <aside className={styles.toc}>
                <div className={styles.tocTitle}>In this episode</div>
                <ul className={styles.tocList}>
                  {headings.map((h, i) => (
                    <li key={h.id}>
                      <a
                        href={`#${h.id}`}
                        className={`${styles.tocLink} ${
                          activeId === h.id ? styles.tocActive : ''
                        }`}
                      >
                        {String(i + 1).padStart(2, '0')}.&nbsp;&nbsp;{h.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </aside>
            </>
          )}
        </div>

        <div className={styles.endBlock}>
          <div className={styles.endMeta}>
            <span>End · {post.slug}</span>
            <span>{KIND_LABEL[post.kind]}</span>
          </div>
          {(prev || next) && (
            <div className={styles.prevNext}>
              {prev && (
                <Link to={`/${prev.slug}`} className={styles.pnCard}>
                  <span className={styles.pnLabel}>← Previous</span>
                  <span className={styles.pnTitle}>{prev.title}</span>
                </Link>
              )}
              {next && (
                <Link
                  to={`/${next.slug}`}
                  className={`${styles.pnCard} ${styles.pnRight}`}
                >
                  <span className={styles.pnLabel}>Next →</span>
                  <span className={styles.pnTitle}>{next.title}</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
