import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Hero } from '~/components/prose/Hero'
import { PredGrid } from '~/components/prose/PredGrid'
import { DocCard } from '~/components/prose/DocCard'

/**
 * Docs home — ported 1:1 from the design `HomePage`. NOT a generic
 * "hero + 3 grids": an editorial composition — peach hero, a
 * "Start here" magazine spread, the 8 intentions as the structural
 * motif, an editorial directory of the special pages, and a
 * "Build with Sofia" band. Links point at the real routes; copy is
 * kept close to the design (coherent for the landing surface — the
 * 41 docs bodies are wired in the content pass).
 */
const startSteps = [
  {
    n: '01',
    t: 'Install the extension',
    d: 'Chrome, Brave, Arc. Sign in with any EVM wallet. Takes about a minute.',
    c: 'trusted',
  },
  {
    n: '02',
    t: 'Make your first certification',
    d: 'Browse to a site you trust. Open the Sofia side panel. Pick an intention. Done — it lives on-chain.',
    c: 'learning',
  },
  {
    n: '03',
    t: 'Connect an agent',
    d: 'Sofia exposes an MCP server. Mastra ships an adapter; the chatbot reads your trust graph out of the box.',
    c: 'inspiration',
  },
]

export function HomePage() {
  return (
    <div className="shell shell--full">
      {/* HERO */}
      <section
        className="h-hero"
        style={{ padding: '28px 32px 0', background: 'transparent' }}>
        <Hero
          eyebrow={
            <>
              SOFIA <span style={{ opacity: 0.6 }}>·</span> mainnet ·
              operational
            </>
          }
          title={
            <>
              The web is <em>noisy.</em>
              {' '}
              <br />
              Your trust shouldn't be.
            </>
          }
          desc="Sofia is a browser extension that turns your everyday browsing into a private, portable graph of who and what you trust. Built on Intuition."
          ctas={[
            {
              label: 'Install the extension →',
              href: 'https://sofia.intuition.box',
            },
            { label: 'Read the manifesto', ghost: true, href: '/manifesto' },
          ]}
        />
      </section>

      {/* EDITORIAL OPENING — "Start here" spread */}
      <section
        className="h-start"
        style={{
          padding: '32px 32px 16px',
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr',
          gap: 48,
        }}>
        <div>
          <div
            className="doc-eyebrow"
            style={{ ['--eb-c']: 'var(--trusted)' } as CSSProperties}>
            <span className="dot" /> <b>START HERE</b> · NEW TO SOFIA?
          </div>
          <h2 className="doc-title" style={{ fontSize: 44, marginTop: 18 }}>
            Three steps and you're <em>certifying.</em>
          </h2>
          <p
            className="doc-lede"
            style={{ fontSize: 17, maxWidth: 580 }}>
            Sofia is small on the outside, opinionated on the inside. You
            can be productive in under five minutes — install, first
            certification, wire it into your favorite tools.
          </p>

          <ol
            style={{
              margin: '24px 0 0',
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}>
            {startSteps.map((s) => (
              <li
                key={s.n}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '52px 1fr',
                  gap: 18,
                  padding: '14px 0',
                  borderTop: '1px solid var(--border)',
                  alignItems: 'flex-start',
                }}>
                <span
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 13,
                    fontWeight: 700,
                    color: `var(--${s.c})`,
                    letterSpacing: '0.1em',
                    paddingTop: 2,
                  }}>
                  {s.n}
                </span>
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--display)',
                      fontWeight: 700,
                      fontSize: 19,
                      letterSpacing: '-0.02em',
                    }}>
                    {s.t}
                  </div>
                  <p
                    style={{
                      fontSize: 14,
                      color: 'var(--muted)',
                      lineHeight: 1.55,
                      margin: '6px 0 0',
                      maxWidth: 540,
                    }}>
                    {s.d}
                  </p>
                </div>
              </li>
            ))}
            <li
              style={{ borderTop: '1px solid var(--border)', height: 1 }}
            />
          </ol>
        </div>

        {/* Right: editorial sidebar */}
        <aside>
          <div
            style={{
              padding: 22,
              borderRadius: 'var(--radius)',
              border:
                '1px solid color-mix(in srgb, var(--accent) 32%, var(--border))',
              background:
                'color-mix(in srgb, var(--accent) 6%, var(--card))',
              position: 'relative',
              overflow: 'hidden',
            }}>
            <div
              className="doc-eyebrow"
              style={{ ['--eb-c']: 'var(--accent)' } as CSSProperties}>
              <span className="dot" /> <b>FROM THE MANIFESTO</b>
            </div>
            <blockquote
              style={{
                margin: '18px 0 16px',
                borderLeft: 'none',
                padding: 0,
                fontFamily: 'var(--display)',
                fontStyle: 'italic',
                fontSize: 22,
                lineHeight: 1.4,
                color: 'var(--ink)',
                fontVariationSettings: "'SOFT' 50, 'opsz' 144",
              }}>
              "The web sells you stars because stars cost nothing to give.
              <span style={{ display: 'block', height: 8 }} />
              We chose verbs instead, and we put them on-chain because skin
              in the game changes what people say."
            </blockquote>
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
              }}>
              SAMUEL &amp; MAXIME · MANIFESTO
            </div>
            <Link
              to="/manifesto"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 14,
                fontFamily: 'var(--mono)',
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
              }}>
              READ THE MANIFESTO →
            </Link>
          </div>

          <div
            style={{
              marginTop: 14,
              padding: '14px 18px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--card)',
            }}>
            <div
              className="doc-eyebrow"
              style={
                { ['--eb-c']: 'var(--inspiration)' } as CSSProperties
              }>
              <span className="dot" /> <b>LATEST FROM CHRONICLES</b>
            </div>
            <div
              style={{
                marginTop: 12,
                fontFamily: 'var(--display)',
                fontWeight: 700,
                fontSize: 17,
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
              }}>
              The build-in-public logbook, every Thursday.
            </div>
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 13,
                color: 'var(--muted)',
                lineHeight: 1.5,
              }}>
              What shipped, what stalled, what we're carrying into next
              week.
            </p>
            <a
              href="https://blog.sofia.intuition.box"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 12,
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
              }}>
              READ ON CHRONICLES{' '}
              <span style={{ opacity: 0.5 }}>↗</span>
            </a>
          </div>
        </aside>
      </section>

      {/* SECTION: 8 intentions */}
      <section
        className="h-intentions"
        style={{ padding: '40px 32px 16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 24,
            paddingBottom: 14,
            marginBottom: 18,
            borderBottom: '1px solid var(--border)',
          }}>
          <div>
            <div
              className="doc-eyebrow"
              style={
                { ['--eb-c']: 'var(--inspiration)' } as CSSProperties
              }>
              <span className="dot" /> <b>THE VOCABULARY</b> · 08
              INTENTIONS
            </div>
            <h2
              className="doc-title"
              style={{ marginTop: 14, fontSize: 44 }}>
              Eight verbs. <em>One vocabulary.</em>
            </h2>
          </div>
          <p
            style={{
              color: 'var(--muted)',
              maxWidth: 380,
              fontSize: 14,
              lineHeight: 1.55,
              margin: 0,
            }}>
            Every signal in Sofia is one of eight predicates. We resisted
            the urge to add a ninth — less vocabulary means more
            agreement.
          </p>
        </div>
        <PredGrid />
      </section>

      {/* SECTION: editorial directory of special pages */}
      <section
        className="h-rooms-section"
        style={{ padding: '40px 32px 16px' }}>
        <div
          className="doc-eyebrow"
          style={{ ['--eb-c']: 'var(--accent)' } as CSSProperties}>
          <span className="dot" /> <b>READING ROOMS</b>
        </div>
        <h2 className="doc-title" style={{ marginTop: 14, fontSize: 38 }}>
          Where to go <em>next.</em>
        </h2>

        <div
          className="h-rooms"
          style={{
            marginTop: 22,
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr 1fr',
            gridAutoRows: 'minmax(180px, auto)',
            gap: 14,
          }}>
          {/* Manifesto — featured */}
          <Link
            to="/manifesto"
            style={{
              gridColumn: '1 / 2',
              gridRow: '1 / 3',
              padding: 28,
              borderRadius: 'var(--radius)',
              background: 'var(--accent)',
              color: '#02000e',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
              textDecoration: 'none',
            }}>
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'rgba(2,0,14,0.7)',
              }}>
              EDITORIAL · 1 PAGE
            </div>
            <h3
              style={{
                fontFamily: 'var(--display)',
                fontWeight: 800,
                fontSize: 56,
                lineHeight: 0.95,
                letterSpacing: '-0.03em',
                margin: '14px 0 18px',
                fontVariationSettings: "'SOFT' 30, 'opsz' 144",
                maxWidth: 380,
              }}>
              The{' '}
              <em style={{ fontStyle: 'italic', fontWeight: 400 }}>
                manifesto
              </em>
              .
            </h3>
            <p
              style={{
                fontFamily: 'var(--display)',
                fontStyle: 'italic',
                fontSize: 17,
                lineHeight: 1.45,
                color: 'rgba(2,0,14,0.75)',
                margin: 0,
                maxWidth: 360,
                fontVariationSettings: "'SOFT' 60",
              }}>
              Why we don't trust stars, and what we're building instead.
            </p>
            <div
              style={{
                marginTop: 'auto',
                paddingTop: 18,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontFamily: 'var(--mono)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#02000e',
              }}>
              READ <span>→</span>
            </div>
            <span
              style={{
                position: 'absolute',
                right: -60,
                top: '50%',
                width: 200,
                height: 200,
                background: 'rgba(2,0,14,0.12)',
                clipPath:
                  'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)',
                transform: 'translateY(-50%) rotate(-12deg)',
                pointerEvents: 'none',
              }}
            />
          </Link>

          <DocCard
            kicker="Litepaper · 8 §"
            color="learning"
            title="Litepaper"
            desc="The full technical paper — problem, vocabulary, protocol, extension, privacy, agents, economics, roadmap."
            footer="8 CHAPTERS"
            to="/litepaper"
          />
          <DocCard
            kicker="Diagrams"
            color="fun"
            title="Architecture"
            desc="How Sofia is wired — extension, indexer, on-chain schema, security model."
            footer="READ"
            to="/architecture"
          />
          <DocCard
            kicker="Story"
            color="music"
            title="About us"
            desc="Who's building Sofia and why now."
            footer="READ"
            to="/docs/about"
          />
          <DocCard
            kicker="Integrations · 4 partners"
            color="buying"
            title="Ecosystem"
            desc="Phala, GaiaNet, Mastra, Intuition — how Sofia fits in."
            footer="EXPLORE"
            to="/docs/ecosystem/phala"
          />
        </div>
      </section>

      {/* SECTION: Build with Sofia */}
      <section
        className="h-build-section"
        style={{ padding: '40px 32px 60px' }}>
        <div
          className="h-build"
          style={{
            padding: 28,
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            background: 'var(--card)',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 32,
            alignItems: 'center',
          }}>
          <div>
            <div
              className="doc-eyebrow"
              style={{ ['--eb-c']: 'var(--work)' } as CSSProperties}>
              <span className="dot" /> <b>BUILD WITH SOFIA</b>
            </div>
            <h2
              className="doc-title"
              style={{ marginTop: 12, fontSize: 32 }}>
              Talk to the user's trust graph from any agent.
            </h2>
            <p
              style={{
                color: 'var(--muted)',
                fontSize: 14,
                lineHeight: 1.55,
                margin: '14px 0 0',
                maxWidth: 620,
              }}>
              Sofia ships an MCP server exposing read &amp; write tools
              over the user's certified graph. Mastra ships an adapter;
              the chatbot reads predicates out of the box.
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
            <Link
              className="dnv-cta"
              to="/docs/architecture/overview"
              style={{
                padding: '10px 18px',
                fontSize: 13,
                background: 'var(--ink)',
                color: 'var(--bg)',
              }}>
              Architecture →
            </Link>
            <Link
              className="dnv-cta"
              to="/docs/ecosystem/mastra"
              style={{
                padding: '10px 18px',
                fontSize: 13,
                background: 'transparent',
                color: 'var(--ink)',
                border: '1px solid var(--border)',
              }}>
              Agents docs
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
