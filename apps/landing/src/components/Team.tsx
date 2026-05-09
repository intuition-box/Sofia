import { useScrollAnim } from '../hooks/useScrollAnim'
import { Section } from './Section'
import { SectionHead } from './SectionHead'
import styles from './Team.module.css'

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)
const LI_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.064 2.064 0 1 1 0-4.128 2.064 2.064 0 0 1 0 4.128zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)
const GH_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.1 11.1 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
)

interface TeamMember {
  name: string
  role: string
  avatar: string
  quote: string
  socials: { x: string; linkedin: string; github: string }
}

const TEAM: TeamMember[] = [
  {
    name: 'Samuel Chauche',
    role: 'Core Contributor',
    avatar:
      'https://avatars.githubusercontent.com/u/193877792?s=400&u=b40a4d61b73ba9be24d01694392ac4cb700f82a6&v=4',
    quote:
      "Working as tech support for several companies, I have seen data used internally without any compensation to users. After 30 minutes browsing meaningless ads, I realized the internet wasn't enriching; it was exhausting.",
    socials: {
      x: 'Passive_Records',
      linkedin: 'Samuel-Chauche',
      github: 'SamuelChauche',
    },
  },
  {
    name: 'Maxime Saint-Joannis',
    role: 'Core Contributor',
    avatar: 'https://avatars.githubusercontent.com/u/193876743?v=4',
    quote:
      "10 years as a music producer showed me how streaming platforms manipulate discovery with fake artists and paid algorithms, burying real creators. We're building the alternative.",
    socials: {
      x: 'MoodzMaxime',
      linkedin: 'maxime-saint-joannis-65163b345',
      github: 'Wieedze',
    },
  },
]

interface Advisor {
  name: string
  role: string
  company: string
  avatar: string
  x: string
  expertise: string[]
  quote: string
}

interface Testimonial {
  handle: string
  name: string
  role: string
  quote: string
  intent: 'work' | 'learning' | 'fun' | 'inspiration' | 'music' | 'buying'
  source: 'X' | 'Discord' | 'Telegram'
  ago: string
}

interface Traction {
  tag: string
  value: string
  label: string
}

const TRACTION: Traction[] = [
  {
    tag: 'T.01',
    value: '20K',
    label: 'Intuition grant',
  },
  {
    tag: 'T.02',
    value: '10K',
    label: 'on-chain interactions',
  },
  {
    tag: 'T.03',
    value: '2 500',
    label: 'TRUST distributed',
  },
  {
    tag: 'T.04',
    value: 'DAO',
    label: 'community-owned',
  },
]

const ADVISORS: Advisor[] = [
  {
    name: 'Jeremie Olivier',
    role: 'Mentor',
    company: 'Zet.box',
    avatar: 'https://unavatar.io/twitter/olivierjeremie',
    x: 'olivierjeremie',
    expertise: ['DAO ops', 'Web3 strategy', 'Tokenomics'],
    quote:
      "Sofia turns the most ordinary act of the web — opening a tab — into a sovereign signal. That's the missing primitive.",
  },
  {
    name: 'James Woods',
    role: 'Marketing Advisor',
    company: 'W O O D S',
    avatar: 'https://unavatar.io/twitter/W00DS_eth',
    x: 'W00DS_eth',
    expertise: ['Brand', 'GTM', 'Community'],
    quote:
      "We don't sell extensions. We sell ownership. Sofia is the first product I've seen articulate that for the open web.",
  },
  {
    name: 'Billy Luentke',
    role: 'Product Evangelist',
    company: '0xBilly',
    avatar: 'https://unavatar.io/twitter/0xbilly',
    x: '0xbilly',
    expertise: ['Product', 'Distribution', 'Intuition'],
    quote:
      'Once you certify your first intent on Sofia, the rest of the web feels read-only. There is no going back.',
  },
]

const TESTIMONIALS: Testimonial[] = [
  {
    handle: '0xnova.eth',
    name: 'Nova',
    role: 'Independent researcher',
    quote:
      'I had no idea my reading habits were a portfolio. Three weeks in, my Sofia graph reads like a CV I never had to write.',
    intent: 'learning',
    source: 'X',
    ago: '2d',
  },
  {
    handle: 'lyra_bld',
    name: 'Lyra',
    role: 'Product designer',
    quote:
      "Trust signals on every page is the feature I didn't know I was missing. My circle's taste shows up where I browse — finally.",
    intent: 'inspiration',
    source: 'Discord',
    ago: '5d',
  },
  {
    handle: 'passive_records',
    name: 'Sam',
    role: 'Music producer',
    quote:
      'Built my reputation on Sofia in three weeks. The atoms I minted are real proof of taste, not vibes — labels can verify it on-chain.',
    intent: 'music',
    source: 'X',
    ago: '1w',
  },
  {
    handle: 'jolad.eth',
    name: 'Jolad',
    role: 'DAO operator',
    quote:
      'We share knowledge graphs across the team. Curation that used to live in random Notion pages is now an actual on-chain asset.',
    intent: 'work',
    source: 'Telegram',
    ago: '4d',
  },
  {
    handle: 'wieedze.eth',
    name: 'Maxime',
    role: 'Music producer',
    quote:
      'Three months in, my expertise badges started unlocking real introductions. The protocol does what playlists never could.',
    intent: 'music',
    source: 'Discord',
    ago: '6d',
  },
  {
    handle: 'orin.eth',
    name: 'Orin',
    role: 'Indie hacker',
    quote:
      "Sofia's radar surfaces what my own attention misses. It's the first AI agent that feels like it's actually working with me, not on me.",
    intent: 'fun',
    source: 'X',
    ago: '3d',
  },
]

export function Team() {
  const advHeaderRef = useScrollAnim<HTMLDivElement>()

  return (
    <Section
      id="team"
      code="S.07"
      label="OPERATORS"
      meta={`${TEAM.length} CORE · ${ADVISORS.length} ADVISORS · ${TESTIMONIALS.length} VOICES`}
    >
      <SectionHead
        eyebrow="The team"
        title={
          <>
            Two builders. Three advisors. <em>One open repository.</em>
          </>
        }
        sub="Sofia is built in public on Intuition. Every contributor is reachable; every advisor stakes their name on the work."
      />

      <div className={`${styles.traction} stagger`}>
        {TRACTION.map((t, i) => (
          <article
            key={t.label}
            className={`${styles.tractionCard} anim anim-up`}
            style={{ ['--i' as never]: i }}
          >
            <span className={styles.tractionTag}>{t.tag}</span>
            <span className={styles.tractionValue}>{t.value}</span>
            <span className={styles.tractionLabel}>{t.label}</span>
          </article>
        ))}
      </div>

      <div className={`${styles.grid} stagger`}>
        {TEAM.map((m, i) => (
          <MemberCard key={m.name} member={m} index={i} />
        ))}
      </div>

      {/* Testimonials — voices from the community */}
      <div className={styles.voicesHeader}>
        <span className={styles.voicesEyebrow}>— FROM THE COMMUNITY</span>
        <span className={styles.voicesMeta}>
          {TESTIMONIALS.length} VOICES · LIVE
        </span>
      </div>

      <div className={`${styles.voicesGrid} stagger`}>
        {TESTIMONIALS.map((t, i) => (
          <TestimonialCard key={t.handle} t={t} index={i} />
        ))}
      </div>

      <div ref={advHeaderRef} className={`${styles.advHeader} anim anim-up`}>
        <span className={styles.advHeaderRule}>— ADVISORS</span>
        <span className={styles.advHeaderMeta}>{ADVISORS.length} OPERATORS</span>
      </div>

      <div className={`${styles.advGrid} stagger`}>
        {ADVISORS.map((a, i) => (
          <AdvisorCard key={a.name} advisor={a} index={i} />
        ))}
      </div>
    </Section>
  )
}

function TestimonialCard({ t, index }: { t: Testimonial; index: number }) {
  const ref = useScrollAnim<HTMLElement>()
  const intentColor = `var(--${t.intent})`
  return (
    <article
      ref={ref}
      className={`${styles.voice} anim anim-up`}
      style={
        {
          ['--i' as never]: index,
          ['--voice-accent' as never]: intentColor,
        } as React.CSSProperties
      }
    >
      <div className={styles.voiceHead}>
        <span
          className={styles.voiceAvatar}
          style={
            {
              background: `linear-gradient(135deg, ${intentColor}, var(--color-accent))`,
            } as React.CSSProperties
          }
          aria-hidden="true"
        >
          {t.name.charAt(0)}
        </span>
        <div className={styles.voiceMeta}>
          <span className={styles.voiceHandle}>@{t.handle}</span>
          <span className={styles.voiceRole}>{t.role}</span>
        </div>
        <span className={styles.voiceTag}>{t.intent}</span>
      </div>
      <p className={styles.voiceQuote}>{t.quote}</p>
      <div className={styles.voiceFoot}>
        <span className={styles.voiceSource}>{t.source}</span>
        <span className={styles.voiceDot}>·</span>
        <span className={styles.voiceAgo}>{t.ago} ago</span>
      </div>
    </article>
  )
}

function MemberCard({ member, index }: { member: TeamMember; index: number }) {
  const ref = useScrollAnim<HTMLElement>()
  return (
    <article
      ref={ref}
      className={`${styles.card} anim anim-up`}
      style={{ ['--i' as never]: index }}
    >
      <div className={styles.cardHead}>
        <img src={member.avatar} alt={member.name} className={styles.avatar} />
        <div className={styles.cardMeta}>
          <span className={styles.cardRole}>{member.role}</span>
          <h3 className={styles.cardName}>{member.name}</h3>
          <div className={styles.socials}>
            <a
              href={`https://x.com/${member.socials.x}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
            >
              {X_ICON}
            </a>
            <a
              href={`https://linkedin.com/in/${member.socials.linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              {LI_ICON}
            </a>
            <a
              href={`https://github.com/${member.socials.github}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              {GH_ICON}
            </a>
          </div>
        </div>
      </div>
      <p className={styles.quote}>{member.quote}</p>
    </article>
  )
}

function AdvisorCard({ advisor, index }: { advisor: Advisor; index: number }) {
  const ref = useScrollAnim<HTMLAnchorElement>()
  return (
    <a
      ref={ref}
      href={`https://x.com/${advisor.x}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.adv} anim anim-up`}
      style={{ ['--i' as never]: index }}
    >
      <div className={styles.advHead}>
        <img
          src={advisor.avatar}
          alt={advisor.name}
          className={styles.advAvatar}
        />
        <div className={styles.advHeadMeta}>
          <span className={styles.advRole}>{advisor.role}</span>
          <span className={styles.advName}>{advisor.name}</span>
          <span className={styles.advCo}>
            {advisor.company} · @{advisor.x}
          </span>
        </div>
      </div>

      <p className={styles.advQuote}>{advisor.quote}</p>

      <div className={styles.advTags}>
        {advisor.expertise.map((tag) => (
          <span key={tag} className={styles.advTag}>
            {tag}
          </span>
        ))}
      </div>
    </a>
  )
}
