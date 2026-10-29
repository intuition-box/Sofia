# Reputation and Circles

Code: [packages/reputation](../../packages/reputation/src/) · [services/reputation-api](../../services/reputation-api/) · explorer `services/derivedReputationService.ts`, `claimSupportersService.ts`, `mcpTrustService.ts`, `hooks/useReputationLeaderboard.ts`, `components/home/TopVoicesSection.tsx`, `components/profile/*`. Terms: [glossary](../concepts/glossary.md).

## The idea

Reputation measures **judgement, not capital**: you gain it when credible people take a position **after you** on what you recommended. Stake size doesn't count.

```
repFromClaim(you, claim) = Σ credibility(staker)   for each staker after you on that claim (your own wallets excluded)
score(you, topic)        = Σ repFromClaim          over your claims in that topic
```

- **Credibility** comes from the MCP trust engine (`https://mcp-trust.intuition.box/mcp`, tool `compute_composite_score`: a composite of eigentrust, agentrank and transitive trust). **Credible** = credibility > 0. Addresses are always lowercased.
- Claims counted: your page claims (co-recommending after you counts) and your `in context of` tag triples (backing your tag after you counts).
- The oppose side mirrors it (early credible opposers of a claim that gets debunked).
- A base score adds 5 points per certification in a topic (`POINTS_PER_CERT`) and a small bonus from your own composite score.

## reputation-api

Computing credibility per follower is slow, so the reputation-api precomputes snapshots (Hono + Bun + Prisma, port 8790).

| Endpoint                                                                | Returns                                                                                                                                                                                               |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /leaderboard` (`?topic=&limit=`)                                   | `{wallet, topicId, score, rank}` rows + `computedAt`. Reserved buckets `__general__` (no topic), `__trusts__`, `__distrust__`. The overall score = sum of a wallet's buckets, computed by the client. |
| `GET /trend-hunters`, `/early-signals`, `/trend-hunters/:wallet`        | Spotters (see [spotters.md](spotters.md))                                                                                                                                                             |
| `POST /internal/leaderboard/compute`, `/internal/trend-hunters/compute` | Recompute (header `x-compute-token`; 202, background; 409 if already running)                                                                                                                         |

Tables: `ReputationSnapshot` (replaced each run), `TrendHunterMonth` and `EarlySignal` (history kept). Credibility is fetched once per unique address, 3 calls at a time, 45 s timeout, failure = 0.

## Where it shows

- **Top Voices** on Explore: a row of profile cards, overall or per topic (topic picker), "Updated X ago"; hidden on error or empty snapshot.
- **Profile**: topic donut (one slice per topic with a score, plus "General", Trusted, Distrusted), the scores page with who lifted your score in a topic ("backers").

## Circles (hidden)

- **Trust circle**: accounts you staked on with `I / trusts / <account>`.
- **Groups**: an on-chain membership triple `is member of`. `services/group-api` (Hono + Prisma, port 8788) gates joining: request → owner / admin / moderator approves → the user mints the membership from the cart. Roles OWNER / ADMIN / MODERATOR / MEMBER. Privy JWT auth, Ably notifications. Security notes: `services/group-api/SECURITY.md`.
- **Status**: off in the explorer (`FEATURES.circles = false`) and in the extension; the code is kept. group-api is paused. The owner predicate atom is not minted yet (the earliest member stands in).
- **Compose / Perspective** (combine circles and topics: merge, intersect, subtract, contrast) is behind the `compose` flag and display-only.

## Known gaps

- `services/reputation-api/README.md` still mentions an `__overall__` bucket and paging, and omits the Spotters routes.
