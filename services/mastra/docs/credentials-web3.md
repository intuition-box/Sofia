# Web3 Phase — Credentials Setup Guide

> 10 plateformes web3 ajoutees. Seulement 3 necessitent des credentials.
> Les 7 autres fonctionnent avec des endpoints publics (pas de dashboard a visiter).

---

## Vue d'ensemble

| Plateforme | Type | Credentials requis |
|---|---|---|
| ens | on-chain | **aucun** (viem + public RPC) |
| lido | on-chain | **aucun** (viem + public RPC) |
| snapshot | GraphQL public | **aucun** |
| the-graph | subgraph public | **aucun** (hosted service) |
| wallet-siwe | on-chain | **aucun** (viem + public RPC) |
| lens | GraphQL public | **aucun** |
| aave | subgraph decentralise | `GRAPH_API_KEY` |
| uniswap | subgraph decentralise | `GRAPH_API_KEY` (meme cle) |
| farcaster | Neynar API | `NEYNAR_API_KEY` |
| opensea | OpenSea v2 API | `OPENSEA_API_KEY` |
| coinbase | OAuth2 | `COINBASE_CLIENT_ID` + `COINBASE_CLIENT_SECRET` |

**Total credentials a creer** : 4 env vars (GRAPH_API_KEY, NEYNAR_API_KEY, OPENSEA_API_KEY, COINBASE pair).

**Bonus recommande** : `ETH_MAINNET_RPC` — par defaut on utilise `eth.llamarpc.com` (public, peut rate-limit). En prod, mettre une URL Alchemy/Infura/QuickNode dediee.

---

## 1. GRAPH_API_KEY (pour Aave + Uniswap)

### Dashboard
https://thegraph.com/studio/apikeys/

### Steps
1. Se connecter avec un wallet Ethereum (Metamask, WalletConnect, etc.)
2. Cliquer **"Create API Key"**
3. Nommer la cle : `Sofia Mastra`
4. **Important** : The Graph facture en GRT. Pour la free tier :
   - Free queries : 100 000 queries/mois par API key
   - Suffisant pour < 3000 users actifs par jour (notre cas)
   - Si jamais on depasse : on paye en GRT (on peut buy GRT avec carte ou ETH)
5. Copier la cle (format: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

### Env var
```
GRAPH_API_KEY=...
```

### Utilisation
- Aave v3 subgraph ID : `JCNWRypm7FYwV8fx5HhzZPSFaMxgkPuw4TnR3Gpi81zk`
- Uniswap v3 subgraph ID : `5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV`
- Les deux utilisent la meme API key

---

## 2. NEYNAR_API_KEY (pour Farcaster)

### Dashboard
https://neynar.com/

### Steps
1. S'inscrire (email ou wallet)
2. Aller dans Dashboard → **"API Keys"**
3. Creer une cle pour "Sofia"
4. **Plans** :
   - Starter (free) : 100k requests/mois, 10 req/sec
   - Growth : $200/mois si on depasse
5. Copier la cle

### Env var
```
NEYNAR_API_KEY=...
```

### Note importante
Farcaster est "linked" au wallet — le fetcher cherche une Farcaster account liee a l'adresse Ethereum du user. Si le user n'a pas de compte Farcaster verifie avec son wallet, le fetcher retourne `has_account: 0` (pas une erreur). Normal.

---

## 3. OPENSEA_API_KEY (pour OpenSea)

### Dashboard
https://docs.opensea.io/reference/api-keys

### Steps
1. Se connecter avec un compte OpenSea (lien avec wallet Ethereum)
2. Remplir le formulaire de demande :
   - **Project name** : `Sofia Reputation`
   - **Project description** : `Web3 reputation scoring — read-only NFT data per user wallet`
   - **Use case** : mettre "Read-only aggregate stats for reputation scoring"
3. Attendre approbation (peut prendre 1-2 jours)
4. Une fois approuve, la cle est visible dans le dashboard

### Env var
```
OPENSEA_API_KEY=...
```

### Alternative si approbation lente
Utiliser [Reservoir API](https://reservoir.tools/) ou [Alchemy NFT API](https://www.alchemy.com/nft-api) — mais il faudrait modifier `signals/onchain/opensea.ts` pour pointer vers leur endpoint.

---

## 4. COINBASE_CLIENT_ID + COINBASE_CLIENT_SECRET (OAuth)

### Dashboard
https://www.coinbase.com/oauth/applications

### Steps
1. Se connecter a Coinbase (pas Coinbase Pro/Advanced)
2. **"Create New Application"**
3. Remplir :
   - **Application Name** : `Sofia Explorer`
   - **Description** : `Web3 reputation dashboard`
   - **Redirect URIs** : (ajouter les DEUX — Coinbase accepte plusieurs)
     - `http://localhost:5173/auth/callback`
     - `https://explorer.sofia.intuition.box/auth/callback`
   - **Permitted Origins** (CORS) : pareil
4. **Scopes a demander** (cocher) :
   - `wallet:user:read`
   - `wallet:accounts:read`
5. Sauvegarder → Client ID + Client Secret visibles

### Env vars
```
COINBASE_CLIENT_ID=...
COINBASE_CLIENT_SECRET=...
```

---

## Bonus — ETH_MAINNET_RPC (recommande prod)

Par defaut on utilise `https://eth.llamarpc.com` (public, gratuit, rate-limite).

Pour la prod Phala, mieux vaut un endpoint dedie :

### Alchemy (free tier : 300M compute units/mois)
1. https://dashboard.alchemy.com/ → sign up
2. **"Create new app"** → Ethereum Mainnet
3. Copier l'URL HTTPS de l'endpoint

### Infura (free tier : 100k requests/jour)
1. https://infura.io/ → sign up
2. **"Create new project"** → Ethereum Mainnet
3. Copier l'URL mainnet

### Env var
```
ETH_MAINNET_RPC=https://eth-mainnet.g.alchemy.com/v2/xxxxx
```

Sans cette var, le code utilise LlamaRPC. **Inutile de la bloquer** pour aller en prod.

---

## Recap — env vars a ajouter sur Phala Cloud

```
# Obligatoires
GRAPH_API_KEY=...
NEYNAR_API_KEY=...
OPENSEA_API_KEY=...
COINBASE_CLIENT_ID=...
COINBASE_CLIENT_SECRET=...

# Recommande (sinon fallback public)
ETH_MAINNET_RPC=...
```

---

## Plan de deploiement

1. **Obtenir les 4 credentials** (GRAPH, NEYNAR, OPENSEA, COINBASE) — ~1 journee (OpenSea peut trainer)
2. **Ajouter env vars** dans `.env` local + Phala dashboard
3. **Rebuild Docker image** :
   ```bash
   cd core/
   docker build -f sofia-mastra/phala-deploy/Dockerfile -t maximesaintjoannis/sofia-mastra:v2.0.0 .
   docker push maximesaintjoannis/sofia-mastra:v2.0.0
   ```
4. **Phala dashboard** → update image tag → redeploy
5. **Smoke test** chaque plateforme :
   ```bash
   for P in ens lido aave uniswap snapshot the-graph wallet-siwe lens farcaster opensea coinbase; do
     echo "=== $P ==="
     curl -s -X POST "https://<phala>/api/workflows/signalFetcherWorkflow/start-async" \
       -H "Content-Type: application/json" \
       -d "{\"inputData\":{\"platform\":\"$P\",\"walletAddress\":\"0xTonAdresse\"}}" \
       | python3 -m json.tool
   done
   ```
6. **Frontend** : les 10 plateformes wallet-based auto-connect via Privy. Coinbase passe par le flow OAuth standard.

---

## Plateformes qui marchent SANS credentials

Si tu veux deployer MAINTENANT sans attendre les credentials OpenSea/Neynar/Graph, ces plateformes marchent avec le fallback public RPC :
- ens
- lido
- snapshot (pas de key du tout)
- wallet-siwe
- lens

Ca fait deja 5 plateformes web3 qui fonctionnent en prod immediatement apres le deploy v2.0.0, sans aucune setup supplementaire.

Aave/Uniswap marchent mais avec limite de rate (pas terrible sans GRAPH_API_KEY).

Farcaster/OpenSea/Coinbase attendent leurs credentials.
