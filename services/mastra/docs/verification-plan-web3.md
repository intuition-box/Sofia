# Plan de verification — Web3 Phase (pour l'agent dans core/)

> A destination de l'agent Claude Code dans le repo `core/`.
> Branche : `feature/oauth-phase-1`
> Commit reference : (celui qui ajoute les 10 plateformes web3)

---

## Objectif

Un agent externe (session Claude Code dans sofia-explorer) a implemente 10 nouvelles plateformes web3 dans sofia-mastra. Ton job : **verifier que l'implementation est correcte et stable** avant le deploy Phala.

## Perimetre — 10 plateformes web3

| Plateforme | Type | Credentials | Fichier |
|---|---|---|---|
| ens | on-chain | aucun | `signals/onchain/ens.ts` |
| lido | on-chain | aucun | `signals/onchain/lido.ts` |
| aave | subgraph | GRAPH_API_KEY | `signals/onchain/aave.ts` |
| uniswap | subgraph | GRAPH_API_KEY | `signals/onchain/uniswap.ts` |
| snapshot | public GraphQL | aucun | `signals/onchain/snapshot.ts` |
| the-graph | public subgraph | aucun | `signals/onchain/the-graph.ts` |
| wallet-siwe | on-chain | aucun | `signals/onchain/wallet-siwe.ts` |
| lens | public GraphQL | aucun | `signals/onchain/lens.ts` |
| farcaster | API key | NEYNAR_API_KEY | `signals/onchain/farcaster.ts` |
| opensea | API key | OPENSEA_API_KEY | `signals/onchain/opensea.ts` |
| coinbase | OAuth2 | COINBASE_CLIENT_ID/SECRET | `signals/coinbase.ts` |

## Fichiers modifies

```
src/mastra/signals/registry.ts          ← Ajout WALLET_BASED_PLATFORMS + 10 register
src/mastra/workflows/signal-fetcher-workflow.ts ← Handle wallet-based (pas de token lookup)
src/mastra/oauth/config.ts              ← Ajout coinbase
src/mastra/oauth/verify.ts              ← Ajout coinbase (Platform type + endpoint + switch)
```

## Fichiers crees

```
src/mastra/signals/onchain/utils.ts     ← mainnet viem client + subgraph helpers
src/mastra/signals/onchain/ens.ts
src/mastra/signals/onchain/lido.ts
src/mastra/signals/onchain/aave.ts
src/mastra/signals/onchain/uniswap.ts
src/mastra/signals/onchain/snapshot.ts
src/mastra/signals/onchain/the-graph.ts
src/mastra/signals/onchain/wallet-siwe.ts
src/mastra/signals/onchain/lens.ts
src/mastra/signals/onchain/farcaster.ts
src/mastra/signals/onchain/opensea.ts
src/mastra/signals/coinbase.ts
docs/credentials-web3.md                ← Guide credentials
docs/verification-plan-web3.md          ← Ce document
```

---

## Checklist de verification

### 1. TypeScript — compile

```bash
cd core/sofia-mastra
pnpm run build
```

**Attendu** : 0 erreur. Si `viem` n'est pas encore dans les deps :

```bash
pnpm install viem
```

(viem est probablement deja installe — utilise deja par les workflows blockchain existants `link-social-workflow.ts` et `social-verifier-workflow.ts`).

### 2. Tests isoles par fetcher (sans credentials)

Les 5 fetchers sans credentials peuvent etre testes des maintenant :

```bash
pnpm run dev
# Une fois le serveur up (port 4111) :

for P in ens lido snapshot wallet-siwe lens; do
  echo "=== $P ==="
  curl -s -X POST "http://localhost:4111/api/workflows/signalFetcherWorkflow/start-async" \
    -H "Content-Type: application/json" \
    -d "{\"inputData\":{\"platform\":\"$P\",\"walletAddress\":\"0xc634457ad68b037e2d5aa1c10c3930d7e4e2d551\"}}" \
    | python3 -m json.tool
done
```

**Attendu** :
- `success: true` pour chacune des 5
- `metrics` contient des cles (pas vide)
- `warnings` array present (peut etre vide)

Si `success: false, error: "no_fetcher"` → le registry n'a pas bien charge la plateforme. Verifier `registry.ts`.

### 3. Tests avec credentials

Apres avoir setup les env vars (voir `credentials-web3.md`) :

```bash
for P in aave uniswap farcaster opensea; do
  echo "=== $P ==="
  curl -s -X POST "http://localhost:4111/api/workflows/signalFetcherWorkflow/start-async" \
    -H "Content-Type: application/json" \
    -d "{\"inputData\":{\"platform\":\"$P\",\"walletAddress\":\"0xTonVraiWallet\"}}" \
    | python3 -m json.tool
done
```

**Attendu** :
- Si credentials ok → `success: true` avec metrics
- Si credentials manquants → `error: "missing_graph_api_key"` ou `"missing_neynar_api_key"` ou `"missing_opensea_api_key"`

### 4. Test OAuth Coinbase

Meme flow que les OAuth Phase 1 (Reddit, Strava, etc.) :

```bash
curl -I "http://localhost:4111/oauth/coinbase/authorize?redirect_uri=http://localhost:5173/auth/callback&state=test"
```

**Attendu** : `302 Found` avec `Location: https://login.coinbase.com/oauth2/auth?...`

### 5. Verifier WALLET_BASED_PLATFORMS

```typescript
// Dans signal-fetcher-workflow.ts
const isWalletBased = WALLET_BASED_PLATFORMS.has(platform)
```

**Points a verifier** :
- [ ] `WALLET_BASED_PLATFORMS` contient bien les 10 platforms (ens, lido, aave, uniswap, snapshot, the-graph, wallet-siwe, lens, farcaster, opensea)
- [ ] coinbase **n'est PAS** dans WALLET_BASED_PLATFORMS (c'est OAuth classique)
- [ ] Quand `isWalletBased === true`, le workflow skip `getToken()` et passe walletAddress comme credential

### 6. Verifier Platform type dans verify.ts

`verify.ts` doit inclure `coinbase` dans le type `Platform` ET dans OAUTH_ENDPOINTS ET dans le switch :

```typescript
export type Platform = "..." | "coinbase"
// ...
const OAUTH_ENDPOINTS: Record<Platform, OAuthEndpoint> = {
  // ...
  coinbase: { url: "...", authHeader: (t) => `Bearer ${t}` },
}
// ...
case "coinbase":
  userId = data.data?.id ? String(data.data.id) : undefined
  // ...
```

### 7. Tests d'integration

Une fois les env vars + OAuth app coinbase creees :

```bash
# Simuler le flow OAuth Coinbase
# 1. Creer une app Coinbase OAuth
# 2. Connecter depuis l'Explorer
# 3. Verifier que le token est stocke dans oauth_tokens
# 4. Appeler signalFetcherWorkflow pour "coinbase" → doit retourner metrics
```

---

## Points sensibles a verifier (code review)

### A. `onchain/utils.ts`

- [ ] `getMainnetClient()` cree un seul client (cache via variable module-scope)
- [ ] `querySubgraph()` throw `missing_graph_api_key` si env manque
- [ ] `queryPublicGraphQL()` verifie bien `response.ok` ET `data.errors`

### B. Fetchers on-chain

- [ ] Tous les fetchers utilisent `ctx?.safeStep` pour les calls secondaires (pattern identique a `github.ts`)
- [ ] `addr` est bien lowercase pour les subgraphs (IDs sensibles a la casse)
- [ ] Pour Lido : les adresses stETH/wstETH sont bonnes (checksum correct)
- [ ] Pour Lens : la query utilise bien l'API v2 (pas v1 deprecated)

### C. registry.ts

- [ ] `WALLET_BASED_PLATFORMS` est exporte (nommage exact : `WALLET_BASED_PLATFORMS`)
- [ ] Les 10 platforms wallet-based sont dedans
- [ ] Les 10 fetchers sont bien `registerFetcher`-es
- [ ] Coinbase est `registerFetcher`-e aussi (mais PAS dans WALLET_BASED_PLATFORMS)

### D. signal-fetcher-workflow.ts

- [ ] Import de `WALLET_BASED_PLATFORMS` depuis `../signals/registry`
- [ ] Branch `isWalletBased` bypass `getToken()` et passe `walletAddress` comme `credential`
- [ ] Les warnings sont propages dans l'output

### E. config.ts

- [ ] `coinbase` est ajoute avec `clientId`/`clientSecret` via `process.env`
- [ ] Les scopes sont `["wallet:user:read", "wallet:accounts:read"]`

---

## Problemes connus / TODO

### 1. ENS subgraph deprecated (hosted service)
L'endpoint `https://api.thegraph.com/subgraphs/name/ensdomains/ens` est l'ancien hosted service qui devait etre migre vers le decentralized network. A la date de l'implementation, il fonctionne encore mais peut etre deprecie. Fallback : la reverse lookup via viem reste, juste les counts de domaines passeraient a 0.

**Action** : tester avec un vrai wallet qui a un ENS (ex: vitalik.eth). Si le subgraph retourne 0, investiguer.

### 2. The Graph network subgraph — meme chose
`https://api.thegraph.com/subgraphs/name/graphprotocol/graph-network-mainnet` peut aussi etre migre. Verifier que l'endpoint repond.

### 3. Aave/Uniswap subgraph IDs
Les subgraph IDs hardcodes dans `aave.ts` et `uniswap.ts` sont des IDs valides au moment de l'implementation. **A verifier** :
- Aave v3 : `JCNWRypm7FYwV8fx5HhzZPSFaMxgkPuw4TnR3Gpi81zk`
- Uniswap v3 : `5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV`

Si jamais ils changent, mettre a jour ces constantes.

### 4. OpenSea API approval
L'API key OpenSea necessite une approbation manuelle (1-2 jours). **Skippable au deploy** : si pas de key, le fetcher throw `missing_opensea_api_key` → le front affiche "score unavailable" pour OpenSea. Le reste marche.

### 5. Coinbase OAuth — nouveau provider
Le code Coinbase utilise les endpoints `login.coinbase.com/oauth2/*`. Il y a une ambiguite : historiquement l'API etait sur `www.coinbase.com/oauth/*`. Verifier que les endpoints sont bons (testables via une vraie creation d'app + flow).

### 6. Farcaster sans Neynar
Le fetcher Farcaster depend de Neynar. Si Neynar API change ou devient trop cher, fallback potentiel :
- Utiliser le Hub Farcaster directement (plus complexe)
- Utiliser Warpcast search API (moins riche mais gratuit)

---

## Deploiement

Une fois toutes les verifications passees :

```bash
# Build
cd core/
docker build -f sofia-mastra/phala-deploy/Dockerfile -t maximesaintjoannis/sofia-mastra:v2.0.0 .

# Push
docker push maximesaintjoannis/sofia-mastra:v2.0.0

# Phala Cloud dashboard :
# - Update image tag → v2.0.0
# - Ajouter env vars : GRAPH_API_KEY, NEYNAR_API_KEY, OPENSEA_API_KEY, COINBASE_CLIENT_ID/SECRET
# - (optionnel) ETH_MAINNET_RPC si on a une cle Alchemy/Infura
# - Redeploy
```

### Smoke test post-deploy

```bash
# Les 5 plateformes sans credentials doivent marcher immediatement
for P in ens lido snapshot wallet-siwe lens; do
  curl -s -X POST "https://<phala>/api/workflows/signalFetcherWorkflow/start-async" \
    -H "Content-Type: application/json" \
    -d "{\"inputData\":{\"platform\":\"$P\",\"walletAddress\":\"0x...\"}}" \
    | python3 -m json.tool
done
```

### UI end-to-end

1. Frontend Explorer deploye avec `feature/oauth-phase-1`
2. User connecte son wallet Privy → cliquer "Connect" sur ENS
3. Statut passe a "Connected" immediatement (pas de popup — auto-connect)
4. Score `web3-crypto` calcule sur le profile

---

## Liste de questions que l'agent doit se poser

1. Est-ce que `WALLET_BASED_PLATFORMS` est bien exporte ET importe dans workflow ?
2. Est-ce que viem est dans `package.json` ?
3. Est-ce que tous les fetchers retournent **des nombres uniquement** (PlatformMetrics) ?
4. Est-ce que les metrics ne contiennent pas de `NaN`, `Infinity`, `null` ?
5. Est-ce que les fetchers qui necessitent une API key **throw** si la key manque (au lieu de retourner un objet vide silencieusement) ?
6. Est-ce que les fetchers on-chain utilisent `safeStep` pour les calls secondaires ?
7. Est-ce que le fetcher OAuth Coinbase suit le meme pattern que github/spotify/etc. ?
8. Est-ce qu'il y a des tests unitaires ? (probablement non — ajouter serait un plus)

Si toutes les reponses sont "oui" → pret pour le deploy.
