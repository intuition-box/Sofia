import { useEffect, useState } from 'react'
import { useScrollAnim } from '../hooks/useScrollAnim'
import { Section } from './Section'
import { SectionHead } from './SectionHead'
import styles from './Carousel.module.css'

interface Slide {
  src: string
  title: string
  subtitle: string
}

const SLIDES: Slide[] = [
  {
    src: '/img/slides/homepage.png',
    title: 'Control your data. Trust your network.',
    subtitle: 'The Sofia homepage — TRUST or DISTRUST any page you visit.',
  },
  {
    src: '/img/slides/socials.png',
    title: 'Connect your socials.',
    subtitle:
      'Link X, Discord, YouTube, Twitch — build your on-chain identity from verified social proof.',
  },
  {
    src: '/img/slides/signals.png',
    title: 'Trust signals right where you browse.',
    subtitle: "See your network's signals on any page, ranked by TRUST staked.",
  },
  {
    src: '/img/slides/trendings.png',
    title: 'Browse the latest trendings.',
    subtitle:
      'Most certified URLs across all Sofia users — Trusted, Distrusted, by category.',
  },
  {
    src: '/img/slides/echoes.png',
    title: 'Your browsing, verified on-chain.',
    subtitle:
      'Echoes tracks your domains, URLs, on-chain certifications and time spent.',
  },
  {
    src: '/img/slides/circle.png',
    title: 'Connect with friends. Build your circle.',
    subtitle:
      'Circle Feed — content curated by your trust circle, filtered by intention.',
  },
  {
    src: '/img/slides/community.png',
    title: 'Vote on claims. Support or oppose.',
    subtitle:
      'Featured Claims from the Intuition community — stake TRUST to take a position.',
  },
  {
    src: '/img/slides/pulse.png',
    title: 'Pulse Analysis. Your AI knows you.',
    subtitle:
      'Your personal AI analyzes your sessions — research, explore, compare, plan.',
  },
  {
    src: '/img/slides/quest.png',
    title: 'Complete quests. Earn gold.',
    subtitle:
      'Daily, weekly and special quests — certify, vote, streak to earn rewards.',
  },
  {
    src: '/img/slides/bookmark.png',
    title: 'Smart bookmarks.',
    subtitle:
      'Search, sort, filter — your bookmarks enriched with on-chain data.',
  },
  {
    src: '/img/slides/statspage.png',
    title: 'Page stats.',
    subtitle:
      'Blockchain stats for any page — certifiers, TRUST staked, market cap.',
  },
  {
    src: '/img/slides/wieedzeprofil.png',
    title: 'Your profile.',
    subtitle:
      'ENS name, signals count, Gold earned, social badges — your on-chain reputation.',
  },
  {
    src: '/img/slides/user interest.png',
    title: 'Interest analysis.',
    subtitle:
      'AI-detected interests from your browsing — crypto finance, blockchain, collaboration tools.',
  },
]

const THUMB_WINDOW = 6

export function Carousel() {
  const [current, setCurrent] = useState(0)
  const stageRef = useScrollAnim<HTMLDivElement>()
  const total = SLIDES.length

  const prev = () => setCurrent((c) => (c === 0 ? total - 1 : c - 1))
  const next = () => setCurrent((c) => (c === total - 1 ? 0 : c + 1))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const slide = SLIDES[current]
  const counterMeta = `${String(current + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`

  // Thumb window: keep current centered when possible.
  const thumbStart = Math.max(0, Math.min(current - 2, total - THUMB_WINDOW))
  const thumbs = SLIDES.slice(thumbStart, thumbStart + THUMB_WINDOW)

  return (
    <Section id="showcase" code="S.04" label="INSTRUMENT" meta={counterMeta}>
      <SectionHead
        eyebrow="Product preview"
        title={
          <>
            Inside the product, <em>screen by screen.</em>
          </>
        }
      />

      <div className={styles.grid}>
        <div ref={stageRef} className={`${styles.stage} reveal`}>
          <div className={styles.imgWrap}>
            <button
              className={`${styles.arrow} ${styles.arrowLeft}`}
              onClick={prev}
              aria-label="Previous"
            >
              ‹
            </button>
            <img
              key={slide.src}
              src={slide.src}
              alt={slide.title}
              className={styles.image}
              draggable={false}
            />
            <button
              className={`${styles.arrow} ${styles.arrowRight}`}
              onClick={next}
              aria-label="Next"
            >
              ›
            </button>
          </div>
        </div>

        <div className={styles.info}>
          <span className={styles.counter}>
            <span className={styles.counterCur}>
              {String(current + 1).padStart(2, '0')}
            </span>
            <span className={styles.counterTot}>
              {String(total).padStart(2, '0')}
            </span>
          </span>
          <h3 className={styles.title}>{slide.title}</h3>
          <p className={styles.sub}>{slide.subtitle}</p>

          <div
            className={styles.rail}
            role="tablist"
            aria-label="Carousel slides"
          >
            {SLIDES.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === current}
                aria-label={`Slide ${i + 1}`}
                className={`${styles.pip} ${i === current ? styles.pipOn : ''}`}
                onClick={() => setCurrent(i)}
              />
            ))}
          </div>

          <div className={styles.thumbs}>
            {thumbs.map((t, i) => {
              const idx = thumbStart + i
              return (
                <button
                  key={t.src}
                  className={`${styles.thumb} ${idx === current ? styles.thumbOn : ''}`}
                  onClick={() => setCurrent(idx)}
                  aria-label={`Show slide ${idx + 1}`}
                >
                  <img src={t.src} alt="" />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </Section>
  )
}
