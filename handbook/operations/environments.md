# Environments

Two environments in the Coolify project **Sofia** (server **Sofia-Apps**), both built from the repository `intuition-box/Sofia`.

|                                             | production                                                | staging                                                                             |
| ------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Git branch                                  | `main`                                                    | `dev`                                                                               |
| Deploys                                     | automatically on push to `main` (GitHub App source)       | **on demand**: Deploy in Coolify (created from the public repo URL, no webhook yet) |
| Explorer                                    | https://explorer.sofia.intuition.box                      | https://staging-explorer.sofia.intuition.box                                        |
| Landing (`/auth`, `/activate`)              | https://sofia.intuition.box                               | https://staging.sofia.intuition.box                                                 |
| Share cards (og)                            | https://og.sofia.intuition.box                            | https://staging-og.sofia.intuition.box                                              |
| reputation-api                              | https://reputation-api.sofia.intuition.box                | https://staging-reputation-api.sofia.intuition.box                                  |
| rpc-proxy                                   | https://rpc.sofia.intuition.box (`/rpc`)                  | https://staging-rpc.sofia.intuition.box (`/rpc`)                                    |
| write-relayer                               | https://relayer.sofia.intuition.box                       | https://staging-relayer.sofia.intuition.box                                         |
| Database (Neon, project _sofia-reputation_) | branch `production` (databases `neondb`, `write_relayer`) | branch `staging` (a copy taken on 2026-10-29)                                       |
| Relayer treasury                            | `0x3CED7E2b7db82d623Da15C548f74b5742b081f77`              | `0xd561dD8Fa81Ca2D7217649F42d8277B07534Fe5c`                                        |
| Relayer budget                              | 500 TRUST / month, 17 / day                               | 50 / month, 5 / day                                                                 |

Shared by both: pin-proxy (`pin.sofia.intuition.box`), url-img-resolver (`preview.sofia.intuition.box`), Privy app _sofia-dashboard_. The extension's test build points at staging (see [deployment.md](deployment.md#extension-build-not-coolify)).

Every `*.sofia.intuition.box` name already resolves to the server: a new subdomain needs no DNS change. Only one level, though: `staging-x.sofia…` works, `x.staging.sofia…` does not.

## From a change to production

1. Work on a feature branch; open a PR into `dev`.
2. Merged into `dev` → **Deploy** the staging apps that changed (one at a time: parallel builds have filled the server disk once).
3. Test on staging. The smoke test in [local-development.md](../getting-started/local-development.md#smoke-test-signed-in-on-the-explorer) works there too.
4. Merge `dev` into `main` → production rebuilds by itself. Services apply their database migrations when they start.
5. Watch the deploys in Coolify; check `/health` of the services.

A fix that must reach production alone: branch from `main`, merge it into `main`, then merge `main` back into `dev`.

## Making staging deploy on push

Each staging app: **Git Source → Change Git Source → host-intuition-box**. It keeps every setting and variable; pushes to `dev` then rebuild the app.
