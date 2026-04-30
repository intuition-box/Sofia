# Sofia Extension — Audit Dead Code (post Lots A–J)

**Date :** 2026-04-29
**Scope :** `/home/chauche/Sofia/apps/extension`
**Hors scope (Plasmo entry points) :** `sidepanel.tsx`, `background/index.ts`, `background/realtime.ts`, `background/messageHandlers.ts`, `background/messageSenders.ts`, `background/agentRouter.ts`, `background/mastraClient.ts`, `background/themeIconManager.ts`, `background/oauth/**`, `contents/*.ts`, `contents/*.tsx`
**Cleanup history :** Lots A à J appliqués (10 lots). Dernières actions : Lot J = OAuth dead messages + `CurrencyMigrationService` supprimés. Lots H+I = `UserSessionManager`, `tripletProcessor`, `useRecommendations`, `AccountStats`, `CommunityTrustBar`, 5 dead messages, 14 dead types, 14 dead icônes, 3 dead barrels, legacy realtime keys retirés.

## Sommaire

1. [Fichiers entiers morts](#1-fichiers-entiers-morts)
2. [Exports morts dans les barrels](#2-exports-morts-dans-les-barrels)
3. [Imports inutilisés (TS6133)](#3-imports-inutilises-ts6133)
4. [Dépendances npm orphelines](#4-dependances-npm-orphelines)
5. [CSS mort](#5-css-mort)
6. [IndexedDB stores morts](#6-indexeddb-stores-morts)
7. [Chrome message types morts](#7-chrome-message-types-morts)
8. [Predicates morts](#8-predicates-morts)
9. [Hooks/services dupliqués](#9-hooksservices-dupliques)
10. [Code OAuth/Privy mort](#10-code-oauthprivy-mort)
11. [Composants React morts](#11-composants-react-morts)
12. [Code legacy / @deprecated / TODO-remove](#12-code-legacy--deprecated--todo-remove)
13. [GraphQL ops importées non câblées](#13-graphql-ops-importees-non-cablees)
14. [Doublons hook ↔ service](#14-doublons-hook--service)

Annexes : [Realtime cache writes orphelins](#a1-realtime-cache-writes-orphelins) · [Mastra pipeline mort](#a2-mastra-pipeline-mort) · [Types in-file morts](#a3-types-in-file-morts) · [Assets morts](#a4-assets-morts)

---

## 1. Fichiers entiers morts

| Fichier | Confiance | Justification |
|---|---|---|
| (aucun fichier source mort détecté post Lots H–J) | — | Tous les fichiers TS/TSX `lib/`, `hooks/`, `components/` ont au moins un consommateur après cleanup. |

**Cas borderline** :

| Fichier | Confiance | Justification |
|---|---|---|
| `/home/chauche/Sofia/apps/extension/lib/services/ai/RecommendationService.ts` | **MEDIUM** | Le fichier ne contient plus qu'une méthode (`clearCache`). La classe `RecommendationService` ne fait que déléguer à `StorageRecommendation.clear`. Une fonction libre `clearRecommendationCache(walletAddress)` éliminerait la classe entière + `lib/services/ai/types.ts` + plusieurs méthodes mortes de `StorageRecommendation` (cf. §A3). |
| `/home/chauche/Sofia/apps/extension/lib/services/ai/types.ts` | **HIGH** | `Recommendation`, `RecommendationCache` ne sont consommés que par `StorageRecommendation.save` / `.load` (eux-mêmes morts, cf. §A3). `WalletData` jamais consommé. Si on supprime save/load, le fichier types entier devient mort. |
| `/home/chauche/Sofia/apps/extension/lib/realtime/wsStatus.ts` | **MEDIUM** | Documenté comme « write-only sinks. No reader is currently wired ». Les 4 fonctions sont stubs. Conserver tant que la phase 5 du plan offline-badge n'est pas tranchée. |

---

## 2. Exports morts dans les barrels

### 2.1 `~/lib/services/index.ts`

| Symbole | Confiance | Justification |
|---|---|---|
| `RecommendationService` (re-export) | **HIGH** | Le seul consommateur (`SettingsPage.tsx:11`) importe directement depuis `'../../lib/services/ai/RecommendationService'`. Re-export barrel jamais consommé. |
| `type ResolvedTriple` | **HIGH** | Consommateur unique (`useCreateTripleOnChain.ts:7`) importe directement depuis `../lib/services/TripleService`. Re-export barrel inutile. |
| `type LocalProgressData` | **HIGH** | Aucun consommateur externe. Type utilisé seulement à l'intérieur de `QuestProgressService.ts`. |
| `type GlobalStakeState`, `type GlobalStakePosition`, `type GlobalStakeConfig`, `type GlobalVaultStats`, `type SeasonPosition` | **HIGH** | Les 5 types sont re-exportés depuis `~/types/globalStake` mais aucun consommateur n'utilise le barrel `~/lib/services` pour y accéder. Tous les consommateurs internes utilisent directement le fichier `types/globalStake.ts` ou le service. |

### 2.2 `~/lib/database/index.ts`

| Symbole | Confiance | Justification |
|---|---|---|
| `TripletsDataService` (la classe statique, majuscule) | **HIGH** | Aucun consommateur n'importe `TripletsDataService` (la classe). Tous les consommateurs externes utilisent `tripletsDataService` (la const lowercase, ligne 21). La classe peut rester interne au fichier `indexedDB-methods.ts`. |
| `UserSettingsService` (la classe statique) | **HIGH** | Idem. Seul `userSettingsService` (lowercase) est consommé. La classe peut rester interne. |

Note : `BookmarkService` et `IntentionGroupsService` sont eux consommés en classe statique (`BookmarkService.getAllLists(...)` via `useBookmarks.ts`, `IntentionGroupsService.clearAll()` via `messageHandlers.ts`) — **vivants**.

### 2.3 `~/lib/utils/index.ts`

| Symbole | Confiance | Justification |
|---|---|---|
| (aucun mort détecté) | — | Tous les exports du barrel `~/lib/utils` ont au moins un consommateur après Lots A–J. |

### 2.4 `~/components/charts/index.ts`

| Symbole | Confiance | Justification |
|---|---|---|
| `BondingCurveChart` (re-export) | **HIGH** | Consommateur unique (`HistoryTab.tsx:6`) importe directement `import { BondingCurveChart } from '../../charts/BondingCurveChart'`. Le barrel n'est jamais utilisé — peut être supprimé entièrement. |

### 2.5 `~/components/layout/background/index.ts`

| Symbole | Confiance | Justification |
|---|---|---|
| `default` (Background) | LOW alive | `AppLayout.tsx:2` fait `import Background from './background'` — résolu via le barrel. ✓ vivant. |

---

## 3. Imports inutilisés (TS6133)

`bun tsc --noEmit` est bloqué par le sandbox (permission denied). Détection manuelle :

| Fichier | Symbole | Confiance | Justification |
|---|---|---|---|
| `/home/chauche/Sofia/apps/extension/lib/database/indexedDB-methods.ts:10` | `import type { VisitData }` | **HIGH** | Importé mais aucune référence dans le fichier. |
| `/home/chauche/Sofia/apps/extension/components/ui/QuickActionButton.tsx:19` | `SelectedHoverIcon` | **HIGH** | Importé mais jamais référencé dans le composant (seul `SelectedIcon` est utilisé pour l'état sélectionné). |
| `/home/chauche/Sofia/apps/extension/components/ui/QuickActionButton.tsx:21` | `RemoveHoverIcon2` | **HIGH** | Importé mais jamais référencé (le code utilise déjà `RemoveHoverIcon` ligne 5). |
| `/home/chauche/Sofia/apps/extension/components/ui/QuickActionButton.tsx:20` | `RemoveIcon2` | **MEDIUM** | Référencé une fois ligne 52 mais doublon strict de `RemoveIcon` (ligne 4) — même fichier source `Selected=Remove.svg`. À fusionner. |

Cas particulier : **`hooks/useBookmarks.ts:6` import path cassé**

```ts
import type { Triplet } from '../../extension/types/messages'
```

Ce chemin résout à `/home/chauche/Sofia/apps/extension/extension/types/messages.ts` qui n'existe pas. Devrait être `'../types/messages'`. Avec `strict: false` et `import type`, TypeScript peut tolérer (élidé à la compilation), mais c'est un bug latent (HIGH).

Limitation : impossible d'exécuter `tsc --noEmit` dans le sandbox actuel — l'énumération exhaustive de TS6133 n'a pas pu être effectuée.

---

## 4. Dépendances npm orphelines

`package.json` : 16 deps + 11 devDeps. Audit :

| Dep | Statut | Notes |
|---|---|---|
| `@0xsofia/design-system` | ✓ vivant | DS partagé |
| `@0xsofia/graphql` | ✓ vivant | Hooks codegen, 30 imports répartis |
| `@dicebear/collection` | ✓ vivant | `lib/utils/avatar.ts` |
| `@dicebear/core` | ✓ vivant | `lib/utils/avatar.ts` |
| `@plasmohq/storage` | ✓ vivant | `useTracking`, `tracking.ts`, `SettingsPage.tsx` |
| `@tanstack/query-async-storage-persister` | ✓ vivant | `lib/providers/queryClient.ts` |
| `@tanstack/react-query` | ✓ vivant | omniprésent |
| `@tanstack/react-query-persist-client` | ✓ vivant | `background/realtime.ts`, `lib/providers/queryProvider.tsx` |
| `graphql` | ✓ vivant | Pair de `@0xsofia/graphql` (utilisé par `print()` dans SubscriptionManager) |
| `lucide-react` | ✓ vivant | `BottomNavigation.tsx`, `CartDrawer.tsx` |
| `mipd` | ✓ vivant | `contents/walletBridge.ts` |
| `plasmo` | ✓ vivant | bundler |
| `react`, `react-dom` | ✓ vivant | base |
| `viem` | ✓ vivant | omniprésent |
| `wagmi` | ✓ vivant | `lib/config/wagmi.ts`, providers |

**Aucune dépendance npm orpheline.** ✓

---

## 5. CSS mort

Sur les 42 fichiers `components/styles/*.css` restants après Lot D, tous ont au moins un import `.tsx/.ts`. Aucun fichier CSS dead.

**Whitelists dynamiques préservées** : `intention-pill--`, `bento-`, `avatar-`, `badge-`, `podium-`, `position-board--`, `item-pill--`, `item-tier--`, `cart-drawer__item-pill--`, `batch-reward__item-tier--`.

**DS classes** (`fc-verb-tag`, `pf-platform-card`, etc.) consommées via `@0xsofia/design-system` package — toujours vivantes.

Lot D a coupé 516 règles CSS en avril 2026 ; le résiduel par règle est probablement <5 % et hors scope d'un audit fichier-par-fichier post Lots H–J. Cf. `AUDIT_CSS_DEAD.md` pour le détail si besoin.

---

## 6. IndexedDB stores morts

`STORES` constants in `lib/database/indexedDB.ts` — vérification post-J :

| Store | Status |
|---|---|
| `TRIPLETS_DATA` | ✓ vivant (`tripletsDataService`, `BadgeService`, `oauth/TripletExtractor`) |
| `USER_SETTINGS` | ✓ vivant (`userSettingsService`, `SettingsPage`, `EchoesTab`) |
| `BOOKMARK_LISTS` | ✓ vivant (`BookmarkService`) |
| `BOOKMARKED_TRIPLETS` | ✓ vivant (`BookmarkService`) |
| `INTENTION_GROUPS` | ✓ vivant (`IntentionGroupsService`, `groupManager`) |
| `CART_ITEMS` | ✓ vivant (`CartDataService`, `CartService`) |

Note : la base secondaire `sofia-recommendations` (DB séparée, gérée par `StorageRecommendation`) ne contient **plus que de l'écriture morte** : `save` et `load` jamais appelés ; seul `clear` est invoqué par `RecommendationService.clearCache` depuis `SettingsPage`. Le store `recommendations` sert uniquement à effacer un cache vide. Cf. §A3.

**Aucun store de la DB principale mort.** ✓

---

## 7. Chrome message types morts

`types/messages.ts` `MessageType` union (28 types). Vérification : (a) handler dans `background/messageHandlers.ts` OU `contents/*.ts` ET (b) sender.

### 7.1 Messages avec handler MAIS sans sender (handler orphelin)

| MessageType | Handler | Sender | Confiance | Justification |
|---|---|---|---|---|
| `SEND_CHATBOT_MESSAGE` | `messageHandlers.ts:175` | aucun | **HIGH** | `ChatPage` n'existe plus dans le code. Aucun fichier n'envoie `SEND_CHATBOT_MESSAGE`. Le handler appelle `agentRouter.sendMessage('CHATBOT', text)` qui appelle `sendChatbotToMastra`. Toute la pipeline chatbot est orphan ; voir §A2. |
| `GET_PAGE_DATA` | `contents/pageAnalyzer.ts:45` | aucun | **HIGH** | Aucun caller envoie `GET_PAGE_DATA` au content script. (Note : `messageBus.getCleanUrl()` envoie `GET_CLEAN_URL`, qui a un sender — vivant.) |

### 7.2 Messages avec sender MAIS sans handler

Aucun détecté.

### 7.3 Messages internes envoyés sans handler dédié (broadcast)

| MessageType | Sender | Listener | Confiance |
|---|---|---|---|
| `CHATBOT_RESPONSE` | `agentRouter.ts:22, 32` | aucun | **HIGH** | Envoyé via `chrome.runtime.sendMessage` mais aucun listener. Cascade morte (cf. §A2). |
| `THEME_DETECTED`, `THEME_CHANGED` | aucun | `themeIconManager.ts:94` | LOW alive | Émis par offscreen document (`public/offscreen.html` non versionné en TS) — comportement Chrome légitime. |

### 7.4 Messages externes (LOW alive — externally_connectable)

| MessageType | Confiance | Notes |
|---|---|---|
| `WALLET_CONNECTED` | LOW alive | Manifest `externally_connectable.matches: doc.sofia.intuition.box, localhost:3000`. Handler `messageHandlers.ts:57`. |
| `WALLET_DISCONNECTED` | LOW alive | Idem (`messageHandlers.ts:88`). |
| `FIRST_CLAIM` | LOW alive | Externe, handler `messageHandlers.ts:130`. |
| `DEEP_LINK_PROFILE` | LOW alive | Envoyé par `contents/shareRedirect.ts`, traité dans `messageHandlers.ts:458`. |
| `OAUTH_TOKEN_SUCCESS` / `TWITTER_OAUTH_SUCCESS` | LOW alive | Envoyés par landing page Privy (externe). Handler `messageHandlers.ts:100`. |

### 7.5 Messages OAuth (`background/oauth/core/MessageHandler.ts`)

| Enum value | Sender interne | Confiance |
|---|---|---|
| `OAUTH_CONNECT` | `SocialsTab.tsx` | ✓ vivant |
| `OAUTH_CALLBACK` | aucun (chrome.runtime callback / landing page) | LOW alive |
| `OAUTH_IMPLICIT_CALLBACK` | aucun | LOW alive |

`OAUTH_SYNC`, `OAUTH_GET_SYNC_INFO`, `OAUTH_RESET_SYNC` ont été retirés en Lot J. ✓

### 7.6 Messages utilisés (vivants)

`GET_TAB_ID`, `PAGE_DATA`, `PAGE_DURATION`, `FETCH_BOOKMARKS`, `IMPORT_SELECTED_BOOKMARKS`, `INITIALIZE_BADGE`, `TRIPLET_PUBLISHED`, `GET_CLEAN_URL`, `URL_CHANGED`, `WALLET_CONNECTED`, `WALLET_DISCONNECTED`, `GET_INTENTION_GROUPS`, `GET_GROUP_DETAILS`, `CERTIFY_URL`, `REMOVE_URL_FROM_GROUP`, `DELETE_GROUP`, `UPDATE_GROUP_LEVEL`, `LEVEL_UP_GROUP`, `PREVIEW_LEVEL_UP`, `TRACK_URL`, `WALLET_REQUEST`, `WALLET_EVENT`, `BROWSING_NUDGE`, `NUDGE_DISMISSED`, `DEEP_LINK_PROFILE`, `FIRST_CLAIM`.

**Bilan post-J : 2 message types restent orphelins** (`SEND_CHATBOT_MESSAGE`, `GET_PAGE_DATA`).

---

## 8. Predicates morts

`lib/config/predicateConstants.ts` — exports vérifiés un par un :

| Export | Status |
|---|---|
| `INTENTION_PREDICATE_IDS` | ✓ vivant (`usePageBlockchainData.ts:30`) |
| `TRUST_PREDICATE_IDS` | ✓ vivant (`usePageBlockchainData.ts:31`) |
| `ALL_PREDICATE_IDS` | ✓ vivant (`useOnChainIntentionGroups.ts`, `UserCertificationsService.ts`) |
| `OAUTH_PREDICATE_LABELS` | ✓ vivant (`UserCertificationsService.ts:16`) |
| `ALL_PREDICATE_LABELS` | ✓ vivant (`UserCertificationsService.ts:15`) |
| `CERTIFICATION_PREDICATE_LABELS` | ✓ vivant (`useUserDiscoveryScore.ts`, `DiscoveryScoreService.ts`) |
| `PREDICATE_LABEL_TO_INTENTION` | ✓ vivant (`discoveryUtils.ts`, `UserCertificationsService.ts`) |
| `PREDICATE_LABEL_TO_TRUST` | ✓ vivant (`discoveryUtils.ts`, `pageCertificationCompute.ts`) |
| `TRUST_LABEL_TO_TYPE` | ✓ vivant (`UserCertificationsService.ts:18`) |
| `PREDICATE_ID_TO_CERTIFICATION` | ✓ vivant (`useOnChainIntentionGroups.ts:13`) |
| `PREDICATE_ID_TO_INTENTION` | ✓ vivant (`pageCertificationCompute.ts:12`) |

**Aucun export mort.** ✓ (`OAUTH_PREDICATE_IDS` privatisé en Lot G, toujours interne — ✓.)

---

## 9. Hooks/services dupliqués

| Doublon | Confiance | Action |
|---|---|---|
| `INTENTION_PREDICATE_IDS` re-défini dans `lib/realtime/derivations.ts:103` (Set local) — doublon de l'array exporté par `predicateConstants.ts` | **HIGH** | Importer le tableau du config et faire `new Set(...)` localement. |
| `OAUTH_PREDICATE_IDS` re-défini dans `derivations.ts:95` (Set local) — privatisé dans `predicateConstants.ts` (const local), donc 2 sources | **MEDIUM** | Soit ré-exporter depuis `predicateConstants` et consommer un `Set` dérivé en deux endroits. Soit accepter le doublon (deux shapes différentes : array vs Set, donc justifiable). |

Note : `getWalletAddress` re-définition multiple a été nettoyé en Lot H/I (suppression de `UserSessionManager.ts`).

---

## 10. Code OAuth/Privy mort

| Méthode/symbole | Status |
|---|---|
| `OAuthService.initiateOAuth` | ✓ vivant (sender `OAUTH_CONNECT`) |
| `OAuthService.handleCallback` | LOW alive (sender externe / landing page) |
| `OAuthService.handleImplicitCallback` | LOW alive (sender externe) |
| `OAuthService.handleExternalOAuthToken` | ✓ vivant (`messageHandlers.ts:112`) |
| `OAuthService.syncPlatformData` | ✓ vivant (callback post-auth) |
| `OAuthFlow` enum | ✓ vivant |
| `MessageType` enum (interne OAuth) | ✓ vivant pour `OAUTH_CONNECT` ; LOW alive pour les 2 callbacks |
| `PlatformConfig`, `UserToken`, `SyncInfo`, `TripletRule`, `UserData` | ✓ vivants en interne |

`TWITTER_FETCH_PROFILE_ENABLED` flag a été retiré en Lot J. ✓
`getSyncStatus`, `resetSyncInfo` retirés en Lot J. ✓

Hooks OAuth-side :

| Hook | Status |
|---|---|
| `useSocialVerifier` | ✓ vivant (`SocialsTab.tsx`) |
| `useDiscordProfile` | ✓ vivant (`ProfilePage.tsx`) |

Le bloc OAuth est **propre post-J**. Les seules zones LOW alive sont les callbacks externes (Privy landing page) — non scopable depuis ce repo.

---

## 11. Composants React morts

| Composant | Confiance | Justification |
|---|---|---|
| (aucun composant entièrement mort détecté) | — | Tous les `.tsx` de `components/ui/`, `components/modals/`, `components/pages/`, `components/charts/`, `components/layout/` ont au moins un site de rendu. |

**Cas borderline** :

| Composant | Confiance | Justification |
|---|---|---|
| `Skeleton.tsx` `SkeletonLine`, `SkeletonCircle` exports | **LOW** | Exportés mais consommés uniquement à l'intérieur de `Skeleton.tsx` (par `PageBlockchainSkeleton`). Le `export` peut être retiré (rendre privé) sans casser le seul consommateur externe (`PageBlockchainSkeleton`). |

---

## 12. Code legacy / @deprecated / TODO-remove

| Localisation | Confiance | Justification |
|---|---|---|
| `lib/services/walletProvider.ts:208` `selectProviderByAddress` `@deprecated` | LOW alive | Toujours utilisé en fallback dans `useWalletFromStorage.ts:67` lorsque `walletType` n'est pas connu. À conserver tant que la migration walletType n'est pas garantie 100 %. |
| `contents/walletBridge.ts:142` `wallet_selectProviderByAddress` handler `@deprecated` | LOW alive | Symétrique du précédent. Vivant tant que le hook l'appelle. |
| `lib/realtime/derivations.ts:475-491` `applyOptimisticPosition`/`clearOptimisticPosition` (stubs no-op + commentaire « Phase 3.B v2 should implement ») | **HIGH** | Stubs jamais exportés vers un consommateur ni câblés. À supprimer (les retirer des exports + retirer les fonctions). |
| `lib/realtime/derivations.ts:465-471` `clearOptimisticDailyStreak` | **HIGH** | Aucun consommateur (la fonction `applyOptimisticDailyStreak` retourne sa propre rollback closure, qui est utilisée à la place). |
| `lib/realtime/SubscriptionManager.ts:201-230` `subscribeTrackedPositions()` + `onTrackedPositionsUpdate()` | **MEDIUM** | `onTrackedPositionsUpdate` est explicitement no-op (commentaire « used to feed legacy Explorer keys… No-op for now »). La subscription WS est ouverte côté serveur pour rien (consomme bande passante + slot Hasura) tant qu'aucun consommateur ne lit `realtimeKeys.positions` filtrées. À évaluer : retirer `subscribeTrackedPositions` ou attendre le câblage Phase 3.B v2. |
| `background/realtime.ts:98` `shutdownRealtime` | **HIGH** | Exporté mais jamais appelé. Documenté « manual cleanup — typically on full logout » mais `disconnectWallet` ne l'appelle pas. À retirer ou câbler dans `disconnectWallet`. |

---

## 13. GraphQL ops importées non câblées

Toutes les ops `@0xsofia/graphql` importées (30 sites) sont câblées :

| Op / Document | Consumer |
|---|---|
| `useGetMyTrustCircleQuery.fetcher` | `useTrustCircle` |
| `useGetAtomDataByLabelsQuery.fetcher` | `useTrustCircle`, `useFollowing`, `useFollowers` |
| `usePinThingMutation` | `useCreateAtom` |
| `useGetTripleBondingCurveDataQuery` | `useBondingCurveData` |
| `useGetFollowingPositionsQuery.fetcher` | `useFollowing` |
| `useGetAccountAtomByWalletQuery.fetcher` | `useFollowers` |
| `useGetMyFollowersQuery.fetcher` | `useFollowers` |
| `useGetTopSofiaAccountsQuery` | `ExplorerPanel` |
| `CheckSocialLinksDocument` | `useSocialVerifier` |
| `CertificationTriplesDocument` | `usePageDiscovery` |
| `PageCertificationDataDocument` | `useBatchRewards` |
| `GetUserIntentionPositionsDocument` | `useOnChainIntentionGroups` |
| `GetTrendingByPredicateDocument` | `useTrendingCertifications` |
| `UserAllCertificationsDocument` | `UserCertificationsService` |
| `GetGlobalStakePositionDocument` (dynamic import) | `GlobalStakeService` |
| `WatchUserPositionsDocument`, `WatchUserTrackedPositionsDocument` | `SubscriptionManager` |
| `WatchUserPositionsSubscription` (type) | `derivations.ts` |
| `configureClient`, `configureWsClient`, `getWsClient`, `disposeWsClient`, `API_WS_PROD` | `sidepanel.tsx`, `background/realtime.ts`, `SubscriptionManager` |
| `intuitionGraphqlClient.fetchAllPages` | `useUserDiscoveryScore`, `QuestProgressService`, `useUserQuests`, `UserCertificationsService`, `DiscoveryScoreService` |
| Autres documents pour `QuestBadgeService`, `useDebateClaims`, `useStreakLeaderboard`, `useOnChainStreak`, `useUserDiscoveryScore` | tous câblés |

**Aucune op orpheline.** ✓

---

## 14. Doublons hook ↔ service

Aucun doublon hook ↔ service détecté post Lots H–J.

`useRecommendations` mort en Lot H avait laissé `RecommendationService.generateRecommendations` mort qui a été nettoyé (le fichier ne contient plus que `clearCache`).

---

## A.1 Realtime cache writes orphelins

**Finding majeur (HIGH/MEDIUM).** `SubscriptionManager.onPositionsUpdate` calcule et écrit 8 dérivations dans le cache React Query (`realtimeKeys.*`). **Seule `realtimeKeys.dailyStreak` est lue** par un consommateur (`useQuestSystem.ts:76`, via `applyOptimisticDailyStreak`).

Les 7 autres clés sont write-only :

| Clé | Sites d'écriture | Consommateur (useQuery / qc.getQueryData) | Confiance |
|---|---|---|---|
| `realtimeKeys.positions(wallet)` | `SubscriptionManager.ts:242` | aucun (cherché : `["positions",`) | **HIGH** |
| `realtimeKeys.trustCircle(wallet)` | `SubscriptionManager.ts:248` | aucun. `useTrustCircle.ts` fait du HTTP via `useGetMyTrustCircleQuery.fetcher`, ne lit pas le cache realtime. | **HIGH** |
| `realtimeKeys.following(wallet)` | `SubscriptionManager.ts:252` | aucun. `useFollowing` fait du HTTP. | **HIGH** |
| `realtimeKeys.verifiedOAuthPlatforms(wallet)` | `SubscriptionManager.ts:260` | aucun. | **HIGH** |
| `realtimeKeys.intentionGroups(wallet)` | `SubscriptionManager.ts:264` | aucun. `useOnChainIntentionGroups` fait du HTTP. | **HIGH** |
| `realtimeKeys.globalStakePosition(wallet)` | `SubscriptionManager.ts:268` | aucun. `useGlobalStake` fait du HTTP. | **HIGH** |
| `realtimeKeys.userProfileDerived(wallet)` | `SubscriptionManager.ts:274` | aucun. | **HIGH** |
| `realtimeKeys.userStats(wallet)` | `SubscriptionManager.ts:278` | aucun. | **HIGH** |

`realtimeKeys.followers` est défini mais aucun derivation n'y écrit (donc ni read ni write — déclaré pour rien).

**Cascade morte si le wiring Phase 3.B n'est pas prévu** :
- 6 fonctions `derive*` (`deriveTrustCircle`, `deriveFollowing`, `deriveVerifiedOAuthPlatforms`, `deriveIntentionGroups`, `deriveGlobalStakePosition`, `deriveUserStats`, `deriveUserProfile`) calculent dans le vide.
- 6 interfaces (`TrustCircleEntry`, `FollowingEntry`, `IntentionGroupEntry`, `GlobalStakePositionView`, `UserStats`, `UserProfileDerived`, `UserPositionView`) ne servent qu'à typer ces dérivations mortes.

**Action recommandée** : décider — soit câbler Phase 3.B (consommer les keys via `useQuery({ queryKey: realtimeKeys.X(wallet), queryFn: () => undefined, enabled: false })` dans les hooks), soit supprimer les `derive*` non câblées et garder uniquement la branche `dailyStreak`.

---

## A.2 Mastra pipeline mort

**Finding majeur (HIGH).** Toute la chaîne chatbot/recommendation/predicate Mastra est cassée :

```
[ChatPage component]  ← N'EXISTE PLUS
     ↓ (devrait envoyer SEND_CHATBOT_MESSAGE)
SEND_CHATBOT_MESSAGE handler  ← orphelin (messageHandlers.ts:175)
     ↓ agentRouter.sendMessage('CHATBOT', text)
sendChatbotToMastra  ← appelé seulement par l'orphelin
     ↓ (succès/erreur)
chrome.runtime.sendMessage({ type: "CHATBOT_RESPONSE", ... })  ← aucun listener
```

| Symbole | Confiance | Justification |
|---|---|---|
| `agentRouter.sendMessage` | **HIGH** | Appelé seulement par le handler orphelin `SEND_CHATBOT_MESSAGE`. |
| `mastraClient.sendChatbotToMastra` | **HIGH** | Appelé seulement par `agentRouter.sendMessage`. |
| `mastraClient.callMastraAgent` | **HIGH** | Helper interne utilisé par les 4 senders Mastra (tous morts). |
| `mastraClient.sendThemeExtractionToMastra` | **HIGH** | Aucun consommateur. |
| `mastraClient.sendRecommendationToMastra` | **HIGH** | Aucun consommateur. |
| `mastraClient.generatePredicate` | **HIGH** | Aucun consommateur. |
| `mastraClient.PredicateInput`, `PredicateOutput` (interfaces) | **HIGH** | Types morts (uniquement référencés par `generatePredicate`). |
| Message `CHATBOT_RESPONSE` (sender) | **HIGH** | Aucun listener `chrome.runtime.onMessage` ne traite ce type. |
| `MASTRA_API_URL` const (`config.ts:18`) | **HIGH** en cascade | Si toute la pipeline Mastra est retirée, `config.ts` peut être supprimé entièrement (le seul export survivant est ce const). |

**Action recommandée** : supprimer le fichier `background/mastraClient.ts`, le fichier `background/agentRouter.ts`, la branche `case "SEND_CHATBOT_MESSAGE"` de `messageHandlers.ts`, et le type `SEND_CHATBOT_MESSAGE` du union `MessageType`. Cascade : `config.ts` et `MASTRA_API_URL` deviennent morts.

Si l'intention est de re-câbler un ChatPage à terme, garder mais marquer `@deprecated // TODO: rewire ChatPage`.

---

## A.3 Types in-file morts

| Fichier | Symbole | Confiance | Justification |
|---|---|---|---|
| `lib/services/ai/types.ts` | `interface Recommendation` | **MEDIUM** | Consommé seulement par `StorageRecommendation.save/.load` (eux-mêmes morts en pratique — aucun call site). |
| `lib/services/ai/types.ts` | `interface RecommendationCache` | **MEDIUM** | Idem. |
| `lib/services/ai/types.ts` | `interface WalletData` | **HIGH** | Aucun consommateur. |
| `lib/database/StorageRecommendation.ts` | `static save(...)` | **HIGH** | Aucun caller. La classe ne sert plus que pour `clear()`. |
| `lib/database/StorageRecommendation.ts` | `static load(...)` | **HIGH** | Aucun caller. |
| `lib/clients/graphql-client.ts` | `intuitionGraphqlClient._initTxSubscription` (IIFE field) | **MEDIUM** | Le champ `_initTxSubscription` n'est jamais lu (IIFE side-effect). Mais le side-effect lui-même (subscribe à `txEventBus.on("*", clearCache)`) est utile — donc à transformer en simple bloc d'init au top-level plutôt que faux champ d'objet. |
| `lib/utils/avatar.ts` | `escapeSvgForCss` | **HIGH** | Aucun consommateur (ni dans `.ts`, ni dans `.tsx`, ni dans `.css`). |
| `lib/utils/avatar.ts` | `isEthereumAddress` | **MEDIUM** | Utilisé seulement à l'intérieur de `avatar.ts`. À privatiser (retirer `export`). |
| `lib/config/externalAuth.ts` | `AUTH_PAGE_URL` | **MEDIUM** | Exporté mais utilisé uniquement à l'intérieur du fichier (`getAuthUrl`). À privatiser. |
| `lib/realtime/derivations.ts` | `sharesToBigInt` | **MEDIUM** | Exporté mais utilisé uniquement dans `derivations.ts`. À privatiser. |
| `lib/realtime/derivations.ts` | `applyOptimisticPosition`, `clearOptimisticPosition` | **HIGH** | Stubs no-op exportés, jamais consommés. À retirer. |
| `lib/realtime/derivations.ts` | `clearOptimisticDailyStreak` | **HIGH** | Aucun consommateur ; la rollback closure de `applyOptimisticDailyStreak` est utilisée à la place. |
| `lib/realtime/derivations.ts` | `TrustCircleEntry`, `FollowingEntry`, `IntentionGroupEntry`, `GlobalStakePositionView`, `UserStats`, `UserProfileDerived`, `UserPositionView` | **MEDIUM** | Types liés aux dérivations dont l'output n'est jamais lu (cf. §A.1). HIGH si l'on supprime aussi les `derive*`. |
| `types/messages.ts:77` | `interface SofiaMessage` | **MEDIUM** | Seul l'alias `Message = SofiaMessage` est consommé. La base `SofiaMessage` peut être inlinée dans `Message` (renommer ou inverser). |
| `background/oauth/types/interfaces.ts:8` | `enum MessageType` `OAUTH_CALLBACK`, `OAUTH_IMPLICIT_CALLBACK` | LOW alive | Référencés par `MessageHandler.ts` (handler interne) mais aucun sender visible côté codebase. Émis par landing page externe — conserver. |

---

## A.4 Assets morts

Assets `*.png/*.svg` jamais référencés dans `.ts/.tsx/.css` :

| Asset | Confiance | Justification |
|---|---|---|
| `assets/Logo.png` | **HIGH** | Aucune référence en `.ts/.tsx/.css`. |
| `assets/iconwhite.png` | **HIGH** | Aucune référence. |
| `assets/icon.png` | **MEDIUM** | Aucune référence en `.ts/.tsx/.css` (mais peut être référencée via `manifest.json` indirect — à vérifier). |
| `assets/banner.png` | **MEDIUM** | Référencé uniquement dans `README.md` (pas en code). |
| `assets/chat.png` | **HIGH** | Aucune référence. |
| `assets/trustpage.png` | **HIGH** | Aucune référence. |
| `assets/youtubeDetail.png` | **HIGH** | Aucune référence. |

Note : les icônes `.png`/`.svg` listées dans le manifest `web_accessible_resources` (`components/ui/*.png`, `components/ui/quick_action/*.svg`) sont protégées par le manifest — pas dead.

Note : Lot H a déjà retiré 14 SVG/PNG morts de `components/ui/icons/`. Le résiduel ci-dessus est dans `assets/`.

---

## Synthèse & quick wins

### Volumétrie par catégorie (post Lots A–J)

| Catégorie | Entrées (HIGH+MEDIUM) |
|---|---|
| 1. Fichiers entiers morts | 0 (3 borderline) |
| 2. Exports morts dans les barrels | 8 |
| 3. Imports inutilisés | 4 (manuel, `tsc` bloqué) |
| 4. Deps npm orphelines | 0 |
| 5. CSS mort (fichiers) | 0 |
| 6. IndexedDB stores morts | 0 |
| 7. Chrome message types morts | 2 + cascade `CHATBOT_RESPONSE` |
| 8. Predicates morts | 0 |
| 9. Hooks/services dupliqués | 2 |
| 10. OAuth mort | 0 (Lot J propre) |
| 11. Composants React morts | 0 (1 borderline) |
| 12. Code legacy / @deprecated / TODO-remove | 5 (dont stubs no-op) |
| 13. GraphQL ops orphelines | 0 |
| 14. Doublons hook ↔ service | 0 |
| **A.1 Realtime cache writes orphelins** | **8 (HIGH) + 6 derive*** |
| **A.2 Mastra pipeline mort** | **8 (HIGH)** |
| **A.3 Types in-file morts** | **15** |
| **A.4 Assets morts** | **5 HIGH + 2 MEDIUM** |
| **TOTAL HIGH+MEDIUM** | **~68 entrées** |

### Top quick wins (HIGH only)

1. **Supprimer la pipeline Mastra inutilisée** (§A.2) — gain massif :
   - `background/mastraClient.ts` (entier)
   - `background/agentRouter.ts` (entier)
   - `case "SEND_CHATBOT_MESSAGE"` dans `messageHandlers.ts` + import `sendMessage`
   - Type `'SEND_CHATBOT_MESSAGE'` dans `MessageType` union (`types/messages.ts:11`)
   - `config.ts` entier (devient mort) + `MASTRA_API_URL`
   - Suppression du sender `CHATBOT_RESPONSE`
2. **Décider de `realtimeKeys.*` Phase 3.B** (§A.1) — soit câbler les useQuery, soit supprimer les 7 derivations non lues + leurs interfaces (~250 lignes de `derivations.ts` + 8 setQueryData dans `SubscriptionManager.ts`).
3. **Retirer `subscribeTrackedPositions` + `onTrackedPositionsUpdate`** (§12) — économie de bande passante WS (1 sub Hasura active pour rien).
4. **Supprimer `applyOptimisticPosition`, `clearOptimisticPosition`, `clearOptimisticDailyStreak`** (§A.3) — 3 exports morts dans `derivations.ts`.
5. **Supprimer `shutdownRealtime`** (§12) — exporté jamais appelé. Ou le câbler dans `disconnectWallet`.
6. **Privatiser ou supprimer types in-file morts** (§A.3) :
   - `escapeSvgForCss` (avatar.ts) → suppression
   - `isEthereumAddress`, `AUTH_PAGE_URL`, `sharesToBigInt` → privatiser (retirer `export`)
   - `WalletData` interface (services/ai/types.ts) → suppression
7. **Nettoyer barrel `lib/services/index.ts`** :
   - Retirer `export { RecommendationService }` (consommateur direct)
   - Retirer `export type { ResolvedTriple, LocalProgressData }` (jamais consommés via barrel)
   - Retirer les 5 types `GlobalStakeState/Position/Config/VaultStats/SeasonPosition` (jamais consommés via barrel)
8. **Nettoyer barrel `lib/database/index.ts`** :
   - Retirer `TripletsDataService` et `UserSettingsService` (les classes — consommateurs utilisent les const lowercase)
9. **Supprimer le barrel `components/charts/index.ts`** — non importé (consumer direct).
10. **Retirer 4 imports inutilisés** :
    - `VisitData` dans `indexedDB-methods.ts:10`
    - `SelectedHoverIcon` dans `QuickActionButton.tsx:19`
    - `RemoveHoverIcon2` dans `QuickActionButton.tsx:21`
    - Doublon `RemoveIcon2` (fusionner avec `RemoveIcon`)
11. **Réparer l'import cassé `useBookmarks.ts:6`** — `'../../extension/types/messages'` → `'../types/messages'`.
12. **Simplifier `RecommendationService`** (§1 borderline) — fonction libre `clearRecommendationCache(walletAddress)` au lieu de la classe ; cascade : retirer `lib/services/ai/types.ts` + `StorageRecommendation.save/.load`.
13. **Supprimer 5 assets morts** (§A.4) : `Logo.png`, `iconwhite.png`, `chat.png`, `trustpage.png`, `youtubeDetail.png`.
14. **Importer `INTENTION_PREDICATE_IDS` du config** dans `derivations.ts:103` au lieu de redéfinir le Set.

### Edits ciblés (file:line → action)

- `/home/chauche/Sofia/apps/extension/types/messages.ts:11` → retirer `| 'SEND_CHATBOT_MESSAGE'`
- `/home/chauche/Sofia/apps/extension/background/mastraClient.ts` → supprimer entièrement
- `/home/chauche/Sofia/apps/extension/background/agentRouter.ts` → supprimer entièrement
- `/home/chauche/Sofia/apps/extension/background/messageHandlers.ts:9` → retirer `import { sendMessage } from "./agentRouter"`
- `/home/chauche/Sofia/apps/extension/background/messageHandlers.ts:175-186` → retirer `case "SEND_CHATBOT_MESSAGE"`
- `/home/chauche/Sofia/apps/extension/config.ts` → supprimer (cascade Mastra)
- `/home/chauche/Sofia/apps/extension/lib/realtime/derivations.ts:475-491` → retirer `applyOptimisticPosition`, `clearOptimisticPosition`
- `/home/chauche/Sofia/apps/extension/lib/realtime/derivations.ts:465-471` → retirer `clearOptimisticDailyStreak`
- `/home/chauche/Sofia/apps/extension/lib/realtime/derivations.ts:103-110` → importer `INTENTION_PREDICATE_IDS` de `predicateConstants`
- `/home/chauche/Sofia/apps/extension/lib/realtime/SubscriptionManager.ts:201-230` + `:290-306` → retirer `subscribeTrackedPositions` et `onTrackedPositionsUpdate`
- `/home/chauche/Sofia/apps/extension/background/realtime.ts:97-101` → retirer `shutdownRealtime` (ou câbler dans `disconnectWallet`)
- `/home/chauche/Sofia/apps/extension/lib/services/index.ts:10,27,46,50,65` → retirer 8 re-exports morts
- `/home/chauche/Sofia/apps/extension/lib/database/index.ts:17,18` → retirer `TripletsDataService`, `UserSettingsService` (classes)
- `/home/chauche/Sofia/apps/extension/components/charts/index.ts` → supprimer le fichier
- `/home/chauche/Sofia/apps/extension/lib/utils/avatar.ts:52-57` → supprimer `escapeSvgForCss` ; `isEthereumAddress` ligne 22 retirer `export`
- `/home/chauche/Sofia/apps/extension/lib/config/externalAuth.ts:8` → retirer `export` de `AUTH_PAGE_URL`
- `/home/chauche/Sofia/apps/extension/lib/database/indexedDB-methods.ts:10` → retirer `import type { VisitData }`
- `/home/chauche/Sofia/apps/extension/components/ui/QuickActionButton.tsx:19,20,21` → retirer 3 imports redondants/inutilisés ; remplacer `RemoveIcon2` par `RemoveIcon` ligne 52
- `/home/chauche/Sofia/apps/extension/hooks/useBookmarks.ts:6` → corriger `'../../extension/types/messages'` → `'../types/messages'`
- `/home/chauche/Sofia/apps/extension/lib/services/ai/types.ts:15` → supprimer `interface WalletData`

### Limitations

- **`bun tsc --noEmit` bloqué par sandbox** : pas d'énumération exhaustive des TS6133. Les 4 imports détectés au §3 viennent de la lecture manuelle.
- **CSS par-règle** : audit non réalisé post Lot D (516 règles déjà coupées). Le résiduel par règle dans les 42 fichiers vivants est probablement <5 % et hors scope.
- **`OAUTH_CALLBACK`, `OAUTH_IMPLICIT_CALLBACK`** : aucun sender visible dans la codebase. Classés LOW alive car émis par la landing page Privy externe (non versionnée ici).
- **`subscribeTrackedPositions`** : `TRACKED_TERM_IDS` contient 3 termes (daily cert/vote, global stake) qui sont utiles si l'on veut éviter le top-500 cap Hasura. Mais `onTrackedPositionsUpdate` est explicitement no-op — donc la subscription consomme du quota WS pour rien tant que le no-op n'est pas remplacé. Décision produit nécessaire avant suppression.
- **`selectProviderByAddress` `@deprecated`** : conservé volontairement comme fallback, l'audit ne préconise PAS sa suppression sans une garantie de migration walletType à 100 %.
