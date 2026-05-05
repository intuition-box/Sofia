import { useScrollAnim } from '../hooks/useScrollAnim';
import styles from './Team.module.css';

const X_ICON = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>;
const LI_ICON = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.064 2.064 0 1 1 0-4.128 2.064 2.064 0 0 1 0 4.128zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>;
const GH_ICON = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.1 11.1 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" /></svg>;

interface TeamMember {
  name: string;
  role: string;
  avatar: string;
  quote: string;
  achievements: string[];
  socials: { x: string; linkedin: string; github: string };
}

const TEAM: TeamMember[] = [
  {
    name: 'Samuel Chauche',
    role: 'Core Contributor',
    avatar: 'https://avatars.githubusercontent.com/u/193877792?s=400&u=b40a4d61b73ba9be24d01694392ac4cb700f82a6&v=4',
    quote: 'I have seen data used internally without any compensation to users.',
    achievements: [],
    socials: { x: 'Passive_Records', linkedin: 'Samuel-Chauche', github: 'SamuelChauche' },
  },
  {
    name: 'Maxime Saint-Joannis',
    role: 'Core Contributor',
    avatar: 'https://avatars.githubusercontent.com/u/193876743?v=4',
    quote: 'Streaming platforms manipulate discovery. We\'re building the alternative.',
    achievements: [],
    socials: { x: 'MoodzMaxime', linkedin: 'maxime-saint-joannis-65163b345', github: 'Wieedze' },
  },
];

interface Advisor {
  name: string;
  role: string;
  company: string;
  avatar: string;
  x: string;
}

const ADVISORS: Advisor[] = [
  { name: 'Jeremie Olivier', role: 'Mentor', company: 'Zet.box', avatar: 'https://unavatar.io/twitter/olivierjeremie', x: 'olivierjeremie' },
  { name: 'James Woods', role: 'Marketing Advisor', company: 'W O O D S', avatar: 'https://unavatar.io/twitter/W00DS_eth', x: 'W00DS_eth' },
  { name: 'Billy Luentke', role: 'Product Evangelist', company: '0xBilly', avatar: 'https://unavatar.io/twitter/0xbilly', x: '0xbilly' },
];

export function Team() {
  const titleRef = useScrollAnim();
  const advTitleRef = useScrollAnim();
  const advGridRef = useScrollAnim();

  return (
    <section className={styles.section} id="team">
      <div className="container">
        <h2 ref={titleRef} className={`section-title anim ${styles.centered}`}>Team</h2>

        <div className={styles.grid}>
          {TEAM.map((m, i) => (
            <MemberCard key={m.name} member={m} delay={i} />
          ))}
        </div>

        <h3 ref={advTitleRef} className={`section-title anim ${styles.centered} ${styles.advTitle}`}>Advisors</h3>
        <div ref={advGridRef} className={`${styles.advGrid} anim`}>
          {ADVISORS.map((a) => (
            <a key={a.name} href={`https://x.com/${a.x}`} target="_blank" rel="noopener noreferrer" className={styles.adv}>
              <img src={a.avatar} alt={a.name} className={styles.advAvatar} />
              <div className={styles.advRole}>{a.role}</div>
              <div className={styles.advName}>{a.name}</div>
              <div className={styles.advCo}>{a.company}</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function MemberCard({ member, delay }: { member: TeamMember; delay: number }) {
  const ref = useScrollAnim();
  return (
    <div ref={ref} className={`${styles.card} anim ${delay > 0 ? `anim-d${delay}` : ''}`}>
      <div className={styles.cardHead}>
        <img src={member.avatar} alt={member.name} className={styles.avatar} />
        <div>
          <div className={styles.cardRole}>{member.role}</div>
          <h3 className={styles.cardName}>{member.name}</h3>
          <div className={styles.socials}>
            <a href={`https://x.com/${member.socials.x}`} target="_blank" rel="noopener noreferrer">{X_ICON}</a>
            <a href={`https://linkedin.com/in/${member.socials.linkedin}`} target="_blank" rel="noopener noreferrer">{LI_ICON}</a>
            <a href={`https://github.com/${member.socials.github}`} target="_blank" rel="noopener noreferrer">{GH_ICON}</a>
          </div>
        </div>
      </div>
      <p className={styles.quote}>"{member.quote}"</p>
      <ul className={styles.list}>
        {member.achievements.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
    </div>
  );
}
