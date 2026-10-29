# Free Recommends

Signed-in users recommend pages without signing a transaction or holding TRUST. Sofia's **write-relayer** sends the transaction from a treasury wallet through SofiaFeeProxy, with `receiver` = the user's wallet: **the position, its shares and its withdrawal belong to the user**. The relayer pays and holds nothing (verified on-chain: the treasury has no position).

Code: [services/write-relayer](../../services/write-relayer/) · explorer `hooks/useSponsoredWrite.ts`, `services/sponsoredWriteService.ts` · extension `lib/services/FreeRecommendService.ts` · landing `src/auth/freeRecommends.ts`.

## Who gets them

Any Privy account (email, Google or a crypto wallet) of the explorer's Privy app _sofia-dashboard_. Positions go to the wallet the user writes with when it is theirs, else their embedded wallet.

## Limits

|                             | Default                       | Env                                                          |
| --------------------------- | ----------------------------- | ------------------------------------------------------------ |
| Recommends per account      | 20 / month, 5 / day           | `SPONSOR_QUOTA_MONTHLY`, `SPONSOR_QUOTA_DAILY`               |
| Second opinions (see below) | 5 / day, outside the quota    | `SPONSOR_OPINIONS_DAILY`                                     |
| Relayer budget              | 500 TRUST / month, 17 / day   | `SPONSOR_BUDGET_MONTHLY_TRUST`, `SPONSOR_BUDGET_DAILY_TRUST` |
| Deposit per Recommend / tag | 0.01 TRUST (protocol minimum) | `SPONSOR_DEPOSIT_TRUST`                                      |
| Per request                 | 5 pages, 2 tags per page      | —                                                            |

Each request reserves 0.25 TRUST per triple of budget, then records the real cost. The daily budget keeps a burst of fake accounts from emptying the month.

## Credits: earning more

Added to both quotas, recomputed by the relayer (cached 10 min / 2 min):

- **+3 per spotted page** this month (`SPONSOR_CREDITS_PER_CALL`, read from the reputation-api) — see [spotters.md](spotters.md).
- **Missions**: +1 per daily mission done, +3 for the weekly one, checked on-chain with the same rules the explorer shows (`@0xsofia/quests`).

No claim step: credits appear in the counter at the top of `/trending` ("+N earned this month").

## Second opinions

A Recommend **or an Oppose** on a page exactly one other account recommended doesn't use the quota (its own daily cap). That is the step where pages stall (62% of Sofia pages never get a second account). The explorer's "Pages to sort" queue on `/spotters` serves such pages. `POST /sponsor/oppose` only accepts them, so free opposes can't be used to bury any page.

## The flows

**Explorer** — the cart sees a Recommend-only cart and the free quota → "Publish" calls `POST /sponsor/recommend` with the Privy token. First time only: the wallet approves SofiaFeeProxy on MultiVault (one transaction; the relayer sends the gas when the wallet holds none).

**Extension (right-click)** — the extension has no Privy SDK, so:

1. On the landing's `/auth`, the user signs in (same Privy app as the explorer → same wallet everywhere).
2. The landing gets an **extension session** from the relayer (`POST /sponsor/extension-session`, 90 days, stored as a hash), does the one-time approval if `GET /sponsor/approval` says it's missing, then sends `RELAYER_SESSION` to the extension.
3. Right-click → Recommend: the extension calls the relayer with `Authorization: Extension <token>`. A page with no atom yet is sent as its fields (`pageAtomData`, the same fields the extension pins), so the relayer pins and mints **the same atom** before the Recommend. A new page counts as one Recommend of the quota.
4. Quota used, relayer down: the extension falls back to its usual paths (publish without popup, or the cart).

## Not covered yet

- An email account with no free Recommend left can't pay from the extension (no delegation for Privy embedded wallets yet).
- Distrust by right-click is paid (free opposes only exist for second opinions).
- No alert when a treasury runs low: watch it ([runbooks](../operations/runbooks.md#refill-a-relayer-treasury)).
- The proxy's `TransactionForwarded` event names the relayer as sender; the alpha leaderboard credits the `Deposited` receiver instead.
