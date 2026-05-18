# Sofia Extension — Audit Dead Code (post Lots A–N + ENS RPC fix)

**Date :** 2026-04-29
**Scope :** `/home/chauche/Sofia/apps/extension`
**Hors scope (Plasmo entry points) :** `sidepanel.tsx`, `background/index.ts`, `background/realtime.ts`, `background/messageHandlers.ts`, `background/messageSenders.ts`, `background/agentRouter.ts`, `background/mastraClient.ts`, `background/themeIconManager.ts`, `background/oauth/**`, `contents/*.ts`, `contents/*.tsx`
**Cleanup history :** Lots A à N appliqués (12 lots) + correctifs Lot K + ENS RPC fix (commit `85e9364d`).
- Lot N : `getStoredWalletAddress` centralisé dans `lib/utils/walletStorage.ts` (4 redéfs collapsées).
- Lot K régressions corrigées : 8 imports cassés `from '../types/viem'` → `from 'viem'`. `GOLD_PER_CERTIFICATION` re-export orphelin retiré. `types/database.ts` `IntentionPurpose` ré-importé. `ExtendedMetricsPanel.formatTrust` local restauré.
- ENS RPC fix : nouveau `ensPublicClient` (cloudflare-eth + publicnode + llamarpc fallback) — résout les rate-limits eth.merkle.io.
- Bonus : `useIdentityResolution` cache invalidation, `accounts._eq` → `_ilike`, import path `useBookmarks.ts` corrigé.

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
| `/home/chauche/Sofia/apps/extension/types/history.ts` | **HIGH** | Le fichier exporte `interface SessionData` et `interface VisitData`. Aucun consommateur — `grep -rn "VisitData\|SessionData"` ne trouve aucune référence hors du fichier lui-même. Vestige du système de tracking qui a été remplacé par `TrackedUrl` (dans `SessionTracker`) et `NavigationDataService`. |

**Cas borderline** :

| Fichier | Confiance | Justification |
|---|---|---|
| `/home/chauche/Sofia/apps/extension/lib/services/ai/RecommendationService.ts` | **MEDIUM** | Ne contient plus que `static clearCache(walletAddress)` qui délègue à `StorageRecommendation.clear`. Une fonction libre `clearRecommendationCache()` éliminerait la classe + `lib/services/ai/types.ts` + 2 méthodes mortes de `StorageRecommendation`. |
| `/home/chauche/Sofia/apps/extension/lib/services/ai/types.ts` | **HIGH** | `Recommendation`, `RecommendationCache` consommés uniquement par `StorageRecommendation.save/.load` (eux-mêmes morts). `WalletData` jamais consommé. Si on retire save/load, le fichier devient mort. |
| `/home/chauche/Sofia/apps/extension/lib/realtime/wsStatus.ts` | **MEDIUM** | Toujours documenté « write-only sinks. No reader is currently wired ». Les 4 fonctions sont stubs `() => {}` — conserver tant que la phase 5 offline-badge n'est pas tranchée. |
| `/home/chauche/Sofia/apps/extension/background/utils/url.ts` (export `sanitizeUrl`) | **HIGH** | `isSensitiveUrl` est consommé par `messageSenders.ts` + `PageDataService.ts`. **`sanitizeUrl` n'a aucun consommateur** — `pageAnalyzer.ts:12` redéfinit sa propre version locale. À privatiser ou supprimer. |

---

## 2. Exports morts dans les barrels

### 2.1 `~/lib/services/index.ts` (24 exports)

| Symbole | Confiance | Justification |
|---|---|---|
| `selectProviderByAddress` | **MEDIUM** | Ré-exporté ligne 12 mais consommateur unique (`useWalletFromStorage.ts:3`) importe **directement** depuis `'../lib/services/walletProvider'`. Le ré-export barrel n'est pas consommé. |
| (les 23 autres exports sont consommés via le barrel — vivants) | — | `BlockchainService`, `atomService`, `tripleService`, `cleanupProvider`, `selectProviderByName`, `clearProviderSelection`, `createBoundProvider`, `goldService`, `getLevelUpCost`, `XPServiceClass`, `xpService`, `levelUpService`, `groupManager`, `CertificationType`, `QuestBadgeService`, `QuestProgressService`, `QuestTrackingService`, `questTrackingService`, `BadgeService`, `badgeService`, `MessageBus`, `messageBus`, `txEventBus`, `pageDataService`, `sessionTracker`, `TrackedUrl`, `DomainCluster`, `discoveryScoreService`, `UserCertificationsServiceClass`, `userCertificationsService`, `TripleDetail`, `CertificationEntry`, `globalStakeService`, `cartService`, `topicPositionsService`, `platformPoolService`, `browsingNudgeService`. |

### 2.2 `~/lib/services/BrowsingNudgeService.ts` (export interne)

| Symbole | Confiance | Justification |
|---|---|---|
| `BrowsingNudgeServiceClass` (ligne 107) | **HIGH** | La classe est exportée nommée mais aucun consommateur n'importe `BrowsingNudgeServiceClass`. Tous les consommateurs utilisent l'instance singleton `browsingNudgeService` (lowercase). À retirer (la classe peut rester `class` privée du fichier). |

### 2.3 `~/lib/database/index.ts`

| Symbole | Confiance | Justification |
|---|---|---|
| `StorageRecommendation` (ligne 25) | **HIGH** | Consommé uniquement par `RecommendationService.ts` qui importe **directement** depuis `'../../database/StorageRecommendation'`. Le ré-export barrel n'est pas utilisé. |
| (les 8 autres exports sont vivants) | — | `SofiaIndexedDB`, `sofiaDB`, `STORES`, `TripletsRecord`, `IntentionGroupRecord`, `GroupUrlRecord`, `CartItemRecord`, `BookmarkService`, `IntentionGroupsService`, `tripletsDataService`, `userSettingsService`, `CartDataService`. |

### 2.4 `~/lib/utils/index.ts`

| Symbole | Confiance | Justification |
|---|---|---|
| (aucun mort détecté) | — | Tous les exports du barrel `~/lib/utils` ont au moins un consommateur. |

### 2.5 `~/hooks/index.ts`

| Symbole | Confiance | Justification |
|---|---|---|
| (aucun mort détecté) | — | Vérifié : `useFollowAccount`, `useGetAtomAccount`, `useTrustCircle`, `useFollowing`, `useFollowers`, `useDailyStreakProfit`, `useStreakLeaderboard`, `useDebateClaims`, `useTopicInterests`, `usePlatformPool`, `useBatchRewards`, `useTracking`, etc. — tous consommés. |

### 2.6 `~/lib/config/constants.ts`

| Symbole | Confiance | Justification |
|---|---|---|
| `STORAGE_CONFIG` | **HIGH** | Aucun consommateur. La const `TRACKING_ENABLED_KEY` est dupliquée en string literal `"tracking_enabled"` directement dans `useTracking.ts:4` et `contents/tracking.ts:17`. À soit supprimer, soit utiliser. |
| `UI_CONFIG` | **HIGH** | Aucun consommateur. `REFRESH_INTERVAL`, `TOAST_DURATION`, `LOADING_DELAY`, `MAX_TRIPLETS_DISPLAY` jamais lus. |
| Re-export `EXPLORER_URLS` | **HIGH** | Re-exporté ligne 15 depuis `chainConfig` mais consommateurs (`StakeModal`, `GlobalStakeModal`, `WeightModal`) importent **directement** depuis `chainConfig.ts`. Le re-export via `constants.ts` n'est jamais utilisé. |
| Re-export `API_CONFIG` | **HIGH** | Re-exporté ligne 14 mais consommateurs (`graphql-client.ts`, `useGetAtomAccount.ts`) importent **directement** depuis `chainConfig.ts`. |
| `ERROR_MESSAGES` | LOW alive | Vivant via `useIntentionCertify`, `useRedeemTriple`, `useRedeemGlobalStake`, `useDepositGlobalStake`, `useWeightOnChain`, `useTrustAccount`, `useCreateTripleOnChain`. |

---

## 3. Imports inutilisés (TS6133)

`bun tsc --noEmit` est bloqué par le sandbox (permission denied sur tsc/node). Détection manuelle limitée :

| Fichier | Symbole | Confiance | Justification |
|---|---|---|---|
| (aucun import inutilisé détecté manuellement post-K) | — | — | Les 4 imports flaggés dans l'audit précédent (`VisitData` dans `indexedDB-methods.ts`, `SelectedHoverIcon` / `RemoveHoverIcon2` / `RemoveIcon2` dans `QuickActionButton.tsx`) ont été nettoyés. |

Limitation : impossible d'exécuter `tsc --noEmit` dans le sandbox actuel — l'énumération exhaustive de TS6133 n'a pas pu être effectuée. Recommandé de relancer le typecheck CI.

---

## 4. Dépendances npm orphelines

`package.json` : 16 deps + 11 devDeps.

| Dep | Statut | Notes |
|---|---|---|
| `@0xsofia/design-system` | ✓ vivant | DS partagé |
| `@0xsofia/graphql` | ✓ vivant | Hooks codegen, ~30 imports |
| `@dicebear/collection` | ✓ vivant | `lib/utils/avatar.ts` |
| `@dicebear/core` | ✓ vivant | `lib/utils/avatar.ts` |
| `@plasmohq/storage` | ✓ vivant | `useTracking`, `tracking.ts` |
| `@tanstack/query-async-storage-persister` | ✓ vivant | `lib/providers/queryClient.ts` |
| `@tanstack/react-query` | ✓ vivant | omniprésent |
| `@tanstack/react-query-persist-client` | ✓ vivant | `background/realtime.ts`, `lib/providers/queryProvider.tsx` |
| `graphql` | ✓ vivant | `print()` dans `SubscriptionManager` |
| `lucide-react` | ✓ vivant | `BottomNavigation.tsx`, `CartDrawer.tsx` |
| `mipd` | ✓ vivant | `contents/walletBridge.ts` |
| `plasmo`, `react`, `react-dom`, `viem`, `wagmi` | ✓ vivants | base |

**Aucune dépendance npm orpheline.** ✓

---

## 5. CSS mort

42 fichiers `components/styles/*.css`. Tous ont au moins un consommateur `.tsx/.ts` après vérification individuelle.

**Whitelists dynamiques préservées** : `intention-pill--`, `bento-`, `avatar-`, `badge-`, `podium-`, `position-board--`, `item-pill--`, `item-tier--`, `cart-drawer__item-pill--`, `batch-reward__item-tier--`.

**DS classes** (`fc-verb-tag`, `pf-platform-card`, `pf-echoes-sort`, etc.) consommées via `@0xsofia/design-system` package — toujours vivantes.

Le résiduel par règle CSS individuelle (Lot D a coupé 516 règles en avril 2026) est probablement <5 % et hors scope d'un audit fichier-par-fichier. Cf. `AUDIT_CSS_DEAD.md` pour le détail.

---

## 6. IndexedDB stores morts

`STORES` constants in `lib/database/indexedDB.ts` :

| Store | Status |
|---|---|
| `TRIPLETS_DATA` | ✓ vivant (`tripletsDataService`, `BadgeService`, `oauth/TripletExtractor`) |
| `USER_SETTINGS` | ✓ vivant (`userSettingsService`, `SettingsPage`, `EchoesTab`) |
| `BOOKMARK_LISTS` | ✓ vivant (`BookmarkService`) |
| `BOOKMARKED_TRIPLETS` | ✓ vivant (`BookmarkService`) |
| `INTENTION_GROUPS` | ✓ vivant (`IntentionGroupsService`, `groupManager`) |
| `CART_ITEMS` | ✓ vivant (`CartDataService`, `CartService`) |

**Note** : la base secondaire `sofia-recommendations` (DB séparée gérée par `StorageRecommendation`) ne contient **plus que de l'écriture morte** : `save` et `load` jamais appelés ; seul `clear` est invoqué par `RecommendationService.clearCache` depuis `SettingsPage`. Le store `recommendations` sert uniquement à effacer un cache vide. Cf. §A.3.

**Aucun store de la DB principale mort.** ✓

---

## 7. Chrome message types morts

`types/messages.ts` `MessageType` union (28 types). Vérification : (a) handler dans `background/messageHandlers.ts` OU `contents/*.ts` ET (b) sender.

### 7.1 Messages avec handler MAIS sans sender (handler orphelin)

| MessageType | Handler | Sender | Confiance | Justification |
|---|---|---|---|---|
| `SEND_CHATBOT_MESSAGE` | `messageHandlers.ts:175` | aucun | **HIGH** | `ChatPage` n'existe plus. Aucun fichier n'envoie `SEND_CHATBOT_MESSAGE`. Le handler appelle `agentRouter.sendMessage('CHATBOT', text)` qui appelle `sendChatbotToMastra`. **Toute la pipeline chatbot est orpheline ; voir §A.2** (Lot L pending). |
| `GET_PAGE_DATA` | `contents/pageAnalyzer.ts:45` | aucun | **HIGH** | Aucun caller envoie `GET_PAGE_DATA`. (Note : `messageBus.getCleanUrl()` envoie `GET_CLEAN_URL`, qui a un sender — vivant.) |

### 7.2 Messages avec sender MAIS sans handler

Aucun détecté.

### 7.3 Messages internes émis sans listener (broadcast)

| MessageType | Sender | Listener | Confiance |
|---|---|---|---|
| `CHATBOT_RESPONSE` | `agentRouter.ts:22, 32` | aucun | **HIGH** | Envoyé via `chrome.runtime.sendMessage` mais aucun listener. Cascade morte (cf. §A.2). |
| `THEME_DETECTED`, `THEME_CHANGED`, `PAGE_THEME_DETECTED` | offscreen / `theme-detector.ts` | `themeIconManager.ts:94` | LOW alive | Emis par offscreen document — comportement Chrome légitime. |
| `THEME_EXTRACTION_COMPLETE` | `messageHandlers.ts:242` | `SettingsPage.tsx:43` | ✓ vivant | Notification post-import bookmarks. |

### 7.4 Messages externes (LOW alive — externally_connectable)

`externally_connectable.matches: doc.sofia.intuition.box, localhost:3000`

| MessageType | Confiance | Notes |
|---|---|---|
| `WALLET_CONNECTED` | LOW alive | Handler `messageHandlers.ts:57`. Externe via Privy landing page. |
| `WALLET_DISCONNECTED` | LOW alive | Handler `messageHandlers.ts:88` (et handler interne `messageHandlers.ts:275`). |
| `FIRST_CLAIM` | LOW alive | Externe, handler `messageHandlers.ts:130`. |
| `DEEP_LINK_PROFILE` | ✓ vivant | Envoyé par `contents/shareRedirect.ts`, traité dans `messageHandlers.ts:458`. |
| `OAUTH_TOKEN_SUCCESS` / `TWITTER_OAUTH_SUCCESS` | LOW alive | Envoyés par landing page Privy (externe). Handler `messageHandlers.ts:100`. |

### 7.5 Messages OAuth (`background/oauth/core/MessageHandler.ts`)

| Enum value | Sender interne | Confiance |
|---|---|---|
| `OAUTH_CONNECT` | `SocialsTab.tsx` (via `useSocialVerifier`) | ✓ vivant |
| `OAUTH_CALLBACK` | aucun (chrome.runtime callback / landing page) | LOW alive |
| `OAUTH_IMPLICIT_CALLBACK` | aucun | LOW alive |

### 7.6 Messages utilisés (vivants)

`GET_TAB_ID`, `PAGE_DATA`, `PAGE_DURATION`, `FETCH_BOOKMARKS`, `IMPORT_SELECTED_BOOKMARKS`, `INITIALIZE_BADGE`, `TRIPLET_PUBLISHED`, `GET_CLEAN_URL`, `URL_CHANGED`, `GET_INTENTION_GROUPS`, `GET_GROUP_DETAILS`, `CERTIFY_URL`, `REMOVE_URL_FROM_GROUP`, `DELETE_GROUP`, `UPDATE_GROUP_LEVEL`, `LEVEL_UP_GROUP`, `PREVIEW_LEVEL_UP`, `TRACK_URL`, `WALLET_REQUEST`, `WALLET_EVENT`, `BROWSING_NUDGE`, `NUDGE_DISMISSED`, `DEEP_LINK_PROFILE`.

**Bilan post-N : 2 message types restent orphelins** (`SEND_CHATBOT_MESSAGE`, `GET_PAGE_DATA`) — Lot L pending pour le chatbot.

---

## 8. Predicates morts

`lib/config/predicateConstants.ts` — exports vérifiés un par un :

| Export | Status |
|---|---|
| `INTENTION_PREDICATE_IDS` | ✓ vivant (`usePageBlockchainData.ts:30`, `lib/realtime/derivations.ts` redéfinit en Set local — cf. §9) |
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
| `INTENTION_PREDICATE_LABELS` | privé (interne, OK) |
| `INTENTION_PREDICATE_LABELS_WITH_LEGACY` | privé (interne, OK) |
| `OAUTH_PREDICATE_IDS` | privé (interne, OK) |

**Aucun export mort.** ✓

---

## 9. Hooks/services dupliqués

| Doublon | Confiance | Action |
|---|---|---|
| `INTENTION_PREDICATE_IDS` re-défini en `Set` local dans `lib/realtime/derivations.ts:103` — doublon de l'array exporté par `predicateConstants.ts:18` | **HIGH** | Importer le tableau du config et faire `new Set(...)` localement (1 ligne au lieu de 8). |
| `OAUTH_PREDICATE_IDS` re-défini en `Set` dans `derivations.ts:95` — `predicateConstants.ts:27` a aussi un `OAUTH_PREDICATE_IDS` privé (array). Deux sources, deux shapes. | **MEDIUM** | Soit ré-exporter depuis `predicateConstants` et dériver un Set, soit accepter le doublon (justifiable car shapes différentes). |
| `formatTrust` local dans `ExtendedMetricsPanel.tsx:19` (signature `(value: number)`) vs `formatTrust` util dans `lib/utils/formatTrust.ts:9` (signature `(shares: string)`) | **LOW** | Signatures différentes mais nom identique — risque de confusion à la lecture. À renommer le local en `formatTrustNumber` ou similaire. |

**Note** : `getWalletAddress` re-définition multiple a été nettoyé en Lot N (centralisé dans `lib/utils/walletStorage.ts:getStoredWalletAddress`). Vérifié : 4 consommateurs (`background/index.ts`, `oauth/SyncManager.ts`, `oauth/TokenManager.ts`, `QuestTrackingService.ts`).

---

## 10. Code OAuth/Privy mort

| Méthode/symbole | Status |
|---|---|
| `OAuthService.initiateOAuth` | ✓ vivant (sender `OAUTH_CONNECT` via `useSocialVerifier` ↔ `SocialsTab.tsx`) |
| `OAuthService.handleCallback` | LOW alive (sender externe / landing page) |
| `OAuthService.handleImplicitCallback` | LOW alive (sender externe) |
| `OAuthService.handleExternalOAuthToken` | ✓ vivant (`messageHandlers.ts:112`) |
| `OAuthService.syncPlatformData` | ✓ vivant (callback post-auth) |
| `OAuthFlow` enum | ✓ vivant (`OAuthFlowManager`) |
| `MessageType` enum (interne OAuth) | ✓ vivant pour `OAUTH_CONNECT` ; LOW alive pour les 2 callbacks |
| `PlatformConfig`, `UserToken`, `SyncInfo`, `TripletRule`, `UserData` | ✓ vivants en interne |

**Plateformes config-only stubs** (config OAuth déclaré mais pas utilisé) :

| Plateforme | Status | Justification |
|---|---|---|
| `oauthConfig.github` | LOW alive | `clientId: ''` + TODO. Pas registered. Stub manifeste pour future implémentation. |
| `oauthConfig.reddit` | LOW alive | Idem. |
| `oauthConfig.lastfm` | LOW alive | Idem. |
| `oauthConfig.strava` | LOW alive | Idem. |

Hooks OAuth-side :

| Hook | Status |
|---|---|
| `useSocialVerifier` | ✓ vivant (`SocialsTab.tsx`) |
| `useDiscordProfile` | ✓ vivant (`ProfilePage.tsx`) |

Le bloc OAuth est **propre post-J/N**. Les LOW alive zones sont les callbacks externes (Privy landing page) — non scopable depuis ce repo.

---

## 11. Composants React morts

| Composant | Confiance | Justification |
|---|---|---|
| (aucun composant entièrement mort détecté) | — | Tous les `.tsx` de `components/ui/`, `components/modals/`, `components/pages/`, `components/charts/`, `components/layout/` ont au moins un site de rendu. |

**Cas borderline** : aucun.

`PageBlockchainSkeleton` est exportée et consommée par `PageBlockchainCard.tsx:29`. `SkeletonLine`/`SkeletonCircle` sont privés (pas exportés) — déjà OK.

---

## 12. Code legacy / @deprecated / TODO-remove

| Localisation | Confiance | Justification |
|---|---|---|
| `lib/services/walletProvider.ts:208` `selectProviderByAddress` `@deprecated` | LOW alive | Toujours utilisé en fallback dans `useWalletFromStorage.ts:67` lorsque `walletType` n'est pas connu. À conserver tant que la migration walletType n'est pas garantie 100 %. |
| `contents/walletBridge.ts:142` `wallet_selectProviderByAddress` handler `@deprecated` | LOW alive | Symétrique du précédent. Vivant tant que le hook l'appelle. |
| `hooks/useFollowAccount.ts:83-112` `unfollowAccount` (commentaire « legacy placeholder ») | **HIGH** | Méthode stub avec `setTimeout(2000)` qui retourne un faux txHash random. Aucun consommateur — `FollowButton.tsx` n'utilise que `followAccount` et `isLoading`. La logique unfollow réelle est dans `useRedeemTriple`. À supprimer. |
| `lib/realtime/SubscriptionManager.ts:201-230` `subscribeTrackedPositions()` + `onTrackedPositionsUpdate()` | **MEDIUM** | `onTrackedPositionsUpdate` toujours no-op (commentaire « used to feed legacy Explorer keys… No-op for now »). La subscription WS est ouverte côté serveur pour rien (consomme bande passante + slot Hasura) tant qu'aucun consommateur ne lit `realtimeKeys.positions` filtrées. À évaluer : retirer ou attendre Phase 3.B v2. |
| `lib/clients/graphql-client.ts:140` `_initTxSubscription: (() => { ... })()` (IIFE field) | **MEDIUM** | Le champ `_initTxSubscription` n'est jamais lu, c'est un IIFE side-effect. Le side-effect (subscribe à `txEventBus.on("*", clearCache)`) est utile mais devrait être un bloc d'init au top-level plutôt qu'un faux champ d'objet. Refactor cosmétique. |
| `oauth-config.ts` GitHub/Reddit/Lastfm/Strava stubs avec TODO | LOW alive | Voir §10. Stubs préservés intentionnellement pour future implémentation. |

---

## 13. GraphQL ops importées non câblées

Toutes les ops `@0xsofia/graphql` importées sont câblées :

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

Aucun doublon hook ↔ service détecté.

`useRecommendations` mort en Lot H avait laissé `RecommendationService.generateRecommendations` mort qui a été nettoyé (le fichier ne contient plus que `clearCache`).

---

## A.1 Realtime cache writes orphelins

**Finding majeur (HIGH/MEDIUM) — Lot M pending.** `SubscriptionManager.onPositionsUpdate` calcule et écrit 8 dérivations dans le cache React Query (`realtimeKeys.*`). **Seule `realtimeKeys.dailyStreak` est lue** par un consommateur (`useQuestSystem.ts:76`, via `applyOptimisticDailyStreak`).

Les 7 autres clés sont write-only :

| Clé | Sites d'écriture | Consommateur (`useQuery` / `qc.getQueryData`) | Confiance |
|---|---|---|---|
| `realtimeKeys.positions(wallet)` | `SubscriptionManager.ts:242` | aucun | **HIGH** |
| `realtimeKeys.trustCircle(wallet)` | `SubscriptionManager.ts:248` | aucun. `useTrustCircle.ts` fait du HTTP via `useGetMyTrustCircleQuery.fetcher`. | **HIGH** |
| `realtimeKeys.following(wallet)` | `SubscriptionManager.ts:252` | aucun. `useFollowing` fait du HTTP. | **HIGH** |
| `realtimeKeys.verifiedOAuthPlatforms(wallet)` | `SubscriptionManager.ts:260` | aucun. | **HIGH** |
| `realtimeKeys.intentionGroups(wallet)` | `SubscriptionManager.ts:264` | aucun. `useOnChainIntentionGroups` fait du HTTP. | **HIGH** |
| `realtimeKeys.globalStakePosition(wallet)` | `SubscriptionManager.ts:268` | aucun. `useGlobalStake` fait du HTTP. | **HIGH** |
| `realtimeKeys.userProfileDerived(wallet)` | `SubscriptionManager.ts:274` | aucun. | **HIGH** |
| `realtimeKeys.userStats(wallet)` | `SubscriptionManager.ts:278` | aucun. | **HIGH** |

`realtimeKeys.followers` est défini (derivations.ts:46) mais aucun derivation n'y écrit (donc ni read ni write — déclaré pour rien).

**Cascade morte si Phase 3.B n'est pas câblée** :
- 6 fonctions `derive*` (`deriveTrustCircle`, `deriveFollowing`, `deriveVerifiedOAuthPlatforms`, `deriveIntentionGroups`, `deriveGlobalStakePosition`, `deriveUserStats`, `deriveUserProfile`) calculent dans le vide.
- 6+ interfaces (`TrustCircleEntry`, `FollowingEntry`, `IntentionGroupEntry`, `GlobalStakePositionView`, `UserStats`, `UserProfileDerived`, `UserPositionView`) ne servent qu'à typer ces dérivations mortes.

**Action recommandée (Lot M)** : décider — soit câbler Phase 3.B (consommer les keys via `useQuery({ queryKey: realtimeKeys.X(wallet), queryFn: () => undefined, enabled: false })` dans les hooks HTTP), soit supprimer les `derive*` non câblées + les `setQueryData` correspondants dans `SubscriptionManager` et garder uniquement la branche `dailyStreak`.

---

## A.2 Mastra pipeline mort

**Finding majeur (HIGH) — Lot L pending.** Toute la chaîne chatbot est cassée :

```
[ChatPage component]  ← N'EXISTE PAS
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
| `mastraClient.callMastraAgent` | **HIGH** | Helper interne utilisé par les 4 senders Mastra (3 morts + 1 mort en cascade). |
| `mastraClient.sendThemeExtractionToMastra` | **HIGH** | Aucun consommateur. |
| `mastraClient.sendRecommendationToMastra` | **HIGH** | Aucun consommateur. |
| `mastraClient.generatePredicate` | **HIGH** | Aucun consommateur. |
| `mastraClient.PredicateInput`, `PredicateOutput` (interfaces) | **HIGH** | Types morts (uniquement référencés par `generatePredicate`). |
| Message `CHATBOT_RESPONSE` (sender) | **HIGH** | Aucun listener `chrome.runtime.onMessage` ne traite ce type. |

**Caveat important** : `MASTRA_API_URL` (config.ts:18) est **vivant** car `useSocialVerifier.ts:17` l'utilise pour `socialVerifierWorkflow`. Donc `config.ts` reste, contrairement à l'audit précédent qui le marquait comme mort en cascade.

**Action recommandée (Lot L)** : supprimer le fichier `background/mastraClient.ts` (entier), `background/agentRouter.ts` (entier), la branche `case "SEND_CHATBOT_MESSAGE"` de `messageHandlers.ts`, et le type `'SEND_CHATBOT_MESSAGE'` du union `MessageType`. Garder `MASTRA_API_URL` dans `config.ts` (vivant via SocialVerifier).

Si l'intention est de re-câbler un ChatPage à terme, garder mais marquer `@deprecated // TODO: rewire ChatPage`.

---

## A.3 Types in-file morts

| Fichier | Symbole | Confiance | Justification |
|---|---|---|---|
| `types/history.ts` | `interface SessionData` + `interface VisitData` | **HIGH** | **Fichier entier mort** (cf. §1). |
| `lib/services/ai/types.ts` | `interface Recommendation` | **MEDIUM** | Consommé seulement par `StorageRecommendation.save/.load` (eux-mêmes morts en pratique). |
| `lib/services/ai/types.ts` | `interface RecommendationCache` | **MEDIUM** | Idem. |
| `lib/services/ai/types.ts` | `interface WalletData` | **HIGH** | Aucun consommateur. |
| `lib/database/StorageRecommendation.ts` | `static save(...)` | **HIGH** | Aucun caller. La classe ne sert plus que pour `clear()`. |
| `lib/database/StorageRecommendation.ts` | `static load(...)` | **HIGH** | Aucun caller. |
| `lib/clients/graphql-client.ts` | `intuitionGraphqlClient._initTxSubscription` (IIFE field) | **MEDIUM** | Le champ `_initTxSubscription` n'est jamais lu (IIFE side-effect). Le side-effect lui-même est utile mais à transformer en bloc d'init top-level. |
| `lib/realtime/derivations.ts` | `TrustCircleEntry`, `FollowingEntry`, `IntentionGroupEntry`, `GlobalStakePositionView`, `UserStats`, `UserProfileDerived`, `UserPositionView` | **MEDIUM** | Types liés aux dérivations dont l'output n'est jamais lu (cf. §A.1). HIGH si on supprime aussi les `derive*`. |
| `types/messages.ts:77` | `interface SofiaMessage` | **MEDIUM** | Seul l'alias `Message = SofiaMessage` est consommé. La base `SofiaMessage` peut être inlinée dans `Message` (renommer ou inverser). |
| `background/oauth/types/interfaces.ts:8` | `enum MessageType` `OAUTH_CALLBACK`, `OAUTH_IMPLICIT_CALLBACK` | LOW alive | Référencés par `MessageHandler.ts` (handler interne) mais aucun sender visible côté codebase. Émis par landing page externe — conserver. |
| `background/mastraClient.ts:124-138` | `interface PredicateInput`, `PredicateOutput` | **HIGH** | Voir §A.2 — types morts en cascade Mastra. |
| `lib/utils/walletStorage.ts` | export `getStoredWalletAddress` | ✓ vivant | Vérifié : 4 consommateurs post-Lot N. |
| `lib/utils/ensUtils.ts` | export `ensPublicClient` | ✓ vivant | Vérifié : `useIdentityResolution.ts:17, 108, 198`. |

---

## A.4 Assets morts

Assets `*.png/*.svg` jamais référencés dans `.ts/.tsx/.css/.html/.json` :

| Asset | Confiance | Justification |
|---|---|---|
| `assets/Logo.png` | **HIGH** | Aucune référence en `.ts/.tsx/.css`. |
| `assets/iconwhite.png` | **HIGH** | Aucune référence. |
| `assets/icon.png` | **HIGH** | Aucune référence en `.ts/.tsx/.css/.json` (inclus manifest). |
| `assets/banner.png` | **MEDIUM** | Référencé uniquement dans `README.md` (pas en code). |
| `assets/chat.png` | **HIGH** | Aucune référence. |
| `assets/trustpage.png` | **HIGH** | Aucune référence. |
| `assets/youtubeDetail.png` | **HIGH** | Aucune référence (vs `youtubegroup.png` qui est utilisé). |
| `assets/proof.png` | **HIGH** | Aucune référence (anciennement utilisé dans OnboardingTutorialPage, retiré). |

Note : les icônes `.png`/`.svg` listées dans le manifest `web_accessible_resources` (`components/ui/*.png`, `components/ui/quick_action/*.svg`, `assets/*`) sont protégées par le manifest, mais ne sont **chargées au runtime** que si elles sont importées. Les 8 ci-dessus ne le sont pas.

Note : Lot H avait déjà retiré 14 SVG/PNG morts de `components/ui/icons/`. Le résiduel ci-dessus est dans `assets/`.

---

## Synthèse & quick wins

### Volumétrie par catégorie (post Lots A–N)

| Catégorie | Entrées (HIGH+MEDIUM) |
|---|---|
| 1. Fichiers entiers morts | 1 HIGH (`types/history.ts`) + 3 borderline |
| 2. Exports morts dans les barrels | 5 (1 services, 1 BrowsingNudgeServiceClass, 1 database, 4 constants) |
| 3. Imports inutilisés | 0 (tsc bloqué — recommandé en CI) |
| 4. Deps npm orphelines | 0 |
| 5. CSS mort (fichiers) | 0 |
| 6. IndexedDB stores morts | 0 |
| 7. Chrome message types morts | 2 + cascade `CHATBOT_RESPONSE` |
| 8. Predicates morts | 0 |
| 9. Hooks/services dupliqués | 2 HIGH/MEDIUM + 1 LOW |
| 10. OAuth mort | 0 |
| 11. Composants React morts | 0 |
| 12. Code legacy / @deprecated / TODO-remove | 4 (dont `unfollowAccount` HIGH) |
| 13. GraphQL ops orphelines | 0 |
| 14. Doublons hook ↔ service | 0 |
| **A.1 Realtime cache writes orphelins (Lot M)** | **8 HIGH + 6 derive*** |
| **A.2 Mastra pipeline mort (Lot L)** | **7 HIGH** |
| **A.3 Types in-file morts** | **9 HIGH + 8 MEDIUM** |
| **A.4 Assets morts** | **7 HIGH + 1 MEDIUM** |
| **TOTAL (hors annexes architecturales)** | **~14 HIGH + 5 MEDIUM** |
| **TOTAL avec annexes architecturales** | **~45 HIGH + 12 MEDIUM** |

### Top quick wins HIGH (faciles, peu risqués)

1. **Supprimer `types/history.ts`** (§1) — fichier entier inutile, `SessionData`/`VisitData` jamais référencés.
2. **Supprimer 5+ assets morts** (§A.4) : `Logo.png`, `iconwhite.png`, `icon.png`, `chat.png`, `trustpage.png`, `youtubeDetail.png`, `proof.png`.
3. **Supprimer `unfollowAccount` stub** dans `useFollowAccount.ts:83-112` — fake setTimeout + faux txHash random, jamais consommé.
4. **Nettoyer barrel `lib/services/index.ts`** : retirer `selectProviderByAddress` (consommateur direct depuis `walletProvider.ts`).
5. **Nettoyer barrel `lib/database/index.ts`** : retirer `StorageRecommendation` (consommateur direct).
6. **Privatiser `BrowsingNudgeServiceClass`** dans `BrowsingNudgeService.ts:107` — exporté mais aucun consommateur.
7. **Supprimer `STORAGE_CONFIG` + `UI_CONFIG`** dans `lib/config/constants.ts` — aucun consommateur.
8. **Supprimer re-exports `EXPLORER_URLS` + `API_CONFIG`** dans `lib/config/constants.ts:14-15` — consommateurs importent directement depuis `chainConfig.ts`.
9. **Privatiser ou supprimer `sanitizeUrl`** dans `background/utils/url.ts` — `pageAnalyzer.ts` redéfinit sa propre version.
10. **Réimporter `INTENTION_PREDICATE_IDS`** depuis `predicateConstants.ts` dans `lib/realtime/derivations.ts:103` au lieu de redéclarer le Set localement.

### Quick wins MEDIUM (cosmétiques)

11. Renommer `formatTrust` local dans `ExtendedMetricsPanel.tsx:19` pour éviter la collision avec l'util `formatTrust(shares: string)`.
12. Refactor `_initTxSubscription` IIFE field dans `graphql-client.ts:140` en bloc d'init top-level.

### Lots architecturaux pending (gros gains)

13. **Lot L — Mastra pipeline** (§A.2) : ~250 lignes nettoyables. Supprimer `mastraClient.ts`, `agentRouter.ts`, `case "SEND_CHATBOT_MESSAGE"`, type `'SEND_CHATBOT_MESSAGE'`. **Garder `config.ts:MASTRA_API_URL`** (vivant via `useSocialVerifier`).
14. **Lot M — Realtime cache writes** (§A.1) : décider câblage Phase 3.B ou suppression des 7 derivations + interfaces (~300 lignes). 1 sub Hasura WS dormante à terminer.
