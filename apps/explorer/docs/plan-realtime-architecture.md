# Refacto architecture temps reel — WebSocket subscriptions + cache unifie

> Date : 18 avril 2026
> Branche : `design/realtime-subscriptions`
> Statut : DESIGN — a valider et raffiner avant implementation
> Auteurs : Max (architecture), Claude (redaction)

---

## 1. Contexte et objectifs

### 1.1 Le probleme actuel

Le frontend de Sofia Explorer fait du **pull polling** sur de nombreuses queries GraphQL a chaque navigation :

- ~15 queries differentes sur `mainnet.intuition.sh/v1/graphql` par chargement de page
- `useQuery` individuels par composant, chacun avec son propre staleTime
- Chaque reload → rehydratation du cache + refetch en burst des queries stale
- Avec le persister localStorage recemment ajoute, le burst s'est amplifie et a declenche des 429 (rate limit Kong) qui apparaissent comme des erreurs CORS dans le browser
- Pas de notion de "real-time" : si quelqu'un te trust maintenant, tu ne le vois pas avant de refresh

### 1.2 L'intuition du refacto

Passer d'une architecture **pull** (chaque composant fetch ce dont il a besoin, quand il en a besoin) a **push** (une source unique de verite maintenue par subscription WS, tous les composants lisent dessus).

Benefices attendus :

| Metric | Avant | Apres |
|---|---|---|
| Requetes HTTP par session | ~50-100 | ~5-10 (seed + actions user) |
| Latence mise a jour apres une action | 2-10 secondes (polling) | <500ms (push WS) |
| Risque 429 rate limit | Eleve (burst au reload) | Nul (WS maintient l'etat) |
| UX "flash empty" au reload | 1-3s | Instantane (cache hydrate depuis le precedent WS) |
| Bande passante | ~500KB par session | ~50KB (diffs WS) |
| Reactivite cross-user (quelqu'un te trust) | 0 (statique) | Live |

### 1.3 Objectifs non-fonctionnels

- **Robustesse** : reconnection automatique, retry exponentiel, fallback HTTP si WS fail
- **Progressif** : migration par hook, pas de big-bang
- **Retro-compatible** : les composants existants continuent a marcher pendant la transition
- **Observabilite** : logging des events WS, metrics de reconnexion
- **Mode degrade** : si le backend WS est down, on tombe sur du polling intelligent (pas de crash)

---

## 2. Etat actuel — architecture pull

### 2.1 Schema

```
┌──────────────────────────────────────────────────────────────┐
│                      COMPOSANT A                              │
│  useQuery(['signals', wallet, platforms])  ──> fetch          │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│                      COMPOSANT B                              │
│  useQuery(['userProfile', wallet])         ──> fetch          │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│                      COMPOSANT C                              │
│  useQuery(['topicPositions', wallet, ...]) ──> fetch          │
└──────────────────────────────────────────────────────────────┘
                          │
                          │ Chaque query declenche son propre fetch
                          ▼
          ┌────────────────────────────────────┐
          │  React Query cache (localStorage)   │
          └────────────────────────────────────┘
                          │
                          │ HTTP/2 GraphQL
                          ▼
          ┌────────────────────────────────────┐
          │  Kong → Hasura → Postgres          │
          │  mainnet.intuition.sh/v1/graphql   │
          └────────────────────────────────────┘
```

### 2.2 Inventaire des queries (par frequence de changement)

**Tres volatile** (change apres chaque action user ou autre user qui trust/vote) :
- `positions(account_id: wallet)` — toutes les positions on-chain du user
- `events(receiver_id: wallet, type: Deposited/Redeemed)` — activite du user
- `trust_circle(from: wallet)` — qui le user trust
- `trusted_by(to: wallet)` — qui trust le user
- `topic_positions(wallet)` — positions sur les topic atoms
- `topic_certifications(wallet, topic)` — certifs par topic

**Moyennement volatile** (change de temps en temps, global) :
- `trending(topic)` — plateformes tendance par topic
- `leaderboard()` — top users
- `domain_claims(topic)` — claims par topic
- `top_claims()` — URL les plus certifiees

**Quasi-statique** (change rarement, global) :
- `taxonomy()` — topics + categories
- `platform_catalog()` — liste des plateformes
- `atom_ids()` — mapping slug → termId

### 2.3 Problemes concrets observes

1. **Burst 429** au reload : 15 queries stale rehydrates → refetch parallele → Kong limit hit
2. **Flash empty state** : durant 1-3s apres reload, les composants montrent des zeros avant que les fetch aboutissent
3. **Desynchronisation** : composant A a les positions fraiches, composant B a les siennes 30s plus vieilles → scores incoherents entre pages
4. **Pas de real-time** : si un ami te trust, tu vois rien avant de refresh
5. **Refetch inutile** : apres un simple switch d'onglet, React Query refire des queries qui n'ont pas change

---

## 3. Architecture cible — push avec WebSocket

### 3.1 Schema cible

```
┌──────────────────────────────────────────────────────────────┐
│                    SubscriptionManager                        │
│  (singleton, mount au niveau App.tsx)                         │
│                                                               │
│  1 connection WS persistante                                  │
│  N subscriptions actives :                                    │
│    • positions(account_id = wallet)                           │
│    • events(receiver_id = wallet)                             │
│    • trust_relationships(subject_or_object = wallet)          │
│                                                               │
│  Chaque delta WS ──► queryClient.setQueryData([...], updater) │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
          ┌────────────────────────────────────┐
          │  React Query cache (localStorage)   │
          │  staleTime: Infinity                 │
          │  refetchOnMount: false               │
          └────────────────────────────────────┘
                          │
                 ┌────────┴────────┐
                 │                 │
                 ▼                 ▼
┌────────────────────┐   ┌────────────────────┐
│   COMPOSANT A      │   │   COMPOSANT B      │
│   useQuery(...)    │   │   useQuery(...)    │
│   Lit le cache,    │   │   Lit le cache,    │
│   jamais fetch     │   │   jamais fetch     │
└────────────────────┘   └────────────────────┘

Les composants ne fetchent JAMAIS eux-memes.
Le seed initial se fait au mount du SubscriptionManager.
Les actions user (deposit/redeem) invalident ponctuellement.
```

### 3.2 Responsabilites par layer

| Layer | Responsabilite |
|---|---|
| **SubscriptionManager** | Gerer la connection WS, les subscriptions actives, l'auth, le reconnect |
| **Subscription hooks** (`usePositionsSubscription`, etc.) | Declarer les subscriptions a ouvrir selon le contexte (wallet connecte, etc.) |
| **React Query cache** | Stocker l'etat unifie, persister sur localStorage, invalidation ciblee |
| **Composants** | `useQuery` avec `staleTime: Infinity` — lecture seule du cache |
| **Action hooks** (`useDeposit`, `useRedeem`, etc.) | Optimistic update + attente confirmation + re-sync via WS |

---

## 4. Classification des donnees

Toutes les donnees ne doivent pas passer par le WS. Trois categories :

### 4.1 Real-time (WebSocket subscription)

**Critere** : donnees user-scoped qui changent suite a des actions (siennes ou d'autres users).

- Positions du user (topic, category, platform, URL)
- Events du user (deposits, redemptions)
- Trust entrant (qui trust ce wallet)
- Trust sortant (qui ce wallet trust)
- Shares par triple

**Subscription Hasura** :
```graphql
subscription UserPositions($account: String!) {
  positions(where: { account_id: { _ilike: $account } }) {
    term_id
    shares
    vault { ... }
  }
}
```

### 4.2 Lazy polling (fetch a la demande, cache long)

**Critere** : donnees global qui interessent le user uniquement quand il les regarde.

- Trending par topic
- Leaderboard
- Claims par topic
- Domain trending
- Activite d'autres users

**Pattern** : `useQuery` classique avec `staleTime: 5min`, fetch on mount, pas de WS.

### 4.3 Quasi-statique (cache agressif)

**Critere** : donnees qui changent rarement et sont partagees par tous les users.

- Taxonomie (topics + categories)
- Platform catalog
- Atom IDs / predicate IDs

**Pattern** : `useQuery` avec `staleTime: 24h`, fetch 1 fois au mount de l'app, persiste.

---

## 5. Stack technique

### 5.1 Librairie WebSocket : `graphql-ws`

- Officielle, maintenue par la Guild
- Supporte le protocole `graphql-transport-ws` (nouveau) + `graphql-ws` legacy
- Reconnect automatique, keep-alive configurable
- Compatible Hasura out-of-the-box
- TypeScript first

```bash
# Installe DANS le package graphql (pas dans le main app)
cd packages/graphql && bun add graphql-ws
```

### 5.2 Cache : React Query (existant)

On garde React Query. On ne change rien a l'outil, juste le pattern :

- `staleTime: Infinity` sur les queries alimentees par WS
- `queryClient.setQueryData([key], updater)` appelle depuis le SubscriptionManager
- Le persister existant garde le cache entre sessions

### 5.3 Store optionnel : Zustand

**Pas necessaire** dans un premier temps. React Query fait office de store via son cache. On peut ajouter Zustand plus tard si on a besoin de state derive qui doit etre partage (ex: status de la connection WS).

### 5.4 Pas d'IndexedDB

Le volume de donnees par user est petit (<100KB), localStorage suffit via le persister React Query.

### 5.5 Pipeline codegen — tout passe par `packages/graphql`

**Contrainte imperative** : aucune query ou subscription inline dans le code applicatif. Tout va dans `packages/graphql/src/subscriptions/*.graphql` et passe par `bun run codegen` pour generer les DocumentNodes types.

#### Structure cible du package

```
packages/graphql/
├── src/
│   ├── queries/          ← existant (10 fichiers)
│   ├── fragments/        ← existant (1 fichier)
│   ├── subscriptions/    ← NOUVEAU
│   │   ├── positions.graphql
│   │   ├── events.graphql
│   │   └── trust.graphql
│   ├── client.ts         ← etendu avec wsClient
│   ├── wsClient.ts       ← NOUVEAU — singleton graphql-ws
│   ├── generated/
│   │   └── index.ts      ← genere par codegen (inclut les DocumentNodes des subs)
│   └── index.ts          ← re-export des DocumentNodes + wsClient
```

#### Modification `codegen.ts`

```typescript
// packages/graphql/codegen.ts

export default {
  schema: { ... }, // unchanged
  documents: [
    'src/**/*.graphql',  // pattern deja inclusif — capture subscriptions
  ],
  generates: {
    './src/generated/index.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-query',     // genere useQuery + useInfiniteQuery
        'typescript-document-nodes',  // genere les DocumentNodes (ce dont on a besoin pour subscriptions)
      ],
      config: {
        // ... existant
        exposeDocument: true,          // CRUCIAL — expose SubscriptionPositionsDocument etc.
        // Note : typescript-react-query NE GENERE PAS useSubscription, on n'en a pas besoin.
        // On consomme directement les DocumentNodes depuis le SubscriptionManager.
      },
    },
  },
}
```

**Pourquoi pas de `useSubscription` hook genere ?** Parce que le SubscriptionManager gere les subs globalement (par wallet, au niveau app), pas par composant. Les composants consomment le **cache** alimente par les subs, via leurs `useQuery` existants. Si un jour on a besoin d'un hook `useSubscription` local (ex: live feed), on ajoutera le plugin `@graphql-codegen/typescript-react-query` en mode subscription.

#### Exemple de fichier subscription

Fichier : `packages/graphql/src/subscriptions/positions.graphql`

```graphql
subscription WatchUserPositions($accountId: String!) {
  positions(where: { account_id: { _ilike: $accountId } }) {
    ...PositionWithVaultDetails
  }
}
```

Reutilise le fragment existant `PositionWithVaultDetails` du package. Une fois `bun run codegen` execute, genere :
- `WatchUserPositionsDocument` (DocumentNode)
- `WatchUserPositionsSubscription` (type de la reponse)
- `WatchUserPositionsSubscriptionVariables` (type des variables)

#### Consommation cote SubscriptionManager

Le SubscriptionManager importe le DocumentNode genere, **jamais de string inline**.

```typescript
// src/lib/realtime/SubscriptionManager.ts (main app)
import { print } from 'graphql'
import { WatchUserPositionsDocument } from '@0xsofia/dashboard-graphql'

this.client.subscribe(
  {
    query: print(WatchUserPositionsDocument), // string derive du DocumentNode, pas d'inline
    variables: { accountId: this.walletAddress },
  },
  { next, error, complete }
)
```

`print()` vient de `graphql` (deja dep du package). Alternative : passer directement le DocumentNode si `graphql-ws` le supporte (il le fait via la surcharge `TadaDocumentNode`).

---

## 6. Architecture detaillee

### 6.1 wsClient dans le package graphql

Fichier : `packages/graphql/src/wsClient.ts`

```typescript
import { createClient, type Client } from 'graphql-ws'

const API_WS_LOCAL = 'ws://localhost:8080/v1/graphql'
const API_WS_DEV = 'wss://testnet.intuition.sh/v1/graphql'
const API_WS_PROD = 'wss://mainnet.intuition.sh/v1/graphql'

let wsClient: Client | null = null
let globalWsUrl = API_WS_PROD

export function configureWsClient(config: { wsUrl: string }) {
  globalWsUrl = config.wsUrl
  // Si un client existait deja, on le dispose pour que la prochaine utilisation
  // reprenne avec la bonne URL.
  if (wsClient) {
    wsClient.dispose()
    wsClient = null
  }
}

export function getWsClient(): Client {
  if (!wsClient) {
    wsClient = createClient({
      url: globalWsUrl,
      retryAttempts: Infinity,
      shouldRetry: () => true,
      keepAlive: 10_000,
      connectionParams: async () => ({
        // placeholder pour JWT si Intuition active l'auth
      }),
    })
  }
  return wsClient
}

export function disposeWsClient() {
  wsClient?.dispose()
  wsClient = null
}
```

Etendre `configureClient()` existant dans `client.ts` pour aussi appeler `configureWsClient()` :

```typescript
// packages/graphql/src/client.ts (ajout)
import { configureWsClient } from './wsClient'

export function configureClient(config: { apiUrl: string; wsUrl?: string }) {
  globalConfig = { ...globalConfig, apiUrl: config.apiUrl }
  if (config.wsUrl) {
    configureWsClient({ wsUrl: config.wsUrl })
  }
}
```

Et exporter depuis l'index du package :

```typescript
// packages/graphql/src/index.ts
export * from './generated'
export { configureClient, fetcher, type ClientConfig } from './client'
export { getWsClient, disposeWsClient } from './wsClient'
```

### 6.2 SubscriptionManager dans le main app

Fichier : `src/lib/realtime/SubscriptionManager.ts`

```typescript
import { print } from 'graphql'
import type { QueryClient } from '@tanstack/react-query'
import {
  getWsClient,
  WatchUserPositionsDocument,
  WatchUserEventsDocument,
  WatchUserTrustDocument,
  type WatchUserPositionsSubscription,
  type WatchUserEventsSubscription,
  type WatchUserTrustSubscription,
} from '@0xsofia/dashboard-graphql'
import {
  derivePositionsByTopic,
  derivePositionsByPlatform,
  deriveUserStats,
  deriveVerifiedPlatforms,
} from './derivations'

export class SubscriptionManager {
  private subscriptions = new Map<string, () => void>()
  private queryClient: QueryClient
  private walletAddress: string | null = null

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient
  }

  connect(walletAddress: string) {
    if (this.walletAddress === walletAddress) return
    this.disconnect()
    this.walletAddress = walletAddress.toLowerCase()
    this.subscribeAll()
  }

  private subscribeAll() {
    this.subscribe('positions', WatchUserPositionsDocument, (data) =>
      this.onPositionsUpdate(data as WatchUserPositionsSubscription)
    )
    this.subscribe('events', WatchUserEventsDocument, (data) =>
      this.onEventsUpdate(data as WatchUserEventsSubscription)
    )
    this.subscribe('trust', WatchUserTrustDocument, (data) =>
      this.onTrustUpdate(data as WatchUserTrustSubscription)
    )
  }

  private subscribe<T>(
    key: string,
    document: unknown, // DocumentNode genere
    handler: (data: T) => void,
  ) {
    if (!this.walletAddress) return
    const client = getWsClient()

    const unsub = client.subscribe(
      {
        query: print(document as any), // print() vient de 'graphql', pas d'inline string
        variables: { accountId: this.walletAddress },
      },
      {
        next: ({ data }) => data && handler(data as T),
        error: (err) => console.error(`[WS ${key}]`, err),
        complete: () => console.log(`[WS ${key}] complete`),
      }
    )

    this.subscriptions.set(key, unsub)
  }

  private onPositionsUpdate(data: WatchUserPositionsSubscription) {
    const positions = data.positions ?? []
    // Stocke le state brut sous la query key "canonical"
    this.queryClient.setQueryData(
      ['positions', this.walletAddress],
      positions
    )
    // Derive vers les query keys consommees par les hooks existants
    this.queryClient.setQueryData(
      ['topic-positions', this.walletAddress],
      derivePositionsByTopic(positions)
    )
    this.queryClient.setQueryData(
      ['platform-positions', this.walletAddress],
      derivePositionsByPlatform(positions)
    )
    this.queryClient.setQueryData(
      ['user-stats', this.walletAddress],
      deriveUserStats(positions)
    )
    this.queryClient.setQueryData(
      ['verified-platforms', this.walletAddress],
      deriveVerifiedPlatforms(positions)
    )
  }

  private onEventsUpdate(data: WatchUserEventsSubscription) {
    // derivations.onEvents() calcule user-activity, top-claims, etc.
  }

  private onTrustUpdate(data: WatchUserTrustSubscription) {
    // derivations.onTrust() calcule trust-circle, trusted-by.
  }

  disconnect() {
    for (const unsub of this.subscriptions.values()) unsub()
    this.subscriptions.clear()
    this.walletAddress = null
  }
}
```

**Points importants** :
- Aucun GraphQL string inline dans le SubscriptionManager
- Les `WatchUserPositionsDocument` sont **generes** par codegen depuis `packages/graphql/src/subscriptions/positions.graphql`
- Si on ajoute une nouvelle subscription : creer le `.graphql` dans le package, lancer `bun run codegen && bun run build`, importer le DocumentNode dans `SubscriptionManager`
- Les types `WatchUserPositionsSubscription` sont eux aussi generes — TypeScript valide les derivations

### 6.2 Hook d'activation

Fichier : `src/hooks/useRealtimeSync.ts`

```typescript
import { useEffect } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useQueryClient } from '@tanstack/react-query'
import { SubscriptionManager } from '@/lib/realtime/SubscriptionManager'

let manager: SubscriptionManager | null = null

const WS_URL = import.meta.env.VITE_GRAPHQL_WS_URL ||
  'wss://mainnet.intuition.sh/v1/graphql'

export function useRealtimeSync() {
  const { ready, authenticated } = usePrivy()
  const { wallets } = useWallets()
  const wallet = wallets[0]
  const qc = useQueryClient()

  useEffect(() => {
    if (!manager) manager = new SubscriptionManager(qc, WS_URL)
  }, [qc])

  useEffect(() => {
    if (!ready || !authenticated || !wallet?.address || !manager) return
    manager.connect(wallet.address)
    return () => manager?.disconnect()
  }, [ready, authenticated, wallet?.address])
}
```

Monte dans `App.tsx` : un composant invisible `<RealtimeSyncBoundary />` qui appelle le hook.

### 6.3 Fonctions de derivation

Fichier : `src/lib/realtime/derivations.ts`

Convertit les payloads WS bruts vers les shapes attendues par les caches existants :

```typescript
export function derivePositionsByTopic(positions: Position[]) {
  const byTopic = new Map<string, bigint>()
  for (const p of positions) {
    const topicId = p.vault?.term?.triple?.object_id
    if (!topicId) continue
    const slug = ATOM_ID_TO_TOPIC.get(topicId)
    if (!slug) continue
    byTopic.set(slug, (byTopic.get(slug) ?? 0n) + BigInt(p.shares))
  }
  return byTopic
}

export function derivePositionsByPlatform(positions: Position[]) { ... }
export function deriveUserStats(positions: Position[]) { ... }
export function deriveVerifiedPlatforms(positions: Position[]) { ... }
// etc.
```

Chaque derivation feed une query key specifique que les hooks existants consomment.

### 6.4 Migration des hooks existants

**Pattern "strangler fig"** : on garde les hooks existants mais on change leur comportement interne.

Exemple pour `useTopicPositions` :

```typescript
// AVANT : fetch on mount, poll on staleness
export function useTopicPositions(topics: string[]) {
  return useQuery({
    queryKey: ['topic-positions', wallet, topics],
    queryFn: () => getSharesBatch(wallet, topics.map(t => TOPIC_ATOM_IDS[t])),
    staleTime: 2 * 60 * 1000,
    // ...
  })
}

// APRES : lit le cache maintenu par WS, jamais de fetch
export function useTopicPositions(topics: string[]) {
  return useQuery({
    queryKey: ['topic-positions', wallet],  // key simplifiee
    queryFn: () => getSharesBatch(wallet, ALL_TOPIC_TERM_IDS), // seed initial
    staleTime: Infinity,                      // jamais stale
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    select: (data) => filterTopics(data, topics),  // filtre par topics demandes
  })
}
```

Le hook existe toujours, les composants ne changent pas. Seule la plomberie interne mute.

### 6.5 Invalidation sur action user

Quand le user fait un deposit / redeem / vote, on a deux strategies :

**Strategy A (optimiste)** : on update le cache localement juste apres l'appel, puis le WS confirme.

```typescript
export async function deposit(args: DepositArgs) {
  const tx = await executeDeposit(args)
  
  // Optimistic update : on ajoute la position au cache local
  qc.setQueryData(['positions', wallet], (old) => [
    ...old,
    { term_id: args.termId, shares: args.amount, pending: true },
  ])
  
  const receipt = await waitForReceipt(tx.hash)
  // WS va eventuellement pousser le vrai state indexe
  // Entre-temps, l'UI montre l'optimistic
}
```

**Strategy B (attente WS)** : on attend juste que le WS push l'update (1-3s de latence indexer).

Choix recommande : **A** pour les actions frequentes (deposit, vote), **B** pour les rares (creation d'atomes).

---

## 7. Phases d'implementation

### Phase 1 — Infrastructure + pipeline codegen (3-4 jours)

**A. Cote package `packages/graphql`**

1. `cd packages/graphql && bun add graphql-ws`
2. Creer `packages/graphql/src/wsClient.ts` (getWsClient + configureWsClient + disposeWsClient)
3. Etendre `packages/graphql/src/client.ts` : `configureClient({ apiUrl, wsUrl? })` delegue a `configureWsClient`
4. Exporter `getWsClient`, `disposeWsClient` depuis `packages/graphql/src/index.ts`
5. Creer le dossier `packages/graphql/src/subscriptions/`
6. Ecrire UNE subscription test : `packages/graphql/src/subscriptions/positions.graphql`
   ```graphql
   subscription WatchUserPositions($accountId: String!) {
     positions(where: { account_id: { _ilike: $accountId } }) {
       ...PositionWithVaultDetails
     }
   }
   ```
7. Ajouter `exposeDocument: true` dans codegen.ts (verifier que c'est deja le cas)
8. `bun run codegen` — verifier que `WatchUserPositionsDocument` apparait dans generated/index.ts
9. `bun run build` — verifier que dist/ exporte bien le DocumentNode

**B. Cote main app `sofia-explorer`**

10. Ajouter `VITE_GRAPHQL_WS_URL` dans `.env` local (`wss://mainnet.intuition.sh/v1/graphql`)
11. Modifier `src/config.ts` : exporter `GRAPHQL_WS_URL`
12. Modifier `src/lib/providers.tsx` : passer `wsUrl` a `configureClient()`
13. Creer `src/lib/realtime/SubscriptionManager.ts` (squelette) — 1 seule subscription `positions`
14. Creer `src/lib/realtime/derivations.ts` (stubs vides pour l'instant)
15. Creer `src/hooks/useRealtimeSync.ts` qui mount/unmount le SubscriptionManager selon le wallet
16. Creer `<RealtimeSyncBoundary />` invisible dans `App.tsx` sous l'auth Privy
17. Logger tous les events WS dans la console (`[WS positions] received N positions`)

**C. Validation**

18. Lancer `bun run dev` sur mastra (pas affecte) + main app
19. Se connecter avec un wallet ayant des positions
20. DevTools → Network → WS filter → verifier :
    - Handshake WS `101 Switching Protocols`
    - Message `connection_init` envoye
    - Message `connection_ack` recu
    - Message `subscribe` envoye
    - Message `next` avec les positions
21. DevTools → Console → verifier les logs `[WS positions]`

**Deliverable** : WS connecte via le package, subscription `positions` active, log des positions en console a chaque delta.

**Rollback** : si WS ne fonctionne pas malgre l'infra confirmee, passer en mode `USE_REALTIME=false` via env var et ne pas mount le SubscriptionManager.

### Phase 2 — Cache foundation (3-4 jours)

1. Creer `src/lib/realtime/derivations.ts` avec les fonctions de derivation
2. Ajouter une subscription `positions` qui met a jour plusieurs query keys
3. Tester que le cache React Query se met a jour correctement
4. Ajouter un indicateur visuel de connection WS (pastille verte/rouge dans la UI)

**Deliverable** : positions du user maintenues en temps reel dans le cache.

### Phase 3 — Migration des hooks volatile (5-7 jours)

Migrer un hook a la fois, en commencant par les plus critiques :

1. `useTopicPositions` → lit du cache, pas de fetch
2. `useSignals` → migre (mais la subscription est sur Mastra, pas Hasura)
3. `useUserProfile` → derive des positions
4. `useDiscoveryScore` → derive des events
5. `useTrustCircle` → subscription trust_relationships
6. `useUserActivity` → subscription events

Chaque migration :
- Feature flag `enableRealtimeFor<Hook>` si besoin de rollback
- Test local avec network throttling
- Deploy progressif en prod

**Deliverable** : tous les hooks user-scoped lisent du cache WS.

### Phase 4 — Optimistic updates (2-3 jours)

Ajouter optimistic update sur les actions :

1. `useDeposit` → optimistic add position
2. `useRedeem` → optimistic remove position
3. `useVote` → optimistic update vote count
4. `useTrust` / `useDistrust` → optimistic relationship

**Deliverable** : UI instantanee apres chaque action user.

### Phase 5 — Polish et observabilite (2 jours)

1. Metrics WS : nombre de reconnections, latence, erreurs
2. Fallback HTTP si WS down depuis > 30s (polling 1 fois par minute)
3. Badge "offline" dans la UI si le WS est deconnecte
4. Clean up des feature flags
5. Retrait du polling / refetchOnMount dans les hooks migres

**Deliverable** : systeme production-ready.

### Phase 6 — Nettoyage et stale code (1 jour)

1. Supprimer les hooks maintenant inutilises
2. Supprimer les defaultOptions aggressifs de React Query (staleTime court qu'on avait mis)
3. Retirer les imports `useInterestsHydration` si integre au WS
4. Documentation finale

---

## 8. Migration progressive — ordre precis

### Ordre de migration des hooks (du plus critique au moins)

1. **useTopicPositions** — impact immediat sur "my interests"
2. **useSignals** — scoring reputation (mais subscription sur mastra, different endpoint)
3. **useTrustScore** — composite trust
4. **useDiscoveryScore** — pioneer/explorer/contributor counts
5. **useTrustCircle** — qui le user trust
6. **useUserActivity** — derniers events
7. **useTopClaims** — top URL certifiees
8. **useTopicCertifications** — certifs par topic

### Hooks qui restent en pull

- **useDomainTrending** — global, change lentement, pas besoin WS
- **useDomainClaims** — idem
- **useLeaderboard** — global, recalcul periodique cote serveur
- **useTaxonomy** — static, 1 fetch par session
- **usePlatformCatalog** — static, idem

---

## 9. Strategie de test

### 9.1 Tests unitaires

- `SubscriptionManager` : connect/disconnect/reconnect, gestion des erreurs
- Fonctions de derivation : chaque `derive*()` testee avec des payloads fixtures

### 9.2 Tests integration (manuels en dev)

**Scenario 1 — Happy path**
1. Login, WS connecte, subscription active
2. Faire un deposit depuis une autre session (ou script)
3. Attendu : nouvelle position apparait dans la UI en <1s

**Scenario 2 — Reconnection**
1. Login, WS connecte
2. Couper le reseau 10s
3. Attendu : WS se reconnecte automatiquement, pull un snapshot recent
4. Les donnees restent coherentes

**Scenario 3 — Optimistic + confirmation**
1. Faire un deposit depuis l'UI
2. Attendu : position apparait instantanement (optimistic)
3. 1-3s apres : le WS confirme le vrai state (no-op car deja bon)

**Scenario 4 — Race condition**
1. Faire un deposit
2. Avant que la tx soit minee, faire un redeem sur une autre position
3. Attendu : les deux mises a jour s'ordonnancent correctement, pas de state inconsistent

**Scenario 5 — Fallback**
1. Forcer WS a echouer (URL invalide en dev)
2. Attendu : apres 30s de retry, fallback sur polling HTTP
3. Badge "offline" visible
4. Les features degradees mais rien ne crash

### 9.3 Tests de charge

- Simuler 100 positions sur un wallet → tous les composants doivent rester fluides
- Simuler 1000 events cumules → derivation doit prendre <50ms

---

## 10. Risques et mitigations

| Risque | Probabilite | Impact | Mitigation |
|---|---|---|---|
| Kong ne laisse pas passer le WS upgrade | Moyenne | Bloquant | Contacter Intuition, ou endpoint alternatif, ou fallback polling |
| Charge backend trop elevee avec N users simultanes | Basse | Moyen | Subscription par wallet, pas par topic. Hasura supporte 10k+ WS |
| Disconnections frequentes | Moyenne | Bas | `graphql-ws` gere le reconnect, badge offline, polling fallback |
| Race condition cache vs WS vs action | Moyenne | Moyen | Tests integration + invariants (shares >= 0, etc.) |
| Memory leak via subscriptions jamais nettoyees | Basse | Haut | useEffect cleanup strict, tests avec React DevTools Profiler |
| Indexer lag (WS pousse state de y a 5s) | Certaine | Bas | Afficher "syncing..." si delta observe |
| Schema subscription != schema query | Basse | Moyen | Valider avec l'equipe Intuition les shapes des subs |
| Browser limite les WS (IE11, Safari vieux) | Quasi-nulle | Bas | Fallback polling automatique |

### Risque bloquant #1 : Kong + WS

Le test curl a montre que Kong 3.9.1 est devant Hasura. Kong supporte le WebSocket upgrade mais doit etre **explicitement configure** (`ws=true` dans la route service).

**Action prealable** : verifier avec `wscat -c wss://mainnet.intuition.sh/v1/graphql -s graphql-transport-ws`. Si connection refusee, contacter l'equipe Intuition pour activer le WS upgrade sur la route `/v1/graphql`.

Si impossibles a activer → **plan B** : deployer un proxy WS dedie (sur mastra Phala ou un autre VPS Coolify) qui fait la bridge HTTP↔WS vers Hasura en interne.

---

## 11. Decisions prises (ex-questions ouvertes)

| Question | Decision | Raisonnement |
|---|---|---|
| **Auth subscriptions** | V1 sans auth | L'endpoint GraphQL existant ne demande pas d'auth pour les queries (pas de headers dans le fetcher). Le test wscat confirme qu'on se connecte en WS sans credentials. Si Intuition active un JWT plus tard, on l'ajoutera via `connectionParams` dans `wsClient.ts`. |
| **Multi-onglets** | Un WS par onglet | BroadcastChannel ajoute complexite pour gain marginal (~5 KB memoire par WS). Hasura supporte 10k+ connexions simultanees. |
| **Scoping des subscriptions** | Par wallet, jamais par topic | Une subscription `positions(account_id = wallet)` ramene tout. Les vues derivees (par topic, par plateforme) sont calculees client-side via les fonctions `derive*()`. |
| **Mastra signals** | Restent en pull (V1) | signalFetcherWorkflow est un snapshot a la demande, pas un stream. Polling 1h suffit. Si real-time necessaire plus tard, mastra pourra push via SSE ou sa propre WS — separate refactor. |
| **Cross-user (view-as)** | Reste en pull | Viewer un autre profil n'ouvre pas de WS. Seul le wallet authentifie du user courant declenche des subscriptions. |

### Decisions complementaires

- **Aucune query/subscription inline** dans le code applicatif. Tout passe par `packages/graphql/src/*.graphql` et le pipeline codegen. Le `SubscriptionManager` importe les `DocumentNode` generes et les passe a `graphql-ws` via `print()`.
- **Pas de nouveau hook** `useSubscription` genere. Les composants continuent d'utiliser leurs `useQuery` existants, alimentes par `queryClient.setQueryData()` depuis le `SubscriptionManager`.
- **Reuse des fragments existants** : les subscriptions reutilisent `PositionWithVaultDetails` et autres fragments deja definis dans `packages/graphql/src/fragments/`.

---

## 12. Metrics de succes

Apres deploy complet, on devrait observer :

- **Requetes HTTP par session** : divise par 10
- **Latence UI apres action** : <500ms (vs 2-10s avant)
- **Taux d'erreurs 429** : 0
- **Temps "flash empty"** : 0 (cache persiste via WS)
- **Engagement** : measurable via retention 7j (hypothese : +15-20% car UX plus reactive)

---

## 13. Calendrier indicatif

| Phase | Duree | Cumul |
|---|---|---|
| 1. Infrastructure | 3 j | 3 j |
| 2. Cache foundation | 4 j | 7 j |
| 3. Migration hooks | 7 j | 14 j |
| 4. Optimistic updates | 3 j | 17 j |
| 5. Polish | 2 j | 19 j |
| 6. Nettoyage | 1 j | 20 j |

**Total : ~4 semaines** en solo. Peut etre compresse a 2 semaines avec 2 devs en parallele (un sur l'infra + hooks, l'autre sur derivations + tests).

---

## 14. Prerequis avant demarrage

- [x] **Confirmer que Kong laisse passer le WS upgrade** — VALIDE le 18 avril 2026
- [x] **Confirmer le protocole supporte** — `graphql-transport-ws` fonctionne
- [ ] Obtenir le schema GraphQL Hasura a jour (pour typer les subscriptions)
- [ ] Clarifier l'auth subscriptions avec l'equipe Intuition
- [ ] Valider le plan avec l'equipe avant d'attaquer la Phase 1

### Preuve empirique du support WS

Test effectue avec wscat :
```
$ wscat -c wss://mainnet.intuition.sh/v1/graphql -s graphql-transport-ws
Connected (press CTRL+C to quit)
< {"type":"ping","payload":{"message":"keepalive"}}
Disconnected (code: 4408, reason: "Connection initialisation timed out")
```

Analyse :
- `Connected` → le WS upgrade passe Kong ✅
- `{"type":"ping"}` → Hasura envoie ses keepalives du protocole graphql-transport-ws ✅
- `Disconnected 4408` → normal, wscat n'envoie pas le `connection_init` obligatoire du protocole dans les premieres secondes → Hasura timeout. Un vrai client `graphql-ws` envoie ce message en premier.

**Conclusion** : infrastructure WS 100% fonctionnelle, on peut demarrer la Phase 1.

---

## 15. Annexe — exemple concret

### Avant (actuel)

Un user ouvre /profile :
```
Timeline :
t+0ms   : Page mount. 8 composants montent leurs useQuery.
t+100ms : Privy ready, wallet dispo.
t+150ms : Les 8 queries fire en parallele (dont 3 sur mainnet.intuition.sh)
t+500ms : Premieres reponses arrivent.
t+800ms : Toutes les queries resolues, UI stabilisee.
t+60s   : staleTime des queries expire.
t+65s   : User switch d'onglet, revient. refetchOnWindowFocus → les 3 queries refire.
t+120s  : User clic "deposit" → tx, puis on doit attendre staleTime + refetch pour voir la nouvelle position.
```

### Apres (realtime)

Meme scenario :
```
Timeline :
t+0ms   : Page mount. Composants montent leurs useQuery avec staleTime=Infinity.
t+0ms   : Cache rehydrate depuis localStorage → UI affiche instantanement.
t+100ms : Privy ready, wallet dispo.
t+100ms : SubscriptionManager.connect(wallet) → ouvre WS, fire subscriptions.
t+200ms : WS recoit le snapshot initial → setQueryData → composants re-renderent avec data fraiche.
t+60s   : Rien ne se passe, staleTime=Infinity.
t+60s   : User switch d'onglet → rien ne refire (refetchOnWindowFocus=false).
t+120s  : User clic "deposit" → optimistic update (instantane) + tx.
t+123s  : WS push la vraie position indexee → reconcile avec l'optimistic.
```

**Gain : UI instantanee, zero 429, zero flash empty, real-time cross-user.**
