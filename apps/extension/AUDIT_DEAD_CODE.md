# Sofia Extension — Audit Dead Code (post-G)

**Date :** 2026-04-29
**Scope :** `/home/chauche/Sofia/apps/extension`
**Hors scope (Plasmo entry points) :** `sidepanel.tsx`, `background/index.ts`, `background/*.ts`, `contents/*.ts`, `contents/*.tsx`
**Cleanup history :** Lots A à G + DiscoveryScore fix déjà appliqués. ~30 fichiers supprimés, ~100 exports barrels purgés, ~516 règles CSS coupées, ~150 types/méthodes/messages morts retirés en passes précédentes.

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

---

## 1. Fichiers entiers morts

| Fichier (chemin absolu) | Confiance | Justification |
|---|---|---|
| `/home/chauche/Sofia/apps/extension/lib/services/UserSessionManager.ts` | **HIGH** | Aucun consommateur externe (8 fonctions exportées). Le seul export ré-exposé via `~/lib/services` (`getWalletAddress`) n'est jamais importé : `getWalletAddress` interne aux services (QuestTrackingService, oauth/core/*, background/index.ts) re-définissent leur propre helper local. |
| `/home/chauche/Sofia/apps/extension/background/tripletProcessor.ts` | **HIGH** | `convertThemesToTriplets` n'a aucun importeur. Plus utilisé depuis le retrait de l'agent de thème. |
| `/home/chauche/Sofia/apps/extension/components/ui/AccountStats.tsx` | **HIGH** | Le composant React `<AccountStats>` n'est jamais rendu. Seul le hook `useAccountStats` (fichier différent) est consommé (par `ProfilePage`/`UserProfilePage`). Re-export barrel `components/ui/index.ts` dead (ligne 7). |
| `/home/chauche/Sofia/apps/extension/components/ui/blockchain/CommunityTrustBar.tsx` | **HIGH** | `<CommunityTrustBar>` jamais rendu, importé nulle part. |
| `/home/chauche/Sofia/apps/extension/components/styles/CommunityTrustBar.css` | **HIGH** | Importé uniquement par `CommunityTrustBar.tsx` (mort). |
| `/home/chauche/Sofia/apps/extension/components/layout/background/fond.png` | **HIGH** | Aucune référence dans les sources `.ts/.tsx/.css`. |
| `/home/chauche/Sofia/apps/extension/hooks/useRecommendations.ts` | **HIGH** | Hook jamais consommé par aucun composant. Cascade : rend morts `RecommendationService.generateRecommendations` + `RecommendationService.generateWithAgent` + message `GENERATE_RECOMMENDATIONS` + `agentRouter.sendRecommendationRequest`. (Note : `RecommendationService.clearCache` reste utilisé par `SettingsPage.tsx`.) |

**Assets icônes / SVG morts** (jamais importés en `.tsx/.ts/.css`)

| Asset | Confiance |
|---|---|
| `components/ui/icons/Icon=Search.svg` | **HIGH** |
| `components/ui/icons/chatIcon.png` | **HIGH** |
| `components/ui/icons/connectButtonOff.svg` | **HIGH** |
| `components/ui/icons/connectButtonOn.svg` | **HIGH** |
| `components/ui/icons/left side.svg` | **HIGH** |
| `components/ui/icons/right side.svg` | **HIGH** |
| `components/ui/icons/button=False.png` | **HIGH** |
| `components/ui/icons/button=True.png` | **HIGH** |
| `components/ui/icons/Toggle=false.png` | **HIGH** |
| `components/ui/icons/Toggle=true.png` | **HIGH** |
| `components/ui/icons/ConnectButton.png` | **HIGH** |
| `components/ui/icons/ConnectButtonHover.png` | **HIGH** |
| `components/ui/icons/Thumbs up.png` | **HIGH** |
| `components/ui/icons/onchainbadge.png` | **HIGH** |
| `components/ui/icons/network.png` | **HIGH** |

---

## 2. Exports morts dans les barrels

### 2.1 `~/lib/services/index.ts`

| Symbole | Confiance | Justification |
|---|---|---|
| `getWalletAddress` (UserSessionManager) | **HIGH** | Aucun consommateur externe (cf. §1). |
| `type PinnedAtomData` | **HIGH** | Re-exporté aussi depuis `useCreateAtom`. Aucun consommateur via le barrel `~/lib/services`. |
| `type CertifyResult` | **HIGH** | Aucun importeur externe. |
| `type GroupStats` | **HIGH** | Aucun importeur externe. |
| `type DiscoveryState` | **HIGH** | Aucun importeur externe. |
| `type CertificationsStoreState` | **HIGH** | Aucun importeur externe. |
| `type CartState` | **HIGH** | Aucun importeur externe. |
| `type UserTopicPosition` | **HIGH** | Importeurs vont chercher directement dans `TopicPositionsService`. |
| `type TopicPositionsState` | **HIGH** | Aucun importeur externe. |

### 2.2 `~/lib/database/index.ts`

| Symbole | Confiance | Justification |
|---|---|---|
| `type BookmarkListRecord` | **HIGH** | Aucun importeur externe. |
| `type BookmarkedTripletRecord` | **HIGH** | Aucun importeur externe. |
| `type PredicateChangeRecord` | **HIGH** | Importé en interne via `~types/database` directement. Aucun consommateur via le barrel `~/lib/database`. |
| `type SettingsRecord` | **HIGH** | Aucun importeur externe via le barrel. |

### 2.3 `~/lib/utils/index.ts`

| Symbole | Confiance | Justification |
|---|---|---|
| (aucun mort détecté) | — | Tous les exports de `lib/utils/index.ts` ont au moins un consommateur après les Lots A–G. |

### 2.4 `~/types/index.ts` — barrel mort entier

| Symbole | Confiance | Justification |
|---|---|---|
| `type Timestamp`, `type URL`, `type Duration`, `interface ExtensionContext`, `interface ExtensionError` | **HIGH** | Aucun importeur. Le barrel `~/types` n'est jamais utilisé (consommateurs importent toujours depuis `~types/<file>` direct). Le fichier entier `types/index.ts` peut être supprimé. |

### 2.5 `~/components/ui/index.ts` — barrel mort entier

| Symbole | Confiance | Justification |
|---|---|---|
| Tous (`Avatar`, `AccountStats`, `FollowButton`, `BookmarkButton`, `TrustAccountButton`, `SofiaLoader`, `FullScreenLoader`, `NavigationBar`, `SwitchButton`, `QuickActionButton`, `ProfileHeader`, `PageBlockchainCard`, `UserAtomStats`, `GroupBentoCard`, `GroupDetailView`, `CategoryCard`, `CategoryDetailView`, `StarBorder`, `WalletConnectionButton`, `IntentionBubbleSelector`) | **HIGH** | Aucun consommateur n'importe via `~/components/ui` ni via `../ui`. Tous les composants sont importés directement par fichier. Le barrel entier peut être supprimé. |

### 2.6 `~/components/charts/index.ts`

| Symbole | Confiance | Justification |
|---|---|---|
| `BondingCurveChart` (re-export) | **MEDIUM** | Importé directement depuis `../../charts/BondingCurveChart` par `HistoryTab.tsx`. Le barrel n'est jamais utilisé. |

### 2.7 `~/components/pages/profile-tabs/follow/index.ts` — cassé + mort

| Symbole | Confiance | Justification |
|---|---|---|
| `FollowAccountCard` (re-export) | **HIGH** | Le fichier `FollowAccountCard.tsx` a été supprimé en Lot E — ce re-export est cassé (compile failure si jamais le barrel est utilisé). |
| Tous les autres exports (`FollowersPanel`, `FollowingPanel`, `TrustCirclePanel`, `FollowSearchBox`) | **HIGH** | Le barrel n'est jamais importé (`CommunityTab.tsx` importe directement depuis `./follow/<file>`). De plus `ExplorerPanel` n'est PAS exporté par le barrel — incohérence. Le fichier `follow/index.ts` peut être supprimé entièrement. |

### 2.8 `~/components/layout/background/index.ts`

| Symbole | Confiance | Justification |
|---|---|---|
| (re-export `Background`) | **LOW** | `AppLayout.tsx` importe `import Background from './background'` — résolu via `index.ts` ; donc le barrel est utilisé. ✓ vivant. |

---

## 3. Imports inutilisés (TS6133)

Le sandbox refuse `bun tsc --noEmit`. Détection manuelle des plus probables :

| Fichier | Symbole | Confiance |
|---|---|---|
| `/home/chauche/Sofia/apps/extension/hooks/useTrustCircle.ts` | `AtomDataResponse` (ligne 8) — importé mais jamais référencé | **HIGH** |
| `/home/chauche/Sofia/apps/extension/hooks/useFollowing.ts` | `AtomDataResponse` (ligne 8) — importé mais jamais référencé | **HIGH** |
| `/home/chauche/Sofia/apps/extension/hooks/useFollowers.ts` | `AtomDataResponse` (ligne 8) — importé mais jamais référencé | **HIGH** |

Limitation : impossible d'exécuter `tsc --noEmit` dans le sandbox actuel pour énumérer le reste des TS6133.

---

## 4. Dépendances npm orphelines

`package.json` contient 16 deps + 11 devDeps. Audit :

| Dep | Statut | Notes |
|---|---|---|
| `@0xsofia/design-system` | ✓ vivant | DS, consommé partout |
| `@0xsofia/graphql` | ✓ vivant | Hooks codegen |
| `@dicebear/collection` | ✓ vivant | `lib/utils/avatar.ts` |
| `@dicebear/core` | ✓ vivant | `lib/utils/avatar.ts` |
| `@plasmohq/storage` | ✓ vivant | `contents/tracking.ts` |
| `@tanstack/query-async-storage-persister` | ✓ vivant | `lib/providers/queryClient.ts` |
| `@tanstack/react-query` | ✓ vivant | omniprésent |
| `@tanstack/react-query-persist-client` | ✓ vivant | `background/realtime.ts`, `lib/providers/queryProvider.tsx` |
| `graphql` | ✓ vivant | dépendance peer |
| `lucide-react` | ✓ vivant | `BottomNavigation.tsx`, `CartDrawer.tsx` |
| `mipd` | ✓ vivant | `contents/walletBridge.ts` |
| `plasmo` | ✓ vivant | bundler |
| `react`, `react-dom` | ✓ vivant | base |
| `viem` | ✓ vivant | omniprésent |
| `wagmi` | ✓ vivant | `lib/config/wagmi.ts`, providers |

**Aucune dépendance npm orpheline détectée** (tailwind retiré en Lot E).

---

## 5. CSS mort

Sur 43 fichiers `components/styles/*.css`, tous ont au moins un import `.tsx/.ts` sauf :

| Fichier CSS | Confiance | Justification |
|---|---|---|
| `components/styles/CommunityTrustBar.css` | **HIGH** | Importé uniquement par `CommunityTrustBar.tsx` qui est mort (cf. §1). |

**Whitelist dynamique appliquée** (préfixes `intention-pill--`, `bento-`, `avatar-`, `badge-`, `podium-`, `position-board--`, `item-pill--`, `item-tier--`, `batch-reward__item-tier--`, `cart-drawer__item-pill--`) — ces classes générées dynamiquement ne sont pas considérées mortes.

**DS classes** (`fc-verb-tag`, `pf-platform-card`, `pf-echoes-sort`, `pf-sort-btn`, etc.) consommées via `@0xsofia/design-system` package — toujours vivantes.

Pas d'audit fin par règle CSS effectué — Lot D a coupé 516 règles, le résiduel par règle est probablement <5 % et hors scope d'un audit fichier-par-fichier.

---

## 6. IndexedDB stores morts

Lot C (DB v9→v10) a déjà retiré 5 stores morts. Vérification post-G :

| Store dans `STORES` | Status |
|---|---|
| `TRIPLETS_DATA` | ✓ vivant (TripletsDataService, agentRouter) |
| `USER_SETTINGS` | ✓ vivant (UserSettingsService) |
| `BOOKMARK_LISTS` | ✓ vivant (BookmarkService) |
| `BOOKMARKED_TRIPLETS` | ✓ vivant (BookmarkService) |
| `INTENTION_GROUPS` | ✓ vivant (IntentionGroupsService) |
| `RECOMMENDATIONS` | ✓ vivant (StorageRecommendation, via `SettingsPage.tsx` clear) |
| `CART_ITEMS` | ✓ vivant (CartDataService) |

**Aucun store mort.** ✓

---

## 7. Chrome message types morts

`types/messages.ts` `MessageType` union. Pour chaque : (a) handler dans `background/messageHandlers.ts` OU `contents/*.ts` ET (b) sender.

### 7.1 Messages avec handler MAIS sans sender (handler orphelin)

| MessageType | Handler | Sender | Confiance | Justification |
|---|---|---|---|---|
| `SCROLL_DATA` | `messageHandlers.ts:213` (no-op) | aucun | **HIGH** | `PageDataService.handleScrollData` est explicitement no-op (« scroll tracking removed »). Aucun envoi de SCROLL_DATA dans le code. |
| `TRIPLETS_DELETED` | `messageHandlers.ts:308` | aucun | **HIGH** | Handler appelle `badgeService.handleBadgeUpdate`. Aucun sender. |
| `UPDATE_ECHO_BADGE` | `messageHandlers.ts:300` | aucun | **HIGH** | Mention dans un commentaire `indexedDB-methods.ts:57` mais pas d'envoi réel. |
| `GET_USER_XP` | `messageHandlers.ts:375` | aucun | **HIGH** | Aucun sender — orphelin. |
| `GET_LEVEL_UP_COST` | `messageHandlers.ts:462` | aucun | **HIGH** | Aucun sender — orphelin. |

### 7.2 Messages avec sender MAIS sans handler

Aucun détecté.

### 7.3 Messages externes (LOW alive — externally_connectable)

| MessageType | Confiance | Notes |
|---|---|---|
| `WALLET_CONNECTED` | LOW alive | Envoyé par landing page externe via `chrome.runtime.sendMessageExternal` (manifest `externally_connectable.matches: doc.sofia.intuition.box, localhost:3000`). Handler `messageHandlers.ts:94` géré dans `onMessageExternal`. |
| `WALLET_DISCONNECTED` | LOW alive | Idem (`messageHandlers.ts:127`). |
| `FIRST_CLAIM` | LOW alive | Externe (manifest), handler `messageHandlers.ts:169`. |
| `DEEP_LINK_PROFILE` | LOW alive | Envoyé par `contents/shareRedirect.ts:18`, traité dans `messageHandlers.ts:553`. |
| `SEND_CHATBOT_MESSAGE` | LOW alive | Externe + interne. Handler `messageHandlers.ts:218`. |

### 7.4 Messages OAuth (`background/oauth/core/MessageHandler.ts`)

| MessageType (enum interne) | Sender interne | Confiance |
|---|---|---|
| `OAUTH_CONNECT` | `SocialsTab.tsx:74` | ✓ vivant |
| `OAUTH_CALLBACK` | aucun (chrome.runtime callback) | LOW alive (peut venir de la redirect page externe) |
| `OAUTH_IMPLICIT_CALLBACK` | aucun | LOW alive |
| `OAUTH_SYNC` | aucun | MEDIUM (probablement utilisé par un agent externe ou dead) |
| `OAUTH_GET_SYNC_INFO` | aucun | MEDIUM |
| `OAUTH_RESET_SYNC` | aucun | MEDIUM |
| `OAUTH_TOKEN_SUCCESS` / `TWITTER_OAUTH_SUCCESS` | landing page externe | LOW alive (handler `messageHandlers.ts:139`) |

### 7.5 Messages utilisés (vivants)

`GET_TAB_ID`, `PAGE_DATA`, `PAGE_DURATION`, `FETCH_BOOKMARKS`, `IMPORT_SELECTED_BOOKMARKS`, `INITIALIZE_BADGE`, `TRIPLET_PUBLISHED`, `GET_PAGE_DATA`, `GET_CLEAN_URL`, `URL_CHANGED`, `GENERATE_RECOMMENDATIONS` (sender mort en cascade — voir §1), `GET_INTENTION_GROUPS`, `GET_GROUP_DETAILS`, `CERTIFY_URL`, `REMOVE_URL_FROM_GROUP`, `DELETE_GROUP`, `UPDATE_GROUP_LEVEL`, `LEVEL_UP_GROUP`, `PREVIEW_LEVEL_UP`, `TRACK_URL`, `WALLET_REQUEST`, `WALLET_EVENT`, `BROWSING_NUDGE`, `NUDGE_DISMISSED`.

**Note : `GENERATE_RECOMMENDATIONS`** — sender (`RecommendationService.generateWithAgent`) appelé seulement par `useRecommendations` qui est mort (§1). À retirer en cascade.

---

## 8. Predicates morts

`lib/config/predicateConstants.ts` — vérification de chaque export :

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

**Aucun export mort.** `OAUTH_PREDICATE_IDS` privatisé en Lot G. ✓

---

## 9. Hooks/services dupliqués

| Doublon | Confiance | Action |
|---|---|---|
| `INTENTION_PREDICATE_IDS` re-défini dans `lib/realtime/derivations.ts:115` (Set) — doublon avec l'array exporté par `predicateConstants.ts` | **HIGH** | Importer `INTENTION_PREDICATE_IDS` depuis `~/lib/config/predicateConstants` et le wrapper en `new Set(...)` localement. |
| `OAUTH_PREDICATE_IDS` re-défini dans `derivations.ts:107` (Set local) — privatisé en Lot G dans `predicateConstants.ts` (ré-introduit ici) | **MEDIUM** | Reconsidérer : soit ré-exporter depuis predicateConstants soit garder local et nettoyer le commentaire. |
| `getWalletAddress` re-défini dans 4 endroits : `background/index.ts:11`, `lib/services/UserSessionManager.ts:52`, `oauth/core/TokenManager.ts:18`, `oauth/core/SyncManager.ts:14`, `lib/services/QuestTrackingService.ts:25` | **MEDIUM** | Centraliser. La version dans `UserSessionManager.ts` peut être supprimée (mort, §1). Les autres dupliquent la même logique `chrome.storage.session.get('walletAddress')`. |

---

## 10. Code OAuth/Privy mort

| Méthode/symbole | Status |
|---|---|
| `OAuthService.initiateOAuth` | ✓ vivant (sender `OAUTH_CONNECT`) |
| `OAuthService.handleCallback` | LOW alive (sender externe) |
| `OAuthService.handleImplicitCallback` | LOW alive (sender externe) |
| `OAuthService.handleExternalOAuthToken` | ✓ vivant (`messageHandlers.ts:151`) |
| `OAuthService.syncPlatformData` | LOW alive (auth callback) |
| `OAuthService.getSyncStatus` | MEDIUM (sender `OAUTH_GET_SYNC_INFO` jamais émis dans le code) |
| `OAuthService.resetSyncInfo` | MEDIUM (sender `OAUTH_RESET_SYNC` jamais émis) |
| `TWITTER_FETCH_PROFILE_ENABLED` flag (`oauth/index.ts:14`) | **HIGH** dead-flag — toujours `false`, branche `&& !TWITTER_FETCH_PROFILE_ENABLED` toujours `true`. Soit on retire le flag, soit on l'expose (env var). |
| `OAuthFlow` enum (`oauth/types/interfaces.ts:3`) | ✓ vivant |
| `UserToken`, `SyncInfo`, `TripletRule`, `UserData` | ✓ vivants en interne |

Hooks OAuth-side :

| Hook | Status |
|---|---|
| `useSocialVerifier` | ✓ vivant (`ProfilePage.tsx`) |
| `useDiscordProfile` | ✓ vivant (`ProfilePage.tsx`) |

---

## 11. Composants React morts

| Composant | Confiance | Justification |
|---|---|---|
| `AccountStats` (`components/ui/AccountStats.tsx`) | **HIGH** | Jamais rendu `<AccountStats>` ; seul le hook `useAccountStats` est consommé. Cf. §1. |
| `CommunityTrustBar` (`components/ui/blockchain/CommunityTrustBar.tsx`) | **HIGH** | Jamais rendu ni importé. Cf. §1. |
| `Skeleton.tsx` `default` export | **HIGH** | Pas d'export default réel dans le fichier. Composants nommés (`SkeletonLine`, `SkeletonCircle`, `PageBlockchainSkeleton`) vivants via `PageBlockchainCard.tsx`. |

---

## 12. Code legacy / @deprecated / TODO-remove

| Localisation | Confiance | Justification |
|---|---|---|
| `lib/services/walletProvider.ts:208` `selectProviderByAddress` `@deprecated` | **LOW alive** | Toujours utilisé en fallback dans `useWalletFromStorage.ts:67` lorsque `walletType` n'est pas connu. Conserver tant que la migration vers walletType n'est pas garantie pour 100 % des utilisateurs. |
| `contents/walletBridge.ts:142` `@deprecated` annotation | LOW alive | Référence interne au handler `wallet_selectProviderByAddress` côté content script — vivant tant que le hook l'appelle. |
| `lib/services/CurrencyMigrationService.ts` (commentaire « This entire file can be removed once all users have migrated (~4 weeks) ») | **MEDIUM** | À évaluer : si les ~20-40 utilisateurs ont migré (la migration est idempotente et a tourné), tout le fichier peut être supprimé. Action différée — vérifier la date de déploiement initial (4+ semaines ?). |
| `types/messages.ts:91` `Message = SofiaMessage` legacy alias | **MEDIUM** | `Message` (alias) est utilisé par `indexedDB-methods.ts:8` (`storeMessage`). `SofiaMessage` (la base) n'est PAS utilisé directement — seul l'alias l'est. Alias utile mais le type de base peut être inliné. |
| `lib/realtime/derivations.ts:54-65` legacy keys `topicPositionsMap`, `categoryPositionsMap`, `platformPositionsMap`, `verifiedPlatforms` | **HIGH** | Le commentaire explicite : « Legacy Explorer keys — kept for SubscriptionManager compat. Sofia doesn't map topics/categories/platforms the same way; may be removed ». Ces clés sont écrites par `SubscriptionManager` mais aucun consumer (useQuery) ne les lit. Write-only — à supprimer (et nettoyer SubscriptionManager.ts:288, 310, 316, 324). |
| `oauth/index.ts:14` `TWITTER_FETCH_PROFILE_ENABLED = false` | **HIGH** | Flag toujours faux, branche morte. À retirer ou rendre configurable. |

---

## 13. GraphQL ops importées non câblées

Toutes les ops `@0xsofia/graphql` importées (24 hooks/types/documents) sont câblées :

| Op | Consumer |
|---|---|
| `useGetMyTrustCircleQuery.fetcher` | useTrustCircle |
| `useGetAtomDataByLabelsQuery.fetcher` | useTrustCircle, useFollowing, useFollowers |
| `usePinThingMutation` | useCreateAtom |
| `useGetTripleBondingCurveDataQuery` | useBondingCurveData |
| `useGetFollowingPositionsQuery.fetcher` | useFollowing |
| `useGetAccountAtomByWalletQuery.fetcher` | useFollowers |
| `useGetMyFollowersQuery.fetcher` | useFollowers |
| `useGetTopSofiaAccountsQuery` | ExplorerPanel |
| `CheckSocialLinksDocument` | useSocialVerifier |
| `CertificationTriplesDocument` | usePageDiscovery |
| `PageCertificationDataDocument` | useBatchRewards |
| `GetUserIntentionPositionsDocument` | useOnChainIntentionGroups |
| `GetTrendingByPredicateDocument` | useTrendingCertifications |
| `UserAllCertificationsDocument` | UserCertificationsService |
| `WatchUserPositionsSubscription` (type) | derivations.ts |
| Documents pour `QuestProgressService`, `QuestBadgeService`, `useStreakLeaderboard`, `useDebateClaims`, `useUserDiscoveryScore`, `DiscoveryScoreService`, `SubscriptionManager`, `useOnChainStreak` | tous câblés |

**Aucune op orpheline.** ✓

---

## 14. Doublons hook ↔ service

| Doublon | Confiance | Notes |
|---|---|---|
| `useRecommendations` (mort §1) duplique partiellement `RecommendationService.generateRecommendations` qui appelle `messageBus → background → RecommendationAgent` | **HIGH** | Hook mort. Si on conserve le service pour `clearCache`, on peut purger les méthodes `generateRecommendations` et `generateWithAgent` du service. |

Aucun autre doublon hook ↔ service détecté post-G.

---

## Annexes — Types morts in-file

Liste des types exportés mais sans aucun consommateur externe au fichier (résiduel post Lot E) :

| Fichier | Type mort | Confiance |
|---|---|---|
| `types/blockchain.ts` | `interface AtomCheckResult` | **LOW** (utilisé seulement comme retour de `BlockchainService.checkAtomExists` interne) |
| `types/blockchain.ts` | `interface TripleCheckResult` | **LOW** (idem) |
| `types/blockchain.ts` | `interface BlockchainResult` (base) | **LOW** (étendu par d'autres types — peut être inliné mais non urgent) |
| `types/storage.ts` | `interface StorageData` | **HIGH** |
| `types/storage.ts` | `interface CacheData` | **HIGH** |
| `types/storage.ts` | `type StorageKey` | **HIGH** |
| `types/storage.ts` | `interface StorageChangeEvent` | **HIGH** |
| `types/storage.ts` | `interface StorageOptions` | **HIGH** |
| `types/history.ts` | `interface DOMData` | **HIGH** |
| `types/history.ts` | `interface SessionData` | **HIGH** |
| `types/history.ts` | `interface PageMetrics` | **HIGH** |
| `types/history.ts` | `interface CompleteVisitData` | **MEDIUM** (référencé dans storage.ts mort) |
| `types/history.ts` | `interface SimplifiedHistoryEntry` | **MEDIUM** (idem) |
| `types/follows.ts` | `interface AtomDataResponse` | **HIGH** (importé par 3 fichiers mais jamais référencé — TS6133, cf. §3) |
| `types/discovery.ts` | (rien) — tout vivant | — |
| `types/messages.ts` | `interface SofiaMessage` | **MEDIUM** (seul l'alias `Message` est utilisé) |
| `types/page.ts` | `type PageDataStatus` | **LOW** (utilisé seulement à l'intérieur de page.ts via `PageBlockchainState.status`) |
| `types/interests.ts` | `const TIER_COLORS` | **HIGH** (utilisé seulement par les helpers internes du même fichier) |
| `types/interests.ts` | `interface TierBadge` | **HIGH** (idem) |
| `types/questTypes.ts` | `type SocialPlatform` | **LOW** (utilisé seulement par `Quest.platform` interne) |
| `lib/clients/graphql-client.ts` | `INTUITION_GRAPHQL_ENDPOINT` | **HIGH** (export jamais consommé) |
| `lib/utils/ipfsCache.ts` | `fetchIPFSMetadata`, `clearIPFSCache`, `getIPFSCacheSize` | **HIGH** (jamais appelés — seul `batchFetchIPFS` consommé) |
| `config.ts` | `SOFIA_SERVER_URL` | **HIGH** (jamais importé — seul `MASTRA_API_URL` consommé) |

---

## Synthèse & quick wins

### Volumétrie par catégorie

| Catégorie | Entrées (HIGH+MEDIUM) |
|---|---|
| 1. Fichiers entiers morts | 7 .ts/.tsx + 15 assets icônes/SVG = **22** |
| 2. Exports morts dans les barrels | 9 (services) + 4 (database) + 5 (types/index) + 19 (components/ui — barrel entier) + 1 (charts) + 5 (follow barrel) = **43** |
| 3. Imports inutilisés | 3 (limité au sandbox) |
| 4. Deps npm orphelines | 0 |
| 5. CSS mort (fichiers) | 1 |
| 6. IndexedDB stores morts | 0 |
| 7. Chrome message types morts | 5 (handler orphelin) |
| 8. Predicates morts | 0 |
| 9. Hooks/services dupliqués | 3 |
| 10. OAuth mort | 1 flag + 3 méthodes MEDIUM |
| 11. Composants React morts | 3 |
| 12. Code legacy / @deprecated / TODO-remove | 6 |
| 13. GraphQL ops orphelines | 0 |
| 14. Doublons hook ↔ service | 1 |
| **Annexes (types in-file morts)** | **22** |
| **TOTAL HIGH+MEDIUM** | **~110 entrées** |

### Top quick wins (HIGH only)

1. **Supprimer `lib/services/UserSessionManager.ts`** — fichier entier mort. Retirer aussi le re-export `getWalletAddress` de `lib/services/index.ts`.
2. **Supprimer `background/tripletProcessor.ts`** — fichier entier mort.
3. **Supprimer `components/ui/AccountStats.tsx` + entrée barrel ligne 7** — composant jamais rendu.
4. **Supprimer `components/ui/blockchain/CommunityTrustBar.tsx` + `components/styles/CommunityTrustBar.css`** — duo orphelin.
5. **Supprimer `hooks/useRecommendations.ts`** — hook orphelin. Retirer en cascade : `RecommendationService.generateRecommendations`, `RecommendationService.generateWithAgent`, message `GENERATE_RECOMMENDATIONS` (handler+sender), `agentRouter.sendRecommendationRequest`. Conserver `RecommendationService.clearCache` (utilisé par SettingsPage).
6. **Supprimer le barrel `components/ui/index.ts`** — entièrement non importé. Tous les consommateurs vont en direct.
7. **Supprimer le barrel `components/pages/profile-tabs/follow/index.ts`** — non importé ET cassé (référence `FollowAccountCard` supprimé en Lot E).
8. **Supprimer le barrel `types/index.ts`** — entièrement non importé.
9. **Retirer 5 message types morts** (`SCROLL_DATA`, `TRIPLETS_DELETED`, `UPDATE_ECHO_BADGE`, `GET_USER_XP`, `GET_LEVEL_UP_COST`) du `MessageType` union + leurs `case` dans `messageHandlers.ts`.
10. **Centraliser `getWalletAddress`** — supprimer 4 redéfinitions, garder une seule source (par exemple dans `background/utils/`).
11. **Retirer `lib/clients/graphql-client.ts:9 INTUITION_GRAPHQL_ENDPOINT`**, `config.ts:19 SOFIA_SERVER_URL`, `lib/utils/ipfsCache.ts` (`fetchIPFSMetadata`, `clearIPFSCache`, `getIPFSCacheSize`).
12. **Retirer 8 types morts dans `types/storage.ts` et `types/history.ts`** (StorageData, CacheData, StorageKey, StorageChangeEvent, StorageOptions, DOMData, SessionData, PageMetrics).
13. **Retirer `TIER_COLORS` + `TierBadge`** dans `types/interests.ts` (usage interne uniquement).
14. **Retirer 4 legacy realtime keys** (`topicPositionsMap`, `categoryPositionsMap`, `platformPositionsMap`, `verifiedPlatforms`) dans `derivations.ts` ET les 4 sites d'écriture dans `SubscriptionManager.ts`.
15. **Retirer le flag `TWITTER_FETCH_PROFILE_ENABLED`** dans `oauth/index.ts:14` (toujours `false`).
16. **Importer `INTENTION_PREDICATE_IDS` depuis `predicateConstants`** au lieu de le re-définir dans `derivations.ts:115`.
17. **Nettoyer 3 imports inutilisés `AtomDataResponse`** dans `useTrustCircle.ts`, `useFollowing.ts`, `useFollowers.ts`.
18. **Supprimer 9 ré-exports types dans `lib/services/index.ts`** (PinnedAtomData, CertifyResult, GroupStats, DiscoveryState, CertificationsStoreState, CartState, UserTopicPosition, TopicPositionsState, getWalletAddress).
19. **Supprimer 4 ré-exports types dans `lib/database/index.ts`** (BookmarkListRecord, BookmarkedTripletRecord, PredicateChangeRecord, SettingsRecord).
20. **Supprimer 15 SVG/PNG icônes** dans `components/ui/icons/`.

### Edits ciblés (file:line → action)

- `/home/chauche/Sofia/apps/extension/lib/services/index.ts:9` → supprimer `export type { PinnedAtomData }`
- `/home/chauche/Sofia/apps/extension/lib/services/index.ts:24` → supprimer `CertifyResult, GroupStats` (garder `CertificationType`)
- `/home/chauche/Sofia/apps/extension/lib/services/index.ts:45` → supprimer `export { getWalletAddress }`
- `/home/chauche/Sofia/apps/extension/lib/services/index.ts:49` → supprimer `export type { DiscoveryState }`
- `/home/chauche/Sofia/apps/extension/lib/services/index.ts:51` → supprimer `CertificationsStoreState` du re-export (garder TripleDetail, CertificationEntry)
- `/home/chauche/Sofia/apps/extension/lib/services/index.ts:59` → supprimer `export type { CartState }`
- `/home/chauche/Sofia/apps/extension/lib/services/index.ts:63` → supprimer `export type { UserTopicPosition, TopicPositionsState }`
- `/home/chauche/Sofia/apps/extension/lib/database/index.ts:10-15` → ne garder que `TripletsRecord, IntentionGroupRecord, GroupUrlRecord, CartItemRecord` (4 sur 8)
- `/home/chauche/Sofia/apps/extension/components/ui/index.ts` → supprimer le fichier (barrel mort)
- `/home/chauche/Sofia/apps/extension/components/pages/profile-tabs/follow/index.ts` → supprimer le fichier (barrel mort + cassé)
- `/home/chauche/Sofia/apps/extension/types/index.ts` → supprimer le fichier (barrel mort)
- `/home/chauche/Sofia/apps/extension/types/messages.ts:11,15,17,28,33` → retirer les 5 MessageTypes morts + handlers correspondants dans `messageHandlers.ts`
- `/home/chauche/Sofia/apps/extension/lib/realtime/derivations.ts:54-65,107-122` → retirer 4 legacy keys + redéfinitions doublons; importer `INTENTION_PREDICATE_IDS` du config
- `/home/chauche/Sofia/apps/extension/lib/realtime/SubscriptionManager.ts:288,310,316,324` → retirer les écritures dans les legacy keys
- `/home/chauche/Sofia/apps/extension/background/oauth/index.ts:14` → retirer `TWITTER_FETCH_PROFILE_ENABLED`
- `/home/chauche/Sofia/apps/extension/types/storage.ts:9-53` → retirer 5 types morts (StorageData, CacheData, StorageKey, StorageChangeEvent, StorageOptions)
- `/home/chauche/Sofia/apps/extension/types/history.ts:7-39,63-74` → retirer 3 types morts (DOMData, SessionData, PageMetrics)
- `/home/chauche/Sofia/apps/extension/types/interests.ts:9-20,23-28` → retirer TIER_COLORS + TierBadge
- `/home/chauche/Sofia/apps/extension/lib/clients/graphql-client.ts:9` → retirer `INTUITION_GRAPHQL_ENDPOINT`
- `/home/chauche/Sofia/apps/extension/config.ts:19,25` → retirer `SOFIA_SERVER_URL`
- `/home/chauche/Sofia/apps/extension/lib/utils/ipfsCache.ts:93-112` → retirer 3 fonctions mortes
- `/home/chauche/Sofia/apps/extension/hooks/useTrustCircle.ts:8`, `useFollowing.ts:8`, `useFollowers.ts:8` → retirer `AtomDataResponse` de l'import

### Limitations

- **`bun tsc --noEmit` bloqué par sandbox** : pas d'énumération exhaustive des TS6133. Les 3 imports détectés en §3 sont ceux trouvés à la lecture manuelle.
- **CSS par-règle** : un audit fichier-par-fichier (43 fichiers) est dans le scope, mais l'audit règle-par-règle (selectors morts à l'intérieur d'un fichier vivant) n'est pas effectué — Lot D a déjà coupé 516 règles en avril 2026, le résiduel est probablement <5 % par fichier vivant.
- **Messages OAuth** : `OAUTH_CALLBACK`, `OAUTH_IMPLICIT_CALLBACK`, `OAUTH_SYNC`, `OAUTH_GET_SYNC_INFO`, `OAUTH_RESET_SYNC` n'ont aucun sender visible dans la codebase ; classés MEDIUM/LOW car ils peuvent être émis par la landing page externe (non versionnée ici) ou par un mécanisme automatique non encore identifié. Audit en équipe nécessaire pour décider de les retirer.
- **`CurrencyMigrationService.ts`** : commentaire explicite « can be removed once all users have migrated (~4 weeks) ». Le déploiement initial date d'il y a >4 semaines (?) — vérification déploiement requise avant suppression.
- **`selectProviderByAddress` `@deprecated`** : conservé volontairement comme fallback ; l'audit ne préconise PAS sa suppression sans une garantie de migration walletType à 100 %.
