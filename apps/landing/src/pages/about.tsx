import React from 'react';
import Layout from '@theme/Layout';
import styles from './about.module.css';

interface SocialLink {
  x?: string;
  linkedin?: string;
  github?: string;
}

interface TeamMember {
  name: string;
  role: string;
  title: string;
  image: string;
  quote: string;
  achievements: string[];
  socials: SocialLink;
}

interface Advisor {
  name: string;
  role: string;
  company: string;
  socials?: SocialLink;
}

export default function AboutPage(): React.ReactElement {
  const teamMembers: TeamMember[] = [
    {
      name: 'Samuel Chauche',
      role: 'Co-Founder',
      title: 'CEO',
      image: 'https://avatars.githubusercontent.com/u/193877792?s=400&u=b40a4d61b73ba9be24d01694392ac4cb700f82a6&v=4',
      quote: '"Working as tech support for several companies, I have seen data that can be used internally without any compensation to users. I have seen how this unfair system works."',
      achievements: [
        '6 years enterprise tech (Credit Suisse, Airbus, Salesforce)',
        'Intuition protocol core contributon',
        'Top 3 at Intuition Hackaton'
      ],
      socials: {
        x: 'Passive_Records',
        linkedin: 'Samuel-Chauche',
        github: 'SamuelChauche'
      }
    },
    {
      name: 'Maxime Saint-Joannis',
      role: 'Co-founder',
      title: 'CTO',
      image: 'https://avatars.githubusercontent.com/u/193876743?v=4',
      quote: '"10 years as a music producer showed me how streaming platforms manipulate discovery with fake artists and paid algorithms, burying real creators. We\'re building the alternative: recommendations you can trust, powered by real people."',
      achievements: [
        'Music Producer since 14y',
        'Built Sofia\'s entire technical infrastructure',
        'Full-stack engineer',
        'Top 5 at Intuition Hackathon'
      ],
      socials: {
        x: 'MoodzMaxime',
        linkedin: 'maxime-saint-joannis-65163b345',
        github: 'Wieedze'
      }
    }
  ];

  const advisors: Advisor[] = [
    {
      name: 'Jeremie Olivier',
      role: 'Mentor',
      company: 'Zet.box',
      socials: {
        x: 'olivierjeremie'
      }
    },
    {
      name: 'James Woods',
      role: 'Marketing Advisor',
      company: 'W O O D S',
      socials: {
        x: 'W00DS_eth'
      }
    },
    {
      name: 'Billy Luentke',
      role: 'Product Evangelist',
      company: '0xBilly',
      socials: {
        x: '0xbilly'
      }
    }
  ];

  return (
    <Layout
      title="About Us"
      description="Meet the team behind Sofia">
      <main className={styles.aboutMain}>
        <div className={styles.container}>
          {/* Team Section */}
          <section className={styles.section}>
            <h1 className={styles.sectionTitle}>TEAM</h1>

            <div className={styles.teamGrid}>
              {teamMembers.map((member, index) => (
                <div key={index} className={styles.teamMember}>
                  <div className={styles.memberHeader}>
                    <img
                      src={member.image}
                      alt={member.name}
                      className={styles.memberImage}
                    />
                    <div className={styles.memberInfo}>
                      <div className={styles.memberRole}>
                        {member.role} & {member.title}
                      </div>
                      <h2 className={styles.memberName}>{member.name}</h2>
                      <div className={styles.socialLinks}>
                        {member.socials.x && (
                          <a
                            href={`https://x.com/${member.socials.x}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.socialIcon}
                            aria-label="X (Twitter)"
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                          </a>
                        )}
                        {member.socials.linkedin && (
                          <a
                            href={`https://linkedin.com/in/${member.socials.linkedin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.socialIcon}
                            aria-label="LinkedIn"
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                          </a>
                        )}
                        {member.socials.github && (
                          <a
                            href={`https://github.com/${member.socials.github}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.socialIcon}
                            aria-label="GitHub"
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={styles.memberQuote}>
                    {member.quote}
                  </div>

                  <ul className={styles.memberAchievements}>
                    {member.achievements.map((achievement, i) => (
                      <li key={i}>{achievement}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Advisors Section */}
          <section className={styles.section}>
            <h1 className={styles.sectionTitle}>ADVISORS</h1>

            <div className={styles.advisorsGrid}>
              {advisors.map((advisor, index) => (
                <div key={index} className={styles.advisor}>
                  <div className={styles.advisorRole}>{advisor.role}</div>
                  <h3 className={styles.advisorName}>
                    {advisor.name} - {advisor.company}
                  </h3>
                  {advisor.socials?.x && (
                    <a
                      href={`https://x.com/${advisor.socials.x}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.socialIcon}
                      aria-label="X (Twitter)"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </Layout>
  );
}
