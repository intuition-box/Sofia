import type { CSSProperties, ReactNode } from 'react'
import type { ColorKey } from '~/lib/types'
import { Tree } from '~/components/Tree'

/**
 * Manifesto — single continuous essay with the doc-grammar
 * masthead, an opener with a drop cap, and seven numbered
 * `.mfst-thesis` sections. Renders inside the standard reading
 * shell (`shell--no-toc`) so the left sidebar stays visible —
 * the page is part of the doc, not a standalone landing.
 */
const THESES: {
  n: string
  c: ColorKey
  claim: ReactNode
  body: string
}[] = [
  {
    n: '01',
    c: 'distrusted',
    claim: 'A star costs nothing to give.',
    body: "Five-star rating UIs turned trust into a one-tap chore. The result is exactly what you'd expect when an asset has no maintenance cost: it depreciates to zero. Sellers spend on review farms, buyers spend a quarter-second clicking. The signal-to-spend ratio is broken at the source — and every layer built on top inherits that brokenness, multiplied.",
  },
  {
    n: '02',
    c: 'inspiration',
    claim: (
      <>
        Trust is a <em>verb</em>, not a number.
      </>
    ),
    body: "You don't four-star a friend. You don't rate a teacher out of ten. Trust is a relationship spoken in verbs — trusted, learning from, inspired by — and our vocabulary should match the shape of the act. The grammar matters because it changes what the data is allowed to do downstream.",
  },
  {
    n: '03',
    c: 'fun',
    claim: 'Eight verbs, no more.',
    body: 'Folksonomies feel democratic and end up as noise. We tested forty tags. We tested twenty. We tested twelve. Eight is the largest set where median time-to-attest stays under three seconds. Past that, the act of attesting stops being peripheral and starts being a chore — and people stop doing it.',
  },
  {
    n: '04',
    c: 'trusted',
    claim: 'Skin in the game changes what people say.',
    body: 'An on-chain attestation is a public commitment, not a throwaway click. The same person who would happily five-star a hotel they hated will think twice before signing it. We did not pick on-chain for the buzzword; we picked it because permanence is what makes the signal worth reading.',
  },
  {
    n: '05',
    c: 'work',
    claim: 'Your graph is yours. Portable, signed, revisable.',
    body: 'Sofia never owns your data. The protocol does — and you hold the keys. Move apps, churn services, fork the indexer; the trust you accumulated comes with you. We are not in the lock-in business. We are in the portable-trust business.',
  },
  {
    n: '06',
    c: 'learning',
    claim: (
      <>
        Agents need to know <em>your</em> trust, not <em>the</em> trust.
      </>
    ),
    body: 'A generic LLM averages out to mediocrity. Plug a personal trust graph into it and the same model starts reading the web through your lens — without retraining, without scraping, without surveillance. Sofia exposes the graph through MCP. The agent you pick is up to you.',
  },
  {
    n: '07',
    c: 'music',
    claim: 'We will get half of this wrong.',
    body: "We publish the Chronicles every Thursday because being seen building badly in public is better than being unseen building well. The manifesto is a direction, not a contract — and the lightly-revised footer at the bottom of this page is the only honest version of an essay that hopes to age in the open.",
  },
]

export function ManifestoPage() {
  return (
    <div className="shell shell--no-toc">
      <Tree activeId="manifesto" />

      <main className="content">
        {/* HERO — doc-grammar masthead */}
        <section style={{ paddingBottom: 22 }}>
          <div
            className="doc-eyebrow"
            style={{ ['--eb-c']: 'var(--accent)' } as CSSProperties}>
            <span className="dot" /> <b>MANIFESTO</b> · DECEMBER 2025
          </div>
          <h1 className="doc-title" style={{ marginTop: 18, fontSize: 88 }}>
            The web sells you <em>stars</em>.
            <br />
            We sell you <em>verbs</em>.
          </h1>
        </section>

        {/* ESSAY — opener + 7 numbered theses + signature */}
        <section style={{ paddingTop: 16, paddingBottom: 40 }}>
          <article className="prose mfst-prose">
            <p className="mfst-opener">
              <span className="mfst-drop">T</span>he open web pretends trust
              is a one-tap action. Five stars on Amazon, ten on the App
              Store, an upvote on Reddit. None of it survives contact with
              reality — not because people are dishonest, but because no
              one has anything to lose by lying. We started Sofia from a
              different premise. What follows is the short version, in
              seven theses.
            </p>

            {THESES.map((t) => (
              <section
                key={t.n}
                className="mfst-thesis"
                style={{ ['--th-c']: `var(--${t.c})` } as CSSProperties}>
                <h2 className="mfst-h">
                  <span className="mfst-h-n">§{t.n}</span>
                  <span className="mfst-h-claim">{t.claim}</span>
                </h2>
                <p className="mfst-p">{t.body}</p>
              </section>
            ))}

            <div className="mfst-sig">
              <span>
                Written by <b>Samuel &amp; Maxime</b>
              </span>
              <span>December 2025</span>
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}
