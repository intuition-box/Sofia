import { Arrow } from './Arrow';
import { useScrollAnim } from '../hooks/useScrollAnim';
import { URLS } from '../lib/config/urls';
import { Section } from './Section';
import { SectionHead } from './SectionHead';
import { Plate } from './Plate';
import styles from './Chronicles.module.css';

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
      'A full behavioral reputation dashboard with feed, leaderboard, votes, streaks and profiles — plus the landing page redesign and the Beta Reward Program launching April 27.',
    link: URLS.blog.logbook2003,
  },
  {
    date: 'MARCH 13, 2026',
    title: 'Logbook #24 — Position Board & On-Chain Streaks',
    excerpt:
      'After certifying a page, you now see a leaderboard of everyone who certified it — each certifier displayed with their ENS name and avatar.',
    link: URLS.blog.logbook2403,
  },
  {
    date: 'MARCH 6, 2026',
    title: 'Logbook #23 — Vote Tab & First Claim Experience',
    excerpt:
      'A new Vote tab in Resonance: browse curated claims and lists, take a position with support or oppose. The first-claim flow is finally complete.',
    link: URLS.blog.logbook2303,
  },
];

export function Chronicles() {
  return (
    <Section
      id="chronicles"
      code="S.06"
      label="CHRONICLES"
      meta={`${POSTS.length} ENTRIES · BUILDING IN PUBLIC`}
    >
      <SectionHead
        eyebrow="Build log"
        title={
          <>
            Sofia Chronicles. <em>Quarterly. In public.</em>
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

      <Plate
        tag="PLATE.D"
        title="Build log · last 3 entries"
        meta={['Q1 · 2026', 'OPEN · INDEX']}
        foot={['3 ENTRIES VISIBLE', 'FULL ARCHIVE → /chronicles']}
        body="grid"
        className={styles.chronsPlate}
      >
        <div className={`${styles.chrons} stagger`}>
          {POSTS.map((post, i) => (
            <PostCard key={post.link} post={post} index={i} />
          ))}
        </div>
      </Plate>
    </Section>
  );
}

function PostCard({ post, index }: { post: BlogPost; index: number }) {
  const ref = useScrollAnim<HTMLAnchorElement>();
  return (
    <a
      ref={ref}
      href={post.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.chron} anim anim-up`}
      style={{ ['--i' as never]: index }}
    >
      <span className={styles.date}>{post.date}</span>
      <h3 className={styles.title}>{post.title}</h3>
      <p className={styles.excerpt}>{post.excerpt}</p>
      <span className={styles.link}>
        Read article <Arrow />
      </span>
    </a>
  );
}
