import type { ReactNode } from 'react'
import { Arrow } from '../components/Arrow'
import { CirclesSequence } from '../components/CirclesSequence'
import { HexSplit } from '../components/HexSplit'
import { IsoStack } from '../components/IsoStack'
import { TopicsRadar } from '../components/TopicsRadar'
import { SceneBtn } from '../components/buttons/SceneBtn'
import { OpenCard } from '../components/cards/OpenCard'
import { ProductCard } from '../components/cards/ProductCard'
import { ValueCard } from '../components/cards/ValueCard'
import { URLS } from '../lib/config/urls'

/* Per-zone custom content. When a zone number has an entry here, the
   placeholder renders the node returned by this function instead of
   the default "<num> / <label>" skeleton text — used to inject real
   graphics or composed content into specific zones while leaving the
   rest of the deck as a wireframe. The function receives the active
   slide variant so the node can pick palette tokens that match. */
/* Pulled verbatim from `Hero.tsx` so we keep a single source of
   truth on partner identities. */
const PARTNERS = [
  {
    name: 'Intuition',
    logo: '/img/partners/intuitionlogo.svg',
    url: 'https://intuition.systems',
  },
  {
    name: 'Mastra',
    logo: '/img/partners/mastra.svg',
    url: 'https://mastra.ai/',
  },
  {
    name: 'Colony',
    logo: '/img/partners/colonnylogo.png',
    url: 'https://colony.io/',
  },
  { name: 'Phala', logo: '/img/partners/phala.svg', url: 'https://phala.com' },
]

export const ZONE_NODES: Record<number, (variant: 'peach' | 'dark') => ReactNode> = {
  /* Zone 1 — the cover catch phrase. Headline + Hero's two CTAs
     (Open Explorer + Read the docs) pulled verbatim from `Hero.tsx`. */
  1: (variant) => (
    <div
      className={variant === 'peach' ? 'on-peach' : ''}
      style={{
        width: '100%',
        height: '100%',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        /* space-between separates the h1 (top of cell) from the CTA
         * row (bottom of cell). Buttons get flex-shrink:0 so they
         * stay rendered; h1 gets flex-shrink:1 so it yields space on
         * short viewports rather than pushing the buttons out. */
        justifyContent: 'space-between',
        gap: 24,
        minHeight: 0,
      }}
    >
      <h1
        className="h-display"
        style={{
          fontSize: 'clamp(3rem, 4vh + 6vw, 8.8rem)',
          lineHeight: 1.05,
          paddingTop: '0.08em',
          paddingBottom: '0.05em',
          margin: 0,
          flexShrink: 1,
          minHeight: 0,
        }}
      >
        From surfing the web to <em>owning&nbsp;it.</em>
      </h1>
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          flexShrink: 0,
        }}
      >
        <a
          href="https://explorer.sofia.intuition.box"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
        >
          Open Explorer <Arrow />
        </a>
        <SceneBtn
          href="https://doc.sofia.intuition.box"
          variant="peach"
          ink="dark"
          hoverFill="white"
        >
          Read the docs <Arrow />
        </SceneBtn>
      </div>
    </div>
  ),
  /* Zone 2 — partners. Real brand logos from `/img/partners/`. Match
     the home's treatment: brightness(0) flattens monochrome marks to
     deep ink on the peach slab; Phala keeps its native lime + dark
     because flattening would erase the inner "P". */
  2: (variant) => (
    <div
      className={variant === 'peach' ? 'on-peach' : ''}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        gap: 16,
      }}
    >
      <span className="eyebrow">Built with</span>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 28,
          flexWrap: 'wrap',
          justifyContent: 'flex-start',
        }}
      >
        {PARTNERS.map((p) => {
          const isPhala = p.name === 'Phala'
          return (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={p.name}
              style={{ opacity: 0.78, display: 'inline-flex' }}
            >
              <img
                src={p.logo}
                alt={p.name}
                style={{
                  height: isPhala ? 'auto' : 28,
                  maxHeight: 28,
                  maxWidth: isPhala ? 90 : undefined,
                  width: 'auto',
                  display: 'block',
                  filter:
                    isPhala || variant === 'dark' ? 'none' : 'brightness(0)',
                }}
              />
            </a>
          )
        })}
      </div>
    </div>
  ),
  /* Zone 3 lives twice in S.01: as the right-tall "graphic vector" on
     the base view, and (via revealNumOverride: { 0: 3 }) as the
     left-tall on the WHY SOFIA reveal — same number, same content.
     Both contexts render the animation; the active slide variant
     (peach on base, dark on reveal) flips the palette automatically. */
  3: (variant) => <CirclesSequence variant={variant} />,
  /* Zone 5 — WHY SOFIA reveal banner. Section-head pattern lifted
     from `ValueProps.tsx`: eyebrow + Fraunces title with italic
     emphasis + lede paragraph. Sits on the dark slab so default
     `var(--color-text)` ink is correct without any modifier. */
  5: () => (
    <div style={{ width: '100%', textAlign: 'left' }}>
      <h2
        className="h-section"
        style={{
          margin: '0 0 14px',
          fontSize: 'clamp(1.8rem, 1.4rem + 3.4vw, 9.2rem)',
        }}
      >
        Four angles, <em>one promise.</em>
      </h2>
      <p className="lede" style={{ maxWidth: '60ch' }}>
        Sofia answers four real needs — personal, group, watch, and collective
        intelligence. No jargon, no posturing: what you actually get from using
        it.
      </p>
    </div>
  ),
  /* Zones 6 / 7 / 8 / 9 — the four "angles" cards from `ValueProps`.
     Numbering on the deck doesn't match the home's VALUE.01-04
     order (which is editorial), so each card carries its source tag
     in the eyebrow for cross-reference. */
  6: () => (
    <ValueCard
      tag="Angle 01"
      title="Tech watch"
      desc="Filter the noise. See what's rising among the people you follow before it shows up everywhere. A radar driven by people, not algorithms."
    />
  ),
  7: () => (
    <ValueCard
      tag="Angle 02"
      title="Group momentum"
      desc="Find the people who think like you, follow their finds, give weight to the ones that matter. The group forms from what you actually do."
    />
  ),
  8: () => (
    <ValueCard
      tag="Angle 03"
      title="Collective intelligence"
      desc="What thousands of people watch, read, and Mark becomes a shared signal. A living map of what deserves attention, built together."
    />
  ),
  9: () => (
    <ValueCard
      tag="Angle 04"
      title="Social leverage"
      desc="Your community's signals — follows, Marks, trust votes — give weight to what you publish. The social side isn't decoration, it's the multiplier."
    />
  ),
  /* Zone 10 — Sofia hero video demo. Auto-plays muted on loop. */
  10: (variant) => (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: 20,
        background:
          variant === 'peach'
            ? 'rgba(255, 198, 176, 0.30)'
            : 'rgba(2, 0, 14, 0.30)',
      }}
    >
      <video
        src="/sofia-hero.mp4"
        autoPlay
        muted
        loop
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  ),
  /* Zone 11 — S.04 left tall. Plate A · polar radar (Topics × Intentions).
     Top-aligned so the plate's frame top edge sits flush with the
     "Personal upside" banner title in zone 12. */
  11: (variant) => (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
      }}
    >
      <TopicsRadar ink={variant === 'dark' ? 'light' : 'dark'} />
    </div>
  ),
  /* Zone 12 — S.04 PRODUCT preview banner. Picks up the storyboard
     beats: a single gesture (Acte 2) writes a triple, threads weave
     a personal map (Acte 3), shared atoms light up across the graph
     (Acte 4). Headline + lede + a stat row that echoes the Acte 4
     counters without faking a data tableau. */
  12: () => (
    <div style={{ width: '100%', textAlign: 'left' }}>
      <span className="eyebrow">Product · P.00</span>
      <h2
        className="h-section"
        style={{
          margin: '6px 0 12px',
          fontSize: 'clamp(1.8rem, 1.4rem + 3.4vw, 9.2rem)',
          lineHeight: 1.02,
        }}
      >
        One gesture. <em>Your web, mapped.</em>
      </h2>
      <p
        className="lede"
        style={{
          margin: 0,
          maxWidth: 'none',
        }}
      >
        Mark a page with how it served you — for learning, for work, for
        inspiration — and Sofia remembers. Months later, your reading still has
        shape: which articles taught you something, which podcasts shifted your
        thinking, which people you keep coming back to. Your moves quietly
        become a map the rest of the network can read without ever touching your
        data.
      </p>
    </div>
  ),
  /* Zone 13 — Extension pillar (P.02 in `Features.tsx`). The gesture
     side of the product — one click, one intention, one triple — picks
     up the storyboard's Acte 2 ("Un verbe. Une intention. Tu marques
     le web."). CTA wired to the Chrome Web Store extension page. */
  /* Zones 13/14 — inline render (not the shared ValueCard) so we can
     anchor a CTA button at the bottom of each cell without the card's
     `height: 100%` swallowing the button's space. */
  13: () => (
    <ProductCard
      tag="Product · P.02"
      title="Extension"
      desc="A small button that lives in your browser. When a page is useful to you, click it and say why — for learning, for work, for inspiration. Sofia remembers, so months later you still know which articles taught you something and which podcasts changed how you think."
      cta={{
        href: 'https://chromewebstore.google.com/',
        label: 'Download',
      }}
    />
  ),
  14: () => (
    <ProductCard
      tag="Product · P.01"
      title="Explorer"
      desc="A home for everything you've kept. Browse it by topic, by intention, by mood. See what people you trust are reading right now, and find the voices worth following on subjects you actually care about — without scrolling through everyone else's noise."
      cta={{
        href: 'https://explorer.sofia.intuition.box',
        label: 'Open the Explorer',
      }}
    />
  ),
  /* Zones 15-18 — S.05 VISION cards. All four use OpenCard so the
     eyebrow / title / desc / button hierarchy is visually consistent
     (same h3 clamp, same paddings, same CTA placement). */
  15: () => (
    <OpenCard
      tag="Open · O.01"
      title="Built in public"
      desc="We expose our decisions, our doubts, our trade-offs. What you read here is what we say internally. The community has a voice — and uses it."
      cta={{
        href: 'https://discord.gg/sofia3',
        label: 'Join Discord',
      }}
      ctaPrimary
    />
  ),
  16: () => (
    <OpenCard
      tag="Open · O.02"
      title="DAO"
      desc="Sofia is steered by its contributors via Colony — proposals, payouts, and direction set by the people doing the work, not a board."
      cta={{
        href: 'https://app.colony.io/invite/sofia/d3c7b0a4-d168-477c-a176-2b5c4eca68da',
        label: 'Join the DAO',
      }}
      ctaPrimary
    />
  ),
  17: () => (
    <OpenCard
      tag="Open · O.03"
      title="Chronicles"
      desc="A public build log — every two weeks, what was done, what was tried, what was scrapped. No pitch, no dressed-up roadmap — just what the team actually shipped."
      cta={{
        href: 'https://doc.sofia.intuition.box/blog',
        label: 'Read the blog',
      }}
    />
  ),
  18: () => (
    <OpenCard
      tag="Open · O.04"
      title="Open source"
      desc="The code, the contracts, the data shapes — all open. Fork it, audit it, contribute. What you see running is what's published."
      cta={{
        href: 'https://github.com/intuition-box',
        label: 'See the repo',
      }}
    />
  ),
  /* Zone 19 — S.05 right-tall slot. Plate D's IsoStack vector lifted
     from the home's VisionBlock. Mode 'light' for the peach slab
     (labels + grid in dark ink); plate outlines forced to black so
     each rhombus reads clearly, fills stay transparent. */
  19: (variant) => (
    <IsoStack
      mode={variant === 'peach' ? 'light' : 'dark'}
      plateStroke="#02000e"
      dotFills={['#02000e', '#02000e', '#8a8a8a']}
    />
  ),
  /* Zone 20 — S.06 CONTRIBUTOR base, top-left (2fr height). The two
     core builders pulled from `Team.tsx` with avatar mini + handle. */
  20: () => (
    <div
      style={{
        width: '100%',
        height: '100%',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
      }}
    >
      <span className="eyebrow">Team · Core</span>
      <h2
        className="h-section"
        style={{
          margin: '12px 0 18px',
          fontSize: 'clamp(1.6rem, 1.2rem + 2.4vw, 3.2rem)',
        }}
      >
        Two builders, <em>one open repo.</em>
      </h2>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          alignItems: 'flex-start',
        }}
      >
        {[
          {
            name: 'Samuel Chauche',
            handle: 'passive-records.box',
            avatar:
              'https://avatars.githubusercontent.com/u/193877792?s=400&u=b40a4d61b73ba9be24d01694392ac4cb700f82a6&v=4',
            quote:
              "Working as tech support for several companies, I saw data used internally without any compensation to users. After 30 minutes browsing meaningless ads I realised the web wasn't enriching — it was exhausting.",
          },
          {
            name: 'Maxime Saint-Joannis',
            handle: 'wieedze.eth',
            avatar: 'https://avatars.githubusercontent.com/u/193876743?v=4',
            quote:
              "10 years as a music producer showed me how streaming platforms manipulate discovery — fake artists, paid algorithms, real creators buried. We're building the alternative.",
          },
        ].map((m) => (
          <div
            key={m.name}
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <img
                src={m.avatar}
                alt={m.name}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  display: 'block',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  lineHeight: 1.2,
                }}
              >
                <span
                  style={{
                    fontSize: 'clamp(1rem, 0.85rem + 0.5vw, 1.25rem)',
                    fontWeight: 500,
                  }}
                >
                  {m.name}
                </span>
                <span
                  className="eyebrow"
                  style={{ fontSize: 11, marginTop: 4 }}
                >
                  {m.handle}
                </span>
              </div>
            </div>
            <p
              className="lede"
              style={{
                margin: 0,
                fontSize: 'clamp(0.85rem, 0.75rem + 0.4vw, 1.05rem)',
                lineHeight: 1.5,
              }}
            >
              “{m.quote}”
            </p>
          </div>
        ))}
      </div>
      <SceneBtn
        href="https://doc.sofia.intuition.box/docs/about"
        variant="peach"
        style={{
          marginTop: 16,
          padding: '8px 14px',
          fontSize: '0.78rem',
          alignSelf: 'flex-start',
        }}
      >
        About the team <Arrow />
      </SceneBtn>
    </div>
  ),
  /* Zone 21 — S.06 base, TOP RIGHT of the `left-stack-right` layout.
     Wipe-lead zone (idx 1): the funding / support narrative lands
     first with a diagonal wipe, then Core (idx 0) and Advisors
     (idx 2) cascade in after the revealDelay beat. */
  21: () => (
    <div style={{ width: '100%', textAlign: 'left' }}>
      <span className="eyebrow">Backed by</span>
      <h2
        className="h-section"
        style={{
          margin: '12px 0 16px',
          fontSize: 'clamp(1.6rem, 1.2rem + 2.4vw, 3.2rem)',
        }}
      >
        Intuition · <em>20K grant.</em>
      </h2>
      <p
        className="lede"
        style={{
          margin: '0 0 12px',
          fontSize: 'clamp(0.85rem, 0.75rem + 0.4vw, 1.05rem)',
          maxWidth: 'none',
        }}
      >
        Sofia is built on Intuition — the protocol where every meaningful action
        becomes a verifiable record owned by the person who made it. The
        alignment is structural, not commercial: the same infrastructure that
        secures your trail is the one we ship on, and Intuition's builder grant
        carries us through the early miles.
      </p>
      <p
        className="lede"
        style={{
          margin: '0 0 18px',
          fontSize: 'clamp(0.85rem, 0.75rem + 0.4vw, 1.05rem)',
          maxWidth: 'none',
        }}
      >
        DAO-oriented from day one. Decisions, treasury, and rewards live
        on-chain — contributors who ship and users who curate get TRUST in
        return, and the community owns the roadmap as Sofia grows.
      </p>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <SceneBtn
          href="https://portal.intuition.systems/"
          variant="peach"
          style={{ padding: '8px 14px', fontSize: '0.78rem' }}
        >
          portal.intuition.systems <Arrow />
        </SceneBtn>
        <SceneBtn
          href="https://app.colony.io/invite/sofia/d3c7b0a4-d168-477c-a176-2b5c4eca68da"
          variant="peach"
          style={{ padding: '8px 14px', fontSize: '0.78rem' }}
        >
          Join the DAO <Arrow />
        </SceneBtn>
      </div>
    </div>
  ),
  /* Zone 22 — S.06 base, BOTTOM RIGHT of the `left-stack-right`
     layout. Three advisors with avatar + role + company + handle. */
  22: () => (
    <div
      style={{
        width: '100%',
        height: '100%',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
      }}
    >
      <span className="eyebrow">Team · Advisors</span>
      <div
        style={{
          marginTop: 12,
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'flex-start',
        }}
      >
        {[
          {
            name: 'Jeremie Olivier',
            role: 'Core contributor',
            company: 'intuition.box',
            handle: '@olivierjeremie',
            avatar: 'https://unavatar.io/twitter/olivierjeremie',
          },
          {
            name: 'James Woods',
            role: 'Core contributor',
            company: 'Intuition Marketing DAO',
            handle: '@W00DS_eth',
            avatar: 'https://unavatar.io/twitter/W00DS_eth',
          },
          {
            name: 'Billy Luentke',
            role: 'Core contributor',
            company: 'Intuition',
            handle: '@0xbilly',
            avatar: 'https://unavatar.io/twitter/0xbilly',
          },
        ].map((a) => (
          <div
            key={a.name}
            style={{
              flex: '1 1 180px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src={a.avatar}
                alt={a.name}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'block',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  lineHeight: 1.2,
                }}
              >
                <span
                  className="eyebrow"
                  style={{ fontSize: 9, marginBottom: 2 }}
                >
                  {a.company}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                  {a.name}
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    opacity: 0.65,
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.04em',
                    marginTop: 2,
                  }}
                >
                  {a.handle}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  /* Zone 23 — S.06 reveal (COMMUNITY), top-left (2fr). Headline
     metric: 10K on-chain interactions — proof the community shows
     up, beyond the team. */
  23: () => (
    <div style={{ width: '100%', textAlign: 'left' }}>
      <span className="eyebrow">T.02</span>
      <div
        style={{
          marginTop: 12,
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(2.6rem, 1.6rem + 4vw, 6rem)',
          fontWeight: 600,
          lineHeight: 1,
        }}
      >
        13K
      </div>
      <h3
        className="h-section"
        style={{
          margin: '10px 0 8px',
          fontSize: 'clamp(1.1rem, 0.9rem + 0.7vw, 1.6rem)',
        }}
      >
        On-chain interactions, <em>and counting.</em>
      </h3>
      <p
        className="lede"
        style={{
          margin: 0,
          fontSize: 'clamp(0.78rem, 0.7rem + 0.35vw, 1rem)',
        }}
      >
        Every certify, every vote, every trust signal lives on Intuition —
        public, permanent, replayable. Our users aren't a metric; they're the
        network.
      </p>
    </div>
  ),
  /* Zone 24 — S.06 reveal, bottom-left (1fr). Community reward
     narrative: TRUST distributed back to the people who showed up.
     Figure sized to match zone 23 (13K) for visual parity. */
  24: () => (
    /* Absolute positioning anchors the wrapper to the top-left of
       the .zoneContent slot. Compact spacing so the full block
       (label, figure, title, lede) fits inside the 1fr bottom-left
       cell of stack-left-tall-right at typical viewports. */
    <div
      style={{
        position: 'absolute',
        top: 2,
        left: 28,
        right: 28,
        bottom: 4,
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        gap: 6,
      }}
    >
      <span className="eyebrow">T.03</span>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(2rem, 1.2rem + 3vw, 4.4rem)',
          fontWeight: 600,
          lineHeight: 0.95,
        }}
      >
        2 500 TRUST
      </div>
      <h3
        className="h-section"
        style={{
          margin: 0,
          fontSize: 'clamp(1rem, 0.85rem + 0.6vw, 1.4rem)',
          lineHeight: 1.15,
        }}
      >
        Distributed to <em>the community.</em>
      </h3>
      <p
        className="lede"
        style={{
          margin: 0,
          fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.95rem)',
          lineHeight: 1.35,
        }}
      >
        Distributed to the early certifiers, curators, and contributors who
        carried Sofia through its first miles — every signal recorded on
        Intuition, every contributor identified by their wallet. No team
        allocation, no insider round: the people who built the network with us
        are the people the network rewards first.
      </p>
    </div>
  ),
  /* Zone 25 — S.06 reveal, right tall (wipe lead). Community voices:
     a couple of testimonials lifted from `Team.tsx`. */
  25: () => (
    <div style={{ width: '100%', textAlign: 'left' }}>
      <span className="eyebrow">Voices</span>
      <h2
        className="h-section"
        style={{
          margin: '12px 0 18px',
          fontSize: 'clamp(1.6rem, 1.2rem + 2vw, 2.8rem)',
        }}
      >
        Heard from the people <em>who showed up.</em>
      </h2>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {[
          {
            handle: 'anniepro',
            role: 'Early marker',
            quote:
              'Sofia lets you own and train the AI that represents you. Capture what you trust, store it transparently, use it to power smarter decisions and identity online.',
          },
          {
            handle: '0xnova.eth',
            role: 'Independent researcher',
            quote:
              'I had no idea my reading habits were a portfolio. Three weeks in, my Sofia graph reads like a CV I never had to write.',
          },
          {
            handle: 'wiktor6018',
            role: 'Community member',
            quote:
              'Imagine you could gather all the websites and profiles you trust in one place and build your internet identity around it — trusted and safe.',
          },
          {
            handle: 'EmRebel',
            role: 'Web3 builder',
            quote:
              'A browser extension where you verify and share useful content, earn rewards, and discover information through people you trust — not random sources.',
          },
          {
            handle: 'omni6nt',
            role: 'Web3 explorer',
            quote:
              'A web extension that lets you Mark websites based on what you use them for, stored on Intuition. A way to promote safe exploring on the web.',
          },
        ].map((v) => (
          <article
            key={v.handle}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              paddingBottom: 16,
              borderBottom: '1px solid rgba(128,128,128,0.25)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                flexWrap: 'wrap',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                }}
              >
                @{v.handle}
              </span>
              <span
                style={{
                  fontSize: 9,
                  opacity: 0.6,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                }}
              >
                {v.role}
              </span>
            </div>
            <p
              className="lede"
              style={{
                margin: 0,
                fontSize: 'clamp(0.78rem, 0.7rem + 0.35vw, 0.95rem)',
                lineHeight: 1.45,
              }}
            >
              {v.quote}
            </p>
          </article>
        ))}
      </div>
    </div>
  ),
  /* Zone 26 — S.07 left tall. Intro to the doctrine: this is the
     community-staked values manifesto. Tone: declarative, on-chain. */
  26: () => (
    <div style={{ width: '100%', textAlign: 'left' }}>
      <h2
        className="h-display"
        style={{
          margin: '0 0 18px',
          fontSize: 'clamp(2rem, 1.4rem + 3vw, 4.4rem)',
          lineHeight: 0.95,
        }}
      >
        Values{' '}
        <em>
          the community
          <br />
          staked into existence.
        </em>
      </h2>
      <p
        className="lede"
        style={{
          margin: '0 0 12px',
          fontSize: 'clamp(0.9rem, 0.78rem + 0.45vw, 1.15rem)',
          maxWidth: 'none',
        }}
      >
        Sofia doesn&apos;t pick its principles — you do. Each value below was
        surfaced and ranked by the people who staked TRUST on the ones they
        believe in most.
      </p>
      <p
        className="lede"
        style={{
          margin: 0,
          fontSize: 'clamp(0.9rem, 0.78rem + 0.45vw, 1.15rem)',
          maxWidth: 'none',
        }}
      >
        The more conviction behind a value, the more weight it carries in the
        protocol. No board vote, no manifesto written in a back room — just
        signal recorded on Intuition.
      </p>
    </div>
  ),
  /* Zones 27–30 — S.07 quad. Each card is wired to its Intuition triple
     via `tripleId`: the TRUST count comes live from `useVoteStats`
     and the bottom CTA stakes TRUST via `useVoting().depositFor`. */
  27: () => (
    <ValueCard
      tag="Value 01"
      title="Digital Sovereignty"
      desc="The user writes and Marks their own digital history on-chain. Online activity becomes a strategic asset — not a passive trace harvested by someone else."
      tripleId="0xf1b04a678cf6b6bb9150357e6d1a96a83ec45016d542f4201564deed37dbc363"
    />
  ),
  28: () => (
    <ValueCard
      tag="Value 02"
      title="Transparent Integrity"
      desc='We replace "blind trust" with verifiable truth. Local data processing and auditable open-source infrastructure — no black box, just math and code.'
      tripleId="0x89b8575460750b55e0706eb391bcbc3f89b7cba2f2d6d9f839b6e3c25c1a872f"
    />
  ),
  29: () => (
    <ValueCard
      tag="Value 03"
      title="Contribution-Based Power"
      desc="Influence is earned, not bought. Decentralised governance routes weight to the people who build, Mark, and show up — not the people who paid the most to get in."
      tripleId="0x9c113944ab2d277c651f3816a02f45d25157566a52176a88ac3f50169827ac97"
    />
  ),
  30: () => (
    <ValueCard
      tag="Value 04"
      title="Collective Narrative"
      desc="Built in public, open-source by design. Quarterly reports keep us accountable; the community keeps real control over the protocol's direction."
      tripleId="0x4190a5bf28eb7608c9ee34d50a66733cc55bac461f09b9ca8adcc03572f612ec"
    />
  ),
  /* Zone 31 — S.08 narrow left. Q&A intro: brand the FAQ slab as a
     reference desk, set expectations, point to the open channels. */
  31: () => (
    <div style={{ width: '100%', textAlign: 'left' }}>
      <h2
        className="h-display"
        style={{
          margin: '0 0 16px',
          fontSize: 'clamp(1.8rem, 1.3rem + 2.4vw, 3.6rem)',
          lineHeight: 0.95,
        }}
      >
        Frequently <em>asked.</em>
      </h2>
      <p
        className="lede"
        style={{
          margin: '0 0 14px',
          fontSize: 'clamp(0.85rem, 0.74rem + 0.4vw, 1.05rem)',
          maxWidth: 'none',
        }}
      >
        Short answers to the questions that come up most. Need something we
        didn&apos;t cover? Ask us directly.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <SceneBtn
          href="https://discord.gg/sofia3"
          variant="peach"
          style={{ fontSize: '0.85rem' }}
        >
          Ask on Discord{' '}
          <span aria-hidden="true" style={{ marginLeft: 4 }}>
            ↗
          </span>
        </SceneBtn>
      </div>
    </div>
  ),
  /* Zone 32 — S.08 wide right. Compact Q&A list. Source: FAQ.tsx. */
  32: () => {
    const items: { q: string; a: ReactNode }[] = [
      {
        q: 'What is Sofia?',
        a: 'Sofia is a way to share what you find useful online so it benefits everyone. The signals you choose to publish feed a collective intelligence — what people trust, what they read, what they learn — without anyone owning the data themselves.',
      },
      {
        q: 'How does Sofia work?',
        a: 'A browser extension tracks your activity locally on your device. You decide what to keep and Mark it as verified proof on Intuition — everything stays local until you choose to publish.',
      },
      {
        q: 'Is my data safe?',
        a: (
          <>
            Yes. Processed on your device with secure tech even we can&apos;t
            access. Code is{' '}
            <a
              href="https://github.com/intuition-box"
              target="_blank"
              rel="noreferrer noopener"
              style={{ color: 'inherit', textDecoration: 'underline' }}
            >
              open-source
            </a>
            .
          </>
        ),
      },
      {
        q: "What are Sofia's core values?",
        a: 'Digital sovereignty, transparent integrity, identity through action, contribution-based power, and collective narrative — staked into existence by the community.',
      },
      {
        q: 'How do I get started?',
        a: (
          <>
            Connect to the{' '}
            <a
              href="https://explorer.sofia.intuition.box"
              target="_blank"
              rel="noreferrer noopener"
              style={{ color: 'inherit', textDecoration: 'underline' }}
            >
              Explorer
            </a>{' '}
            to read your graph and follow others. To start recording your own
            data, install the{' '}
            <a
              href="https://doc.sofia.intuition.box/docs/extension"
              target="_blank"
              rel="noreferrer noopener"
              style={{ color: 'inherit', textDecoration: 'underline' }}
            >
              browser extension
            </a>
            .
          </>
        ),
      },
      {
        q: 'When will Sofia launch?',
        a: (
          <>
            We&apos;re in beta with early testers now. Join{' '}
            <a
              href="https://discord.gg/sofia3"
              target="_blank"
              rel="noreferrer noopener"
              style={{ color: 'inherit', textDecoration: 'underline' }}
            >
              Discord
            </a>{' '}
            to be part of the journey.
          </>
        ),
      },
    ]
    return (
      <div style={{ width: '100%', textAlign: 'left' }}>
        <dl
          style={{
            margin: 0,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            columnGap: 28,
            rowGap: 18,
          }}
        >
          {items.map((it, i) => (
            <div
              key={it.q}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                paddingBottom: 16,
                borderBottom: '1px solid rgba(128,128,128,0.35)',
              }}
            >
              <dt
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 8,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'clamp(0.92rem, 0.8rem + 0.45vw, 1.2rem)',
                  fontWeight: 500,
                  lineHeight: 1.25,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    opacity: 0.55,
                    letterSpacing: '0.14em',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>{it.q}</span>
              </dt>
              <dd
                className="lede"
                style={{
                  margin: 0,
                  fontSize: 'clamp(0.82rem, 0.72rem + 0.35vw, 1rem)',
                  lineHeight: 1.5,
                  opacity: 0.9,
                  maxWidth: '48ch',
                }}
              >
                {it.a}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    )
  },
  /* Zone 33 — S.09 CTA. Single zone, peach slab. Mirrors the homepage
     CTA exactly (eyebrow + h-display + lede + two buttons) with the
     HexSplit hexagon decoration painted behind. */
  33: () => (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <HexSplit size="520px" color="rgba(0,0,0,0.05)" />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
          maxWidth: 720,
          padding: '0 24px',
        }}
      >
        <span className="eyebrow">Beta · Open</span>
        <h2
          className="h-display"
          style={{
            margin: 0,
            fontSize: 'clamp(2.6rem, 2vh + 6vw, 7.2rem)',
            lineHeight: 1,
          }}
        >
          Join the movement.
        </h2>
        <p
          className="lede"
          style={{
            margin: 0,
            fontSize: 'clamp(0.95rem, 0.82rem + 0.45vw, 1.15rem)',
            maxWidth: '52ch',
          }}
        >
          Your browsing history is your identity — not a PFP, not a token.
          It&apos;s what you actually do, verified on-chain.
        </p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'center',
            marginTop: 6,
          }}
        >
          <a
            href="https://explorer.sofia.intuition.box"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Go to the Explorer <Arrow />
          </a>
          <SceneBtn
            href={URLS.external.discord}
            variant="peach"
            ink="dark"
            hoverFill="white"
          >
            Join our Discord <Arrow />
          </SceneBtn>
        </div>
      </div>
    </div>
  ),
}

/* Per-zone content labels (numbered globally across the deck). The
   placeholder renders this text inside each zone — the big number
   stays as-is. Zones without an entry fall back to "ZONE N". */
export const ZONE_LABELS: Record<number, string> = {
  1: 'catch phrase',
  2: 'partners',
  3: 'graphic vector',
  4: 'graphic vector',
  5: 'Job to be done · why sofia text',
  6: 'Veille technologique',
  7: 'Dynamique de groupe',
  8: 'Intelligence collective',
  9: 'Valoriser le côté social',
  10: 'Video Demo',
  11: 'Plate A · polar radar',
  12: 'Avantage personnel',
  13: 'Extension',
  14: 'Explorer',
  15: 'Open Source',
  16: 'github, intuition.box',
  17: 'Chronicles',
  18: 'Build in public · share with the community',
  19: 'Plate D · stack',
  20: 'Core contributor',
  21: 'Mentors',
  22: 'Supported by Intuition · 20K grant · DAO-oriented',
  23: '10K tx',
  24: 'Nos utilisateurs comptent · 2500 TRUST distribué à la communauté',
  25: 'Témoignages',
  26: "C'est la communauté qui vote sur nos valeurs",
  27: 'Les values sur lesquels tu peux voter',
  28: 'Les values sur lesquels tu peux voter',
  29: 'Les values sur lesquels tu peux voter',
  30: 'Les values sur lesquels tu peux voter',
}
