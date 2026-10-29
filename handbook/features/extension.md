# Extension

> **Calls:** [write-relayer](../../services/write-relayer/README.md) (free right-click), [pin-proxy](../../services/pin-proxy/), the landing (`/auth`, `/activate`), the Intuition indexer and RPC.

The Chrome extension at `apps/extension` (Plasmo, Manifest V3, side panel). Terms: [glossary](../concepts/glossary.md). **`apps/extension/docs/ARCHITECTURE.md` is out of date** (Gold, XP, quests, Mastra, 10 IndexedDB stores are gone); this page reflects the code.

## Side panel

`sidepanel.tsx`; signed out → connect screen. Dock (`components/layout/BottomNavigation.tsx`): **Page**, **My Profile**, **Settings**, plus a floating cart button.

- **Page** (`components/pages/MarkPage.tsx` → `PageBlockchainCard`): the current page's header, share button, **page market panel** (support / oppose stake, holders, positions this week, "you'd be #N", who recommended first, your positions and P&L, tags, your legacy positions; actions Recommend / Distrust → cart, Exit), tags field, a live preview sentence, position board.
- **My Profile** — three tabs whose labels differ from their code names: _Bookmark_ (`Echoes`), _Collection_ (`Bookmarks`), _Positions_ (`History`).
- **Settings**: wallet, **Publish without popup**, platform pool percentage, data tracking toggle, auto-cleanup, bookmark import, tutorial, clear all data.
- Flags (`lib/config/features.ts`): `circles` off, `socials` off, `echoes` on.

## Right-click

`background/addToSofia.ts`, on pages, links and selections (a right-clicked link wins over the page). Menu **Sofia**: _Add to Sofia…_ (in-page modal to qualify the page), _Recommend_, _Recommend for…_ (one intention each), _Distrust_.

Order of paths for a quick action:

1. No wallet → toast + opens the landing's `/auth`.
2. **Free** (Recommend only): if a relayer session exists, the write-relayer publishes it — see [free-recommends.md](free-recommends.md). On any refusal, continue.
3. No "Publish without popup" session → the page goes to the **cart** (max 40 items).
4. Session active → publishes **0.5 TRUST** right away, no popup; tags follow as best effort.

Toasts are injected in the page; a keep-alive ping stops the service worker from being killed mid-publish.

## Publish without popup

MetaMask Delegation Framework v1.3.0 (`lib/config/delegationConfig.ts`, `lib/signer/*`, `lib/services/DelegationService.ts`). The user activates it once on the landing's `/activate`; a **session key** then signs within limits.

| Mode     | Who sends                                                                   | Where TRUST comes from                                                      | Used for                                                                     |
| -------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `7715`   | the session key                                                             | a periodic permission on the wallet's TRUST (MetaMask Advanced Permissions) | MetaMask                                                                     |
| `hybrid` | a HybridDeleGator smart account owned by the wallet (deployed on first use) | a budget held by that account                                               | Rabby and other wallets                                                      |
| `7702`   | the wallet upgraded with EIP-7702                                           | the wallet                                                                  | kept for updates; MetaMask refuses external delegations for its own accounts |

- **Caveats** (enforced on-chain): only `deposit`, `depositBatch`, `createAtoms`, `createTriples` on the Sofia proxy; **receiver pinned to the user's wallet**; max per action (default 5 TRUST); daily cap (default 10 TRUST); expiry (30 days); redeemer = the session key.
- The session key sits in `chrome.storage.local` in clear, on purpose: its power is bounded by the caveats. It is funded with 0.05 TRUST of gas (top-up asked under 0.002).
- Settings: update limits, top up / withdraw the hybrid budget, revoke.

## Cart and weights

`lib/services/CartService.ts`, IndexedDB `cart_items`, max 40 items (gas cap). One item per page and side; adding a page again merges its tags. **Publish** (`hooks/useCartSubmit.ts`): all items in one `createTriplesBatch` transaction, then votes, then tags.

- Weights: **Light 0.01**, **Medium 0.5** (default), **Strong 1** TRUST. The breakdown shows signal, platform pool, creation cost and fees.
- **Platform pool** (`PlatformPoolService`): 10% by default (0–80%) of a Recommend goes to the page's platform atom, taken out of the stake; only when the domain maps to a platform; skipped under 0.01 TRUST.

## Echoes

Per-domain groups of pages the extension saw (IndexedDB `intention_groups`; label "Bookmark" in the UI). **Levels are automatic** from on-chain certifications on the domain: thresholds `[0, 3, 7, 12, 18, 25, 33, 42, 52, 63, 75]` → levels 1–11 (`lib/utils/levelCalculation.ts`). No Gold, no manual level-up anymore. Changing wallet clears the groups.

## Tracking and privacy

- **Opt-in**: nothing is collected until `tracking_enabled` is set (consent on the tour's welcome screen, toggle in Settings).
- Collected per page: URL, title, meta keywords / description, og:type, time on page. Stored **locally** (Echoes); no browsing data is sent to a server.
- Excluded: sensitive URLs (login, auth, bank, payment, checkout, OAuth, captcha…), mail, ad / analytics hosts, browser pages; tracking params stripped (`background/constants.ts`).
- IndexedDB `sofia-extension-db` v10: `triplets_data`, `user_settings`, `bookmark_lists`, `bookmarked_triplets`, `intention_groups`, `cart_items`.

## Talking to the landing

`background/messageHandlers.ts`. Only `https://sofia.intuition.box`, `https://staging.sofia.intuition.box` (and localhost in dev builds) may message the extension.

- `WALLET_CONNECTED` requires a **SIWE** proof: domain = sender, issued < 5 min ago, signature recovers the wallet.
- `RELAYER_SESSION` (free Recommends) is accepted only for the connected wallet; `WALLET_DISCONNECTED` revokes it.
- Also: `DELEGATION_GRANTED` / `GET_DELEGATION` / `DELEGATION_REVOKED` (publish without popup), `FIRST_CLAIM`, `OPEN_TUTORIAL`, OAuth tokens.

## Also present

Bookmark import (seeds Echoes), onboarding tour (coachmarks on the real UI, restartable from Settings), browsing nudge (icon badge). OAuth social accounts (Twitter, YouTube, Spotify, Discord, Twitch): backend kept, UI hidden (`socials` flag).

## Known leftovers

`ProfileHeader` still has a `totalGold` prop; "Clear all data" still wipes old `*_gold` keys; two hidden Circles tour steps mention Gold; `useGroupAmplify` is exported but unused.
