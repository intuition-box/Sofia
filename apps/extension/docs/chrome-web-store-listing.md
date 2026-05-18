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

PRIVATE BY DESIGN.
Your browsing stays yours. Only what you choose to Mark becomes a
public signal — and even those are addressed to your wallet, not to us.
We don't store, sell, or read your history. We don't have a server
watching your tabs.

OWNED BY THE COMMUNITY.
Every Mark is a verifiable record on the Intuition protocol. The
roadmap is steered on-chain by contributors via Colony DAO. The code,
the contracts, the data shapes — all open source. Fork it, audit it,
contribute.

BUILT IN PUBLIC.
We expose our decisions, our doubts, our trade-offs. Read the public
build log (Chronicles), join the Discord, talk to the team. What you
see running is what's published.

—

Free. No ads. No tracking. No data sale. We ship every two weeks.

Open the Explorer: https://explorer.sofia.intuition.box
Read the docs: https://doc.sofia.intuition.box
Join the DAO: https://app.colony.io/sofia
GitHub: https://github.com/intuition-box/Sofia
```

## Single-purpose statement (Google review)

> Sofia lets users mark web pages with their intention (learning, work,
> inspiration, trust…) and publishes those marks as verifiable records on
> the Intuition blockchain, feeding a collective knowledge graph the user
> consents to share.

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
