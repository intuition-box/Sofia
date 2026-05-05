import { Arrow } from './Arrow';
import { useScrollAnim } from '../hooks/useScrollAnim';
import { URLS } from '../lib/config/urls';
import { Module } from './Module';
import { ModuleHead } from './ModuleHead';
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
  return (
    <Module id="chronicles" code="S.08" label="CHRONICLES" meta={`${POSTS.length} ENTRIES · BUILDING IN PUBLIC`}>
      <ModuleHead
        eyebrow="Build log"
        title={
          <>
            Sofia Chronicles. <em>Quarterly, in public.</em>
          </>
        }
        right={
          <a
            href={URLS.blog.index}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn btn-secondary ${styles.allLink}`}
          >
            All articles <Arrow />
          </a>
        }
      />

      <div className={styles.grid}>
        {POSTS.map((post, i) => (
          <PostCard key={post.link} post={post} index={i} />
        ))}
      </div>
    </Module>
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
