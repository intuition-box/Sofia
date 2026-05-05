import { Arrow } from './Arrow';
import { useScrollAnim } from '../hooks/useScrollAnim';
import { useTextSplit } from '../hooks/useTextSplit';
import { URLS } from '../lib/config/urls';
import styles from './BlogSection.module.css';

interface BlogPost {
  date: string;
  title: string;
  excerpt: string;
  link: string;
}

const POSTS: BlogPost[] = [
  {
    date: 'MARCH 20, 2026',
    title: 'Logbook 20/03 — Sofia Explorer & Beta Reward Program',
    excerpt:
      'In one week: a full behavioral reputation dashboard with feed, leaderboard, vote, streaks, and profiles. Plus a complete landing page redesign and the Beta Reward Program launching April 27.',
    link: URLS.blog.logbook2003,
  },
  {
    date: 'MARCH 13, 2026',
    title: 'Logbook #24 — Position Board & On-Chain Streaks',
    excerpt:
      'After certifying a page, you now see a leaderboard of everyone who certified it. Each certifier displayed with their ENS name and avatar.',
    link: URLS.blog.logbook2403,
  },
  {
    date: 'MARCH 6, 2026',
    title: 'Logbook #23 — Vote Tab & First Claim Experience',
    excerpt:
      'New Vote tab in Resonance: browse curated claims and lists, take a position with support or oppose.',
    link: URLS.blog.logbook2303,
  },
];

export function BlogSection() {
  const headerRef = useScrollAnim<HTMLDivElement>();
  const titleRef = useTextSplit<HTMLHeadingElement>({ by: 'word' });

  return (
    <section className={styles.section} id="chronicles">
      <div className="container">
        <div ref={headerRef} className={`${styles.header} anim anim-up`}>
          <div className={styles.headerCopy}>
            <span className="mono-eyebrow">Chronicles</span>
            <h2 ref={titleRef} className={`section-title anim ${styles.title}`}>
              Sofia Chronicles
            </h2>
          </div>
          <a
            href={URLS.blog.index}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.allLink}
          >
            All articles
            <Arrow />
          </a>
        </div>

        <div className={styles.grid}>
          {POSTS.map((post, i) => (
            <PostCard key={post.link} post={post} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PostCard({ post, index }: { post: BlogPost; index: number }) {
  const ref = useScrollAnim<HTMLAnchorElement>();
  const delay = Math.min(index, 4);
  return (
    <a
      ref={ref}
      href={post.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.card} anim anim-up ${delay > 0 ? `anim-d${delay}` : ''}`}
    >
      <span className={styles.date}>{post.date}</span>
      <h3 className={styles.postTitle}>{post.title}</h3>
      <p className={styles.excerpt}>{post.excerpt}</p>
      <span className={styles.link}>
        Read article
        <Arrow />
      </span>
    </a>
  );
}
