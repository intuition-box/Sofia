![Sofia Banner](apps/extension/assets/banner.png)

**Transform your browsing into certified knowledge on the blockchain.**

![bun](https://img.shields.io/badge/bun-1.3+-fbf0df?logo=bun&logoColor=black)
![node](https://img.shields.io/badge/node-22.13+-339933?logo=node.js&logoColor=white)
![typescript](https://img.shields.io/badge/typescript-5.x-3178c6?logo=typescript&logoColor=white)
![react](https://img.shields.io/badge/react-18.2-61dafb?logo=react&logoColor=black)
![monorepo](https://img.shields.io/badge/monorepo-bun%20workspaces-000)
![intuition](https://img.shields.io/badge/powered%20by-intuition-8b5cf6)

---

Sofia is a full-stack knowledge graph product on the [Intuition](https://intuition.systems) protocol. A Chrome extension captures your browsing, an explorer surfaces your on-chain reputation and circles, a gated group-join backend powers membership, and shared packages keep the taxonomy, quests, and GraphQL client in sync across every surface.

This repository is a **bun workspaces monorepo** containing all surfaces: extension, explorer, landing, OG image generator, docs/blog, plus the backend services (group-join API, OG proxy, AI workflows) and shared packages.

## Repository layout

```
core/
├── apps/
│   ├── explorer/         Vite + React 18 — on-chain reputation, circles & discovery
│   ├── extension/        Plasmo Chrome extension (MV3) — browsing certification
│   ├── landing/          Vite + React 19 — marketing landing page
│   ├── og/               Next.js 14 — OG image generator for shared certifications
│   ├── doc/              Vite + React + MDX — documentation site
│   └── blog/             Vite + React + MDX — project blog / logbook
├── packages/
│   ├── graphql/          @0xsofia/graphql — shared GraphQL client + codegen (Intuition indexer)
│   ├── design-system/    @0xsofia/design-system — shared components, hooks, theme tokens, styles
│   ├── taxonomy/         @0xsofia/taxonomy — topics, categories, niches + on-chain atom registry
│   └── quests/           @0xsofia/quests — quest catalogue + XP rewards (minted by ext, read by explorer)
└── services/
    ├── group-api/        Hono + Bun + Prisma/Postgres — gated group-join backend
    ├── og-proxy/         Hono + Bun — OG image proxy
    └── mastra/           Mastra — AI workflows (theme/predicate classification, recommendations)
```

## Stack per surface

| Surface                  | Framework                                        | Key libs                                       |
| ------------------------ | ------------------------------------------------ | ---------------------------------------------- |
| `apps/extension`         | [Plasmo](https://docs.plasmo.com/) (Manifest V3) | Privy, Viem, Wagmi, React Query, Tailwind      |
| `apps/explorer`          | [Vite](https://vitejs.dev/) + React 18           | Privy, Viem, React Router, Radix UI, Ably      |
| `apps/landing`           | [Vite](https://vitejs.dev/) + React 19           | Privy, Viem, React Router, GSAP                |
| `apps/og`                | [Next.js](https://nextjs.org/) 14                | `@vercel/og`, `@vercel/kv`                     |
| `apps/doc`               | [Vite](https://vitejs.dev/) + React + MDX        | `@mdx-js/*`, React Router                       |
| `apps/blog`              | [Vite](https://vitejs.dev/) + React + MDX        | `@mdx-js/*`, React Router                       |
| `packages/graphql`       | tsup + `graphql-codegen`                         | `graphql-request`, `graphql-ws`, React Query   |
| `packages/design-system` | TS source workspace                              | shared theme tokens, components, hooks         |
| `packages/taxonomy`      | TS source workspace                              | topics/categories/niches + atom registry       |
| `packages/quests`        | TS source workspace                              | quest definitions + XP math                    |
| `services/group-api`     | [Hono](https://hono.dev/) + Bun                  | Prisma/Postgres, Privy server-auth, Ably       |
| `services/og-proxy`      | [Hono](https://hono.dev/) + Bun                  | OG image proxy                                 |
| `services/mastra`        | [Mastra](https://mastra.ai/)                     | `@mastra/core`, Viem                           |

## Requirements

- **Node.js** `>= 22.13.0`
- **Bun** `>= 1.3.0` — `curl -fsSL https://bun.sh/install | bash`
- **git**, and a wallet (MetaMask / Rabby) to test the extension
- **PostgreSQL** (or a Neon connection string) for `services/group-api`

## Setup

```bash
git clone git@github.com:intuition-box/Sofia.git
cd Sofia
bun install
```

`bun install` resolves all workspace deps and wires symlinks across `apps/*`, `packages/*`, and `services/*`. **After pulling a branch that adds a new workspace package, re-run `bun install`** so the new symlink is created (otherwise Vite fails to resolve `@0xsofia/*` imports).

Copy the per-app `.env` files (they are **gitignored**):

| Target                                                | Variables                                                                                       |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `apps/explorer/.env`                                  | `VITE_PRIVY_APP_ID`, `VITE_PRIVY_CLIENT_ID`, `VITE_OG_BASE_URL`, `VITE_MCP_TRUST_URL`, `VITE_GROUP_API_URL` |
| `apps/extension/.env.development` / `.env.production` | `PLASMO_PUBLIC_*` vars (network, server URL, Privy, etc.)                                        |
| `apps/og/.env.local`                                  | `@vercel/kv` connection string                                                                  |
| `services/group-api/.env`                             | `DATABASE_URL`, `PRIVY_APP_ID`, `PRIVY_APP_SECRET`, `ABLY_API_KEY`, `CORS_ORIGINS`              |
| `services/mastra/.env`                                | `GAIANET_*`, `DATABASE_URL`, `MCP_SERVER_URL`                                                    |

Build the GraphQL package once (codegen regenerates `src/generated/index.ts`):

```bash
bun run --filter @0xsofia/graphql codegen
```

For `services/group-api`, generate the Prisma client + apply migrations:

```bash
bun run --filter group-api db:generate
bun run --filter group-api db:deploy
```

## Dev commands

Root shortcuts (defined in the top-level `package.json`):

| Command                                     | What it runs                                                 |
| ------------------------------------------- | ------------------------------------------------------------ |
| `bun run dev:explorer`                      | Vite on `localhost:5173`                                     |
| `bun run dev:extension`                     | Plasmo dev, output to `apps/extension/build/chrome-mv3-dev/` |
| `bun run dev:landing`                       | Vite landing page                                            |
| `bun run dev:og`                            | OG proxy (Hono + Bun)                                        |
| `bun run dev:doc`                           | Docs site (Vite)                                             |
| `bun run dev:blog`                          | Blog (Vite)                                                  |
| `bun run dev:group-api`                     | group-join API (Hono + Bun) on `localhost:8788`             |
| `bun run dev:mastra`                        | Mastra AI workflows                                          |
| `bun run --filter @0xsofia/graphql codegen` | Regenerate GraphQL types                                     |

**Loading the extension in Chrome**: after `bun run dev:extension`, open `chrome://extensions/` → enable Developer mode → "Load unpacked" → pick `apps/extension/build/chrome-mv3-dev/`.

## Architecture

The **extension** is the primary Sofia surface. It reads the browser history, proposes intentions (learning, work, fun, buying, inspiration, music, trust, distrust), pins URLs to IPFS, then creates atoms and triples on Intuition via the Sofia fee proxy (fixed fee + 5%).

The **explorer** consumes the same GraphQL indexer to surface a user's reputation, streaks, circles, and discovery ranking. WebSocket subscriptions on the shared `@0xsofia/graphql` package keep UI data live; it also queries a remote MCP trust engine (`VITE_MCP_TRUST_URL`) for reputation scoring.

**Circles** (gated groups) are backed by `services/group-api`: a Hono + Prisma/Postgres backend handling join requests, admin review, membership/roles, and notifications (REST history + Ably realtime push). The on-chain `MEMBER_OF` triple is minted by the user via the explorer cart after an admin approves — the backend only gates access.

Shared logic lives in **packages**: `@0xsofia/taxonomy` (topics/atom registry), `@0xsofia/quests` (quest catalogue + XP), `@0xsofia/design-system` (components/theme), and `@0xsofia/graphql` (indexer client).

Detailed docs per surface:

- [Extension architecture](apps/extension/ARCHITECTURE.md)
- [Explorer realtime](apps/explorer/docs/plan-realtime-architecture.md)
- [group-api security](services/group-api/SECURITY.md)

## Intuition protocol — key concepts

| Concept             | Description                                                                       |
| ------------------- | --------------------------------------------------------------------------------- |
| **Atom**            | Basic on-chain entity (URL, account, concept). Created via IPFS pin + MultiVault. |
| **Triple**          | `Subject / Predicate / Object` relationship between atoms.                        |
| **Vault**           | Staking vault on each atom/triple, TRUST token bonding curve.                     |
| **term_id**         | Unique atom identifier (bytes32 hash).                                            |
| **Sofia Fee Proxy** | Smart contract wrapping MultiVault with fixed + 5% fees.                          |

## Contributing

- Branches off `dev`. PRs target `dev`, then `dev` → `main` for releases.
- After merging `dev` or adding a workspace, re-run `bun install`.
- TypeScript is non-strict (matches existing style).
- Prettier is configured per package (`bun run format`).
- Barrel imports: always `import { X } from "~/lib/services"`, never from individual files (extension specifically — see [extension CLAUDE.md](apps/extension/.claude/CLAUDE.md)).

## License

See [LICENSE](LICENSE).
