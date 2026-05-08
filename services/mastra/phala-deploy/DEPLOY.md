# Sofia-Mastra — Phala Cloud TEE deployment

Single-process container running Mastra alone. The Intuition MCP server
lives outside the TEE (deployed on Coolify) since it has no secrets to
protect. The chatbot agent gracefully degrades when MCP is unreachable.

## Prérequis

- Compte Phala Cloud avec accès TEE
- Docker installé localement
- Compte Docker Hub (ou GHCR)

## Étape 1 — Build et push de l'image

### 1.1 Build depuis la racine du mono-repo (`core/`)

```bash
cd /home/max/Project/sofia-core/core
docker build \
  -f services/mastra/phala-deploy/Dockerfile \
  -t maximesaintjoannis/sofia-mastra:v1.5.0 \
  .
```

⚠️ Le **build context est `core/`** (le `.` à la fin). Le Dockerfile copie
`services/mastra/` et `package.json` racine via les paths du workspace.

### 1.2 Push

```bash
docker login
docker push maximesaintjoannis/sofia-mastra:v1.5.0
```

## Étape 2 — Déploiement Phala Cloud

### 2.1 Bump de l'image dans le `docker-compose.yaml`

Editer [`docker-compose.yaml`](./docker-compose.yaml) ligne 4 :

```yaml
image: maximesaintjoannis/sofia-mastra:v1.5.0
```

### 2.2 Redeploy via le dashboard Phala

- https://cloud.phala.network
- Sélectionner ton CVM `sofia-mastra`
- "Redeploy" — il pull la nouvelle image automatiquement

### 2.3 Variables d'environnement (UI Phala)

| Variable | Description |
|---|---|
| `GAIANET_NODE_URL` | URL de ton noeud GaiaNet |
| `GAIANET_MODEL` | Modèle principal (ex: `Qwen2.5-14B-Instruct-Q5_K_M`) |
| `GAIANET_TEXT_MODEL_SMALL` | Modèle small |
| `GAIANET_TEXT_MODEL_LARGE` | Modèle large |
| `GAIANET_EMBEDDING_MODEL` | Modèle d'embeddings |
| `GAIANET_EMBEDDING_URL` | URL embeddings (`/v1/embeddings`) |
| `USE_EMBEDDINGS` | `true` |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `file:/dstack/data/mastra.db` (volume DStack chiffré) |
| `TOKEN_ENCRYPTION_KEY` | 32 bytes hex (64 chars) — REQUIS pour OAuth tokens |
| `MCP_SERVER_URL` | URL externe MCP (Coolify) ou vide si chatbot désactivé |
| `BOT_PRIVATE_KEY` | Clé privée du bot Human Attestor |
| `TWITCH_CLIENT_ID` | OAuth Twitch |

### 2.4 Volume DStack chiffré

| Mount Path | Description |
|---|---|
| `/dstack/data` | LibSQL persisté (`mastra.db` + tokens OAuth) |

## Étape 3 — Vérification

```bash
# Health check
curl https://<ton-url-phala>/api/health

# Test agent
curl -X POST https://<ton-url-phala>/api/agents/chatbotAgent/generate \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello"}]}'
```

## Test local avant push

```bash
# 1. Génère TOKEN_ENCRYPTION_KEY si t'en as pas
openssl rand -hex 32

# 2. Build
cd /home/max/Project/sofia-core/core
docker build -f services/mastra/phala-deploy/Dockerfile -t sofia-mastra:test .

# 3. Démarre via docker-compose (charge .env si présent)
cd services/mastra/phala-deploy
docker-compose up

# 4. Test
curl http://localhost:4111/api/health
```

Crée un `.env` à côté du `docker-compose.yaml` avec les variables ci-dessus
pour que docker-compose les pioche.

## Architecture

```
┌──────────────────────────────────┐
│  Phala TEE (CVM)                 │
│                                  │
│  Mastra :4111                    │
│  - OAuth tokens (chiffrés)       │
│  - Bot private key (TEE-protégé) │
│  - Signal fetchers               │
│  - Workflows onchain             │
│  - Chatbot (sans MCP → dégradé)  │
└──────────────────────────────────┘
         │ HTTP (optionnel)
         ▼
┌──────────────────────────────────┐
│  Coolify (self-hosted)           │
│                                  │
│  MCP Server :3001                │
│  - Lecture knowledge graph       │
│  - Aucun secret                  │
└──────────────────────────────────┘
```

## Endpoints Mastra

| Endpoint | Description |
|---|---|
| `GET /api/health` | Health check |
| `POST /api/agents/{agentId}/generate` | Générer une réponse |
| `POST /api/agents/{agentId}/stream` | Streaming |
| `POST /api/workflows/{workflowId}/run` | Exécuter un workflow |

### Agents disponibles

- `chatbotAgent` (nécessite `MCP_SERVER_URL` pour les tools)
- `themeExtractorAgent`
- `pulseAgent`
- `recommendationAgent`
- `predicateAgent`
- `skillsAnalysisAgent`

### Workflows disponibles

- `sofiaWorkflow`
- `chatbotWorkflow`
- `socialVerifierWorkflow`
- `linkSocialWorkflow`
- `signalFetcherWorkflow`

## Troubleshooting

### Mastra crash avec "MCP unavailable at boot — chatbot tools disabled"
C'est un warning, pas un crash. Mastra démarre, le chatbot répond sans
les tools Intuition. Configure `MCP_SERVER_URL` quand tu veux activer
le chatbot complet.

### Container reboot loop
Vérifier les logs Phala. Causes communes :
- `TOKEN_ENCRYPTION_KEY` manquant ou mal formé (doit être 64 chars hex)
- `BOT_PRIVATE_KEY` invalide
- Volume `/dstack/data` non monté → SQLite "unable to open database"
- `GAIANET_NODE_URL` inaccessible depuis le TEE

### Database not persisted between restarts
Vérifier que le volume `/dstack/data` est bien monté dans la config Phala.
Sans volume, la SQLite est éphémère.
