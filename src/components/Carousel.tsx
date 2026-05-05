import { useState } from 'react';
import { useParallax } from '../hooks/useParallax';
import styles from './Carousel.module.css';

interface Slide {
  src: string;
  title: string;
  subtitle: string;
}

const SLIDES: Slide[] = [
  { src: '/img/slides/homepage.png', title: 'Control your data. Trust your network.', subtitle: 'The Sofia homepage — TRUST or DISTRUST any page you visit.' },
  { src: '/img/slides/socials.png', title: 'Connect Your Socials.', subtitle: 'Link X, Discord, YouTube, Twitch — build your on-chain identity from verified social proof.' },
  { src: '/img/slides/signals.png', title: 'Trust signals right where you browse.', subtitle: 'See your network\'s signals on any page, ranked by TRUST staked.' },
  { src: '/img/slides/trendings.png', title: 'Browse the latest Trendings.', subtitle: 'Most certified URLs across all Sofia users — Trusted, Distrusted, by category.' },
  { src: '/img/slides/echoes.png', title: 'Your browsing, verified on-chain.', subtitle: 'Echoes tracks your domains, URLs, on-chain certifications and time spent.' },
  { src: '/img/slides/circle.png', title: 'Connect with friends. Build your circle.', subtitle: 'Circle Feed — content curated by your trust circle, filtered by intention.' },
  { src: '/img/slides/community.png', title: 'Vote on claims. Support or Oppose.', subtitle: 'Featured Claims from the Intuition community — stake TRUST to take a position.' },
  { src: '/img/slides/pulse.png', title: 'Pulse Analysis. Your AI knows you.', subtitle: 'Your personal AI analyzes your sessions — research, explore, compare, plan.' },
  { src: '/img/slides/quest.png', title: 'Complete Quests. Earn Gold.', subtitle: 'Daily, weekly and special quests — certify, vote, streak to earn rewards.' },
  { src: '/img/slides/bookmark.png', title: 'Smart Bookmarks.', subtitle: 'Search, sort, filter — your bookmarks enriched with on-chain data.' },
  { src: '/img/slides/statspage.png', title: 'Page Stats.', subtitle: 'Blockchain stats for any page — certifiers, TRUST staked, market cap.' },
  { src: '/img/slides/wieedzeprofil.png', title: 'Your Profile.', subtitle: 'ENS name, signals count, Gold earned, social badges — your on-chain reputation.' },
  { src: '/img/slides/user interest.png', title: 'Interest Analysis.', subtitle: 'AI-detected interests from your browsing — crypto finance, blockchain, collaboration tools.' },
];

export function Carousel() {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => (c === 0 ? SLIDES.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === SLIDES.length - 1 ? 0 : c + 1));

  const slide = SLIDES[current];
  const imgRef = useParallax<HTMLDivElement>({ speed: 0.1, zoom: true, zoomMax: 1.08 });

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div ref={imgRef} className={styles.imageWrap}>
          <button className={`${styles.arrow} ${styles.arrowLeft}`} onClick={prev} aria-label="Previous">&lsaquo;</button>
          <img src={slide.src} alt={slide.title} className={styles.image} draggable={false} />
          <button className={`${styles.arrow} ${styles.arrowRight}`} onClick={next} aria-label="Next">&rsaquo;</button>
        </div>

        <div className={styles.info}>
          <h3 className={styles.title}>{slide.title}</h3>
          <p className={styles.subtitle}>{slide.subtitle}</p>
        </div>

        <div className={styles.dots}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
