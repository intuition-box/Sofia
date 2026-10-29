# Spotters

The game of finding pages before everyone else. Page: `/spotters` in the explorer (`/trend-hunters` and the old leaderboard tab redirect there).

Code: [services/reputation-api](../../services/reputation-api/) (`computeTrendHunters.ts`, `trendHunterPool.ts`) · [packages/quests](../../packages/quests/src/missions.ts) · explorer `pages/TrendHuntersPage.tsx`, `components/leaderboard/*`, `components/trending/*`. Code and API use the old names (`trendHunter`, `calls`, `flair`).

## Concepts

| UI                     | Code           | Meaning                                                                                                                   |
| ---------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Spotted page**       | `call`         | a page where the account was among its first 3 recommenders, then at least 5 credible accounts followed, within the month |
| **Influence**          | `flair`        | sum of the credibility of the accounts that followed the account onto pages where it was among the first 3                |
| **Credible account**   | —              | composite trust score > 0 from the MCP trust engine                                                                       |
| **Spotted this month** | `earlySignals` | the month's best spotted pages, credited to their first recommender                                                       |

The reputation-api computes the month daily (scheduled task) and freezes the previous month on the 1st. It reads the whole Intuition graph on Sofia's `I | recommends | page` claims (and the legacy ones).

## Rewards

- **Free Recommends**: +3 per spotted page, +1 per daily mission, +3 for the weekly one — see [free-recommends.md](free-recommends.md#credits-earning-more).
- **Monthly pool**: the Top 10 by Influence share `TREND_HUNTER_POOL_TRUST` (1000) pro rata of Influence, rounded down. Starts with **November 2026** (`TREND_HUNTER_POOL_START`); no pool before. **Paid by hand** at the start of the next month from `GET /trend-hunters?month=YYYY-MM` (each entry's `reward`).
- **Open before the first payout**: the ranking counts every Intuition account, including ones that never used Sofia. Decide between a _Claim_ step (only wallets connected to Sofia are paid, unclaimed shares roll over) and a Sofia-only ranking.

## Missions

Daily (reset 00:00 UTC) and weekly, computed from on-chain positions with the same functions in the explorer (display) and the write-relayer (credits). A position counts from 0.009 TRUST, so a free 0.01 Recommend counts after fees.

| Mission             | Rule                                                          |
| ------------------- | ------------------------------------------------------------- |
| Express 3 interests | recommend 3 pages today                                       |
| Sort your pages     | recommend or oppose 5 pages only one other person recommended |
| Pioneer             | be the first to recommend a page                              |
| Topic of the week   | tag 5 pages with the week's topic                             |

## Page layout (`/spotters`)

Signed in: **Your month** (a dial toward the Top 10, rank, spotted pages, Influence, share of the pool) next to **Pages to sort** and **Today's missions**; then How it works, the ranking, and Spotted this month. Signed out: How it works first with sign-in. The free Recommends counter lives on `/trending`, where they are spent.
