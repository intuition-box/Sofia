# Sofia-Mastra — déploiement Phala Cloud TEE

Container single-process : **Mastra = API OAuth + attestations on-chain**.
**Plus d'IA** (agents/GaiaNet retirés) et **plus de MCP embarqué** (l'explorer
consomme le MCP distant `mcp-trust.intuition.box`). Le TEE sert uniquement à
protéger `BOT_PRIVATE_KEY` (signe les attestations) et la `TOKEN_ENCRYPTION_KEY`
(chiffre les tokens OAuth).

> ⚠️ Post-incident (juin 2026) : l'ancienne CVM a été compromise (MCP exposé sur
> 3001 = vecteur présumé). Cette CVM a été détruite. Le compose ne publie plus
> que `4111`. Tous les secrets ci-dessous sont des valeurs **neuves**.

## Étape 1 — Build & push de l'image

Build context = racine du monorepo (`core/`).

```bash
cd /home/max/Project/sofia-core/core
docker build -f services/mastra/phala-deploy/Dockerfile \
  -t maximesaintjoannis/sofia-mastra:v2.1.0 .
docker login          # avec le NOUVEAU PAT Docker Hub
docker push maximesaintjoannis/sofia-mastra:v2.1.0
```

Rebuild depuis le source actuel (sans MCP) — ne pas réutiliser une image
antérieure qui embarquait le process MCP.

## Étape 2 — Déploiement Phala

1. Bumper l'image dans [`docker-compose.yaml`](./docker-compose.yaml) (`v2.1.0`).
2. Dashboard https://cloud.phala.network → créer/redeployer le CVM `sofia-mastra`.

### Variables d'environnement (UI Phala)

| Variable                                                                | Description                                         |
| ----------------------------------------------------------------------- | --------------------------------------------------- |
| `NODE_ENV`                                                              | `production`                                        |
| `DATABASE_URL`                                                          | `file:/app/data/mastra.db` (volume DStack chiffré)  |
| `TOKEN_ENCRYPTION_KEY`                                                  | 32 bytes hex (64 chars) — REQUIS pour oauth_tokens  |
| `BOT_PRIVATE_KEY`                                                       | Clé privée du bot Human Attestor (NEUVE)            |
| `*_CLIENT_ID` / `*_CLIENT_SECRET`                                       | OAuth (à remettre seulement pour les apps recréées) |
| `GRAPH_API_KEY`, `NEYNAR_API_KEY`, `OPENSEA_API_KEY`, `ETH_MAINNET_RPC` | Signal fetchers                                     |

Pas de var GaiaNet/MCP — config morte supprimée.

### Volume DStack chiffré

| Mount Path  | Description                                                                        |
| ----------- | ---------------------------------------------------------------------------------- |
| `/app/data` | LibSQL persisté (`mastra.db` + tokens OAuth) — **doit être monté**, sinon éphémère |

### Ports

Seul `4111` (API Mastra) est publié — requis car l'extension/explorer appellent
`/oauth/*` et `/api/workflows/*`. **Ne pas republier 3001.**

## Étape 3 — Vérification

```bash
curl https://<url-phala>/health
```

## Test local avant push

```bash
openssl rand -hex 32                      # génère TOKEN_ENCRYPTION_KEY
cd /home/max/Project/sofia-core/core
docker build -f services/mastra/phala-deploy/Dockerfile -t sofia-mastra:test .
cd services/mastra/phala-deploy
IMAGE=sofia-mastra:test docker compose up   # charge le .env voisin
curl http://localhost:4111/health
```

## Architecture

```
┌──────────────────────────────────┐
│  Phala TEE (CVM)                 │
│  Mastra :4111                    │
│  - routes OAuth (/oauth/*)       │
│  - oauth_tokens chiffrés (AES)   │
│  - bot key (TEE-protégé)         │
│  - signal fetchers               │
│  - 3 workflows on-chain          │
└──────────────────────────────────┘
   (plus de MCP, plus d'IA)
```

## Endpoints

| Endpoint                               | Description          |
| -------------------------------------- | -------------------- |
| `GET /health`                          | Health check         |
| `GET /oauth/:platform/authorize`       | Démarre l'OAuth      |
| `POST /oauth/:platform/callback`       | Échange code → token |
| `POST /api/workflows/{id}/start-async` | Lance un workflow    |

Workflows : `socialVerifierWorkflow`, `linkSocialWorkflow`, `signalFetcherWorkflow`.

## Troubleshooting

- **Reboot loop** : `TOKEN_ENCRYPTION_KEY` mal formé (≠ 64 hex), `BOT_PRIVATE_KEY`
  invalide, ou volume `/app/data` non monté (SQLite "unable to open database").
- **Tokens perdus au restart** : volume `/app/data` non monté.
