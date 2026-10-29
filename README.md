![Sofia Banner](apps/extension/assets/banner.png)

**The web, recommended by people.**

![bun](https://img.shields.io/badge/bun-1.3+-fbf0df?logo=bun&logoColor=black)
![node](https://img.shields.io/badge/node-22.13+-339933?logo=node.js&logoColor=white)
![typescript](https://img.shields.io/badge/typescript-5.x-3178c6?logo=typescript&logoColor=white)
![react](https://img.shields.io/badge/react-18%20%7C%2019-61dafb?logo=react&logoColor=black)
![monorepo](https://img.shields.io/badge/monorepo-bun%20workspaces-000)
![intuition](https://img.shields.io/badge/powered%20by-intuition-8b5cf6)

---

Sofia is a community-curated map of the web, built on the [Intuition](https://intuition.systems) protocol. People **recommend** web pages by taking an on-chain position on them; every recommendation is public, dated and owned by the person who made it. Sofia shows which pages people back, who spotted them first, and which pages credible accounts follow.

- **Extension** — recommend any page with a right-click, often for free.
- **Explorer** — what the community recommends, what's trending, your positions, and **Spotters**: a monthly game of finding pages before everyone else.
- **Free Recommends** — signed-in users (email, Google or a wallet) recommend without signing or holding TRUST; Sofia's relayer pays, the position stays theirs.

## Documentation

Start with the **[handbook](handbook/README.md)**:

| I want to…                           | Read                                                                                                                                                                                                                                      |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Run Sofia on my machine              | [local development](handbook/getting-started/local-development.md)                                                                                                                                                                        |
| Know what runs where (prod, staging) | [environments](handbook/operations/environments.md)                                                                                                                                                                                       |
| Configure an app in Coolify          | [deployment variables](handbook/operations/deployment.md)                                                                                                                                                                                 |
| Fix something in production          | [runbooks](handbook/operations/runbooks.md)                                                                                                                                                                                               |
| Learn the vocabulary                 | [glossary](handbook/concepts/glossary.md), [data model](handbook/concepts/data-model.md)                                                                                                                                                  |
| Understand a system                  | [explorer](handbook/features/explorer.md), [extension](handbook/features/extension.md), [free Recommends](handbook/features/free-recommends.md), [Spotters](handbook/features/spotters.md), [reputation](handbook/features/reputation.md) |

## Repository layout

```
core/
├── apps/
│   ├── explorer/         Vite + React 18 — the web app (explore, trending, positions, Spotters)
│   ├── extension/        Plasmo Chrome extension (MV3) — recommend from any page
│   ├── landing/          Vite + React 19 — sofia.intuition.box, extension sign-in (/auth, /activate)
│   ├── og/               Next.js 14 — share cards for X (signed links, no storage)
│   ├── doc/              Vite + React + MDX — documentation site
│   └── blog/             Vite + React + MDX — project blog
├── packages/
│   ├── graphql/          @0xsofia/graphql — Intuition indexer client + codegen
│   ├── taxonomy/         @0xsofia/taxonomy — topics, page claims, on-chain atom registry
│   ├── quests/           @0xsofia/quests — missions (shared by explorer, extension, relayer)
│   ├── reputation/       @0xsofia/reputation — reputation scoring compute
│   └── design-system/    @0xsofia/design-system — components, tokens, styles
├── services/
│   ├── write-relayer/    Hono + Bun + Prisma — free Recommends, paid by Sofia's treasury
│   ├── reputation-api/   Hono + Bun + Prisma — precomputed rankings (Top Voices, Spotters)
│   ├── rpc-proxy/        Hono + Bun — cached, rate-limited relay to the Intuition RPC
│   ├── pin-proxy/        Hono + Bun — IPFS pinning with the server-side key
│   ├── og-proxy/         Hono + Bun — link preview images
│   ├── group-api/        Hono + Bun + Prisma — Circles membership (paused)
│   └── mastra/           Mastra — AI workflows (decommissioned)
└── handbook/             team documentation
```

## Quick start

Requirements: **Bun ≥ 1.3**, **Node.js ≥ 22.13**.

```bash
git clone git@github.com:intuition-box/Sofia.git
cd Sofia
bun install
bun run dev:explorer        # http://localhost:5173
```

`bun install` links every workspace. **Re-run it after pulling a branch that adds or changes a workspace package**, or imports of `@0xsofia/*` fail to resolve.

The explorer runs against the public Intuition indexer with only `VITE_PRIVY_APP_ID` set. Free Recommends, Spotters rankings and the RPC proxy need their services running: env files, databases and start order are in [local development](handbook/getting-started/local-development.md).

| Command                                  | Runs                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| `bun run dev:explorer`                   | explorer on `localhost:5173`                                           |
| `bun run dev:extension`                  | extension dev build in `apps/extension/build/chrome-mv3-dev/`          |
| `bun run dev:landing`                    | landing                                                                |
| `cd services/<name> && bun run dev`      | a service (write-relayer :8792, reputation-api :8790, rpc-proxy :8791) |
| `cd packages/graphql && bun run codegen` | regenerate GraphQL types after editing a `.graphql` file               |
| `bun run typecheck`                      | typecheck every workspace                                              |

**Loading the extension**: `chrome://extensions/` → Developer mode → Load unpacked → `apps/extension/build/chrome-mv3-dev/`.

## How it fits together

- **One market per page.** A page has one claim, `I | recommends | <page>` (bonding curve 2). Recommending = taking a position for it; opposing = a position on its counter vault. Why people recommend it (for work, for learning…) and its topics are tags on that claim.
- **Writes** go through **SofiaFeeProxy**, a contract wrapping Intuition's MultiVault (fixed fee + 5%), from the user's wallet — or from Sofia's **write-relayer** with the user's wallet as receiver (free Recommends).
- **Reads** come from Intuition's GraphQL indexer (`@0xsofia/graphql`, live via WebSocket) and, for chain calls, the **rpc-proxy**. Rankings that are expensive to compute (credibility from the MCP trust engine) are precomputed daily by the **reputation-api**.
- **Shared rules** live in packages so every surface agrees: page claims and taxonomy (`@0xsofia/taxonomy`), missions (`@0xsofia/quests`, used by the explorer to display them and by the relayer to pay credits).

Per-surface docs: [extension architecture](apps/extension/docs/ARCHITECTURE.md), [explorer](apps/explorer/README.md), services READMEs in `services/*/README.md`.

## Intuition — key concepts

| Concept           | Description                                                                           |
| ----------------- | ------------------------------------------------------------------------------------- |
| **Atom**          | An on-chain entity (a page, an account, a topic). Created from data pinned to IPFS.   |
| **Triple**        | A `subject / predicate / object` claim between atoms, e.g. `I / recommends / <page>`. |
| **Vault**         | Each atom and triple has one; positions are shares on a bonding curve, in TRUST.      |
| **Counter vault** | The "against" side of a triple (an Oppose).                                           |
| **term_id**       | The bytes32 id of an atom or triple (`atoms` have no `id` field).                     |

## Contributing

- Branch off `dev`; PRs target `dev`. `dev` deploys to staging, `main` to production ([environments](handbook/operations/environments.md)).
- Explorer and core files follow the root Prettier config (single quotes, trailing commas); the extension has its own. Run `bun run format:check` before pushing.
- GraphQL: declare queries in `packages/graphql/src/queries/*.graphql` and run codegen — no inline queries.
- Extension: barrel imports only (`~/lib/services`, `~/hooks`, `~/lib/utils`), see [.claude/CLAUDE.md](.claude/CLAUDE.md).
- Team docs go in the [handbook](handbook/README.md); never commit a secret.

## License

See [LICENSE](LICENSE).
