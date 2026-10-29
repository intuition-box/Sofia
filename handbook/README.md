# Sofia handbook

Team documentation for the `core` monorepo: how to run it, how it's deployed, and how the main systems work. Per-package details stay next to their code (`apps/*/README.md`, `services/*/README.md`); this handbook links to them.

## Where to start

| I want to…                                                      | Read                                                                         |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Run Sofia on my machine                                         | [getting-started/local-development.md](getting-started/local-development.md) |
| Know what runs where (prod, staging, branches, domains)         | [operations/environments.md](operations/environments.md)                     |
| Configure or create an app in Coolify                           | [operations/deployment.md](operations/deployment.md)                         |
| Fix something in production                                     | [operations/runbooks.md](operations/runbooks.md)                             |
| Understand free Recommends (relayer, extension sessions, costs) | [features/free-recommends.md](features/free-recommends.md)                   |
| Understand Spotters (spotted pages, Influence, missions, pool)  | [features/spotters.md](features/spotters.md)                                 |

## Layout

```
handbook/
├── getting-started/   local setup
├── operations/        environments, Coolify configuration, runbooks
└── features/          how a product system works end to end
```

## Elsewhere in the repo

| Topic                                              | Where                                                                                                                                                                                                                                        |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Services: endpoints, env, rules                    | [services/write-relayer](../services/write-relayer/README.md), [services/reputation-api](../services/reputation-api/README.md), [services/rpc-proxy](../services/rpc-proxy/README.md), [services/group-api](../services/group-api/README.md) |
| Extension architecture and release                 | [apps/extension/docs/](../apps/extension/docs/)                                                                                                                                                                                              |
| Explorer                                           | [apps/explorer/README.md](../apps/explorer/README.md)                                                                                                                                                                                        |
| Share cards (og)                                   | [apps/og/README.md](../apps/og/README.md)                                                                                                                                                                                                    |
| Design system                                      | [packages/design-system/README.md](../packages/design-system/README.md)                                                                                                                                                                      |
| GraphQL client and codegen                         | [packages/graphql/README.md](../packages/graphql/README.md)                                                                                                                                                                                  |
| Product brief (who Sofia is for, tone, principles) | [.agents/context/PRODUCT.md](../.agents/context/PRODUCT.md)                                                                                                                                                                                  |

`/docs` at the repo root is a personal, git-ignored workspace (drafts, plans): nothing there is shared.

## Writing here

- English, plain and specific. One topic per page; link instead of copying.
- **Never a secret value** (keys, database URLs, tokens): say where to find it.
- Wording in the UI vs the code: a "call" is shown as a **spotted page**, "Flair" as **Influence**, "Trend Hunters" as **Spotters**. Code and API keep `calls`, `flair`, `trendHunter`.
