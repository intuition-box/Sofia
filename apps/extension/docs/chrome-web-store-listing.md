# Sofia — Chrome Web Store Listing (v1.0.0)

Source of truth for the public Chrome Web Store listing. Update this file
whenever the listing copy changes so the team has a single reference.

Language: **English (US)** — single locale. The landing
(https://sofia.intuition.box) is the canonical voice; this listing mirrors it.

---

## Title (75 char max)

**Sofia — Mark the web, build collective intelligence**

Alternates kept on file:
- `Sofia — One gesture. Your web, mapped.`
- `Sofia — From surfing the web to owning it`

## Summary / Short description (132 char max)

> Mark the web with one click. Your signals become collective intelligence — no one owns the data, not even us.

(126 chars)

## Category

Productivity

## Detailed description

```
From surfing the web to owning it.

Sofia turns the pages you read into signals you control. One click, one
intention — "this taught me something", "this changed how I think",
"this is worth trusting" — and the web slowly becomes a map you can read
months later, instead of a tab graveyard.

What you actually do with it:

— TECH WATCH —
Filter the noise. See what's rising among the people you follow before
it shows up everywhere. A radar driven by humans, not algorithms.

— GROUP MOMENTUM —
Find the people who think like you. Follow their finds, give weight to
the ones that matter. Your group forms from what you actually do, not
from who you say you are.

— COLLECTIVE INTELLIGENCE —
What thousands of people Mark, read, and trust becomes a shared signal.
A living map of what deserves attention — built together, owned by
no one.

— SOCIAL LEVERAGE —
Your community's trust votes give weight to what you publish. The
social side isn't decoration — it's the multiplier.

ONE GESTURE.
A small button lives in your browser. When a page is useful, click it
and say why. That's it. Sofia remembers the verb, the intention, the
context. No forms, no fields, no organizing.


— DATA SOFIA HANDLES —

Browsing tracking is OFF by default. You explicitly opt in during
onboarding (or in Settings). Until you do, Sofia collects nothing.

When you turn tracking ON, Sofia records — locally on your device,
never transmitted to any server:
  • URLs of pages you visit (tracking parameters like utm_*, fbclid
    are stripped)
  • Page title and basic metadata (description, OG type, headings)
  • Time spent on each page
  Sensitive pages (login, banking, checkout, auth, CAPTCHA, ads) are
  always excluded.

When you click "Mark" on a page (one-shot, per-page action):
  • The page URL and title are written on-chain via your wallet
    signature. Published under your wallet address — public by design.

When you connect a wallet:
  • Your wallet address (read via EIP-6963) and provider name
    (MetaMask, Rabby...). Never your private keys, seed phrase, or
    balances.

When you opt in to a social account (X, GitHub, YouTube, Spotify,
Twitch, Discord):
  • Read-only profile data per the OAuth scopes you approve. Tokens
    stored locally, isolated per wallet, revocable anytime.

Sofia operates no analytics server, no tracking pixels, no ad network.
No data is sold or shared with third parties.

Full Privacy Policy: https://doc.sofia.intuition.box/privacy


— OWNED BY THE COMMUNITY —
Every Mark is a verifiable record on the Intuition protocol. The
roadmap is steered on-chain by contributors via Colony DAO. The code,
the contracts, the data shapes — all open source. Fork it, audit it,
contribute.

— BUILT IN PUBLIC —
We expose our decisions, our doubts, our trade-offs. Read the public
build log (Chronicles), join the Discord, talk to the team. What you
see running is what's published.

—

Free. No ads. No tracking by default. No data sale. We ship every two
weeks.

Open the Explorer: https://explorer.sofia.intuition.box
Read the docs: https://doc.sofia.intuition.box
Privacy policy: https://doc.sofia.intuition.box/privacy
Join the DAO: https://app.colony.io/sofia
GitHub: https://github.com/intuition-box/Sofia
```

## Privacy policy URL (CRITICAL — Chrome Store field)

```
https://doc.sofia.intuition.box/privacy
```

⚠️ Do NOT use `https://sofia.intuition.box/privacy/` — that path falls
back to the landing SPA and returns the home page, not a privacy policy.
The Google reviewer will reject ("Purple Nickel" / Personal or Sensitive
User Data policy violation) if the URL does not return a real privacy
policy document.

## Single-purpose statement (Google review)

> Sofia lets users mark web pages with their intention (learning, work,
> inspiration, trust…) and publishes those marks as verifiable records on
> the Intuition blockchain, feeding a collective knowledge graph the user
> consents to share. Browsing tracking is off by default and requires
> explicit opt-in during onboarding.

## Permission justifications

| Permission | Justification |
|---|---|
| `storage` | Save Marks, preferences, and the certification cart locally. |
| `history` | Show past visits in the side panel so users can Mark recent pages without retyping URLs. |
| `tabs` / `activeTab` | Read the current tab's URL and title when the user clicks "Mark this page". |
| `sidePanel` | Sofia's UI runs in Chrome's side panel. |
| `bookmarks` | Import existing bookmarks during onboarding (opt-in). |
| `identity` | OAuth flow to link social accounts (X, GitHub) as verifiable proofs. |
| `offscreen` | Run wallet signing in an isolated document for security. |
| `scripting` | Detect page metadata (favicon, OG image) to enrich Marks. |
| `host_permissions <all_urls>` | Required to know which page the user is on when they Mark it. Sofia reads the active tab's URL/title only; it does not scrape page content. |

---

## Visual assets — capture plan

### 1) Icons (already shipped)
- `assets/icon-{light,dark}-{16,32,48,64,128}.png`

### 2) Screenshots (1280×800, 5 slots)

| # | Surface | State to capture | Caption overlay |
|---|---|---|---|
| 1 | `MarkPage` side panel + a real article visible behind | `IntentionBubbleSelector` open, one intention highlighted (e.g. "learning") | *One click. One intention. The web becomes a map.* |
| 2 | `CartDrawer` open | 3–4 items mixing intentions + Trust + interest-context badges | *Batch your moves. One transaction, many signals.* |
| 3 | `BatchRewardModal` | Mid-Gold animation (`bggoldreward.mp4` frame) | *Earn Gold for every page you certify.* |
| 4 | `CirclesPage` → `CircleFeedTab` | Feed populated, one like vote highlighted | *See what your circle is reading right now.* |
| 5 | `MyProfilePage` | Échoes levels visible + interest topics | *Your web, mapped. Owned by you.* |

### 3) Promo tiles

| Asset | Size | What it shows |
|---|---|---|
| Small promo tile | 440×280 | Sofia icon + tagline "From surfing the web to owning it." (peach background, dark ink, matches landing) |
| Marquee (optional) | 1400×560 | Same tagline + 4 angle badges (Tech watch · Group momentum · Collective intelligence · Social leverage) |

### 4) Promo video (YouTube, 30–45s)

Reuse the landing's Acte 2 → 3 → 4 narrative. Storyboard:

| t | Shot | Note |
|---|---|---|
| 0:00–0:03 | Landing hero frame, text "From surfing the web to owning it." | Pulled from `apps/landing` |
| 0:03–0:10 | Browser on a real article → open Sofia side panel → MarkPage → select "learning" | Real screen capture |
| 0:10–0:18 | Add 2 more pages → open CartDrawer → tap Submit | Show interest-context badge once |
| 0:18–0:25 | BatchRewardModal → Gold animation | Asset already exists: `assets/bggoldreward.mp4` |
| 0:25–0:35 | CirclesPage → trust vote on a peer's triple | Live indexer data |
| 0:35–0:45 | MyProfilePage zoom on Échoes + CTA "Install Sofia — free, open source" | Outro card |

Audio: instrumental only, no voice-over needed (Chrome Store autoplays muted).

---

## Release links (v1.0.0)

- Explorer: https://explorer.sofia.intuition.box
- Docs: https://doc.sofia.intuition.box
- Discord: https://discord.gg/sofia3
- Colony DAO: https://app.colony.io/invite/sofia/d3c7b0a4-d168-477c-a176-2b5c4eca68da
- GitHub: https://github.com/intuition-box/Sofia
- Landing: https://sofia.intuition.box
