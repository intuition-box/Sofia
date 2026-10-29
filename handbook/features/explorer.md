# Explorer

> **Calls:** [write-relayer](../../services/write-relayer/README.md), [reputation-api](../../services/reputation-api/README.md), [rpc-proxy](../../services/rpc-proxy/README.md), [pin-proxy](../../services/pin-proxy/), the Intuition indexer.

The web app at `apps/explorer` (Vite + React 18). Routes in `src/App.tsx`; nav order in `components/NavSidebar.tsx`: Platforms, Trending, Spotters, My positions, Explore, Season. Terms: [glossary](../concepts/glossary.md). Writes go through the cart; see [data-model](../concepts/data-model.md).

## Sign-in

- Privy (`lib/providers.tsx`): email, Google or a wallet; accounts without a wallet get a **Privy embedded wallet** that owns their positions. Chain: Intuition mainnet only.
- **Remembered account** (`services/lastAccountService.ts`, `hooks/useAccountWallet.ts`): the last account's addresses are kept in localStorage so a reload shows cached data before Privy restores the session; writes wait for the real wallet.
- Public routes: `/explore`, `/trending`, `/spotters`, `/positions(/:address)`, `/profile/:address`. Others need sign-in.

## /explore (home)

`components/home/ExploreHome.tsx`: search, **Topics** tiles (drill into the feed by topic or intention), **Top Voices** (reputation ranking, see [reputation.md](reputation.md)), **Spotted this month** (see [spotters.md](spotters.md)). `?view=activity` is the full feed.

- The **feed** (`services/sofiaFeedService.ts`) is ordered by positions, not by claim creation: one card per page with its latest backer; tagging an old page brings it back up. 👍 / 👎 on a card queue a Recommend / Oppose in the cart.

## /trending

`services/trendingPagesService.ts`. Pages ranked by **positions opened in the window** (24 h default, 7 d, 30 d), then distinct wallets, then recency.

- Reads the **whole Intuition graph**: Sofia's page claims (distrust excluded) and other apps' claims with canonical support predicates on a web atom. Up to 2,000 positions per walk (marked `truncated` beyond).
- One **page key** per page (`utils/webAtom.ts` `resolveWebKey`): normalized URL (lowercase host, no `www.`, tracking params stripped) or a platform key; several atoms of one URL count once.
- Card: total staked, supporters (lower bound past the indexer's 100-row cap), the 3 first backers, "Take position" (targets Sofia's page market).
- Top strip: free Recommends left (today / month), reset countdown, "+N earned" — from the write-relayer.

## /platforms

`services/platformMarketService.ts`. Platform atoms as markets: total staked (all curves), share price (display only), supporters, your value and change, "Take position". An **ecosystem** line sums every atom that resolves to the same platform across Intuition (read-only context). `/profile/platform/:domain` lists your own pages on a domain.

## /positions

`services/userPositionsService.ts`. Your holdings, grouped Platforms / Claims / Atoms, with deposited, value, change; **Exit** 25 / 50 / 100% through the cart (MultiVault redeem, both curves).

- **Value** = your shares' pro-rata of the vault's assets (no RPC). Spot price × shares is only a last resort: your own deposit raises the spot price and would show a fake gain.
- **Chart** (`PortfolioChart`): P&L over time from the indexer's daily position and price history (since 2026-02-16).
- **Discoveries**: pages where you were first, with followers after you and their P&L.
- **Legacy migration banner**: moves old per-intention claims to the page market (see [data-model](../concepts/data-model.md#legacy-claims)).

## /spotters

See [spotters.md](spotters.md).

## /leaderboard ("Season") and /streaks

- **Season**: all Sofia proxy users ranked by transaction count, with intentions, pioneer (atom creations) and TRUST volume, from the proxy's `TransactionForwarded` events read over RPC (`services/eventFetcher.ts`). Activity is credited to the **receiver** of each deposit (relayer, session keys and smart accounts included).
- **Streaks** (`services/streakService.ts`): consecutive UTC days with a deposit on Sofia's daily certification / vote atoms.

## Profiles

- `/profile` (yours): topic score donut, activity heatmap, achievements (level, XP, badges from on-chain quest tags), Echoes, the Context Manager ("N pages without context").
- `/profile/:address` (anyone, address or ENS): same charts and Echoes, read-only, no achievements.

## Feature flags

`config/features.ts`, all **off** by default, turned on at build with `VITE_FEATURE_<NAME>=true`: `circles`, `compose` (Compose + Perspective), `notifications`, `vote`, `billing`, `circlePro`. Off = nav entry hidden, route redirects to `/explore`. The code is kept.

## Known gaps

- **View-as** mode exists (`hooks/useViewAs.ts`) but nothing in the UI turns it on.
- The exact exit value (`previewRedeem`) is supported by the positions service but no screen passes it; values are pro-rata.
- `/platforms` reads vault stats with an inline GraphQL query (`GetAtomVaultStats`) instead of a codegen'd one.
