import { useEffect } from 'react'
import { ALL_AUTHORS } from '~/lib/authors'
import { getMonthlyReview, getStory, logbooks } from '~/lib/posts'
import { groupByMonth } from '~/lib/format'
import { HeroCard } from '~/components/HeroCard'
import { PostCard } from '~/components/PostCard'
import { MonthBucket } from '~/components/MonthBucket'
import { AuthorStack } from '~/components/AuthorStack'
import styles from './BlogIndex.module.css'

/**
 * BlogIndex — `/`. Header → pinned Story + Monthly hero row → weekly
 * logbooks bucketed by month. Month buckets + date-led cards are the
 * design's answer to "26 near-identical logbook titles".
 */
export function BlogIndex() {
  useEffect(() => {
    document.title = 'Sofia Chronicles — the public build log'
  }, [])

  const story = getStory()
  const monthly = getMonthlyReview()
  const logs = logbooks()
  const buckets = groupByMonth(logs)
  const authorNames = ALL_AUTHORS.map((a) => a.name).join(' & ')

  return (
    <>
      <section className={`container ${styles.head}`}>
        <h1 className={`h-disp ${styles.title}`}>
          Sofia <em>Chronicles.</em>
        </h1>
        <p className={`muted ${styles.lede}`}>
          A browser extension that learns who you trust, built on the
          Intuition protocol. {authorNames} publish a logbook every week —
          what shipped, what stalled, what we learned along the way.
        </p>
        <div className={styles.byline}>
          <div className={styles.bylineWho}>
            <AuthorStack authors={ALL_AUTHORS} size={28} />
            <span className={styles.bylineMeta}>By {authorNames}</span>
          </div>
        </div>
      </section>

      {(story || monthly) && (
        <section className={`container ${styles.heroSection}`}>
          <div className={styles.heroRow}>
            {story && <HeroCard post={story} />}
            {monthly && <HeroCard post={monthly} />}
          </div>
        </section>
      )}

      <section className={`container ${styles.listSection}`}>
        <div className={styles.listHead}>
          <div className="eyebrow">
            <b>Weekly logbooks</b> · {logs.length} entries
          </div>
          <div className={styles.sorted}>Sorted · newest first</div>
        </div>
        {buckets.map(([key, items]) => (
          <div key={key}>
            <MonthBucket iso={key} count={items.length} />
            {items.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        ))}
      </section>
    </>
  )
}
