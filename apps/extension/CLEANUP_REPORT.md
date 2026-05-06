# Sofia Extension — Cleanup Report

**Date :** 2026-04-30
**Scope :** `apps/extension`
**Branche :** `ext/design-system`
**Commits :** `ec8390d7` → `b0cafa91` (5 commits, 11 lots de A à K)

Ce document consolide :
1. **Tous les changements** appliqués sur l'extension lors de la session de cleanup
2. **Audit dead code résiduel** post-cleanup (état au 2026-04-30)
3. **Recommandations** pour la suite

---

## Sommaire

- [Volumétrie globale](#volumétrie-globale)
- [Historique par commit](#historique-par-commit)
  - [Commit 1 — Lots A à D (UI polish + dead code)](#commit-1--lots-a-à-d-ec8390d7)
  - [Commit 2 — Lots E à G + DiscoveryScore fix](#commit-2--lots-e-à-g--discoveryscore-fix-64011ec8)
  - [Commit 3 — Lots H + I](#commit-3--lots-h--i-269ee501)
  - [Commit 4 — Lot J (deferred items)](#commit-4--lot-j-057347ba)
  - [Commit 5 — Lot K (minor findings)](#commit-5--lot-k-b0cafa91)
- [Audit résiduel post-K](#audit-résiduel-post-k)
- [Recommandations suite](#recommandations-suite)

---

## Volumétrie globale

| Commit | Lots | Fichiers | +lignes | -lignes | Net |
|---|---|---|---|---|---|
| `ec8390d7` | A–D | 73 | +2693 | −11012 | −8319 |
| `64011ec8` | E–G + fix | 42 | +73 | −1697 | −1624 |
| `269ee501` | H + I | 50 | +394 | −1982 | −1588 |
| `057347ba` | J | 8 | +4 | −208 | −204 |
| `b0cafa91` | K | 12 | +315 | −317 | −2 |
| **Total** | **11 lots** | **185** | **+3479** | **−15216** | **−11737** |

### Synthèse

- **~11 700 lignes** de code mort éliminées
- **~70 fichiers** supprimés (composants, hooks, services, types, assets)
- **~30 dépendances npm** retirées du `package.json`
- **~530 règles CSS** mortes coupées
- **IndexedDB** migré v9→v10 avec drop de **5 stores morts**
- **MessageBus** réduit de **24 à 5 méthodes**
- **~150 exports morts** purgés des barrels
- **CSS de design-system** aligné (`.url-row`, `.scope-toggle`, `.fc-verb-tag`, etc.)

---

## Historique par commit

### Commit 1 — Lots A à D (`ec8390d7`)

**Titre :** `chore(extension): UI polish + dead-code cleanup (Lots A–D)`

#### UI/UX polish (avant cleanup)

- **ProfilePage** : refactor — `<ProfileHeader>` hissé au top, nav plate à 3 onglets (`Stats | Community | Socials`), Stats sub-toggle Stats/Quests avec dot rouge claimable, header en saumon (`--ds-accent`)
- **PageBlockchainCard**
  - Toggle-deselect sur les pills intentions (re-clic retire du panier)
  - "Context" → "In context of"
  - Stats panel restructuré : drop Identity, Signals folded dans le scope toggle (`Domain | Page | Certifiers | Signals`), garde uniquement Newest sort
- **CategoryDetailView** (Bookmark detail) : aligné sur `.url-row.on-chain`, Fraunces title 28px, Mono count, ds-tokens, redeem en pill secondaire
- **Bookmark cards** : surface `--ds-card`, typo blanche, dot coloré par catégorie
- **History tab** : déplacé de Profile vers Echoes, refactoré sur `.url-row.on-chain` avec `<VerbTag>` predicate + date dans `url-meta`
- **SocialsTab** : borders pointillées sur PlatformCards non connectées
- **GroupDetailView** : border pointillée sur `filter-btn--uncertified`
- **Quest refresh button** : label "Refresh" explicite, aligné à gauche
- Toggles upgradés vers `.scope-toggle--lg` variant

#### Lot A — fichiers & deps

- **22 fichiers supprimés** :
  - `FeedTab.tsx` + `FeedTab.css`
  - Tout `components/ui/orbanimation/`
  - `PixelBlast.tsx` + `.css`
  - `TrackingStatus`, `Portal`, `SofiaNotification` + `.css`, `button.tsx`
  - 7 hooks morts : `useEchoPublishing`, `useUserSignals`, `useUserLists`, `useInterestAttention`, `useLinkedWallets`, `useCartReminder`, `usePageIntentionStats`
  - `types/bento.ts`, `lib/config/privy.ts`, `AccountTab.tsx` (refactor ProfilePage), `HistoryTab` from profile-tabs (move to core-tabs)
- **20 deps npm orphelines** retirées : `@0xintuition/{1ui,graphql,protocol}`, `@elizaos/plugin-mcp`, `@modelcontextprotocol/sdk`, `@wagmi/connectors`, `ai`, `cors`, `evt`, `express`, `node-fetch`, `postprocessing`, `three`, `umami`, `ws`, `idb`, `@types/{ws,cors,express,react-router-dom}`

#### Lot B — barrel exports

- ~41 exports morts purgés des barrels `hooks/`, `lib/services/`, `lib/utils/`, `lib/database/`, `components/ui/`
- Faux positif : `getClaimId` re-ajouté après échec build (utilisé par `useQuestSystem.ts:325`)

#### Lot C — IndexedDB + predicates

- **DB_VERSION 9 → 10** avec migration : drop de 5 stores morts (`NAVIGATION_DATA`, `USER_PROFILE`, `SEARCH_HISTORY`, `RECOMMENDATIONS`, `USER_XP`)
- 5 classes IDB services supprimées (~440 LOC) dans `indexedDB-methods.ts`
- 7 predicates morts privatisés/supprimés
- Investigation `GET_CLEAN_URL` : handler dans `contents/pageAnalyzer.ts` (pas dans background) — faux positif, gardé

#### Lot D — CSS

- **516 règles CSS mortes** retirées dans 20 fichiers via parser brace-aware
- Whitelist dynamic prefixes (`intention-pill--`, `bento-`, `avatar-`, etc.)

---

### Commit 2 — Lots E à G + DiscoveryScore fix (`64011ec8`)

**Titre :** `chore(extension): dead-code cleanup Lots E–G + DiscoveryScore fix`

#### Lot E — types orphelins

- **9 fichiers supprimés** :
  - `types/wallet.ts`, `types/viem.ts`, `types/messaging.ts`, `background/types.ts` (`PageData` extrait vers `types/page.ts`)
  - `FollowAccountCard.tsx`
  - 4 SVG morts : `components/ui/icons/social/{spotify,twitch,youtube}.svg` + `components/ui/social/twitter.svg`
- **~17 types morts** supprimés in-file : `discovery.ts`, `blockchain.ts`, `intuition.ts`, `bonding-curve.ts`, `follows.ts`, `intentionCategories.ts`, `interests.ts`, `ai/types.ts`
- **5 records morts** dans `types/database.ts` (`NavigationRecord`, `ProfileRecord`, `SearchRecord`, `RecommendationRecord`, `UserXPRecord`)
- **`tailwind`** retiré du `package.json`

#### Lot F — MessageBus + types/messages.ts

- **MessageBus** réduit de 24 à 5 méthodes (sendMessage, sendMessageWithRetry, sendMessageFireAndForget, getTabId, getCleanUrl)
- **`types/messages.ts`** : 12 message types morts retirés du union (`START_PULSE_ANALYSIS`, `AMPLIFY_GROUP`, `FORCE_FLUSH_TRACKER`, `GET_TRACKING_STATS`, `CLEAR_TRACKING_DATA`, `GET_BOOKMARKS`, `GET_HISTORY`, `STORE_BOOKMARK_TRIPLETS`, `STORE_DETECTED_TRIPLETS`, `GET_PAGE_BLOCKCHAIN_DATA`, `PAGE_ANALYSIS`, `AGENT_RESPONSE`) + 9 wrapper interfaces mortes
- **`messageHandlers.ts`** : 9 case branches morts retirés
- **`usePageBlockchainData.ts`** : listener filter pour `PAGE_ANALYSIS` retiré

#### Lot G — résidus

- **~10 barrel exports** retirés (`useTrustPage`, `PinThingFn`, `TxEventType`, `TxEvent`, `AgentIds`, `getEnsName`, `LEVEL_THRESHOLDS`, `extractHostname`, `EMPTY_INTENTIONS`, `tripletStorageService`)
- `walletProvider.ts` : `getWalletProvider`, `listWalletProviders` retirés
- `wsStatus.ts` : remplacé par 4 stubs no-op
- `GoldService.ts` : `@deprecated GOLD_PER_CERTIFICATION` + `addCertificationGold` retirés
- `predicateConstants.ts` : `OAUTH_PREDICATE_IDS` privatisé
- `TripletStorageService.ts` supprimé (orphelin post-Lot F)
- `agentRouter.ts` : `sendThemeExtractionRequest` retiré
- Doublon `formatTrust` dans `ExtendedMetricsPanel.tsx` remplacé par import `~/lib/utils`

#### DiscoveryScore fix (bug pre-existant)

- **Bug** : `DiscoveryScoreService.ts:95` passait `userAddress = walletAddress.toLowerCase()` à la query `UserIntentionTriples` (filter `_in: account_id`). L'indexer Intuition stocke en EIP-55 checksum mixed-case → 0 triples retournés → Pioneer/Explorer/Contributor stuck à 0
- **Fix** : passe maintenant `[checksumAddr, lowercase]` array (même pattern que `useOnChainIntentionGroups`, `useDailyStreakProfit`)
- **Vérifié live par user** sur la page Profile

---

### Commit 3 — Lots H + I (`269ee501`)

**Titre :** `chore(extension): dead-code cleanup Lots H + I (post-audit)`

#### Lot H — fichiers entiers morts (post-audit)

- **25 fichiers supprimés** :
  - `lib/services/UserSessionManager.ts` (8 fonctions exportées, 0 caller — chaque consommateur a sa propre version locale)
  - `background/tripletProcessor.ts`
  - `components/ui/AccountStats.tsx` (composant — hook `useAccountStats` séparé, vivant)
  - `components/ui/blockchain/CommunityTrustBar.tsx` + `.css`
  - `hooks/useRecommendations.ts` + cascade
  - 3 barrels morts (`components/ui/index.ts`, `types/index.ts`, `follow/index.ts`)
  - 14 SVG/PNG morts dans `components/ui/icons/`
  - `components/layout/background/fond.png`
- **Cascade `useRecommendations`** :
  - `RecommendationService` réduit à `clearCache` (245 → 13 lignes)
  - `agentRouter.ts` réduit à un seul `sendMessage('CHATBOT', ...)` (118 → 38 lignes)
  - `messageHandlers.ts` : `handleRecommendationGeneration` + `case "GENERATE_RECOMMENDATIONS"` + import `sendRecommendationRequest` retirés
  - `types/messages.ts` : `GENERATE_RECOMMENDATIONS` retiré du union
- **Faux positifs détectés et corrigés** :
  - `onchainbadge.png` flagué dead mais en réalité importé par `GroupDetailView.tsx:29`. Le fichier n'existait déjà plus dans git → import + `<img>` retirés (le `.cert-badge` à côté affiche déjà la même info)
  - 2 imports cassés post-suppression du barrel `ui` : `DebateTab.tsx`, `ListModal.tsx` réparés en imports directs

#### Lot I — symboles morts

- **5 message types morts** + handlers retirés (`SCROLL_DATA`, `TRIPLETS_DELETED`, `UPDATE_ECHO_BADGE`, `GET_USER_XP`, `GET_LEVEL_UP_COST`)
- **~14 types morts in-file** : `storage.ts`, `history.ts`, `follows.ts`, `interests.ts`, `ipfsCache.ts` (3 fns), `graphql-client.ts` (`INTUITION_GRAPHQL_ENDPOINT`), `config.ts` (`SOFIA_SERVER_URL`)
- **3 imports inutilisés** : `AtomDataResponse` retiré de `useTrustCircle/useFollowing/useFollowers`
- **Realtime legacy** : 4 keys + 4 derive fns retirés (`topicPositionsMap`, `categoryPositionsMap`, `platformPositionsMap`, `verifiedPlatforms`), `SubscriptionManager.onTrackedPositionsUpdate` no-op
- **`TWITTER_FETCH_PROFILE_ENABLED`** dead flag retiré (toujours false → branche skip Twitter inlinée)
- **Barrel re-exports types morts** purgés dans `lib/services/index.ts` (8 types) et `lib/database/index.ts` (4 types)

---

### Commit 4 — Lot J (`057347ba`)

**Titre :** `chore(extension): dead-code cleanup Lot J (deferred items)`

#### OAuth dead messages

- 3 entrées retirées de l'enum `MessageType` : `OAUTH_SYNC`, `OAUTH_GET_SYNC_INFO`, `OAUTH_RESET_SYNC` (0 sender dans tout le monorepo, vérifié)
- `MessageHandler` interface réduite à 3 méthodes (`initiateOAuth`, `handleCallback`, `handleImplicitCallback`)
- 2 méthodes mortes retirées de `OAuthService` (`getSyncStatus`, `resetSyncInfo`)
- 2 méthodes mortes retirées de `SyncManager` (`getSyncStatus`, `resetSyncInfo`)
- Import `TokenManager` retiré de `SyncManager`

#### CurrencyMigrationService

- **Déployé 2026-02-10**, ~12 semaines de migration en cours (TTL initial : 4 semaines)
- Migration idempotente, tournait sur chaque `WALLET_CONNECTED`
- Toute migration restante : `DiscoveryScoreService` recompute le Gold from on-chain (cf. fix précédent), donc les long-tail users récupèrent quand même un Gold correct
- Suppression :
  - `lib/services/CurrencyMigrationService.ts` (133 lignes)
  - Re-export retiré de `lib/services/index.ts`
  - Caller dans `messageHandlers.ts` retiré
  - Type `MigrationStatus` retiré

---

### Commit 5 — Lot K (`b0cafa91`)

**Titre :** `chore(extension): minor findings cleanup (Lot K)`

#### Bug latent corrigé

- `useBookmarks.ts:6` : import path cassé `'../../extension/types/messages'` → `'../types/messages'` (résolvait à un chemin inexistant)

#### Stubs morts retirés

- `derivations.ts` : `applyOptimisticPosition`, `clearOptimisticPosition`, `clearOptimisticDailyStreak` (commentaire « Phase 3.B v2 should implement »)
- `realtime.ts` : `shutdownRealtime` (jamais appelé)
- `lib/utils/avatar.ts` : `escapeSvgForCss` (0 callers)

#### Privatisations (retrait du `export`, usage interne uniquement)

- `derivations.ts` : `sharesToBigInt`
- `lib/utils/avatar.ts` : `isEthereumAddress`
- `lib/config/externalAuth.ts` : `AUTH_PAGE_URL`
- `Skeleton.tsx` : `SkeletonLine`, `SkeletonCircle`

#### Barrel re-exports morts

- `lib/services/index.ts` : `ResolvedTriple`, `LocalProgressData`, 5 types globalStake, `RecommendationService`
- `lib/database/index.ts` : classes statiques `TripletsDataService`, `UserSettingsService` (lowercase singletons consommés)
- `components/charts/index.ts` : barrel mort supprimé entièrement

#### Imports inutilisés

- `indexedDB-methods.ts:10` : `VisitData`
- `QuickActionButton.tsx` : `SelectedHoverIcon`, `RemoveHoverIcon2`, `RemoveIcon2` (doublon strict de `RemoveIcon`)

---

## Audit résiduel post-K

État au 2026-04-30, après les 5 commits ci-dessus.

### Findings majeurs (HIGH)

#### A.1 — Pipeline Mastra/chatbot mort

Toute la chaîne chatbot/Mastra est cassée — le ChatPage component n'existe plus mais les 4 senders Mastra et le routeur sont préservés :

```
[ChatPage component]   ← N'EXISTE PAS
     ↓ (devrait envoyer SEND_CHATBOT_MESSAGE)
SEND_CHATBOT_MESSAGE handler   ← orphelin (messageHandlers.ts:175)
     ↓ agentRouter.sendMessage('CHATBOT', text)
mastraClient.sendChatbotToMastra   ← appelé seulement par l'orphelin
     ↓
chrome.runtime.sendMessage(CHATBOT_RESPONSE)   ← aucun listener
```

| Symbole | Confiance |
|---|---|
| `agentRouter.sendMessage` | HIGH |
| `mastraClient.sendChatbotToMastra` | HIGH |
| `mastraClient.callMastraAgent` (helper interne) | HIGH |
| `mastraClient.sendThemeExtractionToMastra` | HIGH |
| `mastraClient.sendRecommendationToMastra` | HIGH |
| `mastraClient.generatePredicate` + types `PredicateInput`/`PredicateOutput` | HIGH |
| Message `CHATBOT_RESPONSE` (sender) | HIGH |
| `MASTRA_API_URL` const dans `config.ts` | HIGH (cascade) |

**Action recommandée** : supprimer `background/mastraClient.ts` + `background/agentRouter.ts` + le case `SEND_CHATBOT_MESSAGE` + le type du union. Cascade : `config.ts` devient supprimable entièrement.

#### A.2 — Realtime cache writes orphelins

`SubscriptionManager.onPositionsUpdate` calcule et écrit 8 dérivations dans le cache React Query. **Seule `realtimeKeys.dailyStreak` est lue.**

Les 7 autres clés sont write-only :

| Clé | Site d'écriture | Consommateur |
|---|---|---|
| `realtimeKeys.positions(wallet)` | `SubscriptionManager.ts:242` | aucun |
| `realtimeKeys.trustCircle(wallet)` | `SubscriptionManager.ts:248` | aucun (`useTrustCircle` fait du HTTP) |
| `realtimeKeys.following(wallet)` | `SubscriptionManager.ts:252` | aucun |
| `realtimeKeys.verifiedOAuthPlatforms(wallet)` | `SubscriptionManager.ts:260` | aucun |
| `realtimeKeys.intentionGroups(wallet)` | `SubscriptionManager.ts:264` | aucun |
| `realtimeKeys.globalStakePosition(wallet)` | `SubscriptionManager.ts:268` | aucun (`useGlobalStake` fait du HTTP) |
| `realtimeKeys.userProfileDerived(wallet)` | `SubscriptionManager.ts:274` | aucun |
| `realtimeKeys.userStats(wallet)` | `SubscriptionManager.ts:278` | aucun |

Cascade morte si Phase 3.B n'est pas câblée :
- 6 fonctions `derive*` calculent dans le vide
- 6 interfaces (`TrustCircleEntry`, `FollowingEntry`, etc.) ne servent qu'à typer ces dérivations mortes

**Action recommandée** : décider — soit câbler Phase 3.B (`useQuery({ queryKey: realtimeKeys.X(wallet) })` dans les hooks), soit supprimer les `derive*` non câblées et garder uniquement la branche `dailyStreak`.

### Findings mineurs

| Catégorie | Items | Confiance |
|---|---|---|
| Fichiers entiers morts | 0 (3 borderline post-cleanup) | — |
| Exports morts dans barrels | 8 résiduels | HIGH |
| Imports inutilisés | 4 manuels (`tsc --noEmit` bloqué par sandbox) | HIGH |
| Deps npm orphelines | 0 | — |
| CSS mort | 0 fichier entier | — |
| IndexedDB stores morts | 0 | — |
| Chrome message types morts | 2 + cascade `CHATBOT_RESPONSE` | HIGH |
| Predicates morts | 0 | — |
| Hooks/services dupliqués | 2 (mineurs) | MEDIUM |
| OAuth mort | 0 (Lot J propre) | — |
| Composants React morts | 0 (1 borderline `Skeleton.tsx`) | — |
| Code legacy / @deprecated | 5 dont stubs no-op | MIXED |
| GraphQL ops orphelines | 0 | — |
| Doublons hook ↔ service | 0 | — |

### Cas borderline

- `lib/services/ai/RecommendationService.ts` : ne contient plus que `clearCache()`. Pourrait être remplacé par une fonction libre `clearRecommendationCache(walletAddress)` — supprimerait la classe + `lib/services/ai/types.ts` + 2 méthodes mortes de `StorageRecommendation` (`save`, `load`).
- `lib/services/ai/types.ts` : `Recommendation`, `RecommendationCache`, `WalletData` — consommés seulement par méthodes mortes de `StorageRecommendation`.
- `lib/realtime/wsStatus.ts` : 4 fonctions stubs no-op, documenté « phase 5 offline-badge pas tranchée ».

### Assets morts non touchés

7 assets dans `assets/` flagués mais NON supprimés (manifest expose `assets/*` comme `web_accessible_resources` — risque casse externe) :

- `Logo.png`, `iconwhite.png`, `icon.png`, `banner.png`, `chat.png`, `trustpage.png`, `youtubeDetail.png`

Validation manuelle requise avant suppression.

---

## Recommandations suite

### Priorité 1 — Lot L : Mastra cleanup (~250 lignes en cascade)

Si la décision est de **ne pas réintroduire un ChatPage**, supprimer toute la chaîne :

```
background/mastraClient.ts            (entier)
background/agentRouter.ts              (entier)
messageHandlers.ts                     (case "SEND_CHATBOT_MESSAGE" + import)
types/messages.ts                      (SEND_CHATBOT_MESSAGE du union)
config.ts                              (MASTRA_API_URL → fichier entier mort)
```

### Priorité 2 — Lot M : Realtime cleanup (decision required)

Choix architectural à trancher avec le team :

- **Option A — Câbler Phase 3.B** : ajouter `useQuery({ queryKey: realtimeKeys.X(wallet), enabled: false })` dans les hooks `useTrustCircle`, `useFollowing`, etc. pour que les WS pushes mettent à jour la UI sans HTTP refetch.
- **Option B — Supprimer Phase 3.B** : retirer les 6 `derive*`, les 6 interfaces, les 7 query keys morts, garder uniquement `dailyStreak` (qui marche déjà).

### Priorité 3 — Lot N : centraliser `getWalletAddress`

4 redéfinitions locales identiques :
- `background/index.ts:11`
- `background/oauth/core/SyncManager.ts:14`
- `background/oauth/core/TokenManager.ts:18`
- `lib/services/QuestTrackingService.ts:25`

Toutes font `chrome.storage.session.get('walletAddress')` puis `getAddress(...)` (checksum). Centraliser dans `lib/utils/walletStorage.ts`.

### Priorité 4 — Audit assets/ manuel

Vérifier références indirectes (manifest, CSS via runtime template literals, dynamic imports) avant suppression des 7 assets borderline.

### Priorité 5 — TS6133 exhaustif

`bun tsc --noEmit` était bloqué par le sandbox du sous-agent — le user devrait le lancer localement pour récupérer la liste exhaustive des imports inutilisés non détectés par grep.

---

*Rapport généré le 2026-04-30 après les commits `ec8390d7` → `b0cafa91`. Build green à chaque lot. Cleanup vérifié runtime sur Profile (DiscoveryScore stats, Beta Season Pool) après le fix de chaîne.*
